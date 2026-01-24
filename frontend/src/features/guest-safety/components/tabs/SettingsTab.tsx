/**
 * Guest Safety - Settings Tab
 * Manage guest safety system settings
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { useGuestSafetyContext } from '../../context/GuestSafetyContext';

export const SettingsTab: React.FC = () => {
  const {
    settings,
    updateSettings,
    resetSettings,
    loading,
    canManageSettings,
  } = useGuestSafetyContext();

  const [localSettings, setLocalSettings] = useState(settings);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
    setIsDirty(false);
  }, [settings]);

  const handleChange = (field: keyof typeof settings, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      [field]: value,
    }));
    setIsDirty(true);
  };

  const handleNotificationChannelChange = (channel: 'inApp' | 'sms' | 'email', checked: boolean) => {
    setLocalSettings(prev => ({
      ...prev,
      notificationChannels: {
        ...prev.notificationChannels,
        [channel]: checked,
      },
    }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    try {
      await updateSettings(localSettings);
      setIsDirty(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleReset = async () => {
    try {
      await resetSettings();
    } catch (error) {
      // Error handled by hook
    }
  };

  if (loading.settings) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-white/5 border-t-blue-500 rounded-full animate-spin shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {!canManageSettings && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center text-amber-400 text-sm font-bold uppercase tracking-widest shadow-lg">
          <i className="fas fa-lock mr-3 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]" />
          Registry Locked: Read-only access active.
        </div>
      )}

      <Card className="glass-card border-glass bg-transparent shadow-console overflow-hidden">
        <CardHeader className="bg-white/5 border-b border-white/5 py-4">
          <CardTitle className="flex items-center text-xl font-black uppercase tracking-tighter text-white">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-900 rounded-lg flex items-center justify-center mr-3 shadow-lg ring-1 ring-white/10" aria-hidden="true">
              <i className="fas fa-cog text-white text-lg" />
            </div>
            Safety Configuration Registry
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-8 px-8 pb-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-[color:var(--text-sub)] ml-1">
                  Response Threshold (MINUTES)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-inner disabled:opacity-50"
                  value={localSettings.alertThreshold}
                  onChange={(e) => handleChange('alertThreshold', parseInt(e.target.value, 10) || 5)}
                  disabled={!canManageSettings}
                />
                <p className="text-[10px] text-slate-500 mt-2 font-medium italic">
                  Critical latency threshold for automated alert escalation
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-[color:var(--text-sub)] ml-1">
                  Auto-Escalation Protocol
                </label>
                <select
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none cursor-pointer shadow-inner disabled:opacity-50"
                  value={localSettings.autoEscalation ? 'enabled' : 'disabled'}
                  onChange={(e) => handleChange('autoEscalation', e.target.value === 'enabled')}
                  disabled={!canManageSettings}
                >
                  <option className="bg-slate-900" value="enabled">Active - Auto-Escalate Alerts</option>
                  <option className="bg-slate-900" value="disabled">Inactive - Manual Review</option>
                </select>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-[color:var(--text-sub)] ml-1">
                  Deployment Sync Channels
                </label>
                <div className="space-y-3 bg-white/5 p-5 rounded-2xl border border-white/5 shadow-inner">
                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-xs font-bold uppercase tracking-widest text-white group-hover:text-blue-400 transition-colors">In-App Registry</span>
                    <input
                      type="checkbox"
                      className="w-5 h-5 bg-white/5 border border-white/20 rounded-lg checked:bg-blue-600 checked:border-transparent transition-all cursor-pointer appearance-none shadow-inner"
                      checked={localSettings.notificationChannels.inApp}
                      onChange={(e) => handleNotificationChannelChange('inApp', e.target.checked)}
                      disabled={!canManageSettings}
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-xs font-bold uppercase tracking-widest text-white group-hover:text-amber-400 transition-colors">SMS Critical Alerts</span>
                    <input
                      type="checkbox"
                      className="w-5 h-5 bg-white/5 border border-white/20 rounded-lg checked:bg-blue-600 checked:border-transparent transition-all cursor-pointer appearance-none shadow-inner"
                      checked={localSettings.notificationChannels.sms}
                      onChange={(e) => handleNotificationChannelChange('sms', e.target.checked)}
                      disabled={!canManageSettings}
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-xs font-bold uppercase tracking-widest text-white group-hover:text-emerald-400 transition-colors">Email Records Sync</span>
                    <input
                      type="checkbox"
                      className="w-5 h-5 bg-white/5 border border-white/20 rounded-lg checked:bg-blue-600 checked:border-transparent transition-all cursor-pointer appearance-none shadow-inner"
                      checked={localSettings.notificationChannels.email}
                      onChange={(e) => handleNotificationChannelChange('email', e.target.checked)}
                      disabled={!canManageSettings}
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-[color:var(--text-sub)] ml-1">
                  Assignment Methodology
                </label>
                <select
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none cursor-pointer shadow-inner disabled:opacity-50"
                  value={localSettings.responseTeamAssignment}
                  onChange={(e) => handleChange('responseTeamAssignment', e.target.value)}
                  disabled={!canManageSettings}
                >
                  <option className="bg-slate-900" value="automatic">Matrix - Fully Automated</option>
                  <option className="bg-slate-900" value="manual">Forensic - Manual Dispatch</option>
                  <option className="bg-slate-900" value="round_robin">Cyclic - Round Robin</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex justify-end space-x-4">
            <Button
              variant="outline"
              className="px-8 font-black uppercase tracking-widest text-[10px] border-white/10 text-[color:var(--text-sub)] hover:bg-white/5 hover:text-white transition-all shadow-lg"
              onClick={handleReset}
              disabled={!canManageSettings || loading.actions}
            >
              Reset Registry
            </Button>
            <Button
              className="px-8 font-black uppercase tracking-widest text-[10px] bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 border-none transition-all active:scale-[0.98]"
              onClick={handleSave}
              disabled={!canManageSettings || !isDirty || loading.actions}
            >
              {loading.actions ? 'Syncing...' : 'Seal Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


