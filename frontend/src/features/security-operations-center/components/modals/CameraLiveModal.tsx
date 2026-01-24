import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '../../../../components/UI/Button';
import { VideoStreamPlayer } from '../VideoStreamPlayer';
import { cn } from '../../../../utils/cn';
import type { CameraEntry } from '../../types/security-operations.types';

const MIN_W = 480;
const MIN_H = 320;
const MAX_W = 0.95 * (typeof window !== 'undefined' ? window.innerWidth : 1920);
const MAX_H = 0.9 * (typeof window !== 'undefined' ? window.innerHeight : 1080);
const DEFAULT_W = 900;
const DEFAULT_H = 560;

export interface CameraLiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  camera: CameraEntry | null;
}

export const CameraLiveModal: React.FC<CameraLiveModalProps> = ({ isOpen, onClose, camera }) => {
  const [width, setWidth] = useState(DEFAULT_W);
  const [height, setHeight] = useState(DEFAULT_H);
  const [resizing, setResizing] = useState(false);
  const startRef = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  const clamp = useCallback((v: number, min: number, max: number) => Math.max(min, Math.min(max, v)), []);

  useEffect(() => {
    if (isOpen) {
      const maxW = typeof window !== 'undefined' ? 0.95 * window.innerWidth : DEFAULT_W;
      const maxH = typeof window !== 'undefined' ? 0.9 * window.innerHeight : DEFAULT_H;
      setWidth(clamp(DEFAULT_W, MIN_W, maxW));
      setHeight(clamp(DEFAULT_H, MIN_H, maxH));
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
    if (!resizing) return;
    const maxW = 0.95 * window.innerWidth;
    const maxH = 0.9 * window.innerHeight;

    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - startRef.current.x;
      const dy = e.clientY - startRef.current.y;
      setWidth((w) => clamp(startRef.current.w + dx, MIN_W, maxW));
      setHeight((h) => clamp(startRef.current.h + dy, MIN_H, maxH));
    };
    const onUp = () => setResizing(false);

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

  if (!isOpen) return null;
  if (!camera) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Live view: ${camera.name}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={panelRef}
        className={cn(
          'relative bg-slate-900/90 rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col',
          'border-white/10'
        )}
        style={{ width: Math.min(width, 0.95 * window.innerWidth), height: Math.min(height, 0.9 * window.innerHeight) }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3">
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
