import React, { useRef, useState, useEffect, useCallback } from 'react';
import Hls from 'hls.js';
import { cn } from '../../../utils/cn';
import { getBackendOrigin } from '../../../config/env';
import { VideoTimestampOverlay, TimestampPosition } from './VideoTimestampOverlay';

export const isHls = (url: string) => /\.m3u8(\?|$)/i.test(url);

/** Whether the stream URL should get the auth header: same-origin (dev proxy) or backend origin (direct to API). */
function shouldSendAuthForStreamUrl(url: string): boolean {
  if (url.startsWith('/')) return true;
  try {
    const u = new URL(url, window.location.origin);
    if (u.origin === window.location.origin) return true;
    return u.origin === getBackendOrigin();
  } catch {
    return false;
  }
}

interface HlsConfig {
  enableWorker: boolean;
  lowLatencyMode: boolean;
  maxBufferLength?: number;
  maxMaxBufferLength?: number;
  xhrSetup?: (xhr: XMLHttpRequest) => void;
}

/** Shape of Hls.js ERROR event data (fatal, response code, type). */
interface HlsErrorData {
  fatal?: boolean;
  type?: number;
  response?: { code?: number; status?: number };
}

function getHlsConfig(src: string): HlsConfig {
  const config: HlsConfig = {
    enableWorker: true,
    lowLatencyMode: true,
    maxBufferLength: 12,
    maxMaxBufferLength: 24,
  };
  if (shouldSendAuthForStreamUrl(src)) {
    config.xhrSetup = (xhr: XMLHttpRequest) => {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    };
  }
  return config;
}

export interface VideoStreamPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  errorClassName?: string;
  showTimestamp?: boolean;
  timestampPosition?: TimestampPosition;
  /** When true (default), use surveillance-style UI: no seek bar, LIVE badge, mute/fullscreen only. */
  liveMode?: boolean;
  /** When provided, shows a screenshot button on the live footer that calls this with the video element. */
  onScreenshot?: (video: HTMLVideoElement) => void;
  /** Shown in the error state so the user can copy it for the stream setup script. */
  cameraId?: string;
}

