"""
Stream Proxy Service
Handles RTSP -> HLS proxy URL generation and credential masking.
"""
import os
from urllib.parse import urlparse, urlunparse

HLS_GATEWAY_BASE_URL = os.getenv("HLS_GATEWAY_BASE_URL", "http://localhost:9000")

class StreamProxyService:
    @staticmethod
    def generate_proxy_url(camera_id: str) -> str:
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
        if lower.endswith(".m3u8"):
            return StreamProxyService.sanitize_stream_url(stream_url)
        return StreamProxyService.generate_proxy_url(camera_id)
