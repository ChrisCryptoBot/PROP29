/**
 * System Admin WebSocket Hook
 * Subscribes to real-time updates for users, roles, properties, integrations,
 * settings, security policies, and audit logs.
 * Ready for mobile agents, hardware devices, and external data sources.
 */

import { useEffect, useRef } from 'react';
import { useWebSocket } from '../../../components/UI/WebSocketProvider';
import { logger } from '../../../services/logger';

interface UseSystemAdminWebSocketCallbacks {
    onUserCreated?: (user: unknown) => void;
    onUserUpdated?: (user: unknown) => void;
    onUserDeleted?: (userId: string) => void;
    onRoleCreated?: (role: unknown) => void;
    onRoleUpdated?: (role: unknown) => void;
    onRoleDeleted?: (roleId: string) => void;
    onPropertyCreated?: (property: unknown) => void;
    onPropertyUpdated?: (property: unknown) => void;
    onPropertyDeleted?: (propertyId: string) => void;
    onIntegrationCreated?: (integration: unknown) => void;
    onIntegrationUpdated?: (integration: unknown) => void;
    onIntegrationDeleted?: (integrationId: string) => void;
    onSettingsUpdated?: (settings: unknown) => void;
    onSecurityPoliciesUpdated?: (policies: unknown) => void;
    onAuditEntryAdded?: (entry: unknown) => void;
}

export const useSystemAdminWebSocket = (callbacks: UseSystemAdminWebSocketCallbacks) => {
    const { subscribe, isConnected } = useWebSocket();
    const callbacksRef = useRef(callbacks);

    // Keep callbacks ref updated
    useEffect(() => {
        callbacksRef.current = callbacks;
    }, [callbacks]);

    useEffect(() => {
        if (!isConnected) {
            logger.debug('WebSocket not connected, skipping system-admin subscriptions', { module: 'SystemAdminWebSocket' });
            return;
        }

        logger.info('Subscribing to system-admin WebSocket channels', { module: 'SystemAdminWebSocket' });

        // User events
        const unsubscribeUserCreated = subscribe('system-admin.user.created', (data: unknown) => {
            logger.debug('Received system-admin.user.created event', { module: 'SystemAdminWebSocket', data });
            callbacksRef.current.onUserCreated?.(data);
        });

        const unsubscribeUserUpdated = subscribe('system-admin.user.updated', (data: unknown) => {
            logger.debug('Received system-admin.user.updated event', { module: 'SystemAdminWebSocket', data });
            callbacksRef.current.onUserUpdated?.(data);
        });

        const unsubscribeUserDeleted = subscribe('system-admin.user.deleted', (data: unknown) => {
            logger.debug('Received system-admin.user.deleted event', { module: 'SystemAdminWebSocket', data });
            if (data && typeof data === 'object' && 'id' in data) {
                callbacksRef.current.onUserDeleted?.(String((data as { id: unknown }).id));
            }
        });

        // Role events
        const unsubscribeRoleCreated = subscribe('system-admin.role.created', (data: unknown) => {
            logger.debug('Received system-admin.role.created event', { module: 'SystemAdminWebSocket', data });
            callbacksRef.current.onRoleCreated?.(data);
        });

        const unsubscribeRoleUpdated = subscribe('system-admin.role.updated', (data: unknown) => {
            logger.debug('Received system-admin.role.updated event', { module: 'SystemAdminWebSocket', data });
            callbacksRef.current.onRoleUpdated?.(data);
        });

        const unsubscribeRoleDeleted = subscribe('system-admin.role.deleted', (data: unknown) => {
            logger.debug('Received system-admin.role.deleted event', { module: 'SystemAdminWebSocket', data });
            if (data && typeof data === 'object' && 'id' in data) {
                callbacksRef.current.onRoleDeleted?.(String((data as { id: unknown }).id));
            }
        });

        // Property events
        const unsubscribePropertyCreated = subscribe('system-admin.property.created', (data: unknown) => {
            logger.debug('Received system-admin.property.created event', { module: 'SystemAdminWebSocket', data });
            callbacksRef.current.onPropertyCreated?.(data);
        });

        const unsubscribePropertyUpdated = subscribe('system-admin.property.updated', (data: unknown) => {
            logger.debug('Received system-admin.property.updated event', { module: 'SystemAdminWebSocket', data });
            callbacksRef.current.onPropertyUpdated?.(data);
        });

        const unsubscribePropertyDeleted = subscribe('system-admin.property.deleted', (data: unknown) => {
            logger.debug('Received system-admin.property.deleted event', { module: 'SystemAdminWebSocket', data });
            if (data && typeof data === 'object' && 'id' in data) {
                callbacksRef.current.onPropertyDeleted?.(String((data as { id: unknown }).id));
            }
        });

        // Integration events
        const unsubscribeIntegrationCreated = subscribe('system-admin.integration.created', (data: unknown) => {
            logger.debug('Received system-admin.integration.created event', { module: 'SystemAdminWebSocket', data });
            callbacksRef.current.onIntegrationCreated?.(data);
        });

        const unsubscribeIntegrationUpdated = subscribe('system-admin.integration.updated', (data: unknown) => {
            logger.debug('Received system-admin.integration.updated event', { module: 'SystemAdminWebSocket', data });
            callbacksRef.current.onIntegrationUpdated?.(data);
        });

        const unsubscribeIntegrationDeleted = subscribe('system-admin.integration.deleted', (data: unknown) => {
            logger.debug('Received system-admin.integration.deleted event', { module: 'SystemAdminWebSocket', data });
            if (data && typeof data === 'object' && 'id' in data) {
                callbacksRef.current.onIntegrationDeleted?.(String((data as { id: unknown }).id));
            }
        });

        // Settings and security events
        const unsubscribeSettingsUpdated = subscribe('system-admin.settings.updated', (data: unknown) => {
            logger.debug('Received system-admin.settings.updated event', { module: 'SystemAdminWebSocket', data });
            callbacksRef.current.onSettingsUpdated?.(data);
        });

        const unsubscribeSecurityPoliciesUpdated = subscribe('system-admin.security.updated', (data: unknown) => {
            logger.debug('Received system-admin.security.updated event', { module: 'SystemAdminWebSocket', data });
            callbacksRef.current.onSecurityPoliciesUpdated?.(data);
        });

        // Audit events
        const unsubscribeAuditEntryAdded = subscribe('system-admin.audit.new', (data: unknown) => {
            logger.debug('Received system-admin.audit.new event', { module: 'SystemAdminWebSocket', data });
            callbacksRef.current.onAuditEntryAdded?.(data);
        });

        return () => {
            logger.debug('Unsubscribing from system-admin WebSocket channels', { module: 'SystemAdminWebSocket' });
            unsubscribeUserCreated();
            unsubscribeUserUpdated();
            unsubscribeUserDeleted();
            unsubscribeRoleCreated();
            unsubscribeRoleUpdated();
            unsubscribeRoleDeleted();
            unsubscribePropertyCreated();
            unsubscribePropertyUpdated();
            unsubscribePropertyDeleted();
            unsubscribeIntegrationCreated();
            unsubscribeIntegrationUpdated();
            unsubscribeIntegrationDeleted();
            unsubscribeSettingsUpdated();
            unsubscribeSecurityPoliciesUpdated();
            unsubscribeAuditEntryAdded();
        };
    }, [subscribe, isConnected]);

    return { isConnected };
};
