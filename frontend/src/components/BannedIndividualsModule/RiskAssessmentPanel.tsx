import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../UI/Card';
import { Button } from '../UI/Button';
import { showLoading, dismissLoadingAndShowSuccess, showError } from '../../utils/toast';
import { bannedIndividualsAI } from '../../services/BannedIndividualsAIService';
import { logger } from '../../services/logger';
import '../../styles/modern-glass.css';

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

interface Props {
  individual: Partial<BannedIndividual>;
  allIndividuals: BannedIndividual[];
}

export const RiskAssessmentPanel: React.FC<Props> = ({ individual, allIndividuals }) => {
  const [assessment, setAssessment] = useState<RiskAssessment | null>(null);
  const [isAssessing, setIsAssessing] = useState(false);

  const handleAssessRisk = async () => {
    if (!individual.firstName || !individual.lastName) {
      showError('Please provide at least name information for risk assessment');
      return;
    }

    const toastId = showLoading('Assessing risk with AI...');
    setIsAssessing(true);

    try {
      const riskAssessment = await bannedIndividualsAI.assessRisk(individual, allIndividuals);
      setAssessment(riskAssessment);
      dismissLoadingAndShowSuccess(toastId, 'Risk assessment complete!');
    } catch (error) {
      logger.error('Risk assessment error', error instanceof Error ? error : new Error(String(error)), { module: 'RiskAssessmentPanel', action: 'handleAssessRisk' });
      showError('Failed to assess risk');
    } finally {
      setIsAssessing(false);
    }
  };

  const getImpactColor = (impact: string): string => {
    const colors: Record<string, string> = {
      high: 'text-red-600',
      medium: 'text-orange-600',
      low: 'text-yellow-600'
    };
    return colors[impact] || 'text-slate-600';
  };

  const getImpactIcon = (impact: string): string => {
    const icons: Record<string, string> = {
      high: 'fa-exclamation-triangle',
      medium: 'fa-exclamation-circle',
      low: 'fa-info-circle'
    };
    return icons[impact] || 'fa-info';
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Header Section */}
      <div className="glass-card spacing-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-md">
            <div className="duotone-overlay duotone-danger">
              <i className="fas fa-shield-virus"></i>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900">AI Risk Assessment</h3>
              <p className="text-sm text-slate-600 mt-1">
                Analyze risk factors and get AI-powered recommendations
              </p>
            </div>
          </div>
          <Button
            onClick={handleAssessRisk}
            disabled={isAssessing || !individual.firstName}
            className="btn-gradient-primary"
          >
            <i className={`fas ${isAssessing ? 'fa-spinner fa-spin' : 'fa-brain'} mr-2`}></i>
            {isAssessing ? 'Assessing...' : 'Assess Risk'}
          </Button>
        </div>
      </div>

      {/* Assessment Results */}
      {assessment && (
        <div className="space-y-4">
          {/* Overall Risk Score */}
          <div className="ai-feature-card fade-in">
            <div className="flex items-start gap-4">
              <div
                className="duotone-overlay duotone-danger"
                style={{ width: '64px', height: '64px', flexShrink: 0 }}
              >
                <i className="fas fa-shield-alt" style={{ fontSize: '28px' }}></i>
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-xl font-semibold text-slate-900 mb-1">
                      Risk Level: {assessment.riskLevel}
                    </h4>
                    <span
                      className="px-2.5 py-1 text-xs font-semibold rounded"
                      style={{
                        backgroundColor: bannedIndividualsAI.getRiskColor(assessment.riskLevel) + '20',
                        color: bannedIndividualsAI.getRiskColor(assessment.riskLevel)
                      }}
                    >
                      {assessment.riskLevel} RISK
                    </span>
                  </div>
                  <div className="text-right">
                    <div
                      className="text-3xl font-bold"
                      style={{ color: bannedIndividualsAI.getRiskColor(assessment.riskLevel) }}
                    >
                      {assessment.riskScore}
                    </div>
                    <div className="text-xs text-slate-600">Risk Score</div>
                    <div className="text-xs text-slate-500 mt-1">
                      {bannedIndividualsAI.formatConfidence(assessment.confidence)} confidence
                    </div>
                  </div>
                </div>

                {/* Similar Cases */}
                {assessment.similarCases > 0 && (
                  <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded mb-3">
                    <p className="text-sm text-amber-800">
                      <i className="fas fa-exclamation-triangle mr-2"></i>
                      Found {assessment.similarCases} similar case(s) in database. Review for potential duplicates.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Risk Factors */}
          <div className="ai-feature-card fade-in">
            <h4 className="text-lg font-semibold text-slate-900 mb-4">
              <i className="fas fa-list-ul mr-2"></i>
              Risk Factors
            </h4>
            <div className="space-y-3">
              {assessment.factors.map((factor, index) => (
                <div key={index} className="bg-white/50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <i className={`fas ${getImpactIcon(factor.impact)} ${getImpactColor(factor.impact)}`}></i>
                      <h5 className="font-semibold text-slate-900">{factor.factor}</h5>
                      <span
                        className="px-2 py-0.5 text-xs font-semibold rounded"
                        style={{
                          backgroundColor: getImpactColor(factor.impact).replace('text-', 'bg-').replace('-600', '-100'),
                          color: getImpactColor(factor.impact).replace('text-', 'text-')
                        }}
                      >
                        {factor.impact.toUpperCase()} IMPACT
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-slate-600">
                      {(factor.weight * 100).toFixed(0)}% weight
                    </span>
                  </div>
                  <p className="text-sm text-slate-700">{factor.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="ai-feature-card fade-in">
            <h4 className="text-lg font-semibold text-slate-900 mb-4">
              <i className="fas fa-lightbulb mr-2 text-yellow-600"></i>
              AI Recommendations
            </h4>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <ul className="space-y-2">
                {assessment.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <i className="fas fa-check-circle text-blue-600 mt-0.5"></i>
                    <span className="text-sm text-blue-800">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button className="btn-glass text-sm">
              <i className="fas fa-save mr-2"></i>
              Save Assessment
            </Button>
            <Button className="btn-glass text-sm">
              <i className="fas fa-share mr-2"></i>
              Share Report
            </Button>
            <Button className="btn-glass text-sm">
              <i className="fas fa-print mr-2"></i>
              Print
            </Button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!assessment && !isAssessing && (
        <div className="glass-card spacing-2xl text-center">
          <div className="duotone-overlay duotone-danger mx-auto mb-4" style={{ width: '64px', height: '64px' }}>
            <i className="fas fa-shield-virus" style={{ fontSize: '32px' }}></i>
          </div>
          <h4 className="text-lg font-semibold text-slate-900 mb-2">No Risk Assessment Yet</h4>
          <p className="text-slate-600 mb-4">
            Click "Assess Risk" to get AI-powered risk analysis and recommendations
          </p>
        </div>
      )}
    </div>
  );
};


