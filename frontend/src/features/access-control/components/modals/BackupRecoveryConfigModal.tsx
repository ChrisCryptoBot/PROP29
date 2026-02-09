import React, { useState } from 'react';
import { Modal } from '../../../../components/UI/Modal';
import { Button } from '../../../../components/UI/Button';
import { Toggle } from '../../../../components/UI/Toggle';
import { Select } from '../../../../components/UI/Select';
import { ConfirmDiscardChangesModal } from './ConfirmDiscardChangesModal';

export interface BackupRecoveryConfig {
  enabled: boolean;
  backupFrequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';
  customBackupSchedule: string; // Cron expression
  backupLocation: 'local' | 'cloud' | 'both';
  cloudProvider: 'aws' | 'azure' | 'gcp' | 'other';
  retentionDays: number;
  encryptBackups: boolean;
  compressionEnabled: boolean;
  includeAccessLogs: boolean;
  includeUserData: boolean;
  includeConfig: boolean;
  autoBackup: boolean;
  backupOnConfigChange: boolean;
  testRestoreEnabled: boolean;
  restorePointLimit: number;
}

interface BackupRecoveryConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: BackupRecoveryConfig) => void;
  config: BackupRecoveryConfig;
  onConfigChange: (config: Partial<BackupRecoveryConfig>) => void;
  isFormDirty: boolean;
  setIsFormDirty: (dirty: boolean) => void;
}

