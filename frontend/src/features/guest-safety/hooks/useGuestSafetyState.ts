/**
 * Guest Safety State Hook
 * Centralized state management for Guest Safety feature
 * Contains ALL business logic with RBAC integration
 * 
 * Following Gold Standard: Zero business logic in components, 100% in hooks
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useWebSocket } from '../../../components/UI/WebSocketProvider';
import { logger } from '../../../services/logger';
import { showLoading, dismissLoadingAndShowSuccess, dismissLoadingAndShowError, showError } from '../../../utils/toast';
import * as guestSafetyService from '../services/guestSafetyService';
import type {
  GuestIncident,
  ResponseTeam,
  SafetyMetrics,
  GuestSafetySettings,
  MassNotificationData,
  GuestSafetyFilters,
  GuestMessage,
  GuestMessageFilters,
  EvacuationHeadcount,
  EvacuationCheckIn,
} from '../types/guest-safety.types';
import type { GuestSafetyIncident } from '../../../services/ApiService';
import { DEFAULT_SETTINGS } from '../utils/constants';

/**
 * Default metrics (fallback)
 */

const defaultMetrics: SafetyMetrics = {
  critical: 1,
  high: 1,
  medium: 1,
  low: 1,
  resolvedToday: 12,
  avgResponseTime: '4.2 min',
  categories: {
    medical: 1,
    security: 1,
    maintenance: 1,
    service: 1,
  },
  responseMetrics: {
    avgResponseTime: '4.2 min',
    resolutionRate: '94.2%',
    guestSatisfaction: '4.8/5',
  },
};

const formatRelativeTime = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
};

const inferIncidentType = (text: string): GuestIncident['type'] => {
  const value = text.toLowerCase();
  if (value.includes('medical')) return 'medical';
  if (value.includes('security') || value.includes('suspicious')) return 'security';
  if (value.includes('maintenance') || value.includes('repair')) return 'maintenance';
  if (value.includes('service') || value.includes('towel')) return 'service';
  if (value.includes('noise')) return 'noise';
  return 'other';
};

const mapIncident = (incident: GuestSafetyIncident): GuestIncident => {
  const guestName = incident.guest_involved || 'Guest';
  const room = incident.room_number || incident.location || 'Unknown';
  const description = incident.description || 'No description provided';
  const type = inferIncidentType(`${incident.title} ${incident.description || ''}`);
  const priority = incident.severity;
  const status = incident.status === 'investigating' ? 'responding' : incident.status;
  return {
    ...incident,
    status,
    priority,
    type,
    guestName,
    guestRoom: room,
    guestType: 'Regular',
    reportedTime: formatRelativeTime(incident.reported_at),
    guestAvatar: guestName.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase(),
    icon: type === 'medical' ? 'fas fa-heartbeat' : type === 'security' ? 'fas fa-shield-alt' : type === 'maintenance' ? 'fas fa-tools' : type === 'service' ? 'fas fa-concierge-bell' : 'fas fa-exclamation-triangle',
    iconColor: priority === 'critical' ? '#ef4444' : priority === 'high' ? '#f59e0b' : priority === 'medium' ? '#10b981' : '#6b7280',
    assignedTeam: incident.assigned_team,
    source: (incident as any).source || 'MANAGER',
    sourceMetadata: (incident as any).sourceMetadata || {},
  };
};

export interface UseGuestSafetyStateReturn {
  // Data
  incidents: GuestIncident[];
  teams: ResponseTeam[];
  metrics: SafetyMetrics;
  settings: GuestSafetySettings;
  
  // Loading states
  loading: {
    incidents: boolean;
    teams: boolean;
    metrics: boolean;
    settings: boolean;
    actions: boolean;
    messages: boolean;
  };
  
  // RBAC flags (exposed for UI conditional rendering)
  canAssignTeam: boolean;
  canResolveIncident: boolean;
  canSendNotification: boolean;
  canManageSettings: boolean;
  
