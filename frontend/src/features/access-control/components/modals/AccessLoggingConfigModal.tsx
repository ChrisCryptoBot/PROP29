import React, { useState } from 'react';
import { ConfirmDiscardChangesModal } from './ConfirmDiscardChangesModal';
import { Modal } from '../../../../components/UI/Modal';
import { Button } from '../../../../components/UI/Button';
import { Toggle } from '../../../../components/UI/Toggle';
import { Select } from '../../../../components/UI/Select';

export interface AccessLoggingConfig {
  enabled: boolean;
  logLevel: 'minimal' | 'standard' | 'detailed' | 'comprehensive';
  retentionPeriod: number; // days
  logSuccessfulAccess: boolean;
  logDeniedAccess: boolean;
  logEmergencyActions: boolean;
  logBiometricAccess: boolean;
  includeLocation: boolean;
  includeTime: boolean;
  includeUserInfo: boolean;
  includeDeviceInfo: boolean;
  compressOldLogs: boolean;
  exportFormat: 'json' | 'csv' | 'xml';
  autoArchive: boolean;
  archiveAfterDays: number;
}

interface AccessLoggingConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: AccessLoggingConfig) => void;
  config: AccessLoggingConfig;
  onConfigChange: (config: Partial<AccessLoggingConfig>) => void;
  isFormDirty: boolean;
  setIsFormDirty: (dirty: boolean) => void;
}

