import React, { createContext, useContext } from 'react';
import {
    PatrolOfficer,
    UpcomingPatrol,
    PatrolRoute,
    PatrolTemplate,
    PatrolSchedule,
    EmergencyStatus,
    WeatherInfo,
    Alert,
    PatrolMetrics,
    PatrolSettings,
    Checkpoint,
    PatrolProperty
} from '../types';

export interface PatrolContextValue {
    // Data
    officers: PatrolOfficer[];
    upcomingPatrols: UpcomingPatrol[];
    routes: PatrolRoute[];
    templates: PatrolTemplate[];
    schedule: PatrolSchedule[];
    metrics: PatrolMetrics;
    emergencyStatus: EmergencyStatus;
    weather: WeatherInfo;
    alerts: Alert[];
    settings: PatrolSettings;
    properties: PatrolProperty[];
    selectedPropertyId: string | null;
    selectedPropertyTimezone?: string;
    activeTab: string;
    setActiveTab: (tab: string) => void;

    // Loading States
    isLoading: boolean;

    // Actions
    setOfficers: React.Dispatch<React.SetStateAction<PatrolOfficer[]>>;
    setUpcomingPatrols: React.Dispatch<React.SetStateAction<UpcomingPatrol[]>>;
    setRoutes: React.Dispatch<React.SetStateAction<PatrolRoute[]>>;
    setTemplates: React.Dispatch<React.SetStateAction<PatrolTemplate[]>>;
    setSchedule: React.Dispatch<React.SetStateAction<PatrolSchedule[]>>;
    setMetrics: React.Dispatch<React.SetStateAction<PatrolMetrics>>;
    setEmergencyStatus: React.Dispatch<React.SetStateAction<EmergencyStatus>>;
    setWeather: React.Dispatch<React.SetStateAction<WeatherInfo>>;
    setAlerts: React.Dispatch<React.SetStateAction<Alert[]>>;
    setSettings: React.Dispatch<React.SetStateAction<PatrolSettings>>;
    setProperties: React.Dispatch<React.SetStateAction<PatrolProperty[]>>;
    setSelectedPropertyId: React.Dispatch<React.SetStateAction<string | null>>;

    // Handlers
    handleDeployOfficer: (officerId: string, patrolId: string) => Promise<void>;
    handleCompletePatrol: (patrolId: string) => Promise<void>;
    handleCheckpointCheckIn: (patrolId: string, checkpointId: string, notes?: string, deviceId?: string) => Promise<void>;
    handleReassignOfficer: (patrolId: string, newOfficerId: string) => Promise<void>;
    handleCancelPatrol: (patrolId: string) => Promise<void>;
    handleDeleteTemplate: (templateId: string) => Promise<void>;
    handleDeleteRoute: (routeId: string) => Promise<void>;
    handleDeleteCheckpoint: (checkpointId: string, routeId: string) => Promise<void>;
    handleEmergencyAlert: () => Promise<void>;
    refreshPatrolData: () => Promise<void>;
    retryCheckInQueue: () => void;

    // Check-in queue (offline sync)
    checkInQueuePendingCount: number;
    checkInQueueFailedCount: number;

    /** True when navigator.onLine is false; deploy disabled, show banner */
    isOffline: boolean;

    // Update Logic
    updatePatrolStatus: (patrolId: string, status: UpcomingPatrol['status']) => void;
    updateOfficerStatus: (officerId: string, status: PatrolOfficer['status']) => void;
    
    // Sync State
    lastSyncTimestamp: Date | null;
}

export const PatrolContext = createContext<PatrolContextValue | undefined>(undefined);

export const usePatrolContext = () => {
    const context = useContext(PatrolContext);
    if (!context) {
        throw new Error('usePatrolContext must be used within a PatrolProvider');
    }
    return context;
};
