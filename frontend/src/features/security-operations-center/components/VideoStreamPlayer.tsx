import React, { useRef, useState, useEffect, useCallback } from 'react';
import Hls from 'hls.js';
import { cn } from '../../../utils/cn';
import { VideoTimestampOverlay, TimestampPosition } from './VideoTimestampOverlay';

export const isHls = (url: string) => /\.m3u8(\?|$)/i.test(url);

export interface VideoStreamPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  errorClassName?: string;
  showTimestamp?: boolean;
  timestampPosition?: TimestampPosition;
}

export const VideoStreamPlayer: React.FC<VideoStreamPlayerProps> = ({
  src,
  poster,
  className = 'w-full h-40 rounded-lg bg-slate-900',
  errorClassName = 'w-full h-40 rounded-lg bg-slate-900 flex items-center justify-center text-slate-400 text-sm border border-white/5',
  showTimestamp = true,
  timestampPosition = 'top-right',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<InstanceType<typeof Hls> | null>(null);
  const [error, setError] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelayRef = useRef(1000); // Start with 1 second

  const attemptReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      setError(true);
      setReconnecting(false);
      return;
    }

    reconnectAttemptsRef.current++;
    setReconnecting(true);

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
        hlsRef.current = new Hls({ enableWorker: true, lowLatencyMode: true });
        hlsRef.current.on(Hls.Events.ERROR, (_event: string, data: { fatal?: boolean }) => {
          if (data.fatal && reconnectAttemptsRef.current < maxReconnectAttempts) {
            reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 2, 30000); // Exponential backoff, max 30s
            attemptReconnect();
          } else if (data.fatal) {
            setError(true);
            setReconnecting(false);
          }
        });
        hlsRef.current.loadSource(src);
        hlsRef.current.attachMedia(video);
        setReconnecting(false);
        reconnectAttemptsRef.current = 0; // Reset on success
        reconnectDelayRef.current = 1000; // Reset delay
      } else if (!useHls) {
        video.src = src;
        setReconnecting(false);
        reconnectAttemptsRef.current = 0;
        reconnectDelayRef.current = 1000;
      }
    }, reconnectDelayRef.current);
  }, [src]);

  useEffect(() => {
    setError(false);
    setReconnecting(false);
    reconnectAttemptsRef.current = 0;
    reconnectDelayRef.current = 1000;
    
    const video = videoRef.current;
    if (!video || !src) return;

    const useHls = isHls(src) && Hls.isSupported();
    if (useHls) {
      if (hlsRef.current) {
        try {
          hlsRef.current.destroy();
        } catch (e) {
          // Ignore destroy errors
        }
      }
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hlsRef.current = hls;
      
      hls.on(Hls.Events.ERROR, (_event: string, data: { fatal?: boolean }) => {
        if (data.fatal && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 2, 30000);
          attemptReconnect();
        } else if (data.fatal) {
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

    const onErr = () => {
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 2, 30000);
        attemptReconnect();
      } else {
        setError(true);
      }
    };
    
    video.addEventListener('error', onErr);
    video.src = src;
    video.crossOrigin = 'anonymous';
    
    return () => {
      video.removeEventListener('error', onErr);
      video.src = '';
    };
  }, [src, attemptReconnect]);

  if (error && !reconnecting) {
    return (
      <div className={cn(errorClassName)}>
        <div className="text-center">
          <i className="fas fa-exclamation-triangle text-red-400 text-2xl mb-2" />
          <p>Stream unavailable</p>
          <p className="text-[10px] text-slate-500 mt-1">Reconnection attempts exhausted</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        className={cn(className)}
        controls
        muted
        poster={poster}
        crossOrigin="anonymous"
        playsInline
        aria-label="Live camera feed"
      />
      {showTimestamp && !error && (
        <VideoTimestampOverlay position={timestampPosition} />
      )}
      {reconnecting && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-white font-bold">Reconnecting...</p>
            <p className="text-[10px] text-slate-400 mt-1">Attempt {reconnectAttemptsRef.current}/{maxReconnectAttempts}</p>
          </div>
        </div>
      )}
    </div>
  );
};
