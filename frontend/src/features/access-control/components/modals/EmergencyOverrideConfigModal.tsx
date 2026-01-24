import React from 'react';
import { Modal } from '../../../../components/UI/Modal';
import { Button } from '../../../../components/UI/Button';
import { Toggle } from '../../../../components/UI/Toggle';

export interface EmergencyOverrideConfig {
  enabled: boolean;
  requireAuthorization: boolean;
  authorizedRoles: string[]; // ['admin', 'manager', 'security']
  lockdownDuration: number; // minutes
  unlockDuration: number; // minutes
  autoRestore: boolean;
  requireAuditLog: boolean;
  requireConfirmation: boolean;
  notificationRecipients: string[]; // emails
  escalationLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface EmergencyOverrideConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: EmergencyOverrideConfig) => void;
  config: EmergencyOverrideConfig;
  onConfigChange: (config: Partial<EmergencyOverrideConfig>) => void;
  isFormDirty: boolean;
  setIsFormDirty: (dirty: boolean) => void;
}

const AVAILABLE_ROLES = ['admin', 'manager', 'employee', 'security'];

import { Select } from '../../../../components/UI/Select';

export const EmergencyOverrideConfigModal: React.FC<EmergencyOverrideConfigModalProps> = ({
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

  const toggleRole = (role: string) => {
    const newRoles = config.authorizedRoles.includes(role)
      ? config.authorizedRoles.filter(r => r !== role)
      : [...config.authorizedRoles, role];
    onConfigChange({ authorizedRoles: newRoles });
    setIsFormDirty(true);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Emergency Override Settings"
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
              <h4 className="font-black text-[color:var(--text-main)] text-xs uppercase tracking-widest mb-1">Emergency Overrides</h4>
              <p className="text-[10px] text-[color:var(--text-sub)] font-medium italic opacity-60 uppercase tracking-tight">Enable emergency lockdown and unlock actions</p>
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
              <div className="flex items-center justify-between p-4 bg-[color:var(--console-dark)]/20 border border-white/5 rounded-xl">
                <div>
                  <h4 className="font-black text-[color:var(--text-main)] text-xs uppercase tracking-widest mb-1">Require Authorization</h4>
                  <p className="text-[10px] text-[color:var(--text-sub)] font-medium opacity-60 uppercase">Limit emergency actions to authorized roles</p>
                </div>
                <Toggle
                  checked={config.requireAuthorization}
                  onChange={(checked) => {
                    onConfigChange({ requireAuthorization: checked });
                    setIsFormDirty(true);
                  }}
                />
              </div>

              {config.requireAuthorization && (
                <div className="p-5 bg-[color:var(--console-dark)]/10 border border-white/5 rounded-xl">
                  <label className="block text-[10px] font-black text-[color:var(--text-sub)] mb-4 uppercase tracking-widest ml-1">
                    Authorized Roles
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {AVAILABLE_ROLES.map((role) => (
                      <label key={role} className="flex items-center p-3 bg-[color:var(--console-dark)]/20 border border-white/5 rounded-lg cursor-pointer hover:bg-red-500/5 transition-colors">
                        <input
                          type="checkbox"
                          checked={config.authorizedRoles.includes(role)}
                          onChange={() => toggleRole(role)}
                          className="mr-3 h-4 w-4 bg-black border-white/5 text-red-600 rounded focus:ring-red-500/50"
                          aria-label={`Allow ${role} role`}
                        />
                        <span className="text-[10px] font-black text-[color:var(--text-main)] uppercase tracking-widest">{role}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-[color:var(--console-dark)]/10 border border-white/5 rounded-xl">
                  <label htmlFor="lockdown-duration" className="block text-[10px] font-black text-[color:var(--text-sub)] mb-3 uppercase tracking-widest ml-1">
                    Lockdown Window (Minutes)
                  </label>
                  <input
                    type="number"
                    id="lockdown-duration"
                    min="1"
                    max="1440"
                    value={config.lockdownDuration}
                    onChange={(e) => {
                      onConfigChange({ lockdownDuration: parseInt(e.target.value) || 60 });
                      setIsFormDirty(true);
                    }}
                    className="w-full h-10 px-4 bg-[color:var(--console-dark)] border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-[color:var(--text-main)] text-sm font-bold"
                  />
                </div>

                <div className="p-5 bg-[color:var(--console-dark)]/10 border border-white/5 rounded-xl">
                  <label htmlFor="unlock-duration" className="block text-[10px] font-black text-[color:var(--text-sub)] mb-3 uppercase tracking-widest ml-1">
                    Emergency Release (Minutes)
                  </label>
                  <input
                    type="number"
                    id="unlock-duration"
                    min="1"
                    max="1440"
                    value={config.unlockDuration}
                    onChange={(e) => {
                      onConfigChange({ unlockDuration: parseInt(e.target.value) || 30 });
                      setIsFormDirty(true);
                    }}
                    className="w-full h-10 px-4 bg-[color:var(--console-dark)] border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-[color:var(--text-main)] text-sm font-bold"
                  />
                </div>
              </div>

              <div className="space-y-4 mt-8">
                <div className="flex items-center justify-between p-4 bg-[color:var(--console-dark)]/20 border border-white/5 rounded-xl">
                  <div>
                    <h4 className="font-black text-[color:var(--text-main)] text-xs uppercase tracking-widest mb-1">Baseline Auto-Restore</h4>
                    <p className="text-[10px] text-[color:var(--text-sub)] font-medium opacity-60 uppercase">Automatically restore standard mode after timeout</p>
                  </div>
                  <Toggle
                    checked={config.autoRestore}
                    onChange={(checked) => {
                      onConfigChange({ autoRestore: checked });
                      setIsFormDirty(true);
                    }}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-[color:var(--console-dark)]/20 border border-white/5 rounded-xl">
                  <div>
                    <h4 className="font-black text-[color:var(--text-main)] text-xs uppercase tracking-widest mb-1">Audit Log Requirement</h4>
                    <p className="text-[10px] text-[color:var(--text-sub)] font-medium opacity-60 uppercase">Log all emergency actions to forensic trail</p>
                  </div>
                  <Toggle
                    checked={config.requireAuditLog}
                    onChange={(checked) => {
                      onConfigChange({ requireAuditLog: checked });
                      setIsFormDirty(true);
                    }}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-[color:var(--console-dark)]/20 border border-white/5 rounded-xl">
                  <div>
                    <h4 className="font-black text-[color:var(--text-main)] text-xs uppercase tracking-widest mb-1">Signal Confirmation</h4>
                    <p className="text-[10px] text-[color:var(--text-sub)] font-medium opacity-60 uppercase">Show confirmation dialog before emergency actions</p>
                  </div>
                  <Toggle
                    checked={config.requireConfirmation}
                    onChange={(checked) => {
                      onConfigChange({ requireConfirmation: checked });
                      setIsFormDirty(true);
                    }}
                  />
                </div>

                <Select
                  id="escalation-level"
                  label="Escalation Threshold"
                  value={config.escalationLevel}
                  onChange={(e) => {
                    onConfigChange({ escalationLevel: e.target.value as 'low' | 'medium' | 'high' | 'critical' });
                    setIsFormDirty(true);
                  }}
                  aria-label="Emergency escalation level"
                >
                  <option value="low">LEVEL_1: MINIMAL IMPACT</option>
                  <option value="medium">LEVEL_2: MODERATE RISK</option>
                  <option value="high">LEVEL_3: ELEVATED THREAT</option>
                  <option value="critical">LEVEL_4: OMEGA PROTOCOL</option>
                </Select>

                <div className="p-5 bg-[color:var(--console-dark)]/10 border border-white/5 rounded-xl">
                  <label htmlFor="notification-recipients" className="block text-[10px] font-black text-[color:var(--text-sub)] mb-3 uppercase tracking-widest ml-1">
                    Emergency Dispatch (Recipients)
                  </label>
                  <input
                    type="text"
                    id="notification-recipients"
                    value={config.notificationRecipients.join(', ')}
                    onChange={(e) => {
                      const emails = e.target.value.split(',').map(email => email.trim()).filter(Boolean);
                      onConfigChange({ notificationRecipients: emails });
                      setIsFormDirty(true);
                    }}
                    className="w-full h-10 px-4 bg-[color:var(--console-dark)] border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-[color:var(--text-main)] text-sm font-bold"
                    placeholder="e.g. security@station-g.net, admin@station-g.net"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};


