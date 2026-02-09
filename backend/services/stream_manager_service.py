"""
Stream Manager Service
Starts FFmpeg on demand to convert RTSP -> HLS and serves from local disk,
so users don't need to run scripts. Requires FFmpeg installed on the server.
"""
import os
import subprocess
import shutil
import time
import logging
import threading
from pathlib import Path
from typing import Optional, Tuple
from urllib.parse import urlparse, urlunparse

from database import SessionLocal
from models import Camera

logger = logging.getLogger(__name__)

# Directory for HLS output (one subdir per camera_id)
HLS_STREAM_DIR = Path(os.getenv("HLS_STREAM_DIR", os.path.join(os.path.dirname(__file__), "..", "streams"))).resolve()
MANIFEST_WAIT_TIMEOUT = int(os.getenv("HLS_MANIFEST_WAIT_TIMEOUT", "20"))  # seconds to wait for index.m3u8
MANIFEST_POLL_INTERVAL = 0.3

_processes: dict[str, subprocess.Popen] = {}
_last_ffmpeg_exit: dict[str, float] = {}  # camera_id -> monotonic time of last exit (for restart backoff)
_lock = threading.Lock()

# After FFmpeg exits, wait this long before allowing restart (avoids restart storms when RTSP is flaky)
RESTART_BACKOFF_SECONDS = float(os.getenv("HLS_RESTART_BACKOFF_SECONDS", "3"))


def _get_camera_for_stream(camera_id: str) -> Optional[Camera]:
    """Get camera by id with source_stream_url and credentials (internal use)."""
    db = SessionLocal()
    try:
        return db.query(Camera).filter(Camera.camera_id == camera_id).first()
    finally:
        db.close()


def _build_rtsp_url(source_url: str, credentials: Optional[dict]) -> str:
    """Build RTSP URL with credentials if not already in URL."""
    if not source_url or not source_url.strip().lower().startswith("rtsp://"):
        return source_url or ""
    parsed = urlparse(source_url)
    if parsed.username or parsed.password:
        return source_url
    if not credentials or not isinstance(credentials, dict):
        return source_url
    user = credentials.get("username") or ""
    password = credentials.get("password") or ""
    if not user and not password:
        return source_url
    netloc = f"{user}:{password}@{parsed.hostname or ''}"
    if parsed.port:
        netloc += f":{parsed.port}"
    return urlunparse((parsed.scheme, netloc, parsed.path or "/", parsed.params, parsed.query, parsed.fragment))


def _is_rtsp(source_url: Optional[str]) -> bool:
    return bool(source_url and source_url.strip().lower().startswith("rtsp://"))


def _ffmpeg_available() -> bool:
    return shutil.which("ffmpeg") is not None


def _parse_ffmpeg_stderr(stderr_bytes: bytes) -> str:
    """Extract a short user-facing message from FFmpeg stderr (skip version banner, find real error)."""
    if not stderr_bytes:
        return "Camera or RTSP server unreachable. Check IP, port, and network."
    text = stderr_bytes.decode(errors="replace")
    # FFmpeg often prints version/config first, then the real error on later lines
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    # Prefer lines that look like errors (contain typical RTSP/connection keywords)
    for line in reversed(lines):
        line_lower = line.lower()
        if any(x in line_lower for x in (
            "error", "failed", "unable", "refused", "timed out", "timeout",
            "connection", "401", "404", "403", "unauthorized", "not found",
            "could not", "invalid", "no route to host", "network is unreachable",
            "operation not permitted", "permitted",
        )):
            # Keep message short for API response
            return line[:280] if len(line) > 280 else line
    # If no clear error line, return last non-empty line (often the actual error)
    for line in reversed(lines):
        if not line.startswith("configuration:") and "copyright" not in line.lower():
            return (line[:280] + "…") if len(line) > 280 else line
    return "Camera or RTSP server unreachable. Check IP, port, and network."


def _get_manifest_path(camera_id: str) -> Path:
    return HLS_STREAM_DIR / camera_id / "index.m3u8"


def _get_stream_file_path(camera_id: str, path: str) -> Optional[Path]:
    """Resolve path to a file under camera's stream dir. Returns None if path is invalid (e.g. traversal)."""
    path = path.strip().lstrip("/")
    if ".." in path or path.startswith("/") or "\\" in path:
        return None
    return (HLS_STREAM_DIR / camera_id / path).resolve()


def _path_under_base(resolved: Path, base: Path) -> bool:
    try:
        resolved.relative_to(base)
        return True
    except ValueError:
        return False


