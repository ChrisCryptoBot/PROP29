/**
 * Sound Monitoring - Settings Tab
 * Configuration and settings for sound monitoring
 */

import React from 'react';
import { Button } from '../../../../components/UI/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { cn } from '../../../../utils/cn';
import { useSoundMonitoringContext } from '../../context/SoundMonitoringContext';
import { showSuccess } from '../../../../utils/toast';

export const SettingsTab: React.FC = () => {
  const {
    settingsForm,
    setSettingsForm,
    resetSettings,
    updateSettings,
    canUpdateSettings,
  } = useSoundMonitoringContext();

  const isReadOnly = !canUpdateSettings;

  const handleSaveSettings = async () => {
    try {
      await updateSettings(settingsForm);
    } catch (error) {
      // Error already handled in updateSettings
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="page-title">Settings</h2>
          <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic">
            Sound monitoring and notification configuration
          </p>
        </div>
        <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-black uppercase tracking-widest rounded">
          {isReadOnly ? 'Read-only' : 'Admin'}
        </span>
      </div>

      <Card className="bg-slate-900/50 border border-white/5">
        <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
          <CardTitle className="flex items-center">
            <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center mr-3 border border-white/5">
              <i className="fas fa-cogs text-white" aria-hidden />
            </div>
            <span className="text-sm font-black uppercase tracking-widest text-white">Sound configuration</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-10">
          {/* Alert Threshold Settings Section */}
          <div className="space-y-6">
            <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-4">Alert Threshold</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Decibel Threshold</label>
                <div className="relative group">
                  <input
                    type="number"
                    value={settingsForm.alertThreshold}
                    onChange={(e) => setSettingsForm({ ...settingsForm, alertThreshold: Number(e.target.value) })}
                    disabled={isReadOnly}
                    min="0"
                    max="120"
                    step="1"
                    className="w-full bg-white/5 border border-white/5 rounded-md px-4 py-3 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
                    <span className="text-sm font-bold">dB</span>
                  </div>
                </div>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Alerts trigger when sound exceeds this level</p>
              </div>
            </div>
          </div>

          {/* Notification Settings Section */}
          <div className="space-y-6">
            <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-4">Notifications</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { id: 'notificationEnabled', label: 'Push Notifications', icon: 'fa-bell', state: settingsForm.notificationEnabled },
                { id: 'autoAcknowledge', label: 'Auto-Acknowledge Low Priority', icon: 'fa-check-double', state: settingsForm.autoAcknowledge },
              ].map((setting) => (
                <label
                  key={setting.id}
                  className={cn(
                    "flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-md transition-colors cursor-pointer hover:bg-white/10",
                    isReadOnly && "opacity-50 cursor-not-allowed pointer-events-none"
                  )}
                >
                  <div className="flex items-center space-x-3 relative z-10">
                    <div className={cn(
                      "w-8 h-8 rounded-md flex items-center justify-center text-xs border transition-colors",
                      setting.state ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : "bg-white/5 text-white/20 border-white/5"
                    )}>
                      <i className={cn("fas", setting.icon)} />
                    </div>
                    <span className="text-[11px] font-black text-white/70 uppercase tracking-widest">{setting.label}</span>
                  </div>
                  <div className="relative flex items-center z-10">
                    <input
                      type="checkbox"
                      checked={setting.state}
                      onChange={(e) => setSettingsForm({ ...settingsForm, [setting.id]: e.target.checked })}
                      disabled={isReadOnly}
                      className="sr-only"
                    />
                    <div className={cn(
                      "w-10 h-5 rounded-full border transition-colors relative",
                      setting.state ? "bg-blue-600 border-blue-500" : "bg-white/5 border-white/5"
                    )}>
                      <div
                        className={cn(
                          "absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white transition-colors",
                          setting.state ? "left-6" : "left-1 opacity-70"
                        )}
                        aria-hidden
                      />
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-white/5">
            <Button
              variant="subtle"
              onClick={resetSettings}
              disabled={isReadOnly}
              className="font-black uppercase tracking-widest text-[10px] px-8 h-10"
            >
              Restore defaults
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveSettings}
              disabled={isReadOnly}
              className="font-black uppercase tracking-widest text-[10px] px-10 h-10"
            >
              <i className="fas fa-save mr-2" />
              Save settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