  // Modal states (Modal State Convergence)
  selectedIncident: GuestIncident | null;
  setSelectedIncident: (incident: GuestIncident | null) => void;
  showAssignTeamModal: boolean;
  setShowAssignTeamModal: (show: boolean) => void;
  showSendMessageModal: boolean;
  setShowSendMessageModal: (show: boolean) => void;
  showCreateIncidentModal: boolean;
  setShowCreateIncidentModal: (show: boolean) => void;
  
  // Hardware & Mobile Agent Integration
  hardwareDevices: any[];
  hardwareStatus: any;
  agentMetrics: any;
  
  // Guest Messages
  messages: GuestMessage[];
  unreadMessageCount: number;
  
  // Actions - Incidents
  refreshIncidents: (filters?: GuestSafetyFilters) => Promise<void>;
  createIncident: (data: import('../types/guest-safety.types').CreateIncidentRequest) => Promise<void>;
  assignTeam: (incidentId: string, teamId: string) => Promise<void>;
  resolveIncident: (incidentId: string) => Promise<void>;
  sendMessage: (incidentId: string, message: string) => Promise<void>;
  
  // Actions - Mass Notification
  sendMassNotification: (data: MassNotificationData) => Promise<void>;
  
  // Actions - Settings
  refreshSettings: () => Promise<void>;
  updateSettings: (settings: Partial<GuestSafetySettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  
  // Actions - Teams
  refreshTeams: () => Promise<void>;
  
  // Actions - Hardware & Mobile Agent
  refreshHardwareDevices: () => Promise<void>;
  refreshAgentMetrics: () => Promise<void>;
  
  // Actions - Guest Messages
  refreshMessages: (filters?: GuestMessageFilters) => Promise<void>;
  markMessageRead: (messageId: string) => Promise<void>;
  
  // Actions - Evacuation
  refreshEvacuationHeadcount: () => Promise<void>;
  refreshEvacuationCheckIns: () => Promise<void>;
  evacuationHeadcount: EvacuationHeadcount | null;
  evacuationCheckIns: EvacuationCheckIn[];
}

export function useGuestSafetyState(): UseGuestSafetyStateReturn {
  const { user } = useAuth();
  const { isConnected, subscribe } = useWebSocket();
  
  // ============================================
  // RBAC HELPER FUNCTIONS
  // ============================================
  
  /**
   * Check if user has management access (ADMIN or SECURITY_OFFICER)
   */
  const hasManagementAccess = useMemo(() => {
    if (!user) return false;
    return user.roles.some(role => 
      ['ADMIN', 'SECURITY_OFFICER'].includes(role.toUpperCase())
    );
  }, [user]);
  
  /**
   * Check if user has admin access
   */
  const isAdmin = useMemo(() => {
    if (!user) return false;
    return user.roles.some(role => role.toUpperCase() === 'ADMIN');
  }, [user]);
  
  // ============================================
  // RBAC FLAGS (for UI conditional rendering)
  // ============================================
  
  const canAssignTeam = hasManagementAccess;
  const canResolveIncident = hasManagementAccess;
  const canSendNotification = isAdmin; // Only admins can send mass notifications
  const canManageSettings = isAdmin; // Only admins can manage settings
  
  // ============================================
  // STATE DECLARATIONS
  // ============================================
  
  const [incidents, setIncidents] = useState<GuestIncident[]>([]);
  const [teams, setTeams] = useState<ResponseTeam[]>([]);
  const [hardwareDevices, setHardwareDevices] = useState<any[]>([]);
  const [hardwareStatus, setHardwareStatus] = useState<{ devices: any[]; lastKnownGoodState: Date | null }>({
    devices: [],
    lastKnownGoodState: null
  });
  const [agentMetrics, setAgentMetrics] = useState<any[]>([]);
  const [messages, setMessages] = useState<GuestMessage[]>([]);
  const [evacuationHeadcount, setEvacuationHeadcount] = useState<EvacuationHeadcount | null>(null);
  const [evacuationCheckIns, setEvacuationCheckIns] = useState<EvacuationCheckIn[]>([]);
  const initialLoadRef = useRef(false);
  const metrics = useMemo<SafetyMetrics>(() => ({
    ...defaultMetrics,
    critical: incidents.filter(i => i.priority === 'critical').length,
    high: incidents.filter(i => i.priority === 'high').length,
    medium: incidents.filter(i => i.priority === 'medium').length,
    low: incidents.filter(i => i.priority === 'low').length,
    resolvedToday: incidents.filter(i => i.status === 'resolved').length,
  }), [incidents]);
  const [settings, setSettings] = useState<GuestSafetySettings>(DEFAULT_SETTINGS);
  
  const [loading, setLoading] = useState({
    incidents: false,
    teams: false,
    metrics: false,
    settings: false,
    actions: false,
    messages: false,
  });
  
  // Modal states (Modal State Convergence)
  const [selectedIncident, setSelectedIncident] = useState<GuestIncident | null>(null);
  const [showAssignTeamModal, setShowAssignTeamModal] = useState(false);
  const [showSendMessageModal, setShowSendMessageModal] = useState(false);
  const [showCreateIncidentModal, setShowCreateIncidentModal] = useState(false);
  
  // ============================================
  // REFRESH ACTIONS
  // ============================================
  
  /**
   * Refresh incidents list
   */
  const refreshIncidents = useCallback(async (filters?: GuestSafetyFilters) => {
    setLoading(prev => ({ ...prev, incidents: true }));
    try {
      const data = await guestSafetyService.getIncidents(filters);
      const mapped = data.map(mapIncident);
      setIncidents(mapped);
      logger.info('Incidents refreshed', { module: 'GuestSafety', count: mapped.length });
    } catch (error) {
      logger.error('Failed to refresh incidents', error instanceof Error ? error : new Error(String(error)), {
        module: 'GuestSafety',
        action: 'refreshIncidents'
      });
      showError('Failed to load incidents. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, incidents: false }));
    }
  }, []);
  
  /**
   * Refresh teams list
   */
  const refreshTeams = useCallback(async () => {
    setLoading(prev => ({ ...prev, teams: true }));
    try {
      const data = await guestSafetyService.getResponseTeams();
      setTeams(data);
      logger.info('Teams refreshed', { module: 'GuestSafety', count: data.length });
    } catch (error) {
      logger.error('Failed to refresh teams', error instanceof Error ? error : new Error(String(error)), {
        module: 'GuestSafety',
        action: 'refreshTeams'
      });
    } finally {
      setLoading(prev => ({ ...prev, teams: false }));
    }
  }, []);
  
  
  /**
   * Refresh settings
   */
  const refreshSettings = useCallback(async () => {
    setLoading(prev => ({ ...prev, settings: true }));
    try {
      const data = await guestSafetyService.getSettings();
      setSettings(data);
      logger.info('Settings refreshed', { module: 'GuestSafety' });
    } catch (error) {
      logger.error('Failed to refresh settings', error instanceof Error ? error : new Error(String(error)), {
        module: 'GuestSafety',
        action: 'refreshSettings'
      });
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setLoading(prev => ({ ...prev, settings: false }));
    }
  }, []);
  
  /**
   * Refresh hardware devices
   */
  const refreshHardwareDevices = useCallback(async () => {
    try {
      const devices = await guestSafetyService.getHardwareDevices();
      setHardwareDevices(devices);
      
      // Update hardware status using functional update to avoid dependency
      const onlineDevices = devices.filter((d: any) => d.status === 'online');
      setHardwareStatus(prev => ({
        devices: devices,
        lastKnownGoodState: onlineDevices.length > 0 ? new Date() : prev.lastKnownGoodState
      }));
      
      logger.info('Hardware devices refreshed', { module: 'GuestSafety', count: devices.length });
    } catch (error) {
      logger.error('Failed to refresh hardware devices', error instanceof Error ? error : new Error(String(error)), {
        module: 'GuestSafety',
        action: 'refreshHardwareDevices'
      });
    }
  }, []); // Remove dependency to prevent infinite loop
  
  /**
   * Refresh mobile agent metrics
   */
  const refreshAgentMetrics = useCallback(async () => {
    try {
      const metrics = await guestSafetyService.getMobileAgentMetrics();
      setAgentMetrics([metrics]); // Store as array for consistency
      logger.info('Mobile agent metrics refreshed', { module: 'GuestSafety' });
    } catch (error) {
      logger.error('Failed to refresh agent metrics', error instanceof Error ? error : new Error(String(error)), {
        module: 'GuestSafety',
        action: 'refreshAgentMetrics'
      });
    }
  }, []);
  
  /**
   * Refresh guest messages
   */
  const refreshMessages = useCallback(async (filters?: GuestMessageFilters) => {
    setLoading(prev => ({ ...prev, messages: true }));
    try {
      const data = await guestSafetyService.getGuestMessages(filters);
      setMessages(data);
      logger.info('Guest messages refreshed', { module: 'GuestSafety', count: data.length });
    } catch (error) {
      logger.error('Failed to refresh messages', error instanceof Error ? error : new Error(String(error)), {
        module: 'GuestSafety',
        action: 'refreshMessages'
      });
      showError('Failed to load messages. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, messages: false }));
    }
  }, []);
  
  /**
   * Mark message as read
   */
  const markMessageReadAction = useCallback(async (messageId: string) => {
    try {
      const updated = await guestSafetyService.markMessageRead(messageId);
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? updated : msg
      ));
      logger.info('Message marked as read', { module: 'GuestSafety', messageId });
    } catch (error) {
      logger.error('Failed to mark message as read', error instanceof Error ? error : new Error(String(error)), {
        module: 'GuestSafety',
        action: 'markMessageRead',
        messageId
      });
      throw error;
    }
  }, []);
  
  /**
   * Calculate unread message count
   */
  const unreadMessageCount = useMemo(() => {
    return messages.filter(msg => !msg.is_read).length;
  }, [messages]);

  /**
   * Refresh evacuation headcount
   */
  const refreshEvacuationHeadcount = useCallback(async () => {
    try {
      const data = await guestSafetyService.getEvacuationHeadcount();
      setEvacuationHeadcount(data);
      logger.info('Evacuation headcount refreshed', { module: 'GuestSafety' });
    } catch (error) {
      logger.error('Failed to refresh evacuation headcount', error instanceof Error ? error : new Error(String(error)), {
        module: 'GuestSafety',
        action: 'refreshEvacuationHeadcount'
      });
    }
  }, []);

  /**
   * Refresh evacuation check-ins
   */
  const refreshEvacuationCheckIns = useCallback(async () => {
    try {
      const data = await guestSafetyService.getEvacuationCheckIns();
      setEvacuationCheckIns(data);
      logger.info('Evacuation check-ins refreshed', { module: 'GuestSafety', count: data.length });
    } catch (error) {
      logger.error('Failed to refresh evacuation check-ins', error instanceof Error ? error : new Error(String(error)), {
        module: 'GuestSafety',
        action: 'refreshEvacuationCheckIns'
      });
    }
  }, []);
  
  // ============================================
  // INCIDENT ACTIONS
  // ============================================
  
  /**
   * Check for duplicate incidents (same location, similar time, similar description)
   */
  const checkForDuplicates = useCallback((newIncident: GuestIncident): GuestIncident | null => {
    const timeWindow = 5 * 60 * 1000; // 5 minutes
    const now = Date.now();
    const newTime = new Date(newIncident.reported_at).getTime();
    
    return incidents.find(incident => {
      // Check if within time window
      const incidentTime = new Date(incident.reported_at).getTime();
      const timeDiff = Math.abs(newTime - incidentTime);
      if (timeDiff > timeWindow) return false;
      
      // Check if same location
      const sameLocation = incident.location?.toLowerCase() === newIncident.location?.toLowerCase() ||
                          incident.guestRoom === newIncident.guestRoom;
      if (!sameLocation) return false;
      
      // Check if similar description (basic similarity check)
      const desc1 = (incident.description || '').toLowerCase();
      const desc2 = (newIncident.description || '').toLowerCase();
      const similarity = desc1.length > 0 && desc2.length > 0 && 
                        (desc1.includes(desc2.substring(0, 20)) || desc2.includes(desc1.substring(0, 20)));
      
      return similarity;
    }) || null;
  }, [incidents]);
  
  /**
   * Create new incident (with RBAC check and duplicate detection)
   */
  const createIncident = useCallback(async (data: import('../types/guest-safety.types').CreateIncidentRequest) => {
    // RBAC CHECK (all authenticated users can create incidents)
    if (!user) {
      showError('You must be authenticated to create incidents');
      throw new Error('Unauthorized');
    }
    
    const toastId = showLoading('Creating incident...');
    setLoading(prev => ({ ...prev, actions: true }));
    try {
      const newIncident = await guestSafetyService.createIncident(data);
      const mapped = mapIncident(newIncident);
      
      // Check for duplicates
      const duplicate = checkForDuplicates(mapped);
      if (duplicate) {
        logger.warn('Potential duplicate incident detected', {
          module: 'GuestSafety',
          newIncidentId: mapped.id,
          duplicateId: duplicate.id
        });
        // Still add the incident but log the warning
        // In production, you might want to show a confirmation dialog
      }
      
      // Add to state optimistically
      setIncidents(prev => [mapped, ...prev]);
      
      dismissLoadingAndShowSuccess(toastId, 'Incident created successfully');
      setShowCreateIncidentModal(false);
      logger.info('Incident created', { module: 'GuestSafety', incidentId: newIncident.id });
    } catch (error) {
      dismissLoadingAndShowError(toastId, 'Failed to create incident. Please check your connection and try again.');
      logger.error('Failed to create incident', error instanceof Error ? error : new Error(String(error)), {
        module: 'GuestSafety',
        action: 'createIncident'
      });
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, actions: false }));
    }
  }, [user, checkForDuplicates]);
  
  /**
   * Assign team to incident (with RBAC check and conflict resolution)
   */
  const assignTeam = useCallback(async (incidentId: string, teamId: string) => {
    // RBAC CHECK
    if (!canAssignTeam) {
      showError('You do not have permission to assign teams');
      throw new Error('Unauthorized');
    }
    
    // Check current state to prevent conflicts
    const currentIncident = incidents.find(i => i.id === incidentId);
    if (!currentIncident) {
      showError('Incident not found');
      throw new Error('Incident not found');
    }
    
    if (currentIncident.status !== 'reported') {
      showError('This incident has already been assigned or resolved');
      throw new Error('Invalid state');
    }
    
    const toastId = showLoading('Assigning team...');
    setLoading(prev => ({ ...prev, actions: true }));
    try {
      // Optimistic update
      const team = teams.find(t => t.id === teamId);
      setIncidents(prev => prev.map(incident => 
        incident.id === incidentId 
          ? { ...incident, status: 'responding' as const, assignedTeam: team?.name }
          : incident
      ));
      
      await guestSafetyService.updateIncident(incidentId, { assignedTeam: teamId, status: 'responding' });
      
      dismissLoadingAndShowSuccess(toastId, 'Team assigned successfully');
      setShowAssignTeamModal(false);
      logger.info('Team assigned to incident', { module: 'GuestSafety', incidentId, teamId });
    } catch (error) {
      // Revert optimistic update on error
      setIncidents(prev => prev.map(incident => 
        incident.id === incidentId 
          ? { ...incident, status: 'reported' as const, assignedTeam: undefined }
          : incident
      ));
      
      dismissLoadingAndShowError(toastId, 'Failed to assign team. The incident may have been updated by another user.');
      logger.error('Failed to assign team', error instanceof Error ? error : new Error(String(error)), {
        module: 'GuestSafety',
        action: 'assignTeam',
        incidentId,
        teamId
      });
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, actions: false }));
    }
  }, [canAssignTeam, teams, incidents]);
  
  /**
   * Resolve incident (with RBAC check)
   */
  const resolveIncident = useCallback(async (incidentId: string) => {
    // RBAC CHECK
    if (!canResolveIncident) {
      showError('You do not have permission to resolve incidents');
      throw new Error('Unauthorized');
    }
    
    const toastId = showLoading('Resolving incident...');
    setLoading(prev => ({ ...prev, actions: true }));
    try {
      await guestSafetyService.resolveIncident(incidentId);
      
      // Update state optimistically
      setIncidents(prev => prev.map(incident => 
        incident.id === incidentId 
          ? { ...incident, status: 'resolved' as const }
          : incident
      ));
      
      dismissLoadingAndShowSuccess(toastId, 'Incident resolved successfully');
      logger.info('Incident resolved', { module: 'GuestSafety', incidentId });
    } catch (error) {
      dismissLoadingAndShowError(toastId, 'Failed to resolve incident');
      logger.error('Failed to resolve incident', error instanceof Error ? error : new Error(String(error)), {
        module: 'GuestSafety',
        action: 'resolveIncident',
        incidentId
      });
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, actions: false }));
    }
  }, [canResolveIncident]);
  
  /**
   * Send message to guest (with RBAC check)
   */
  const sendMessage = useCallback(async (incidentId: string, message: string) => {
    // RBAC CHECK (all authenticated users can send messages)
    if (!user) {
      showError('You must be authenticated to send messages');
      throw new Error('Unauthorized');
    }
    
    const toastId = showLoading('Sending message...');
    setLoading(prev => ({ ...prev, actions: true }));
    try {
      await guestSafetyService.sendMessage(incidentId, message);
      
      dismissLoadingAndShowSuccess(toastId, 'Message sent successfully');
      setShowSendMessageModal(false);
      logger.info('Message sent to guest', { module: 'GuestSafety', incidentId });
    } catch (error) {
      dismissLoadingAndShowError(toastId, 'Failed to send message');
      logger.error('Failed to send message', error instanceof Error ? error : new Error(String(error)), {
        module: 'GuestSafety',
        action: 'sendMessage',
        incidentId
      });
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, actions: false }));
    }
  }, [user]);
  
  // ============================================
  // MASS NOTIFICATION ACTIONS
  // ============================================
  
  /**
   * Send mass notification (with RBAC check)
   */
  const sendMassNotification = useCallback(async (data: MassNotificationData) => {
    // RBAC CHECK
    if (!canSendNotification) {
      showError('You do not have permission to send mass notifications');
      throw new Error('Unauthorized');
    }
    
    const toastId = showLoading('Sending mass notification...');
    setLoading(prev => ({ ...prev, actions: true }));
    try {
      await guestSafetyService.sendMassNotification(data);
      
      dismissLoadingAndShowSuccess(toastId, 'Mass notification sent successfully');
      logger.info('Mass notification sent', { module: 'GuestSafety' });
    } catch (error) {
      dismissLoadingAndShowError(toastId, 'Failed to send mass notification');
      logger.error('Failed to send mass notification', error instanceof Error ? error : new Error(String(error)), {
        module: 'GuestSafety',
        action: 'sendMassNotification'
      });
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, actions: false }));
    }
  }, [canSendNotification]);
  
  // ============================================
  // SETTINGS ACTIONS
  // ============================================
  
  /**
   * Update settings (with RBAC check)
   */
  const updateSettings = useCallback(async (newSettings: Partial<GuestSafetySettings>) => {
    // RBAC CHECK
    if (!canManageSettings) {
      showError('You do not have permission to update settings');
      throw new Error('Unauthorized');
    }
    
    const toastId = showLoading('Updating settings...');
    setLoading(prev => ({ ...prev, settings: true }));
    try {
      const updated = await guestSafetyService.updateSettings(newSettings);
      setSettings(updated);
      dismissLoadingAndShowSuccess(toastId, 'Settings updated successfully');
      logger.info('Settings updated', { module: 'GuestSafety' });
    } catch (error) {
      dismissLoadingAndShowError(toastId, 'Failed to update settings');
      logger.error('Failed to update settings', error instanceof Error ? error : new Error(String(error)), {
        module: 'GuestSafety',
        action: 'updateSettings'
      });
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, settings: false }));
    }
  }, [canManageSettings]);
  
  /**
   * Reset settings to defaults
   */
  const resetSettings = useCallback(async () => {
    // RBAC CHECK
    if (!canManageSettings) {
      showError('You do not have permission to reset settings');
      throw new Error('Unauthorized');
    }
    
    const toastId = showLoading('Resetting settings...');
    setLoading(prev => ({ ...prev, settings: true }));
    try {
      const updated = await guestSafetyService.updateSettings(DEFAULT_SETTINGS);
      setSettings(updated);
      dismissLoadingAndShowSuccess(toastId, 'Settings reset to defaults');
      logger.info('Settings reset', { module: 'GuestSafety' });
    } catch (error) {
      dismissLoadingAndShowError(toastId, 'Failed to reset settings');
      logger.error('Failed to reset settings', error instanceof Error ? error : new Error(String(error)), {
        module: 'GuestSafety',
        action: 'resetSettings'
      });
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, settings: false }));
    }
  }, [canManageSettings]);
  
  // ============================================
  // AUTO-ESCALATION LOGIC
  // ============================================
  
  /**
   * Check and escalate incidents that exceed threshold
   */
  const checkAutoEscalation = useCallback(() => {
    if (!settings.autoEscalation) return;
    
    const thresholdMinutes = settings.alertThreshold;
    const now = Date.now();
    
    incidents.forEach(incident => {
      if (incident.status !== 'reported') return; // Only escalate reported incidents
      
      const reportedTime = new Date(incident.reported_at || incident.reportedTime).getTime();
      const ageMinutes = (now - reportedTime) / 60000;
      
      if (ageMinutes >= thresholdMinutes) {
        // Check if already escalated
        const isEscalated = incident.priority === 'critical' && 
          (incident as any).escalated === true;
        
        if (!isEscalated) {
          logger.warn('Incident exceeds escalation threshold', {
            module: 'GuestSafety',
            incidentId: incident.id,
            ageMinutes,
            thresholdMinutes
          });
          
          // Update incident priority to critical
          guestSafetyService.updateIncident(incident.id, {
            severity: 'critical',
            status: 'reported', // Keep as reported but escalate
          }).then(updated => {
            const mapped = mapIncident(updated);
            setIncidents(prev => prev.map(i => 
              i.id === mapped.id ? { ...mapped, escalated: true } : i
            ));
            logger.info('Incident auto-escalated', { module: 'GuestSafety', incidentId: incident.id });
          }).catch(err => {
            logger.error('Failed to escalate incident', err);
          });
        }
      }
    });
  }, [incidents, settings.autoEscalation, settings.alertThreshold]);
  
  // Run escalation check every minute
  useEffect(() => {
    if (!settings.autoEscalation) return;
    
    const interval = setInterval(() => {
      checkAutoEscalation();
    }, 60000); // Check every minute
    
    // Run immediately on mount/update
    checkAutoEscalation();
    
    return () => clearInterval(interval);
  }, [checkAutoEscalation, settings.autoEscalation]);
  
  // ============================================
  // INITIAL DATA LOAD
  // ============================================
  
  // Initial data load - only run once on mount
  useEffect(() => {
    if (initialLoadRef.current) return;
    initialLoadRef.current = true;
    
    refreshIncidents();
    refreshTeams();
    refreshSettings();
    refreshHardwareDevices();
    refreshAgentMetrics();
    refreshMessages();
  }, [refreshIncidents, refreshTeams, refreshSettings, refreshHardwareDevices, refreshAgentMetrics, refreshMessages]);
  
  // ============================================
  // WEBSOCKET INTEGRATION FOR REAL-TIME UPDATES
  // ============================================
  
  useEffect(() => {
    if (!isConnected) return;
    
    // Subscribe to new incident events
    const unsubscribeIncident = subscribe('guest_safety_incident', (data: any) => {
      if (data && data.incident) {
        const newIncident = mapIncident(data.incident);
        setIncidents(prev => {
          // Avoid duplicates
          if (prev.find(i => i.id === newIncident.id)) {
            return prev;
          }
          return [newIncident, ...prev];
        });
        logger.info('New incident received via WebSocket', { module: 'GuestSafety', incidentId: newIncident.id });
      }
    });
    
    // Subscribe to incident updates (with conflict resolution)
    const unsubscribeUpdate = subscribe('guest_safety_incident_update', (data: any) => {
      if (data && data.incident) {
        const updatedIncident = mapIncident(data.incident);
        setIncidents(prev => {
          const existing = prev.find(i => i.id === updatedIncident.id);
          // Only update if the server version is newer or if we don't have local changes
          if (existing) {
            const serverTime = new Date(updatedIncident.reported_at).getTime();
            const localTime = new Date(existing.reported_at).getTime();
            // Accept server update if it's newer (within reason - 1 second buffer for clock skew)
            if (serverTime >= localTime - 1000) {
              return prev.map(i => 
                i.id === updatedIncident.id ? updatedIncident : i
              );
            } else {
              logger.warn('Ignoring stale server update', {
                module: 'GuestSafety',
                incidentId: updatedIncident.id,
                serverTime,
                localTime
              });
              return prev;
            }
          }
          return prev.map(i => 
            i.id === updatedIncident.id ? updatedIncident : i
          );
        });
        logger.info('Incident updated via WebSocket', { module: 'GuestSafety', incidentId: updatedIncident.id });
      }
    });
    
    // Subscribe to hardware device status updates
    const unsubscribeHardware = subscribe('hardware_device_status', (data: any) => {
      if (data && data.devices) {
        // Use the refresh function directly without dependency
        guestSafetyService.getHardwareDevices().then(devices => {
          setHardwareDevices(devices);
          const onlineDevices = devices.filter((d: any) => d.status === 'online');
          setHardwareStatus(prev => ({
            devices: devices,
            lastKnownGoodState: onlineDevices.length > 0 ? new Date() : prev.lastKnownGoodState
          }));
        }).catch(err => {
          logger.error('Failed to refresh hardware devices via WebSocket', err);
        });
      }
    });
    
    // Subscribe to mobile agent updates
    const unsubscribeAgent = subscribe('mobile_agent_update', (data: any) => {
      if (data && data.metrics) {
        // Use the service directly without dependency
        guestSafetyService.getMobileAgentMetrics().then(metrics => {
          setAgentMetrics([metrics]);
        }).catch(err => {
          logger.error('Failed to refresh agent metrics via WebSocket', err);
        });
      }
    });
    
    // Subscribe to guest message updates
    const unsubscribeMessages = subscribe('guest_message', (data: any) => {
      if (data && data.message) {
        setMessages(prev => {
          // Avoid duplicates
          if (prev.find(m => m.id === data.message.id)) {
            return prev.map(m => m.id === data.message.id ? data.message : m);
          }
          return [data.message, ...prev];
        });
        logger.info('New guest message received via WebSocket', { module: 'GuestSafety', messageId: data.message.id });
      }
    });
    
    return () => {
      unsubscribeIncident();
      unsubscribeUpdate();
      unsubscribeHardware();
      unsubscribeAgent();
      unsubscribeMessages();
    };
  }, [isConnected, subscribe]); // Only depend on connection state and subscribe function
  
  // ============================================
  // RETURN
  // ============================================
  
  return {
    // Data
    incidents,
    teams,
    metrics,
    settings,
    hardwareDevices,
    hardwareStatus,
    agentMetrics,
    
    // Guest Messages
    messages,
    unreadMessageCount,
    
    // Loading states
    loading,
    
    // RBAC flags
    canAssignTeam,
    canResolveIncident,
    canSendNotification,
    canManageSettings,
    
    // Modal states (Modal State Convergence)
    selectedIncident,
    setSelectedIncident,
    showAssignTeamModal,
    setShowAssignTeamModal,
    showSendMessageModal,
    setShowSendMessageModal,
    showCreateIncidentModal,
    setShowCreateIncidentModal,
    
    // Actions
    refreshIncidents,
    createIncident,
    assignTeam,
    resolveIncident,
    sendMessage,
    sendMassNotification,
    refreshSettings,
    updateSettings,
    resetSettings,
    refreshTeams,
    refreshHardwareDevices,
    refreshAgentMetrics,
    refreshMessages,
    markMessageRead: markMessageReadAction,
    refreshEvacuationHeadcount,
    refreshEvacuationCheckIns,
    evacuationHeadcount,
    evacuationCheckIns,
  };
}
