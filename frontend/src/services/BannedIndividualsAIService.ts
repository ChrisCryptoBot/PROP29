/**
 * AI Service for Banned Individuals Module
 * Handles risk assessment, pattern detection, and automated recommendations
 */

interface BannedIndividual {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  reason: string;
  banType: 'TEMPORARY' | 'PERMANENT' | 'CONDITIONAL';
  banStartDate: string;
  banEndDate?: string;
  identificationNumber: string;
  identificationType: string;
  photoUrl?: string;
  notes: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REMOVED';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  bannedBy: string;
  createdAt: string;
  updatedAt: string;
  detectionCount: number;
  lastDetection?: string;
}

interface RiskAssessment {
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  factors: RiskFactor[];
  recommendations: string[];
  similarCases: number;
  patternMatches: string[];
}

interface RiskFactor {
  factor: string;
  impact: 'low' | 'medium' | 'high';
  description: string;
  weight: number;
}

interface PatternDetection {
  pattern: string;
  description: string;
  confidence: number;
  affectedIndividuals: number;
  timeframe: string;
  recommendations: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface BanRecommendation {
  recommendation: string;
  confidence: number;
  reasoning: string;
  suggestedBanType: 'TEMPORARY' | 'PERMANENT' | 'CONDITIONAL';
  suggestedRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  similarCases: number;
}

export class BannedIndividualsAIService {
  private apiBaseUrl = 'http://localhost:8000';

