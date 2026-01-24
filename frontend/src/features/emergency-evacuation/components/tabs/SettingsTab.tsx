import React from 'react';
import { Button } from '../../../../components/UI/Button';
import { cn } from '../../../../utils/cn';
import { useEmergencyEvacuationContext } from '../../context/EmergencyEvacuationContext';

const SettingsTab: React.FC = () => {
  const { settings, setSettings, handleResetSettings, handleSaveSettings, loading } = useEmergencyEvacuationContext();

  const SettingToggle = ({ label, description, checked, onChange, icon }: { label: string, description: string, checked: boolean, onChange: (val: boolean) => void, icon: string }) => (
    <label className="group flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300 cursor-pointer">
      <div className="flex items-center space-x-4">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center border transition-all duration-300",
          checked ? "bg-blue-500/10 border-blue-500/30 text-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.1)]" : "bg-white/5 border-white/10 text-white/20"
        )}>
          <i className={cn("fas", icon)} />
        </div>
        <div>
          <span className="text-xs font-black text-white uppercase tracking-widest leading-none block mb-1">{label}</span>
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest leading-none italic">{description}</p>
        </div>
      </div>
      <div className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-white/5 border border-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:bg-blue-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white/20 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500/20 peer-checked:border-blue-500/30"></div>
      </div>
    </label>
  );

  const SettingField = ({ label, children, icon }: { label: string, children: React.ReactNode, icon: string }) => (
    <div className="space-y-2">
      <div className="flex items-center space-x-2 px-1">
        <i className={cn("fas text-[10px] text-white/20", icon)} />
        <label className="text-[10px] font-black text-white/20 uppercase tracking-widest">{label}</label>
      </div>
      <div className="relative group">
        {children}
        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-white/20 group-hover:text-blue-500 transition-colors">
          <i className="fas fa-chevron-down text-[10px]" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-10">
      <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
          <h3 className="flex items-center text-lg font-black text-white uppercase tracking-tighter">
            <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center shadow-lg mr-3">
              <i className="fas fa-shield-halved text-blue-500 text-lg"></i>
            </div>
            Protocol Configuration
          </h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">ENCRYPTED LINK ACTIVE</span>
          </div>
        </div>

        <div className="p-8 space-y-10">
          {/* Automation Settings */}
          <section className="space-y-6">
            <div className="flex items-center space-x-4">
              <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] whitespace-nowrap">AUTOMATED RESPONSES</h4>
              <div className="h-px w-full bg-white/5" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SettingToggle
                icon="fa-bolt-auto"
                label="Auto-Evacuation"
                description="Fire-triggered protocols"
                checked={settings.autoEvacuation}
                onChange={(val) => setSettings({ ...settings, autoEvacuation: val })}
              />
              <SettingToggle
                icon="fa-satellite-dish"
                label="Service Dispatch"
                description="911 Auto-Contact"
                checked={settings.emergencyServicesContact}
                onChange={(val) => setSettings({ ...settings, emergencyServicesContact: val })}
              />
              <SettingToggle
                icon="fa-comment-dots"
                label="Guest Uplink"
                description="Push notifications"
                checked={settings.guestNotifications}
                onChange={(val) => setSettings({ ...settings, guestNotifications: val })}
              />
            </div>
          </section>

          {/* System Control */}
          <section className="space-y-6">
            <div className="flex items-center space-x-4">
              <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] whitespace-nowrap">HARDWARE OVERRIDES</h4>
              <div className="h-px w-full bg-white/5" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SettingToggle
                icon="fa-volume-high"
                label="Audible Alarms"
                description="Sonic alerts active"
                checked={settings.soundAlarms}
                onChange={(val) => setSettings({ ...settings, soundAlarms: val })}
              />
              <SettingToggle
                icon="fa-lock-open"
                label="Exit Release"
                description="Global unlock"
                checked={settings.unlockExits}
                onChange={(val) => setSettings({ ...settings, unlockExits: val })}
              />
              <SettingToggle
                icon="fa-elevator"
                label="Lift Isolation"
                description="Disable elevators"
                checked={settings.elevatorShutdown}
                onChange={(val) => setSettings({ ...settings, elevatorShutdown: val })}
              />
            </div>
          </section>

          {/* Parameters */}
          <section className="space-y-6">
            <div className="flex items-center space-x-4">
              <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] whitespace-nowrap">SYSTEM PARAMETERS</h4>
              <div className="h-px w-full bg-white/5" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <SettingField label="ANNOUNCEMENT VOLUME" icon="fa-volume-low">
                <select
                  value={settings.announcementVolume}
                  onChange={(e) => setSettings({ ...settings, announcementVolume: e.target.value })}
                  className="w-full h-12 px-4 bg-white/[0.03] border border-white/10 rounded-xl text-white font-black text-xs uppercase tracking-widest focus:ring-1 focus:ring-blue-500/50 appearance-none transition-all outline-none group-hover:border-blue-500/30"
                >
                  {[50, 60, 70, 80, 90, 100].map(v => (
                    <option key={v} value={v} className="bg-slate-900">{v}% INTENSITY</option>
                  ))}
                </select>
              </SettingField>

              <SettingField label="EVACUATION TIMEOUT" icon="fa-clock">
                <select
                  value={settings.evacuationTimeout}
                  onChange={(e) => setSettings({ ...settings, evacuationTimeout: e.target.value })}
                  className="w-full h-12 px-4 bg-white/[0.03] border border-white/10 rounded-xl text-white font-black text-xs uppercase tracking-widest focus:ring-1 focus:ring-blue-500/50 appearance-none transition-all outline-none group-hover:border-blue-500/30"
                >
                  {[15, 20, 30, 45, 60].map(v => (
                    <option key={v} value={v} className="bg-slate-900">{v} MINUTES</option>
                  ))}
                </select>
              </SettingField>

              <SettingField label="DRILL FREQUENCY" icon="fa-calendar-check">
                <select
                  value={settings.drillFrequency}
                  onChange={(e) => setSettings({ ...settings, drillFrequency: e.target.value })}
                  className="w-full h-12 px-4 bg-white/[0.03] border border-white/10 rounded-xl text-white font-black text-xs uppercase tracking-widest focus:ring-1 focus:ring-blue-500/50 appearance-none transition-all outline-none group-hover:border-blue-500/30"
                >
                  <option value="30" className="bg-slate-900">30 DAYS (MONTHLY)</option>
                  <option value="60" className="bg-slate-900">60 DAYS (BI-MONTHLY)</option>
                  <option value="90" className="bg-slate-900">90 DAYS (QUARTERLY)</option>
                  <option value="180" className="bg-slate-900">180 DAYS (SEMI-ANNUAL)</option>
                </select>
              </SettingField>
            </div>
          </section>

          <footer className="flex items-center justify-end space-x-4 pt-8 border-t border-white/5">
            <Button
              variant="outline"
              onClick={handleResetSettings}
              disabled={loading}
              className="px-6 h-12 font-black uppercase tracking-widest text-[10px] text-white/40 hover:text-white border-white/10 hover:bg-white/5"
            >
              RESTORE DEFAULTS
            </Button>
            <Button
              onClick={handleSaveSettings}
              disabled={loading}
              className="px-8 h-12 font-black uppercase tracking-widest text-[10px]"
            >
              COMMIT CONFIGURATION
              <i className="fas fa-database ml-3" />
            </Button>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;

