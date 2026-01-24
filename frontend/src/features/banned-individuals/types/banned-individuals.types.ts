export type BanType = 'TEMPORARY' | 'PERMANENT' | 'CONDITIONAL';
export type BanStatus = 'ACTIVE' | 'EXPIRED' | 'REMOVED';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type DetectionStatus = 'ACTIVE' | 'RESOLVED' | 'FALSE_POSITIVE';
export type TrainingStatus = 'TRAINED' | 'TRAINING' | 'NEEDS_TRAINING';

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
