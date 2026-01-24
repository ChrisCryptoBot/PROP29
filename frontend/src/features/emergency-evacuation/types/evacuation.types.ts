// Emergency Evacuation - Types

export type EvacuationTabId = 'overview' | 'active' | 'communication' | 'analytics' | 'predictive' | 'settings';

export interface EvacuationMetrics {
  evacuated: number;
  inProgress: number;
  remaining: number;
  staffDeployed: number;
  elapsedTime: string;
  totalOccupancy: number;
  evacuationProgress: number;
}

export interface FloorStatus {
  id: string;
  name: string;
  description: string;
  guestCount: number;
  progress: number;
  status: 'evacuated' | 'in-progress' | 'pending';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  assignedStaff: number;
  exitRoute: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'complete' | 'assigned' | 'standby';
  location: string;
  avatar: string;
  assignedFloor?: string;
  guestsAssisted: number;
}

export interface TimelineEvent {
  id: string;
  time: string;
  content: string;
  severity: 'critical' | 'warning' | 'info' | 'success';
  current?: boolean;
  icon?: string;
}

export interface GuestAssistance {
  id: string;
  room: string;
  guestName: string;
  need: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'assigned' | 'completed';
  assignedStaff?: string;
  notes?: string;
}

export interface EvacuationRoute {
  id: string;
  name: string;
  status: 'clear' | 'congested' | 'blocked';
  description: string;
  capacity: number;
  currentOccupancy: number;
  floors: string[];
  estimatedTime: string;
}

export interface CommunicationLog {
  id: string;
  timestamp: string;
  type: 'announcement' | 'notification' | 'emergency-call' | 'radio';
  message: string;
  recipients: string;
  status: 'sent' | 'pending' | 'failed';
}

export interface EvacuationDrill {
  id: string;
  date: string;
  duration: string;
  participationRate: number;
  issues: number;
  score: number;
  status: 'completed' | 'in-progress' | 'scheduled';
}

export interface EvacuationSettings {
  autoEvacuation: boolean;
  emergencyServicesContact: boolean;
  guestNotifications: boolean;
  staffAlerts: boolean;
  soundAlarms: boolean;
  unlockExits: boolean;
  elevatorShutdown: boolean;
  hvacControl: boolean;
  lightingControl: boolean;
  announcementVolume: string;
  evacuationTimeout: string;
  drillFrequency: string;
}

export interface PredictiveInsight {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  recommendation: string;
}
