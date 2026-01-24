/**
 * Incident Log Feature Type Definitions
 * Maps to backend schemas from backend/schemas.py
 */

export enum IncidentType {
  THEFT = 'theft',
  DISTURBANCE = 'disturbance',
  MEDICAL = 'medical',
  FIRE = 'fire',
  FLOOD = 'flood',
  CYBER = 'cyber',
  GUEST_COMPLAINT = 'guest_complaint',
  OTHER = 'other'
}

export enum IncidentSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum IncidentStatus {
  OPEN = 'open',
  INVESTIGATING = 'investigating',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  PENDING_REVIEW = 'pending_review'
}

/**
 * Location data structure (backend uses Dict[str, Any])
 */
export interface IncidentLocation {
  area?: string;
  floor?: string;
  building?: string;
  room?: string;
  coordinates?: { lat: number; lng: number };
  [key: string]: unknown; // Allow additional fields
}

/**
 * Evidence data structure (backend uses Dict[str, Any])
 */
export interface IncidentEvidence {
  photos?: string[];
  videos?: string[];
  documents?: string[];
  cctv_clips?: string[];
  [key: string]: unknown; // Allow additional fields
}

/**
 * Witnesses data structure (backend uses Dict[str, Any])
 */
export interface IncidentWitnesses {
  names?: string[];
  contact_info?: Record<string, string>;
  statements?: Record<string, string>;
  [key: string]: unknown; // Allow additional fields
}

/**
 * Frontend Incident type (matches backend IncidentResponse + frontend extensions)
 */
export interface Incident {
  incident_id: string; // UUID from backend
  property_id: string; // UUID from backend
  incident_type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  title: string;
  description: string;
  location: IncidentLocation;
  reported_by: string; // UUID from backend
  assigned_to?: string; // UUID from backend
  created_at: string; // ISO datetime
  updated_at: string; // ISO datetime
  resolved_at?: string; // ISO datetime
  evidence?: IncidentEvidence;
  witnesses?: IncidentWitnesses;
  ai_confidence?: number; // 0-1
  follow_up_required: boolean;
  insurance_claim: boolean;
  reporter_name?: string; // Populated by backend
  assignee_name?: string; // Populated by backend
  property_name?: string; // Populated by backend
  idempotency_key?: string;
  source?: string; // e.g. "manager", "agent", "sensor"
  source_agent_id?: string;
  source_device_id?: string;
  source_metadata?: Record<string, unknown>;
  escalation_level?: number; // 0 = not escalated, increments on escalation
  
  // Frontend-only extensions (not in backend)
  timeline?: IncidentTimelineEvent[];
  escalationHistory?: EscalationHistory[];
  evidenceItems?: EvidenceItem[];
  relatedIncidentsData?: RelatedIncident[];
}

/**
 * Create Incident payload (matches backend IncidentCreate)
 */
export interface IncidentCreate {
  property_id: string; // UUID
  incident_type: IncidentType;
  severity: IncidentSeverity;
  title: string;
  description: string;
  location: IncidentLocation;
  assigned_to?: string; // UUID
  evidence?: IncidentEvidence;
  witnesses?: IncidentWitnesses;
  idempotency_key?: string;
}

/**
 * Update Incident payload (matches backend IncidentUpdate)
 */
export interface IncidentUpdate {
  incident_type?: IncidentType;
  severity?: IncidentSeverity;
  status?: IncidentStatus;
  title?: string;
  description?: string;
  location?: IncidentLocation;
  assigned_to?: string; // UUID
  evidence?: IncidentEvidence;
  witnesses?: IncidentWitnesses;
  follow_up_required?: boolean;
  insurance_claim?: boolean;
  source?: string;
  source_agent_id?: string;
  source_device_id?: string;
  source_metadata?: Record<string, unknown>;
  escalation_level?: number;
  /** Optional; used for client-side conflict detection when merging updates */
  updated_at?: string;
}

/**
 * AI Classification Request (matches backend AIClassificationRequest)
 */
export interface AIClassificationRequest {
  title: string;
  description: string;
  location?: IncidentLocation | null;
}

/**
 * AI Classification Response (matches backend AIClassificationResponse)
 */