# If manifest was updated within this many seconds, treat stream as already running (avoids double-start with multiple workers).
MANIFEST_RECENT_SECONDS = 45


def ensure_stream_running(
    camera_id: str,
    source_stream_url: Optional[str] = None,
    credentials: Optional[dict] = None,
    manifest_wait_timeout: Optional[int] = None,
) -> Tuple[bool, str]:
    """
    If the camera has an RTSP source_stream_url, start FFmpeg to produce HLS in HLS_STREAM_DIR/camera_id/.
    Returns (True, "") on success, (False, error_message) on failure.
    When source_stream_url (and optionally credentials) are provided, skips DB lookup.
    manifest_wait_timeout: if set, wait at most this many seconds for the manifest (default MANIFEST_WAIT_TIMEOUT).
    Use a shorter value (e.g. 8) when retrying after a missing segment to avoid blocking the request too long.
    """
    if not _ffmpeg_available():
        msg = "FFmpeg is not installed. Install FFmpeg (e.g. winget install ffmpeg) and restart the server."
        logger.warning("Stream %s: %s", camera_id, msg)
        return False, msg

    manifest_path = _get_manifest_path(camera_id)
    try:
        if manifest_path.exists():
            mtime = manifest_path.stat().st_mtime
            if (time.time() - mtime) <= MANIFEST_RECENT_SECONDS:
                return True, ""
    except OSError:
        pass

    if source_stream_url is None or not _is_rtsp(source_stream_url):
        camera = _get_camera_for_stream(camera_id)
        if not camera:
            return False, "Camera not found."
        if not _is_rtsp(camera.source_stream_url):
            return False, "Camera stream is not RTSP; use external HLS gateway or direct URL."
        source_stream_url = camera.source_stream_url
        credentials = camera.credentials if hasattr(camera, "credentials") else None

    rtsp_url = _build_rtsp_url(source_stream_url, credentials)
    if not rtsp_url:
        return False, "No RTSP URL configured for this camera."
    # Log URL with password redacted for debugging
    _parsed = urlparse(rtsp_url)
    _netloc = f"{_parsed.hostname or ''}:{_parsed.port or 554}" if (_parsed.hostname or _parsed.port) else _parsed.netloc
    _safe = urlunparse((_parsed.scheme, _netloc, _parsed.path or "/", _parsed.params, _parsed.query, _parsed.fragment))
    logger.info("Starting RTSP stream for camera %s: %s", camera_id, _safe)

    out_dir = HLS_STREAM_DIR / camera_id

    with _lock:
        proc = _processes.get(camera_id)
        if proc is not None and proc.poll() is None:
            if manifest_path.exists():
                return True, ""
            # Process running but no manifest yet - wait below
        else:
            if proc is not None:
                try:
                    proc.terminate()
                except Exception:
                    pass
                _processes.pop(camera_id, None)

            # Short backoff after a recent exit to avoid restart storms when RTSP is unreachable
            last_exit = _last_ffmpeg_exit.get(camera_id)
            if last_exit is not None and (time.monotonic() - last_exit) < RESTART_BACKOFF_SECONDS:
                time.sleep(RESTART_BACKOFF_SECONDS)
            _last_ffmpeg_exit.pop(camera_id, None)

            out_dir.mkdir(parents=True, exist_ok=True)
            output_path = out_dir / "index.m3u8"
            # Use relative path so Windows drive letter (e.g. C:) is never passed to FFmpeg (avoids "Option not found")
            output_path_arg = "index.m3u8"
            ffmpeg_exe = shutil.which("ffmpeg") or "ffmpeg"
            # Minimal options for broad FFmpeg build compatibility (no -stimeout/-reconnect; essentials build may omit them)
            # Slightly longer segments (2s) and larger playlist (5) for smoother playback and less chop.
            # -probesize / -analyzeduration help avoid "Operation not permitted" when opening RTSP on Windows.
            cmd = [
                ffmpeg_exe,
                "-fflags", "nobuffer",
                "-rtsp_transport", "tcp",
                "-probesize", "10M",
                "-analyzeduration", "10M",
                "-i", rtsp_url,
                "-vcodec", "copy",
                "-movflags", "frag_keyframe+empty_moov",
                "-an",
                "-hls_flags", "delete_segments+append_list",
                "-f", "hls",
                "-hls_time", "2",
                "-hls_list_size", "5",
                output_path_arg,
            ]
            try:
                # On Windows, CREATE_NO_WINDOW can cause "Operation not permitted" when FFmpeg opens RTSP.
                # Default 0 so FFmpeg runs without it (avoids "Operation not permitted"); set HLS_FFMPEG_NO_WINDOW=1 to hide the subprocess window.
                use_no_window = os.environ.get("HLS_FFMPEG_NO_WINDOW", "0") == "1"
                creationflags = getattr(subprocess, "CREATE_NO_WINDOW", 0) if (os.name == "nt" and use_no_window) else 0
                proc = subprocess.Popen(
                    cmd,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.PIPE,
                    cwd=str(out_dir),
                    creationflags=creationflags,
                )
                _processes[camera_id] = proc
            except Exception as e:
                logger.exception("Failed to start FFmpeg for camera %s: %s", camera_id, e)
                return False, f"Failed to start stream: {e}"

    # Wait for manifest to appear
    wait_timeout = manifest_wait_timeout if manifest_wait_timeout is not None else MANIFEST_WAIT_TIMEOUT
    deadline = time.monotonic() + wait_timeout
    while time.monotonic() < deadline:
        if manifest_path.exists():
            return True, ""
        with _lock:
            p = _processes.get(camera_id)
            if p and p.poll() is not None:
                err = (p.stderr and p.stderr.read()) or b""
                _processes.pop(camera_id, None)
                _last_ffmpeg_exit[camera_id] = time.monotonic()
                err_str_full = err.decode(errors="replace")
                logger.warning("FFmpeg exited for camera %s. stderr: %s", camera_id, err_str_full[:500] or "(none)")
                msg = _parse_ffmpeg_stderr(err)
                return False, msg
        time.sleep(MANIFEST_POLL_INTERVAL)

    # Timeout: capture FFmpeg stderr for diagnostics (then stop the process)
    err_snippet = ""
    with _lock:
        p = _processes.get(camera_id)
        err_bytes = b""
        if p:
            if p.poll() is not None:
                err_bytes = (p.stderr and p.stderr.read()) or b""
                _processes.pop(camera_id, None)
                _last_ffmpeg_exit[camera_id] = time.monotonic()
            else:
                try:
                    p.terminate()
                    time.sleep(0.5)
                    err_bytes = (p.stderr and p.stderr.read()) or b""
                except Exception:
                    pass
                _processes.pop(camera_id, None)
    if err_bytes:
        logger.warning("HLS stream timeout for camera %s. FFmpeg stderr: %s", camera_id, err_bytes.decode(errors="replace")[:500])
        return False, _parse_ffmpeg_stderr(err_bytes)
    return False, "Stream did not become ready in time. Check camera IP and RTSP URL."


