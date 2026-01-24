/**
 * Guest Safety - Incidents Tab
 * Displays and manages guest safety incidents
 */

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { Badge } from '../../../../components/UI/Badge';
import { useGuestSafetyContext } from '../../context/GuestSafetyContext';
import { getPriorityBadgeClass, getStatusBadgeClass } from '../../utils/badgeHelpers';
import { cn } from '../../../../utils/cn';
import { EmptyState } from '../../../../components/UI/EmptyState';

export const IncidentsTab: React.FC = () => {
  const {
    incidents,
    loading,
    setSelectedIncident,
    metrics,
    canAssignTeam,
    canResolveIncident,
    setShowAssignTeamModal,
    setShowSendMessageModal,
  } = useGuestSafetyContext();

  const [activeFilter, setActiveFilter] = useState<'all' | 'reported' | 'responding' | 'resolved'>('all');

  const filteredIncidents = useMemo(() => {
    if (activeFilter === 'all') return incidents;
    return incidents.filter(incident => incident.status === activeFilter);
  }, [incidents, activeFilter]);

  if (loading.incidents && incidents.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-white/5 border-t-blue-500 rounded-full animate-spin shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" role="group" aria-label="Guest Safety key metrics">
        <Card className="glass-card border-glass bg-[color:var(--surface-card)]/50 shadow-console group border border-white/5" role="article">
          <CardContent className="pt-6 px-6 pb-6 relative">
            <div className="absolute top-4 right-4 text-[10px] font-black uppercase tracking-widest text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded shadow-sm">
              Critical
            </div>
            <div className="flex items-center justify-between mb-4 mt-2">
              <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center shadow-lg shadow-red-500/20 ring-1 ring-white/10 group-hover:scale-110 transition-all duration-300" aria-hidden="true">
                <i className="fas fa-exclamation-triangle text-white text-xl drop-shadow-sm" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-[color:var(--text-sub)]">Critical Incidents</p>
              <h3 className="text-3xl font-black tracking-tighter text-white" aria-label={`Critical incidents: ${metrics.critical}`}>
                {metrics.critical}
              </h3>
              <p className="text-[10px] font-medium uppercase tracking-widest text-[color:var(--text-sub)] opacity-50">Active Priority Reports</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-glass bg-[color:var(--surface-card)]/50 shadow-console group border border-white/5" role="article">
          <CardContent className="pt-6 px-6 pb-6 relative">
            <div className="absolute top-4 right-4 text-[10px] font-black uppercase tracking-widest text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded shadow-sm">
              High
            </div>
            <div className="flex items-center justify-between mb-4 mt-2">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-orange-800 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/20 ring-1 ring-white/10 group-hover:scale-110 transition-all duration-300" aria-hidden="true">
                <i className="fas fa-exclamation-circle text-white text-xl drop-shadow-sm" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-[color:var(--text-sub)]">High Priority</p>
              <h3 className="text-3xl font-black tracking-tighter text-white" aria-label={`High priority incidents: ${metrics.high}`}>
                {metrics.high}
              </h3>
              <p className="text-[10px] font-medium uppercase tracking-widest text-[color:var(--text-sub)] opacity-50">Elevated Safety Risks</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-glass bg-[color:var(--surface-card)]/50 shadow-console group border border-white/5" role="article">
          <CardContent className="pt-6 px-6 pb-6 relative">
            <div className="absolute top-4 right-4 text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded shadow-sm">
              Resolved
            </div>
            <div className="flex items-center justify-between mb-4 mt-2">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-white/10 group-hover:scale-110 transition-all duration-300" aria-hidden="true">
                <i className="fas fa-check-circle text-white text-xl drop-shadow-sm" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-[color:var(--text-sub)]">Resolved Today</p>
              <h3 className="text-3xl font-black tracking-tighter text-white" aria-label={`Resolved today: ${metrics.resolvedToday}`}>
                {metrics.resolvedToday}
              </h3>
              <p className="text-[10px] font-medium uppercase tracking-widest text-[color:var(--text-sub)] opacity-50">Secured Records Sync</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-glass bg-[color:var(--surface-card)]/50 shadow-console group border border-white/5" role="article">
          <CardContent className="pt-6 px-6 pb-6 relative">
            <div className="absolute top-4 right-4 text-[10px] font-black uppercase tracking-widest text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded shadow-sm">
              Active
            </div>
            <div className="flex items-center justify-between mb-4 mt-2">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-900 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/10 group-hover:scale-110 transition-all duration-300" aria-hidden="true">
                <i className="fas fa-clock text-white text-xl drop-shadow-sm" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-[color:var(--text-sub)]">Avg Response Time</p>
              <h3 className="text-3xl font-black tracking-tighter text-white" aria-label={`Average response time: ${metrics.avgResponseTime}`}>
                {metrics.avgResponseTime}
              </h3>
              <p className="text-[10px] font-medium uppercase tracking-widest text-[color:var(--text-sub)] opacity-50">Metric Performance Data</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card border-glass bg-transparent shadow-console overflow-hidden">
        <CardHeader className="bg-white/5 border-b border-white/5 py-4">
          <CardTitle className="flex items-center text-xl font-black uppercase tracking-tighter text-white">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center mr-3 shadow-lg ring-1 ring-white/10" aria-hidden="true">
              <i className="fas fa-exclamation-triangle text-white text-lg" />
            </div>
            Safety Incident Registry
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 px-6 pb-6">
          {/* Filter Buttons */}
          <div className="flex gap-2 mb-8">
            <Button
              variant={activeFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setActiveFilter('all')}
              size="sm"
              className={cn(
                "font-black uppercase tracking-widest text-[10px] px-6",
                activeFilter === 'all' && "bg-blue-600 shadow-lg shadow-blue-500/20"
              )}
            >
              All Incidents
            </Button>
            <Button
              variant={activeFilter === 'reported' ? 'default' : 'outline'}
              onClick={() => setActiveFilter('reported')}
              size="sm"
              className={cn(
                "font-black uppercase tracking-widest text-[10px] px-6",
                activeFilter === 'reported' && "bg-blue-600 shadow-lg shadow-blue-500/20"
              )}
            >
              Reported
            </Button>
            <Button
              variant={activeFilter === 'responding' ? 'default' : 'outline'}
              onClick={() => setActiveFilter('responding')}
              size="sm"
              className={cn(
                "font-black uppercase tracking-widest text-[10px] px-6",
                activeFilter === 'responding' && "bg-blue-600 shadow-lg shadow-blue-500/20"
              )}
            >
              Responding
            </Button>
            <Button
              variant={activeFilter === 'resolved' ? 'default' : 'outline'}
              onClick={() => setActiveFilter('resolved')}
              size="sm"
              className={cn(
                "font-black uppercase tracking-widest text-[10px] px-6",
                activeFilter === 'resolved' && "bg-blue-600 shadow-lg shadow-blue-500/20"
              )}
            >
              Resolved
            </Button>
          </div>

          {/* Incidents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredIncidents.map((incident) => (
              <Card
                key={incident.id}
                className="bg-white/5 border border-white/5 shadow-inner hover:bg-white/[0.08] transition-all cursor-pointer group rounded-2xl overflow-hidden"
                onClick={() => setSelectedIncident(incident)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-black text-white uppercase tracking-tighter text-lg group-hover:text-blue-400 transition-colors">{incident.guestName}</h4>
                    <span className={cn("px-2.5 py-1 text-[10px] font-black rounded uppercase tracking-widest border", getPriorityBadgeClass(incident.priority))}>
                      {incident.priority}
                    </span>
                  </div>

                  <div className="space-y-2 mb-6 bg-black/40 p-3 rounded-xl border border-white/5 shadow-inner">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-[color:var(--text-sub)]">
                      <span className="opacity-50 text-white italic">Room Locator:</span>
                      <span className="text-white">{incident.guestRoom}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-[color:var(--text-sub)]">
                      <span className="opacity-50 text-white italic">Incident Type:</span>
                      <span className="text-white">{incident.type}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-[color:var(--text-sub)]">
                      <span className="opacity-50 text-white italic">Operational Status:</span>
                      <span className={getStatusBadgeClass(incident.status)}>{incident.status}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-[color:var(--text-sub)]">
                      <span className="opacity-50 text-white italic">Telemetry Sync:</span>
                      <span className="text-white">{incident.reportedTime}</span>
                    </div>
                  </div>

                  <p className="text-[color:var(--text-sub)] text-xs mb-6 leading-relaxed line-clamp-2 italic opacity-80">
                    "{incident.description}"
                  </p>

                  <div className="flex gap-3">
                    <Button
                      size="sm"
                      className="flex-1 font-black uppercase tracking-widest text-[10px] bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 border-none"
                      disabled={incident.status === 'resolved'}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (incident.status === 'reported' && canAssignTeam) {
                          setSelectedIncident(incident);
                          setShowAssignTeamModal(true);
                        } else if (incident.status === 'responding' && canResolveIncident) {
                          setSelectedIncident(incident);
                        }
                      }}
                    >
                      {incident.status === 'reported' ? 'Assign Team' : incident.status === 'responding' ? 'View Details' : 'Resolved'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 font-black uppercase tracking-widest text-[10px] border-white/10 text-[color:var(--text-sub)] hover:bg-white/5 hover:text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedIncident(incident);
                        setShowSendMessageModal(true);
                      }}
                    >
                      Message
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredIncidents.length === 0 && (
              <div className="col-span-full">
                <EmptyState
                  icon="fas fa-shield-heart"
                  title="No incidents detected"
                  description="Safety monitoring operational. No active incident reports or safety alerts found in the current sector registry."
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


