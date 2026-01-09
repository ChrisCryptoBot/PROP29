import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../UI/Card';
import { Button } from '../UI/Button';
import { Badge } from '../UI/Badge';
import { showLoading, dismissLoadingAndShowSuccess, showError } from '../../utils/toast';
import { patrolAI } from '../../services/PatrolAIService';
import '../../styles/modern-glass.css';

interface Props {
  schedule: any[];
  incidents: any[];
  routes: any[];
  onApplySuggestion?: (suggestion: any) => void;
}

export const ScheduleSuggestionsPanel: React.FC<Props> = ({ schedule, incidents, routes, onApplySuggestion }) => {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateSuggestions = async () => {
    if (schedule.length === 0 && incidents.length === 0) {
      showError('Insufficient data for schedule suggestions');
      return;
    }

    const toastId = showLoading('Analyzing schedule patterns...');
    setIsGenerating(true);

    try {
      const scheduleSuggestions = await patrolAI.generateScheduleSuggestions(schedule, incidents, routes);
      setSuggestions(scheduleSuggestions);
      dismissLoadingAndShowSuccess(toastId, `Generated ${scheduleSuggestions.length} suggestion${scheduleSuggestions.length > 1 ? 's' : ''}!`);
    } catch (error) {
      console.error('Schedule suggestions error:', error);
      showError('Failed to generate suggestions');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplySuggestion = (suggestion: any) => {
    if (onApplySuggestion) {
      onApplySuggestion(suggestion);
    }
  };

  const getPriorityBadge = (priority: string) => {
    const badges: Record<string, string> = {
      high: 'badge-danger',
      medium: 'badge-warning',
      low: 'badge-info'
    };
    return badges[priority] || 'badge-secondary';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center mr-3">
              <i className="fas fa-calendar-alt text-white"></i>
            </div>
            AI Schedule Suggestions
          </div>
          <Button
            onClick={handleGenerateSuggestions}
            disabled={isGenerating}
            className="!bg-[#2563eb] hover:!bg-blue-700 text-white h-12 px-5 py-2.5 text-lg font-semibold"
          >
            <i className={`fas ${isGenerating ? 'fa-spinner fa-spin' : 'fa-magic'} mr-2.5 text-lg`}></i>
            {isGenerating ? 'Analyzing...' : 'Generate'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {suggestions.length > 0 ? (
          <div className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <div key={index} className="p-4 bg-white rounded-lg border border-slate-200 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 mb-1">{suggestion.recommendation}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={`badge ${getPriorityBadge(suggestion.priority)}`}>
                        {suggestion.priority.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-slate-600">
                        Confidence: {patrolAI.formatConfidence(suggestion.confidence)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mb-2">{suggestion.reasoning}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      {suggestion.timeframe && (
                        <span><i className="fas fa-clock mr-1"></i>{suggestion.timeframe}</span>
                      )}
                      {suggestion.location && (
                        <span><i className="fas fa-map-marker-alt mr-1"></i>{suggestion.location}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                  <Button
                    size="sm"
                    onClick={() => handleApplySuggestion(suggestion)}
                    className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
                  >
                    <i className="fas fa-check mr-1"></i>
                    Apply
                  </Button>
                  <Button size="sm" variant="outline">
                    <i className="fas fa-times mr-1"></i>
                    Dismiss
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-600">
            <i className="fas fa-lightbulb text-3xl mb-3 text-slate-400"></i>
            <p className="text-sm mb-2">No schedule suggestions yet</p>
            <p className="text-xs text-slate-500">Click "Generate" to analyze patterns and get AI recommendations</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

