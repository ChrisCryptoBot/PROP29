/**
 * Visitor State Hook
 * Centralized state management for Visitor Security feature
 * Contains ALL business logic following Gold Standard pattern
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { logger } from '../../../services/logger';
import { useAuth } from '../../../contexts/AuthContext';
import {
  showLoading,
  dismissLoadingAndShowSuccess,
  dismissLoadingAndShowError,
  showSuccess,
  showError
} from '../../../utils/toast';
import type {
  Visitor,
  VisitorCreate,
  VisitorUpdate,
  VisitorFilters,
  Event,
  EventCreate,
  EventUpdate,
  EventFilters,
  SecurityRequest,
  SecurityRequestCreate,
  SecurityRequestFilters,
  VisitorStatus,
  VisitorMetrics
} from '../types/visitor-security.types';
import { VisitorStatus as StatusEnum } from '../types/visitor-security.types';
import visitorService from '../services/VisitorService';

export interface UseVisitorStateReturn {
  // Data
  visitors: Visitor[];
  events: Event[];
  securityRequests: SecurityRequest[];
  selectedVisitor: Visitor | null;
  selectedEvent: Event | null;
  metrics: VisitorMetrics | null;

  // Loading states
  loading: {
    visitors: boolean;
    visitor: boolean;
    events: boolean;
    event: boolean;
    securityRequests: boolean;
  };

  // Filters
  filter: 'all' | 'registered' | 'checked_in' | 'checked_out' | 'overdue' | 'cancelled';
  setFilter: (filter: 'all' | 'registered' | 'checked_in' | 'checked_out' | 'overdue' | 'cancelled') => void;

  // Modal states
  showRegisterModal: boolean;
  setShowRegisterModal: (show: boolean) => void;
  showEventModal: boolean;
  setShowEventModal: (show: boolean) => void;
  showQRModal: boolean;
  setShowQRModal: (show: boolean) => void;
  showBadgeModal: boolean;
  setShowBadgeModal: (show: boolean) => void;
  showVisitorDetailsModal: boolean;
  setShowVisitorDetailsModal: (show: boolean) => void;
  showEventDetailsModal: boolean;
  setShowEventDetailsModal: (show: boolean) => void;

  // Computed
  filteredVisitors: Visitor[];

  // Actions - Visitor CRUD Operations
  refreshVisitors: (filters?: VisitorFilters) => Promise<void>;
  getVisitor: (visitorId: string) => Promise<Visitor | null>;
  createVisitor: (visitor: VisitorCreate) => Promise<Visitor | null>;
  updateVisitor: (visitorId: string, updates: VisitorUpdate) => Promise<Visitor | null>;
  deleteVisitor: (visitorId: string) => Promise<boolean>;

  // Actions - Visitor Management
  checkInVisitor: (visitorId: string) => Promise<boolean>;
  checkOutVisitor: (visitorId: string) => Promise<boolean>;
  getVisitorQRCode: (visitorId: string) => Promise<string | null>;

  // Actions - Event CRUD Operations
  refreshEvents: (filters?: EventFilters) => Promise<void>;
  getEvent: (eventId: string) => Promise<Event | null>;
  createEvent: (event: EventCreate) => Promise<Event | null>;
  deleteEvent: (eventId: string) => Promise<boolean>;

  // Actions - Security Requests
  refreshSecurityRequests: (filters?: SecurityRequestFilters) => Promise<void>;
  createSecurityRequest: (request: SecurityRequestCreate) => Promise<SecurityRequest | null>;

  // Actions - Selection
  setSelectedVisitor: (visitor: Visitor | null) => void;
  setSelectedEvent: (event: Event | null) => void;

  // Actions - Bulk Operations
  bulkDeleteVisitors: (visitorIds: string[]) => Promise<boolean>;
  bulkStatusChange: (visitorIds: string[], status: VisitorStatus | string) => Promise<boolean>;
}

export function useVisitorState(): UseVisitorStateReturn {
  const { user: currentUser } = useAuth();

  // Get property_id from user (temporary: using roles[0] as placeholder)
  // TODO: Replace with actual property_id from user object when available
  const propertyId = useMemo(() => {
    return currentUser?.roles?.[0] || 'default-property-id';
  }, [currentUser]);

  // State
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [securityRequests, setSecurityRequests] = useState<SecurityRequest[]>([]);
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Loading states
  const [loading, setLoading] = useState({
    visitors: false,
    visitor: false,
    events: false,
    event: false,
    securityRequests: false,
  });

  // Filters
  const [filter, setFilter] = useState<'all' | 'registered' | 'checked_in' | 'checked_out' | 'overdue' | 'cancelled'>('all');

  // Modal states
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [showVisitorDetailsModal, setShowVisitorDetailsModal] = useState(false);
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);

  // Computed: Filtered visitors
  const filteredVisitors = useMemo(() => {
    return visitors.filter(visitor => {
      if (filter === 'all') return true;
      return visitor.status === filter;
    });
  }, [visitors, filter]);

  // Computed: Metrics
  const metrics = useMemo<VisitorMetrics | null>(() => {
    if (visitors.length === 0) return null;
    return {
      total: visitors.length,
      checked_in: visitors.filter(v => v.status === 'checked_in').length,
      pending: visitors.filter(v => v.security_clearance === 'pending').length,
      active_events: events.length,
      security_requests: securityRequests.filter(sr => sr.status === 'pending' || sr.status === 'in_progress').length,
      overdue: visitors.filter(v => v.status === 'overdue').length
    };
  }, [visitors, events, securityRequests]);

  // Fetch Visitors
  const refreshVisitors = useCallback(async (filters?: VisitorFilters) => {
    setLoading(prev => ({ ...prev, visitors: true }));
    try {
      const response = await visitorService.getVisitors({
        ...filters,
        property_id: filters?.property_id || propertyId
      });

      if (response.data) {
        setVisitors(response.data);
      }
    } catch (error) {
      logger.error('Failed to fetch visitors', error instanceof Error ? error : new Error(String(error)), {
        module: 'VisitorSecurity',
        action: 'refreshVisitors'
      });
      showError('Failed to load visitors');
    } finally {
      setLoading(prev => ({ ...prev, visitors: false }));
    }
  }, [propertyId]);

  // Get Single Visitor
  const getVisitor = useCallback(async (visitorId: string): Promise<Visitor | null> => {
    setLoading(prev => ({ ...prev, visitor: true }));
    try {
      const response = await visitorService.getVisitor(visitorId);
      if (response.data) {
        setSelectedVisitor(response.data);
        return response.data;
      }
      return null;
    } catch (error) {
      logger.error('Failed to fetch visitor', error instanceof Error ? error : new Error(String(error)), {
        module: 'VisitorSecurity',
        action: 'getVisitor'
      });
      showError('Failed to load visitor');
      return null;
    } finally {
      setLoading(prev => ({ ...prev, visitor: false }));
    }
  }, []);

  // Create Visitor
  const createVisitor = useCallback(async (visitor: VisitorCreate): Promise<Visitor | null> => {
    const toastId = showLoading('Issuing ingress credentials...');
    setLoading(prev => ({ ...prev, visitors: true }));
    try {
      const response = await visitorService.createVisitor({
        ...visitor,
        property_id: visitor.property_id || propertyId
      });
      if (response.data) {
        const newVisitor = response.data;
        setVisitors(prev => [newVisitor, ...prev]);
        dismissLoadingAndShowSuccess(toastId, 'Ingress registration complete');
        return newVisitor;
      }
      dismissLoadingAndShowError(toastId, 'Failed to process ingress registration');
      return null;
    } catch (error) {
      logger.error('Failed to create visitor', error instanceof Error ? error : new Error(String(error)), {
        module: 'VisitorSecurity',
        action: 'createVisitor'
      });
      dismissLoadingAndShowError(toastId, 'Failed to process ingress registration');
      return null;
    } finally {
      setLoading(prev => ({ ...prev, visitors: false }));
    }
  }, [propertyId]);

  // Update Visitor
  const updateVisitor = useCallback(async (visitorId: string, updates: VisitorUpdate): Promise<Visitor | null> => {
    const toastId = showLoading('Updating record...');
    setLoading(prev => ({ ...prev, visitors: true }));
    try {
      const response = await visitorService.updateVisitor(visitorId, updates);
      if (response.data) {
        const updatedVisitor = response.data;
        setVisitors(prev => prev.map(v => v.id === visitorId ? updatedVisitor : v));
        if (selectedVisitor?.id === visitorId) {
          setSelectedVisitor(updatedVisitor);
        }
        dismissLoadingAndShowSuccess(toastId, 'Record updated successfully');
        return updatedVisitor;
      }
      dismissLoadingAndShowError(toastId, 'Failed to update record');
      return null;
    } catch (error) {
      logger.error('Failed to update visitor', error instanceof Error ? error : new Error(String(error)), {
        module: 'VisitorSecurity',
        action: 'updateVisitor'
      });
      dismissLoadingAndShowError(toastId, 'Failed to update record');
      return null;
    } finally {
      setLoading(prev => ({ ...prev, visitors: false }));
    }
  }, [selectedVisitor]);

  // Delete Visitor
  const deleteVisitor = useCallback(async (visitorId: string): Promise<boolean> => {
    const toastId = showLoading('Purging record...');
    setLoading(prev => ({ ...prev, visitors: true }));
    try {
      const response = await visitorService.deleteVisitor(visitorId);
      if (!response.error) {
        setVisitors(prev => prev.filter(v => v.id !== visitorId));
        if (selectedVisitor?.id === visitorId) {
          setSelectedVisitor(null);
        }
        dismissLoadingAndShowSuccess(toastId, 'Record purged successfully');
        return true;
      }
      dismissLoadingAndShowError(toastId, 'Failed to purge record');
      return false;
    } catch (error) {
      logger.error('Failed to delete visitor', error instanceof Error ? error : new Error(String(error)), {
        module: 'VisitorSecurity',
        action: 'deleteVisitor'
      });
      dismissLoadingAndShowError(toastId, 'Failed to purge record');
      return false;
    } finally {
      setLoading(prev => ({ ...prev, visitors: false }));
    }
  }, [selectedVisitor]);

  // Check In Visitor
  const checkInVisitor = useCallback(async (visitorId: string): Promise<boolean> => {
    const toastId = showLoading('Authorizing site ingress...');
    setLoading(prev => ({ ...prev, visitors: true }));
    try {
      const response = await visitorService.checkInVisitor(visitorId);
      if (response.data) {
        const updatedVisitor = response.data;
        setVisitors(prev => prev.map(v => v.id === visitorId ? updatedVisitor : v));
        if (selectedVisitor?.id === visitorId) {
          setSelectedVisitor(updatedVisitor);
        }
        dismissLoadingAndShowSuccess(toastId, 'Ingress authorized');
        return true;
      }
      dismissLoadingAndShowError(toastId, 'Ingress authorization failed');
      return false;
    } catch (error) {
      logger.error('Failed to check in visitor', error instanceof Error ? error : new Error(String(error)), {
        module: 'VisitorSecurity',
        action: 'checkInVisitor'
      });
      dismissLoadingAndShowError(toastId, 'Ingress authorization failed');
      return false;
    } finally {
      setLoading(prev => ({ ...prev, visitors: false }));
    }
  }, [selectedVisitor]);

  // Check Out Visitor
  const checkOutVisitor = useCallback(async (visitorId: string): Promise<boolean> => {
    const toastId = showLoading('Authorizing site egress...');
    setLoading(prev => ({ ...prev, visitors: true }));
    try {
      const response = await visitorService.checkOutVisitor(visitorId);
      if (response.data) {
        const updatedVisitor = response.data;
        setVisitors(prev => prev.map(v => v.id === visitorId ? updatedVisitor : v));
        if (selectedVisitor?.id === visitorId) {
          setSelectedVisitor(updatedVisitor);
        }
        dismissLoadingAndShowSuccess(toastId, 'Egress authorized');
        return true;
      }
      dismissLoadingAndShowError(toastId, 'Egress authorization failed');
      return false;
    } catch (error) {
      logger.error('Failed to check out visitor', error instanceof Error ? error : new Error(String(error)), {
        module: 'VisitorSecurity',
        action: 'checkOutVisitor'
      });
      dismissLoadingAndShowError(toastId, 'Egress authorization failed');
      return false;
    } finally {
      setLoading(prev => ({ ...prev, visitors: false }));
    }
  }, [selectedVisitor]);

  // Get Visitor QR Code
  const getVisitorQRCode = useCallback(async (visitorId: string): Promise<string | null> => {
    try {
      const response = await visitorService.getVisitorQRCode(visitorId);
      if (response.data) {
        return response.data.qr_code;
      }
      return null;
    } catch (error) {
      logger.error('Failed to get QR code', error instanceof Error ? error : new Error(String(error)), {
        module: 'VisitorSecurity',
        action: 'getVisitorQRCode'
      });
      showError('Failed to get QR code');
      return null;
    }
  }, []);

  // Fetch Events
  const refreshEvents = useCallback(async (filters?: EventFilters) => {
    setLoading(prev => ({ ...prev, events: true }));
    try {
      const response = await visitorService.getEvents({
        ...filters,
        property_id: filters?.property_id || propertyId
      });

      if (response.data) {
        setEvents(response.data);
      }
    } catch (error) {
      logger.error('Failed to fetch events', error instanceof Error ? error : new Error(String(error)), {
        module: 'VisitorSecurity',
        action: 'refreshEvents'
      });
      showError('Failed to load events');
    } finally {
      setLoading(prev => ({ ...prev, events: false }));
    }
  }, [propertyId]);

  // Get Single Event
  const getEvent = useCallback(async (eventId: string): Promise<Event | null> => {
    setLoading(prev => ({ ...prev, event: true }));
    try {
      // Note: There's no getEvent endpoint, so we find it from the events list
      const event = events.find(e => e.id === eventId);
      if (event) {
        setSelectedEvent(event);
        return event;
      }
      return null;
    } catch (error) {
      logger.error('Failed to fetch event', error instanceof Error ? error : new Error(String(error)), {
        module: 'VisitorSecurity',
        action: 'getEvent'
      });
      showError('Failed to load event');
      return null;
    } finally {
      setLoading(prev => ({ ...prev, event: false }));
    }
  }, [events]);

  // Create Event
  const createEvent = useCallback(async (event: EventCreate): Promise<Event | null> => {
    const toastId = showLoading('Registering event profile...');
    setLoading(prev => ({ ...prev, events: true }));
    try {
      const response = await visitorService.createEvent({
        ...event,
        property_id: event.property_id || propertyId
      });
      if (response.data) {
        const newEvent = response.data;
        setEvents(prev => [newEvent, ...prev]);
        dismissLoadingAndShowSuccess(toastId, 'Event profile registered');
        return newEvent;
      }
      dismissLoadingAndShowError(toastId, 'Failed to register event profile');
      return null;
    } catch (error) {
      logger.error('Failed to create event', error instanceof Error ? error : new Error(String(error)), {
        module: 'VisitorSecurity',
        action: 'createEvent'
      });
      dismissLoadingAndShowError(toastId, 'Failed to register event profile');
      return null;
    } finally {
      setLoading(prev => ({ ...prev, events: false }));
    }
  }, [propertyId]);

  // Delete Event
  const deleteEvent = useCallback(async (eventId: string): Promise<boolean> => {
    const toastId = showLoading('Purging event profile...');
    setLoading(prev => ({ ...prev, events: true }));
    try {
      const response = await visitorService.deleteEvent(eventId);
      if (!response.error) {
        setEvents(prev => prev.filter(e => e.id !== eventId));
        if (selectedEvent?.id === eventId) {
          setSelectedEvent(null);
        }
        dismissLoadingAndShowSuccess(toastId, 'Event profile purged');
        return true;
      }
      dismissLoadingAndShowError(toastId, 'Failed to purge event profile');
      return false;
    } catch (error) {
      logger.error('Failed to delete event', error instanceof Error ? error : new Error(String(error)), {
        module: 'VisitorSecurity',
        action: 'deleteEvent'
      });
      dismissLoadingAndShowError(toastId, 'Failed to purge event profile');
      return false;
    } finally {
      setLoading(prev => ({ ...prev, events: false }));
    }
  }, [selectedEvent]);

  // Fetch Security Requests
  const refreshSecurityRequests = useCallback(async (filters?: SecurityRequestFilters) => {
    setLoading(prev => ({ ...prev, securityRequests: true }));
    try {
      const response = await visitorService.getSecurityRequests({
        ...filters,
        property_id: filters?.property_id || propertyId
      });

      if (response.data) {
        setSecurityRequests(response.data);
      }
    } catch (error) {
      logger.error('Failed to fetch security requests', error instanceof Error ? error : new Error(String(error)), {
        module: 'VisitorSecurity',
        action: 'refreshSecurityRequests'
      });
      showError('Failed to load security requests');
    } finally {
      setLoading(prev => ({ ...prev, securityRequests: false }));
    }
  }, [propertyId]);

  // Create Security Request
  const createSecurityRequest = useCallback(async (request: SecurityRequestCreate): Promise<SecurityRequest | null> => {
    const toastId = showLoading('Submitting clearance request...');
    try {
      const response = await visitorService.createSecurityRequest(request);
      if (response.data) {
        const newRequest = response.data;
        setSecurityRequests(prev => [newRequest, ...prev]);
        dismissLoadingAndShowSuccess(toastId, 'Clearance request submitted');
        return newRequest;
      }
      dismissLoadingAndShowError(toastId, 'Clearance request failed');
      return null;
    } catch (error) {
      logger.error('Failed to create security request', error instanceof Error ? error : new Error(String(error)), {
        module: 'VisitorSecurity',
        action: 'createSecurityRequest'
      });
      dismissLoadingAndShowError(toastId, 'Clearance request failed');
      return null;
    }
  }, []);

  // Bulk Delete Visitors
  const bulkDeleteVisitors = useCallback(async (visitorIds: string[]): Promise<boolean> => {
    const toastId = showLoading('Purging records...');
    setLoading(prev => ({ ...prev, visitors: true }));
    try {
      await Promise.all(visitorIds.map(id => visitorService.deleteVisitor(id)));
      setVisitors(prev => prev.filter(v => !visitorIds.includes(v.id)));
      if (selectedVisitor && visitorIds.includes(selectedVisitor.id)) {
        setSelectedVisitor(null);
      }
      dismissLoadingAndShowSuccess(toastId, 'Records purged successfully');
      return true;
    } catch (error) {
      logger.error('Failed to delete visitors', error instanceof Error ? error : new Error(String(error)), {
        module: 'VisitorSecurity',
        action: 'bulkDeleteVisitors'
      });
      dismissLoadingAndShowError(toastId, 'Failed to purge records');
      return false;
    } finally {
      setLoading(prev => ({ ...prev, visitors: false }));
    }
  }, [selectedVisitor]);

  // Bulk Status Change
  const bulkStatusChange = useCallback(async (visitorIds: string[], status: VisitorStatus | string): Promise<boolean> => {
    const toastId = showLoading('Updating record state...');
    setLoading(prev => ({ ...prev, visitors: true }));
    try {
      await Promise.all(visitorIds.map(id => visitorService.updateVisitor(id, { status })));
      setVisitors(prev => prev.map(v =>
        visitorIds.includes(v.id) ? { ...v, status } : v
      ));
      dismissLoadingAndShowSuccess(toastId, 'Record state updated');
      return true;
    } catch (error) {
      logger.error('Failed to update visitor status', error instanceof Error ? error : new Error(String(error)), {
        module: 'VisitorSecurity',
        action: 'bulkStatusChange'
      });
      dismissLoadingAndShowError(toastId, 'Failed to update record state');
      return false;
    } finally {
      setLoading(prev => ({ ...prev, visitors: false }));
    }
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    if (propertyId && propertyId !== 'default-property-id') {
      refreshVisitors({ property_id: propertyId });
      refreshEvents({ property_id: propertyId });
      refreshSecurityRequests({ property_id: propertyId });
    }
  }, [propertyId, refreshVisitors, refreshEvents, refreshSecurityRequests]);

  return {
    // Data
    visitors,
    events,
    securityRequests,
    selectedVisitor,
    selectedEvent,
    metrics,

    // Loading states
    loading,

    // Filters
    filter,
    setFilter,

    // Modal states
    showRegisterModal,
    setShowRegisterModal,
    showEventModal,
    setShowEventModal,
    showQRModal,
    setShowQRModal,
    showBadgeModal,
    setShowBadgeModal,
    showVisitorDetailsModal,
    setShowVisitorDetailsModal,
    showEventDetailsModal,
    setShowEventDetailsModal,

    // Computed
    filteredVisitors,

    // Actions - Visitor CRUD
    refreshVisitors,
    getVisitor,
    createVisitor,
    updateVisitor,
    deleteVisitor,

    // Actions - Visitor Management
    checkInVisitor,
    checkOutVisitor,
    getVisitorQRCode,

    // Actions - Event CRUD
    refreshEvents,
    getEvent,
    createEvent,
    deleteEvent,

    // Actions - Security Requests
    refreshSecurityRequests,
    createSecurityRequest,

    // Actions - Selection
    setSelectedVisitor,
    setSelectedEvent,

    // Actions - Bulk Operations
    bulkDeleteVisitors,
    bulkStatusChange,
  };
}
