import React, { useMemo, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { Progress } from '../../../../components/UI/Progress';
import { useSecurityOperationsContext } from '../../context/SecurityOperationsContext';
import { useGlobalRefresh } from '../../../../contexts/GlobalRefreshContext';
import { cn } from '../../../../utils/cn';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { VideoStreamPlayer } from '../VideoStreamPlayer';
import { CameraLiveModal } from '../modals';
import type { CameraEntry } from '../../types/security-operations.types';

function formatRefreshedAgo(d: Date | null): string {
  if (!d) return '';
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return 'Just now';
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

const FILTER_OPTIONS = ['All Cameras', 'Online Only', 'Offline Only', 'Maintenance'];

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

  const [filter, setFilter] = useState('All Cameras');
  const [expandedCamera, setExpandedCamera] = useState<CameraEntry | null>(null);
  const location = useLocation();

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

  if (loading.cameras && cameras.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-white/5 border-t-blue-500 rounded-full animate-spin shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6" role="main" aria-label="Live View">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Live View</h2>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mt-1 italic opacity-70 text-slate-400">
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

      <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl overflow-hidden">
        <CardHeader className="border-b border-white/5 px-6 py-4">
          <CardTitle className="flex items-center text-xl font-black uppercase tracking-tighter text-white">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center mr-3 shadow-2xl border border-white/5" aria-hidden="true">
              <i className="fas fa-video text-white text-lg" />
            </div>
            Live Camera Feeds
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 px-6 pb-6">
          <div className="flex flex-wrap gap-2 mb-8">
            {FILTER_OPTIONS.map((option) => (
              <Button
                key={option}
                variant={filter === option ? 'glass' : 'outline'}
                className={cn(
                  "font-black uppercase tracking-widest text-[10px] px-6 h-9 transition-all shadow-none",
                  filter === option
                    ? "bg-white/10 border-white/20 text-white"
                    : "border-white/10 text-slate-400 hover:bg-white/5 hover:text-white"
                )}
                onClick={() => setFilter(option)}
              >
                {option}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCameras.map((camera) => (
              <Card
                key={camera.id}
                className={cn(
                  'bg-white/5 border border-white/5 shadow-inner hover:bg-white/[0.08] transition-all cursor-pointer group rounded-2xl overflow-hidden',
                  camera.status === 'offline' && 'ring-1 ring-rose-500/20',
                  camera.status === 'maintenance' && 'ring-1 ring-amber-500/20'
                )}
                onClick={() => {
                  setSelectedCamera(camera);
                  setExpandedCamera(camera);
                }}
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-white uppercase tracking-tighter text-lg group-hover:text-blue-400 transition-colors">{camera.name}</h4>
                    <span className={cn(
                      "px-2.5 py-1 text-[10px] font-black rounded uppercase tracking-widest border",
                      camera.status === 'online' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                        camera.status === 'offline' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' :
                          'text-amber-400 bg-amber-500/10 border-amber-500/20'
                    )}>
                      {camera.status}
                    </span>
                  </div>

                  <div className="space-y-2 bg-black/40 p-3 rounded-xl border border-white/5 shadow-inner">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-[color:var(--text-sub)]">
                      <span className="opacity-50 text-white italic">Location:</span>
                      <span className="text-white">{camera.location}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-[color:var(--text-sub)]">
                      <span className="opacity-50 text-white italic">IP:</span>
                      <span className="text-white">{camera.ipAddress}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-[color:var(--text-sub)]">
                      <span className="opacity-50 text-white italic">Status:</span>
                      <span className="text-white">{camera.uptime || camera.status}</span>
                    </div>
                  </div>
                  {camera.status === 'online' && camera.streamUrl ? (
                    <VideoStreamPlayer
                      src={camera.streamUrl}
                      poster={camera.lastKnownImageUrl}
                      className="w-full h-40 rounded-lg bg-slate-900"
                      errorClassName="w-full h-40 rounded-lg bg-slate-900 flex items-center justify-center text-slate-400 text-sm border border-white/5"
                    />
                  ) : (
                    <div className="w-full h-40 rounded-lg bg-slate-900 flex items-center justify-center">
                      {camera.lastKnownImageUrl ? (
                        <img
                          src={camera.lastKnownImageUrl}
                          alt={`Last known image for ${camera.name}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="text-slate-400 text-sm">Last known image unavailable</div>
                      )}
                    </div>
                  )}
                  <Progress
                    value={camera.status === 'online' ? 100 : camera.status === 'maintenance' ? 60 : 10}
                    className="h-1 bg-white/5"
                  />

                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 font-black uppercase tracking-widest text-[10px] border-white/10 text-[color:var(--text-sub)] hover:bg-white/5 hover:text-white"
                      disabled={camera.actionsDisabled || !canManageCameras}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRecording(camera.id);
                      }}
                    >
                      <i className={cn("fas mr-2", camera.isRecording ? 'fa-stop text-red-500' : 'fa-circle text-red-500/50')} />
                      {camera.isRecording ? 'Stop' : 'Record'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 font-black uppercase tracking-widest text-[10px] border-white/10 text-[color:var(--text-sub)] hover:bg-white/5 hover:text-white"
                      disabled={camera.actionsDisabled || !canManageCameras}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMotionDetection(camera.id);
                      }}
                    >
                      <i className={cn("fas fa-eye mr-2", camera.motionDetectionEnabled ? 'text-blue-400' : 'text-slate-500')} />
                      Motion
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 font-black uppercase tracking-widest text-[10px] border-white/10 text-[color:var(--text-sub)] hover:bg-white/5 hover:text-white"
                      disabled={camera.actionsDisabled || !canManageCameras}
                      onClick={(e) => {
                        e.stopPropagation();
                        reportCameraIssue(camera.id);
                      }}
                    >
                      <i className="fas fa-exclamation-triangle mr-2 text-amber-500" />
                      Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredCameras.length === 0 && (
              <div className="col-span-full">
                <EmptyState
                  icon="fas fa-video-slash"
                  title="No camera feeds"
                  description="No cameras match the current filter. Try “All Cameras” or add cameras in Provisioning."
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <CameraLiveModal
        isOpen={!!expandedCamera}
        onClose={() => setExpandedCamera(null)}
        camera={expandedCamera}
      />
    </div>
  );
};

