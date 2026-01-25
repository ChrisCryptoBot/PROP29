import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '../../../../components/UI/Button';
import { VideoStreamPlayer } from '../VideoStreamPlayer';
import { cn } from '../../../../utils/cn';
import { useKeyboardNavigation } from '../../../../hooks/useKeyboardNavigation';
import { showSuccess, showError } from '../../../../utils/toast';
import type { CameraEntry } from '../../types/security-operations.types';

const MIN_W = 480;
const MIN_H = 320;
const DEFAULT_W = 900;
const DEFAULT_H = 560;
/** Max size as fraction of viewport; use 1 so you can go fullscreen. No upper bound beyond viewport. */
const MAX_VIEWPORT_W = 1;
const MAX_VIEWPORT_H = 1;

export interface CameraLiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  camera: CameraEntry | null;
}

export const CameraLiveModal: React.FC<CameraLiveModalProps> = ({ isOpen, onClose, camera }) => {
  const [width, setWidth] = useState(DEFAULT_W);
  const [height, setHeight] = useState(DEFAULT_H);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [resizing, setResizing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const startRef = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);
  const justResizedRef = useRef(false);
  const justDraggedRef = useRef(false);

  const clamp = useCallback((v: number, min: number, max: number) => Math.max(min, Math.min(max, v)), []);

  // Keyboard navigation
  useKeyboardNavigation([
    {
      key: 'Escape',
      description: 'Close modal',
      handler: () => onClose(),
      disabled: !isOpen
    }
  ], {
    disabled: !isOpen,
    captureGlobal: true
  });

  useEffect(() => {
    if (isOpen) {
      const maxW = typeof window !== 'undefined' ? MAX_VIEWPORT_W * window.innerWidth : DEFAULT_W;
      const maxH = typeof window !== 'undefined' ? MAX_VIEWPORT_H * window.innerHeight : DEFAULT_H;
      setWidth(clamp(DEFAULT_W, MIN_W, maxW));
      setHeight(clamp(DEFAULT_H, MIN_H, maxH));
      setPosition(null);
      setDragging(false);
    }
  }, [isOpen, clamp]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      const el = panelRef.current;
      if (!el) return;
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const nextX = e.clientX - dragOffsetRef.current.x;
      const nextY = e.clientY - dragOffsetRef.current.y;
      const x = Math.max(0, Math.min(window.innerWidth - w, nextX));
      const y = Math.max(0, Math.min(window.innerHeight - h, nextY));
      setPosition({ x, y });
    };
    const onUp = () => {
      justDraggedRef.current = true;
      setDragging(false);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging]);

  useEffect(() => {
    if (!resizing) return;
    const maxW = MAX_VIEWPORT_W * window.innerWidth;
    const maxH = MAX_VIEWPORT_H * window.innerHeight;

    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - startRef.current.x;
      const dy = e.clientY - startRef.current.y;
      setWidth((_w) => clamp(startRef.current.w + dx, MIN_W, maxW));
      setHeight((_h) => clamp(startRef.current.h + dy, MIN_H, maxH));
    };
    const onUp = () => {
      justResizedRef.current = true;
      setResizing(false);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [resizing, clamp]);

  const onResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      startRef.current = {
        x: e.clientX,
        y: e.clientY,
        w: width,
        h: height,
      };
      setResizing(true);
    },
    [width, height]
  );

  const handleDragStart = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      const el = panelRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const px = position === null ? rect.left : position.x;
      const py = position === null ? rect.top : position.y;
      dragOffsetRef.current = { x: e.clientX - px, y: e.clientY - py };
      if (position === null) setPosition({ x: rect.left, y: rect.top });
      setDragging(true);
    },
    [position]
  );

  const handleSnapshot = useCallback(() => {
    // Find the video element within the VideoStreamPlayer
    const videoElement = panelRef.current?.querySelector('video') as HTMLVideoElement;
    
    if (videoElement && !videoElement.paused) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        
        try {
          ctx.drawImage(videoElement, 0, 0);
          
          // Convert to blob and download
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
              const filename = `${camera?.name.replace(/\s+/g, '_')}_screenshot_${timestamp}.png`;
              a.href = url;
              a.download = filename;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              showSuccess(`Screenshot saved: ${filename}`);
            }
          });
        } catch (error) {
          console.error('Failed to capture screenshot:', error);
          showError('Screenshot capture failed. This may be due to CORS restrictions on the video stream.');
        }
      }
    } else {
      showError('No active video stream to capture.');
    }
  }, [camera]);

  const handleFullscreen = useCallback(() => {
    const videoElement = panelRef.current?.querySelector('video') as HTMLVideoElement;
    
    if (videoElement) {
      if (videoElement.requestFullscreen) {
        videoElement.requestFullscreen();
      } else if ((videoElement as any).webkitRequestFullscreen) {
        (videoElement as any).webkitRequestFullscreen();
      } else if ((videoElement as any).msRequestFullscreen) {
        (videoElement as any).msRequestFullscreen();
      }
    }
  }, []);

  if (!isOpen) return null;
  if (!camera) return null;

  const maxW = typeof window !== 'undefined' ? MAX_VIEWPORT_W * window.innerWidth : width;
  const maxH = typeof window !== 'undefined' ? MAX_VIEWPORT_H * window.innerHeight : height;
  const styleW = Math.min(width, maxW);
  const styleH = Math.min(height, maxH);
  const panelStyle: React.CSSProperties =
    position === null
      ? { width: styleW, height: styleH, left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }
      : { width: styleW, height: styleH, left: position.x, top: position.y };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) return;
    if (justResizedRef.current) {
      justResizedRef.current = false;
      return;
    }
    if (justDraggedRef.current) {
      justDraggedRef.current = false;
      return;
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="camera-modal-title"
      aria-describedby="camera-modal-description"
      onClick={handleBackdropClick}
    >
      <div
        ref={panelRef}
        className={cn(
          'absolute bg-slate-900/90 rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col',
          'border-white/10'
        )}
        style={panelStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — drag handle (exclude Close) */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 shrink-0">
          <div
            className="flex items-center gap-3 cursor-default select-none flex-1 min-w-0 hover:cursor-move"
            onMouseDown={handleDragStart}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600/80 to-slate-900 flex items-center justify-center border border-white/5">
              <i className="fas fa-video text-white" aria-hidden />
            </div>
            <div>
              <h3 id="camera-modal-title" className="text-lg font-black uppercase tracking-tighter text-white">{camera.name}</h3>
              <p id="camera-modal-description" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {camera.location} · {camera.ipAddress}
              </p>
            </div>
            <span
              className={cn(
                'px-2.5 py-1 text-[10px] font-black rounded uppercase tracking-widest border',
                camera.status === 'online'
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                  : camera.status === 'offline'
                    ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                    : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
              )}
            >
              {camera.status}
            </span>
          </div>
          <Button variant="subtle" size="sm" className="font-black uppercase tracking-widest text-[10px]" onClick={onClose}>
            <i className="fas fa-times mr-2" />
            Close
          </Button>
        </div>

        {/* Video area with controls */}
        <div className="flex-1 min-h-0 relative bg-black/40 p-4">
          {camera.status === 'online' && camera.streamUrl ? (
            <div className="relative w-full h-full min-h-[240px] rounded-xl overflow-hidden">
              <VideoStreamPlayer
                src={camera.streamUrl}
                poster={camera.lastKnownImageUrl}
                className="w-full h-full rounded-xl bg-slate-900 object-contain"
                errorClassName="w-full h-full rounded-xl bg-slate-900 flex items-center justify-center text-slate-400 text-sm border border-white/5"
              />
              
              {/* Quality Selector - Positioned in bottom-center to avoid conflicts */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <i className="fas fa-cog text-white/70 text-sm" />
                  <select 
                    className="bg-transparent text-white text-xs font-bold border-none outline-none cursor-pointer"
                    defaultValue="1080p"
                  >
                    <option value="4k" className="bg-slate-800">4K (2160p)</option>
                    <option value="1080p" className="bg-slate-800">Full HD (1080p)</option>
                    <option value="720p" className="bg-slate-800">HD (720p)</option>
                    <option value="480p" className="bg-slate-800">SD (480p)</option>
                  </select>
                </div>
              </div>

              {/* PTZ Controls */}
              <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg p-3" role="group" aria-label="Camera pan, tilt, and zoom controls">
                <div className="grid grid-cols-3 gap-1">
                  {/* PTZ Control Grid */}
                  <button 
                    className="w-8 h-8 rounded bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center focus:ring-2 focus:ring-blue-500/50"
                    aria-label="Pan up and tilt left"
                    title="Pan up and tilt left"
                  >
                    <i className="fas fa-chevron-up text-white text-xs" aria-hidden="true" />
                  </button>
                  <button 
                    className="w-8 h-8 rounded bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center focus:ring-2 focus:ring-blue-500/50"
                    aria-label="Tilt up"
                    title="Tilt up"
                  >
                    <i className="fas fa-chevron-up text-white text-xs" aria-hidden="true" />
                  </button>
                  <button 
                    className="w-8 h-8 rounded bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center focus:ring-2 focus:ring-blue-500/50"
                    aria-label="Pan up and tilt right"
                    title="Pan up and tilt right"
                  >
                    <i className="fas fa-chevron-up text-white text-xs" aria-hidden="true" />
                  </button>
                  
                  <button 
                    className="w-8 h-8 rounded bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center focus:ring-2 focus:ring-blue-500/50"
                    aria-label="Pan left"
                    title="Pan left"
                  >
                    <i className="fas fa-chevron-left text-white text-xs" aria-hidden="true" />
                  </button>
                  <button 
                    className="w-8 h-8 rounded bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center focus:ring-2 focus:ring-blue-500/50"
                    aria-label="Return to home position"
                    title="Return to home position"
                  >
                    <i className="fas fa-home text-white text-xs" aria-hidden="true" />
                  </button>
                  <button 
                    className="w-8 h-8 rounded bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center focus:ring-2 focus:ring-blue-500/50"
                    aria-label="Pan right"
                    title="Pan right"
                  >
                    <i className="fas fa-chevron-right text-white text-xs" aria-hidden="true" />
                  </button>
                  
                  <button 
                    className="w-8 h-8 rounded bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center focus:ring-2 focus:ring-blue-500/50"
                    aria-label="Pan down and tilt left"
                    title="Pan down and tilt left"
                  >
                    <i className="fas fa-chevron-down text-white text-xs" aria-hidden="true" />
                  </button>
                  <button 
                    className="w-8 h-8 rounded bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center focus:ring-2 focus:ring-blue-500/50"
                    aria-label="Tilt down"
                    title="Tilt down"
                  >
                    <i className="fas fa-chevron-down text-white text-xs" aria-hidden="true" />
                  </button>
                  <button 
                    className="w-8 h-8 rounded bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center focus:ring-2 focus:ring-blue-500/50"
                    aria-label="Pan down and tilt right"
                    title="Pan down and tilt right"
                  >
                    <i className="fas fa-chevron-down text-white text-xs" aria-hidden="true" />
                  </button>
                </div>
                
                {/* Zoom Controls */}
                <div className="flex items-center gap-1 mt-3" role="group" aria-label="Zoom controls">
                  <button 
                    className="w-8 h-6 rounded bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center focus:ring-2 focus:ring-blue-500/50"
                    aria-label="Zoom out"
                    title="Zoom out"
                  >
                    <i className="fas fa-minus text-white text-xs" aria-hidden="true" />
                  </button>
                  <div 
                    className="flex-1 h-1 bg-white/20 rounded mx-2 relative" 
                    role="slider" 
                    aria-label="Zoom level"
                    aria-valuemin={1}
                    aria-valuemax={10}
                    aria-valuenow={5}
                    tabIndex={0}
                  >
                    <div className="absolute left-1/2 w-3 h-3 bg-white rounded-full -mt-1 transform -translate-x-1/2"></div>
                  </div>
                  <button 
                    className="w-8 h-6 rounded bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center focus:ring-2 focus:ring-blue-500/50"
                    aria-label="Zoom in"
                    title="Zoom in"
                  >
                    <i className="fas fa-plus text-white text-xs" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Left Side Controls - Positioned away from video timeline */}
              <div className="absolute top-16 left-4 flex flex-col gap-2">
                {/* Night Vision Toggle */}
                <button className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center gap-2 hover:bg-black/80 transition-colors">
                  <i className="fas fa-moon text-yellow-400 text-sm" />
                  <span className="text-white text-xs font-bold">Night Vision</span>
                </button>
                
                {/* Recording Indicator/Control */}
                <button className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center gap-2 hover:bg-black/80 transition-colors">
                  <i className={`fas fa-circle ${camera.isRecording ? 'text-red-500 animate-pulse' : 'text-white/50'} text-sm`} />
                  <span className="text-white text-xs font-bold">{camera.isRecording ? 'Recording' : 'Not Recording'}</span>
                </button>
              </div>

              {/* Right Side Controls */}
              <div className="absolute bottom-4 right-4 flex items-center gap-2">
                {/* Snapshot Button */}
                <button 
                  className="bg-black/60 backdrop-blur-sm rounded-lg p-2 hover:bg-black/80 transition-colors"
                  onClick={handleSnapshot}
                  title="Take Screenshot"
                >
                  <i className="fas fa-camera text-white text-sm" />
                </button>
                
                {/* Fullscreen Button */}
                <button 
                  className="bg-black/60 backdrop-blur-sm rounded-lg p-2 hover:bg-black/80 transition-colors"
                  onClick={handleFullscreen}
                  title="Toggle Fullscreen"
                >
                  <i className="fas fa-expand text-white text-sm" />
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full min-h-[240px] rounded-xl bg-slate-900 flex items-center justify-center text-slate-400 border border-white/5">
              {camera.lastKnownImageUrl ? (
                <img
                  src={camera.lastKnownImageUrl}
                  alt={`Last known: ${camera.name}`}
                  className="max-w-full max-h-full object-contain rounded-xl"
                />
              ) : (
                <span>No live feed · Last known image unavailable</span>
              )}
            </div>
          )}
        </div>

        {/* Resize handle — drag to resize */}
        <div
          role="presentation"
          aria-label="Drag to resize"
          className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize flex items-end justify-end p-1 hover:bg-white/5 transition-colors rounded-tl-lg group"
          onMouseDown={onResizeMouseDown}
        >
          <div className="flex flex-col gap-0.5">
            <div className="flex gap-0.5">
              <div className="w-0.5 h-0.5 bg-white/30 rounded-full group-hover:bg-white/60 transition-colors" />
              <div className="w-0.5 h-0.5 bg-white/30 rounded-full group-hover:bg-white/60 transition-colors" />
            </div>
            <div className="flex gap-0.5">
              <div className="w-0.5 h-0.5 bg-white/30 rounded-full group-hover:bg-white/60 transition-colors" />
              <div className="w-0.5 h-0.5 bg-white/30 rounded-full group-hover:bg-white/60 transition-colors" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
