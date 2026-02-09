"""
Stream Proxy Service
Handles RTSP -> HLS proxy URL generation and credential masking.
When USE_HLS_VIA_BACKEND_PROXY is true, RTSP streams are served via the backend proxy
so the frontend loads same-origin and CORS is avoided.
"""
import os
from urllib.parse import urlparse, urlunparse

HLS_GATEWAY_BASE_URL = os.getenv("HLS_GATEWAY_BASE_URL", "http://localhost:9000")
USE_HLS_VIA_BACKEND_PROXY = os.getenv("USE_HLS_VIA_BACKEND_PROXY", "true").lower() in ("1", "true", "yes")

# Path the frontend can use for HLS (relative to site origin; backend proxies to gateway)
HLS_PROXY_PATH_TEMPLATE = "/api/security-operations/cameras/{camera_id}/hls/index.m3u8"


class StreamProxyService:
    @staticmethod
    def generate_proxy_url(camera_id: str) -> str:
        if USE_HLS_VIA_BACKEND_PROXY:
            return HLS_PROXY_PATH_TEMPLATE.format(camera_id=camera_id)
        return f"{HLS_GATEWAY_BASE_URL}/hls/{camera_id}/index.m3u8"

    @staticmethod
    def sanitize_stream_url(stream_url: str) -> str:
        if not stream_url:
            return stream_url
        parsed = urlparse(stream_url)
        if parsed.username or parsed.password:
            netloc = parsed.hostname or ""
            if parsed.port:
                netloc = f"{netloc}:{parsed.port}"
            return urlunparse((parsed.scheme, netloc, parsed.path, parsed.params, parsed.query, parsed.fragment))
        return stream_url

    @staticmethod
    def resolve_stream_url(stream_url: str, camera_id: str) -> str:
        if not stream_url:
            return StreamProxyService.generate_proxy_url(camera_id)
        lower = stream_url.lower()
        if lower.startswith("rtsp://"):
            return StreamProxyService.generate_proxy_url(camera_id)
        # When using backend proxy, if this URL is our HLS gateway, return proxy path so frontend avoids CORS
        if USE_HLS_VIA_BACKEND_PROXY:
            gateway_base = HLS_GATEWAY_BASE_URL.lower().rstrip("/")
            if lower.startswith(gateway_base + "/hls/"):
                return HLS_PROXY_PATH_TEMPLATE.format(camera_id=camera_id)
        if lower.endswith(".m3u8"):
            return StreamProxyService.sanitize_stream_url(stream_url)
        return StreamProxyService.generate_proxy_url(camera_id)
