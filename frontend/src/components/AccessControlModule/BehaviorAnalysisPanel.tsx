import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../UI/Card';
import { Button } from '../UI/Button';
import { Badge } from '../UI/Badge';
import { showLoading, dismissLoadingAndShowSuccess, showError } from '../../utils/toast';
import { accessControlAI } from '../../services/AccessControlAIService';
import '../../styles/modern-glass.css';

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
  anomalyType: string;
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

interface Props {
  events: AccessEvent[];
  users: User[];
}

export const BehaviorAnalysisPanel: React.FC<Props> = ({ events, users }) => {
  const [anomalies, setAnomalies] = useState<BehaviorAnomaly[]>([]);
  const [profiles, setProfiles] = useState<UserBehaviorProfile[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalyzed, setLastAnalyzed] = useState<Date | null>(null);
  const [activeView, setActiveView] = useState<'anomalies' | 'profiles'>('anomalies');

  const handleAnalyzeBehavior = async () => {
    if (events.length === 0 || users.length === 0) {
      showError('Insufficient data for behavior analysis');
      return;
    }

    const toastId = showLoading('Analyzing user behavior with AI...');
    setIsAnalyzing(true);

    try {
      const [behaviorAnomalies, userProfiles] = await Promise.all([
        accessControlAI.analyzeUserBehavior(events, users),
        accessControlAI.generateBehaviorProfiles(events, users)
      ]);

      setAnomalies(behaviorAnomalies);
      setProfiles(userProfiles);
      setLastAnalyzed(new Date());
      dismissLoadingAndShowSuccess(toastId, 'Behavior analysis complete!');
    } catch (error) {
      console.error('Behavior analysis error:', error);
      showError('Failed to analyze behavior');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    const badges: Record<string, string> = {
      critical: 'badge-danger',
      high: 'badge-warning',
      medium: 'badge-info',
      low: 'badge-success'
    };
    return badges[severity] || 'badge-secondary';
  };

  const getRiskLevelBadge = (riskLevel: string) => {
    const badges: Record<string, string> = {
      high: 'badge-danger',
      medium: 'badge-warning',
      low: 'badge-success'
    };
    return badges[riskLevel] || 'badge-secondary';
  };

  const getDuotoneClass = (severity: string) => {
    const classes: Record<string, string> = {
      critical: 'duotone-danger',
      high: 'duotone-warning',
      medium: 'duotone-info',
      low: 'duotone-success'
    };
    return classes[severity] || 'duotone-info';
  };

  const getAnomalyTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      unusual_access_time: 'Unusual Access Time',
      excessive_access: 'Excessive Access Frequency',
      unusual_location: 'Unusual Location Access',
      failed_attempts: 'Failed Access Attempts',
      privilege_escalation: 'Privilege Escalation'
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Header Section */}
      <div className="glass-card spacing-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-md">
            <div className="duotone-overlay duotone-purple">
              <i className="fas fa-user-shield"></i>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900">AI Behavior Analysis</h3>
              <p className="text-sm text-slate-600 mt-1">
                Detect anomalies and insider threat indicators
              </p>
            </div>
          </div>
          <Button
            onClick={handleAnalyzeBehavior}
            disabled={isAnalyzing || events.length === 0}
            className="btn-gradient-primary"
          >
            <i className={`fas ${isAnalyzing ? 'fa-spinner fa-spin' : 'fa-brain'} mr-2`}></i>
            {isAnalyzing ? 'Analyzing...' : 'Analyze Behavior'}
          </Button>
        </div>

        {lastAnalyzed && (
          <div className="text-xs text-slate-500 mb-4">
            <i className="fas fa-clock mr-1"></i>
            Last analyzed: {lastAnalyzed.toLocaleString()}
          </div>
        )}

        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setActiveView('anomalies')}
            className={activeView === 'anomalies' ? 'btn-gradient-primary' : 'btn-glass'}
          >
            <i className="fas fa-exclamation-triangle mr-2"></i>
            Anomalies ({anomalies.length})
          </Button>
          <Button
            onClick={() => setActiveView('profiles')}
            className={activeView === 'profiles' ? 'btn-gradient-primary' : 'btn-glass'}
          >
            <i className="fas fa-user-circle mr-2"></i>
            User Profiles ({profiles.length})
          </Button>
        </div>
      </div>

      {/* Statistics Overview */}
      {anomalies.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-md">
          <div className="metric-card">
            <div className="flex items-center justify-between">
              <div>
                <div className="metric-value">{anomalies.length}</div>
                <div className="metric-label">Anomalies Detected</div>
              </div>
              <div className="duotone-overlay duotone-danger">
                <i className="fas fa-shield-virus"></i>
              </div>
            </div>
          </div>

          <div className="metric-card">
            <div className="flex items-center justify-between">
              <div>
                <div className="metric-value">
                  {anomalies.filter(a => a.severity === 'critical' || a.severity === 'high').length}
                </div>
                <div className="metric-label">High Risk Alerts</div>
              </div>
              <div className="duotone-overlay duotone-warning">
                <i className="fas fa-exclamation-triangle"></i>
              </div>
            </div>
          </div>

          <div className="metric-card">
            <div className="flex items-center justify-between">
              <div>
                <div className="metric-value">
                  {[...new Set(anomalies.map(a => a.userId))].length}
                </div>
                <div className="metric-label">Users Flagged</div>
              </div>
              <div className="duotone-overlay duotone-info">
                <i className="fas fa-users"></i>
              </div>
            </div>
          </div>

          <div className="metric-card">
            <div className="flex items-center justify-between">
              <div>
                <div className="metric-value">
                  {profiles.filter(p => p.riskLevel === 'high').length}
                </div>
                <div className="metric-label">High Risk Users</div>
              </div>
              <div className="duotone-overlay duotone-purple">
                <i className="fas fa-user-secret"></i>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Anomalies View */}
      {activeView === 'anomalies' && anomalies.length > 0 && (
        <div className="space-y-4">
          {anomalies.map((anomaly, index) => (
            <div key={index} className="ai-feature-card fade-in">
              <div className="flex items-start gap-4">
                <div className={`duotone-overlay ${getDuotoneClass(anomaly.severity)}`} style={{ width: '56px', height: '56px', flexShrink: 0 }}>
                  <i className={`fas ${accessControlAI.getAnomalyIcon(anomaly.anomalyType)}`} style={{ fontSize: '24px' }}></i>
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-slate-900 mb-1">
                        {anomaly.description}
                      </h4>
                      <p className="text-sm text-slate-600 mb-2">{anomaly.details}</p>
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <Badge className={`badge ${getSeverityBadge(anomaly.severity)}`}>
                          {anomaly.severity.toUpperCase()}
                        </Badge>
                        <Badge className="ai-confidence-badge">
                          {accessControlAI.formatConfidence(anomaly.confidence)} Confidence
                        </Badge>
                        <span className="text-sm text-slate-600">
                          <i className="fas fa-user mr-1"></i>
                          {anomaly.userName}
                        </span>
                        <span className="text-sm text-slate-600">
                          <i className="fas fa-tag mr-1"></i>
                          {getAnomalyTypeLabel(anomaly.anomalyType)}
                        </span>
                        <span className="text-sm font-semibold" style={{ color: accessControlAI.getSeverityColor(anomaly.severity) }}>
                          Risk Score: {anomaly.riskScore.toFixed(1)}/10
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                    <p className="text-sm font-semibold text-blue-900 mb-3">
                      <i className="fas fa-lightbulb mr-2"></i>
                      Recommended Actions
                    </p>
                    <ul className="space-y-2">
                      {anomaly.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <i className="fas fa-check-circle text-blue-600 mt-0.5"></i>
                          <span className="text-sm text-blue-800">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 mt-4">
                    <Button className="btn-glass text-sm">
                      <i className="fas fa-eye mr-2"></i>
                      Investigate
                    </Button>
                    <Button className="btn-glass text-sm">
                      <i className="fas fa-ban mr-2"></i>
                      Suspend Access
                    </Button>
                    <Button className="btn-glass text-sm">
                      <i className="fas fa-check mr-2"></i>
                      Mark Reviewed
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* User Profiles View */}
      {activeView === 'profiles' && profiles.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-md">
          {profiles.map((profile, index) => (
            <div key={index} className="glass-card spacing-md fade-in">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`duotone-overlay duotone-${profile.riskLevel === 'high' ? 'danger' : profile.riskLevel === 'medium' ? 'warning' : 'success'}`}>
                    <i className="fas fa-user"></i>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">{profile.userName}</h4>
                    <p className="text-xs text-slate-600">User ID: {profile.userId}</p>
                  </div>
                </div>
                <Badge className={`badge ${getRiskLevelBadge(profile.riskLevel)}`}>
                  {profile.riskLevel.toUpperCase()} RISK
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="bg-white/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <i className="fas fa-clock text-blue-600 text-sm"></i>
                    <span className="text-xs font-semibold text-slate-700">Normal Access Hours</span>
                  </div>
                  <p className="text-sm text-slate-900">{profile.normalAccessHours}</p>
                </div>

                <div className="bg-white/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <i className="fas fa-map-marker-alt text-blue-600 text-sm"></i>
                    <span className="text-xs font-semibold text-slate-700">Typical Locations</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {profile.typicalLocations.slice(0, 3).map((loc, idx) => (
                      <Badge key={idx} className="badge badge-secondary text-xs">
                        {loc}
                      </Badge>
                    ))}
                    {profile.typicalLocations.length > 3 && (
                      <Badge className="badge badge-secondary text-xs">
                        +{profile.typicalLocations.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/50 rounded-lg p-3">
                    <div className="text-xs text-slate-600 mb-1">Avg. Daily Access</div>
                    <div className="text-lg font-semibold text-slate-900">{profile.averageAccessesPerDay}</div>
                  </div>
                  <div className="bg-white/50 rounded-lg p-3">
                    <div className="text-xs text-slate-600 mb-1">Anomalies</div>
                    <div className="text-lg font-semibold text-slate-900">{profile.anomaliesDetected}</div>
                  </div>
                </div>

                <div className="text-xs text-slate-500 pt-2 border-t border-slate-200">
                  <i className="fas fa-sync mr-1"></i>
                  Last analyzed: {new Date(profile.lastAnalyzed).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {anomalies.length === 0 && !isAnalyzing && (
        <div className="glass-card spacing-2xl text-center">
          <div className="duotone-overlay duotone-purple mx-auto mb-4" style={{ width: '64px', height: '64px' }}>
            <i className="fas fa-user-shield" style={{ fontSize: '32px' }}></i>
          </div>
          <h4 className="text-lg font-semibold text-slate-900 mb-2">No Behavior Analysis Yet</h4>
          <p className="text-slate-600 mb-4">
            Click "Analyze Behavior" to detect anomalies and insider threat indicators
          </p>
        </div>
      )}
    </div>
  );
};
