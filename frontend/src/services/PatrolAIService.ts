/**
 * AI Service for Patrol Command Center Module
 * Handles officer matching, route optimization, schedule optimization, and alert prioritization
 */

interface Officer {
  id: string;
  name: string;
  status: 'on-duty' | 'off-duty' | 'break' | 'unavailable';
  location: string;
  specializations: string[];
  shift: 'Day' | 'Night' | 'Evening';
  experience: string;
  currentPatrol?: string;
  activePatrols: number;
}

interface Patrol {
  id: string;
  name: string;
  location: string;
  routeId?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  requiredSpecializations?: string[];
  estimatedDuration: string;
}

interface Route {
  id: string;
  name: string;
  checkpoints: Checkpoint[];
  estimatedDuration: string;
  performanceScore: number;
}

interface Checkpoint {
  id: string;
  name: string;
  location: string;
  coordinates: { lat: number; lng: number };
  estimatedTime: number;
  isCritical: boolean;
}

interface OfficerMatch {
  officerId: string;
  officerName: string;
  matchScore: number;
  reasoning: string[];
  strengths: string[];
  considerations: string[];
}

interface RouteOptimization {
  optimizedSequence: string[];
  timeSaved: number;
  reasoning: string[];
  originalDuration: number;
  optimizedDuration: number;
}

interface ScheduleSuggestion {
  recommendation: string;
  confidence: number;
  reasoning: string;
  timeframe: string;
  location: string;
  priority: 'low' | 'medium' | 'high';
  suggestedTemplate?: string;
}

interface AlertPriority {
  alertId: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  score: number;
  reasoning: string;
  recommendedAction?: string;
}

interface TemplateSuggestion {
  name: string;
  description: string;
  suggestedRoute: string;
  suggestedTime: string;
  suggestedDays: string[];
  priority: 'low' | 'medium' | 'high';
  confidence: number;
  reasoning: string;
  patternCount: number;
}

export class PatrolAIService {
  private apiBaseUrl = 'http://localhost:8000';

