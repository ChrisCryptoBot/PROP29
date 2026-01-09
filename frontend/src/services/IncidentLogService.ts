export interface IncidentLog {
  id: string;
  title: string;
  type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  location: string;
  status: 'active' | 'investigating' | 'resolved' | 'escalated';
  description: string;
  timestamp: string;
  assignedTo?: string;
  witnesses?: string[];
  evidence?: string[];
  photos?: string[];
  videos?: string[];
  cctvClips?: string[];
  aiClassification?: string;
  aiSeverity?: string;
  relatedIncidents?: string[];
  escalationLevel?: number;
  resolutionTime?: string;
  cost?: number;
  guestImpact?: string;
  floorPlanLocation?: { x: number; y: number; floor: string };
  module?: string;
  additionalData?: any;
}

class IncidentLogService {
  private static instance: IncidentLogService;
  private incidents: IncidentLog[] = [];

  private constructor() {
    // Load existing incidents from localStorage
    this.loadIncidents();
  }

  public static getInstance(): IncidentLogService {
    if (!IncidentLogService.instance) {
      IncidentLogService.instance = new IncidentLogService();
    }
    return IncidentLogService.instance;
  }

  private loadIncidents(): void {
    try {
      const stored = localStorage.getItem('proper29_incidents');
      if (stored) {
        this.incidents = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading incidents:', error);
      this.incidents = [];
    }
  }

  private saveIncidents(): void {
    try {
      localStorage.setItem('proper29_incidents', JSON.stringify(this.incidents));
    } catch (error) {
      console.error('Error saving incidents:', error);
    }
  }

  public logIncident(incident: Omit<IncidentLog, 'id' | 'timestamp'>): string {
    const newIncident: IncidentLog = {
      ...incident,
      id: `INC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };

    this.incidents.unshift(newIncident);
    this.saveIncidents();

    // Trigger any listeners
    this.notifyListeners(newIncident);

    return newIncident.id;
  }

  public logMedicalIncident(medicalData: any): string {
    const severity = this.determineMedicalSeverity(medicalData);
    const location = medicalData.patientLocation || 'Unknown Location';
    
    const incident: Omit<IncidentLog, 'id' | 'timestamp'> = {
      title: `Medical Emergency - ${medicalData.incidentId}`,
      type: 'Medical Emergency',
      severity,
      location,
      status: 'active',
      description: this.generateMedicalDescription(medicalData),
      assignedTo: 'Medical Response Team',
      witnesses: ['Security Team', 'Hotel Staff', 'EMS'],
      evidence: [`Medical_Report_${medicalData.incidentId}.pdf`],
      aiClassification: 'Medical Emergency',
      aiSeverity: severity,
      escalationLevel: severity === 'CRITICAL' ? 3 : severity === 'HIGH' ? 2 : 1,
      module: 'GuestSafety',
      additionalData: {
        patientLocation: medicalData.patientLocation,
        consciousness: medicalData.consciousness,
        breathing: medicalData.breathing,
        symptoms: medicalData.symptoms,
        actionsCompleted: medicalData.actionsCompleted,
        responseLog: medicalData.responseLog,
        duration: medicalData.duration,
        responders: medicalData.responders,
        resources: medicalData.resources
      }
    };

    return this.logIncident(incident);
  }

  public logEvacuationIncident(evacuationData: any): string {
    const incident: Omit<IncidentLog, 'id' | 'timestamp'> = {
      title: `Emergency Evacuation - ${evacuationData.evacuationType.toUpperCase()}`,
      type: 'Emergency Evacuation',
      severity: 'CRITICAL',
      location: evacuationData.location || 'Hotel Complex - All Floors',
      status: evacuationData.status || 'active',
      description: this.generateEvacuationDescription(evacuationData),
      assignedTo: 'Emergency Response Team',
      witnesses: ['Security Team', 'Hotel Staff', 'Emergency Services'],
      evidence: [`Evacuation_Report_${Date.now()}.pdf`],
      aiClassification: 'Emergency Evacuation',
      aiSeverity: 'CRITICAL',
      escalationLevel: 3,
      module: 'Evacuation',
      additionalData: {
        evacuationType: evacuationData.evacuationType,
        startTime: evacuationData.startTime,
        duration: evacuationData.duration,
        guestCount: evacuationData.guestCount,
        staffCount: evacuationData.staffCount,
        evacuatedCount: evacuationData.evacuatedCount,
        remainingCount: evacuationData.remainingCount,
        evacuationLog: evacuationData.evacuationLog,
        statistics: evacuationData.statistics,
        timeline: evacuationData.timeline,
        actions: evacuationData.actions,
        recommendations: evacuationData.recommendations
      }
    };

    return this.logIncident(incident);
  }

  private generateEvacuationDescription(evacuationData: any): string {
    const parts = [];
    
    parts.push(`Emergency evacuation initiated due to ${evacuationData.evacuationType} threat`);
    
    if (evacuationData.startTime) {
      const startTime = new Date(evacuationData.startTime).toLocaleTimeString();
      parts.push(`Started at ${startTime}`);
    }
    
    if (evacuationData.duration > 0) {
      const minutes = Math.floor(evacuationData.duration / 60);
      const seconds = evacuationData.duration % 60;
      parts.push(`Duration: ${minutes}:${String(seconds).padStart(2, '0')}`);
    }
    
    parts.push(`Total guests: ${evacuationData.guestCount}, Staff: ${evacuationData.staffCount}`);
    parts.push(`Evacuated: ${evacuationData.evacuatedCount}, Remaining: ${evacuationData.remainingCount}`);
    
    if (evacuationData.evacuationLog?.length > 0) {
      const recentActions = evacuationData.evacuationLog.slice(-3).map((log: any) => log.content).join(', ');
      parts.push(`Recent actions: ${recentActions}`);
    }
    
    return parts.join('. ') + '.';
  }

  private determineMedicalSeverity(medicalData: any): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    // Determine severity based on medical assessment
    if (medicalData.breathing === 'none' || medicalData.consciousness === 'no') {
      return 'CRITICAL';
    }
    
    const criticalSymptoms = ['chest-pain', 'bleeding', 'seizure'];
    const hasCriticalSymptoms = medicalData.symptoms?.some((symptom: string) => 
      criticalSymptoms.includes(symptom)
    );
    
    if (hasCriticalSymptoms || medicalData.breathing === 'difficulty') {
      return 'HIGH';
    }
    
    if (medicalData.symptoms?.length > 0) {
      return 'MEDIUM';
    }
    
    return 'LOW';
  }

  private generateMedicalDescription(medicalData: any): string {
    const parts = [];
    
    if (medicalData.patientLocation) {
      parts.push(`Location: ${medicalData.patientLocation}`);
    }
    
    if (medicalData.consciousness) {
      parts.push(`Patient consciousness: ${medicalData.consciousness === 'yes' ? 'Responsive' : 'Unresponsive'}`);
    }
    
    if (medicalData.breathing) {
      parts.push(`Breathing: ${medicalData.breathing}`);
    }
    
    if (medicalData.symptoms?.length > 0) {
      parts.push(`Symptoms: ${medicalData.symptoms.join(', ')}`);
    }
    
    if (medicalData.actionsCompleted?.length > 0) {
      parts.push(`Actions taken: ${medicalData.actionsCompleted.join(', ')}`);
    }
    
    if (medicalData.duration) {
      parts.push(`Response duration: ${Math.floor(medicalData.duration/60)}:${String(medicalData.duration%60).padStart(2,'0')}`);
    }
    
    return parts.join('. ') + '.';
  }

  public getAllIncidents(): IncidentLog[] {
    return [...this.incidents];
  }

  public getIncidentsByModule(module: string): IncidentLog[] {
    return this.incidents.filter(incident => incident.module === module);
  }

  public getIncidentsByType(type: string): IncidentLog[] {
    return this.incidents.filter(incident => incident.type === type);
  }

  public getIncidentsBySeverity(severity: string): IncidentLog[] {
    return this.incidents.filter(incident => incident.severity === severity);
  }

  public getActiveIncidents(): IncidentLog[] {
    return this.incidents.filter(incident => incident.status === 'active');
  }

  public updateIncidentStatus(id: string, status: IncidentLog['status']): boolean {
    const incident = this.incidents.find(inc => inc.id === id);
    if (incident) {
      incident.status = status;
      if (status === 'resolved') {
        incident.resolutionTime = new Date().toISOString();
      }
      this.saveIncidents();
      return true;
    }
    return false;
  }

  public addEvidence(id: string, evidence: string): boolean {
    const incident = this.incidents.find(inc => inc.id === id);
    if (incident) {
      if (!incident.evidence) {
        incident.evidence = [];
      }
      incident.evidence.push(evidence);
      this.saveIncidents();
      return true;
    }
    return false;
  }

  public addWitness(id: string, witness: string): boolean {
    const incident = this.incidents.find(inc => inc.id === id);
    if (incident) {
      if (!incident.witnesses) {
        incident.witnesses = [];
      }
      incident.witnesses.push(witness);
      this.saveIncidents();
      return true;
    }
    return false;
  }

  // Event listeners for real-time updates
  private listeners: ((incident: IncidentLog) => void)[] = [];

  public addListener(callback: (incident: IncidentLog) => void): void {
    this.listeners.push(callback);
  }

  public removeListener(callback: (incident: IncidentLog) => void): void {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  private notifyListeners(incident: IncidentLog): void {
    this.listeners.forEach(listener => {
      try {
        listener(incident);
      } catch (error) {
        console.error('Error in incident listener:', error);
      }
    });
  }

  // Analytics methods
  public getIncidentStats() {
    const total = this.incidents.length;
    const active = this.incidents.filter(i => i.status === 'active').length;
    const resolved = this.incidents.filter(i => i.status === 'resolved').length;
    const investigating = this.incidents.filter(i => i.status === 'investigating').length;
    
    const severityBreakdown = {
      CRITICAL: this.incidents.filter(i => i.severity === 'CRITICAL').length,
      HIGH: this.incidents.filter(i => i.severity === 'HIGH').length,
      MEDIUM: this.incidents.filter(i => i.severity === 'MEDIUM').length,
      LOW: this.incidents.filter(i => i.severity === 'LOW').length
    };

    const typeBreakdown = this.incidents.reduce((acc, incident) => {
      acc[incident.type] = (acc[incident.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      active,
      resolved,
      investigating,
      severityBreakdown,
      typeBreakdown
    };
  }

  public getRecentIncidents(limit: number = 10): IncidentLog[] {
    return this.incidents.slice(0, limit);
  }

  public searchIncidents(query: string): IncidentLog[] {
    const lowerQuery = query.toLowerCase();
    return this.incidents.filter(incident => 
      incident.title.toLowerCase().includes(lowerQuery) ||
      incident.description.toLowerCase().includes(lowerQuery) ||
      incident.location.toLowerCase().includes(lowerQuery) ||
      incident.type.toLowerCase().includes(lowerQuery)
    );
  }
}

export default IncidentLogService; 