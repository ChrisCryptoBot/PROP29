import React from 'react';
import { Modal } from '../../../../components/UI/Modal';
import { Button } from '../../../../components/UI/Button';
import { Toggle } from '../../../../components/UI/Toggle';

export interface NotificationSettingsConfig {
  enabled: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  notifyOnAccessDenied: boolean;
  notifyOnEmergencyAction: boolean;
  notifyOnHeldOpenAlarm: boolean;
  notifyOnTimeoutExpiry: boolean;
  notifyOnBannedAttempt: boolean;
  notifyOnOfflineDevice: boolean;
  notifyAdminsOnly: boolean;
  notificationEmail: string;
  notificationSms: string;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:mm format
  quietHoursEnd: string; // HH:mm format
  criticalOnlyInQuietHours: boolean;
}

interface NotificationSettingsConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: NotificationSettingsConfig) => void;
  config: NotificationSettingsConfig;
  onConfigChange: (config: Partial<NotificationSettingsConfig>) => void;
  isFormDirty: boolean;
  setIsFormDirty: (dirty: boolean) => void;
}

export const NotificationSettingsConfigModal: React.FC<NotificationSettingsConfigModalProps> = ({
  isOpen,
  onClose,
  onSave,
  config,
  onConfigChange,
  isFormDirty,
  setIsFormDirty
}) => {
  const handleClose = () => {
    if (isFormDirty && !window.confirm('You have unsaved changes. Cancel anyway?')) {
      return;
    }
    onClose();
  };

  const handleSave = () => {
    onSave(config);
    setIsFormDirty(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Notification Settings"
      size="lg"
      footer={
        <>
          <Button
            variant="subtle"
            onClick={handleClose}
            className="text-[10px] font-black uppercase tracking-widest px-6 border-white/5 text-[color:var(--text-sub)] hover:text-[color:var(--text-main)]"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!isFormDirty}
            className="text-[10px] font-black uppercase tracking-widest px-8 shadow-none hover:shadow-none"
          >
            Save Settings
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-[color:var(--console-dark)]/20 border border-white/5 rounded-xl">
            <div>
              <h4 className="font-black text-[color:var(--text-main)] text-xs uppercase tracking-widest mb-1">Alert Notifications</h4>
              <p className="text-[10px] text-[color:var(--text-sub)] font-medium italic opacity-60 uppercase tracking-tight">Send alerts for access control events</p>
            </div>
            <Toggle
              checked={config.enabled}
              onChange={(checked) => {
                onConfigChange({ enabled: checked });
                setIsFormDirty(true);
              }}
            />
          </div>

          {config.enabled && (
            <div className="space-y-4 pl-6 border-l-2 border-white/5">
              <div className="space-y-3">
                <h5 className="text-[10px] font-black text-[color:var(--text-main)] uppercase tracking-[0.2em] mb-4 ml-1">Channels</h5>

                <div className="flex items-center justify-between p-4 bg-[color:var(--console-dark)]/10 border border-white/5 rounded-xl hover:bg-blue-500/5 transition-colors">
                  <div>
                    <h6 className="font-black text-[color:var(--text-main)] text-[10px] uppercase tracking-widest">Email</h6>
                    <p className="text-[9px] text-[color:var(--text-sub)] font-medium opacity-60 uppercase">Send alerts by email</p>
                  </div>
                  <Toggle
                    checked={config.emailNotifications}
                    onChange={(checked) => {
                      onConfigChange({ emailNotifications: checked });
                      setIsFormDirty(true);
                    }}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-[color:var(--console-dark)]/10 border border-white/5 rounded-xl hover:bg-blue-500/5 transition-colors">
                  <div>
                    <h6 className="font-black text-[color:var(--text-main)] text-[10px] uppercase tracking-widest">SMS</h6>
                    <p className="text-[9px] text-[color:var(--text-sub)] font-medium opacity-60 uppercase">Send alerts by SMS</p>
                  </div>
                  <Toggle
                    checked={config.smsNotifications}
                    onChange={(checked) => {
                      onConfigChange({ smsNotifications: checked });
                      setIsFormDirty(true);
                    }}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-[color:var(--console-dark)]/10 border border-white/5 rounded-xl hover:bg-blue-500/5 transition-colors">
                  <div>
                    <h6 className="font-black text-[color:var(--text-main)] text-[10px] uppercase tracking-widest">Push</h6>
                    <p className="text-[9px] text-[color:var(--text-sub)] font-medium opacity-60 uppercase">Send push alerts</p>
                  </div>
                  <Toggle
                    checked={config.pushNotifications}
                    onChange={(checked) => {
                      onConfigChange({ pushNotifications: checked });
                      setIsFormDirty(true);
                    }}
                  />
                </div>
              </div>

              {(config.emailNotifications || config.smsNotifications) && (
                <div className="space-y-4 p-5 bg-[color:var(--console-dark)]/10 border border-white/5 rounded-xl">
                  <h5 className="text-[10px] font-black text-[color:var(--text-sub)] uppercase tracking-widest mb-2 ml-1">Dispatch Targets</h5>

                  {config.emailNotifications && (
                    <div className="space-y-2">
                      <label htmlFor="notification-email" className="block text-[10px] font-black text-[color:var(--text-sub)] uppercase tracking-widest ml-1">
                        TARGET_EMAIL
                      </label>
                      <input
                        type="email"
                        id="notification-email"
                        value={config.notificationEmail}
                        onChange={(e) => {
                          onConfigChange({ notificationEmail: e.target.value });
                          setIsFormDirty(true);
                        }}
                        className="w-full h-10 px-4 bg-[color:var(--console-dark)] border border-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-[color:var(--text-main)] text-sm font-bold"
                        placeholder="alerts@station-g.net"
                      />
                    </div>
                  )}

                  {config.smsNotifications && (
                    <div className="space-y-2 mt-4">
                      <label htmlFor="notification-sms" className="block text-[10px] font-black text-[color:var(--text-sub)] uppercase tracking-widest ml-1">
                        TARGET_MOBILE
                      </label>
                      <input
                        type="tel"
                        id="notification-sms"
                        value={config.notificationSms}
                        onChange={(e) => {
                          onConfigChange({ notificationSms: e.target.value });
                          setIsFormDirty(true);
                        }}
                        className="w-full h-10 px-4 bg-[color:var(--console-dark)] border border-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-[color:var(--text-main)] text-sm font-bold"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-3 mt-8">
                <h5 className="text-[10px] font-black text-[color:var(--text-main)] uppercase tracking-[0.2em] mb-4 ml-1">Event Triggers</h5>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center justify-between p-4 bg-[color:var(--console-dark)]/10 border border-white/5 rounded-xl hover:bg-red-500/5 transition-colors">
                    <span className="text-[10px] font-black text-[color:var(--text-main)] uppercase tracking-widest">ACCESS_VIOLATION</span>
                    <Toggle
                      checked={config.notifyOnAccessDenied}
                      onChange={(checked) => {
                        onConfigChange({ notifyOnAccessDenied: checked });
                        setIsFormDirty(true);
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-[color:var(--console-dark)]/10 border border-white/5 rounded-xl hover:bg-red-500/5 transition-colors">
                    <span className="text-[10px] font-black text-[color:var(--text-main)] uppercase tracking-widest">CRITICAL_OVERRIDE</span>
                    <Toggle
                      checked={config.notifyOnEmergencyAction}
                      onChange={(checked) => {
                        onConfigChange({ notifyOnEmergencyAction: checked });
                        setIsFormDirty(true);
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-[color:var(--console-dark)]/10 border border-white/5 rounded-xl hover:bg-amber-500/5 transition-colors">
                    <span className="text-[10px] font-black text-[color:var(--text-main)] uppercase tracking-widest">HELD_OPEN_ALARM</span>
                    <Toggle
                      checked={config.notifyOnHeldOpenAlarm}
                      onChange={(checked) => {
                        onConfigChange({ notifyOnHeldOpenAlarm: checked });
                        setIsFormDirty(true);
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-[color:var(--console-dark)]/10 border border-white/5 rounded-xl hover:bg-blue-500/5 transition-colors">
                    <span className="text-[10px] font-black text-[color:var(--text-main)] uppercase tracking-widest">DECAY_EXPIRY</span>
                    <Toggle
                      checked={config.notifyOnTimeoutExpiry}
                      onChange={(checked) => {
                        onConfigChange({ notifyOnTimeoutExpiry: checked });
                        setIsFormDirty(true);
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-[color:var(--console-dark)]/10 border border-white/5 rounded-xl hover:bg-red-600/5 transition-colors">
                    <span className="text-[10px] font-black text-[color:var(--text-main)] uppercase tracking-widest">BANNED_DETECTION</span>
                    <Toggle
                      checked={config.notifyOnBannedAttempt}
                      onChange={(checked) => {
                        onConfigChange({ notifyOnBannedAttempt: checked });
                        setIsFormDirty(true);
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-[color:var(--console-dark)]/10 border border-white/5 rounded-xl hover:bg-white/10 transition-colors">
                    <span className="text-[10px] font-black text-[color:var(--text-main)] uppercase tracking-widest">OFFLINE_SIGNAL</span>
                    <Toggle
                      checked={config.notifyOnOfflineDevice}
                      onChange={(checked) => {
                        onConfigChange({ notifyOnOfflineDevice: checked });
                        setIsFormDirty(true);
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 mt-8">
                <div className="flex items-center justify-between p-4 bg-[color:var(--console-dark)]/20 border border-white/5 rounded-xl">
                  <div>
                    <h4 className="font-black text-[color:var(--text-main)] text-xs uppercase tracking-widest mb-1">High-Clearance Isolation</h4>
                    <p className="text-[10px] text-[color:var(--text-sub)] font-medium opacity-60 uppercase">Notify admins only</p>
                  </div>
                  <Toggle
                    checked={config.notifyAdminsOnly}
                    onChange={(checked) => {
                      onConfigChange({ notifyAdminsOnly: checked });
                      setIsFormDirty(true);
                    }}
                  />
                </div>
              </div>

              <div className="space-y-4 mt-8">
                <div className="flex items-center justify-between p-4 bg-[color:var(--console-dark)]/20 border border-white/5 rounded-xl">
                  <div>
                    <h4 className="font-black text-[color:var(--text-main)] text-xs uppercase tracking-widest mb-1">Quiet Hours</h4>
                    <p className="text-[10px] text-[color:var(--text-sub)] font-medium opacity-60 uppercase">Suppress non-critical signals during defined cycles</p>
                  </div>
                  <Toggle
                    checked={config.quietHoursEnabled}
                    onChange={(checked) => {
                      onConfigChange({ quietHoursEnabled: checked });
                      setIsFormDirty(true);
                    }}
                  />
                </div>

                {config.quietHoursEnabled && (
                  <div className="p-5 bg-[color:var(--console-dark)]/10 border border-white/5 rounded-xl ml-6">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <label htmlFor="quiet-hours-start" className="block text-[10px] font-black text-[color:var(--text-sub)] uppercase tracking-widest ml-1">
                          SILENT_START
                        </label>
                        <input
                          type="time"
                          id="quiet-hours-start"
                          value={config.quietHoursStart}
                          onChange={(e) => {
                            onConfigChange({ quietHoursStart: e.target.value });
                            setIsFormDirty(true);
                          }}
                          className="w-full h-10 px-4 bg-[color:var(--console-dark)] border border-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-[color:var(--text-main)] text-sm font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="quiet-hours-end" className="block text-[10px] font-black text-[color:var(--text-sub)] uppercase tracking-widest ml-1">
                          SILENT_END
                        </label>
                        <input
                          type="time"
                          id="quiet-hours-end"
                          value={config.quietHoursEnd}
                          onChange={(e) => {
                            onConfigChange({ quietHoursEnd: e.target.value });
                            setIsFormDirty(true);
                          }}
                          className="w-full h-10 px-4 bg-[color:var(--console-dark)] border border-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-[color:var(--text-main)] text-sm font-bold"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-[color:var(--console-dark)]/20 border border-white/5 rounded-xl">
                      <div>
                        <h6 className="font-black text-[color:var(--text-main)] text-[10px] uppercase tracking-widest">CRITICAL_BYPASS</h6>
                        <p className="text-[9px] text-[color:var(--text-sub)] font-medium opacity-60 uppercase">Allow priority signals during silent cycles</p>
                      </div>
                      <Toggle
                        checked={config.criticalOnlyInQuietHours}
                        onChange={(checked) => {
                          onConfigChange({ criticalOnlyInQuietHours: checked });
                          setIsFormDirty(true);
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};


