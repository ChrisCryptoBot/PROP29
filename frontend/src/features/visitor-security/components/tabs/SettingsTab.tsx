/**
 * Settings Tab
 * Complete settings configuration for Visitor Security module
 * Includes Mobile Agent, Hardware Integration, and MSO Desktop settings
 * 
 * Gold Standard Compliance:
 * ✅ High-contrast Security Console theme
 * ✅ Production-ready MSO desktop configuration
 * ✅ Mobile agent and hardware integration settings
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { Toggle } from '../../../../components/UI/Toggle';
import { useVisitorContext } from '../../context/VisitorContext';
import { EnhancedVisitorSettings } from '../../types/visitor-security.types';

export const SettingsTab: React.FC = React.memo(() => {
  const { 
    enhancedSettings, 
    updateEnhancedSettings, 
    loading,
    systemConnectivity,
    mobileAgentDevices,
    hardwareDevices
  } = useVisitorContext();

  const [localSettings, setLocalSettings] = useState<EnhancedVisitorSettings | null>(
    enhancedSettings
  );

  React.useEffect(() => {
    if (enhancedSettings) {
      setLocalSettings(enhancedSettings);
    }
  }, [enhancedSettings]);

  const handleSaveSettings = async () => {
    if (!localSettings) return;
    await updateEnhancedSettings(localSettings);
  };

  const updateSetting = (section: keyof EnhancedVisitorSettings, key: string, value: any) => {
    if (!localSettings) return;
    setLocalSettings(prev => {
      if (!prev) return prev;
      const currentSection = prev[section] as Record<string, any>;
      return {
        ...prev,
        [section]: {
          ...currentSection,
          [key]: value
        }
      };
    });
  };

  if (loading.settings && !localSettings) {
    return (
      <div className="text-center py-12">
        <i className="fas fa-spinner fa-spin text-3xl text-[color:var(--text-sub)] mb-4" />
        <p className="text-[color:var(--text-sub)]">Loading system configuration...</p>
      </div>
    );
  }

  if (!localSettings) return null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-[color:var(--text-sub)]">Visitor Security</p>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">System Configuration</h2>
          <p className="text-[11px] text-[color:var(--text-sub)]">
            Mobile agent integration, hardware devices, and MSO desktop deployment settings.
          </p>
        </div>
        
        {/* System Status Indicator */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded">
            <i className="fas fa-mobile-alt text-blue-400 text-xs" />
            <span className="text-[9px] text-blue-300">{mobileAgentDevices.length} Agents</span>
          </div>
          <div className="flex items-center space-x-1 px-2 py-1 bg-orange-500/10 border border-orange-500/20 rounded">
            <i className="fas fa-microchip text-orange-400 text-xs" />
            <span className="text-[9px] text-orange-300">{hardwareDevices.length} Devices</span>
          </div>
          <div className="flex items-center space-x-1 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded">
            <i className={`fas ${systemConnectivity?.network_status === 'online' ? 'fa-wifi' : 'fa-exclamation-triangle'} text-green-400 text-xs`} />
            <span className="text-[9px] text-green-300">{systemConnectivity?.network_status || 'Unknown'}</span>
          </div>
        </div>
      </div>

      {/* Core Visitor Settings */}
      <Card className="glass-card border border-white/5 shadow-2xl">
        <CardHeader>
          <CardTitle className="flex items-center text-xl text-white">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-lg flex items-center justify-center mr-3 shadow-lg border border-white/5">
              <i className="fas fa-users text-white" />
            </div>
            <span className="uppercase tracking-tight">Core Visitor Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  Visitor Data Retention (Days)
                </label>
                <input
                  type="number"
                  min="30"
                  max="3650"
                  value={localSettings.visitor_retention_days}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    visitor_retention_days: parseInt(e.target.value) || 365
                  })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white text-sm font-mono focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  Auto Check-out (Hours)
                </label>
                <input
                  type="number"
                  min="1"
                  max="72"
                  value={localSettings.auto_checkout_hours}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    auto_checkout_hours: parseInt(e.target.value) || 24
                  })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white text-sm font-mono focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Require Photo Capture</span>
                <Toggle
                  checked={localSettings.require_photo}
                  onChange={(checked) => setLocalSettings({
                    ...localSettings,
                    require_photo: checked
                  })}
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Require Host Approval</span>
                <Toggle
                  checked={localSettings.require_host_approval}
                  onChange={(checked) => setLocalSettings({
                    ...localSettings,
                    require_host_approval: checked
                  })}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Agent Integration Settings */}
      <Card className="glass-card border border-white/5 shadow-2xl">
        <CardHeader>
          <CardTitle className="flex items-center text-xl text-white">
            <div className="w-10 h-10 bg-gradient-to-br from-green-600/80 to-slate-900 rounded-lg flex items-center justify-center mr-3 shadow-lg border border-white/5">
              <i className="fas fa-mobile-alt text-white" />
            </div>
            <span className="uppercase tracking-tight">Mobile Agent Integration</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Core Configuration</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Mobile Agent System Enabled</span>
                  <Toggle
                    checked={localSettings.mobile_agent_settings.enabled}
                    onChange={(checked) => updateSetting('mobile_agent_settings', 'enabled', checked)}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Require GPS Location</span>
                  <Toggle
                    checked={localSettings.mobile_agent_settings.require_location}
                    onChange={(checked) => updateSetting('mobile_agent_settings', 'require_location', checked)}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Auto-Sync Enabled</span>
                  <Toggle
                    checked={localSettings.mobile_agent_settings.auto_sync_enabled}
                    onChange={(checked) => updateSetting('mobile_agent_settings', 'auto_sync_enabled', checked)}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Allow Bulk Operations</span>
                  <Toggle
                    checked={localSettings.mobile_agent_settings.allow_bulk_operations}
                    onChange={(checked) => updateSetting('mobile_agent_settings', 'allow_bulk_operations', checked)}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Performance Settings</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    Offline Mode Duration (Hours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={localSettings.mobile_agent_settings.offline_mode_duration_hours}
                    onChange={(e) => updateSetting('mobile_agent_settings', 'offline_mode_duration_hours', parseInt(e.target.value) || 8)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white text-sm font-mono focus:ring-2 focus:ring-green-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    Photo Quality
                  </label>
                  <select
                    value={localSettings.mobile_agent_settings.photo_quality}
                    onChange={(e) => updateSetting('mobile_agent_settings', 'photo_quality', e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white text-sm font-mono focus:ring-2 focus:ring-green-500/20"
                  >
                    <option value="low" className="bg-slate-900">Low (Faster sync)</option>
                    <option value="medium" className="bg-slate-900">Medium (Balanced)</option>
                    <option value="high" className="bg-slate-900">High (Best quality)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hardware Device Integration Settings */}
      <Card className="glass-card border border-white/5 shadow-2xl">
        <CardHeader>
          <CardTitle className="flex items-center text-xl text-white">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-600/80 to-slate-900 rounded-lg flex items-center justify-center mr-3 shadow-lg border border-white/5">
              <i className="fas fa-microchip text-white" />
            </div>
            <span className="uppercase tracking-tight">Hardware Device Integration</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Device Types</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Card Reader Integration</span>
                  <Toggle
                    checked={localSettings.hardware_settings.card_reader_enabled}
                    onChange={(checked) => updateSetting('hardware_settings', 'card_reader_enabled', checked)}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Camera System Integration</span>
                  <Toggle
                    checked={localSettings.hardware_settings.camera_integration_enabled}
                    onChange={(checked) => updateSetting('hardware_settings', 'camera_integration_enabled', checked)}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Badge Printer Integration</span>
                  <Toggle
                    checked={localSettings.hardware_settings.printer_integration_enabled}
                    onChange={(checked) => updateSetting('hardware_settings', 'printer_integration_enabled', checked)}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Auto Badge Printing</span>
                  <Toggle
                    checked={localSettings.hardware_settings.auto_badge_printing}
                    onChange={(checked) => updateSetting('hardware_settings', 'auto_badge_printing', checked)}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Monitoring & Alerts</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Device Health Monitoring</span>
                  <Toggle
                    checked={localSettings.hardware_settings.device_health_monitoring}
                    onChange={(checked) => updateSetting('hardware_settings', 'device_health_monitoring', checked)}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Alert on Device Offline</span>
                  <Toggle
                    checked={localSettings.hardware_settings.alert_on_device_offline}
                    onChange={(checked) => updateSetting('hardware_settings', 'alert_on_device_offline', checked)}
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    Maintenance Reminder (Days)
                  </label>
                  <input
                    type="number"
                    min="7"
                    max="365"
                    value={localSettings.hardware_settings.maintenance_reminder_days}
                    onChange={(e) => updateSetting('hardware_settings', 'maintenance_reminder_days', parseInt(e.target.value) || 30)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white text-sm font-mono focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MSO Desktop Deployment Settings */}
      <Card className="glass-card border border-white/5 shadow-2xl">
        <CardHeader>
          <CardTitle className="flex items-center text-xl text-white">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600/80 to-slate-900 rounded-lg flex items-center justify-center mr-3 shadow-lg border border-white/5">
              <i className="fas fa-desktop text-white" />
            </div>
            <span className="uppercase tracking-tight">MSO Desktop Configuration</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Offline & Caching</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Offline Mode Enabled</span>
                  <Toggle
                    checked={localSettings.mso_settings.offline_mode_enabled}
                    onChange={(checked) => updateSetting('mso_settings', 'offline_mode_enabled', checked)}
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    Cache Size Limit (MB)
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="2000"
                    value={localSettings.mso_settings.cache_size_limit_mb}
                    onChange={(e) => updateSetting('mso_settings', 'cache_size_limit_mb', parseInt(e.target.value) || 500)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white text-sm font-mono focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    Sync Interval (Seconds)
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="3600"
                    value={localSettings.mso_settings.sync_interval_seconds}
                    onChange={(e) => updateSetting('mso_settings', 'sync_interval_seconds', parseInt(e.target.value) || 300)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white text-sm font-mono focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Performance & Recovery</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Auto Backup Enabled</span>
                  <Toggle
                    checked={localSettings.mso_settings.auto_backup_enabled}
                    onChange={(checked) => updateSetting('mso_settings', 'auto_backup_enabled', checked)}
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    Hardware Timeout (Seconds)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="120"
                    value={localSettings.mso_settings.hardware_timeout_seconds}
                    onChange={(e) => updateSetting('mso_settings', 'hardware_timeout_seconds', parseInt(e.target.value) || 30)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white text-sm font-mono focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    Network Retry Attempts
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={localSettings.mso_settings.network_retry_attempts}
                    onChange={(e) => updateSetting('mso_settings', 'network_retry_attempts', parseInt(e.target.value) || 3)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white text-sm font-mono focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Settings Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSaveSettings}
          variant="glass"
          disabled={loading.settings}
          className="px-8 py-3 text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
        >
          {loading.settings ? (
            <i className="fas fa-spinner fa-spin mr-2" />
          ) : (
            <i className="fas fa-save mr-2" />
          )}
          {loading.settings ? 'Saving Configuration...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
});

SettingsTab.displayName = 'SettingsTab';
