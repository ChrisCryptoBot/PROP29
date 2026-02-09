/**
 * Camera Wall Tile Component
 * Individual draggable, resizable camera tile with performance controls
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { VideoStreamPlayer } from '../VideoStreamPlayer';
import { Button } from '../../../../components/UI/Button';
import { useCameraWallLayout } from '../../context/CameraWallLayoutContext';
import { cn } from '../../../../utils/cn';
import type { CameraTile } from '../../types/camera-wall.types';

interface CameraWallTileProps {
  tile: CameraTile;
  /** When changed, the stream player remounts and retries (e.g. after Refresh) */
  streamRefreshKey?: number;
}

const MIN_TILE_WIDTH = 200;
const MIN_TILE_HEIGHT = 150;

export const CameraWallTile: React.FC<CameraWallTileProps> = (props) => {
  const { tile, streamRefreshKey = 0 } = props;
  const {
    updateTilePosition,
    updateTileSize,
    updateTileQuality,
    toggleTilePause,
    toggleTilePin,
    toggleTileMinimize,
    bringTileToFront,
    removeTile,
    settings,
  } = useCameraWallLayout();

  const tileRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if (tile.isMinimized) return;
    e.preventDefault();
    e.stopPropagation();
    bringTileToFront(tile.id);
    const rect = tileRef.current?.getBoundingClientRect();
    if (rect) {
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
      };
      setIsDragging(true);
    }
  }, [tile.id, tile.isMinimized, bringTileToFront]);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    bringTileToFront(tile.id);
    const rect = tileRef.current?.getBoundingClientRect();
    if (rect) {
      resizeStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        width: rect.width,
        height: rect.height,
      };
      setIsResizing(true);
    }
  }, [tile.id, bringTileToFront]);

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragStartRef.current.offsetX;
        const newY = e.clientY - dragStartRef.current.offsetY;
        updateTilePosition(tile.id, { x: newX, y: newY });
      } else if (isResizing) {
        const dx = e.clientX - resizeStartRef.current.x;
        const dy = e.clientY - resizeStartRef.current.y;
        const newWidth = Math.max(MIN_TILE_WIDTH, resizeStartRef.current.width + dx);
        const newHeight = Math.max(MIN_TILE_HEIGHT, resizeStartRef.current.height + dy);
        updateTileSize(tile.id, { width: newWidth, height: newHeight });
      }
    };

    const handleUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDragging, isResizing, tile.id, updateTilePosition, updateTileSize]);

  const handleQualityChange = useCallback((quality: 'preview' | 'full' | 'adaptive') => {
    updateTileQuality(tile.id, quality);
  }, [tile.id, updateTileQuality]);

  if (tile.isMinimized) {
    return (
      <div
        ref={tileRef}
        className="absolute bg-slate-900 border border-white/5 rounded-md p-2 cursor-move"
        style={{
          left: tile.position.x,
          top: tile.position.y,
          width: 200,
          height: 60,
          zIndex: tile.zIndex,
        }}
        onMouseDown={handleDragStart}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <i className="fas fa-video text-blue-400 text-xs" />
            <span className="text-xs font-black text-white uppercase tracking-tighter truncate">{tile.camera.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                toggleTileMinimize(tile.id);
              }}
              aria-label="Restore tile"
            >
              <i className="fas fa-window-maximize text-white text-[10px]" />
            </button>
            <button
              className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                removeTile(tile.id);
              }}
              aria-label="Close tile"
            >
              <i className="fas fa-times text-white text-[10px]" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={tileRef}
      className={cn(
        "absolute bg-slate-900 border border-white/5 rounded-md overflow-hidden flex flex-col",
        tile.isPinned && "ring-2 ring-blue-500/50"
      )}
      style={{
        left: tile.position.x,
        top: tile.position.y,
        width: tile.size.width,
        height: tile.size.height,
        zIndex: tile.zIndex,
      }}
    >
      {/* Header - drag handle */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-black/40 cursor-move select-none"
        onMouseDown={handleDragStart}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <i className="fas fa-video text-blue-400 text-xs" />
          <span className="text-xs font-black text-white uppercase tracking-tighter truncate">{tile.camera.name}</span>
          {tile.isPinned && (
            <i className="fas fa-thumbtack text-blue-400 text-[10px]" aria-label="Pinned" />
          )}
          {tile.isPaused && (
            <span className="text-[9px] text-amber-400 font-black uppercase">PAUSED</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Quality selector */}
          <select
            className="bg-white/5 border border-white/5 rounded px-2 py-1 text-[9px] font-bold text-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            value={tile.quality || 'adaptive'}
            onChange={(e) => handleQualityChange(e.target.value as 'preview' | 'full' | 'adaptive')}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <option value="preview" className="bg-slate-800">Preview</option>
            <option value="full" className="bg-slate-800">Full</option>
            <option value="adaptive" className="bg-slate-800">Auto</option>
          </select>
          <button
            className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              toggleTilePause(tile.id);
            }}
            aria-label={tile.isPaused ? "Resume" : "Pause"}
            title={tile.isPaused ? "Resume" : "Pause"}
          >
            <i className={cn("fas text-white text-[10px]", tile.isPaused ? "fa-play" : "fa-pause")} />
          </button>
          <button
            className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              toggleTilePin(tile.id);
            }}
            aria-label={tile.isPinned ? "Unpin" : "Pin"}
            title={tile.isPinned ? "Unpin" : "Pin"}
          >
            <i className={cn("fas text-white text-[10px]", tile.isPinned ? "fa-thumbtack" : "fa-thumbtack")} style={{ opacity: tile.isPinned ? 1 : 0.5 }} />
          </button>
          <button
            className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              toggleTileMinimize(tile.id);
            }}
            aria-label="Minimize"
          >
            <i className="fas fa-window-minimize text-white text-[10px]" />
          </button>
          <button
            className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              removeTile(tile.id);
            }}
            aria-label="Close"
          >
            <i className="fas fa-times text-white text-[10px]" />
          </button>
        </div>
      </div>

      {/* Video content */}
      <div className="flex-1 min-h-0 relative bg-black/60">
        {tile.isPaused ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <i className="fas fa-pause text-white/50 text-2xl mb-2" />
              <p className="text-[10px] text-white/50 font-black uppercase">Paused</p>
            </div>
          </div>
        ) : tile.camera.status === 'maintenance' ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-slate-900/90 border border-amber-500/20">
            <i className="fas fa-wrench text-2xl text-amber-400/80" aria-hidden />
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Maintenance</span>
            <span className="text-[9px] text-slate-500">No live feed</span>
          </div>
        ) : tile.camera.streamUrl ? (
          <div key={`stream-${tile.id}-${streamRefreshKey}`} className="w-full h-full relative">
            <VideoStreamPlayer
              src={tile.camera.streamUrl}
              poster={tile.camera.lastKnownImageUrl}
              className="w-full h-full object-contain"
              errorClassName="w-full h-full flex items-center justify-center text-slate-400 text-sm border border-white/5"
              showTimestamp={true}
              timestampPosition="top-right"
              cameraId={tile.camera.id}
            />
            {tile.camera.status === 'offline' && (
              <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-rose-500/90 text-white">
                Offline
              </span>
            )}
          </div>
        ) : tile.camera.status === 'offline' ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-slate-900/90 border border-rose-500/20">
            <i className="fas fa-video-slash text-2xl text-rose-400/80" aria-hidden />
            <span className="text-[10px] font-black uppercase tracking-widest text-rose-400">Offline</span>
            <span className="text-[9px] text-slate-500">No live feed</span>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-slate-900">
            <i className="fas fa-video-slash text-xl text-slate-500" aria-hidden />
            <span className="text-slate-400 text-sm">No feed available</span>
          </div>
        )}
      </div>

      {/* Resize handle */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize bg-white/5 hover:bg-white/10 transition-colors rounded-tl-lg"
        onMouseDown={handleResizeStart}
        aria-label="Resize"
      >
        <div className="absolute bottom-1 right-1 w-2 h-2 border-r border-b border-white/30" />
      </div>
    </div>
  );
};
