export type BanType = 'TEMPORARY' | 'PERMANENT' | 'CONDITIONAL';
export type BanStatus = 'ACTIVE' | 'EXPIRED' | 'REMOVED';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type DetectionStatus = 'ACTIVE' | 'RESOLVED' | 'FALSE_POSITIVE';
export type TrainingStatus = 'TRAINED' | 'TRAINING' | 'NEEDS_TRAINING';

export type BanSource = 'MANAGER' | 'MOBILE_AGENT' | 'HARDWARE_DEVICE' | 'AUTO_APPROVED' | 'BULK_IMPORT';

/** Physical/build for patrol quick filter */
export type BuildType = 'SLIM' | 'MEDIUM' | 'HEAVY' | 'UNKNOWN';
/** Gender for patrol quick filter */
export type GenderType = 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN';
/** Height band for patrol quick filter */
export type HeightBand = 'UNDER_5_6' | '5_6_TO_5_10' | '5_10_TO_6_2' | 'OVER_6_2' | 'UNKNOWN';

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
    // Optional physical/trait fields for patrol quick identification (hundreds of records)
    gender?: GenderType;
    height?: string;           // e.g. "5'10\"", "178cm"
    heightBand?: HeightBand;
    build?: BuildType;
    hairColor?: string;        // e.g. "Black", "Brown", "Blonde", "Grey"
    eyeColor?: string;         // e.g. "Brown", "Blue", "Green"
    distinguishingFeatures?: string;  // e.g. "Beard, scar left cheek, tattoo right arm"
    aliases?: string[];        // Known aliases / alternate names
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
