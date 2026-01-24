import React, { useRef, useState, useEffect } from 'react';
import Hls from 'hls.js';
import { cn } from '../../../utils/cn';

export const isHls = (url: string) => /\.m3u8(\?|$)/i.test(url);

export interface VideoStreamPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  errorClassName?: string;
}

export const VideoStreamPlayer: React.FC<VideoStreamPlayerProps> = ({
  src,
  poster,
  className = 'w-full h-40 rounded-lg bg-slate-900',
  errorClassName = 'w-full h-40 rounded-lg bg-slate-900 flex items-center justify-center text-slate-400 text-sm border border-white/5',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
    const video = videoRef.current;
    if (!video || !src) return;

    const useHls = isHls(src) && Hls.isSupported();
    if (useHls) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hls.on(Hls.Events.ERROR, (_event: string, data: { fatal?: boolean }) => {
        if (data.fatal) setError(true);
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      return () => {
        hls.destroy();
      };
    }

    const onErr = () => setError(true);
    video.addEventListener('error', onErr);
    video.src = src;
    video.crossOrigin = 'anonymous';
    return () => {
      video.removeEventListener('error', onErr);
      video.src = '';
    };
  }, [src]);

  if (error) {
    return (
      <div className={cn(errorClassName)}>
        Stream unavailable
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      className={cn(className)}
      controls
      muted
      poster={poster}
      crossOrigin="anonymous"
      playsInline
    />
  );
};