export const BackupRecoveryConfigModal: React.FC<BackupRecoveryConfigModalProps> = ({
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
      title="System Backup & Recovery"
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
              <h4 className="font-black text-[color:var(--text-main)] text-xs uppercase tracking-widest mb-1">Backups</h4>
              <p className="text-[10px] text-[color:var(--text-sub)] font-medium italic opacity-60 uppercase tracking-tight">Automated backups for recovery</p>
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
                id="backup-frequency"
                label="Backup Frequency"
                value={config.backupFrequency}
                onChange={(e) => {
                  onConfigChange({ backupFrequency: e.target.value as 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom' });
                  setIsFormDirty(true);
                }}
                aria-label="Backup frequency"
              >
                <option value="hourly">HOURLY</option>
                <option value="daily">DAILY</option>
                <option value="weekly">WEEKLY</option>
                <option value="monthly">MONTHLY</option>
                <option value="custom">CUSTOM</option>
              </Select>

              {config.backupFrequency === 'custom' && (
                <div className="p-5 bg-[color:var(--console-dark)]/10 border border-white/5 rounded-md ml-6">
                  <label htmlFor="custom-schedule" className="block text-[10px] font-black text-[color:var(--text-sub)] mb-3 uppercase tracking-widest ml-1">
                    Custom Schedule (SCHEDULE_MANIFEST)
                  </label>
                  <input
                    type="text"
                    id="custom-schedule"
                    value={config.customBackupSchedule}
                    onChange={(e) => {
                      onConfigChange({ customBackupSchedule: e.target.value });
                      setIsFormDirty(true);
                    }}
                    className="w-full h-10 px-4 bg-[color:var(--console-dark)] border border-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-[color:var(--text-main)] text-sm font-mono font-bold"
                    placeholder="0 0 * * *"
                  />
                  <p className="text-[9px] text-[color:var(--text-sub)] font-black uppercase tracking-tight mt-2 italic opacity-40 ml-1">Format: min hour day month weekday</p>
                </div>
              )}

              <Select
                id="backup-location"
                label="Retention (Days)"
                value={config.backupLocation}
                onChange={(e) => {
                  onConfigChange({ backupLocation: e.target.value as 'local' | 'cloud' | 'both' });
                  setIsFormDirty(true);
                }}
                aria-label="Backup storage location"
              >
                <option value="local">LOCAL_NODE_STORAGE</option>
                <option value="cloud">CLOUD_VIRTUAL_REPOSITORY</option>
                <option value="both">DUAL_PATH_REDUNDANCY</option>
              </Select>

              {(config.backupLocation === 'cloud' || config.backupLocation === 'both') && (
                <Select
                  id="cloud-provider"
                  label="Cloud Fabric Provider"
                  value={config.cloudProvider}
                  onChange={(e) => {
                    onConfigChange({ cloudProvider: e.target.value as 'aws' | 'azure' | 'gcp' | 'other' });
                    setIsFormDirty(true);
                  }}
                  aria-label="Cloud storage provider"
                >
                  <option value="aws">AMAZON_S3_FABRIC</option>
                  <option value="azure">AZURE_BLOB_MATRIX</option>
                  <option value="gcp">GOOGLE_CLOUD_NEXUS</option>
                  <option value="other">EXTERNAL_TARGET</option>
                </Select>
              )}

              <div className="p-5 bg-[color:var(--console-dark)]/10 border border-white/5 rounded-md">
                <label htmlFor="retention-days" className="block text-[10px] font-black text-[color:var(--text-sub)] mb-3 uppercase tracking-widest ml-1">
                  Snapshot Persistence (Days)
                </label>
                <input
                  type="number"
                  id="retention-days"
                  min="1"
                  max="3650"
                  value={config.retentionDays}
                  onChange={(e) => {
                    onConfigChange({ retentionDays: parseInt(e.target.value) || 30 });
                    setIsFormDirty(true);
                  }}
                  className="w-full h-10 px-4 bg-[color:var(--console-dark)] border border-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-[color:var(--text-main)] text-sm font-bold"
                />
                <p className="text-[9px] text-[color:var(--text-sub)] font-black uppercase tracking-tight mt-2 italic opacity-40 ml-1">Lifespan of backup files (1-3650 cycles)</p>
              </div>

              <div className="space-y-3 mt-8">
                <h5 className="text-[10px] font-black text-[color:var(--text-main)] uppercase tracking-[0.2em] mb-4 ml-1">Encryption & Compression</h5>

                <div className="flex items-center justify-between p-4 bg-[color:var(--console-dark)]/10 border border-white/5 rounded-md hover:bg-blue-500/5 transition-colors">
                  <div>
                    <h6 className="font-black text-[color:var(--text-main)] text-[10px] uppercase tracking-widest">CIPHER_ENCRYPTION</h6>
                    <p className="text-[9px] text-[color:var(--text-sub)] font-medium opacity-60 uppercase">AES-256 system-level encryption</p>
                  </div>
                  <Toggle
                    checked={config.encryptBackups}
                    onChange={(checked) => {
                      onConfigChange({ encryptBackups: checked });
                      setIsFormDirty(true);
                    }}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-[color:var(--console-dark)]/10 border border-white/5 rounded-md hover:bg-blue-500/5 transition-colors">
                  <div>
                    <h6 className="font-black text-[color:var(--text-main)] text-[10px] uppercase tracking-widest">DATA_COMPRESSION</h6>
                    <p className="text-[9px] text-[color:var(--text-sub)] font-medium opacity-60 uppercase">High-ratio pulse compression</p>
                  </div>
                  <Toggle
                    checked={config.compressionEnabled}
                    onChange={(checked) => {
                      onConfigChange({ compressionEnabled: checked });
                      setIsFormDirty(true);
                    }}
                  />
                </div>
              </div>

              <div className="space-y-4 mt-8">
                <h5 className="text-[10px] font-black text-[color:var(--text-main)] uppercase tracking-[0.2em] mb-4 ml-1">Snapshot Payload</h5>

                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col items-center justify-center p-4 bg-[color:var(--console-dark)]/20 border border-white/5 rounded-md space-y-3">
                    <span className="text-[9px] font-black text-[color:var(--text-sub)] uppercase tracking-widest text-center">ACCESS_LOGS</span>
                    <Toggle
                      checked={config.includeAccessLogs}
                      onChange={(checked) => {
                        onConfigChange({ includeAccessLogs: checked });
                        setIsFormDirty(true);
                      }}
                    />
                  </div>

                  <div className="flex flex-col items-center justify-center p-4 bg-[color:var(--console-dark)]/20 border border-white/5 rounded-md space-y-3">
                    <span className="text-[9px] font-black text-[color:var(--text-sub)] uppercase tracking-widest text-center">USER_MANIFEST</span>
                    <Toggle
                      checked={config.includeUserData}
                      onChange={(checked) => {
                        onConfigChange({ includeUserData: checked });
                        setIsFormDirty(true);
                      }}
                    />
                  </div>

                  <div className="flex flex-col items-center justify-center p-4 bg-[color:var(--console-dark)]/20 border border-white/5 rounded-md space-y-3">
                    <span className="text-[9px] font-black text-[color:var(--text-sub)] uppercase tracking-widest text-center">SYSTEM_CONFIG</span>
                    <Toggle
                      checked={config.includeConfig}
                      onChange={(checked) => {
                        onConfigChange({ includeConfig: checked });
                        setIsFormDirty(true);
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 mt-8">
                <h5 className="text-[10px] font-black text-[color:var(--text-main)] uppercase tracking-[0.2em] mb-4 ml-1">Automation</h5>

                <div className="flex items-center justify-between p-4 bg-[color:var(--console-dark)]/20 border border-white/5 rounded-md">
                  <div>
                    <h4 className="font-black text-[color:var(--text-main)] text-xs uppercase tracking-widest mb-1">Autonomous Snapshot</h4>
                    <p className="text-[10px] text-[color:var(--text-sub)] font-medium opacity-60 uppercase">Automatically create backups on sequence</p>
                  </div>
                  <Toggle
                    checked={config.autoBackup}
                    onChange={(checked) => {
                      onConfigChange({ autoBackup: checked });
                      setIsFormDirty(true);
                    }}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-[color:var(--console-dark)]/20 border border-white/5 rounded-md">
                  <div>
                    <h4 className="font-black text-[color:var(--text-main)] text-xs uppercase tracking-widest mb-1">Config-Triggered Backup</h4>
                    <p className="text-[10px] text-[color:var(--text-sub)] font-medium opacity-60 uppercase">Snapshot on configuration modification</p>
                  </div>
                  <Toggle
                    checked={config.backupOnConfigChange}
                    onChange={(checked) => {
                      onConfigChange({ backupOnConfigChange: checked });
                      setIsFormDirty(true);
                    }}
                  />
                </div>
              </div>

              <div className="space-y-4 mt-8">
                <h5 className="text-[10px] font-black text-[color:var(--text-main)] uppercase tracking-[0.2em] mb-4 ml-1">Integrity & Restore</h5>

                <div className="flex items-center justify-between p-4 bg-[color:var(--console-dark)]/20 border border-white/5 rounded-md">
                  <div>
                    <h4 className="font-black text-[color:var(--text-main)] text-xs uppercase tracking-widest mb-1">Automated Integrity Test</h4>
                    <p className="text-[10px] text-[color:var(--text-sub)] font-medium opacity-60 uppercase">Periodically verify restoration paths</p>
                  </div>
                  <Toggle
                    checked={config.testRestoreEnabled}
                    onChange={(checked) => {
                      onConfigChange({ testRestoreEnabled: checked });
                      setIsFormDirty(true);
                    }}
                  />
                </div>

                <div className="p-5 bg-[color:var(--console-dark)]/10 border border-white/5 rounded-md">
                  <label htmlFor="restore-point-limit" className="block text-[10px] font-black text-[color:var(--text-sub)] mb-3 uppercase tracking-widest ml-1">
                    Restore Point Cap
                  </label>
                  <input
                    type="number"
                    id="restore-point-limit"
                    min="1"
                    max="100"
                    value={config.restorePointLimit}
                    onChange={(e) => {
                      onConfigChange({ restorePointLimit: parseInt(e.target.value) || 10 });
                      setIsFormDirty(true);
                    }}
                    className="w-full h-10 px-4 bg-[color:var(--console-dark)] border border-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-[color:var(--text-main)] text-sm font-bold"
                  />
                  <p className="text-[9px] text-[color:var(--text-sub)] font-black uppercase tracking-tight mt-2 italic opacity-40 ml-1">Maximum versioned snapshots to maintain (1-100)</p>
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


