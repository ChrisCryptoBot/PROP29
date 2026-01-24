import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../UI/Card';
import { Button } from '../UI/Button';
import { Badge } from '../UI/Badge';
import { showLoading, dismissLoadingAndShowSuccess, showError } from '../../utils/toast';
import { patrolAI } from '../../services/PatrolAIService';
import { logger } from '../../services/logger';
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
      logger.error('Template suggestions error', error instanceof Error ? error : new Error(String(error)), { module: 'TemplateSuggestionsPanel', action: 'handleGenerateSuggestions' });
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
    <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl mb-6">
      <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center text-white">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600/80 to-slate-900 rounded-xl flex items-center justify-center mr-3 border border-white/5 shadow-lg">
              <i className="fas fa-brain text-white"></i>
            </div>
            <span className="text-sm font-black uppercase tracking-widest">Neural Pattern Discovery</span>
          </div>
          <Button
            onClick={handleGenerateSuggestions}
            disabled={isGenerating}
            variant="glass"
            className="h-10 px-6 border-indigo-500/20 hover:border-indigo-500/40 text-indigo-400"
          >
            <i className={`fas ${isGenerating ? 'fa-spinner fa-spin' : 'fa-satellite-dish'} mr-2`}></i>
            {isGenerating ? 'ANALYZING...' : 'DISCOVER PATTERNS'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 py-6">
        {suggestions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestions.map((suggestion, index) => (
              <div key={index} className="p-5 bg-slate-900/30 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-3xl rounded-full -mr-12 -mt-12 group-hover:bg-indigo-500/10 transition-all"></div>

                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h5 className="text-sm font-black text-white uppercase tracking-widest mb-2">{suggestion.name}</h5>
                    <p className="text-[11px] text-slate-400 font-medium leading-relaxed mb-4">{suggestion.description}</p>

                    <div className="flex items-center gap-3 mb-4">
                      <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${suggestion.priority === 'high' ? 'text-red-400 bg-red-400/10 border-red-400/20' :
                          suggestion.priority === 'medium' ? 'text-amber-400 bg-amber-400/10 border-amber-400/20' :
                            'text-indigo-400 bg-indigo-400/10 border-indigo-400/20'
                        }`}>
                        {suggestion.priority.toUpperCase()}
                      </div>
                      <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">
                        {suggestion.patternCount} MATCHING VECTORS
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-slate-900/50 rounded-xl border border-white/5">
                      <div className="flex items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        <i className="fas fa-route mr-2 text-indigo-500 opacity-50"></i>
                        {suggestion.suggestedRoute}
                      </div>
                      <div className="flex items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        <i className="fas fa-clock mr-2 text-indigo-500 opacity-50"></i>
                        {suggestion.suggestedTime}
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-500 font-bold italic tracking-wide mb-4 opacity-70">"{suggestion.reasoning}"</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                  <Button
                    size="sm"
                    onClick={() => handleCreateTemplate(suggestion)}
                    variant="glass"
                    className="flex-1 h-8 text-[10px] font-black uppercase tracking-widest border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400"
                  >
                    <i className="fas fa-file-export mr-2"></i>
                    Deploy Template
                  </Button>
                  <Button
                    size="sm"
                    variant="glass"
                    className="h-8 border-white/5 text-slate-500 text-[10px] font-black uppercase tracking-widest px-4"
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 px-6 bg-slate-900/20 rounded-2xl border border-dashed border-white/5">
            <div className="w-16 h-16 bg-slate-900/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
              <i className="fas fa-wave-square text-3xl text-slate-700"></i>
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Neural Pattern Scanners Offline</p>
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em]">Initiate pattern discovery to analyze historical patrol telemetry</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