export const AccessLoggingConfigModal: React.FC<AccessLoggingConfigModalProps> = ({
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
      title="Access Logging Configuration"
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
              <h4 className="font-black text-[color:var(--text-main)] text-xs uppercase tracking-widest mb-1">Access Logging</h4>
              <p className="text-[10px] text-[color:var(--text-sub)] font-medium italic opacity-60 uppercase tracking-tight">Log access events for audit and compliance</p>
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
              <Select
                id="log-level"
                label="Log Level"
                value={config.logLevel}
                onChange={(e) => {
                  onConfigChange({ logLevel: e.target.value as 'minimal' | 'standard' | 'detailed' | 'comprehensive' });
                  setIsFormDirty(true);
                }}
                aria-label="Access log level"
              >
                <option value="minimal">MINIMAL</option>
                <option value="standard">STANDARD</option>
                <option value="detailed">DETAILED</option>
                <option value="comprehensive">COMPREHENSIVE</option>
              </Select>

              <div className="p-5 bg-[color:var(--console-dark)]/10 border border-white/5 rounded-md">
                <label htmlFor="retention-period" className="block text-[10px] font-black text-[color:var(--text-sub)] mb-3 uppercase tracking-widest ml-1">
                  Retention (Days)
                </label>
                <input
                  type="number"
                  id="retention-period"
                  min="1"
                  max="3650"
                  value={config.retentionPeriod}
                  onChange={(e) => {
                    onConfigChange({ retentionPeriod: parseInt(e.target.value) || 90 });
                    setIsFormDirty(true);
                  }}
                  className="w-full h-10 px-4 bg-[color:var(--console-dark)] border border-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-[color:var(--text-main)] text-sm font-bold"
                />
                <p className="text-[9px] text-[color:var(--text-sub)] font-black uppercase tracking-tight mt-2 italic opacity-40 ml-1">Retention window (1-3650 days)</p>
              </div>

              <div className="space-y-3 mt-8">
                <h5 className="text-[10px] font-black text-[color:var(--text-main)] uppercase tracking-[0.2em] mb-4 ml-1">Log Fields</h5>

                <div className="flex items-center justify-between p-4 bg-[color:var(--console-dark)]/10 border border-white/5 rounded-md hover:bg-blue-500/5 transition-colors">
                  <div>
                    <h6 className="font-black text-[color:var(--text-main)] text-[10px] uppercase tracking-widest">SUCCESSFUL ACCESS</h6>
                    <p className="text-[9px] text-[color:var(--text-sub)] font-medium opacity-60 uppercase">Log granted access events</p>
                  </div>
                  <Toggle
                    checked={config.logSuccessfulAccess}
                    onChange={(checked) => {
                      onConfigChange({ logSuccessfulAccess: checked });
                      setIsFormDirty(true);
                    }}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-[color:var(--console-dark)]/10 border border-white/5 rounded-md hover:bg-red-500/5 transition-colors">
                  <div>
                    <h6 className="font-black text-[color:var(--text-main)] text-[10px] uppercase tracking-widest">DENIED ACCESS</h6>
                    <p className="text-[9px] text-[color:var(--text-sub)] font-medium opacity-60 uppercase">Log denied access attempts</p>
                  </div>
                  <Toggle
                    checked={config.logDeniedAccess}
                    onChange={(checked) => {
                      onConfigChange({ logDeniedAccess: checked });
                      setIsFormDirty(true);
                    }}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-[color:var(--console-dark)]/10 border border-white/5 rounded-md hover:bg-amber-500/5 transition-colors">
                  <div>
                    <h6 className="font-black text-[color:var(--text-main)] text-[10px] uppercase tracking-widest">CRITICAL OVERRIDES</h6>
                    <p className="text-[9px] text-[color:var(--text-sub)] font-medium opacity-60 uppercase">Log lockdown/unlock events</p>
                  </div>
                  <Toggle
                    checked={config.logEmergencyActions}
                    onChange={(checked) => {
                      onConfigChange({ logEmergencyActions: checked });
                      setIsFormDirty(true);
                    }}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-[color:var(--console-dark)]/10 border border-white/5 rounded-md hover:bg-indigo-500/5 transition-colors">
                  <div>
                    <h6 className="font-black text-[color:var(--text-main)] text-[10px] uppercase tracking-widest">BIOMETRIC SCANS</h6>
                    <p className="text-[9px] text-[color:var(--text-sub)] font-medium opacity-60 uppercase">Log biometric authentication data</p>
                  </div>
                  <Toggle
                    checked={config.logBiometricAccess}
                    onChange={(checked) => {
                      onConfigChange({ logBiometricAccess: checked });
                      setIsFormDirty(true);
                    }}
                  />
                </div>
              </div>

              <div className="space-y-4 mt-8">
                <h5 className="text-[10px] font-black text-[color:var(--text-main)] uppercase tracking-[0.2em] mb-4 ml-1">Data Manifest</h5>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 bg-[color:var(--console-dark)]/20 border border-white/5 rounded-md">
                    <h6 className="font-black text-[color:var(--text-main)] text-[10px] uppercase tracking-widest">LOCATION</h6>
                    <Toggle
                      checked={config.includeLocation}
                      onChange={(checked) => {
                        onConfigChange({ includeLocation: checked });
                        setIsFormDirty(true);
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-[color:var(--console-dark)]/20 border border-white/5 rounded-md">
                    <h6 className="font-black text-[color:var(--text-main)] text-[10px] uppercase tracking-widest">TIMESTAMP</h6>
                    <Toggle
                      checked={config.includeTime}
                      onChange={(checked) => {
                        onConfigChange({ includeTime: checked });
                        setIsFormDirty(true);
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-[color:var(--console-dark)]/20 border border-white/5 rounded-md">
                    <h6 className="font-black text-[color:var(--text-main)] text-[10px] uppercase tracking-widest">USER_ID</h6>
                    <Toggle
                      checked={config.includeUserInfo}
                      onChange={(checked) => {
                        onConfigChange({ includeUserInfo: checked });
                        setIsFormDirty(true);
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-[color:var(--console-dark)]/20 border border-white/5 rounded-md">
                    <h6 className="font-black text-[color:var(--text-main)] text-[10px] uppercase tracking-widest">DEVICE_ID</h6>
                    <Toggle
                      checked={config.includeDeviceInfo}
                      onChange={(checked) => {
                        onConfigChange({ includeDeviceInfo: checked });
                        setIsFormDirty(true);
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 mt-8">
                <h5 className="text-[10px] font-black text-[color:var(--text-main)] uppercase tracking-[0.2em] mb-4 ml-1">Archive & Export</h5>

                <div className="flex items-center justify-between p-4 bg-[color:var(--console-dark)]/20 border border-white/5 rounded-md">
                  <div>
                    <h4 className="font-black text-[color:var(--text-main)] text-xs uppercase tracking-widest mb-1">Pulse Compression</h4>
                    <p className="text-[10px] text-[color:var(--text-sub)] font-medium opacity-60 uppercase">Compress logs older than retention cycles</p>
                  </div>
                  <Toggle
                    checked={config.compressOldLogs}
                    onChange={(checked) => {
                      onConfigChange({ compressOldLogs: checked });
                      setIsFormDirty(true);
                    }}
                  />
                </div>

                <Select
                  id="export-format"
                  label="Extraction Format"
                  value={config.exportFormat}
                  onChange={(e) => {
                    onConfigChange({ exportFormat: e.target.value as 'json' | 'csv' | 'xml' });
                    setIsFormDirty(true);
                  }}
                  aria-label="Log export format"
                >
                  <option value="json">STRUCTURED_JSON</option>
                  <option value="csv">RAW_CSV</option>
                  <option value="xml">INTERCHANGE_XML</option>
                </Select>

                <div className="flex items-center justify-between p-4 bg-[color:var(--console-dark)]/20 border border-white/5 rounded-md">
                  <div>
                    <h4 className="font-black text-[color:var(--text-main)] text-xs uppercase tracking-widest mb-1">Cold Storage Archive</h4>
                    <p className="text-[10px] text-[color:var(--text-sub)] font-medium opacity-60 uppercase">Automatically archive legacy signatures</p>
                  </div>
                  <Toggle
                    checked={config.autoArchive}
                    onChange={(checked) => {
                      onConfigChange({ autoArchive: checked });
                      setIsFormDirty(true);
                    }}
                  />
                </div>

                {config.autoArchive && (
                  <div className="p-5 bg-[color:var(--console-dark)]/10 border border-white/5 rounded-md ml-6">
                    <label htmlFor="archive-after-days" className="block text-[10px] font-black text-[color:var(--text-sub)] mb-3 uppercase tracking-widest ml-1">
                      Archive Threshold (Days)
                    </label>
                    <input
                      type="number"
                      id="archive-after-days"
                      min="1"
                      max="365"
                      value={config.archiveAfterDays}
                      onChange={(e) => {
                        onConfigChange({ archiveAfterDays: parseInt(e.target.value) || 30 });
                        setIsFormDirty(true);
                      }}
                      className="w-full h-10 px-4 bg-[color:var(--console-dark)] border border-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-[color:var(--text-main)] text-sm font-bold"
                    />
                  </div>
                )}
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


