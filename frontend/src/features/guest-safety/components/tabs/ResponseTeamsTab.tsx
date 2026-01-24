/**
 * Guest Safety - Response Teams Tab
 * Displays available response teams
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { Badge } from '../../../../components/UI/Badge';
import { useGuestSafetyContext } from '../../context/GuestSafetyContext';
import { getTeamStatusBadgeClass } from '../../utils/badgeHelpers';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { cn } from '../../../../utils/cn';

export const ResponseTeamsTab: React.FC = () => {
  const { teams, loading } = useGuestSafetyContext();

  if (loading.teams && teams.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-white/5 border-t-blue-500 rounded-full animate-spin shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card border-glass bg-transparent shadow-console overflow-hidden">
        <CardHeader className="bg-white/5 border-b border-white/5 py-4">
          <CardTitle className="flex items-center text-xl font-black uppercase tracking-tighter text-white">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-900 rounded-lg flex items-center justify-center mr-3 shadow-lg ring-1 ring-white/10" aria-hidden="true">
              <i className="fas fa-users text-white text-lg" />
            </div>
            Active Response Teams
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-8 px-8 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {teams.map((team) => (
              <Card
                key={team.id}
                className="bg-white/5 border border-white/5 shadow-inner hover:bg-white/[0.08] transition-all group rounded-2xl overflow-hidden text-center"
              >
                <CardContent className="p-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/20 ring-1 ring-white/10 group-hover:scale-110 transition-transform">
                    <span className="text-white font-black text-2xl tracking-tighter drop-shadow-sm">{team.avatar}</span>
                  </div>
                  <h4 className="font-black text-white uppercase tracking-tighter text-xl mb-1 group-hover:text-blue-400 transition-colors">{team.name}</h4>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-50 text-[color:var(--text-sub)] mb-6">{team.role}</p>
                  <div className="flex justify-center">
                    <span className={cn("px-4 py-1.5 text-[10px] font-black rounded-lg uppercase tracking-widest border shadow-sm", getTeamStatusBadgeClass(team.status))}>
                      {team.status}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {teams.length === 0 && (
              <div className="col-span-full">
                <EmptyState
                  icon="fas fa-users-slash"
                  title="No response teams found"
                  description="Acoustic monitoring active. No active response personnel currently synced with the regional deployment registry."
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

