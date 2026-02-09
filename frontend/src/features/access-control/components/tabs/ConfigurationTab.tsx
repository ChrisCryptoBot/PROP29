/**
 * Configuration Tab Component
 * Extracted from monolithic AccessControlModule.tsx (lines 3216-3558)
 * 
 * Gold Standard Checklist:
 * ✅ Uses useAccessControlContext() hook - consumes data from context
 * ✅ Wrapped in ErrorBoundary - error isolation
 * ✅ React.memo applied - prevents unnecessary re-renders
 * ✅ Accessibility (a11y) - ARIA labels, keyboard navigation, semantic HTML
 */

import React, { useState, useCallback, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { Badge } from '../../../../components/UI/Badge';
import { ErrorBoundary } from '../../../../components/UI/ErrorBoundary';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { Modal } from '../../../../components/UI/Modal';
import { useAccessControlContext } from '../../context/AccessControlContext';
import { showSuccess, showError } from '../../../../utils/toast';
import apiService from '../../../../services/ApiService';
import { cn } from '../../../../utils/cn';
import type { AccessPointGroup, RoleZoneMapping } from '../../../../services/AccessControlUtilities';
import {
  BiometricConfigModal,
  AccessTimeoutsConfigModal,
  EmergencyOverrideConfigModal,
  AccessLoggingConfigModal,
  NotificationSettingsConfigModal,
  BackupRecoveryConfigModal,
  ConfirmDeleteModal,
  type BiometricConfig,
  type AccessTimeoutsConfig,
  type EmergencyOverrideConfig,
  type AccessLoggingConfig,
  type NotificationSettingsConfig,
  type BackupRecoveryConfig
} from '../modals';

/**
 * Configuration Tab Component
 * Displays system configuration options and settings
 */
const ConfigurationTabComponent: React.FC = () => {
  const {
    metrics,
    auditLog,
  } = useAccessControlContext();

  // Local UI state for configuration modals and forms
  const [configFormDirty, setConfigFormDirty] = useState(false);
  const [accessPointGroups, setAccessPointGroups] = useState<AccessPointGroup[]>([]);
  const [roleZoneMappings, setRoleZoneMappings] = useState<RoleZoneMapping[]>([]);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showCreateMappingModal, setShowCreateMappingModal] = useState(false);
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [showEditMappingModal, setShowEditMappingModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<AccessPointGroup | null>(null);
  const [editingMapping, setEditingMapping] = useState<RoleZoneMapping | null>(null);
  const [groupForm, setGroupForm] = useState({ name: '', description: '', accessPoints: '' });
  const [mappingForm, setMappingForm] = useState({ role: '', zoneName: '', accessPoints: '' });
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [showDeleteGroupModal, setShowDeleteGroupModal] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<AccessPointGroup | null>(null);
  const [showDeleteMappingModal, setShowDeleteMappingModal] = useState(false);
  const [mappingToDelete, setMappingToDelete] = useState<RoleZoneMapping | null>(null);

  // Modals state
  const [showBiometricConfig, setShowBiometricConfig] = useState(false);
  const [biometricConfig, setBiometricConfig] = useState<BiometricConfig>({
    enabled: false, requireFingerprint: true, requireFaceId: false, requireIris: false, requireVoice: false,
    fallbackToCard: true, highSecurityOnly: false, enrollmentRequired: true, retentionPeriod: 30
  });
  const [biometricModalDirty, setBiometricModalDirty] = useState(false);

  const [showTimeoutsConfig, setShowTimeoutsConfig] = useState(false);
  const [timeoutsConfig, setTimeoutsConfig] = useState<AccessTimeoutsConfig>({
    enabled: true, defaultTimeout: 60, temporaryAccessTimeout: 30, emergencyTimeout: 30, visitorTimeout: 24,
    extendable: true, warningBeforeExpiry: true, warningDuration: 5, autoRevoke: true, notificationOnExpiry: true
  });
  const [timeoutsModalDirty, setTimeoutsModalDirty] = useState(false);

  const [showEmergencyConfig, setShowEmergencyConfig] = useState(false);
  const [emergencyConfig, setEmergencyConfig] = useState<EmergencyOverrideConfig>({
    enabled: true, requireAuthorization: true, authorizedRoles: ['admin', 'security'], lockdownDuration: 60,
    unlockDuration: 30, autoRestore: true, requireAuditLog: true, requireConfirmation: true,
    notificationRecipients: ['security@hotel.com'], escalationLevel: 'critical'
  });
  const [emergencyModalDirty, setEmergencyModalDirty] = useState(false);

  const [showLoggingConfig, setShowLoggingConfig] = useState(false);
  const [loggingConfig, setLoggingConfig] = useState<AccessLoggingConfig>({
    enabled: true, logLevel: 'standard', retentionPeriod: 90, logSuccessfulAccess: true, logDeniedAccess: true,
    logEmergencyActions: true, logBiometricAccess: false, includeLocation: true, includeTime: true,
    includeUserInfo: true, includeDeviceInfo: false, compressOldLogs: true, exportFormat: 'json',
    autoArchive: true, archiveAfterDays: 30
  });
  const [loggingModalDirty, setLoggingModalDirty] = useState(false);

  const [showNotificationConfig, setShowNotificationConfig] = useState(false);
  const [notificationConfig, setNotificationConfig] = useState<NotificationSettingsConfig>({
    enabled: true, emailNotifications: true, smsNotifications: false, pushNotifications: true,
    notifyOnAccessDenied: true, notifyOnEmergencyAction: true, notifyOnHeldOpenAlarm: true,
    notifyOnTimeoutExpiry: false, notifyOnBannedAttempt: true, notifyOnOfflineDevice: true,
    notifyAdminsOnly: true, notificationEmail: 'alerts@hotel.com', notificationSms: '',
    quietHoursEnabled: false, quietHoursStart: '22:00', quietHoursEnd: '06:00', criticalOnlyInQuietHours: true
  });
  const [notificationModalDirty, setNotificationModalDirty] = useState(false);

  const [showBackupConfig, setShowBackupConfig] = useState(false);
  const [testConnectionLoading, setTestConnectionLoading] = useState(false);
  const [backupConfig, setBackupConfig] = useState<BackupRecoveryConfig>({
    enabled: true, backupFrequency: 'daily', customBackupSchedule: '', backupLocation: 'cloud',
    cloudProvider: 'aws', retentionDays: 30, encryptBackups: true, compressionEnabled: true,
    includeAccessLogs: true, includeUserData: true, includeConfig: true, autoBackup: true,
    backupOnConfigChange: true, testRestoreEnabled: false, restorePointLimit: 10
  });
  const [backupModalDirty, setBackupModalDirty] = useState(false);

  // Consolidated dirty state for the main save/reset buttons
  React.useEffect(() => {
    const anyModalDirty = biometricModalDirty || timeoutsModalDirty || emergencyModalDirty ||
      loggingModalDirty || notificationModalDirty || backupModalDirty;
    setConfigFormDirty(anyModalDirty);
  }, [biometricModalDirty, timeoutsModalDirty, emergencyModalDirty, loggingModalDirty, notificationModalDirty, backupModalDirty]);

  const handleSaveConfiguration = useCallback(async () => {
    // Persist configuration to localStorage for session persistence
    // Note: Full backend integration pending - configuration is stored locally for this session
    try {
      const configData = {
        biometric: biometricConfig,
        timeouts: timeoutsConfig,
        emergency: emergencyConfig,
        logging: loggingConfig,
        notification: notificationConfig,
        backup: backupConfig,
        accessPointGroups,
        roleZoneMappings,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem('access-control-config', JSON.stringify(configData));
      showSuccess('Configuration saved locally. Changes will persist for this browser session.');
      setConfigFormDirty(false);
      setBiometricModalDirty(false);
      setTimeoutsModalDirty(false);
      setEmergencyModalDirty(false);
      setLoggingModalDirty(false);
      setNotificationModalDirty(false);
      setBackupModalDirty(false);
    } catch (error) {
      showError('Failed to save configuration. Please try again.');
    }
  }, [biometricConfig, timeoutsConfig, emergencyConfig, loggingConfig, notificationConfig, backupConfig, accessPointGroups, roleZoneMappings]);

  // Load saved configuration on mount
  React.useEffect(() => {
    try {
      const savedConfig = localStorage.getItem('access-control-config');
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        if (config.biometric) setBiometricConfig(config.biometric);
        if (config.timeouts) setTimeoutsConfig(config.timeouts);
        if (config.emergency) setEmergencyConfig(config.emergency);
        if (config.logging) setLoggingConfig(config.logging);
        if (config.notification) setNotificationConfig(config.notification);
        if (config.backup) setBackupConfig(config.backup);
        if (config.accessPointGroups) setAccessPointGroups(config.accessPointGroups);
        if (config.roleZoneMappings) setRoleZoneMappings(config.roleZoneMappings);
      }
    } catch (error) {
      // Silently fail - use defaults
    }
  }, []);

  const handleResetConfiguration = useCallback(() => {
    setShowResetConfirmModal(true);
  }, []);

  const handleConfirmResetConfiguration = useCallback(() => {
    setShowResetConfirmModal(false);
    // Reset all configs to their initial states
    setBiometricConfig({
      enabled: false, requireFingerprint: true, requireFaceId: false, requireIris: false, requireVoice: false,
      fallbackToCard: true, highSecurityOnly: false, enrollmentRequired: true, retentionPeriod: 30
    });
    setTimeoutsConfig({
      enabled: true, defaultTimeout: 60, temporaryAccessTimeout: 30, emergencyTimeout: 30, visitorTimeout: 24,
      extendable: true, warningBeforeExpiry: true, warningDuration: 5, autoRevoke: true, notificationOnExpiry: true
    });
    setEmergencyConfig({
      enabled: true, requireAuthorization: true, authorizedRoles: ['admin', 'security'], lockdownDuration: 60,
      unlockDuration: 30, autoRestore: true, requireAuditLog: true, requireConfirmation: true,
      notificationRecipients: ['security@hotel.com'], escalationLevel: 'critical'
    });
    setLoggingConfig({
      enabled: true, logLevel: 'standard', retentionPeriod: 90, logSuccessfulAccess: true, logDeniedAccess: true,
      logEmergencyActions: true, logBiometricAccess: false, includeLocation: true, includeTime: true,
      includeUserInfo: true, includeDeviceInfo: false, compressOldLogs: true, exportFormat: 'json',
      autoArchive: true, archiveAfterDays: 30
    });
    setNotificationConfig({
      enabled: true, emailNotifications: true, smsNotifications: false, pushNotifications: true,
      notifyOnAccessDenied: true, notifyOnEmergencyAction: true, notifyOnHeldOpenAlarm: true,
      notifyOnTimeoutExpiry: false, notifyOnBannedAttempt: true, notifyOnOfflineDevice: true,
      notifyAdminsOnly: true, notificationEmail: 'alerts@hotel.com', notificationSms: '',
      quietHoursEnabled: false, quietHoursStart: '22:00', quietHoursEnd: '06:00', criticalOnlyInQuietHours: true
    });
    setBackupConfig({
      enabled: true, backupFrequency: 'daily', customBackupSchedule: '', backupLocation: 'cloud',
      cloudProvider: 'aws', retentionDays: 30, encryptBackups: true, compressionEnabled: true,
      includeAccessLogs: true, includeUserData: true, includeConfig: true, autoBackup: true,
      backupOnConfigChange: true, testRestoreEnabled: false, restorePointLimit: 10
    });

    setConfigFormDirty(false);
    setBiometricModalDirty(false);
    setTimeoutsModalDirty(false);
    setEmergencyModalDirty(false);
    setLoggingModalDirty(false);
    setNotificationModalDirty(false);
    setBackupModalDirty(false);
    showSuccess('Configuration reset to defaults');
  }, []);

  const handleEditAccessPointGroup = useCallback((group: AccessPointGroup) => {
    setEditingGroup(group);
    setGroupForm({
      name: group.name,
      description: group.description || '',
      accessPoints: group.accessPointIds.join(', ')
    });
    setShowEditGroupModal(true);
  }, []);

  const handleEditRoleZoneMapping = useCallback((mapping: RoleZoneMapping) => {
    setEditingMapping(mapping);
    setMappingForm({
      role: mapping.role,
      zoneName: mapping.zoneName,
      accessPoints: mapping.accessPointIds.join(', ')
    });
    setShowEditMappingModal(true);
  }, []);

  const handleUpdateGroup = useCallback(() => {
    if (!editingGroup) return;
    if (!groupForm.name.trim()) {
      showError('Group name is required.');
      return;
    }
    const accessPointIds = groupForm.accessPoints
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    setAccessPointGroups((prev) => prev.map(g =>
      g.id === editingGroup.id
        ? {
            ...g,
            name: groupForm.name.trim(),
            description: groupForm.description.trim(),
            accessPointIds,
            updatedAt: new Date().toISOString()
          }
        : g
    ));
    setGroupForm({ name: '', description: '', accessPoints: '' });
    setShowEditGroupModal(false);
    setEditingGroup(null);
    showSuccess('Access point group updated.');
  }, [editingGroup, groupForm]);

  const handleUpdateMapping = useCallback(() => {
    if (!editingMapping) return;
    if (!mappingForm.role.trim() || !mappingForm.zoneName.trim()) {
      showError('Role and zone name are required.');
      return;
    }
    const accessPointIds = mappingForm.accessPoints
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    setRoleZoneMappings((prev) => prev.map(m =>
      m.id === editingMapping.id
        ? {
            ...m,
            role: mappingForm.role.trim(),
            zoneName: mappingForm.zoneName.trim(),
            accessPointIds,
            updatedAt: new Date().toISOString()
          }
        : m
    ));
    setMappingForm({ role: '', zoneName: '', accessPoints: '' });
    setShowEditMappingModal(false);
    setEditingMapping(null);
    showSuccess('Role-to-zone mapping updated.');
  }, [editingMapping, mappingForm]);

  const handleTestConnection = useCallback(async () => {
    setTestConnectionLoading(true);
    try {
      await apiService.get('/access-control/points');
      showSuccess('Connection OK. Access-control API is reachable.');
    } catch {
      showError('Connection failed. Check network and API availability.');
    } finally {
      setTestConnectionLoading(false);
    }
  }, []);

  const handleConfirmDeleteGroup = useCallback(() => {
    if (!groupToDelete) return;
    setAccessPointGroups(prev => prev.filter(g => g.id !== groupToDelete.id));
    setShowDeleteGroupModal(false);
    setGroupToDelete(null);
    showSuccess(`Access point group "${groupToDelete.name}" deleted`);
  }, [groupToDelete]);

  const handleConfirmDeleteMapping = useCallback(() => {
    if (!mappingToDelete) return;
    setRoleZoneMappings(prev => prev.filter(m => 
      m.role !== mappingToDelete.role || m.zoneName !== mappingToDelete.zoneName
    ));
    setShowDeleteMappingModal(false);
    setMappingToDelete(null);
    showSuccess(`Role-zone mapping "${mappingToDelete.role}" → "${mappingToDelete.zoneName}" deleted`);
  }, [mappingToDelete]);

  const handleCreateGroup = useCallback(() => {
    if (!groupForm.name.trim()) {
      showError('Group name is required.');
      return;
    }
    const now = new Date().toISOString();
    const accessPointIds = groupForm.accessPoints
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    const newGroup: AccessPointGroup = {
      id: crypto.randomUUID(),
      name: groupForm.name.trim(),
      description: groupForm.description.trim(),
      accessPointIds,
      createdAt: now,
      updatedAt: now
    };
    setAccessPointGroups((prev) => [...prev, newGroup]);
    setGroupForm({ name: '', description: '', accessPoints: '' });
    setShowCreateGroupModal(false);
    showSuccess('Access point group created.');
  }, [groupForm]);

  const handleCreateMapping = useCallback(() => {
    if (!mappingForm.role.trim() || !mappingForm.zoneName.trim()) {
      showError('Role and zone name are required.');
      return;
    }
    const now = new Date().toISOString();
    const accessPointIds = mappingForm.accessPoints
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    const newMapping: RoleZoneMapping = {
      id: crypto.randomUUID(),
      role: mappingForm.role.trim(),
      zoneName: mappingForm.zoneName.trim(),
      accessPointIds,
      createdAt: now,
      updatedAt: now
    };
    setRoleZoneMappings((prev) => [...prev, newMapping]);
    setMappingForm({ role: '', zoneName: '', accessPoints: '' });
    setShowCreateMappingModal(false);
    showSuccess('Role-to-zone mapping created.');
  }, [mappingForm]);

  return (
    <div className="space-y-6" role="main" aria-label="Configuration">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="page-title">Configuration</h2>
          <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic">
            System settings, permissions, and security policies
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="h-10 border-white/5 hover:bg-white/10 text-[color:var(--text-sub)] hover:text-white font-black uppercase tracking-widest px-6 shadow-none"
            onClick={handleTestConnection}
            disabled={testConnectionLoading}
            aria-label="Test access-control API connection"
          >
            <i className={cn('fas mr-2', testConnectionLoading ? 'fa-spinner fa-spin' : 'fa-plug')} aria-hidden="true" />
            Test connection
          </Button>
          <Button
            variant="glass"
            onClick={handleSaveConfiguration}
            disabled={!configFormDirty}
            aria-label="Save configuration changes"
            aria-disabled={!configFormDirty}
            className="h-10 font-black uppercase tracking-widest px-8 shadow-none"
          >
            <i className="fas fa-save mr-2" aria-hidden="true" />
            Save Changes
          </Button>
          <Button
            variant="outline"
            className="h-10 border-white/5 hover:bg-white/10 text-[color:var(--text-sub)] hover:text-white font-black uppercase tracking-widest px-8 shadow-none"
            onClick={handleResetConfiguration}
            aria-label="Reset configuration to defaults"
          >
            <i className="fas fa-undo mr-2" aria-hidden="true" />
            Reset
          </Button>
        </div>
      </div>

      {/* Configuration Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" role="group" aria-label="Configuration sections">
        {/* Security Settings */}
        <Card className="bg-slate-900/50 border border-white/5">
          <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
            <CardTitle className="flex items-center">
              <div className="card-title-icon-box" aria-hidden="true">
                <i className="fas fa-shield-alt text-white" />
              </div>
              <span className="card-title-text">Security Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
              <div>
                <h4 className="font-bold text-[color:var(--text-main)] uppercase tracking-wide text-sm">Biometric Authentication</h4>
                <p className="text-xs text-[color:var(--text-sub)] mt-1">Enable biometric access for high-security areas</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-white/5 hover:bg-white/10 text-blue-300"
                onClick={() => {
                  setBiometricModalDirty(false);
                  setShowBiometricConfig(true);
                }}
                aria-label="Configure biometric authentication"
              >
                Configure
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
              <div>
                <h4 className="font-bold text-[color:var(--text-main)] uppercase tracking-wide text-sm">Access Timeouts</h4>
                <p className="text-xs text-[color:var(--text-sub)] mt-1">Configure automatic access expiration</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-white/5 hover:bg-white/10 text-blue-300"
                onClick={() => {
                  setTimeoutsModalDirty(false);
                  setShowTimeoutsConfig(true);
                }}
                aria-label="Configure access timeouts"
              >
                Configure
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
              <div>
                <h4 className="font-bold text-[color:var(--text-main)] uppercase tracking-wide text-sm">Emergency Override</h4>
                <p className="text-xs text-[color:var(--text-sub)] mt-1">Emergency access settings</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-white/5 hover:bg-white/10 text-blue-300"
                onClick={() => {
                  setEmergencyModalDirty(false);
                  setShowEmergencyConfig(true);
                }}
                aria-label="Configure emergency override"
              >
                Configure
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card className="bg-slate-900/50 border border-white/5">
          <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
            <CardTitle className="flex items-center">
              <div className="card-title-icon-box" aria-hidden="true">
                <i className="fas fa-cog text-white" />
              </div>
              <span className="card-title-text">System Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
              <div>
                <h4 className="font-bold text-[color:var(--text-main)] uppercase tracking-wide text-sm">Access Logging</h4>
                <p className="text-xs text-[color:var(--text-sub)] mt-1">Configure access event logging</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-white/5 hover:bg-white/10 text-blue-300"
                onClick={() => {
                  setLoggingModalDirty(false);
                  setShowLoggingConfig(true);
                }}
                aria-label="Configure access logging"
              >
                Configure
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
              <div>
                <h4 className="font-bold text-[color:var(--text-main)] uppercase tracking-wide text-sm">Notification Settings</h4>
                <p className="text-xs text-[color:var(--text-sub)] mt-1">Access alert notifications</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-white/5 hover:bg-white/10 text-blue-300"
                onClick={() => {
                  setNotificationModalDirty(false);
                  setShowNotificationConfig(true);
                }}
                aria-label="Configure notification settings"
              >
                Configure
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
              <div>
                <h4 className="font-bold text-[color:var(--text-main)] uppercase tracking-wide text-sm">Backup & Recovery</h4>
                <p className="text-xs text-[color:var(--text-sub)] mt-1">System backup configuration</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-white/5 hover:bg-white/10 text-blue-300"
                onClick={() => {
                  setBackupModalDirty(false);
                  setShowBackupConfig(true);
                }}
                aria-label="Configure backup and recovery"
              >
                Configure
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Access Point Grouping Section */}
      <Card className="bg-slate-900/50 border border-white/5">
        <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="card-title-icon-box" aria-hidden="true">
                <i className="fas fa-layer-group text-white" />
              </div>
              <span className="card-title-text">Access Point Grouping</span>
            </div>
            <Button
              variant="glass"
              size="sm"
              onClick={() => setShowCreateGroupModal(true)}
              aria-label="Create new access point group"
              className="font-black uppercase tracking-widest px-6 border-white/5"
            >
              <i className="fas fa-plus mr-2" aria-hidden="true" />
              Create Group
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-sm text-[color:var(--text-sub)] mb-6 font-medium">
            Group access points together (e.g., "Floor 4", "Housekeeping Closets") for bulk permission management.
          </p>
          {accessPointGroups.length > 0 ? (
            <div className="space-y-3" role="list" aria-label="Access point groups">
              {accessPointGroups.map((group) => (
                <div
                  key={group.id}
                  className="p-4 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 transition-colors"
                  role="listitem"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-bold text-[color:var(--text-main)] mb-1 uppercase tracking-wide text-sm">{group.name}</h4>
                      <p className="text-xs text-[color:var(--text-sub)] mb-3">{group.description}</p>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                          <i className="fas fa-door-open mr-1" aria-hidden="true" />
                          {group.accessPointIds.length} access point{group.accessPointIds.length !== 1 ? 's' : ''}
                        </Badge>
                        <span className="text-[10px] text-[color:var(--text-sub)] font-mono uppercase">
                          Created: {new Date(group.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/5 hover:bg-white/10 text-blue-300 h-8 text-[10px]"
                        onClick={() => handleEditAccessPointGroup(group)}
                        aria-label={`Edit access point group ${group.name}`}
                      >
                        <i className="fas fa-edit mr-1" aria-hidden="true" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 h-8 text-[10px]"
                        onClick={() => {
                          setGroupToDelete(group);
                          setShowDeleteGroupModal(true);
                        }}
                        aria-label={`Delete access point group ${group.name}`}
                      >
                        <i className="fas fa-trash mr-1" aria-hidden="true" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="fas fa-layer-group"
              title="No Access Point Groups"
              description="Create groups to manage multiple access points together"
              action={{
                label: 'Create First Group',
                onClick: () => setShowCreateGroupModal(true),
                variant: 'outline'
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Role-to-Zone Mapping Section */}
      <Card className="bg-slate-900/50 border border-white/5">
        <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="card-title-icon-box" aria-hidden="true">
                <i className="fas fa-route text-white" />
              </div>
              <span className="card-title-text">Role-to-Zone Mapping</span>
            </div>
            <Button
              variant="glass"
              size="sm"
              onClick={() => setShowCreateMappingModal(true)}
              aria-label="Create new role-zone mapping"
              className="font-black uppercase tracking-widest px-6 border-white/5"
            >
              <i className="fas fa-plus mr-2" aria-hidden="true" />
              Create Mapping
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-sm text-[color:var(--text-sub)] mb-6 font-medium">
            Map roles (e.g., "Housekeeping", "Security") to access zones for automatic permission assignment.
          </p>
          {roleZoneMappings.length > 0 ? (
            <div className="space-y-3" role="list" aria-label="Role-zone mappings">
              {roleZoneMappings.map((mapping) => (
                <div
                  key={mapping.id}
                  className="p-4 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 transition-colors"
                  role="listitem"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-blue-500/20 text-blue-300 border-none">
                          {mapping.role}
                        </Badge>
                        <span className="font-bold text-[color:var(--text-sub)]" aria-hidden="true">→</span>
                        <Badge variant="outline" className="border-white/20 text-[color:var(--text-main)]">
                          {mapping.zoneName}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                          <i className="fas fa-door-open mr-1" aria-hidden="true" />
                          {mapping.accessPointIds.length} access point{mapping.accessPointIds.length !== 1 ? 's' : ''}
                        </Badge>
                        <span className="text-[10px] text-[color:var(--text-sub)] font-mono uppercase">
                          Updated: {new Date(mapping.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/5 hover:bg-white/10 text-blue-300 h-8 text-[10px]"
                        onClick={() => handleEditRoleZoneMapping(mapping)}
                        aria-label={`Edit role-zone mapping ${mapping.role} to ${mapping.zoneName}`}
                      >
                        <i className="fas fa-edit mr-1" aria-hidden="true" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 h-8 text-[10px]"
                        onClick={() => {
                          setMappingToDelete(mapping);
                          setShowDeleteMappingModal(true);
                        }}
                        aria-label={`Delete role-zone mapping ${mapping.role} to ${mapping.zoneName}`}
                      >
                        <i className="fas fa-trash mr-1" aria-hidden="true" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="fas fa-route"
              title="No Role-Zone Mappings"
              description="Create mappings to automatically assign access points to users based on their role"
              action={{
                label: 'Create First Mapping',
                onClick: () => setShowCreateMappingModal(true),
                variant: 'outline'
              }}
            />
          )}
        </CardContent>
      </Card>

      <Card className="bg-slate-900/50 border border-white/5">
        <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="card-title-icon-box" aria-hidden="true">
                <i className="fas fa-clipboard-list text-white" />
              </div>
              <span className="card-title-text">Recent Audit Trail</span>
            </div>
            {auditLog.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const header = 'Timestamp,Actor,Action,Status,Target,Reason\n';
                  const rows = auditLog.map(entry => {
                    const safe = (value?: string) => `"${(value || '').replace(/"/g, '""')}"`;
                    return [
                      safe(entry.timestamp),
                      safe(entry.actor),
                      safe(entry.action),
                      safe(entry.status),
                      safe(entry.target),
                      safe(entry.reason)
                    ].join(',');
                  }).join('\n');
                  const blob = new Blob([header + rows], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `access-control-audit-${new Date().toISOString().split('T')[0]}.csv`;
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                  window.URL.revokeObjectURL(url);
                }}
                className="border-white/5 hover:bg-white/10 text-blue-300"
              >
                Export CSV
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {auditLog.length > 0 ? (
            <div className="space-y-3" role="list" aria-label="Recent audit entries">
              {auditLog.slice(0, 5).map(entry => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 border border-white/5 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                  role="listitem"
                >
                  <div>
                    <p className="text-[10px] font-black text-[color:var(--text-main)] uppercase tracking-widest">
                      {entry.action}
                    </p>
                    <p className="text-[9px] text-[color:var(--text-sub)] uppercase tracking-widest mt-1">
                      {entry.actor} • {new Date(entry.timestamp).toLocaleString()}
                    </p>
                    {entry.reason && (
                      <p className="text-[9px] text-[color:var(--text-sub)] uppercase tracking-widest mt-1">
                        Reason: {entry.reason}
                      </p>
                    )}
                  </div>
                  <Badge
                    className={entry.status === 'success'
                      ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                      : entry.status === 'failure'
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : 'bg-white/5 text-[color:var(--text-sub)] border border-white/5'
                    }
                    size="sm"
                    aria-label={`Audit status: ${entry.status}`}
                  >
                    {entry.status.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="fas fa-clipboard-list"
              title="No audit entries"
              description="Audit activity will appear here as actions are performed."
              className="bg-black/20 border-dashed border-2 border-white/5 rounded-3xl p-12"
            />
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <Modal
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        title="Create Access Point Group"
        size="lg"
        footer={
          <>
            <Button variant="subtle" onClick={() => setShowCreateGroupModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateGroup} className="shadow-none hover:shadow-none">
              Save Group
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-[color:var(--text-sub)] uppercase tracking-widest mb-2">
              Group Name
            </label>
            <input
              type="text"
              value={groupForm.name}
              onChange={(e) => setGroupForm((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full h-10 px-4 bg-[color:var(--console-dark)] border border-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-[color:var(--text-main)] text-sm font-bold"
              placeholder="e.g. Lobby Doors"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-[color:var(--text-sub)] uppercase tracking-widest mb-2">
              Description
            </label>
            <input
              type="text"
              value={groupForm.description}
              onChange={(e) => setGroupForm((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full h-10 px-4 bg-[color:var(--console-dark)] border border-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-[color:var(--text-main)] text-sm font-bold"
              placeholder="Optional summary"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-[color:var(--text-sub)] uppercase tracking-widest mb-2">
              Access Point IDs (comma-separated)
            </label>
            <input
              type="text"
              value={groupForm.accessPoints}
              onChange={(e) => setGroupForm((prev) => ({ ...prev, accessPoints: e.target.value }))}
              className="w-full h-10 px-4 bg-[color:var(--console-dark)] border border-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-[color:var(--text-main)] text-sm font-bold"
              placeholder="ap-1, ap-2"
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showCreateMappingModal}
        onClose={() => setShowCreateMappingModal(false)}
        title="Create Role-to-Zone Mapping"
        size="lg"
        footer={
          <>
            <Button variant="subtle" onClick={() => setShowCreateMappingModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateMapping} className="shadow-none hover:shadow-none">
              Save Mapping
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-[color:var(--text-sub)] uppercase tracking-widest mb-2">
              Role
            </label>
            <input
              type="text"
              value={mappingForm.role}
              onChange={(e) => setMappingForm((prev) => ({ ...prev, role: e.target.value }))}
              className="w-full h-10 px-4 bg-[color:var(--console-dark)] border border-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-[color:var(--text-main)] text-sm font-bold"
              placeholder="e.g. Security"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-[color:var(--text-sub)] uppercase tracking-widest mb-2">
              Zone Name
            </label>
            <input
              type="text"
              value={mappingForm.zoneName}
              onChange={(e) => setMappingForm((prev) => ({ ...prev, zoneName: e.target.value }))}
              className="w-full h-10 px-4 bg-[color:var(--console-dark)] border border-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-[color:var(--text-main)] text-sm font-bold"
              placeholder="e.g. Floor 4"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-[color:var(--text-sub)] uppercase tracking-widest mb-2">
              Access Point IDs (comma-separated)
            </label>
            <input
              type="text"
              value={mappingForm.accessPoints}
              onChange={(e) => setMappingForm((prev) => ({ ...prev, accessPoints: e.target.value }))}
              className="w-full h-10 px-4 bg-[color:var(--console-dark)] border border-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-[color:var(--text-main)] text-sm font-bold"
              placeholder="ap-1, ap-2"
            />
          </div>
        </div>
      </Modal>

      {/* Edit Access Point Group Modal */}
      <Modal
        isOpen={showEditGroupModal}
        onClose={() => {
          setShowEditGroupModal(false);
          setEditingGroup(null);
          setGroupForm({ name: '', description: '', accessPoints: '' });
        }}
        title="Edit Access Point Group"
        size="lg"
        footer={
          <>
            <Button variant="subtle" onClick={() => {
              setShowEditGroupModal(false);
              setEditingGroup(null);
              setGroupForm({ name: '', description: '', accessPoints: '' });
            }}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleUpdateGroup} className="shadow-none hover:shadow-none">
              Update Group
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-[color:var(--text-sub)] uppercase tracking-widest mb-2">
              Group Name
            </label>
            <input
              type="text"
              value={groupForm.name}
              onChange={(e) => setGroupForm((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full h-10 px-4 bg-[color:var(--console-dark)] border border-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-[color:var(--text-main)] text-sm font-bold"
              placeholder="e.g. Lobby Doors"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-[color:var(--text-sub)] uppercase tracking-widest mb-2">
              Description
            </label>
            <input
              type="text"
              value={groupForm.description}
              onChange={(e) => setGroupForm((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full h-10 px-4 bg-[color:var(--console-dark)] border border-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-[color:var(--text-main)] text-sm font-bold"
              placeholder="Optional summary"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-[color:var(--text-sub)] uppercase tracking-widest mb-2">
              Access Point IDs (comma-separated)
            </label>
            <input
              type="text"
              value={groupForm.accessPoints}
              onChange={(e) => setGroupForm((prev) => ({ ...prev, accessPoints: e.target.value }))}
              className="w-full h-10 px-4 bg-[color:var(--console-dark)] border border-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-[color:var(--text-main)] text-sm font-bold"
              placeholder="ap-1, ap-2"
            />
          </div>
        </div>
      </Modal>

      {/* Edit Role-Zone Mapping Modal */}
      <Modal
        isOpen={showEditMappingModal}
        onClose={() => {
          setShowEditMappingModal(false);
          setEditingMapping(null);
          setMappingForm({ role: '', zoneName: '', accessPoints: '' });
        }}
        title="Edit Role-to-Zone Mapping"
        size="lg"
        footer={
          <>
            <Button variant="subtle" onClick={() => {
              setShowEditMappingModal(false);
              setEditingMapping(null);
              setMappingForm({ role: '', zoneName: '', accessPoints: '' });
            }}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleUpdateMapping} className="shadow-none hover:shadow-none">
              Update Mapping
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-[color:var(--text-sub)] uppercase tracking-widest mb-2">
              Role
            </label>
            <input
              type="text"
              value={mappingForm.role}
              onChange={(e) => setMappingForm((prev) => ({ ...prev, role: e.target.value }))}
              className="w-full h-10 px-4 bg-[color:var(--console-dark)] border border-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-[color:var(--text-main)] text-sm font-bold"
              placeholder="e.g. Security"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-[color:var(--text-sub)] uppercase tracking-widest mb-2">
              Zone Name
            </label>
            <input
              type="text"
              value={mappingForm.zoneName}
              onChange={(e) => setMappingForm((prev) => ({ ...prev, zoneName: e.target.value }))}
              className="w-full h-10 px-4 bg-[color:var(--console-dark)] border border-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-[color:var(--text-main)] text-sm font-bold"
              placeholder="e.g. Floor 4"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-[color:var(--text-sub)] uppercase tracking-widest mb-2">
              Access Point IDs (comma-separated)
            </label>
            <input
              type="text"
              value={mappingForm.accessPoints}
              onChange={(e) => setMappingForm((prev) => ({ ...prev, accessPoints: e.target.value }))}
              className="w-full h-10 px-4 bg-[color:var(--console-dark)] border border-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-[color:var(--text-main)] text-sm font-bold"
              placeholder="ap-1, ap-2"
            />
          </div>
        </div>
      </Modal>

      <BiometricConfigModal
        isOpen={showBiometricConfig}
        onClose={() => setShowBiometricConfig(false)}
        onSave={(config) => {
          setBiometricConfig(config);
          setShowBiometricConfig(false);
          setBiometricModalDirty(false);
          showSuccess('Biometric configuration saved!');
        }}
        config={biometricConfig}
        onConfigChange={(updates) => setBiometricConfig(prev => ({ ...prev, ...updates }))}
        isFormDirty={biometricModalDirty}
        setIsFormDirty={setBiometricModalDirty}
      />

      <AccessTimeoutsConfigModal
        isOpen={showTimeoutsConfig}
        onClose={() => setShowTimeoutsConfig(false)}
        onSave={(config) => {
          setTimeoutsConfig(config);
          setShowTimeoutsConfig(false);
          setTimeoutsModalDirty(false);
          showSuccess('Access timeouts configuration saved!');
        }}
        config={timeoutsConfig}
        onConfigChange={(updates) => setTimeoutsConfig(prev => ({ ...prev, ...updates }))}
        isFormDirty={timeoutsModalDirty}
        setIsFormDirty={setTimeoutsModalDirty}
      />

      <EmergencyOverrideConfigModal
        isOpen={showEmergencyConfig}
        onClose={() => setShowEmergencyConfig(false)}
        onSave={(config) => {
          setEmergencyConfig(config);
          setShowEmergencyConfig(false);
          setEmergencyModalDirty(false);
          showSuccess('Emergency override configuration saved!');
        }}
        config={emergencyConfig}
        onConfigChange={(updates) => setEmergencyConfig(prev => ({ ...prev, ...updates }))}
        isFormDirty={emergencyModalDirty}
        setIsFormDirty={setEmergencyModalDirty}
      />

      <AccessLoggingConfigModal
        isOpen={showLoggingConfig}
        onClose={() => setShowLoggingConfig(false)}
        onSave={(config) => {
          setLoggingConfig(config);
          setShowLoggingConfig(false);
          setLoggingModalDirty(false);
          showSuccess('Access logging configuration saved!');
        }}
        config={loggingConfig}
        onConfigChange={(updates) => setLoggingConfig(prev => ({ ...prev, ...updates }))}
        isFormDirty={loggingModalDirty}
        setIsFormDirty={setLoggingModalDirty}
      />

      <NotificationSettingsConfigModal
        isOpen={showNotificationConfig}
        onClose={() => setShowNotificationConfig(false)}
        onSave={(config) => {
          setNotificationConfig(config);
          setShowNotificationConfig(false);
          setNotificationModalDirty(false);
          showSuccess('Notification settings configuration saved!');
        }}
        config={notificationConfig}
        onConfigChange={(updates) => setNotificationConfig(prev => ({ ...prev, ...updates }))}
        isFormDirty={notificationModalDirty}
        setIsFormDirty={setNotificationModalDirty}
      />

      <BackupRecoveryConfigModal
        isOpen={showBackupConfig}
        onClose={() => setShowBackupConfig(false)}
        onSave={(config) => {
          setBackupConfig(config);
          setShowBackupConfig(false);
          setBackupModalDirty(false);
          showSuccess('Backup & recovery configuration saved!');
        }}
        config={backupConfig}
        onConfigChange={(updates) => setBackupConfig(prev => ({ ...prev, ...updates }))}
        isFormDirty={backupModalDirty}
        setIsFormDirty={setBackupModalDirty}
      />

      <ConfirmDeleteModal
        isOpen={showResetConfirmModal}
        onClose={() => setShowResetConfirmModal(false)}
        onConfirm={handleConfirmResetConfiguration}
        title="Reset Configuration"
        message="Are you sure you want to reset all configuration changes? This cannot be undone."
      />

      <ConfirmDeleteModal
        isOpen={showDeleteGroupModal}
        onClose={() => {
          setShowDeleteGroupModal(false);
          setGroupToDelete(null);
        }}
        onConfirm={handleConfirmDeleteGroup}
        title="Delete Access Point Group"
        message={`Delete group "${groupToDelete?.name}"? This will not delete the access points themselves.`}
        itemName={groupToDelete?.name}
      />

      <ConfirmDeleteModal
        isOpen={showDeleteMappingModal}
        onClose={() => {
          setShowDeleteMappingModal(false);
          setMappingToDelete(null);
        }}
        onConfirm={handleConfirmDeleteMapping}
        title="Delete Role-Zone Mapping"
        message={`Delete role-zone mapping for "${mappingToDelete?.role}" → "${mappingToDelete?.zoneName}"?`}
        itemName={`${mappingToDelete?.role} → ${mappingToDelete?.zoneName}`}
      />
    </div>
  );
};

/**
 * ConfigurationTab with ErrorBoundary
 * Wrapped in ErrorBoundary for error isolation per Gold Standard checklist
 */
export const ConfigurationTab: React.FC = memo(() => {
  return (
    <ErrorBoundary moduleName="Configuration Tab">
      <ConfigurationTabComponent />
    </ErrorBoundary>
  );
});

ConfigurationTab.displayName = 'ConfigurationTab';
export default ConfigurationTab;