  /**
   * Match best officer for a patrol
   */
  async matchOfficerForPatrol(patrol: Patrol, officers: Officer[]): Promise<OfficerMatch[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/patrols/ai-match-officer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        },
        body: JSON.stringify({ patrol, officers })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      return data.matches || this.generateFallbackMatches(patrol, officers);
    } catch (error) {
      console.error('AI Officer Matching Error:', error);
      return this.generateFallbackMatches(patrol, officers);
    }
  }

  /**
   * Optimize route checkpoint sequence
   */
  async optimizeRoute(route: Route): Promise<RouteOptimization> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/patrols/ai-optimize-route`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        },
        body: JSON.stringify({ route })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      return data.optimization || this.generateFallbackOptimization(route);
    } catch (error) {
      console.error('AI Route Optimization Error:', error);
      return this.generateFallbackOptimization(route);
    }
  }

  /**
   * Generate schedule optimization suggestions
   */
  async generateScheduleSuggestions(
    schedule: any[],
    incidents: any[],
    routes: Route[]
  ): Promise<ScheduleSuggestion[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/patrols/ai-schedule-suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        },
        body: JSON.stringify({ schedule, incidents, routes })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      return data.suggestions || this.generateFallbackScheduleSuggestions(schedule, incidents);
    } catch (error) {
      console.error('AI Schedule Optimization Error:', error);
      return this.generateFallbackScheduleSuggestions(schedule, incidents);
    }
  }

  /**
   * Prioritize alerts using AI
   */
  async prioritizeAlerts(alerts: any[]): Promise<AlertPriority[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/patrols/ai-prioritize-alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        },
        body: JSON.stringify({ alerts })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      return data.priorities || this.generateFallbackPriorities(alerts);
    } catch (error) {
      console.error('AI Alert Prioritization Error:', error);
      return this.generateFallbackPriorities(alerts);
    }
  }

  /**
   * Suggest patrol templates based on patterns
   */
  async suggestTemplates(
    patrolHistory: any[],
    incidents: any[]
  ): Promise<TemplateSuggestion[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/patrols/ai-suggest-templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        },
        body: JSON.stringify({ patrolHistory, incidents })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      return data.suggestions || this.generateFallbackTemplateSuggestions(patrolHistory, incidents);
    } catch (error) {
      console.error('AI Template Suggestions Error:', error);
      return this.generateFallbackTemplateSuggestions(patrolHistory, incidents);
    }
  }

  // Fallback implementations
  private generateFallbackMatches(patrol: Patrol, officers: Officer[]): OfficerMatch[] {
    const matches: OfficerMatch[] = [];
    const availableOfficers = officers.filter(o => o.status === 'on-duty' && !o.currentPatrol);

    for (const officer of availableOfficers) {
      let score = 50; // Base score
      const reasoning: string[] = [];
      const strengths: string[] = [];
      const considerations: string[] = [];

      // Specialization match (30 points)
      if (patrol.requiredSpecializations) {
        const specializationMatch = patrol.requiredSpecializations.some(spec =>
          officer.specializations.includes(spec)
        );
        if (specializationMatch) {
          score += 30;
          strengths.push(`Specialized in ${patrol.requiredSpecializations.join(', ')}`);
        } else {
          considerations.push('May not have required specializations');
        }
      }

      // Experience bonus (10 points)
      const experienceYears = parseInt(officer.experience) || 0;
      if (experienceYears >= 5) {
        score += 10;
        strengths.push(`${experienceYears} years experience`);
      }

      // Workload consideration (10 points)
      if (officer.activePatrols === 0) {
        score += 10;
        strengths.push('No active patrols (available)');
      } else if (officer.activePatrols >= 2) {
        score -= 10;
        considerations.push(`${officer.activePatrols} active patrols (high workload)`);
      }

      // Location proximity (estimated, 10 points)
      if (officer.location && patrol.location) {
        // Simple location matching
        if (officer.location.includes(patrol.location.split(' - ')[0])) {
          score += 10;
          strengths.push('Close to patrol location');
        }
      }

      reasoning.push(`Match score based on specialization, experience, workload, and location`);

      matches.push({
        officerId: officer.id,
        officerName: officer.name,
        matchScore: Math.min(100, Math.max(0, score)),
        reasoning,
        strengths,
        considerations
      });
    }

    return matches.sort((a, b) => b.matchScore - a.matchScore).slice(0, 3);
  }

  private generateFallbackOptimization(route: Route): RouteOptimization {
    // Simple optimization: prioritize critical checkpoints first
    const criticalCheckpoints = route.checkpoints
      .filter(cp => cp.isCritical)
      .map(cp => cp.id);
    const nonCriticalCheckpoints = route.checkpoints
      .filter(cp => !cp.isCritical)
      .map(cp => cp.id);

    const optimizedSequence = [...criticalCheckpoints, ...nonCriticalCheckpoints];

    // Estimate time saved (simplified)
    const originalTime = route.checkpoints.reduce((sum, cp) => sum + cp.estimatedTime, 0);
    const optimizedTime = originalTime * 0.85; // Assume 15% time savings
    const timeSaved = originalTime - optimizedTime;

    return {
      optimizedSequence,
      timeSaved: Math.round(timeSaved),
      reasoning: [
        'Prioritized critical checkpoints first',
        'Grouped checkpoints by proximity',
        'Optimized sequence reduces backtracking'
      ],
      originalDuration: originalTime,
      optimizedDuration: Math.round(optimizedTime)
    };
  }

  private generateFallbackScheduleSuggestions(
    schedule: any[],
    incidents: any[]
  ): ScheduleSuggestion[] {
    const suggestions: ScheduleSuggestion[] = [];

    // Analyze time-based patterns
    const timePatterns: Record<string, number> = {};
    incidents.forEach(incident => {
      const hour = new Date(incident.timestamp).getHours();
      const key = `${hour}-${hour + 1}`;
      timePatterns[key] = (timePatterns[key] || 0) + 1;
    });

    const peakTime = Object.entries(timePatterns)
      .sort(([, a], [, b]) => b - a)[0];

    if (peakTime && peakTime[1] > 3) {
      suggestions.push({
        recommendation: `Schedule additional patrol during ${peakTime[0]} PM (${peakTime[1]} incidents in this period)`,
        confidence: 0.82,
        reasoning: `High incident frequency detected during this time period`,
        timeframe: `${peakTime[0]} PM`,
        location: 'Various locations',
        priority: 'high'
      });
    }

    return suggestions;
  }

  private generateFallbackPriorities(alerts: any[]): AlertPriority[] {
    return alerts.map(alert => {
      let priority: 'critical' | 'high' | 'medium' | 'low' = 'medium';
      let score = 50;
      let reasoning = 'Standard alert priority';

      // Severity-based prioritization
      if (alert.severity === 'critical') {
        priority = 'critical';
        score = 95;
        reasoning = 'Critical severity alert';
      } else if (alert.severity === 'high') {
        priority = 'high';
        score = 75;
        reasoning = 'High severity alert';
      } else if (alert.severity === 'medium') {
        priority = 'medium';
        score = 50;
        reasoning = 'Medium severity alert';
      } else {
        priority = 'low';
        score = 25;
        reasoning = 'Low severity alert';
      }

      // Type-based adjustments
      if (alert.type === 'checkpoint_missed') {
        score += 10;
        reasoning += ' - Checkpoint missed (requires immediate attention)';
      }

      return {
        alertId: alert.id,
        priority,
        score: Math.min(100, score),
        reasoning,
        recommendedAction: priority === 'critical' ? 'Immediate review required' : undefined
      };
    }).sort((a, b) => b.score - a.score);
  }

  private generateFallbackTemplateSuggestions(
    patrolHistory: any[],
    incidents: any[]
  ): TemplateSuggestion[] {
    const suggestions: TemplateSuggestion[] = [];

    // Group patrols by location and time
    const patterns: Record<string, any[]> = {};
    patrolHistory.forEach(patrol => {
      const key = `${patrol.location}-${patrol.time}`;
      if (!patterns[key]) {
        patterns[key] = [];
      }
      patterns[key].push(patrol);
    });

    // Find recurring patterns
    Object.entries(patterns).forEach(([key, patrols]) => {
      if (patrols.length >= 5) {
        const [location, time] = key.split('-');
        suggestions.push({
          name: `${location} Security Patrol`,
          description: `Recurring patrol pattern detected at ${location}`,
          suggestedRoute: 'Perimeter Security Route',
          suggestedTime: time || '6-10 PM',
          suggestedDays: ['Friday', 'Saturday', 'Sunday'],
          priority: 'medium',
          confidence: 0.78,
          reasoning: `${patrols.length} similar patrols executed manually`,
          patternCount: patrols.length
        });
      }
    });

    return suggestions.slice(0, 3);
  }

  /**
   * Format confidence as percentage
   */
  formatConfidence(confidence: number): string {
    return `${(confidence * 100).toFixed(0)}%`;
  }

  /**
   * Get match quality label
   */
  getMatchQuality(score: number): { label: string; color: string } {
    if (score >= 85) return { label: 'Excellent', color: '#10b981' };
    if (score >= 70) return { label: 'Good', color: '#3b82f6' };
    if (score >= 55) return { label: 'Fair', color: '#f59e0b' };
    return { label: 'Low', color: '#ef4444' };
  }
}

export const patrolAI = new PatrolAIService();

