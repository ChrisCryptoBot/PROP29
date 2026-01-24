// Modal configuration types and constants

export const MODAL_TYPES = {
    // Event & Security Modals
    ACTIVE_INCIDENTS: 'ACTIVE_INCIDENTS',
    GUEST_SAFETY_ALERTS: 'GUEST_SAFETY_ALERTS',

    // Patrol Modals
    PATROL_COMMAND_CENTER: 'PATROL_COMMAND_CENTER',

    // Module Modals
    ACCESS_CONTROL: 'ACCESS_CONTROL',
    EVENT_LOG: 'EVENT_LOG',
    LOST_FOUND: 'LOST_FOUND',
    PACKAGES: 'PACKAGES',
    ANALYTICS: 'ANALYTICS',

    // Configuration Modals
    SYSTEM_SETTINGS: 'SYSTEM_SETTINGS',

    // Metrics Modals
    GUARDS_ON_DUTY: 'GUARDS_ON_DUTY',
    AI_OPTIMIZED_PATROLS: 'AI_OPTIMIZED_PATROLS',
    PATROL_EFFICIENCY: 'PATROL_EFFICIENCY',
    THREATS_BLOCKED: 'THREATS_BLOCKED',
    ACCESS_GRANTED: 'ACCESS_GRANTED',
} as const;

export type ModalType = typeof MODAL_TYPES[keyof typeof MODAL_TYPES];

export interface ModalConfig {
    title: string;
    size?: 'small' | 'medium' | 'large' | 'fullscreen';
    closable?: boolean;
    backdrop?: boolean;
}

export type ModalConfigMap = {
    [K in ModalType]: ModalConfig;
};

export const modalConfig: ModalConfigMap = {
    [MODAL_TYPES.ACTIVE_INCIDENTS]: {
        title: 'Active Security Incidents',
        size: 'large',
        closable: true,
        backdrop: true,
    },
    [MODAL_TYPES.GUEST_SAFETY_ALERTS]: {
        title: 'Guest Safety Alerts',
        size: 'medium',
        closable: true,
        backdrop: true,
    },
    [MODAL_TYPES.PATROL_COMMAND_CENTER]: {
        title: 'Patrol Command Center',
        size: 'large',
        closable: true,
        backdrop: true,
    },
    [MODAL_TYPES.ACCESS_CONTROL]: {
        title: 'Access Control',
        size: 'large',
        closable: true,
        backdrop: true,
    },
    [MODAL_TYPES.EVENT_LOG]: {
        title: 'Event Log',
        size: 'large',
        closable: true,
        backdrop: true,
    },
    [MODAL_TYPES.LOST_FOUND]: {
        title: 'Lost & Found',
        size: 'medium',
        closable: true,
        backdrop: true,
    },
    [MODAL_TYPES.PACKAGES]: {
        title: 'Package Management',
        size: 'large',
        closable: true,
        backdrop: true,
    },
    [MODAL_TYPES.ANALYTICS]: {
        title: 'Analytics Dashboard',
        size: 'large',
        closable: true,
        backdrop: true,
    },
    [MODAL_TYPES.SYSTEM_SETTINGS]: {
        title: 'System Settings',
        size: 'large',
        closable: true,
        backdrop: true,
    },
    [MODAL_TYPES.GUARDS_ON_DUTY]: {
        title: 'Guards on Duty Management',
        size: 'large',
        closable: true,
        backdrop: true,
    },
    [MODAL_TYPES.AI_OPTIMIZED_PATROLS]: {
        title: 'AI-Optimized Patrol Analytics',
        size: 'large',
        closable: true,
        backdrop: true,
    },
    [MODAL_TYPES.PATROL_EFFICIENCY]: {
        title: 'Patrol Efficiency Dashboard',
        size: 'large',
        closable: true,
        backdrop: true,
    },
    [MODAL_TYPES.THREATS_BLOCKED]: {
        title: 'Threats Blocked',
        size: 'medium',
        closable: true,
        backdrop: true,
    },
    [MODAL_TYPES.ACCESS_GRANTED]: {
        title: 'Access Control Events',
        size: 'large',
        closable: true,
        backdrop: true,
    },
};