export interface AIClassificationResponse {
  incident_type: string;
  severity: string;
  confidence: number; // 0-1
  reasoning: string;
  fallback_used: boolean;
}

/**
 * Emergency Alert Create (matches backend EmergencyAlertCreate)
 */
export interface EmergencyAlertCreate {
  property_id: string; // UUID
  alert_type: string;
  location: IncidentLocation;
  description: string;
  severity: IncidentSeverity;
  contact_emergency_services?: boolean;
}

/**
 * Emergency Alert Response (matches backend EmergencyAlertResponse)
 */
export interface EmergencyAlertResponse {
  alert_id: string; // UUID
  property_id: string; // UUID
  alert_type: string;
  location: IncidentLocation;
  description: string;
  severity: IncidentSeverity;
  status: string;
  created_at: string; // ISO datetime
  emergency_services_contacted: boolean;
  response_time?: number;
}

/**
 * Frontend-only types (not in backend)
 */

export interface IncidentTimelineEvent {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  status: string;
  notes?: string;
}

export interface EscalationHistory {
  id: string;
  timestamp: string;
  fromLevel: number;
  toLevel: number;
  reason: string;
  escalatedBy: string;
  notified: string[];
}

export interface EvidenceItem {
  id: string;
  type: 'photo' | 'video' | 'document' | 'cctv';
  name: string;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
  size?: number;
  description?: string;
}

export interface RelatedIncident {
  id: string;
  title: string;
  similarity: number;
  reasons: string[];
  timestamp: string;
}

export interface EscalationRule {
  id: string;
  name: string;
  trigger: 'time' | 'severity' | 'manual';
  conditions: {
    severity?: IncidentSeverity;
    timeMinutes?: number;
    status?: string;
  };
  actions: {
    escalateTo?: string;
    notify?: string[];
    assignTo?: string;
  };
  active: boolean;
}

/**
 * Filter parameters for GET /api/incidents
 */
export interface IncidentFilters {
  property_id?: string;
  status?: IncidentStatus;
  severity?: IncidentSeverity;
  search?: string; // Client-side search
  dateRange?: {
    start?: string;
    end?: string;
  };
}

/**
 * Incident Settings (matches backend IncidentSettings)
 */
export interface IncidentSettings {
  data_retention_days?: number;
  auto_escalation_enabled?: boolean;
  auto_assign_enabled?: boolean;
  notification_preferences?: Record<string, unknown>;
  reporting?: {
    slack_integration?: boolean;
    teams_integration?: boolean;
    webhook_notifications?: boolean;
    api_endpoint?: string;
    api_key?: string;
  };
  ai_classification?: Record<string, unknown>;
  session_timeout?: number;
  encrypt_data?: boolean;
  audit_log_access?: boolean;
}

export interface IncidentSettingsResponse {
  settings: IncidentSettings;
  property_id: string;
  updated_at: string;
  updated_by: string;
}

/**
 * Pattern Recognition (matches backend PatternRecognitionRequest/Response)
 */
export interface PatternRecognitionRequest {
  time_range?: string; // e.g., "7d", "30d", "90d"
  property_id?: string;
  analysis_types?: string[];
}

export interface Pattern {
  type: string; // "location_pattern", "temporal_pattern", "severity_trend"
  confidence: number; // 0-1
  insight: string;
  recommendations: string[];
  affected_incidents: string[];
}

export interface PatternRecognitionResponse {
  patterns: Pattern[];
  generated_at: string;
  time_range: string;
}

/**
 * Report Export (matches backend ReportExportRequest)
 */
export interface ReportExportRequest {
  format: 'pdf' | 'csv';
  start_date?: string;
  end_date?: string;
  filters?: Record<string, unknown>;
}

export interface UserActivity {
  activity_id: string;
  user_id?: string | null;
  property_id: string;
  action_type: string;
  resource_type?: string | null;
  resource_id?: string | null;
  activity_metadata?: Record<string, unknown> | null;
  timestamp: string;
  ip_address: string;
  user_agent: string;
  session_id?: string | null;
  duration?: number | null;
  user_name?: string | null;
  property_name?: string | null;
}