export const VideoStreamPlayer: React.FC<VideoStreamPlayerProps> = ({
  src,
  poster,
  className = 'w-full h-40 rounded-lg bg-slate-900',
  errorClassName = 'w-full h-40 rounded-lg bg-slate-900 flex items-center justify-center text-slate-400 text-sm border border-white/5',
  showTimestamp = true,
  timestampPosition = 'top-right',
  liveMode = true,
  onScreenshot,
  cameraId,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<InstanceType<typeof Hls> | null>(null);
  const [error, setError] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [muted, setMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelayRef = useRef(1000); // Start with 1 second
  const startLoadAttemptedRef = useRef(false); // try startLoad once per load before full reconnect

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = !video.muted;
      setMuted(video.muted);
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, []);

  /** 404/4xx mean the stream does not exist (e.g. FFmpeg not running); do not retry. */
  const isUnrecoverableHlsError = useCallback((data: HlsErrorData) => {
    const res = data.response;
    const code = typeof res?.code === 'number' ? res.code : res?.status;
    return typeof code === 'number' && code >= 400 && code < 500;
  }, []);

  /** 5xx or network error: can try startLoad() before full reload to reduce visible stop/start. */
  const isRetryableNetworkError = useCallback((data: HlsErrorData) => {
    const res = data.response;
    const code = typeof res?.code === 'number' ? res.code : res?.status;
    if (typeof code === 'number' && code >= 500) return true;
    return data.type === 2; // Hls.ErrorTypes.NETWORK_ERROR
  }, []);

  const attemptReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      setError(true);
      setReconnecting(false);
      return;
    }

    reconnectAttemptsRef.current++;
    setReconnecting(true);

    startLoadAttemptedRef.current = false; // reset for new instance

    setTimeout(() => {
      const video = videoRef.current;
      if (!video || !src) return;

      const useHls = isHls(src) && Hls.isSupported();
      
      if (useHls && hlsRef.current) {
        try {
          hlsRef.current.destroy();
        } catch (e) {
          // Ignore destroy errors
        }
        hlsRef.current = new Hls(getHlsConfig(src));
        hlsRef.current.on(Hls.Events.ERROR, (_event: string, data: unknown) => {
          const err = data as HlsErrorData;
          if (err.fatal && isUnrecoverableHlsError(err)) {
            setError(true);
            setReconnecting(false);
            return;
          }
          if (err.fatal && reconnectAttemptsRef.current < maxReconnectAttempts) {
            reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 2, 30000);
            attemptReconnect();
          } else if (err.fatal) {
            setError(true);
            setReconnecting(false);
          }
        });
        hlsRef.current.loadSource(src);
        hlsRef.current.attachMedia(video);
        setReconnecting(false);
        reconnectAttemptsRef.current = 0;
        reconnectDelayRef.current = 1000;
      } else if (!useHls) {
        video.src = src;
        setReconnecting(false);
        reconnectAttemptsRef.current = 0;
        reconnectDelayRef.current = 1000;
      }
    }, reconnectDelayRef.current);
  }, [src, isUnrecoverableHlsError]);

  useEffect(() => {
    setError(false);
    setReconnecting(false);
    reconnectAttemptsRef.current = 0;
    reconnectDelayRef.current = 1000;
    startLoadAttemptedRef.current = false;

    const video = videoRef.current;
    if (!video || !src) return;

    const useHls = isHls(src) && Hls.isSupported();
    if (useHls) {
      // HLS: let Hls.js own the video element; do not set video.src (browsers can't play m3u8 natively in Chrome)
      if (hlsRef.current) {
        try {
          hlsRef.current.destroy();
        } catch (e) {
          // Ignore destroy errors
        }
      }
      const hls = new Hls(getHlsConfig(src));
      hlsRef.current = hls;
      hls.on(Hls.Events.ERROR, (_event: string, data: unknown) => {
        const err = data as HlsErrorData;
        if (err.fatal && isUnrecoverableHlsError(err)) {
          setError(true);
          setReconnecting(false);
          return;
        }
        if (err.fatal && isRetryableNetworkError(err) && !startLoadAttemptedRef.current) {
          startLoadAttemptedRef.current = true;
          try {
            hls.startLoad();
          } catch {
            startLoadAttemptedRef.current = false;
            if (reconnectAttemptsRef.current < maxReconnectAttempts) {
              reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 2, 30000);
              attemptReconnect();
            } else {
              setError(true);
            }
          }
          return;
        }
        if (err.fatal && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 2, 30000);
          attemptReconnect();
        } else if (err.fatal) {
          setError(true);
        }
      });
      
      hls.loadSource(src);
      hls.attachMedia(video);
      
      return () => {
        try {
          hls.destroy();
        } catch (e) {
          // Ignore destroy errors
        }
        hlsRef.current = null;
      };
    }

    // Non-HLS: use native video src (e.g. direct MP4 or other browser-supported URL)
    const onErr = () => {
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 2, 30000);
        attemptReconnect();
      } else {
        setError(true);
      }
    };
    video.addEventListener('error', onErr);
    video.crossOrigin = 'anonymous';
    video.src = src;
    
    return () => {
      video.removeEventListener('error', onErr);
      video.src = '';
    };
  }, [src, attemptReconnect, retryKey, isUnrecoverableHlsError, isRetryableNetworkError]);

  // Keep muted state in sync with video element and listen for fullscreen changes
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = muted;
    }
  }, [muted]);

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const handleRetry = useCallback(() => {
    setError(false);
    reconnectAttemptsRef.current = 0;
    reconnectDelayRef.current = 1000;
    setRetryKey((k) => k + 1);
  }, []);

  const handleCopyCameraId = useCallback(() => {
    if (cameraId && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(cameraId);
    }
  }, [cameraId]);

  if (error && !reconnecting) {
    return (
      <div className={cn(errorClassName)}>
        <div className="text-center px-2">
          <i className="fas fa-exclamation-triangle text-red-400 text-2xl mb-2" />
          <p>Stream unavailable</p>
          <p className="text-[10px] text-slate-500 mt-1 max-w-[260px] mx-auto">The camera must be on the same network as the server and reachable at the RTSP URL. Check the backend window or Network tab (503 response) for the exact error. Ensure FFmpeg is installed on the server.</p>
          {cameraId && (
            <div className="mt-2 flex flex-col items-center gap-1">
              <span className="text-[10px] text-slate-400">Camera ID:</span>
              <div className="flex items-center gap-1">
                <code className="text-[10px] bg-black/30 px-2 py-1 rounded text-slate-300 font-mono">{cameraId}</code>
                <button
                  type="button"
                  onClick={handleCopyCameraId}
                  className="px-2 py-1 rounded text-[10px] font-semibold bg-slate-600 hover:bg-slate-500 text-white"
                >
                  Copy
                </button>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={handleRetry}
            className="mt-3 px-3 py-1.5 rounded text-xs font-semibold bg-slate-600 hover:bg-slate-500 text-white transition-colors"
          >
            Retry stream
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <video
        ref={videoRef}
        className={cn(className)}
        controls={!liveMode}
        muted={muted}
        poster={poster}
        crossOrigin="anonymous"
        playsInline
        autoPlay
        aria-label="Live camera feed"
      />
      {showTimestamp && !error && (
        <VideoTimestampOverlay position={timestampPosition} />
      )}
      {liveMode && !error && (
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-2 py-1.5 bg-black/75 z-10">
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-red-500">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" aria-hidden />
            Live
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleMute}
              className="p-1.5 rounded text-white/80 hover:bg-white/20 hover:text-white transition-colors"
              title={muted ? 'Unmute' : 'Mute'}
              aria-label={muted ? 'Unmute' : 'Mute'}
            >
              <i className={cn('fas text-sm', muted ? 'fa-volume-mute' : 'fa-volume-up')} />
            </button>
            {onScreenshot && (
              <button
                type="button"
                onClick={() => { const v = videoRef.current; if (v) onScreenshot(v); }}
                className="p-1.5 rounded text-white/80 hover:bg-white/20 hover:text-white transition-colors"
                title="Take screenshot"
                aria-label="Take screenshot"
              >
                <i className="fas fa-camera text-sm" />
              </button>
            )}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-1.5 rounded text-white/80 hover:bg-white/20 hover:text-white transition-colors"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              <i className={cn('fas text-sm', isFullscreen ? 'fa-compress' : 'fa-expand')} />
            </button>
          </div>
        </div>
      )}
      {reconnecting && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <div className="text-center px-2">
            <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-white font-bold">Reconnecting...</p>
            <p className="text-[10px] text-slate-400 mt-1">Attempt {reconnectAttemptsRef.current}/{maxReconnectAttempts}</p>
            <p className="text-[9px] text-slate-500 mt-2 max-w-[180px] mx-auto">
              Starting stream…
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
