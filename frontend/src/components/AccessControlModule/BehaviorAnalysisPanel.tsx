import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../UI/Card';
import { Button } from '../UI/Button';
import { Badge } from '../UI/Badge';
import { EmptyState } from '../UI/EmptyState';
import { showLoading, dismissLoadingAndShowSuccess, showError } from '../../utils/toast';
import { accessControlAI } from '../../services/AccessControlAIService';
import { logger } from '../../services/logger';
import { cn } from '../../utils/cn';
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
      logger.error('Behavior analysis error', error instanceof Error ? error : new Error(String(error)), { module: 'BehaviorAnalysisPanel', action: 'handleAnalyzeBehavior' });
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
      unusual_access_time: 'Time Anomaly',
      excessive_access: 'Frequency Anomaly',
      unusual_location: 'Location Anomaly',
      failed_attempts: 'Failed Access',
      privilege_escalation: 'Privilege Change'
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Header Section */}
      <div className="glass-card spacing-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-md">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5">
              <i className="fas fa-user-shield text-white text-lg"></i>
            </div>
            <div>
              <h3 className="text-xl font-black text-[color:var(--text-main)] uppercase tracking-tighter">AI Analysis</h3>
              <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 opacity-70">
                Analyze access patterns and detect anomalies
              </p>
            </div>
          </div>
          <Button
            onClick={handleAnalyzeBehavior}
            disabled={isAnalyzing || events.length === 0}
            variant="glass"
            className="text-[10px] font-black uppercase tracking-widest px-6 border-white/5 hover:bg-blue-500/10 hover:border-blue-500/20 hover:text-blue-400 shadow-none"
          >
            <i className={`fas ${isAnalyzing ? 'fa-spinner fa-spin' : 'fa-brain'} mr-2`}></i>
            {isAnalyzing ? 'ANALYZING...' : 'ANALYZE'}
          </Button>
        </div>

        {lastAnalyzed && (
          <div className="text-[9px] font-bold text-[color:var(--text-sub)] uppercase tracking-widest mb-4 opacity-50">
            <i className="fas fa-clock mr-1"></i>
            Last analyzed: {lastAnalyzed.toLocaleString()}
          </div>
        )}

        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setActiveView('anomalies')}
            variant={activeView === 'anomalies' ? 'glass' : 'outline'}
            className={cn(
              "text-[10px] font-black uppercase tracking-widest shadow-none",
              activeView === 'anomalies' ? "border-white/20 bg-white/10 text-white" : "border-white/5"
            )}
          >
            <i className="fas fa-exclamation-triangle mr-2"></i>
            Anomalies ({anomalies.length})
          </Button>
          <Button
            onClick={() => setActiveView('profiles')}
            variant={activeView === 'profiles' ? 'glass' : 'outline'}
            className={cn(
              "text-[10px] font-black uppercase tracking-widest shadow-none",
              activeView === 'profiles' ? "border-white/20 bg-white/10 text-white" : "border-white/5"
            )}
          >
            <i className="fas fa-user-circle mr-2"></i>
            User Profiles ({profiles.length})
          </Button>
        </div>
      </div>

      {/* Statistics Overview */}
      {anomalies.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-md">
          <div className="metric-card bg-slate-900/30 border border-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="metric-value filter drop-shadow-md text-[color:var(--text-main)]">{anomalies.length}</div>
                <div className="text-[9px] font-black text-[color:var(--text-sub)] uppercase tracking-widest">Anomalies</div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-red-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5">
                <i className="fas fa-shield-virus text-white text-lg"></i>
              </div>
            </div>
          </div>

          <div className="metric-card bg-slate-900/30 border border-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="metric-value filter drop-shadow-md text-[color:var(--text-main)]">
                  {anomalies.filter(a => a.severity === 'critical' || a.severity === 'high').length}
                </div>
                <div className="text-[9px] font-black text-[color:var(--text-sub)] uppercase tracking-widest">High Risk</div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-orange-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5">
                <i className="fas fa-exclamation-triangle text-white text-lg"></i>
              </div>
            </div>
          </div>

          <div className="metric-card bg-slate-900/30 border border-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="metric-value filter drop-shadow-md text-[color:var(--text-main)]">
                  {[...new Set(anomalies.map(a => a.userId))].length}
                </div>
                <div className="text-[9px] font-black text-[color:var(--text-sub)] uppercase tracking-widest">Flagged Users</div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5">
                <i className="fas fa-users text-white text-lg"></i>
              </div>
            </div>
          </div>

          <div className="metric-card bg-slate-900/30 border border-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="metric-value filter drop-shadow-md text-[color:var(--text-main)]">
                  {profiles.filter(p => p.riskLevel === 'high').length}
                </div>
                <div className="text-[9px] font-black text-[color:var(--text-sub)] uppercase tracking-widest">At Risk</div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5">
                <i className="fas fa-user-secret text-white text-lg"></i>
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
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-2xl border border-white/5 flex-shrink-0 ${anomaly.severity === 'critical' ? 'bg-gradient-to-br from-red-600/80 to-slate-900' :
                  anomaly.severity === 'high' ? 'bg-gradient-to-br from-orange-600/80 to-slate-900' :
                    anomaly.severity === 'medium' ? 'bg-gradient-to-br from-amber-600/80 to-slate-900' :
                      'bg-gradient-to-br from-blue-600/80 to-slate-900'
                  }`}>
                  <i className={`fas ${accessControlAI.getAnomalyIcon(anomaly.anomalyType)} text-white text-lg`}></i>
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="text-lg font-black text-[color:var(--text-main)] mb-1 uppercase tracking-tight">
                        {anomaly.description}
                      </h4>
                      <p className="text-[10px] text-[color:var(--text-sub)] mb-2 font-bold uppercase tracking-widest">{anomaly.details}</p>
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <Badge className={`badge ${getSeverityBadge(anomaly.severity)} text-[9px] font-black uppercase tracking-widest`}>
                          {anomaly.severity.toUpperCase()}
                        </Badge>
                        <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] font-black uppercase tracking-widest">
                          {accessControlAI.formatConfidence(anomaly.confidence)} Confidence
                        </Badge>
                        <span className="text-[10px] text-[color:var(--text-sub)] font-bold uppercase tracking-widest">
                          <i className="fas fa-user mr-1"></i>
                          {anomaly.userName}
                        </span>
                        <span className="text-[10px] text-[color:var(--text-sub)] font-bold uppercase tracking-widest">
                          <i className="fas fa-tag mr-1"></i>
                          {getAnomalyTypeLabel(anomaly.anomalyType).toUpperCase()}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: accessControlAI.getSeverityColor(anomaly.severity) }}>
                          Risk Score: {anomaly.riskScore.toFixed(1)}/10
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="bg-blue-500/5 border-l-2 border-[#2563eb] p-4 rounded-r-lg">
                    <p className="text-[10px] font-black text-[#60a5fa] mb-3 uppercase tracking-widest">
                      <i className="fas fa-lightbulb mr-2"></i>
                      Recommendations
                    </p>
                    <ul className="space-y-2">
                      {anomaly.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <i className="fas fa-check-circle text-[#2563eb] mt-0.5 text-xs"></i>
                          <span className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-wide">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 mt-4">
                    <Button variant="outline" size="sm" className="text-[9px] font-black uppercase tracking-widest">
                      <i className="fas fa-eye mr-2"></i>
                      View Details
                    </Button>
                    <Button variant="outline" size="sm" className="text-[9px] font-black uppercase tracking-widest text-red-400 hover:text-red-300">
                      <i className="fas fa-ban mr-2"></i>
                      Disable User
                    </Button>
                    <Button variant="outline" size="sm" className="text-[9px] font-black uppercase tracking-widest text-green-400 hover:text-green-300">
                      <i className="fas fa-check mr-2"></i>
                      Dismiss
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
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-2xl border border-white/5 ${profile.riskLevel === 'high' ? 'bg-gradient-to-br from-red-600/80 to-slate-900' :
                    profile.riskLevel === 'medium' ? 'bg-gradient-to-br from-orange-600/80 to-slate-900' :
                      'bg-gradient-to-br from-green-600/80 to-slate-900'
                    }`}>
                    <i className="fas fa-user text-white text-lg"></i>
                  </div>
                  <div>
                    <h4 className="font-black text-[color:var(--text-main)] uppercase tracking-tight">{profile.userName}</h4>
                    <p className="text-[10px] text-[color:var(--text-sub)] uppercase tracking-widest">User ID: {profile.userId}</p>
                  </div>
                </div>
                <Badge className={`badge ${getRiskLevelBadge(profile.riskLevel)}`}>
                  {profile.riskLevel.toUpperCase()} RISK
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="bg-[color:var(--console-dark)]/20 rounded-xl p-3 border border-white/5">
                  <div className="flex items-center gap-2 mb-1">
                    <i className="fas fa-clock text-blue-400 text-sm"></i>
                    <span className="text-[10px] font-black text-[color:var(--text-sub)] uppercase tracking-widest">Normal Access Hours</span>
                  </div>
                  <p className="text-[color:var(--text-main)] text-sm font-bold">{profile.normalAccessHours}</p>
                </div>

                <div className="bg-[color:var(--console-dark)]/20 rounded-xl p-3 border border-white/5">
                  <div className="flex items-center gap-2 mb-1">
                    <i className="fas fa-map-marker-alt text-blue-400 text-sm"></i>
                    <span className="text-[10px] font-black text-[color:var(--text-sub)] uppercase tracking-widest">Typical Locations</span>
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
                  <div className="bg-[color:var(--console-dark)]/20 rounded-xl p-3 border border-white/5">
                    <div className="text-[10px] text-[color:var(--text-sub)] font-black uppercase tracking-widest mb-1">Avg. Daily Access</div>
                    <div className="text-lg font-black text-[color:var(--text-main)]">{profile.averageAccessesPerDay}</div>
                  </div>
                  <div className="bg-[color:var(--console-dark)]/20 rounded-xl p-3 border border-white/5">
                    <div className="text-[10px] text-[color:var(--text-sub)] font-black uppercase tracking-widest mb-1">Anomalies</div>
                    <div className="text-lg font-black text-[color:var(--text-main)]">{profile.anomaliesDetected}</div>
                  </div>
                </div>

                <div className="text-[10px] text-[color:var(--text-sub)] font-bold uppercase tracking-widest pt-2 border-t border-white/5">
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
        <EmptyState
          icon="fas fa-microchip"
          title="No Analysis Yet"
          description='Click "Analyze" to begin detection.'
          className="bg-slate-900/50 border-dashed border-2 border-white/5 rounded-3xl p-12"
        />
      )}
    </div>
  );
};

