import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { useSecurityOperationsContext } from '../../context/SecurityOperationsContext';
import { EmptyState } from '../../../../components/UI/EmptyState';

export const ProvisioningTab: React.FC = () => {
  const { cameras, createCamera, deleteCamera, loading, canManageCameras } = useSecurityOperationsContext();
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    ipAddress: '',
    streamUrl: '',
    username: '',
    password: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.name || !formData.location || !formData.ipAddress || !formData.streamUrl) return;

    try {
      await createCamera({
        name: formData.name,
        location: formData.location,
        ipAddress: formData.ipAddress,
        streamUrl: formData.streamUrl,
        credentials: {
          username: formData.username || undefined,
          password: formData.password || undefined,
        },
      });
      setFormData({
        name: '',
        location: '',
        ipAddress: '',
        streamUrl: '',
        username: '',
        password: '',
      });
    } catch (error) {
      // handled by hook
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
          <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Provisioning</h2>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mt-1 italic opacity-70 text-slate-400">
            Add and manage cameras
          </p>
        </div>
      </div>
      <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl overflow-hidden">
        <CardHeader className="border-b border-white/5 px-6 py-4">
          <CardTitle className="flex items-center text-xl font-black uppercase tracking-tighter text-white">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center mr-3 shadow-2xl border border-white/5" aria-hidden="true">
              <i className="fas fa-plus text-white text-lg" />
            </div>
            Add Camera
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-50 text-white">Camera Name</label>
                <input
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-white/10"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g. North Lobby Entrance"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-50 text-white">Location</label>
                <input
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-white/10"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="e.g. MAIN ENTRANCE LOBBY"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-50 text-white">IP Address</label>
                <input
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-white/10"
                  value={formData.ipAddress}
                  onChange={(e) => handleChange('ipAddress', e.target.value)}
                  placeholder="192.168.1.100"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-50 text-white">Stream URL</label>
                <input
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-white/10"
                  value={formData.streamUrl}
                  onChange={(e) => handleChange('streamUrl', e.target.value)}
                  placeholder="rtsp://camera/stream or https://...m3u8"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-50 text-white">Username</label>
                <input
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-white/10"
                  value={formData.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-50 text-white">Password</label>
                <input
                  type="password"
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-white/10"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                />
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

      <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl overflow-hidden">
        <CardHeader className="border-b border-white/5 px-6 py-4">
          <CardTitle className="flex items-center text-xl font-black uppercase tracking-tighter text-white">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center mr-3 shadow-2xl border border-white/5" aria-hidden="true">
              <i className="fas fa-list text-white text-lg" />
            </div>
            Camera List
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {cameras.map((camera) => (
              <div key={camera.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl group hover:bg-white/[0.08] transition-all">
                <div className="space-y-1">
                  <div className="font-black text-white uppercase tracking-tighter text-base group-hover:text-blue-400 transition-colors">{camera.name}</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">{camera.location} · <span className="text-white/30 italic">{camera.ipAddress}</span></div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="font-black uppercase tracking-widest text-[10px] border-rose-500/20 text-rose-400 hover:bg-rose-500/10 h-9 px-6 transition-all"
                  onClick={() => deleteCamera(camera.id)}
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
    </div>
  );
};


