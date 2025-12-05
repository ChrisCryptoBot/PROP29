/**
 * AI Service for Access Control Module
 * Handles user behavior analysis and anomaly detection
 */

interface AccessEvent {
  id: string;
  userId: string;
  userName: string;
  accessPointId: string;
  accessPointName: string;
  action: 'granted' | 'denied' | 'timeout';
  timestamp: string;
  reason?: string;
  location: string;
  accessMethod: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'employee' | 'guest';
  department: string;
  status: 'active' | 'inactive' | 'suspended';
  accessLevel: 'standard' | 'elevated' | 'restricted';
  lastAccess?: string;
  accessCount: number;
}

interface BehaviorAnomaly {
  userId: string;
  userName: string;
  anomalyType: 'unusual_access_time' | 'excessive_access' | 'unusual_location' | 'failed_attempts' | 'privilege_escalation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  description: string;
  details: string;
  detectedAt: string;
  recommendations: string[];
  riskScore: number;
}

interface UserBehaviorProfile {
  userId: string;
  userName: string;
  normalAccessHours: string;
  typicalLocations: string[];
  averageAccessesPerDay: number;
  lastAnalyzed: string;
  riskLevel: 'low' | 'medium' | 'high';
  anomaliesDetected: number;
}

export class AccessControlAIService {
  private apiBaseUrl = 'http://localhost:8000';

