import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../UI/Card';
import { Button } from '../UI/Button';
import { showLoading, dismissLoadingAndShowSuccess, showError } from '../../utils/toast';
import { bannedIndividualsAI } from '../../services/BannedIndividualsAIService';
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

interface PatternDetection {
  pattern: string;
  description: string;
  confidence: number;
  affectedIndividuals: number;
  timeframe: string;
  recommendations: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface Props {
  individuals: BannedIndividual[];
}

export const PatternDetectionPanel: React.FC<Props> = ({ individuals }) => {
  const [patterns, setPatterns] = useState<PatternDetection[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [lastDetected, setLastDetected] = useState<Date | null>(null);

  const handleDetectPatterns = async () => {
    if (individuals.length === 0) {
      showError('No individuals available for pattern detection');
      return;
    }

    if (individuals.length < 3) {
      showError('At least 3 individuals required for pattern detection');
      return;
    }

    const toastId = showLoading('Detecting patterns with AI...');
    setIsDetecting(true);

    try {
      const detectedPatterns = await bannedIndividualsAI.detectPatterns(individuals);
      setPatterns(detectedPatterns);
      setLastDetected(new Date());
      dismissLoadingAndShowSuccess(toastId, 'Pattern detection complete!');
    } catch (error) {
      console.error('Pattern detection error:', error);
      showError('Failed to detect patterns');
    } finally {
      setIsDetecting(false);
    }
  };

  const getSeverityColor = (severity: string): string => {
    return bannedIndividualsAI.getSeverityColor(severity);
  };

  const getSeverityIcon = (severity: string): string => {
    const icons: Record<string, string> = {
      critical: 'fa-radiation',
      high: 'fa-exclamation-triangle',
      medium: 'fa-exclamation-circle',
      low: 'fa-info-circle'
    };
    return icons[severity] || 'fa-info';
  };

  const getDuotoneClass = (severity: string): string => {
    const classes: Record<string, string> = {
      critical: 'duotone-danger',
      high: 'duotone-warning',
      medium: 'duotone-info',
      low: 'duotone-success'
    };
    return classes[severity] || 'duotone-info';
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Header Section */}
      <div className="glass-card spacing-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-md">
            <div className="duotone-overlay duotone-purple">
              <i className="fas fa-chart-line"></i>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900">AI Pattern Detection</h3>
              <p className="text-sm text-slate-600 mt-1">
                Identify trends and patterns across banned individuals
              </p>
            </div>
          </div>
          <Button
            onClick={handleDetectPatterns}
            disabled={isDetecting || individuals.length < 3}
            className="btn-gradient-primary"
          >
            <i className={`fas ${isDetecting ? 'fa-spinner fa-spin' : 'fa-search'} mr-2`}></i>
            {isDetecting ? 'Detecting...' : 'Detect Patterns'}
          </Button>
        </div>
        {lastDetected && (
          <div className="text-xs text-slate-500">
            <i className="fas fa-clock mr-1"></i>
            Last detected: {lastDetected.toLocaleString()}
          </div>
        )}
        {individuals.length < 3 && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded mt-4">
            <p className="text-sm text-amber-800">
              <i className="fas fa-info-circle mr-2"></i>
              At least 3 individuals are required for pattern detection. Current count: {individuals.length}
            </p>
          </div>
        )}
      </div>

      {/* Pattern Cards */}
      {patterns.length > 0 && (
        <div className="space-y-4">
          {patterns.map((pattern, index) => (
            <div key={index} className="ai-feature-card fade-in">
              <div className="flex items-start gap-4">
                <div
                  className={`duotone-overlay ${getDuotoneClass(pattern.severity)}`}
                  style={{ width: '56px', height: '56px', flexShrink: 0 }}
                >
                  <i className={`fas ${getSeverityIcon(pattern.severity)}`} style={{ fontSize: '24px' }}></i>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-slate-900 mb-1">{pattern.pattern}</h4>
                      <p className="text-sm text-slate-700 mb-2">{pattern.description}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="px-2.5 py-1 text-xs font-semibold rounded"
                          style={{
                            backgroundColor: getSeverityColor(pattern.severity) + '20',
                            color: getSeverityColor(pattern.severity)
                          }}
                        >
                          {pattern.severity.toUpperCase()} SEVERITY
                        </span>
                        <span className="px-2.5 py-1 text-xs font-semibold rounded text-blue-800 bg-blue-100">
                          {bannedIndividualsAI.formatConfidence(pattern.confidence)} Confidence
                        </span>
                        <span className="text-sm text-slate-600">
                          <i className="fas fa-users mr-1"></i>
                          {pattern.affectedIndividuals} individuals
                        </span>
                        <span className="text-sm text-slate-600">
                          <i className="fas fa-calendar mr-1"></i>
                          {pattern.timeframe}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                    <p className="text-sm font-semibold text-green-900 mb-3">
                      <i className="fas fa-lightbulb mr-2"></i>
                      Recommendations
                    </p>
                    <ul className="space-y-2">
                      {pattern.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <i className="fas fa-check-circle text-green-600 mt-0.5"></i>
                          <span className="text-sm text-green-800">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 mt-4">
                    <Button className="btn-glass text-sm">
                      <i className="fas fa-file-export mr-2"></i>
                      Export Report
                    </Button>
                    <Button className="btn-glass text-sm">
                      <i className="fas fa-bell mr-2"></i>
                      Set Alert
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {patterns.length === 0 && !isDetecting && individuals.length >= 3 && (
        <div className="glass-card spacing-2xl text-center">
          <div className="duotone-overlay duotone-purple mx-auto mb-4" style={{ width: '64px', height: '64px' }}>
            <i className="fas fa-chart-line" style={{ fontSize: '32px' }}></i>
          </div>
          <h4 className="text-lg font-semibold text-slate-900 mb-2">No Patterns Detected</h4>
          <p className="text-slate-600 mb-4">
            Click "Detect Patterns" to analyze trends and identify patterns across banned individuals
          </p>
        </div>
      )}
    </div>
  );
};

