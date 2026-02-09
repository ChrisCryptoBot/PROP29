/**
 * Guest Safety - Settings Tab
 * Manage guest safety system settings
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { useGuestSafetyContext } from '../../context/GuestSafetyContext';
import { cn } from '../../../../utils/cn';

export const SettingsTab: React.FC = () => {
  const {
    settings,
    updateSettings,
    resetSettings,
    loading,
    canManageSettings,
    hardwareDevices,
    hardwareStatus,
    agentMetrics,
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
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4" role="status" aria-label="Loading settings">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest animate-pulse">Loading Settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="page-title">Settings</h2>
          <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic">
            Configure guest safety system settings
          </p>
        </div>
      </div>

      {!canManageSettings && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-md flex items-center text-amber-400 text-sm font-bold uppercase tracking-widest">
          <i className="fas fa-lock mr-3 text-amber-500" />
          Read-only access
        </div>
      )}

      <Card className="bg-slate-900/50 border border-white/5 overflow-hidden">
        <CardHeader className="bg-white/5 border-b border-white/5 py-4">
          <CardTitle className="flex items-center">
            <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center mr-3 border border-white/5" aria-hidden="true">
              <i className="fas fa-cog text-white" />
            </div>
            Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-8 px-8 pb-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] italic text-slate-400 ml-1">
                  Response Threshold (Minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  className="w-full bg-white/5 border border-white/5 rounded-md px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono transition-all disabled:opacity-50"
                  value={localSettings.alertThreshold}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10);
                    if (value >= 1 && value <= 60) {
                      handleChange('alertThreshold', value);
                    }
                  }}
                  disabled={!canManageSettings}
                />
                <p className="text-[10px] text-slate-500 mt-2 font-medium">
                  Incidents exceeding this time will be auto-escalated to critical priority
                </p>
                {localSettings.alertThreshold < 5 && (
                  <p className="text-[9px] text-amber-400 mt-1 font-medium">
                    <i className="fas fa-exclamation-triangle mr-1" />
                    Low threshold may cause frequent escalations
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] italic text-slate-400 ml-1">
                  Auto-Escalation
                </label>
                <select
                  className="w-full bg-white/5 border border-white/5 rounded-md px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 transition-all appearance-none cursor-pointer disabled:opacity-50"
                  value={localSettings.autoEscalation ? 'enabled' : 'disabled'}
                  onChange={(e) => handleChange('autoEscalation', e.target.value === 'enabled')}
                  disabled={!canManageSettings}
                >
                  <option className="bg-slate-900" value="enabled">Enabled - Auto-escalate alerts</option>
                  <option className="bg-slate-900" value="disabled">Disabled - Manual review</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-2 font-medium">
                  {localSettings.autoEscalation 
                    ? 'Incidents will be automatically escalated to critical priority when threshold is exceeded'
                    : 'All incidents require manual review and escalation'}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] italic text-slate-400 ml-1">
                  Notification Channels
                </label>
                <div className="space-y-3 bg-slate-900/30 border border-white/5 p-5 rounded-md">
                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-xs font-bold uppercase tracking-widest text-white group-hover:text-blue-400 transition-colors">In-App</span>
                    <input
                      type="checkbox"
                      className="w-5 h-5 bg-white/5 border border-white/20 rounded-md checked:bg-blue-600 checked:border-transparent transition-all cursor-pointer appearance-none disabled:opacity-50"
                      checked={localSettings.notificationChannels.inApp}
                      onChange={(e) => handleNotificationChannelChange('inApp', e.target.checked)}
                      disabled={!canManageSettings}
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-xs font-bold uppercase tracking-widest text-white group-hover:text-amber-400 transition-colors">SMS</span>
                    <input
                      type="checkbox"
                      className="w-5 h-5 bg-white/5 border border-white/20 rounded-md checked:bg-blue-600 checked:border-transparent transition-all cursor-pointer appearance-none disabled:opacity-50"
                      checked={localSettings.notificationChannels.sms}
                      onChange={(e) => handleNotificationChannelChange('sms', e.target.checked)}
                      disabled={!canManageSettings}
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-xs font-bold uppercase tracking-widest text-white group-hover:text-emerald-400 transition-colors">Email</span>
                    <input
                      type="checkbox"
                      className="w-5 h-5 bg-white/5 border border-white/20 rounded-md checked:bg-blue-600 checked:border-transparent transition-all cursor-pointer appearance-none disabled:opacity-50"
                      checked={localSettings.notificationChannels.email}
                      onChange={(e) => handleNotificationChannelChange('email', e.target.checked)}
                      disabled={!canManageSettings}
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] italic text-slate-400 ml-1">
                  Team Assignment
                </label>
                <select
                  className="w-full bg-white/5 border border-white/5 rounded-md px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 transition-all appearance-none cursor-pointer disabled:opacity-50"
                  value={localSettings.responseTeamAssignment}
                  onChange={(e) => handleChange('responseTeamAssignment', e.target.value)}
                  disabled={!canManageSettings}
                >
                  <option className="bg-slate-900" value="automatic">Automatic</option>
                  <option className="bg-slate-900" value="manual">Manual</option>
                  <option className="bg-slate-900" value="round_robin">Round Robin</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex justify-end space-x-4">
            <Button
              variant="outline"
              className="px-8 font-black uppercase tracking-widest text-[10px] border-white/5 text-slate-400 hover:bg-white/5 hover:text-white transition-all"
              onClick={handleReset}
              disabled={!canManageSettings || loading.actions}
            >
              Reset
            </Button>
            <Button
              className="px-8 font-black uppercase tracking-widest text-[10px] bg-blue-600 hover:bg-blue-700 text-white border-none transition-all active:scale-[0.98]"
              onClick={handleSave}
              disabled={!canManageSettings || !isDirty || loading.actions}
            >
              {loading.actions ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Hardware & Mobile Agent Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hardware Devices Status */}
        <Card className="bg-slate-900/50 border border-white/5">
          <CardHeader className="bg-white/5 border-b border-white/5 py-4">
            <CardTitle className="flex items-center">
              <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center mr-3 border border-white/5" aria-hidden="true">
                <i className="fas fa-microchip text-white" />
              </div>
              Hardware Devices
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 px-6 pb-6">
            {hardwareDevices.length === 0 ? (
              <EmptyState
                icon="fas fa-microchip"
                title="No hardware devices connected"
                description="Hardware devices (panic buttons, sensors, cameras) will appear here once they are configured and connected to the system. Devices can send incident reports automatically."
              />
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-900/30 rounded-md border border-white/5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Total Devices</span>
                  <span className="text-2xl font-black text-white">{hardwareDevices.length}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-900/30 rounded-md border border-white/5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Online</span>
                  <span className="text-2xl font-black text-emerald-400">
                    {hardwareDevices.filter((d: any) => d.status === 'online').length}
                  </span>
                </div>
                {hardwareStatus.lastKnownGoodState && (
                  <div className="p-3 bg-slate-900/30 rounded-md border border-white/5">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Last Known Good</span>
                    <p className="text-xs text-white font-mono mt-1">
                      {hardwareStatus.lastKnownGoodState.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mobile Agent Metrics */}
        <Card className="bg-slate-900/50 border border-white/5">
          <CardHeader className="bg-white/5 border-b border-white/5 py-4">
            <CardTitle className="flex items-center">
<div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center mr-3 border border-white/5" aria-hidden="true">
              <i className="fas fa-mobile-alt text-white" />
              </div>
              Mobile Agents
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 px-6 pb-6">
            {agentMetrics.length === 0 || !agentMetrics[0] ? (
              <EmptyState
                icon="fas fa-mobile-alt"
                title="No mobile agents active"
                description="Mobile agent metrics will appear here once patrol agents start submitting incident reports. Agents with high trust scores can have their submissions auto-approved."
              />
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-900/30 rounded-md border border-white/5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Total Agents</span>
                  <span className="text-2xl font-black text-white">{agentMetrics[0].totalAgents || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-900/30 rounded-md border border-white/5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Active</span>
                  <span className="text-2xl font-black text-emerald-400">{agentMetrics[0].activeAgents || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-900/30 rounded-md border border-white/5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Submissions Today</span>
                  <span className="text-2xl font-black text-white">{agentMetrics[0].submissionsToday || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-900/30 rounded-md border border-white/5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Avg Response Time</span>
                  <span className="text-2xl font-black text-white">{agentMetrics[0].averageResponseTime || 0} min</span>
                </div>
                {agentMetrics[0].trustScoreAverage && (
                  <div className="flex items-center justify-between p-3 bg-slate-900/30 rounded-md border border-white/5">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Avg Trust Score</span>
                    <span className={cn(
                      "text-2xl font-black",
                      (agentMetrics[0].trustScoreAverage || 0) >= 80 ? "text-emerald-400" : 
                      (agentMetrics[0].trustScoreAverage || 0) >= 60 ? "text-amber-400" : "text-white"
                    )}>
                      {Math.round(agentMetrics[0].trustScoreAverage || 0)}%
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};


