export type BanType = 'TEMPORARY' | 'PERMANENT' | 'CONDITIONAL';
export type BanStatus = 'ACTIVE' | 'EXPIRED' | 'REMOVED';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type DetectionStatus = 'ACTIVE' | 'RESOLVED' | 'FALSE_POSITIVE';
export type TrainingStatus = 'TRAINED' | 'TRAINING' | 'NEEDS_TRAINING';

export type BanSource = 'MANAGER' | 'MOBILE_AGENT' | 'HARDWARE_DEVICE' | 'AUTO_APPROVED' | 'BULK_IMPORT';

export interface BannedIndividual {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    nationality: string;
    reason: string;
    banType: BanType;
    banStartDate: string;
    banEndDate?: string;
    identificationNumber: string;
    identificationType: string;
    photoUrl?: string;
    notes: string;
    status: BanStatus;
    riskLevel: RiskLevel;
    bannedBy: string;
    createdAt: string;
    updatedAt: string;
    detectionCount: number;
    lastDetection?: string;
    facialRecognitionData?: any;
    // Source tracking for workflow management
    source?: BanSource;
    sourceMetadata?: {
        agentId?: string;
        agentName?: string;
        agentTrustScore?: number;
        deviceId?: string;
        deviceName?: string;
        autoApproved?: boolean;
        importBatchId?: string;
    };
}

export interface DetectionAlert {
    id: string;
    individualId: string;
    individualName: string;
    location: string;
    timestamp: string;
    confidence: number;
    status: DetectionStatus;
    responseTime: number;
    actionTaken: string;
    notes?: string;
}

export interface FacialRecognitionStats {
    accuracy: number;
    trainingStatus: TrainingStatus;
    totalFaces: number;
    activeModels: number;
    lastTraining: string;
}

export interface BannedIndividualsMetrics {
    activeBans: number;
    recentDetections: number;
    facialRecognitionAccuracy: number;
    chainWideBans: number;
}

export type AuditSource = 'web_admin' | 'mobile_agent' | 'hardware_device' | 'system';

export interface BannedIndividualsAuditEntry {
    id: string;
    timestamp: string;
    actor: string;
    action: string;
    status: 'success' | 'failure' | 'info';
    target?: string;
    reason?: string;
    source: AuditSource;
    metadata?: {
        individualId?: string;
        individualName?: string;
        propertyId?: string;
        [key: string]: any;
    };
}
