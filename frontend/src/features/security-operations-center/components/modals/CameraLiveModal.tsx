/**
 * Camera Live Modal Component
 * Supports multiple simultaneous modals, multi-monitor positioning, and millisecond timestamps
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../../../../components/UI/Button';
import { VideoStreamPlayer } from '../VideoStreamPlayer';
import { cn } from '../../../../utils/cn';
import { useKeyboardNavigation } from '../../../../hooks/useKeyboardNavigation';
import { showSuccess, showError } from '../../../../utils/toast';
import { useCameraModalManager } from '../../context/CameraModalManagerContext';
import { multiMonitorService } from '../../../../services/MultiMonitorService';
import { ErrorHandlerService } from '../../../../services/ErrorHandlerService';
import { controlCameraPTZ } from '../../services/securityOperationsCenterService';
import { useSecurityOperationsTelemetry } from '../../hooks/useSecurityOperationsTelemetry';
import type { CameraEntry } from '../../types/security-operations.types';

const MIN_W = 480;
const MIN_H = 320;
const DEFAULT_W = 900;
const DEFAULT_H = 560;
const MAX_VIEWPORT_W = 1;
const MAX_VIEWPORT_H = 1;

export interface CameraLiveModalProps {
  modalId: string;
  camera: CameraEntry;
}

export const CameraLiveModal: React.FC<CameraLiveModalProps> = ({ modalId, camera }) => {
  const {
    updateModalPosition,
    updateModalSize,
    updateModalDisplay,
    bringToFront,
    closeModal,
    getModal,
  } = useCameraModalManager();
  const { trackAction } = useSecurityOperationsTelemetry();

  const modalState = getModal(modalId);

  const [resizing, setResizing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const startRef = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);
  const justResizedRef = useRef(false);
  const justDraggedRef = useRef(false);
  const [displayId, setDisplayId] = useState<string | undefined>(modalState?.displayId);

  const clamp = useCallback((v: number, min: number, max: number) => Math.max(min, Math.min(max, v)), []);

  // PTZ debouncing to prevent command spam
  const ptzDebounceRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const PTZ_DEBOUNCE_MS = 300; // 300ms debounce for PTZ commands

  const handlePTZ = useCallback(async (action: string) => {
    // Clear existing debounce for this action
    const existing = ptzDebounceRef.current.get(action);
    if (existing) {
      clearTimeout(existing);
    }

    // Debounce PTZ commands
    const timeoutId = setTimeout(async () => {
      trackAction('ptz_control', 'camera', { cameraId: camera.id, action });
      const success = await controlCameraPTZ(camera.id, action);
      if (success) {
        // Don't show success toast for every PTZ command (too noisy)
        // Only show errors
      } else {
        showError(`Failed to send PTZ command: ${action}`);
      }
      ptzDebounceRef.current.delete(action);
    }, PTZ_DEBOUNCE_MS);

    ptzDebounceRef.current.set(action, timeoutId);
  }, [camera.id, trackAction]);

  // Keyboard navigation
  useKeyboardNavigation([
    {
      key: 'Escape',
      description: 'Close modal',
      handler: () => closeModal(modalId),
      disabled: false
    }
  ], {
    disabled: false,
    captureGlobal: false // Don't capture globally to allow console access
  });

  // Initialize position on mount
  useEffect(() => {
    if (!modalState) return;
    if (!modalState.position && panelRef.current) {
      const rect = panelRef.current.getBoundingClientRect();
      const centeredX = window.innerWidth / 2 - modalState.size.width / 2;
      const centeredY = window.innerHeight / 2 - modalState.size.height / 2;
      updateModalPosition(modalId, { x: centeredX, y: centeredY });
    }
  }, [modalId, modalState, updateModalPosition]);

  // Handle dragging with multi-monitor support
  useEffect(() => {
    if (!dragging || !modalState) return;
    
    const onMove = async (e: MouseEvent) => {
      const el = panelRef.current;
      if (!el) return;
      
      const w = modalState.size.width;
      const h = modalState.size.height;
      const nextX = e.clientX - dragOffsetRef.current.x;
      const nextY = e.clientY - dragOffsetRef.current.y;
      
      // Detect which display the mouse is on
      const display = await multiMonitorService.getDisplayForPoint(e.clientX, e.clientY);
      if (display) {
        setDisplayId(display.id);
        updateModalDisplay(modalId, display.id);
        
        // Clamp to display bounds
        const clamped = multiMonitorService.clampToDisplay(nextX, nextY, w, h, display.id);
        updateModalPosition(modalId, { x: clamped.x, y: clamped.y });
      } else {
        // Fallback to window bounds
        const x = Math.max(0, Math.min(window.innerWidth - w, nextX));
        const y = Math.max(0, Math.min(window.innerHeight - h, nextY));
        updateModalPosition(modalId, { x, y });
      }
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
  }, [dragging, modalId, modalState, updateModalPosition, updateModalDisplay]);

  // Handle resizing with multi-monitor support
  useEffect(() => {
    if (!resizing || !modalState) return;
    
    const onMove = async (e: MouseEvent) => {
      const dx = e.clientX - startRef.current.x;
      const dy = e.clientY - startRef.current.y;
      
      const display = displayId 
        ? await multiMonitorService.getDisplayForPoint(e.clientX, e.clientY)
        : null;
      
      const maxW = display 
        ? display.bounds.width * MAX_VIEWPORT_W
        : window.innerWidth * MAX_VIEWPORT_W;
      const maxH = display
        ? display.bounds.height * MAX_VIEWPORT_H
        : window.innerHeight * MAX_VIEWPORT_H;
      
      const newWidth = clamp(startRef.current.w + dx, MIN_W, maxW);
      const newHeight = clamp(startRef.current.h + dy, MIN_H, maxH);
      
      updateModalSize(modalId, { width: newWidth, height: newHeight });
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
  }, [resizing, modalId, displayId, clamp, updateModalSize, modalState]);

  const onResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!modalState) return;
      e.preventDefault();
      e.stopPropagation();
      startRef.current = {
        x: e.clientX,
        y: e.clientY,
        w: modalState.size.width,
        h: modalState.size.height,
      };
      setResizing(true);
    },
    [modalState]
  );

  const handleDragStart = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!modalState) return;
      e.preventDefault();
      bringToFront(modalId);
      const el = panelRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const px = modalState.position?.x ?? rect.left;
      const py = modalState.position?.y ?? rect.top;
      dragOffsetRef.current = { x: e.clientX - px, y: e.clientY - py };
      if (!modalState.position) {
        updateModalPosition(modalId, { x: rect.left, y: rect.top });
      }
      setDragging(true);
    },
    [modalId, modalState, bringToFront, updateModalPosition]
  );

  const handleSnapshot = useCallback(() => {
    const videoElement = panelRef.current?.querySelector('video') as HTMLVideoElement;
    
    if (videoElement && !videoElement.paused) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        
        try {
          ctx.drawImage(videoElement, 0, 0);
          
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
              const filename = `${camera.name.replace(/\s+/g, '_')}_screenshot_${timestamp}.png`;
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
          ErrorHandlerService.handle(error, 'Failed to capture screenshot - CameraLiveModal');
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

  // Cleanup PTZ debounce timers on unmount
  useEffect(() => {
    return () => {
      ptzDebounceRef.current.forEach((timeout) => clearTimeout(timeout));
      ptzDebounceRef.current.clear();
    };
  }, []);

  // Early return after all hooks
  if (!modalState) return null;

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
    // Don't close on backdrop click - allow multiple modals
  };

  const position = modalState.position || { x: window.innerWidth / 2 - modalState.size.width / 2, y: window.innerHeight / 2 - modalState.size.height / 2 };
  const panelStyle: React.CSSProperties = {
    width: modalState.size.width,
    height: modalState.size.height,
    left: position.x,
    top: position.y,
    zIndex: modalState.zIndex,
  };

  // Use React Portal to render outside main layout (prevents blocking console)
  const modalContent = (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] pointer-events-none"
      role="presentation"
      onClick={handleBackdropClick}
    >
      <div
        ref={panelRef}
        className={cn(
          'absolute bg-slate-900/90 rounded-2xl border border-white/5 shadow-2xl overflow-hidden flex flex-col pointer-events-auto'
        )}
        style={panelStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — drag handle */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 shrink-0">
          <div
            className="flex items-center gap-3 cursor-default select-none flex-1 min-w-0 hover:cursor-move"
            onMouseDown={handleDragStart}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600/80 to-slate-900 flex items-center justify-center border border-white/5">
              <i className="fas fa-video text-white" aria-hidden />
            </div>
            <div>
              <h3 id={`camera-modal-title-${modalId}`} className="text-lg font-black uppercase tracking-tighter text-white">{camera.name}</h3>
              <p id={`camera-modal-description-${modalId}`} className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
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
          <Button variant="subtle" size="sm" className="font-black uppercase tracking-widest text-[10px]" onClick={() => closeModal(modalId)}>
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
                showTimestamp={true}
                timestampPosition="top-right"
              />
              
              {/* Quality Selector */}
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

              {/* PTZ Controls - Standard 3x3 grid layout */}
              <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg p-3" role="group" aria-label="Camera pan, tilt, and zoom controls">
                <div className="grid grid-cols-3 gap-1">
                  {/* Top row: Tilt up (all three buttons for visual consistency, but center is primary) */}
                  <button className="w-8 h-8 rounded bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center focus:ring-2 focus:ring-blue-500/50 opacity-50" aria-label="Tilt up" title="Tilt up" onClick={() => handlePTZ('tilt_up')}>
                    <i className="fas fa-chevron-up text-white text-xs" aria-hidden="true" />
                  </button>
                  <button className="w-8 h-8 rounded bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center focus:ring-2 focus:ring-blue-500/50" aria-label="Tilt up" title="Tilt up" onClick={() => handlePTZ('tilt_up')}>
                    <i className="fas fa-chevron-up text-white text-xs" aria-hidden="true" />
                  </button>
                  <button className="w-8 h-8 rounded bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center focus:ring-2 focus:ring-blue-500/50 opacity-50" aria-label="Tilt up" title="Tilt up" onClick={() => handlePTZ('tilt_up')}>
                    <i className="fas fa-chevron-up text-white text-xs" aria-hidden="true" />
                  </button>
                  
                  {/* Middle row: Pan left, Home, Pan right */}
                  <button className="w-8 h-8 rounded bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center focus:ring-2 focus:ring-blue-500/50" aria-label="Pan left" title="Pan left" onClick={() => handlePTZ('pan_left')}>
                    <i className="fas fa-chevron-left text-white text-xs" aria-hidden="true" />
                  </button>
                  <button className="w-8 h-8 rounded bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center focus:ring-2 focus:ring-blue-500/50" aria-label="Return to home position" title="Return to home position" onClick={() => handlePTZ('home')}>
                    <i className="fas fa-home text-white text-xs" aria-hidden="true" />
                  </button>
                  <button className="w-8 h-8 rounded bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center focus:ring-2 focus:ring-blue-500/50" aria-label="Pan right" title="Pan right" onClick={() => handlePTZ('pan_right')}>
                    <i className="fas fa-chevron-right text-white text-xs" aria-hidden="true" />
                  </button>
                  
                  {/* Bottom row: Tilt down (all three buttons for visual consistency, but center is primary) */}
                  <button className="w-8 h-8 rounded bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center focus:ring-2 focus:ring-blue-500/50 opacity-50" aria-label="Tilt down" title="Tilt down" onClick={() => handlePTZ('tilt_down')}>
                    <i className="fas fa-chevron-down text-white text-xs" aria-hidden="true" />
                  </button>
                  <button className="w-8 h-8 rounded bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center focus:ring-2 focus:ring-blue-500/50" aria-label="Tilt down" title="Tilt down" onClick={() => handlePTZ('tilt_down')}>
                    <i className="fas fa-chevron-down text-white text-xs" aria-hidden="true" />
                  </button>
                  <button className="w-8 h-8 rounded bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center focus:ring-2 focus:ring-blue-500/50 opacity-50" aria-label="Tilt down" title="Tilt down" onClick={() => handlePTZ('tilt_down')}>
                    <i className="fas fa-chevron-down text-white text-xs" aria-hidden="true" />
                  </button>
                </div>
                
                {/* Zoom Controls */}
                <div className="flex items-center gap-1 mt-3" role="group" aria-label="Zoom controls">
                  <button className="w-8 h-6 rounded bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center focus:ring-2 focus:ring-blue-500/50" aria-label="Zoom out" title="Zoom out" onClick={() => handlePTZ('zoom_out')}>
                    <i className="fas fa-minus text-white text-xs" aria-hidden="true" />
                  </button>
                  <div className="flex-1 h-1 bg-white/20 rounded mx-2 relative" role="slider" aria-label="Zoom level" aria-valuemin={1} aria-valuemax={10} aria-valuenow={5} tabIndex={0}>
                    <div className="absolute left-1/2 w-3 h-3 bg-white rounded-full -mt-1 transform -translate-x-1/2"></div>
                  </div>
                  <button className="w-8 h-6 rounded bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center focus:ring-2 focus:ring-blue-500/50" aria-label="Zoom in" title="Zoom in" onClick={() => handlePTZ('zoom_in')}>
                    <i className="fas fa-plus text-white text-xs" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Left Side Controls */}
              <div className="absolute top-16 left-4 flex flex-col gap-2">
                <button className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center gap-2 hover:bg-black/80 transition-colors">
                  <i className="fas fa-moon text-yellow-400 text-sm" />
                  <span className="text-white text-xs font-bold">Night Vision</span>
                </button>
                
                <button className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center gap-2 hover:bg-black/80 transition-colors">
                  <i className={`fas fa-circle ${camera.isRecording ? 'text-red-500 animate-pulse' : 'text-white/50'} text-sm`} />
                  <span className="text-white text-xs font-bold">{camera.isRecording ? 'Recording' : 'Not Recording'}</span>
                </button>
              </div>

              {/* Right Side Controls */}
              <div className="absolute bottom-4 right-4 flex items-center gap-2">
                <button className="bg-black/60 backdrop-blur-sm rounded-lg p-2 hover:bg-black/80 transition-colors" onClick={handleSnapshot} title="Take Screenshot">
                  <i className="fas fa-camera text-white text-sm" />
                </button>
                <button className="bg-black/60 backdrop-blur-sm rounded-lg p-2 hover:bg-black/80 transition-colors" onClick={handleFullscreen} title="Toggle Fullscreen">
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

        {/* Resize handle */}
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

  // Render via portal to avoid blocking console
  return createPortal(modalContent, document.body);
};