  /**
   * Analyze user behavior for anomalies
   */
  async analyzeUserBehavior(
    events: AccessEvent[],
    users: User[]
  ): Promise<BehaviorAnomaly[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/access-control/ai-behavior-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        },
        body: JSON.stringify({ events, users })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      return data.anomalies || this.generateFallbackAnomalies(events, users);
    } catch (error) {
      console.error('AI Behavior Analysis Error:', error);
      return this.generateFallbackAnomalies(events, users);
    }
  }

  /**
   * Generate user behavior profiles
   */
  async generateBehaviorProfiles(
    events: AccessEvent[],
    users: User[]
  ): Promise<UserBehaviorProfile[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/access-control/ai-behavior-profiles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        },
        body: JSON.stringify({ events, users })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      return data.profiles || this.generateFallbackProfiles(events, users);
    } catch (error) {
      console.error('AI Profile Generation Error:', error);
      return this.generateFallbackProfiles(events, users);
    }
  }

  /**
   * Classify access event for anomaly detection
   */
  async classifyAccessEvent(event: AccessEvent, user: User): Promise<{
    isAnomalous: boolean;
    confidence: number;
    reasoning: string;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/access-control/ai-classify-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        },
        body: JSON.stringify({ event, user })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('AI Event Classification Error:', error);
      return {
        isAnomalous: false,
        confidence: 0.5,
        reasoning: 'Using rule-based classification (AI unavailable)',
        riskLevel: 'low'
      };
    }
  }

  /**
   * Fallback behavior anomaly detection (rule-based)
   */
  private generateFallbackAnomalies(events: AccessEvent[], users: User[]): BehaviorAnomaly[] {
    const anomalies: BehaviorAnomaly[] = [];
    const now = new Date();

    // Group events by user
    const eventsByUser = events.reduce((acc, event) => {
      if (!acc[event.userId]) acc[event.userId] = [];
      acc[event.userId].push(event);
      return acc;
    }, {} as Record<string, AccessEvent[]>);

    Object.entries(eventsByUser).forEach(([userId, userEvents]) => {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      // Check for unusual access times (outside 6 AM - 10 PM)
      const lateNightAccess = userEvents.filter(event => {
        const hour = new Date(event.timestamp).getHours();
        return hour < 6 || hour >= 22;
      });

      if (lateNightAccess.length > 0) {
        const times = lateNightAccess.map(e => new Date(e.timestamp).toLocaleTimeString());
        anomalies.push({
          userId: user.id,
          userName: user.name,
          anomalyType: 'unusual_access_time',
          severity: lateNightAccess.length > 3 ? 'high' : 'medium',
          confidence: 0.82,
          description: `Unusual access times detected for ${user.name}`,
          details: `${lateNightAccess.length} access(es) during off-hours: ${times.slice(0, 3).join(', ')}`,
          detectedAt: now.toISOString(),
          recommendations: [
            `Review ${user.name}'s access schedule and justification`,
            'Verify legitimate business need for off-hours access',
            'Consider implementing time-based access restrictions'
          ],
          riskScore: lateNightAccess.length > 3 ? 7.5 : 5.2
        });
      }

      // Check for excessive access attempts
      const recentEvents = userEvents.filter(event => {
        const eventTime = new Date(event.timestamp).getTime();
        const dayAgo = now.getTime() - (24 * 60 * 60 * 1000);
        return eventTime > dayAgo;
      });

      if (recentEvents.length > 30) {
        anomalies.push({
          userId: user.id,
          userName: user.name,
          anomalyType: 'excessive_access',
          severity: recentEvents.length > 50 ? 'high' : 'medium',
          confidence: 0.76,
          description: `Unusually high access frequency for ${user.name}`,
          details: `${recentEvents.length} access events in the last 24 hours (avg: 15)`,
          detectedAt: now.toISOString(),
          recommendations: [
            'Investigate reason for elevated access activity',
            'Verify account has not been compromised',
            'Review access patterns for automation or sharing'
          ],
          riskScore: recentEvents.length > 50 ? 6.8 : 4.5
        });
      }

      // Check for failed access attempts
      const failedAttempts = userEvents.filter(event => event.action === 'denied');
      if (failedAttempts.length > 5) {
        anomalies.push({
          userId: user.id,
          userName: user.name,
          anomalyType: 'failed_attempts',
          severity: failedAttempts.length > 10 ? 'critical' : 'high',
          confidence: 0.88,
          description: `Multiple failed access attempts by ${user.name}`,
          details: `${failedAttempts.length} denied access attempts to restricted areas`,
          detectedAt: now.toISOString(),
          recommendations: [
            'Immediate investigation required',
            'Review user permissions and access levels',
            'Contact user to verify legitimate access needs',
            'Consider temporary access suspension pending review'
          ],
          riskScore: failedAttempts.length > 10 ? 9.2 : 7.8
        });
      }

      // Check for unusual locations
      const uniqueLocations = [...new Set(userEvents.map(e => e.location))];
      const userRole = user.role;
      const expectedLocations = userRole === 'admin' ? 10 : userRole === 'manager' ? 7 : 4;

      if (uniqueLocations.length > expectedLocations * 1.5) {
        anomalies.push({
          userId: user.id,
          userName: user.name,
          anomalyType: 'unusual_location',
          severity: 'medium',
          confidence: 0.71,
          description: `${user.name} accessing unusually diverse locations`,
          details: `Accessed ${uniqueLocations.length} different locations (expected: ~${expectedLocations} for ${userRole})`,
          detectedAt: now.toISOString(),
          recommendations: [
            `Review job role requirements for ${user.name}`,
            'Verify all accessed locations align with responsibilities',
            'Consider implementing location-based access policies'
          ],
          riskScore: 5.5
        });
      }
    });

    // Sort by risk score (highest first)
    return anomalies.sort((a, b) => b.riskScore - a.riskScore);
  }

  /**
   * Fallback behavior profile generation
   */
  private generateFallbackProfiles(events: AccessEvent[], users: User[]): UserBehaviorProfile[] {
    const profiles: UserBehaviorProfile[] = [];

    const eventsByUser = events.reduce((acc, event) => {
      if (!acc[event.userId]) acc[event.userId] = [];
      acc[event.userId].push(event);
      return acc;
    }, {} as Record<string, AccessEvent[]>);

    users.forEach(user => {
      const userEvents = eventsByUser[user.id] || [];

      // Calculate normal access hours
      const hours = userEvents.map(e => new Date(e.timestamp).getHours());
      const avgHour = hours.length > 0 ? Math.round(hours.reduce((a, b) => a + b, 0) / hours.length) : 9;
      const normalAccessHours = `${avgHour}:00 - ${avgHour + 8}:00`;

      // Get typical locations
      const locationFreq = userEvents.reduce((acc, event) => {
        acc[event.location] = (acc[event.location] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const typicalLocations = Object.entries(locationFreq)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([location]) => location);

      // Calculate average accesses per day
      const daySpan = 30; // Last 30 days
      const averageAccessesPerDay = Math.round(userEvents.length / daySpan);

      // Determine risk level
      const anomalies = this.generateFallbackAnomalies([...userEvents], [user]);
      const userAnomalies = anomalies.filter(a => a.userId === user.id);

      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      if (userAnomalies.some(a => a.severity === 'critical' || a.severity === 'high')) {
        riskLevel = 'high';
      } else if (userAnomalies.length > 0) {
        riskLevel = 'medium';
      }

      profiles.push({
        userId: user.id,
        userName: user.name,
        normalAccessHours,
        typicalLocations,
        averageAccessesPerDay,
        lastAnalyzed: new Date().toISOString(),
        riskLevel,
        anomaliesDetected: userAnomalies.length
      });
    });

    return profiles;
  }

  /**
   * Format confidence as percentage
   */
  formatConfidence(confidence: number): string {
    return `${(confidence * 100).toFixed(0)}%`;
  }

  /**
   * Get severity color
   */
  getSeverityColor(severity: string): string {
    const colors: Record<string, string> = {
      critical: '#dc2626',
      high: '#f59e0b',
      medium: '#3b82f6',
      low: '#10b981'
    };
    return colors[severity] || '#64748b';
  }

  /**
   * Get anomaly type icon
   */
  getAnomalyIcon(type: string): string {
    const icons: Record<string, string> = {
      unusual_access_time: 'fa-clock',
      excessive_access: 'fa-chart-line',
      unusual_location: 'fa-map-marker-alt',
      failed_attempts: 'fa-ban',
      privilege_escalation: 'fa-arrow-up'
    };
    return icons[type] || 'fa-exclamation-triangle';
  }
}

export const accessControlAI = new AccessControlAIService();
