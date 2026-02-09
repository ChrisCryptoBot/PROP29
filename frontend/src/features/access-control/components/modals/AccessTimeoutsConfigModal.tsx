import React, { useState } from 'react';
import { Modal } from '../../../../components/UI/Modal';
import { Button } from '../../../../components/UI/Button';
import { Toggle } from '../../../../components/UI/Toggle';
import { ConfirmDiscardChangesModal } from './ConfirmDiscardChangesModal';

export interface AccessTimeoutsConfig {
  enabled: boolean;
  defaultTimeout: number; // minutes
  temporaryAccessTimeout: number; // minutes
  emergencyTimeout: number; // minutes
  visitorTimeout: number; // hours
  extendable: boolean;
  warningBeforeExpiry: boolean;
  warningDuration: number; // minutes before expiry
  autoRevoke: boolean;
  notificationOnExpiry: boolean;
}

interface AccessTimeoutsConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: AccessTimeoutsConfig) => void;
  config: AccessTimeoutsConfig;
  onConfigChange: (config: Partial<AccessTimeoutsConfig>) => void;
  isFormDirty: boolean;
  setIsFormDirty: (dirty: boolean) => void;
}

export const AccessTimeoutsConfigModal: React.FC<AccessTimeoutsConfigModalProps> = ({
  isOpen,
  onClose,
  onSave,
  config,
  onConfigChange,
  isFormDirty,
  setIsFormDirty
}) => {
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  const handleClose = () => {
    if (isFormDirty) {
      setShowDiscardModal(true);
      return;
    }
    onClose();
  };

  const handleConfirmDiscard = () => {
    setShowDiscardModal(false);
    setIsFormDirty(false);
    onClose();
  };

  const handleSave = () => {
    onSave(config);
    setIsFormDirty(false);
  };

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Access Timeout Configuration"
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
          <div className="flex items-center justify-between p-4 bg-[color:var(--console-dark)]/20 border border-white/5 rounded-md">
            <div>
              <h4 className="font-black text-[color:var(--text-main)] text-xs uppercase tracking-widest mb-1">Enable Access Timeouts</h4>
              <p className="text-[10px] text-[color:var(--text-sub)] font-medium italic opacity-60 uppercase tracking-tight">Automatically expire access sessions after configured cycles</p>
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
            <div className="space-y-4 pl-6">
              <div className="p-5 bg-[color:var(--console-dark)]/10 border border-white/5 rounded-md">
                <label htmlFor="default-timeout" className="block text-[10px] font-black text-[color:var(--text-sub)] mb-3 uppercase tracking-widest ml-1">
                  Baseline Timeout (Minutes)
                </label>
                <input
                  type="number"
                  id="default-timeout"
                  min="1"
                  max="1440"
                  value={config.defaultTimeout}
                  onChange={(e) => {
                    onConfigChange({ defaultTimeout: parseInt(e.target.value) || 60 });
                    setIsFormDirty(true);
                  }}
                  className="w-full h-10 px-4 bg-[color:var(--console-dark)] border border-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-[color:var(--text-main)] text-sm font-bold"
                />
                <p className="text-[9px] text-[color:var(--text-sub)] font-black uppercase tracking-tight mt-2 italic opacity-40 ml-1">Standard session duration (1-1440 minutes)</p>
              </div>

              <div className="p-5 bg-[color:var(--console-dark)]/10 border border-white/5 rounded-md">
                <label htmlFor="temp-timeout" className="block text-[10px] font-black text-[color:var(--text-sub)] mb-3 uppercase tracking-widest ml-1">
                  Temporary Access (Minutes)
                </label>
                <input
                  type="number"
                  id="temp-timeout"
                  min="5"
                  max="1440"
                  value={config.temporaryAccessTimeout}
                  onChange={(e) => {
                    onConfigChange({ temporaryAccessTimeout: parseInt(e.target.value) || 30 });
                    setIsFormDirty(true);
                  }}
                  className="w-full h-10 px-4 bg-[color:var(--console-dark)] border border-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-[color:var(--text-main)] text-sm font-bold"
                />
                <p className="text-[9px] text-[color:var(--text-sub)] font-black uppercase tracking-tight mt-2 italic opacity-40 ml-1">Temporary access window (5-1440 minutes)</p>
              </div>

              <div className="p-5 bg-[color:var(--console-dark)]/10 border border-white/5 rounded-md">
                <label htmlFor="emergency-timeout" className="block text-[10px] font-black text-[color:var(--text-sub)] mb-3 uppercase tracking-widest ml-1">
                  Emergency Timeout (Minutes)
                </label>
                <input
                  type="number"
                  id="emergency-timeout"
                  min="1"
                  max="1440"
                  value={config.emergencyTimeout}
                  onChange={(e) => {
                    onConfigChange({ emergencyTimeout: parseInt(e.target.value) || 30 });
                    setIsFormDirty(true);
                  }}
                  className="w-full h-10 px-4 bg-[color:var(--console-dark)] border border-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-[color:var(--text-main)] text-sm font-bold"
                />
                <p className="text-[9px] text-[color:var(--text-sub)] font-black uppercase tracking-tight mt-2 italic opacity-40 ml-1">Auto relock after emergency (1-1440 minutes)</p>
              </div>

              <div className="p-5 bg-[color:var(--console-dark)]/10 border border-white/5 rounded-md">
                <label htmlFor="visitor-timeout" className="block text-[10px] font-black text-[color:var(--text-sub)] mb-3 uppercase tracking-widest ml-1">
                  Visitor Access (Hours)
                </label>
                <input
                  type="number"
                  id="visitor-timeout"
                  min="1"
                  max="168"
                  value={config.visitorTimeout}
                  onChange={(e) => {
                    onConfigChange({ visitorTimeout: parseInt(e.target.value) || 24 });
                    setIsFormDirty(true);
                  }}
                  className="w-full h-10 px-4 bg-[color:var(--console-dark)] border border-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-[color:var(--text-main)] text-sm font-bold"
                />
                <p className="text-[9px] text-[color:var(--text-sub)] font-black uppercase tracking-tight mt-2 italic opacity-40 ml-1">Guest access duration (1-168 hours)</p>
              </div>

              <div className="space-y-4 mt-8">
                <div className="flex items-center justify-between p-4 bg-[color:var(--console-dark)]/20 border border-white/5 rounded-md">
                  <div>
                    <h4 className="font-black text-[color:var(--text-main)] text-xs uppercase tracking-widest mb-1">Allow Extensions</h4>
                    <p className="text-[10px] text-[color:var(--text-sub)] font-medium opacity-60 uppercase">Allow users to extend access time</p>
                  </div>
                  <Toggle
                    checked={config.extendable}
                    onChange={(checked) => {
                      onConfigChange({ extendable: checked });
                      setIsFormDirty(true);
                    }}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-[color:var(--console-dark)]/20 border border-white/5 rounded-md">
                  <div>
                    <h4 className="font-black text-[color:var(--text-main)] text-xs uppercase tracking-widest mb-1">Pre-Expiry Alert</h4>
                    <p className="text-[10px] text-[color:var(--text-sub)] font-medium opacity-60 uppercase">Notify before access expires</p>
                  </div>
                  <Toggle
                    checked={config.warningBeforeExpiry}
                    onChange={(checked) => {
                      onConfigChange({ warningBeforeExpiry: checked });
                      setIsFormDirty(true);
                    }}
                  />
                </div>

                {config.warningBeforeExpiry && (
                  <div className="p-5 bg-[color:var(--console-dark)]/10 border border-white/5 rounded-md ml-6">
                    <label htmlFor="warning-duration" className="block text-[10px] font-black text-[color:var(--text-sub)] mb-3 uppercase tracking-widest ml-1">
                      Alert Lead (Minutes)
                    </label>
                    <input
                      type="number"
                      id="warning-duration"
                      min="1"
                      max="60"
                      value={config.warningDuration}
                      onChange={(e) => {
                        onConfigChange({ warningDuration: parseInt(e.target.value) || 5 });
                        setIsFormDirty(true);
                      }}
                      className="w-full h-10 px-4 bg-[color:var(--console-dark)] border border-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-[color:var(--text-main)] text-sm font-bold"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between p-4 bg-[color:var(--console-dark)]/20 border border-white/5 rounded-md">
                  <div>
                    <h4 className="font-black text-[color:var(--text-main)] text-xs uppercase tracking-widest mb-1">Auto Revoke on Expiry</h4>
                    <p className="text-[10px] text-[color:var(--text-sub)] font-medium opacity-60 uppercase">Automatically revoke on expiry</p>
                  </div>
                  <Toggle
                    checked={config.autoRevoke}
                    onChange={(checked) => {
                      onConfigChange({ autoRevoke: checked });
                      setIsFormDirty(true);
                    }}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-[color:var(--console-dark)]/20 border border-white/5 rounded-md">
                  <div>
                    <h4 className="font-black text-[color:var(--text-main)] text-xs uppercase tracking-widest mb-1">Expiry Notification</h4>
                    <p className="text-[10px] text-[color:var(--text-sub)] font-medium opacity-60 uppercase">Notify when access expires</p>
                  </div>
                  <Toggle
                    checked={config.notificationOnExpiry}
                    onChange={(checked) => {
                      onConfigChange({ notificationOnExpiry: checked });
                      setIsFormDirty(true);
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
      <ConfirmDiscardChangesModal
        isOpen={showDiscardModal}
        onClose={() => setShowDiscardModal(false)}
        onConfirm={handleConfirmDiscard}
      />
    </>
  );
};


