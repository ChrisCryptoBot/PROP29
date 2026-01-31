import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { useSecurityOperationsContext } from '../../context/SecurityOperationsContext';
import { useSecurityOperationsTelemetry } from '../../hooks/useSecurityOperationsTelemetry';
import apiService from '../../../../services/ApiService';
import { showSuccess, showError } from '../../../../utils/toast';
import { cn } from '../../../../utils/cn';

export const SettingsTab: React.FC = () => {
  const { settings, loading, updateSettings, canUpdateSettings } = useSecurityOperationsContext();
  const { trackAction } = useSecurityOperationsTelemetry();
  const [localSettings, setLocalSettings] = useState(settings);
  const [isDirty, setIsDirty] = useState(false);
  const [testConnectionLoading, setTestConnectionLoading] = useState(false);

  const handleTestConnection = useCallback(async () => {
    setTestConnectionLoading(true);
    trackAction('test_connection', 'settings');
    try {
      await apiService.get('/security-operations/cameras');
      showSuccess('Connection OK. Security-operations API is reachable.');
    } catch {
      showError('Connection failed. Check network and API availability.');
    } finally {
      setTestConnectionLoading(false);
    }
  }, [trackAction]);

  useEffect(() => {
    setLocalSettings(settings);
    setIsDirty(false);
  }, [settings]);

  const handleChange = <K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    try {
      await updateSettings(localSettings);
      setIsDirty(false);
    } catch (error) {
      // handled by hook
    }
  };

  if (loading.settings) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" role="status" aria-label="Loading settings" />
        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest animate-pulse">Loading Settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" role="main" aria-label="Settings">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-black text-[color:var(--text-main)] uppercase tracking-tighter">Settings</h2>
          <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic opacity-70">
            Recording, retention, and notifications
          </p>
        </div>
        <Button
          variant="outline"
          className={cn(
            'h-10 border-white/5 hover:bg-white/10 text-slate-400 hover:text-white font-black uppercase tracking-widest px-6 shadow-none',
            testConnectionLoading && 'opacity-70'
          )}
          onClick={handleTestConnection}
          disabled={testConnectionLoading}
          aria-label="Test security-operations API connection"
        >
          <i className={cn('fas mr-2', testConnectionLoading ? 'fa-spinner fa-spin' : 'fa-plug')} aria-hidden="true" />
          Test connection
        </Button>
      </div>
      <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl overflow-hidden">
        <CardHeader className="border-b border-white/5 px-6 py-4">
          <CardTitle className="flex items-center text-xl font-black uppercase tracking-tighter text-white">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center mr-3 shadow-2xl border border-white/5" aria-hidden="true">
              <i className="fas fa-cog text-white text-lg" />
            </div>
            System Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          {!canUpdateSettings && (
            <div className="mb-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-200 text-[10px] font-black uppercase tracking-widest flex items-center">
              <i className="fas fa-lock mr-3 text-amber-500 text-sm" />
              Admin Lock Active. Settings are read-only.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-50 text-white">Recording Quality</label>
              <select
                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none cursor-pointer disabled:opacity-30"
                value={localSettings.recordingQuality}
                onChange={(e) => handleChange('recordingQuality', e.target.value)}
                disabled={!canUpdateSettings}
              >
                <option value="4K" className="bg-[#1a1c1e] text-white">4K Ultra HD</option>
                <option value="1080p" className="bg-[#1a1c1e] text-white">1080p Full HD</option>
                <option value="720p" className="bg-[#1a1c1e] text-white">720p Standard</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-50 text-white">Archive Period</label>
              <select
                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none cursor-pointer disabled:opacity-30"
                value={localSettings.recordingDuration}
                onChange={(e) => handleChange('recordingDuration', e.target.value)}
                disabled={!canUpdateSettings}
              >
                <option value="7 days" className="bg-[#1a1c1e] text-white">7 Days</option>
                <option value="30 days" className="bg-[#1a1c1e] text-white">30 Days</option>
                <option value="90 days" className="bg-[#1a1c1e] text-white">90 Days</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-50 text-white">Motion Sensitivity</label>
              <select
                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none cursor-pointer disabled:opacity-30"
                value={localSettings.motionSensitivity}
                onChange={(e) => handleChange('motionSensitivity', e.target.value)}
                disabled={!canUpdateSettings}
              >
                <option value="Low" className="bg-[#1a1c1e] text-white">Low</option>
                <option value="Medium" className="bg-[#1a1c1e] text-white">Medium</option>
                <option value="High" className="bg-[#1a1c1e] text-white">High</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-50 text-white">Retention Policy</label>
              <select
                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none cursor-pointer disabled:opacity-30"
                value={localSettings.storageRetention}
                onChange={(e) => handleChange('storageRetention', e.target.value)}
                disabled={!canUpdateSettings}
              >
                <option value="30 days" className="bg-[#1a1c1e] text-white">30 Days</option>
                <option value="90 days" className="bg-[#1a1c1e] text-white">90 Days</option>
                <option value="180 days" className="bg-[#1a1c1e] text-white">180 Days</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10 p-6 bg-white/5 rounded-2xl border border-white/5 shadow-inner">
            <label className="flex items-center space-x-3 cursor-pointer group">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-white/20 bg-white/5 transition-all checked:border-blue-500 checked:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-30"
                  checked={localSettings.autoDelete}
                  onChange={(e) => handleChange('autoDelete', e.target.checked)}
                  disabled={!canUpdateSettings}
                />
                <i className="fas fa-check absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-white/70 group-hover:text-white transition-colors">Auto-delete footage</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer group">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-white/20 bg-white/5 transition-all checked:border-blue-500 checked:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-30"
                  checked={localSettings.notifyOnMotion}
                  onChange={(e) => handleChange('notifyOnMotion', e.target.checked)}
                  disabled={!canUpdateSettings}
                />
                <i className="fas fa-check absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-white/70 group-hover:text-white transition-colors">Motion alerts</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer group">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-white/20 bg-white/5 transition-all checked:border-blue-500 checked:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-30"
                  checked={localSettings.notifyOnOffline}
                  onChange={(e) => handleChange('notifyOnOffline', e.target.checked)}
                  disabled={!canUpdateSettings}
                />
                <i className="fas fa-check absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-white/70 group-hover:text-white transition-colors">Offline alerts</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer group">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-white/20 bg-white/5 transition-all checked:border-blue-500 checked:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-30"
                  checked={localSettings.nightVisionAuto}
                  onChange={(e) => handleChange('nightVisionAuto', e.target.checked)}
                  disabled={!canUpdateSettings}
                />
                <i className="fas fa-check absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-white/70 group-hover:text-white transition-colors">Auto night vision</span>
            </label>
          </div>

          <div className="flex justify-end pt-10 border-t border-white/5 mt-10">
            <Button
              variant="glass"
              className="bg-white/10 border-white/20 text-white font-black uppercase tracking-widest text-[10px] px-10 h-11 shadow-none hover:bg-white/20"
              onClick={handleSave}
              disabled={!canUpdateSettings || !isDirty || loading.settings}
            >
              {loading.settings ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


