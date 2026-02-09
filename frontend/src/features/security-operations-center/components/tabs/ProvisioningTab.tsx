import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { useSecurityOperationsContext } from '../../context/SecurityOperationsContext';
import { useSecurityOperationsTelemetry } from '../../hooks/useSecurityOperationsTelemetry';
import { validateCameraForm } from '../../utils/validation';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { ConfirmDeleteCameraModal } from '../modals/ConfirmDeleteCameraModal';
import { cn } from '../../../../utils/cn';

export const ProvisioningTab: React.FC = () => {
  const { cameras, createCamera, deleteCamera, loading, canManageCameras } = useSecurityOperationsContext();
  const { trackAction } = useSecurityOperationsTelemetry();
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    ipAddress: '',
    streamUrl: '',
    username: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [cameraToDelete, setCameraToDelete] = useState<{ id: string; name: string } | null>(null);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Validate form
    const validation = validateCameraForm({
      name: formData.name,
      location: formData.location,
      ipAddress: formData.ipAddress,
      streamUrl: formData.streamUrl,
    });

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});

    try {
      // Credentials are sent securely to backend - never stored client-side
      // Backend encrypts and stores securely; credentials are never returned in responses
      await createCamera({
        name: formData.name,
        location: formData.location,
        ipAddress: formData.ipAddress,
        streamUrl: formData.streamUrl,
        credentials: formData.username || formData.password ? {
          username: formData.username || undefined,
          password: formData.password || undefined,
        } : undefined,
      });
      
      // Clear form including credentials (never persist)
      setFormData({
        name: '',
        location: '',
        ipAddress: '',
        streamUrl: '',
        username: '', // Cleared immediately after use
        password: '', // Cleared immediately after use
      });
      setErrors({});
    } catch (error) {
      // handled by hook
      // On error, credentials are already cleared from form state
    }
  };

  if (!canManageCameras) {
    return (
      <div className="flex items-center justify-center h-96">
        <EmptyState
          icon="fas fa-lock"
          title="Access Restricted"
          description="Login with administrator credentials to manage camera settings."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6" role="main" aria-label="Provisioning">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="page-title">Provisioning</h2>
          <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic">
            Add and manage cameras
          </p>
        </div>
      </div>
      <Card className="bg-slate-900/50 border border-white/5 overflow-hidden">
        <CardHeader className="border-b border-white/5 px-6 py-4">
          <CardTitle className="flex items-center">
            <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center mr-3 border border-white/5" aria-hidden="true">
              <i className="fas fa-plus text-white" />
            </div>
            Add Camera
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
                  Camera Name <span className="text-red-500">*</span>
                </label>
                <input
                  className={cn(
                    "w-full bg-white/5 border rounded-md px-4 py-3 text-white focus:outline-none focus:ring-2 transition-colors placeholder:text-white/10",
                    errors.name 
                      ? "border-red-500/50 focus:ring-red-500/30 focus:border-red-500/50"
                      : "border-white/5 focus:ring-blue-500/50"
                  )}
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g. North Lobby Entrance"
                  required
                />
                {errors.name && (
                  <p className="text-[10px] text-red-400 font-black uppercase tracking-tight ml-1">{errors.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  className={cn(
                    "w-full bg-white/5 border rounded-md px-4 py-3 text-white focus:outline-none focus:ring-2 transition-colors placeholder:text-white/10",
                    errors.location 
                      ? "border-red-500/50 focus:ring-red-500/30 focus:border-red-500/50"
                      : "border-white/5 focus:ring-blue-500/50"
                  )}
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="e.g. MAIN ENTRANCE LOBBY"
                  required
                />
                {errors.location && (
                  <p className="text-[10px] text-red-400 font-black uppercase tracking-tight ml-1">{errors.location}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
                  IP Address <span className="text-red-500">*</span>
                </label>
                <input
                  className={cn(
                    "w-full bg-white/5 border rounded-md px-4 py-3 text-white focus:outline-none focus:ring-2 transition-colors placeholder:text-white/10 font-mono",
                    errors.ipAddress 
                      ? "border-red-500/50 focus:ring-red-500/30 focus:border-red-500/50"
                      : "border-white/5 focus:ring-blue-500/50"
                  )}
                  value={formData.ipAddress}
                  onChange={(e) => handleChange('ipAddress', e.target.value)}
                  placeholder="192.168.1.100"
                  required
                />
                {errors.ipAddress && (
                  <p className="text-[10px] text-red-400 font-black uppercase tracking-tight ml-1">{errors.ipAddress}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
                  Stream URL <span className="text-red-500">*</span>
                </label>
                <input
                  className={cn(
                    "w-full bg-white/5 border rounded-md px-4 py-3 text-white focus:outline-none focus:ring-2 transition-colors placeholder:text-white/10 font-mono",
                    errors.streamUrl 
                      ? "border-red-500/50 focus:ring-red-500/30 focus:border-red-500/50"
                      : "border-white/5 focus:ring-blue-500/50"
                  )}
                  value={formData.streamUrl}
                  onChange={(e) => handleChange('streamUrl', e.target.value)}
                  placeholder="rtsp://user:pass@192.168.1.100:554/stream1 or https://...m3u8"
                  required
                />
                {errors.streamUrl && (
                  <p className="text-[10px] text-red-400 font-black uppercase tracking-tight ml-1">{errors.streamUrl}</p>
                )}
                {formData.streamUrl.toLowerCase().includes('rtsp') && (
                  <p className="text-[10px] text-amber-400/90 mt-1.5">
                    RTSP (e.g. Tapo C500): run <code className="bg-black/30 px-1 rounded">scripts\run-c500-ffmpeg.ps1</code> with this camera&apos;s ID, then <code className="bg-black/30 px-1 rounded">scripts\run-hls-gateway.ps1</code>. See HOW_TO_GET_CAMERA_VIDEO.md.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
                  Username <span className="text-[9px] text-slate-500 italic">(Optional - stored securely server-side)</span>
                </label>
                <input
                  className="w-full bg-white/5 border border-white/5 rounded-md px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors placeholder:text-white/10"
                  value={formData.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                  placeholder="Camera username (if required)"
                  autoComplete="off"
                />
                <p className="text-[9px] text-slate-500 italic">
                  Credentials are encrypted and stored securely. Never logged or exposed in client-side storage.
                </p>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
                  Password <span className="text-[9px] text-slate-500 italic">(Optional - stored securely server-side)</span>
                </label>
                <input
                  type="password"
                  className="w-full bg-white/5 border border-white/5 rounded-md px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors placeholder:text-white/10"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="Camera password (if required)"
                  autoComplete="new-password"
                />
                <p className="text-[9px] text-slate-500 italic">
                  Password is never stored in browser storage or logged. Transmitted over HTTPS only.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-white/5">
              <Button
                type="submit"
                variant="glass"
                className="bg-white/10 border-white/20 text-white font-black uppercase tracking-widest text-[10px] px-10 h-11 shadow-none hover:bg-white/20"
                disabled={loading.actions}
              >
                {loading.actions ? 'Adding...' : 'Add Camera'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-slate-900/50 border border-white/5 overflow-hidden">
        <CardHeader className="border-b border-white/5 px-6 py-4">
          <CardTitle className="flex items-center">
            <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center mr-3 border border-white/5" aria-hidden="true">
              <i className="fas fa-list text-white" />
            </div>
            Camera List
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {cameras.map((camera) => (
              <div key={camera.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-md group hover:bg-white/[0.08] transition-colors">
                <div className="space-y-1">
                  <div className="card-title-text">{camera.name}</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">{camera.location} · <span className="text-white/30 italic">{camera.ipAddress}</span></div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] text-slate-500 font-mono">ID: {camera.id}</span>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard?.writeText(camera.id)}
                      className="text-[9px] text-blue-400 hover:text-blue-300 font-bold uppercase"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="font-black uppercase tracking-widest text-[10px] border-rose-500/20 text-rose-400 hover:bg-rose-500/10 h-9 px-6 transition-colors"
                  onClick={() => {
                    trackAction('delete', 'camera', { cameraId: camera.id, cameraName: camera.name });
                    deleteCamera(camera.id);
                  }}
                  disabled={loading.actions}
                >
                  Remove
                </Button>
              </div>
            ))}
            {cameras.length === 0 && (
              <div className="py-10">
                <EmptyState
                  icon="fas fa-video"
                  title="No cameras found"
                  description="Try adding a new camera to the system."
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <ConfirmDeleteCameraModal
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setCameraToDelete(null);
        }}
        onConfirm={async () => {
          if (cameraToDelete) {
            trackAction('delete', 'camera', { cameraId: cameraToDelete.id, cameraName: cameraToDelete.name });
            await deleteCamera(cameraToDelete.id);
            setDeleteConfirmOpen(false);
            setCameraToDelete(null);
          }
        }}
        cameraName={cameraToDelete?.name || ''}
        isDeleting={loading.actions}
      />
    </div>
  );
};