  /**
   * Assess risk level for a new or existing banned individual
   */
  async assessRisk(individual: Partial<BannedIndividual>, allIndividuals: BannedIndividual[]): Promise<RiskAssessment> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/banned-individuals/ai/assess-risk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        },
        body: JSON.stringify({ individual, allIndividuals })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      return data.assessment || this.generateFallbackRiskAssessment(individual, allIndividuals);
    } catch (error) {
      console.error('AI Risk Assessment Error:', error);
      return this.generateFallbackRiskAssessment(individual, allIndividuals);
    }
  }

  /**
   * Detect patterns across banned individuals
   */
  async detectPatterns(individuals: BannedIndividual[]): Promise<PatternDetection[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/banned-individuals/ai/detect-patterns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        },
        body: JSON.stringify({ individuals })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      return data.patterns || this.generateFallbackPatterns(individuals);
    } catch (error) {
      console.error('AI Pattern Detection Error:', error);
      return this.generateFallbackPatterns(individuals);
    }
  }

  /**
   * Generate ban recommendations based on incident data
   */
  async generateBanRecommendation(incidentData: any): Promise<BanRecommendation> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/banned-individuals/ai/recommend-ban`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        },
        body: JSON.stringify({ incidentData })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      return data.recommendation || this.generateFallbackRecommendation(incidentData);
    } catch (error) {
      console.error('AI Ban Recommendation Error:', error);
      return this.generateFallbackRecommendation(incidentData);
    }
  }

  /**
   * Fallback risk assessment (rule-based when AI unavailable)
   */
  private generateFallbackRiskAssessment(individual: Partial<BannedIndividual>, allIndividuals: BannedIndividual[]): RiskAssessment {
    const factors: RiskFactor[] = [];
    let riskScore = 0;

    // Analyze reason severity
    const reason = individual.reason?.toLowerCase() || '';
    if (reason.includes('violent') || reason.includes('assault') || reason.includes('threat')) {
      factors.push({
        factor: 'Violent Behavior',
        impact: 'high',
        description: 'History of violent or threatening behavior',
        weight: 0.3
      });
      riskScore += 30;
    } else if (reason.includes('fraud') || reason.includes('theft') || reason.includes('stolen')) {
      factors.push({
        factor: 'Financial Crime',
        impact: 'high',
        description: 'Involvement in financial crimes',
        weight: 0.25
      });
      riskScore += 25;
    } else if (reason.includes('aggressive') || reason.includes('disruptive')) {
      factors.push({
        factor: 'Disruptive Behavior',
        impact: 'medium',
        description: 'Disruptive or aggressive conduct',
        weight: 0.15
      });
      riskScore += 15;
    }

    // Check for repeat offenders
    const similarNames = allIndividuals.filter(i => 
      i.firstName.toLowerCase() === individual.firstName?.toLowerCase() ||
      i.lastName.toLowerCase() === individual.lastName?.toLowerCase() ||
      i.identificationNumber === individual.identificationNumber
    ).length;

    if (similarNames > 1) {
      factors.push({
        factor: 'Repeat Offender',
        impact: 'high',
        description: `Found ${similarNames} similar entries in database`,
        weight: 0.2
      });
      riskScore += 20;
    }

    // Analyze ban type
    if (individual.banType === 'PERMANENT') {
      factors.push({
        factor: 'Permanent Ban',
        impact: 'high',
        description: 'Permanent ban indicates serious offense',
        weight: 0.15
      });
      riskScore += 15;
    }

    // Determine risk level
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (riskScore >= 70) riskLevel = 'CRITICAL';
    else if (riskScore >= 50) riskLevel = 'HIGH';
    else if (riskScore >= 30) riskLevel = 'MEDIUM';

    const recommendations: string[] = [];
    if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH') {
      recommendations.push('Immediate security alert required');
      recommendations.push('Notify all access points');
      recommendations.push('Activate facial recognition monitoring');
    }
    if (similarNames > 1) {
      recommendations.push('Review for potential duplicate entries');
    }
    if (individual.banType === 'TEMPORARY' && riskScore > 50) {
      recommendations.push('Consider upgrading to permanent ban');
    }

    return {
      riskScore: Math.min(100, riskScore),
      riskLevel,
      confidence: 0.82,
      factors,
      recommendations,
      similarCases: similarNames,
      patternMatches: []
    };
  }

  /**
   * Fallback pattern detection (rule-based when AI unavailable)
   */
  private generateFallbackPatterns(individuals: BannedIndividual[]): PatternDetection[] {
    const patterns: PatternDetection[] = [];

    // Pattern 1: Nationality clustering
    const nationalityCount = individuals.reduce((acc, ind) => {
      acc[ind.nationality] = (acc[ind.nationality] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topNationality = Object.entries(nationalityCount)
      .sort(([, a], [, b]) => b - a)[0];

    if (topNationality && topNationality[1] > individuals.length * 0.3) {
      patterns.push({
        pattern: 'Nationality Clustering',
        description: `${topNationality[1]} individuals (${((topNationality[1] / individuals.length) * 100).toFixed(0)}%) share nationality: ${topNationality[0]}`,
        confidence: 0.75,
        affectedIndividuals: topNationality[1],
        timeframe: 'All time',
        recommendations: [
          'Review entry procedures for this nationality',
          'Check for potential discrimination bias',
          'Investigate if this is a legitimate pattern'
        ],
        severity: 'medium'
      });
    }

    // Pattern 2: Ban type distribution
    const banTypeCount = individuals.reduce((acc, ind) => {
      acc[ind.banType] = (acc[ind.banType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const permanentBans = banTypeCount['PERMANENT'] || 0;
    if (permanentBans > individuals.length * 0.5) {
      patterns.push({
        pattern: 'High Permanent Ban Rate',
        description: `${((permanentBans / individuals.length) * 100).toFixed(0)}% of bans are permanent`,
        confidence: 0.8,
        affectedIndividuals: permanentBans,
        timeframe: 'All time',
        recommendations: [
          'Review ban escalation policies',
          'Ensure temporary bans are being used appropriately',
          'Consider rehabilitation programs for repeat offenders'
        ],
        severity: 'high'
      });
    }

    // Pattern 3: Recent activity spike
    const recentBans = individuals.filter(ind => {
      const banDate = new Date(ind.banStartDate);
      const daysAgo = (Date.now() - banDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo <= 30;
    }).length;

    if (recentBans > individuals.length * 0.4) {
      patterns.push({
        pattern: 'Recent Activity Spike',
        description: `${((recentBans / individuals.length) * 100).toFixed(0)}% of bans occurred in the last 30 days`,
        confidence: 0.85,
        affectedIndividuals: recentBans,
        timeframe: 'Last 30 days',
        recommendations: [
          'Investigate root causes of recent increase',
          'Review security protocols and training',
          'Consider additional security measures'
        ],
        severity: 'high'
      });
    }

    // Pattern 4: Risk level distribution
    const highRiskCount = individuals.filter(ind => 
      ind.riskLevel === 'HIGH' || ind.riskLevel === 'CRITICAL'
    ).length;

    if (highRiskCount > individuals.length * 0.4) {
      patterns.push({
        pattern: 'Elevated Risk Profile',
        description: `${((highRiskCount / individuals.length) * 100).toFixed(0)}% of banned individuals are high or critical risk`,
        confidence: 0.78,
        affectedIndividuals: highRiskCount,
        timeframe: 'All time',
        recommendations: [
          'Enhance monitoring for high-risk individuals',
          'Review security response protocols',
          'Consider additional access control measures'
        ],
        severity: 'high'
      });
    }

    return patterns;
  }

  /**
   * Fallback ban recommendation (rule-based when AI unavailable)
   */
  private generateFallbackRecommendation(incidentData: any): BanRecommendation {
    const severity = incidentData.severity?.toLowerCase() || 'medium';
    const incidentType = incidentData.type?.toLowerCase() || '';
    
    let suggestedBanType: 'TEMPORARY' | 'PERMANENT' | 'CONDITIONAL' = 'TEMPORARY';
    let suggestedRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM';
    let reasoning = '';

    if (severity === 'critical' || incidentType.includes('violent') || incidentType.includes('assault')) {
      suggestedBanType = 'PERMANENT';
      suggestedRiskLevel = 'CRITICAL';
      reasoning = 'Critical severity incident with potential for violence warrants permanent ban';
    } else if (severity === 'high' || incidentType.includes('theft') || incidentType.includes('fraud')) {
      suggestedBanType = 'PERMANENT';
      suggestedRiskLevel = 'HIGH';
      reasoning = 'High severity financial or property crime warrants permanent ban';
    } else if (severity === 'medium') {
      suggestedBanType = 'TEMPORARY';
      suggestedRiskLevel = 'MEDIUM';
      reasoning = 'Medium severity incident suggests temporary ban with review period';
    } else {
      suggestedBanType = 'CONDITIONAL';
      suggestedRiskLevel = 'LOW';
      reasoning = 'Lower severity incident may be resolved with conditional ban';
    }

    return {
      recommendation: `Recommend ${suggestedBanType} ban with ${suggestedRiskLevel} risk level`,
      confidence: 0.75,
      reasoning,
      suggestedBanType,
      suggestedRiskLevel,
      similarCases: 0
    };
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
      CRITICAL: '#dc2626',
      HIGH: '#ea580c',
      MEDIUM: '#f59e0b',
      LOW: '#10b981'
    };
    return colors[riskLevel] || '#64748b';
  }

  /**
   * Get severity color
   */
  getSeverityColor(severity: string): string {
    const colors: Record<string, string> = {
      critical: '#dc2626',
      high: '#ea580c',
      medium: '#f59e0b',
      low: '#10b981'
    };
    return colors[severity] || '#64748b';
  }
}

export const bannedIndividualsAI = new BannedIndividualsAIService();

