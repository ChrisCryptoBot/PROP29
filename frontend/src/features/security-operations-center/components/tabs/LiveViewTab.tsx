import React, { useMemo, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { Progress } from '../../../../components/UI/Progress';
import { useSecurityOperationsContext } from '../../context/SecurityOperationsContext';
import { useCameraModalManager } from '../../context/CameraModalManagerContext';
import { useGlobalRefresh } from '../../../../contexts/GlobalRefreshContext';
import { useSecurityOperationsTelemetry } from '../../hooks/useSecurityOperationsTelemetry';
import { cn } from '../../../../utils/cn';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { VideoStreamPlayer } from '../VideoStreamPlayer';
import { CameraWall } from '../CameraWall/CameraWall';
import { useCameraWallLayout } from '../../context/CameraWallLayoutContext';
import type { CameraEntry } from '../../types/security-operations.types';

function formatRefreshedAgo(d: Date | null): string {
  if (!d) return '';
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return 'Just now';
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

const FILTER_OPTIONS = ['All Cameras', 'Online Only', 'Offline Only', 'Maintenance'];

/** How many cameras to show at once. User can choose 1, 2, 4, 6, 9, 12, or 16. */
const GRID_SIZE_OPTIONS = [1, 2, 4, 6, 9, 12, 16] as const;
type GridSize = typeof GRID_SIZE_OPTIONS[number];

/** Grid columns for each size: 1→1, 2→2, 4→2, 6→3, 9→3, 12→4, 16→4 */
function getGridCols(size: GridSize): number {
  if (size <= 1) return 1;
  if (size <= 2) return 2;
  if (size <= 4) return 2;
  if (size <= 6) return 3;
  if (size <= 9) return 3;
  if (size <= 12) return 4;
  return 4;
}

/** Visual layout: [gridSize, cols, rows] for layout picker icons */
const LAYOUT_GRIDS: { size: GridSize; cols: number; rows: number }[] = [
  { size: 1, cols: 1, rows: 1 },
  { size: 2, cols: 2, rows: 1 },
  { size: 4, cols: 2, rows: 2 },
  { size: 6, cols: 2, rows: 3 },
  { size: 9, cols: 3, rows: 3 },
  { size: 12, cols: 3, rows: 4 },
  { size: 16, cols: 4, rows: 4 },
];

export const LiveViewTab: React.FC = () => {
  const {
    cameras,
    metrics,
    loading,
    setSelectedCamera,
    toggleRecording,
    toggleMotionDetection,
    reportCameraIssue,
    canManageCameras,
  } = useSecurityOperationsContext();
  const { lastRefreshedAt } = useGlobalRefresh();
  const { openModal, isModalOpen } = useCameraModalManager();
  const { trackAction } = useSecurityOperationsTelemetry();
  const { addTile, tiles } = useCameraWallLayout();

  const [filter, setFilter] = useState('All Cameras');
  const [viewMode, setViewMode] = useState<'grid' | 'wall'>('grid');
  const [gridSize, setGridSize] = useState<GridSize>(4);
  const [page, setPage] = useState(0);
  const [selectedCameraIds, setSelectedCameraIds] = useState<Set<string>>(new Set());
  const location = useLocation();

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    setPage(0);
    trackAction('filter_change', 'camera', { filter: newFilter });
  };

  const handleGridSizeChange = (size: GridSize) => {
    setGridSize(size);
    setPage(0);
    trackAction('grid_size_change', 'camera', { gridSize: size });
  };

  const toggleCameraSelection = (cameraId: string) => {
    setSelectedCameraIds((prev) => {
      const allIds = filteredCameras.map((c) => c.id);
      const showAll = prev.size === 0;
      const isInSelection = showAll || prev.has(cameraId);
      if (isInSelection) {
        if (showAll) {
          const next = new Set(allIds.filter((id) => id !== cameraId));
          return next;
        }
        const next = new Set(prev);
        next.delete(cameraId);
        return next;
      }
      const next = new Set(prev);
      next.add(cameraId);
      return next;
    });
    setPage(0);
  };

  const selectAllCameras = () => {
    setSelectedCameraIds(new Set(filteredCameras.map((c) => c.id)));
    setPage(0);
  };

  const clearCameraSelection = () => {
    setSelectedCameraIds(new Set());
    setPage(0);
  };

  const handleOpenModal = (camera: CameraEntry) => {
    setSelectedCamera(camera);
    openModal(camera);
    trackAction('open_modal', 'camera', { cameraId: camera.id, cameraName: camera.name });
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cameraId = params.get('cameraId');
    if (!cameraId || cameras.length === 0) return;
    const camera = cameras.find((item) => item.id === cameraId);
    if (camera) {
      setSelectedCamera(camera);
    }
  }, [cameras, location.search, setSelectedCamera]);

  const filteredCameras = useMemo(() => {
    switch (filter) {
      case 'Online Only':
        return cameras.filter((camera) => camera.status === 'online');
      case 'Offline Only':
        return cameras.filter((camera) => camera.status === 'offline');
      case 'Maintenance':
        return cameras.filter((camera) => camera.status === 'maintenance');
      default:
        return cameras;
    }
  }, [cameras, filter]);

  const displayCameras = useMemo(() => {
    if (selectedCameraIds.size === 0) return filteredCameras;
    return filteredCameras.filter((c) => selectedCameraIds.has(c.id));
  }, [filteredCameras, selectedCameraIds]);

  const totalCameras = displayCameras.length;
  const totalPages = Math.max(1, Math.ceil(totalCameras / gridSize));
  const currentPage = Math.min(page, totalPages - 1);
  const camerasOnPage = displayCameras.slice(
    currentPage * gridSize,
    (currentPage + 1) * gridSize
  );
  const gridCols = getGridCols(gridSize);

  if (loading.cameras && cameras.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" role="status" aria-label="Loading cameras" />
        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest animate-pulse">Loading Cameras...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" role="main" aria-label="Live View">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-black text-[color:var(--text-main)] uppercase tracking-tighter">Live View</h2>
          <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic opacity-70">
            Real-time camera feeds and metrics
          </p>
        </div>
        {lastRefreshedAt && (
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest" aria-live="polite">
            Data as of {lastRefreshedAt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })} · Refreshed {formatRefreshedAgo(lastRefreshedAt)}
          </p>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" role="group" aria-label="Camera metrics">
        <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl group" role="article">
          <CardContent className="pt-6 px-6 pb-6 relative">
            <div className="absolute top-4 right-4">
              <span className="px-2 py-0.5 text-[9px] font-black tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded uppercase">LIVE</span>
            </div>
            <div className="flex items-center justify-between mb-4 mt-2">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5 group-hover:scale-110 transition-transform" aria-hidden="true">
                <i className="fas fa-check-circle text-white text-lg" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Online</p>
              <h3 className="text-3xl font-black text-white">{metrics.online}</h3>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-slate-400">Operational</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl group" role="article">
          <CardContent className="pt-6 px-6 pb-6 relative">
            <div className="absolute top-4 right-4">
              <span className="px-2 py-0.5 text-[9px] font-black tracking-widest text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded uppercase">OFF</span>
            </div>
            <div className="flex items-center justify-between mb-4 mt-2">
              <div className="w-12 h-12 bg-gradient-to-br from-rose-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5 group-hover:scale-110 transition-transform" aria-hidden="true">
                <i className="fas fa-times-circle text-white text-lg" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Offline</p>
              <h3 className="text-3xl font-black text-white">{metrics.offline}</h3>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-slate-400">No signal</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl group" role="article">
          <CardContent className="pt-6 px-6 pb-6 relative">
            <div className="absolute top-4 right-4">
              <span className="px-2 py-0.5 text-[9px] font-black tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded uppercase">MNT</span>
            </div>
            <div className="flex items-center justify-between mb-4 mt-2">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5 group-hover:scale-110 transition-transform" aria-hidden="true">
                <i className="fas fa-tools text-white text-lg" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Maintenance</p>
              <h3 className="text-3xl font-black text-white">{metrics.maintenance}</h3>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-slate-400">Service</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl group" role="article">
          <CardContent className="pt-6 px-6 pb-6 relative">
            <div className="absolute top-4 right-4">
              <span className="px-2 py-0.5 text-[9px] font-black tracking-widest text-red-400 bg-red-500/10 border border-red-500/20 rounded uppercase">REC</span>
            </div>
            <div className="flex items-center justify-between mb-4 mt-2">
              <div className="w-12 h-12 bg-gradient-to-br from-red-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5 group-hover:scale-110 transition-transform" aria-hidden="true">
                <i className="fas fa-circle text-white text-xs animate-pulse" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Recording</p>
              <h3 className="text-3xl font-black text-white">{metrics.recording}</h3>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-slate-400">Active</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {viewMode === 'wall' ? (
        <div className="h-[calc(100vh-400px)] min-h-[600px]">
          <CameraWall cameras={filteredCameras} onSwitchToGrid={() => setViewMode('grid')} />
        </div>
      ) : (
        <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl overflow-hidden">
          <CardHeader className="border-b border-white/5 px-6 py-4">
            <CardTitle className="flex items-center justify-between text-xl font-black uppercase tracking-tighter text-white">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center mr-3 shadow-2xl border border-white/5" aria-hidden="true">
                  <i className="fas fa-video text-white text-lg" />
                </div>
                Live Camera Feeds
              </div>
              <Button
                size="sm"
                variant="glass"
                onClick={() => {
                  filteredCameras.forEach(camera => {
                    addTile(camera.id, camera);
                    trackAction('add_to_wall', 'camera', { cameraId: camera.id });
                  });
                  setViewMode('wall');
                }}
                className="text-[10px] font-black uppercase tracking-widest"
                disabled={filteredCameras.length === 0}
                title={`Add all ${filteredCameras.length} camera${filteredCameras.length !== 1 ? 's' : ''} to the wall and switch to Wall view`}
              >
                <i className="fas fa-border-all mr-2" />
                Add All to Wall
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 px-6 pb-6">
          <div className="flex flex-wrap gap-2 mb-6">
            {FILTER_OPTIONS.map((option) => (
              <Button
                key={option}
                variant={filter === option ? 'glass' : 'outline'}
                className={cn(
                  "font-black uppercase tracking-widest text-[10px] px-6 h-9 transition-all shadow-none",
                  filter === option
                    ? "bg-white/10 border-white/20 text-white"
                    : "border-white/5 text-slate-400 hover:bg-white/5 hover:text-white"
                )}
                onClick={() => setFilter(option)}
              >
                {option}
              </Button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-white/5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Layout:</span>
              <div className="flex flex-wrap gap-2 items-center">
                {LAYOUT_GRIDS.map(({ size, cols, rows }) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => handleGridSizeChange(size)}
                    title={`${size} camera${size === 1 ? '' : 's'} (${cols}×${rows})`}
                    className={cn(
                      'rounded border p-1.5 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50',
                      gridSize === size
                        ? 'border-blue-500/50 bg-blue-500/20 text-white'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:bg-white/10'
                    )}
                    aria-label={`${size} camera grid`}
                  >
                    <span
                      className="inline-grid gap-px w-8 h-6"
                      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}
                    >
                      {Array.from({ length: size }).map((_, i) => (
                        <span key={i} className="bg-current opacity-60 rounded-sm min-w-[2px] min-h-[2px]" />
                      ))}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Cameras to show:</span>
              <div className="flex flex-wrap gap-2 items-center">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-[10px] font-black uppercase tracking-widest h-8"
                  onClick={selectAllCameras}
                  disabled={filteredCameras.length === 0}
                >
                  Select all
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-[10px] font-black uppercase tracking-widest h-8"
                  onClick={clearCameraSelection}
                  disabled={selectedCameraIds.size === 0}
                >
                  Clear
                </Button>
                {selectedCameraIds.size > 0 && (
                  <span className="text-[10px] text-slate-400 font-bold">
                    {selectedCameraIds.size} selected
                  </span>
                )}
              </div>
            </div>
          </div>

          {filteredCameras.length > 0 && (
            <div className="mb-6 p-3 bg-white/5 rounded-xl border border-white/5 max-h-32 overflow-y-auto">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Select which cameras appear in the grid. Uncheck to hide; Clear = show all.</p>
              <div className="flex flex-wrap gap-2">
                {filteredCameras.map((camera) => {
                  const isSelected = selectedCameraIds.size === 0 || selectedCameraIds.has(camera.id);
                  return (
                    <label
                      key={camera.id}
                      className={cn(
                        'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-all text-[10px] font-bold uppercase tracking-tight',
                        isSelected
                          ? 'bg-blue-500/20 border-blue-500/30 text-white'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleCameraSelection(camera.id)}
                        className="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500/30"
                      />
                      <span className="truncate max-w-[140px]">{camera.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div
            className={cn(
              'grid min-h-[400px]',
              gridCols === 1 && 'grid-cols-1',
              gridCols === 2 && 'grid-cols-1 md:grid-cols-2',
              gridCols === 3 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
              gridCols === 4 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
              'gap-px bg-white/5'
            )}
          >
            {camerasOnPage.map((camera) => (
              <div
                key={camera.id}
                className={cn(
                  'relative flex flex-col bg-slate-900 overflow-hidden cursor-pointer group border border-white/5 hover:ring-2 hover:ring-blue-500/30 focus-within:ring-2 focus-within:ring-blue-500/50',
                  camera.status === 'offline' && 'ring-1 ring-rose-500/20',
                  camera.status === 'maintenance' && 'ring-1 ring-amber-500/20'
                )}
                onClick={() => handleOpenModal(camera)}
              >
                <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-2 py-1 bg-black/60 backdrop-blur-sm border-b border-white/5">
                  <span className="text-[10px] font-black text-white uppercase tracking-tighter truncate">{camera.name}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className={cn(
                      'px-1.5 py-0.5 text-[9px] font-black rounded uppercase tracking-widest',
                      camera.status === 'online' ? 'text-emerald-400 bg-emerald-500/20' :
                        camera.status === 'offline' ? 'text-rose-400 bg-rose-500/20' :
                          'text-amber-400 bg-amber-500/20'
                    )}>
                      {camera.status === 'online' ? 'LIVE' : camera.status}
                    </span>
                    <button
                      type="button"
                      className="p-1 rounded hover:bg-white/10 text-white/70 hover:text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        addTile(camera.id, camera);
                        trackAction('add_to_wall', 'camera', { cameraId: camera.id });
                      }}
                      title="Add to Camera Wall"
                      aria-label="Add to wall"
                    >
                      <i className="fas fa-border-all text-[10px]" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 min-h-0 flex flex-col pt-8">
                  {camera.status === 'online' && camera.streamUrl ? (
                    <VideoStreamPlayer
                      src={camera.streamUrl}
                      poster={camera.lastKnownImageUrl}
                      className="w-full flex-1 min-h-[120px] object-cover bg-black"
                      errorClassName="w-full flex-1 min-h-[120px] flex items-center justify-center text-slate-400 text-xs bg-slate-900"
                      showTimestamp={true}
                      timestampPosition="top-right"
                    />
                  ) : (
                    <div className="w-full flex-1 min-h-[120px] flex items-center justify-center relative bg-slate-900">
                      {camera.lastKnownImageUrl || camera.lastKnownState?.imageUrl ? (
                        <>
                          <img
                            src={camera.lastKnownImageUrl || camera.lastKnownState?.imageUrl}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover opacity-60"
                          />
                          {camera.lastKnownState && (
                            <span className="absolute top-1 left-1 bg-amber-500/20 border border-amber-500/40 rounded px-1.5 py-0.5 text-[8px] font-black uppercase text-amber-400">
                              Last known
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-slate-500 text-xs">No feed</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex border-t border-white/5 bg-black/40">
                  <button
                    type="button"
                    className="flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:bg-white/5 hover:text-white border-r border-white/5 disabled:opacity-50"
                    disabled={camera.actionsDisabled || !canManageCameras}
                    onClick={(e) => { e.stopPropagation(); toggleRecording(camera.id); }}
                  >
                    <i className={cn('fas mr-1', camera.isRecording ? 'fa-stop text-red-500' : 'fa-circle text-red-500/50')} /> Rec
                  </button>
                  <button
                    type="button"
                    className="flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:bg-white/5 hover:text-white border-r border-white/5 disabled:opacity-50"
                    disabled={camera.actionsDisabled || !canManageCameras}
                    onClick={(e) => { e.stopPropagation(); toggleMotionDetection(camera.id); }}
                  >
                    <i className={cn('fas fa-eye mr-1 text-[8px]', camera.motionDetectionEnabled ? 'text-blue-400' : 'text-slate-500')} /> Motion
                  </button>
                  <button
                    type="button"
                    className="flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:bg-white/5 hover:text-white disabled:opacity-50"
                    disabled={camera.actionsDisabled || !canManageCameras}
                    onClick={(e) => { e.stopPropagation(); reportCameraIssue(camera.id); }}
                  >
                    <i className="fas fa-exclamation-triangle mr-1 text-amber-500 text-[8px]" /> Report
                  </button>
                </div>
              </div>
            ))}
            {camerasOnPage.length === 0 && (
              <div className="col-span-full">
                <EmptyState
                  icon="fas fa-video-slash"
                  title="No camera feeds"
                  description="No cameras match the current filter. Try “All Cameras” or add cameras in Provisioning."
                />
              </div>
            )}
          </div>
          {totalPages > 1 && (
            <div className="mt-6 pt-4 border-t border-white/5 flex justify-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Showing {currentPage * gridSize + 1}&ndash;{Math.min((currentPage + 1) * gridSize, totalCameras)} of {totalCameras} cameras
              </span>
            </div>
          )}
        </CardContent>
      </Card>
      )}
    </div>
  );
};

