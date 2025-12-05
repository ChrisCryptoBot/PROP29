import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../UI/Card';
import { Button } from '../UI/Button';
import { Badge } from '../UI/Badge';
import { showLoading, dismissLoadingAndShowSuccess, showError } from '../../utils/toast';
import { incidentAI } from '../../services/IncidentAIService';
import '../../styles/modern-glass.css';

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

interface PredictiveInsight {
  prediction: string;
  probability: number;
  timeframe: string;
  location: string;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  preventiveMeasures: string[];
  reasoning: string;
}

interface Props {
  incidents: Incident[];
}

export const PredictiveInsightsTab: React.FC<Props> = ({ incidents }) => {
  const [predictions, setPredictions] = useState<PredictiveInsight[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);

  const handleGeneratePredictions = async () => {
    if (incidents.length === 0) {
      showError('No incident data available for predictions');
      return;
    }

    if (incidents.length < 3) {
      showError('At least 3 incidents required for accurate predictions');
      return;
    }

    const toastId = showLoading('Generating AI predictions...');
    setIsGenerating(true);

    try {
      const predictiveInsights = await incidentAI.generatePredictions(incidents);
      setPredictions(predictiveInsights);
      setLastGenerated(new Date());
      dismissLoadingAndShowSuccess(toastId, 'Predictions generated successfully!');
    } catch (error) {
      console.error('Prediction generation error:', error);
      showError('Failed to generate predictions');
    } finally {
      setIsGenerating(false);
    }
  };

  const getRiskLevelBadge = (riskLevel: string) => {
    const badges: Record<string, string> = {
      critical: 'badge-danger',
      high: 'badge-warning',
      medium: 'badge-info',
      low: 'badge-success'
    };
    return badges[riskLevel] || 'badge-secondary';
  };

  const getRiskLevelIcon = (riskLevel: string) => {
    const icons: Record<string, string> = {
      critical: 'fa-radiation',
      high: 'fa-exclamation-triangle',
      medium: 'fa-exclamation-circle',
      low: 'fa-info-circle'
    };
    return icons[riskLevel] || 'fa-info';
  };

  const getDuotoneClass = (riskLevel: string) => {
    const classes: Record<string, string> = {
      critical: 'duotone-danger',
      high: 'duotone-warning',
      medium: 'duotone-info',
      low: 'duotone-success'
    };
    return classes[riskLevel] || 'duotone-info';
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 0.8) return 'text-red-600';
    if (probability >= 0.6) return 'text-orange-600';
    if (probability >= 0.4) return 'text-blue-600';
    return 'text-green-600';
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Header Section */}
      <div className="glass-card spacing-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-md">
            <div className="duotone-overlay duotone-purple">
              <i className="fas fa-crystal-ball"></i>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900">AI Predictive Insights</h3>
              <p className="text-sm text-slate-600 mt-1">
                Forecast potential incidents and get preventive recommendations
              </p>
            </div>
          </div>
          <Button
            onClick={handleGeneratePredictions}
            disabled={isGenerating || incidents.length < 3}
            className="btn-gradient-primary"
          >
            <i className={`fas ${isGenerating ? 'fa-spinner fa-spin' : 'fa-brain'} mr-2`}></i>
            {isGenerating ? 'Generating...' : 'Generate Predictions'}
          </Button>
        </div>

        {lastGenerated && (
          <div className="text-xs text-slate-500">
            <i className="fas fa-clock mr-1"></i>
            Last generated: {lastGenerated.toLocaleString()}
          </div>
        )}

        {incidents.length < 3 && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded mt-4">
            <p className="text-sm text-amber-800">
              <i className="fas fa-info-circle mr-2"></i>
              At least 3 incidents are required for accurate AI predictions. Current count: {incidents.length}
            </p>
          </div>
        )}
      </div>

      {/* Prediction Cards */}
      {predictions.length > 0 && (
        <div className="space-y-4">
          {predictions.map((prediction, index) => (
            <div key={index} className="ai-feature-card fade-in">
              <div className="flex items-start gap-4">
                {/* Risk Icon */}
                <div className={`duotone-overlay ${getDuotoneClass(prediction.riskLevel)}`} style={{ width: '56px', height: '56px', flexShrink: 0 }}>
                  <i className={`fas ${getRiskLevelIcon(prediction.riskLevel)}`} style={{ fontSize: '24px' }}></i>
                </div>

                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-slate-900 mb-2">
                        {prediction.prediction}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={`badge ${getRiskLevelBadge(prediction.riskLevel)}`}>
                          {prediction.riskLevel.toUpperCase()} RISK
                        </Badge>
                        <span className={`text-2xl font-bold ${getProbabilityColor(prediction.probability)}`}>
                          {(prediction.probability * 100).toFixed(0)}%
                        </span>
                        <span className="text-sm text-slate-600">probability</span>
                      </div>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-white/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <i className="fas fa-calendar text-blue-600"></i>
                        <span className="text-xs font-semibold text-slate-700 uppercase">Timeframe</span>
                      </div>
                      <p className="text-sm text-slate-900 font-medium">{prediction.timeframe}</p>
                    </div>

                    <div className="bg-white/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <i className="fas fa-map-marker-alt text-blue-600"></i>
                        <span className="text-xs font-semibold text-slate-700 uppercase">Location</span>
                      </div>
                      <p className="text-sm text-slate-900 font-medium">{prediction.location}</p>
                    </div>
                  </div>

                  {/* AI Reasoning */}
                  <div className="bg-purple-50 border-l-4 border-purple-500 p-3 rounded mb-4">
                    <p className="text-sm font-medium text-purple-900 mb-1">
                      <i className="fas fa-brain mr-2"></i>
                      AI Reasoning
                    </p>
                    <p className="text-sm text-purple-700">{prediction.reasoning}</p>
                  </div>

                  {/* Preventive Measures */}
                  <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                    <p className="text-sm font-semibold text-green-900 mb-3">
                      <i className="fas fa-shield-alt mr-2"></i>
                      Recommended Preventive Measures
                    </p>
                    <ul className="space-y-2">
                      {prediction.preventiveMeasures.map((measure, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <i className="fas fa-check-circle text-green-600 mt-0.5"></i>
                          <span className="text-sm text-green-800">{measure}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 mt-4">
                    <Button className="btn-glass text-sm">
                      <i className="fas fa-tasks mr-2"></i>
                      Create Action Plan
                    </Button>
                    <Button className="btn-glass text-sm">
                      <i className="fas fa-bell mr-2"></i>
                      Set Alert
                    </Button>
                    <Button className="btn-glass text-sm">
                      <i className="fas fa-share mr-2"></i>
                      Share
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Section */}
      <div className="glass-card spacing-lg">
        <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <i className="fas fa-lightbulb text-yellow-600"></i>
          How AI Predictions Work
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="duotone-overlay duotone-primary mx-auto mb-3" style={{ width: '48px', height: '48px' }}>
              <i className="fas fa-database"></i>
            </div>
            <h5 className="font-semibold text-slate-900 mb-1">Data Analysis</h5>
            <p className="text-sm text-slate-600">
              Analyzes historical incident patterns, frequency, and severity
            </p>
          </div>

          <div className="text-center">
            <div className="duotone-overlay duotone-purple mx-auto mb-3" style={{ width: '48px', height: '48px' }}>
              <i className="fas fa-brain"></i>
            </div>
            <h5 className="font-semibold text-slate-900 mb-1">Pattern Recognition</h5>
            <p className="text-sm text-slate-600">
              Identifies correlations in time, location, and incident types
            </p>
          </div>

          <div className="text-center">
            <div className="duotone-overlay duotone-success mx-auto mb-3" style={{ width: '48px', height: '48px' }}>
              <i className="fas fa-shield-alt"></i>
            </div>
            <h5 className="font-semibold text-slate-900 mb-1">Preventive Actions</h5>
            <p className="text-sm text-slate-600">
              Provides actionable recommendations to prevent incidents
            </p>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {predictions.length === 0 && !isGenerating && incidents.length >= 3 && (
        <div className="glass-card spacing-2xl text-center">
          <div className="duotone-overlay duotone-purple mx-auto mb-4" style={{ width: '64px', height: '64px' }}>
            <i className="fas fa-crystal-ball" style={{ fontSize: '32px' }}></i>
          </div>
          <h4 className="text-lg font-semibold text-slate-900 mb-2">No Predictions Generated</h4>
          <p className="text-slate-600 mb-4">
            Click "Generate Predictions" to get AI-powered insights and forecasts
          </p>
        </div>
      )}
    </div>
  );
};
