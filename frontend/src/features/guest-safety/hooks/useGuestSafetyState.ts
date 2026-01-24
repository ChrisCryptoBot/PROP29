/**
 * Guest Safety State Hook
 * Centralized state management for Guest Safety feature
 * Contains ALL business logic with RBAC integration
 * 
 * Following Gold Standard: Zero business logic in components, 100% in hooks
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../../hooks/useAuth';
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
  
  // Actions - Incidents
  refreshIncidents: (filters?: GuestSafetyFilters) => Promise<void>;
  assignTeam: (incidentId: string, teamId: string) => Promise<void>;
  resolveIncident: (incidentId: string) => Promise<void>;
  sendMessage: (incidentId: string, message: string) => Promise<void>;
  
  // Actions - Mass Notification
  sendMassNotification: (data: MassNotificationData) => Promise<void>;
  
  // Actions - Settings
  refreshSettings: () => Promise<void>;
  updateSettings: (settings: Partial<GuestSafetySettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
}

export function useGuestSafetyState(): UseGuestSafetyStateReturn {
  const { user } = useAuth();
  
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
  });
  
  // Modal states (Modal State Convergence)
  const [selectedIncident, setSelectedIncident] = useState<GuestIncident | null>(null);
  const [showAssignTeamModal, setShowAssignTeamModal] = useState(false);
  const [showSendMessageModal, setShowSendMessageModal] = useState(false);
  
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
  
  // ============================================
  // INCIDENT ACTIONS
  // ============================================
  
  /**
   * Assign team to incident (with RBAC check)
   */
  const assignTeam = useCallback(async (incidentId: string, teamId: string) => {
    // RBAC CHECK
    if (!canAssignTeam) {
      showError('You do not have permission to assign teams');
      throw new Error('Unauthorized');
    }
    
    const toastId = showLoading('Assigning team...');
    setLoading(prev => ({ ...prev, actions: true }));
    try {
      await guestSafetyService.updateIncident(incidentId, { assignedTeam: teamId, status: 'responding' });
      
      // Update state optimistically
      const team = teams.find(t => t.id === teamId);
      setIncidents(prev => prev.map(incident => 
        incident.id === incidentId 
          ? { ...incident, status: 'responding' as const, assignedTeam: team?.name }
          : incident
      ));
      
      dismissLoadingAndShowSuccess(toastId, 'Team assigned successfully');
      setShowAssignTeamModal(false);
      logger.info('Team assigned to incident', { module: 'GuestSafety', incidentId, teamId });
    } catch (error) {
      dismissLoadingAndShowError(toastId, 'Failed to assign team');
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
  }, [canAssignTeam, teams]);
  
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
  // INITIAL DATA LOAD
  // ============================================
  
  useEffect(() => {
    refreshIncidents();
    refreshTeams();
    refreshSettings();
  }, [refreshIncidents, refreshTeams, refreshSettings]);
  
  // ============================================
  // RETURN
  // ============================================
  
  return {
    // Data
    incidents,
    teams,
    metrics,
    settings,
    
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
    
    // Actions
    refreshIncidents,
    assignTeam,
    resolveIncident,
    sendMessage,
    sendMassNotification,
    refreshSettings,
    updateSettings,
    resetSettings,
  };
}
