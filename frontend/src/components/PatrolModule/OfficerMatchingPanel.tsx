import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../UI/Card';
import { Button } from '../UI/Button';
import { Badge } from '../UI/Badge';
import { showLoading, dismissLoadingAndShowSuccess, showError } from '../../utils/toast';
import { patrolAI } from '../../services/PatrolAIService';
import { logger } from '../../services/logger';
import { formatLocationDisplay } from '../../utils/formatLocation';
import '../../styles/modern-glass.css';

interface Officer {
  id: string;
  name: string;
  status: 'on-duty' | 'off-duty' | 'break' | 'unavailable';
  location: string;
  specializations: string[];
  shift: 'Day' | 'Night' | 'Evening';
  experience: string;
  currentPatrol?: string;
  activePatrols: number;
}

interface Patrol {
  id: string;
  name: string;
  location: string;
  routeId?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  requiredSpecializations?: string[];
  estimatedDuration: string;
  description?: string;
}

interface Props {
  selectedPatrol: Patrol | null;
  officers: Officer[];
  onSelectOfficer?: (officerId: string) => void;
}

export const OfficerMatchingPanel: React.FC<Props> = ({ selectedPatrol, officers, onSelectOfficer }) => {
  const [matches, setMatches] = useState<any[]>([]);
  const [isMatching, setIsMatching] = useState(false);

  const handleMatchOfficers = async () => {
    if (!selectedPatrol) {
      showError('Please select a patrol first');
      return;
    }

    const toastId = showLoading('Finding best officer match...');
    setIsMatching(true);

    try {
      const officerMatches = await patrolAI.matchOfficerForPatrol(selectedPatrol, officers);
      setMatches(officerMatches);
      dismissLoadingAndShowSuccess(toastId, `Found ${officerMatches.length} officer match${officerMatches.length > 1 ? 'es' : ''}!`);
    } catch (error) {
      logger.error('Officer matching error', error instanceof Error ? error : new Error(String(error)), { module: 'OfficerMatchingPanel', action: 'handleMatchOfficers' });
      showError('Failed to find officer matches');
    } finally {
      setIsMatching(false);
    }
  };

  const handleSelectOfficer = (officerId: string) => {
    if (onSelectOfficer) {
      onSelectOfficer(officerId);
    }
  };

  const getMatchQuality = (score: number) => patrolAI.getMatchQuality(score);

  return (
    <Card className="bg-slate-900/50 border border-white/5">
      <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center text-white">
            <div className="w-10 h-10 bg-indigo-600 rounded-md flex items-center justify-center mr-3 border border-white/5">
              <i className="fas fa-microchip text-white"></i>
            </div>
            <span className="text-sm font-black uppercase tracking-widest">Logic Deployment Engine</span>
          </div>
          <Button
            onClick={handleMatchOfficers}
            disabled={isMatching || !selectedPatrol}
            variant="glass"
            className="h-10 px-6 border-indigo-500/20 hover:border-indigo-500/40 text-indigo-400"
          >
            <i className={`fas ${isMatching ? 'fa-spinner fa-spin' : 'fa-bolt'} mr-2`}></i>
            {isMatching ? 'ANALYZING...' : 'RUN MATCHING'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 py-6">
        {selectedPatrol && (
          <div className="mb-6 p-4 bg-slate-900/30 rounded-md border border-white/5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Target Vector</p>
            <p className="text-sm font-black text-white">{selectedPatrol.name}</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 italic">{formatLocationDisplay(selectedPatrol.location) || '—'}</p>
          </div>
        )}

        {matches.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">Recommended Operatives</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matches.map((match, index) => {
                const quality = getMatchQuality(match.matchScore);
                return (
                  <div key={match.officerId} className="p-4 bg-slate-900/30 rounded-md border border-white/5 hover:border-indigo-500/20 transition-all duration-300 group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${index === 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 ' : 'bg-white/5 text-slate-400 border-white/5'}`}>
                            #{index + 1} RECOMMENDED
                          </div>
                        </div>
                        <h5 className="font-black text-white text-sm uppercase tracking-widest mb-4">{match.officerName}</h5>
                        <div className="flex items-center gap-4 mb-4">
                          <div className="text-3xl font-black text-white">
                            {match.matchScore}<span className="text-xs text-slate-600">%</span>
                          </div>
                          <div className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            {quality.label.toUpperCase()} COMPATIBILITY
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-5">
                      {match.strengths.length > 0 && (
                        <div>
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Strengths</p>
                          <ul className="space-y-1.5">
                            {match.strengths.slice(0, 2).map((strength: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2">
                                <i className="fas fa-check-circle text-emerald-500 text-[10px] mt-0.5 opacity-50"></i>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{strength}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {match.considerations.length > 0 && (
                        <div>
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Vectors</p>
                          <ul className="space-y-1.5">
                            {match.considerations.slice(0, 2).map((consideration: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2">
                                <i className="fas fa-info-circle text-amber-500 text-[10px] mt-0.5 opacity-50"></i>
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{consideration}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
                      <Button
                        size="sm"
                        onClick={() => handleSelectOfficer(match.officerId)}
                        variant="glass"
                        className="flex-1 h-8 text-[10px] font-black uppercase tracking-widest border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400"
                      >
                        <i className="fas fa-bolt mr-2"></i>
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="glass"
                        className="h-8 w-8 p-0 border-white/5 text-slate-500"
                      >
                        <i className="fas fa-eye"></i>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!selectedPatrol && (
          <div className="text-center py-12 px-6 bg-slate-900/20 rounded-md border border-dashed border-white/5">
            <div className="w-16 h-16 bg-slate-900/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
              <i className="fas fa-hand-pointer text-3xl text-slate-700"></i>
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Neural Input Required</p>
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em]">Select a target vector to initialize operative compatibility matching</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
