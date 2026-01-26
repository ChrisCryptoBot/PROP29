/**
 * Guest Safety - Incidents Tab
 * Displays and manages guest safety incidents
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { Badge } from '../../../../components/UI/Badge';
import { useGuestSafetyContext } from '../../context/GuestSafetyContext';
import { useGlobalRefresh } from '../../../../contexts/GlobalRefreshContext';
import { getPriorityBadgeClass, getStatusBadgeClass } from '../../utils/badgeHelpers';
import { cn } from '../../../../utils/cn';
import { EmptyState } from '../../../../components/UI/EmptyState';
import type { GuestIncident } from '../../types/guest-safety.types';

function formatRefreshedAgo(d: Date | null): string {
  if (!d) return '';
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return 'Just now';
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

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
    hardwareDevices,
    hardwareStatus,
    agentMetrics,
    resolveIncident,
    refreshIncidents,
  } = useGuestSafetyContext();
  const { lastRefreshedAt } = useGlobalRefresh();

  const [activeFilter, setActiveFilter] = useState<'all' | 'reported' | 'responding' | 'resolved'>('all');
  const [lastRefreshAt, setLastRefreshAt] = useState<Date | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const isStale = !lastRefreshAt || Date.now() - lastRefreshAt.getTime() > 30000;

  const handleManualRefresh = useCallback(async () => {
    try {
      await refreshIncidents();
      setLastRefreshAt(new Date());
      setRefreshError(null);
    } catch (error) {
      setRefreshError('Refresh failed. Showing last known state.');
    }
  }, [refreshIncidents]);

  useEffect(() => {
    const refresh = () => {
      refreshIncidents()
        .then(() => {
          setLastRefreshAt(new Date());
          setRefreshError(null);
        })
        .catch(() => {
          setRefreshError('Auto-refresh failed. Showing last known state.');
        });
    };
    refresh();
    const intervalId = window.setInterval(refresh, 30000); // Refresh every 30 seconds
    return () => {
      window.clearInterval(intervalId);
    };
  }, [refreshIncidents]);

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

  const getSourceBadge = (incident: GuestIncident) => {
    const source = incident.source || 'MANAGER';
    const sourceMetadata = incident.sourceMetadata || {};
    
    switch (source) {
      case 'MOBILE_AGENT':
        const trustScore = sourceMetadata.agentTrustScore;
        const isHighTrust = trustScore && trustScore >= 80;
        return {
          icon: 'fa-mobile-alt',
          label: 'Agent',
          color: isHighTrust 
            ? 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30'
            : 'text-blue-400 bg-blue-500/20 border-blue-500/30',
          tooltip: sourceMetadata.agentName 
            ? `Submitted by ${sourceMetadata.agentName}${trustScore ? ` (Trust: ${trustScore}%)` : ''}${isHighTrust ? ' - Auto-approved' : ''}`
            : 'Submitted by mobile agent'
        };
      case 'HARDWARE_DEVICE':
        return {
          icon: 'fa-video',
          label: 'Device',
          color: 'text-purple-400 bg-purple-500/20 border-purple-500/30',
          tooltip: sourceMetadata.deviceName 
            ? `Detected by ${sourceMetadata.deviceName}`
            : 'Detected by hardware device'
        };
      case 'GUEST_PANIC_BUTTON':
        return {
          icon: 'fa-exclamation-circle',
          label: 'Panic',
          color: 'text-red-400 bg-red-500/20 border-red-500/30',
          tooltip: 'Guest panic button activation'
        };
      default:
        return {
          icon: 'fa-user-shield',
          label: 'Manager',
          color: 'text-slate-400 bg-white/5 border-white/5',
          tooltip: 'Manually created by manager'
        };
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-black text-[color:var(--text-main)] uppercase tracking-tighter">Incidents</h2>
          <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic opacity-70">
            Guest safety incident management and response coordination
          </p>
        </div>
        <div className="flex items-center gap-4">
          {lastRefreshedAt && (
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest" aria-live="polite">
              Data as of {lastRefreshedAt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })} · Refreshed {formatRefreshedAgo(lastRefreshedAt)}
            </p>
          )}
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "h-10 px-3 rounded-full border flex items-center text-[9px] font-black uppercase tracking-widest",
                isStale
                  ? "bg-red-500/10 text-red-400 border-red-500/20"
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              )}
              aria-label={isStale ? 'Live data stale' : 'Live data synced'}
            >
              {isStale ? 'STALE' : 'LIVE'}
            </span>
            <Button
              variant="outline"
              onClick={handleManualRefresh}
              className="h-10 border-white/5 text-[10px] font-black uppercase tracking-widest"
              aria-label="Refresh incidents"
              disabled={loading.incidents}
            >
              <i className={cn("fas fa-rotate-right mr-2", loading.incidents && "animate-spin")} aria-hidden="true" />
              Refresh
            </Button>
          </div>
          {/* Hardware & Agent Status Indicators */}
          <div className="flex items-center space-x-3">
          {hardwareDevices.length > 0 && (
            <div className="flex items-center space-x-1 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded">
              <i className="fas fa-microchip text-orange-400 text-xs" />
              <span className="text-[9px] text-orange-300 font-black uppercase tracking-widest">
                {hardwareDevices.filter((d: any) => d.status === 'online').length}/{hardwareDevices.length} Devices
              </span>
            </div>
          )}
          {agentMetrics.length > 0 && agentMetrics[0] && (
            <div className="flex items-center space-x-1 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded">
              <i className="fas fa-mobile-alt text-blue-400 text-xs" />
              <span className="text-[9px] text-blue-300 font-black uppercase tracking-widest">
                {agentMetrics[0].activeAgents || 0}/{agentMetrics[0].totalAgents || 0} Agents
              </span>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" role="group" aria-label="Guest Safety key metrics">
        <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl group">
          <CardContent className="pt-6 px-6 pb-6 relative">
            <div className="absolute top-4 right-4">
              <span className="px-2 py-0.5 text-[9px] font-black tracking-widest text-red-400 bg-red-500/10 border border-red-500/20 rounded uppercase">Critical</span>
            </div>
            <div className="flex items-center justify-between mb-4 mt-2">
              <div className="w-12 h-12 bg-gradient-to-br from-red-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5 group-hover:scale-110 transition-transform">
                <i className="fas fa-exclamation-triangle text-white text-lg" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Critical Incidents</p>
              <h3 className="text-3xl font-black text-white" aria-label={`Critical incidents: ${metrics.critical}`}>
                {metrics.critical}
              </h3>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-slate-400">Active priority incidents</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl group">
          <CardContent className="pt-6 px-6 pb-6 relative">
            <div className="absolute top-4 right-4">
              <span className="px-2 py-0.5 text-[9px] font-black tracking-widest text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded uppercase">High</span>
            </div>
            <div className="flex items-center justify-between mb-4 mt-2">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5 group-hover:scale-110 transition-transform">
                <i className="fas fa-exclamation-circle text-white text-lg" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">High Priority</p>
              <h3 className="text-3xl font-black text-white" aria-label={`High priority incidents: ${metrics.high}`}>
                {metrics.high}
              </h3>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-slate-400">Elevated safety risks</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl group">
          <CardContent className="pt-6 px-6 pb-6 relative">
            <div className="absolute top-4 right-4">
              <span className="px-2 py-0.5 text-[9px] font-black tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded uppercase">Resolved</span>
            </div>
            <div className="flex items-center justify-between mb-4 mt-2">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5 group-hover:scale-110 transition-transform">
                <i className="fas fa-check-circle text-white text-lg" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Resolved Today</p>
              <h3 className="text-3xl font-black text-white" aria-label={`Resolved today: ${metrics.resolvedToday}`}>
                {metrics.resolvedToday}
              </h3>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-slate-400">Completed today</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl group">
          <CardContent className="pt-6 px-6 pb-6 relative">
            <div className="absolute top-4 right-4">
              <span className="px-2 py-0.5 text-[9px] font-black tracking-widest text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded uppercase">Active</span>
            </div>
            <div className="flex items-center justify-between mb-4 mt-2">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5 group-hover:scale-110 transition-transform">
                <i className="fas fa-clock text-white text-lg" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Avg Response Time</p>
              <h3 className="text-3xl font-black text-white" aria-label={`Average response time: ${metrics.avgResponseTime}`}>
                {metrics.avgResponseTime}
              </h3>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-slate-400">Average response time</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl overflow-hidden">
        <CardHeader className="bg-white/5 border-b border-white/5 py-4">
          <CardTitle className="flex items-center text-xl font-black uppercase tracking-tighter text-white">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center mr-3 border border-white/5 shadow-2xl" aria-hidden="true">
              <i className="fas fa-exclamation-triangle text-white text-lg" />
            </div>
            Incidents
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
                activeFilter === 'all' ? "bg-blue-600 hover:bg-blue-700" : "bg-white/5 border-white/5 hover:bg-white/10"
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
                activeFilter === 'reported' ? "bg-blue-600 hover:bg-blue-700" : "bg-white/5 border-white/5 hover:bg-white/10"
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
                activeFilter === 'responding' ? "bg-blue-600 hover:bg-blue-700" : "bg-white/5 border-white/5 hover:bg-white/10"
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
                activeFilter === 'resolved' ? "bg-blue-600 hover:bg-blue-700" : "bg-white/5 border-white/5 hover:bg-white/10"
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
                className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl hover:bg-slate-900/70 transition-all cursor-pointer group rounded-xl overflow-hidden"
                onClick={() => setSelectedIncident(incident)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-black text-white uppercase tracking-tighter text-lg group-hover:text-blue-400 transition-colors">{incident.guestName}</h4>
                    <span className={cn("px-2.5 py-1 text-[10px] font-black rounded uppercase tracking-widest border", getPriorityBadgeClass(incident.priority))}>
                      {incident.priority}
                    </span>
                  </div>

                  <div className="space-y-2 mb-6 bg-slate-900/30 p-3 rounded-xl border border-white/5">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-slate-500">Room:</span>
                      <span className="text-white">{incident.guestRoom}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-slate-500">Type:</span>
                      <span className="text-white">{incident.type}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-slate-500">Status:</span>
                      <span className={getStatusBadgeClass(incident.status)}>{incident.status}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-slate-500">Reported:</span>
                      <span className="text-white">{incident.reportedTime}</span>
                    </div>
                    {incident.source && (() => {
                      const sourceBadge = getSourceBadge(incident);
                      const isAutoApproved = incident.source === 'MOBILE_AGENT' && 
                        (incident.sourceMetadata?.agentTrustScore || 0) >= 80;
                      return (
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest pt-2 border-t border-white/5">
                          <span className="text-slate-500">Source:</span>
                          <div className="flex items-center space-x-2">
                            <span className={cn("px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border", sourceBadge.color)} title={sourceBadge.tooltip}>
                              <i className={cn("fas", sourceBadge.icon, "mr-1")} />
                              {sourceBadge.label}
                            </span>
                            {isAutoApproved && (
                              <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20" title="Auto-approved based on agent trust score">
                                <i className="fas fa-check-circle mr-1" />
                                Auto
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <p className="text-slate-300 text-xs mb-6 leading-relaxed line-clamp-2">
                    {incident.description}
                  </p>

                  <div className="flex gap-3">
                    <Button
                      size="sm"
                      className="flex-1 font-black uppercase tracking-widest text-[10px] bg-blue-600 hover:bg-blue-700 text-white border-none"
                      disabled={incident.status === 'resolved'}
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (incident.status === 'reported' && canAssignTeam) {
                          setSelectedIncident(incident);
                          setShowAssignTeamModal(true);
                        } else if (incident.status === 'responding' && canResolveIncident) {
                          try {
                            await resolveIncident(incident.id);
                          } catch (error) {
                            // Error handled by hook
                          }
                        } else {
                          setSelectedIncident(incident);
                        }
                      }}
                    >
                      {incident.status === 'reported' ? 'Assign Team' : incident.status === 'responding' ? 'Resolve' : 'Resolved'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 font-black uppercase tracking-widest text-[10px] border-white/5 text-slate-400 hover:bg-white/5 hover:text-white"
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
                  title="No incidents found"
                  description="No active incident reports at this time"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


