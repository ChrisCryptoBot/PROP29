import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    BannedIndividual,
    DetectionAlert,
    FacialRecognitionStats,
    BannedIndividualsMetrics,
    BannedIndividualsAuditEntry,
    AuditSource
} from '../types/banned-individuals.types';
import { showLoading, dismissLoadingAndShowSuccess, dismissLoadingAndShowError, showError, showSuccess } from '../../../utils/toast';
import { bannedIndividualsService } from '../../../services/BannedIndividualsService';
import { useAuth } from '../../../hooks/useAuth';
import { useWebSocket } from '../../../components/UI/WebSocketProvider';
import { electronBridge } from '../../../services/ElectronBridge';
import { useKeyboardNavigation } from '../../../hooks/useKeyboardNavigation';
import { useOfflineSync } from '../../../hooks/useOfflineSync';

interface BannedIndividualsSettings {
    autoSharePermanentBans: boolean;
    facialRecognitionAlerts: boolean;
    strictIdVerification: boolean;
    auditLogsRetention: string;
    biometricDataPurge: string;
    confidenceThreshold: number;
    retentionDays: number;
}

const MAX_AUDIT_ENTRIES = 500;
const AUDIT_STORAGE_KEY = 'banned_individuals_audit_log';

export const useBannedIndividualsState = () => {
    const { user } = useAuth();
    const propertyId = user?.roles?.[0];
    const { subscribe, isConnected } = useWebSocket();
    
    // Offline sync integration
    const { state: offlineState, isOnline, lastSyncTime: offlineLastSync } = useOfflineSync({
        propertyId,
        autoSync: true,
        syncInterval: 30000
    });
    
    const connectivity = {
        isOnline,
        lastSyncTime: offlineLastSync,
        syncInProgress: offlineState.connectivity.syncInProgress,
        hasUnsyncedChanges: offlineState.connectivity.hasUnsyncedChanges,
        connectionQuality: offlineState.connectivity.connectionQuality,
        syncErrors: offlineState.connectivity.syncErrors
    };

    const [activeTab, setActiveTab] = useState<string>('overview');
    const [loading, setLoading] = useState({
        main: false,
        detections: false,
        settings: false,
        photo: false,
        bulkImport: false
    });
    const [error, setError] = useState<string | null>(null);
    const [lastSynced, setLastSynced] = useState<Date | null>(null);

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showBulkImportModal, setShowBulkImportModal] = useState(false);
    const [bulkImportResults, setBulkImportResults] = useState<{
        success: number;
        failed: number;
        errors: Array<{ row: number; error: string }>;
    } | null>(null);
    const [showAdvancedFiltersModal, setShowAdvancedFiltersModal] = useState(false);
    const [showPhotoUploadModal, setShowPhotoUploadModal] = useState(false);
    const [showVideoFootageModal, setShowVideoFootageModal] = useState(false);
    const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);

    // Audit logging state
    const [auditLog, setAuditLog] = useState<BannedIndividualsAuditEntry[]>(() => {
        try {
            const stored = localStorage.getItem(AUDIT_STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    // Selection/Filtering state
    const [selectedIndividual, setSelectedIndividual] = useState<BannedIndividual | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [filterRiskLevel, setFilterRiskLevel] = useState<string>('ALL');
    const [filterBanType, setFilterBanType] = useState<string>('ALL');
    const [filterNationality, setFilterNationality] = useState<string>('ALL');
    const [selectedIndividuals, setSelectedIndividuals] = useState<string[]>([]);

    // Data state
    const [bannedIndividuals, setBannedIndividuals] = useState<BannedIndividual[]>([]);
    const [detectionAlerts, setDetectionAlerts] = useState<DetectionAlert[]>([]);
    const [facialRecognitionStats, setFacialRecognitionStats] = useState<FacialRecognitionStats>({
        accuracy: 0,
        trainingStatus: 'NEEDS_TRAINING',
        totalFaces: 0,
        activeModels: 0,
        lastTraining: ''
    });

    const [metrics, setMetrics] = useState<BannedIndividualsMetrics>({
        activeBans: 0,
        recentDetections: 0,
        facialRecognitionAccuracy: 0,
        chainWideBans: 0
    });

    // Settings state
    const [settings, setSettings] = useState<BannedIndividualsSettings>({
        autoSharePermanentBans: true,
        facialRecognitionAlerts: true,
        strictIdVerification: false,
        auditLogsRetention: '180',
        biometricDataPurge: '30',
        confidenceThreshold: 85,
        retentionDays: 180
    });

    // Hardware integration state
    const [hardwareStatus, setHardwareStatus] = useState<{
        cameras: Array<{ id: string; name: string; status: 'online' | 'offline' | 'error'; lastSeen: Date }>;
        lastKnownGoodState: Date | null;
    }>({
        cameras: [],
        lastKnownGoodState: null
    });

    // Refs for stable callbacks
    const fetchDataRef = useRef<() => Promise<void>>();
    
    // Detection alert queue management for race condition handling
    const processingAlerts = useRef<Set<string>>(new Set());
    const alertQueue = useRef<DetectionAlert[]>([]);
    const isProcessingQueue = useRef(false);

    // Audit logging helper
    const resolveActor = useCallback(() => {
        if (!user) return 'System';
        return `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'Unknown User';
    }, [user]);

    const recordAuditEntry = useCallback((entry: {
        action: string;
        status: 'success' | 'failure' | 'info';
        target?: string;
        reason?: string;
        source?: AuditSource;
        metadata?: Record<string, any>;
    }) => {
        const source: AuditSource = entry.source || 'web_admin';
        const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        
        const auditEntry: BannedIndividualsAuditEntry = {
            id,
            timestamp: new Date().toISOString(),
            actor: resolveActor(),
            action: entry.action,
            status: entry.status,
            target: entry.target,
            reason: entry.reason,
            source,
            metadata: entry.metadata
        };

        setAuditLog((prev) => {
            const nextLog = [auditEntry, ...prev].slice(0, MAX_AUDIT_ENTRIES);
            try {
                localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(nextLog));
            } catch (error) {
                console.warn('Failed to persist audit log', { module: 'BannedIndividuals', action: 'recordAuditEntry' });
            }
            return nextLog;
        });

        // Sync with backend (non-blocking)
        if (propertyId) {
            bannedIndividualsService.logAuditEntry({
                actor: auditEntry.actor,
                action: auditEntry.action,
                status: auditEntry.status,
                target: auditEntry.target,
                reason: auditEntry.reason,
                source: auditEntry.source,
                metadata: auditEntry.metadata
            }).catch(() => {
                // Silently fail - audit is best effort
                console.warn('Audit sync failed', { module: 'BannedIndividuals', action: 'recordAuditEntry' });
            });
        }
    }, [resolveActor, propertyId]);

    // Fetch detection alerts
    const fetchDetectionAlerts = useCallback(async () => {
        setLoading(prev => ({ ...prev, detections: true }));
        try {
            const alerts = await bannedIndividualsService.getDetectionAlerts(propertyId, 100);
            setDetectionAlerts(alerts);
            setMetrics(prev => ({ ...prev, recentDetections: alerts.filter(a => {
                const alertDate = new Date(a.timestamp);
                const daysAgo = (Date.now() - alertDate.getTime()) / (1000 * 60 * 60 * 24);
                return daysAgo <= 7;
            }).length }));
        } catch (err) {
            console.error('Failed to fetch detection alerts:', err);
        } finally {
            setLoading(prev => ({ ...prev, detections: false }));
        }
    }, [propertyId]);

    // Fetch initial data
    const fetchData = useCallback(async () => {
        setLoading(prev => ({ ...prev, main: true }));
        setError(null);
        try {
            // Fetch from API
            const individuals = await bannedIndividualsService.getIndividuals(propertyId);
            setBannedIndividuals(individuals);

            const frStatus = await bannedIndividualsService.getFacialRecognitionStatus();
            if (frStatus) {
                setFacialRecognitionStats(frStatus);
            }

            const stats = await bannedIndividualsService.getStats(propertyId);
            if (stats) {
                setMetrics({
                    activeBans: stats.total_banned_individuals,
                    recentDetections: stats.recent_detections,
                    facialRecognitionAccuracy: frStatus?.accuracy || 0,
                    chainWideBans: 0
                });
            }

            // Fetch detection alerts
            await fetchDetectionAlerts();

            // Fetch settings
            const savedSettings = await bannedIndividualsService.getSettings(propertyId);
            if (savedSettings) {
                setSettings(prev => ({ ...prev, ...savedSettings }));
            }

            setLastSynced(new Date());
        } catch (err) {
            console.error('Failed to fetch banned individuals data:', err);
            setError('Failed to load data. Please try again.');
        } finally {
            setLoading(prev => ({ ...prev, main: false }));
        }
    }, [propertyId, fetchDetectionAlerts]);

    fetchDataRef.current = fetchData;

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Process detection alert queue
    const processAlertQueue = useCallback(async () => {
        if (isProcessingQueue.current || alertQueue.current.length === 0) return;
        
        isProcessingQueue.current = true;
        
        while (alertQueue.current.length > 0) {
            const alert = alertQueue.current.shift();
            if (!alert) break;
            
            // Skip if already processing this alert
            if (processingAlerts.current.has(alert.id)) continue;
            
            processingAlerts.current.add(alert.id);
            
            setDetectionAlerts(prev => {
                // Check for duplicates: same ID or same individual+location within 5 seconds
                const isDuplicate = prev.some(existing => {
                    if (existing.id === alert.id) return true;
                    if (existing.individualId === alert.individualId && 
                        existing.location === alert.location) {
                        const timeDiff = Math.abs(
                            new Date(existing.timestamp).getTime() - 
                            new Date(alert.timestamp).getTime()
                        );
                        if (timeDiff < 5000) return true; // Within 5 seconds
                    }
                    return false;
                });
                
                if (isDuplicate) {
                    processingAlerts.current.delete(alert.id);
                    return prev;
                }
                
                // Add new alert
                return [alert, ...prev];
            });
            
            setMetrics(prev => ({ ...prev, recentDetections: prev.recentDetections + 1 }));

            // Desktop notification for critical detections
            if (settings.facialRecognitionAlerts && alert.confidence >= settings.confidenceThreshold) {
                electronBridge.showNotification({
                    title: 'Banned Individual Detected',
                    body: `${alert.individualName} detected at ${alert.location} (${alert.confidence}% confidence)`,
                    urgency: 'critical',
                    timeoutType: 'never'
                });
            }
            
            processingAlerts.current.delete(alert.id);
        }
        
        isProcessingQueue.current = false;
    }, [settings.facialRecognitionAlerts, settings.confidenceThreshold]);

    // WebSocket integration for real-time detection alerts
    useEffect(() => {
        if (!isConnected) return;

        const unsubscribeDetection = subscribe('banned_individual_detection', (data: any) => {
            if (data && data.detection) {
                const alert: DetectionAlert = {
                    id: data.detection.detection_id || data.detection.id || `temp-${Date.now()}-${Math.random()}`,
                    individualId: data.detection.banned_id || data.detection.individual_id,
                    individualName: data.detection.individual_name || 'Unknown',
                    location: data.detection.location || 'Unknown',
                    timestamp: data.detection.timestamp || new Date().toISOString(),
                    confidence: data.detection.confidence || 0,
                    status: data.detection.status || 'ACTIVE',
                    responseTime: data.detection.response_time || 0,
                    actionTaken: data.detection.action_taken || 'Detection logged',
                    notes: data.detection.notes
                };

                // Add to queue instead of directly updating state
                alertQueue.current.push(alert);
                processAlertQueue();
            }
        });

        const unsubscribeHardware = subscribe('facial_recognition_hardware_status', (data: any) => {
            if (data && data.cameras) {
                setHardwareStatus(prev => {
                    const newCameras = data.cameras.map((cam: any) => ({
                        id: cam.id,
                        name: cam.name,
                        status: cam.status,
                        lastSeen: new Date(cam.last_seen || Date.now())
                    }));
                    
                    // Track last known good state: update when cameras are online, preserve when going offline
                    const hasOnlineCameras = newCameras.some((c: any) => c.status === 'online');
                    const prevHadOnlineCameras = prev.cameras.some((c: any) => c.status === 'online');
                    
                    let lastKnownGoodState = prev.lastKnownGoodState;
                    
                    // If cameras were online and now going offline, preserve the timestamp
                    if (prevHadOnlineCameras && !hasOnlineCameras && prev.lastKnownGoodState) {
                        // Keep existing lastKnownGoodState
                        lastKnownGoodState = prev.lastKnownGoodState;
                    } 
                    // If cameras are online now, update the timestamp
                    else if (hasOnlineCameras) {
                        lastKnownGoodState = new Date();
                    }
                    // If this is the first time we see cameras and they're online
                    else if (hasOnlineCameras && !prev.lastKnownGoodState) {
                        lastKnownGoodState = new Date();
                    }
                    
                    return {
                        cameras: newCameras,
                        lastKnownGoodState
                    };
                });
            }
        });

        return () => {
            unsubscribeDetection();
            unsubscribeHardware();
        };
    }, [isConnected, subscribe, processAlertQueue]);

    // Computed values
    const filteredIndividuals = useMemo(() => {
        return bannedIndividuals.filter(ind => {
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesQuery =
                    ind.firstName.toLowerCase().includes(query) ||
                    ind.lastName.toLowerCase().includes(query) ||
                    ind.identificationNumber.toLowerCase().includes(query) ||
                    ind.reason.toLowerCase().includes(query);
                if (!matchesQuery) return false;
            }
            if (filterStatus !== 'ALL' && ind.status !== filterStatus) return false;
            if (filterRiskLevel !== 'ALL' && ind.riskLevel !== filterRiskLevel) return false;
            if (filterBanType !== 'ALL' && ind.banType !== filterBanType) return false;
            if (filterNationality !== 'ALL' && ind.nationality !== filterNationality) return false;
            return true;
        });
    }, [bannedIndividuals, searchQuery, filterStatus, filterRiskLevel, filterBanType, filterNationality]);

    const expiringBans = useMemo(() => {
        const now = new Date();
        return bannedIndividuals.filter(ind => {
            if (!ind.banEndDate || ind.status !== 'ACTIVE') return false;
            const endDate = new Date(ind.banEndDate);
            const daysUntilExpiry = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
            return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
        });
    }, [bannedIndividuals]);

    // Handlers
    const handleCreateIndividual = useCallback(async (formData: any) => {
        const toastId = showLoading('Creating banned individual...');
        try {
            const newIndividual = await bannedIndividualsService.createIndividual({
                ...formData,
                propertyId: formData.propertyId || propertyId
            });

            if (newIndividual) {
                setBannedIndividuals(prev => [newIndividual, ...prev]);
                setMetrics(prev => ({ ...prev, activeBans: prev.activeBans + 1 }));
                
                recordAuditEntry({
                    action: 'CREATE_BANNED_INDIVIDUAL',
                    status: 'success',
                    target: `${newIndividual.firstName} ${newIndividual.lastName}`,
                    reason: `Created ban: ${newIndividual.reason}`,
                    metadata: {
                        individualId: newIndividual.id,
                        individualName: `${newIndividual.firstName} ${newIndividual.lastName}`,
                        banType: newIndividual.banType,
                        riskLevel: newIndividual.riskLevel
                    }
                });
                
                dismissLoadingAndShowSuccess(toastId, 'Banned individual created successfully');
                setShowCreateModal(false);
            } else {
                throw new Error('Failed to create individual');
            }
        } catch (error) {
            recordAuditEntry({
                action: 'CREATE_BANNED_INDIVIDUAL',
                status: 'failure',
                reason: error instanceof Error ? error.message : 'Unknown error'
            });
            dismissLoadingAndShowError(toastId, 'Failed to create banned individual');
        }
    }, [propertyId, recordAuditEntry]);

    const handleBulkImport = useCallback(async (file: File) => {
        const toastId = showLoading('Importing individuals...');
        setLoading(prev => ({ ...prev, bulkImport: true }));
        setBulkImportResults(null);
        try {
            const text = await file.text();
            const result = await bannedIndividualsService.bulkImport(text);
            
            setBulkImportResults(result);
            
            if (result.success > 0) {
                if (result.failed > 0) {
                    dismissLoadingAndShowSuccess(toastId, `Imported ${result.success} individuals, ${result.failed} failed. See details below.`);
                    // Refresh data to show newly imported individuals
                    if (fetchDataRef.current) {
                        await fetchDataRef.current();
                    }
                } else {
                    dismissLoadingAndShowSuccess(toastId, `Successfully imported ${result.success} individuals`);
                    // Refresh data and close modal on complete success
                    if (fetchDataRef.current) {
                        await fetchDataRef.current();
                    }
                    setShowBulkImportModal(false);
                }
            } else {
                dismissLoadingAndShowError(toastId, `Import failed: ${result.errors.length > 0 ? result.errors[0].error : 'All rows failed'}`);
            }
        } catch (error) {
            dismissLoadingAndShowError(toastId, error instanceof Error ? error.message : 'Failed to import file');
            setBulkImportResults({ success: 0, failed: 0, errors: [{ row: 0, error: error instanceof Error ? error.message : 'Unknown error' }] });
        } finally {
            setLoading(prev => ({ ...prev, bulkImport: false }));
        }
    }, []);

    const handleBulkExport = useCallback(() => {
        const sanitize = (val: string | undefined) => {
            if (!val) return '';
            const sanitized = val.replace(/^[+=\-@]/, "'$&");
            return `"${sanitized.replace(/"/g, '""')}"`;
        };

        const headers = ['First Name', 'Last Name', 'Nationality', 'Reason', 'Ban Type', 'Risk Level', 'Status', 'Ban Start Date', 'Ban End Date'];

        const targetData = selectedIndividuals.length > 0
            ? bannedIndividuals.filter(ind => selectedIndividuals.includes(ind.id))
            : bannedIndividuals;

        const rows = targetData.map(ind => [
            sanitize(ind.firstName),
            sanitize(ind.lastName),
            sanitize(ind.nationality),
            sanitize(ind.reason),
            sanitize(ind.banType),
            sanitize(ind.riskLevel),
            sanitize(ind.status),
            sanitize(ind.banStartDate),
            sanitize(ind.banEndDate || '')
        ].join(','));

        const csvContent = [headers.join(','), ...rows].join('\n');
        
        // Use Electron bridge for native file save if available
        if (electronBridge.getElectronStatus().isElectron) {
            electronBridge.exportToFile({
                filename: `banned-individuals-export-${new Date().toISOString().split('T')[0]}.csv`,
                data: csvContent,
                format: 'csv'
            });
        } else {
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `banned-individuals-export-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
        }
        
        showSuccess('Export started successfully');
    }, [bannedIndividuals, selectedIndividuals]);

    const handlePhotoUpload = useCallback(async (file: File, individualId: string) => {
        const toastId = showLoading('Uploading photo and training facial recognition...');
        setLoading(prev => ({ ...prev, photo: true }));
        try {
            // Validate file
            if (file.size > 10 * 1024 * 1024) {
                throw new Error('File size must be less than 10MB');
            }
            if (!file.type.startsWith('image/')) {
                throw new Error('File must be an image');
            }

            const result = await bannedIndividualsService.uploadPhoto(individualId, file);

            if (result) {
                const trainingTriggered = result.trainingTriggered || false;
                
                setBannedIndividuals(prev => prev.map(ind =>
                    ind.id === individualId ? { ...ind, photoUrl: result.photoUrl } : ind
                ));
                
                // Refresh facial recognition stats if training was triggered
                if (trainingTriggered) {
                    const frStatus = await bannedIndividualsService.getFacialRecognitionStatus();
                    if (frStatus) {
                        setFacialRecognitionStats(frStatus);
                    }
                }
                
                recordAuditEntry({
                    action: 'UPLOAD_BIOMETRIC_PHOTO',
                    status: 'success',
                    target: selectedIndividual ? `${selectedIndividual.firstName} ${selectedIndividual.lastName}` : undefined,
                    reason: trainingTriggered ? 'Photo uploaded and model training triggered' : 'Photo uploaded',
                    metadata: {
                        individualId: selectedIndividual?.id,
                        trainingTriggered
                    }
                });
                
                dismissLoadingAndShowSuccess(toastId, 'Photo uploaded and facial recognition model updated');
                setShowPhotoUploadModal(false);
            } else {
                throw new Error('Upload failed');
            }
        } catch (error) {
            recordAuditEntry({
                action: 'UPLOAD_BIOMETRIC_PHOTO',
                status: 'failure',
                target: selectedIndividual ? `${selectedIndividual.firstName} ${selectedIndividual.lastName}` : undefined,
                reason: error instanceof Error ? error.message : 'Unknown error'
            });
            dismissLoadingAndShowError(toastId, error instanceof Error ? error.message : 'Failed to upload photo');
        } finally {
            setLoading(prev => ({ ...prev, photo: false }));
        }
    }, [selectedIndividual, recordAuditEntry]);

    const handleToggleSelection = (id: string) => {
        setSelectedIndividuals(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        setSelectedIndividuals(filteredIndividuals.map(ind => ind.id));
    };

    const handleDeselectAll = () => {
        setSelectedIndividuals([]);
    };

    const handleBulkDelete = useCallback(async () => {
        if (selectedIndividuals.length === 0) {
            showError('No individuals selected');
            return;
        }
        if (window.confirm(`Are you sure you want to remove ${selectedIndividuals.length} individual(s)?`)) {
            const toastId = showLoading('Removing individuals...');
            const deletedNames = bannedIndividuals
                .filter(ind => selectedIndividuals.includes(ind.id))
                .map(ind => `${ind.firstName} ${ind.lastName}`);
            
            try {
                for (const id of selectedIndividuals) {
                    await bannedIndividualsService.deleteIndividual(id);
                }
                setBannedIndividuals(prev => prev.filter(ind => !selectedIndividuals.includes(ind.id)));
                setMetrics(prev => ({ ...prev, activeBans: Math.max(0, prev.activeBans - selectedIndividuals.length) }));
                
                recordAuditEntry({
                    action: 'BULK_DELETE',
                    status: 'success',
                    target: `${selectedIndividuals.length} individuals`,
                    reason: `Deleted: ${deletedNames.join(', ')}`,
                    metadata: {
                        count: selectedIndividuals.length,
                        individualIds: selectedIndividuals
                    }
                });
                
                setSelectedIndividuals([]);
                dismissLoadingAndShowSuccess(toastId, `${selectedIndividuals.length} individual(s) removed`);
            } catch (err) {
                recordAuditEntry({
                    action: 'BULK_DELETE',
                    status: 'failure',
                    target: `${selectedIndividuals.length} individuals`,
                    reason: err instanceof Error ? err.message : 'Unknown error'
                });
                dismissLoadingAndShowError(toastId, 'Failed to remove some individuals');
            }
        }
    }, [selectedIndividuals, bannedIndividuals, recordAuditEntry]);

    const handleMarkFalsePositive = useCallback(async (alertId: string, notes?: string) => {
        const toastId = showLoading('Marking as false positive...');
        try {
            const success = await bannedIndividualsService.markDetectionAsFalsePositive(alertId, notes);
            if (success) {
                setDetectionAlerts(prev => prev.map(alert =>
                    alert.id === alertId ? { ...alert, status: 'FALSE_POSITIVE' as const } : alert
                ));
                dismissLoadingAndShowSuccess(toastId, 'Alert marked as false positive');
            } else {
                throw new Error('Failed to update alert');
            }
        } catch (error) {
            dismissLoadingAndShowError(toastId, 'Failed to mark as false positive');
        }
    }, []);

    const handleViewFootage = useCallback(async (alertId: string) => {
        const toastId = showLoading('Loading video footage...');
        try {
            const videoUrl = await bannedIndividualsService.getDetectionFootage(alertId);
            if (videoUrl) {
                setSelectedVideoUrl(videoUrl);
                setShowVideoFootageModal(true);
                dismissLoadingAndShowSuccess(toastId, 'Video footage loaded');
            } else {
                throw new Error('Video footage not available');
            }
        } catch (error) {
            dismissLoadingAndShowError(toastId, 'Failed to load video footage');
        }
    }, []);

    const handleSaveSettings = useCallback(async () => {
        const toastId = showLoading('Saving settings...');
        setLoading(prev => ({ ...prev, settings: true }));
        try {
            const success = await bannedIndividualsService.updateSettings(settings, propertyId);
            if (success) {
                // Also update facial recognition config if changed
                await bannedIndividualsService.updateFacialRecognitionConfig({
                    confidenceThreshold: settings.confidenceThreshold,
                    retentionDays: settings.retentionDays
                });
                
                recordAuditEntry({
                    action: 'UPDATE_SETTINGS',
                    status: 'success',
                    reason: 'Module settings updated',
                    metadata: {
                        confidenceThreshold: settings.confidenceThreshold,
                        retentionDays: settings.retentionDays,
                        facialRecognitionAlerts: settings.facialRecognitionAlerts,
                        autoSharePermanentBans: settings.autoSharePermanentBans
                    }
                });
                
                dismissLoadingAndShowSuccess(toastId, 'Settings saved successfully');
            } else {
                throw new Error('Failed to save settings');
            }
        } catch (error) {
            recordAuditEntry({
                action: 'UPDATE_SETTINGS',
                status: 'failure',
                reason: error instanceof Error ? error.message : 'Unknown error'
            });
            dismissLoadingAndShowError(toastId, 'Failed to save settings');
        } finally {
            setLoading(prev => ({ ...prev, settings: false }));
        }
    }, [settings, propertyId, recordAuditEntry]);

    const handleTriggerTraining = useCallback(async () => {
        const toastId = showLoading('Triggering facial recognition training...');
        try {
            const result = await bannedIndividualsService.triggerFacialRecognitionTraining();
            if (result) {
                setFacialRecognitionStats(prev => ({ ...prev, trainingStatus: 'TRAINING' }));
                dismissLoadingAndShowSuccess(toastId, 'Training started. Status will update when complete.');
            } else {
                throw new Error('Failed to trigger training');
            }
        } catch (error) {
            dismissLoadingAndShowError(toastId, 'Failed to trigger training');
        }
    }, []);

    // Keyboard navigation
    useKeyboardNavigation([
        {
            key: 'n',
            ctrlKey: true,
            description: 'Create new banned individual',
            handler: () => setShowCreateModal(true)
        },
        {
            key: 'f',
            ctrlKey: true,
            description: 'Focus search',
            handler: () => {
                const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
                searchInput?.focus();
            }
        },
        {
            key: 'Escape',
            description: 'Close modals',
            handler: () => {
                setShowCreateModal(false);
                setShowDetailsModal(false);
                setShowBulkImportModal(false);
                setShowAdvancedFiltersModal(false);
                setShowPhotoUploadModal(false);
                setShowVideoFootageModal(false);
            }
        },
        {
            key: 'a',
            ctrlKey: true,
            description: 'Select all',
            handler: () => handleSelectAll(),
            context: 'management'
        },
        {
            key: 'd',
            ctrlKey: true,
            description: 'Deselect all',
            handler: () => handleDeselectAll(),
            context: 'management'
        }
    ], { context: activeTab === 'management' ? 'management' : undefined });

    return {
        activeTab, setActiveTab,
        loading, error, lastSynced,
        showCreateModal, setShowCreateModal,
        showDetailsModal, setShowDetailsModal,
        showBulkImportModal, setShowBulkImportModal,
        bulkImportResults, setBulkImportResults,
        showAdvancedFiltersModal, setShowAdvancedFiltersModal,
        showPhotoUploadModal, setShowPhotoUploadModal,
        showVideoFootageModal, setShowVideoFootageModal,
        selectedVideoUrl,
        selectedIndividual, setSelectedIndividual,
        searchQuery, setSearchQuery,
        filterStatus, setFilterStatus,
        filterRiskLevel, setFilterRiskLevel,
        filterBanType, setFilterBanType,
        filterNationality, setFilterNationality,
        selectedIndividuals, setSelectedIndividuals,
        bannedIndividuals,
        detectionAlerts,
        facialRecognitionStats,
        metrics,
        settings, setSettings,
        hardwareStatus,
        filteredIndividuals,
        expiringBans,
        connectivity,
        handleCreateIndividual,
        handleBulkImport,
        handleBulkExport,
        handlePhotoUpload,
        handleToggleSelection,
        handleSelectAll,
        handleDeselectAll,
        handleBulkDelete,
        handleMarkFalsePositive,
        handleViewFootage,
        handleSaveSettings,
        handleTriggerTraining,
        auditLog,
        recordAuditEntry,
        fetchData,
        fetchDetectionAlerts
    };
};
