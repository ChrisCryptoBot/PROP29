import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '../../../../components/UI/Button';
import { VideoStreamPlayer } from '../VideoStreamPlayer';
import { cn } from '../../../../utils/cn';
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
      aria-label={`Live view: ${camera.name}`}
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
            role="presentation"
            aria-label="Drag to reposition"
            className="flex items-center gap-3 cursor-move select-none flex-1 min-w-0"
            onMouseDown={handleDragStart}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600/80 to-slate-900 flex items-center justify-center border border-white/5">
              <i className="fas fa-video text-white" aria-hidden />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-tighter text-white">{camera.name}</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
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

        {/* Video area */}
        <div className="flex-1 min-h-0 relative flex items-center justify-center bg-black/40 p-4">
          {camera.status === 'online' && camera.streamUrl ? (
            <VideoStreamPlayer
              src={camera.streamUrl}
              poster={camera.lastKnownImageUrl}
              className="w-full h-full min-h-[240px] rounded-xl bg-slate-900 object-contain"
              errorClassName="w-full min-h-[240px] rounded-xl bg-slate-900 flex items-center justify-center text-slate-400 text-sm border border-white/5"
            />
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
          className="absolute bottom-0 right-0 w-10 h-10 flex items-end justify-end p-1.5 cursor-nwse-resize text-white/30 hover:text-white/60 transition-colors rounded-tl-lg bg-slate-800/50 hover:bg-slate-700/50"
          onMouseDown={onResizeMouseDown}
        >
          <i className="fas fa-grip-lines fa-rotate-45 text-sm" aria-hidden />
        </div>
      </div>
    </div>
  );
};
