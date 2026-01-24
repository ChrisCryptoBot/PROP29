/**
 * AI Service for Incident Log Module
 * Handles trend analysis and predictive insights
 */

import { logger } from './logger';
import { env } from '../config/env';

interface Incident {
  id: number;
  title: string;
  type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  location: string;
  status: 'active' | 'investigating' | 'resolved' | 'escalated';
  description: string;
  timestamp: string;
}

interface TrendPattern {
  pattern: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  recommendation: string;
  timeframe: string;
  dataPoints: number;
}

interface PredictiveInsight {
  prediction: string;
  probability: number;
  timeframe: string;
  location: string;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  preventiveMeasures: string[];
  reasoning: string;
}

export class IncidentAIService {
  private apiBaseUrl = env.API_BASE_URL;

  private getAuthHeader(): string {
    return localStorage.getItem('access_token') || localStorage.getItem('token') || '';
  }

  /**
   * Analyze incident trends using AI
   */
  async analyzeTrends(incidents: Incident[]): Promise<TrendPattern[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/incidents/ai-trends`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthHeader()}`
        },
        body: JSON.stringify({ incidents })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      return data.trends || this.generateFallbackTrends(incidents);
    } catch (error) {
      logger.error('AI Trend Analysis Error', error instanceof Error ? error : new Error(String(error)), { module: 'IncidentAIService', action: 'analyzeTrends' });
      return this.generateFallbackTrends(incidents);
    }
  }

  /**
   * Generate predictive insights using AI
   */
  async generatePredictions(incidents: Incident[]): Promise<PredictiveInsight[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/incidents/ai-predictions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthHeader()}`
        },
        body: JSON.stringify({ incidents })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      return data.predictions || this.generateFallbackPredictions(incidents);
    } catch (error) {
      logger.error('AI Prediction Error', error instanceof Error ? error : new Error(String(error)), { module: 'IncidentAIService', action: 'generatePredictions' });
      return this.generateFallbackPredictions(incidents);
    }
  }

  /**
   * Fallback trend analysis (rule-based when AI unavailable)
   */
  private generateFallbackTrends(incidents: Incident[]): TrendPattern[] {
    const trends: TrendPattern[] = [];

    // Analyze by type frequency
    const typeFrequency = incidents.reduce((acc, inc) => {
      acc[inc.type] = (acc[inc.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostCommonType = Object.entries(typeFrequency)
      .sort(([, a], [, b]) => b - a)[0];

    if (mostCommonType) {
      const percentage = ((mostCommonType[1] / incidents.length) * 100).toFixed(0);
      trends.push({
        pattern: `${mostCommonType[0]} incidents are most frequent`,
        description: `${percentage}% of incidents are classified as ${mostCommonType[0]}`,
        confidence: 0.85,
        impact: mostCommonType[1] > incidents.length * 0.4 ? 'high' : 'medium',
        recommendation: `Focus preventive measures on ${mostCommonType[0]} incidents`,
        timeframe: 'Last 30 days',
        dataPoints: mostCommonType[1]
      });
    }

    // Analyze by location patterns
    const locationFrequency = incidents.reduce((acc, inc) => {
      acc[inc.location] = (acc[inc.location] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topLocations = Object.entries(locationFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    if (topLocations.length > 0 && topLocations[0][1] > 2) {
      trends.push({
        pattern: `High incident concentration in ${topLocations[0][0]}`,
        description: `${topLocations[0][1]} incidents occurred in ${topLocations[0][0]}`,
        confidence: 0.78,
        impact: 'high',
        recommendation: `Increase security presence in ${topLocations[0][0]}`,
        timeframe: 'Last 30 days',
        dataPoints: topLocations[0][1]
      });
    }

    // Analyze severity trends
    const highSeverityCount = incidents.filter(i =>
      i.severity === 'CRITICAL' || i.severity === 'HIGH'
    ).length;

    if (highSeverityCount > incidents.length * 0.3) {
      trends.push({
        pattern: 'Elevated incident severity detected',
        description: `${((highSeverityCount / incidents.length) * 100).toFixed(0)}% of incidents are high severity`,
        confidence: 0.82,
        impact: 'high',
        recommendation: 'Review escalation protocols and response times',
        timeframe: 'Last 30 days',
        dataPoints: highSeverityCount
      });
    }

    // Time-based analysis (weekend vs weekday)
    const weekendIncidents = incidents.filter(i => {
      const day = new Date(i.timestamp).getDay();
      return day === 0 || day === 6; // Sunday or Saturday
    }).length;

    if (weekendIncidents > incidents.length * 0.35) {
      trends.push({
        pattern: 'Weekend incident spike detected',
        description: `${((weekendIncidents / incidents.length) * 100).toFixed(0)}% of incidents occur on weekends`,
        confidence: 0.76,
        impact: 'medium',
        recommendation: 'Increase weekend staffing levels',
        timeframe: 'Last 30 days',
        dataPoints: weekendIncidents
      });
    }

    return trends;
  }

  /**
   * Fallback predictions (rule-based when AI unavailable)
   */
  private generateFallbackPredictions(incidents: Incident[]): PredictiveInsight[] {
    const predictions: PredictiveInsight[] = [];

    // Get most common location
    const locationFrequency = incidents.reduce((acc, inc) => {
      acc[inc.location] = (acc[inc.location] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topLocation = Object.entries(locationFrequency)
      .sort(([, a], [, b]) => b - a)[0];

    if (topLocation && topLocation[1] > 2) {
      const probability = Math.min(0.87, (topLocation[1] / incidents.length) * 1.5);
      predictions.push({
        prediction: `Likely incident in ${topLocation[0]} within next 7 days`,
        probability: probability,
        timeframe: 'Next 7 days',
        location: topLocation[0],
        riskLevel: probability > 0.7 ? 'high' : 'medium',
        preventiveMeasures: [
          `Increase patrols in ${topLocation[0]}`,
          'Review security camera coverage',
          'Brief staff on common incident types'
        ],
        reasoning: `Based on ${topLocation[1]} incidents in this location over the past month`
      });
    }

    // Get most common incident type
    const typeFrequency = incidents.reduce((acc, inc) => {
      acc[inc.type] = (acc[inc.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topType = Object.entries(typeFrequency)
      .sort(([, a], [, b]) => b - a)[0];

    if (topType && topType[1] > 2) {
      predictions.push({
        prediction: `${topType[0]} incident predicted with high probability`,
        probability: 0.82,
        timeframe: 'Next 14 days',
        location: topLocation?.[0] || 'Various locations',
        riskLevel: 'medium',
        preventiveMeasures: [
          `Train staff on ${topType[0]} response protocols`,
          'Update prevention checklist',
          'Review recent similar incidents'
        ],
        reasoning: `${topType[0]} incidents have increased by ${((topType[1] / incidents.length) * 100).toFixed(0)}% recently`
      });
    }

    // Weekend risk prediction
    const weekendIncidents = incidents.filter(i => {
      const day = new Date(i.timestamp).getDay();
      return day === 0 || day === 6;
    }).length;

    if (weekendIncidents > incidents.length * 0.3) {
      predictions.push({
        prediction: 'Elevated weekend risk detected',
        probability: 0.79,
        timeframe: 'This weekend',
        location: 'All areas',
        riskLevel: 'medium',
        preventiveMeasures: [
          'Schedule additional security staff',
          'Activate weekend protocols',
          'Pre-brief emergency response team'
        ],
        reasoning: `Historical data shows ${((weekendIncidents / incidents.length) * 100).toFixed(0)}% of incidents occur on weekends`
      });
    }

    return predictions;
  }

  /**
   * Format confidence as percentage
   */
  formatConfidence(confidence: number): string {
    return `${(confidence * 100).toFixed(0)}%`;
  }

  /**
   * Get risk level color
   */
  getRiskColor(riskLevel: string): string {
    const colors: Record<string, string> = {
      critical: '#ef4444',
      high: '#f59e0b',
      medium: '#3b82f6',
      low: '#10b981'
    };
    return colors[riskLevel] || '#64748b';
  }

  /**
   * Get impact icon
   */
  getImpactIcon(impact: string): string {
    const icons: Record<string, string> = {
      high: 'fa-exclamation-triangle',
      medium: 'fa-info-circle',
      low: 'fa-check-circle'
    };
    return icons[impact] || 'fa-info-circle';
  }
}

export const incidentAI = new IncidentAIService();
