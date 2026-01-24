import React from 'react';
import { Button } from '../../../../components/UI/Button';
import { cn } from '../../../../utils/cn';
import { useIoTEnvironmentalContext } from '../../context/IoTEnvironmentalContext';

const SettingsTab: React.FC = () => {
  const {
    settingsForm,
    setSettingsForm,
    handleResetSettings,
    handleSaveSettings,
    canUpdateSettings,
  } = useIoTEnvironmentalContext();

  const isReadOnly = !canUpdateSettings;

  return (
    <div className="bg-black/20 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl">
      <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
        <h2 className="text-lg font-black text-white uppercase tracking-tighter flex items-center">
          <i className="fas fa-cog mr-3 text-blue-500" aria-hidden="true" />
          ENVIRONMENTAL SETTINGS
        </h2>
        <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-500 text-[9px] font-black uppercase tracking-widest rounded-full">
          {isReadOnly ? 'READ-ONLY ACCESS' : 'CORE ADMINISTRATIVE ACCESS'}
        </span>
      </div>

      <div className="p-8 space-y-10">
        {/* General Settings Section */}
        <div className="space-y-6">
          <div className="flex items-center space-x-3 px-1">
            <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">SETTINGS</h3>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Temperature Unit</label>
              <div className="relative group">
                <select
                  value={settingsForm.temperatureUnit}
                  onChange={(e) => setSettingsForm({ ...settingsForm, temperatureUnit: e.target.value as any })}
                  disabled={isReadOnly}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer transition-all hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="celsius">CELSIUS (°C) - METRIC STANDARD</option>
                  <option value="fahrenheit">FAHRENHEIT (°F) - IMPERIAL STANDARD</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
                  <i className="fas fa-chevron-down" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Refresh Frequency</label>
              <div className="relative group">
                <select
                  value={settingsForm.refreshInterval}
                  onChange={(e) => setSettingsForm({ ...settingsForm, refreshInterval: e.target.value })}
                  disabled={isReadOnly}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer transition-all hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="15">HIGH FREQUENCY (15 SECONDS)</option>
                  <option value="30">STANDARD FREQUENCY (30 SECONDS)</option>
                  <option value="60">EXTENDED FREQUENCY (1 MINUTE)</option>
                  <option value="300">LOW FREQUENCY (5 MINUTES)</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
                  <i className="fas fa-chevron-down" />
                </div>
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Data Retention Period</label>
              <div className="relative group">
                <select
                  value={settingsForm.dataRetention}
                  onChange={(e) => setSettingsForm({ ...settingsForm, dataRetention: e.target.value })}
                  disabled={isReadOnly}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer transition-all hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="30">SHORT-TERM ARCHIVE (30 DAYS)</option>
                  <option value="60">60 DAYS</option>
                  <option value="90">QUARTERLY ARCHIVE (90 DAYS)</option>
                  <option value="180">BI-ANNUAL ARCHIVE (180 DAYS)</option>
                  <option value="365">ANNUAL ARCHIVE (1 YEAR)</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
                  <i className="fas fa-calendar" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Settings Section */}
        <div className="space-y-6">
          <div className="flex items-center space-x-3 px-1">
            <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">NOTIFICATIONS</h3>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { id: 'enableNotifications', label: 'Push Notifications', icon: 'fa-bell', state: settingsForm.enableNotifications },
              { id: 'criticalAlertsOnly', label: 'Critical Filter', icon: 'fa-exclamation-circle', state: settingsForm.criticalAlertsOnly },
              { id: 'autoAcknowledge', label: 'Auto-Acknowledge Low Priority', icon: 'fa-check-double', state: settingsForm.autoAcknowledge },
              { id: 'alertSoundEnabled', label: 'Audible Alerts', icon: 'fa-volume-up', state: settingsForm.alertSoundEnabled },
              { id: 'emailNotifications', label: 'Email Report Relay', icon: 'fa-envelope', state: settingsForm.emailNotifications },
            ].map((setting) => (
              <label
                key={setting.id}
                className={cn(
                  "flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl transition-all cursor-pointer hover:bg-white/10 group relative overflow-hidden",
                  isReadOnly && "opacity-50 cursor-not-allowed pointer-events-none"
                )}
              >
                <div className="flex items-center space-x-3 relative z-10">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center text-xs border transition-colors",
                    setting.state ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : "bg-white/5 text-white/20 border-white/10"
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
                    "w-10 h-5 rounded-full border transition-all relative",
                    setting.state ? "bg-blue-600 border-blue-400" : "bg-white/5 border-white/10"
                  )}>
                    <div className={cn(
                      "absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full transition-all shadow-lg",
                      setting.state ? "left-6 bg-white" : "left-1 bg-white/20"
                    )} />
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-white/10">
          <Button
            variant="ghost"
            onClick={handleResetSettings}
            disabled={isReadOnly}
            className="bg-white/5 border border-white/5 hover:bg-red-500/10 hover:text-red-500 font-black uppercase tracking-[0.2em] text-[10px] px-8 h-12 transition-all disabled:opacity-20"
          >
            RESTORE DEFAULTS
          </Button>
          <Button
            onClick={handleSaveSettings}
            disabled={isReadOnly}
            className="bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-[0.2em] text-[10px] px-10 h-12 shadow-xl shadow-blue-500/20 transition-all disabled:opacity-20 hover:-translate-y-0.5"
          >
            <i className="fas fa-save mr-2" />
            SAVE SETTINGS
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;



