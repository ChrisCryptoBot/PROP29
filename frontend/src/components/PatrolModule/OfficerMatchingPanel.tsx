import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../UI/Card';
import { Button } from '../UI/Button';
import { Badge } from '../UI/Badge';
import { showLoading, dismissLoadingAndShowSuccess, showError } from '../../utils/toast';
import { patrolAI } from '../../services/PatrolAIService';
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
      console.error('Officer matching error:', error);
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center mr-3">
            <i className="fas fa-brain text-white"></i>
          </div>
          AI Officer Matching
        </CardTitle>
      </CardHeader>
      <CardContent>
        {selectedPatrol && (
          <div className="mb-4 p-3 bg-slate-50 rounded-lg">
            <p className="text-sm font-medium text-slate-900">{selectedPatrol.name}</p>
            <p className="text-xs text-slate-600">{selectedPatrol.location}</p>
          </div>
        )}

        <Button
          onClick={handleMatchOfficers}
          disabled={isMatching || !selectedPatrol}
          className="!bg-[#2563eb] hover:!bg-blue-700 text-white mb-4"
        >
          <i className={`fas ${isMatching ? 'fa-spinner fa-spin' : 'fa-magic'} mr-2`}></i>
          {isMatching ? 'Matching...' : 'Find Best Match'}
        </Button>

        {matches.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Recommended Officers</h4>
            {matches.map((match, index) => {
              const quality = getMatchQuality(match.matchScore);
              return (
                <div key={match.officerId} className="p-4 bg-white rounded-lg border border-slate-200 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={`badge ${index === 0 ? 'badge-success' : index === 1 ? 'badge-info' : 'badge-secondary'}`}>
                          #{index + 1}
                        </Badge>
                        <h5 className="font-semibold text-slate-900">{match.officerName}</h5>
                      </div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="text-2xl font-bold" style={{ color: quality.color }}>
                          {match.matchScore}%
                        </div>
                        <Badge className="badge badge-info">{quality.label} Match</Badge>
                      </div>
                    </div>
                  </div>

                  {match.strengths.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-slate-700 mb-1">Strengths:</p>
                      <ul className="space-y-1">
                        {match.strengths.map((strength: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <i className="fas fa-check-circle text-green-600 text-xs mt-0.5"></i>
                            <span className="text-xs text-slate-700">{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {match.considerations.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-amber-700 mb-1">Considerations:</p>
                      <ul className="space-y-1">
                        {match.considerations.map((consideration: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <i className="fas fa-info-circle text-amber-600 text-xs mt-0.5"></i>
                            <span className="text-xs text-amber-700">{consideration}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-3">
                    <Button
                      size="sm"
                      onClick={() => handleSelectOfficer(match.officerId)}
                      className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
                    >
                      <i className="fas fa-check mr-1"></i>
                      Select Officer
                    </Button>
                    <Button size="sm" variant="outline">
                      <i className="fas fa-info-circle mr-1"></i>
                      View Details
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!selectedPatrol && (
          <div className="text-center py-8 text-slate-600">
            <i className="fas fa-hand-pointer text-3xl mb-3 text-slate-400"></i>
            <p className="text-sm">Select a patrol to find the best officer match</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

