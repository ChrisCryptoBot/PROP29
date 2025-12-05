import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../UI/Card';
import { Button } from '../UI/Button';
import { Badge } from '../UI/Badge';
import { showLoading, dismissLoadingAndShowSuccess, showError } from '../../utils/toast';
import { incidentAI } from '../../services/IncidentAIService';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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

interface TrendPattern {
  pattern: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  recommendation: string;
  timeframe: string;
  dataPoints: number;
}

interface Props {
  incidents: Incident[];
}

export const TrendAnalysisTab: React.FC<Props> = ({ incidents }) => {
  const [trends, setTrends] = useState<TrendPattern[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalyzed, setLastAnalyzed] = useState<Date | null>(null);

  const handleAnalyzeTrends = async () => {
    if (incidents.length === 0) {
      showError('No incident data available for analysis');
      return;
    }

    const toastId = showLoading('Analyzing incident trends with AI...');
    setIsAnalyzing(true);

    try {
      const trendPatterns = await incidentAI.analyzeTrends(incidents);
      setTrends(trendPatterns);
      setLastAnalyzed(new Date());
      dismissLoadingAndShowSuccess(toastId, 'Trend analysis complete!');
    } catch (error) {
      console.error('Trend analysis error:', error);
      showError('Failed to analyze trends');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Generate chart data
  const generateTypeDistribution = () => {
    const typeCount = incidents.reduce((acc, inc) => {
      acc[inc.type] = (acc[inc.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(typeCount).map(([type, count]) => ({
      type,
      count,
      percentage: ((count / incidents.length) * 100).toFixed(1)
    }));
  };

  const generateLocationHeatmap = () => {
    const locationCount = incidents.reduce((acc, inc) => {
      acc[inc.location] = (acc[inc.location] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(locationCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([location, count]) => ({
        location: location.length > 20 ? location.substring(0, 20) + '...' : location,
        count
      }));
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'badge-danger';
      case 'medium': return 'badge-warning';
      case 'low': return 'badge-success';
      default: return 'badge-secondary';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'high': return 'fa-exclamation-triangle';
      case 'medium': return 'fa-info-circle';
      case 'low': return 'fa-check-circle';
      default: return 'fa-info';
    }
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Header Section */}
      <div className="glass-card spacing-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-md">
            <div className="duotone-overlay duotone-primary">
              <i className="fas fa-chart-line"></i>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900">AI-Powered Trend Analysis</h3>
              <p className="text-sm text-slate-600 mt-1">
                Identify patterns and trends in incident data
              </p>
            </div>
          </div>
          <Button
            onClick={handleAnalyzeTrends}
            disabled={isAnalyzing || incidents.length === 0}
            className="btn-gradient-primary"
          >
            <i className={`fas ${isAnalyzing ? 'fa-spinner fa-spin' : 'fa-magic'} mr-2`}></i>
            {isAnalyzing ? 'Analyzing...' : 'Analyze Trends'}
          </Button>
        </div>

        {lastAnalyzed && (
          <div className="text-xs text-slate-500">
            <i className="fas fa-clock mr-1"></i>
            Last analyzed: {lastAnalyzed.toLocaleString()}
          </div>
        )}
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-md">
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="metric-value">{incidents.length}</div>
              <div className="metric-label">Total Incidents</div>
            </div>
            <div className="duotone-overlay duotone-primary">
              <i className="fas fa-clipboard-list"></i>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="metric-value">
                {incidents.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH').length}
              </div>
              <div className="metric-label">High Severity</div>
            </div>
            <div className="duotone-overlay duotone-danger">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="metric-value">
                {[...new Set(incidents.map(i => i.location))].length}
              </div>
              <div className="metric-label">Unique Locations</div>
            </div>
            <div className="duotone-overlay duotone-info">
              <i className="fas fa-map-marker-alt"></i>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="metric-value">
                {trends.length}
              </div>
              <div className="metric-label">Patterns Detected</div>
            </div>
            <div className="duotone-overlay duotone-success">
              <i className="fas fa-brain"></i>
            </div>
          </div>
        </div>
      </div>

      {/* AI Trend Patterns */}
      {trends.length > 0 && (
        <div className="glass-card spacing-lg">
          <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <i className="fas fa-brain text-purple-600"></i>
            AI-Detected Patterns
          </h4>
          <div className="space-y-4">
            {trends.map((trend, index) => (
              <div key={index} className="ai-result-card">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className={`duotone-overlay duotone-${trend.impact === 'high' ? 'danger' : trend.impact === 'medium' ? 'warning' : 'success'}`}>
                      <i className={`fas ${getImpactIcon(trend.impact)}`}></i>
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-slate-900 mb-1">{trend.pattern}</h5>
                      <p className="text-sm text-slate-600 mb-2">{trend.description}</p>
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <Badge className="ai-confidence-badge">
                          {incidentAI.formatConfidence(trend.confidence)} Confidence
                        </Badge>
                        <Badge className={`badge ${getImpactColor(trend.impact)}`}>
                          {trend.impact.toUpperCase()} Impact
                        </Badge>
                        <span className="text-xs text-slate-500">
                          <i className="fas fa-database mr-1"></i>
                          {trend.dataPoints} data points
                        </span>
                        <span className="text-xs text-slate-500">
                          <i className="fas fa-calendar mr-1"></i>
                          {trend.timeframe}
                        </span>
                      </div>
                      <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                        <p className="text-sm font-medium text-blue-900">
                          <i className="fas fa-lightbulb mr-2"></i>
                          Recommendation
                        </p>
                        <p className="text-sm text-blue-700 mt-1">{trend.recommendation}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-md">
        {/* Incident Type Distribution */}
        <div className="glass-card spacing-lg">
          <h4 className="text-lg font-semibold text-slate-900 mb-4">Incident Type Distribution</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={generateTypeDistribution()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="type" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  backdropFilter: 'blur(8px)'
                }}
              />
              <Bar dataKey="count" fill="url(#colorGradient)" radius={[8, 8, 0, 0]} />
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity={0.6} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Location Heatmap */}
        <div className="glass-card spacing-lg">
          <h4 className="text-lg font-semibold text-slate-900 mb-4">Top 10 Incident Locations</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={generateLocationHeatmap()} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" />
              <YAxis dataKey="location" type="category" tick={{ fontSize: 11 }} width={150} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  backdropFilter: 'blur(8px)'
                }}
              />
              <Bar dataKey="count" fill="url(#locationGradient)" radius={[0, 8, 8, 0]} />
              <defs>
                <linearGradient id="locationGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.6} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Empty State */}
      {trends.length === 0 && !isAnalyzing && (
        <div className="glass-card spacing-2xl text-center">
          <div className="duotone-overlay duotone-info mx-auto mb-4" style={{ width: '64px', height: '64px' }}>
            <i className="fas fa-chart-line" style={{ fontSize: '32px' }}></i>
          </div>
          <h4 className="text-lg font-semibold text-slate-900 mb-2">No Trend Analysis Yet</h4>
          <p className="text-slate-600 mb-4">
            Click "Analyze Trends" to discover patterns and insights in your incident data
          </p>
        </div>
      )}
    </div>
  );
};