def serve_stream_file(camera_id: str, path: str) -> Optional[Tuple[Path, str]]:
    """
    Get the local file path and media type for a stream segment/manifest.
    Returns (Path, media_type) or None if path is invalid or file doesn't exist.
    """
    file_path = _get_stream_file_path(camera_id, path)
    if file_path is None:
        return None
    base = (HLS_STREAM_DIR / camera_id).resolve()
    if not _path_under_base(file_path, base):
        return None
    if not file_path.exists() or not file_path.is_file():
        return None
    if path.endswith(".m3u8"):
        media_type = "application/vnd.apple.mpegurl"
    elif path.endswith(".ts"):
        media_type = "video/MP2T"
    else:
        media_type = "application/octet-stream"
    return (file_path, media_type)


def stop_stream(camera_id: str) -> None:
    """Stop FFmpeg for this camera if running."""
    with _lock:
        proc = _processes.pop(camera_id, None)
        if proc and proc.poll() is None:
            try:
                proc.terminate()
                proc.wait(timeout=5)
            except Exception:
                try:
                    proc.kill()
                except Exception:
                    pass


def is_rtsp_camera(camera_id: str, source_stream_url: Optional[str] = None) -> bool:
    """Return True if this camera has an RTSP source (so we can start FFmpeg on demand)."""
    if source_stream_url is not None:
        return _is_rtsp(source_stream_url)
    camera = _get_camera_for_stream(camera_id)
    return camera is not None and _is_rtsp(camera.source_stream_url)


def manifest_exists(camera_id: str) -> bool:
    """Return True if the HLS manifest file exists (for RTSP stream-status checks)."""
    try:
        return _get_manifest_path(camera_id).exists()
    except OSError:
        return False


# Singleton used by endpoints
class _StreamManager:
    ensure_stream_running = staticmethod(ensure_stream_running)
    serve_stream_file = staticmethod(serve_stream_file)
    stop_stream = staticmethod(stop_stream)
    is_rtsp_camera = staticmethod(is_rtsp_camera)
    manifest_exists = staticmethod(manifest_exists)


stream_manager = _StreamManager()
