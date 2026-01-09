import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../UI/Card';
import { Button } from '../UI/Button';
import { Badge } from '../UI/Badge';
import { showLoading, dismissLoadingAndShowSuccess, showError } from '../../utils/toast';
import { patrolAI } from '../../services/PatrolAIService';
import '../../styles/modern-glass.css';

interface Props {
  patrolHistory: any[];
  incidents: any[];
  onCreateTemplate?: (suggestion: any) => void;
}

export const TemplateSuggestionsPanel: React.FC<Props> = ({ patrolHistory, incidents, onCreateTemplate }) => {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateSuggestions = async () => {
    if (patrolHistory.length === 0) {
      showError('No patrol history available for analysis');
      return;
    }

    const toastId = showLoading('Analyzing patrol patterns...');
    setIsGenerating(true);

    try {
      const templateSuggestions = await patrolAI.suggestTemplates(patrolHistory, incidents);
      setSuggestions(templateSuggestions);
      dismissLoadingAndShowSuccess(toastId, `Found ${templateSuggestions.length} template suggestion${templateSuggestions.length > 1 ? 's' : ''}!`);
    } catch (error) {
      console.error('Template suggestions error:', error);
      showError('Failed to generate template suggestions');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateTemplate = (suggestion: any) => {
    if (onCreateTemplate) {
      onCreateTemplate(suggestion);
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
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center mr-3">
              <i className="fas fa-brain text-white"></i>
            </div>
            AI Template Suggestions
          </div>
          <Button
            onClick={handleGenerateSuggestions}
            disabled={isGenerating}
            className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
          >
            <i className={`fas ${isGenerating ? 'fa-spinner fa-spin' : 'fa-magic'} mr-2`}></i>
            {isGenerating ? 'Analyzing...' : 'Find Patterns'}
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
                    <h5 className="text-sm font-semibold text-slate-900 mb-1">{suggestion.name}</h5>
                    <p className="text-xs text-slate-600 mb-2">{suggestion.description}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={`badge ${getPriorityBadge(suggestion.priority)}`}>
                        {suggestion.priority.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-slate-600">
                        {suggestion.patternCount} similar patrols detected
                      </span>
                      <span className="text-xs text-slate-600">
                        Confidence: {patrolAI.formatConfidence(suggestion.confidence)}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 space-y-1 mt-2">
                      <p><i className="fas fa-route mr-1"></i>Route: {suggestion.suggestedRoute}</p>
                      <p><i className="fas fa-clock mr-1"></i>Time: {suggestion.suggestedTime}</p>
                      {suggestion.suggestedDays.length > 0 && (
                        <p><i className="fas fa-calendar mr-1"></i>Days: {suggestion.suggestedDays.join(', ')}</p>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-2 italic">{suggestion.reasoning}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                  <Button
                    size="sm"
                    onClick={() => handleCreateTemplate(suggestion)}
                    className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
                  >
                    <i className="fas fa-plus mr-1"></i>
                    Create Template
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
            <i className="fas fa-file-alt text-3xl mb-3 text-slate-400"></i>
            <p className="text-sm mb-2">No template suggestions yet</p>
            <p className="text-xs text-slate-500">Click "Find Patterns" to analyze patrol history and discover recurring patterns</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

