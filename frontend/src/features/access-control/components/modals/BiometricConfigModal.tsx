import React, { useState } from 'react';
import { Modal } from '../../../../components/UI/Modal';
import { Button } from '../../../../components/UI/Button';
import { Toggle } from '../../../../components/UI/Toggle';
import { ConfirmDiscardChangesModal } from './ConfirmDiscardChangesModal';

export interface BiometricConfig {
  enabled: boolean;
  requireFingerprint: boolean;
  requireFaceId: boolean;
  requireIris: boolean;
  requireVoice: boolean;
  fallbackToCard: boolean;
  highSecurityOnly: boolean;
  enrollmentRequired: boolean;
  retentionPeriod: number; // days
}

interface BiometricConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: BiometricConfig) => void;
  config: BiometricConfig;
  onConfigChange: (config: Partial<BiometricConfig>) => void;
  isFormDirty: boolean;
  setIsFormDirty: (dirty: boolean) => void;
}

export const BiometricConfigModal: React.FC<BiometricConfigModalProps> = ({
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
      title="Biometric Security Configuration"
      size="lg"
      footer={
        <>
          <Button onClick={handleClose} variant="subtle" className="text-xs font-black uppercase tracking-widest">Cancel</Button>
          <Button onClick={handleSave} variant="primary" disabled={!isFormDirty} className="text-xs font-black uppercase tracking-widest shadow-none">Save Settings</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-lg hover:bg-white/10 transition-colors">
          <div>
            <p className="text-xs font-bold text-white uppercase tracking-wider">Biometric Authentication</p>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Enable biometric access for secured areas</p>
          </div>
            <div className="flex-shrink-0">
              <Toggle
                checked={config.enabled}
                onChange={(checked) => {
                  onConfigChange({ enabled: checked });
                  setIsFormDirty(true);
                }}
                className="justify-end"
              />
            </div>
          </div>

          {config.enabled && (
            <>
            <div className="space-y-3 pl-4 border-l border-white/5">
                <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-lg hover:bg-white/10 transition-colors">
                  <div>
                    <p className="text-xs font-bold text-white uppercase tracking-wider">Fingerprint</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Fingerprint authentication</p>
                  </div>
                  <Toggle
                    checked={config.requireFingerprint}
                    onChange={(checked) => {
                      onConfigChange({ requireFingerprint: checked });
                      setIsFormDirty(true);
                    }}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-lg hover:bg-white/10 transition-colors">
                  <div>
                    <p className="text-xs font-bold text-white uppercase tracking-wider">Face ID</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Facial recognition</p>
                  </div>
                  <Toggle
                    checked={config.requireFaceId}
                    onChange={(checked) => {
                      onConfigChange({ requireFaceId: checked });
                      setIsFormDirty(true);
                    }}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-lg hover:bg-white/10 transition-colors">
                  <div>
                    <p className="text-xs font-bold text-white uppercase tracking-wider">Iris Scan</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Iris authentication</p>
                  </div>
                  <Toggle
                    checked={config.requireIris}
                    onChange={(checked) => {
                      onConfigChange({ requireIris: checked });
                      setIsFormDirty(true);
                    }}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-lg hover:bg-white/10 transition-colors">
                  <div>
                    <p className="text-xs font-bold text-white uppercase tracking-wider">Voice</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Voice authentication</p>
                  </div>
                  <Toggle
                    checked={config.requireVoice}
                    onChange={(checked) => {
                      onConfigChange({ requireVoice: checked });
                      setIsFormDirty(true);
                    }}
                  />
                </div>
              </div>

              <div className="space-y-3 mt-6">
                <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-lg hover:bg-white/10 transition-colors">
                  <div>
                    <p className="text-xs font-bold text-white uppercase tracking-wider">RFID fallback</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Allow card if biometric fails</p>
                  </div>
                  <Toggle
                    checked={config.fallbackToCard}
                    onChange={(checked) => {
                      onConfigChange({ fallbackToCard: checked });
                      setIsFormDirty(true);
                    }}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-lg hover:bg-white/10 transition-colors">
                  <div>
                    <p className="text-xs font-bold text-white uppercase tracking-wider">High-security only</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Limit to high-security areas</p>
                  </div>
                  <Toggle
                    checked={config.highSecurityOnly}
                    onChange={(checked) => {
                      onConfigChange({ highSecurityOnly: checked });
                      setIsFormDirty(true);
                    }}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-lg hover:bg-white/10 transition-colors">
                  <div>
                    <p className="text-xs font-bold text-white uppercase tracking-wider">Enrollment required</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Require enrollment for all users</p>
                  </div>
                  <Toggle
                    checked={config.enrollmentRequired}
                    onChange={(checked) => {
                      onConfigChange({ enrollmentRequired: checked });
                      setIsFormDirty(true);
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="retention-period" className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Data retention (days)</label>
                  <input
                    type="number"
                    id="retention-period"
                    min={1}
                    max={365}
                    value={config.retentionPeriod}
                    onChange={(e) => { onConfigChange({ retentionPeriod: parseInt(e.target.value, 10) || 1 }); setIsFormDirty(true); }}
                    className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">1 – 365 days</p>
                </div>
              </div>
            </>
          )}
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


