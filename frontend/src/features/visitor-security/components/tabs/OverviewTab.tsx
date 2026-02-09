/**
 * Overview Tab
 * Main overview view with metrics and recent visitors
 */

import React from 'react';
import { Button } from '../../../../components/UI/Button';
import { useVisitorContext } from '../../context/VisitorContext';
import { useGlobalRefresh } from '../../../../contexts/GlobalRefreshContext';
import { useVisitorDataStaleness } from '../../hooks/useVisitorDataStaleness';
import { VisitorListItem, StatusBadge } from '../shared';
import { Avatar } from '../../../../components/UI/Avatar';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { cn } from '../../../../utils/cn';
import { formatLocationDisplay } from '../../utils/formatLocation';

function formatRefreshedAgo(d: Date | null): string {
  if (!d) return '';
  const now = Date.now();
  const sec = Math.floor((now - d.getTime()) / 1000);
  if (sec < 60) return 'Just now';
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export const OverviewTab: React.FC = React.memo(() => {
  const {
    metrics,
    filteredVisitors,
    loading,
    lastSynced,
    setSelectedVisitor,
    setShowQRModal,
    setShowRegisterModal,
    mobileAgentDevices,
    hardwareDevices,
    systemConnectivity,
    refreshSystemStatus
  } = useVisitorContext();
  const { lastRefreshedAt } = useGlobalRefresh();
  const stalenessInfo = useVisitorDataStaleness(lastSynced);

  if (loading.visitors && filteredVisitors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12" role="status" aria-label="Loading dashboard">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest animate-pulse">Synchronizing dashboard signals...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {stalenessInfo.shouldWarn && (
        <div className="bg-amber-500/20 border border-amber-500/50 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <i className="fas fa-exclamation-triangle text-amber-400 text-lg" aria-hidden />
            <div>
              <p className="text-sm font-black text-amber-400 uppercase tracking-widest">Stale data</p>
              <p className="text-xs text-amber-300 mt-1">
                Data last synced {stalenessInfo.stalenessMessage}. Refresh or check connection.
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Page Header - Gold Standard */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="page-title">Overview</h2>
          <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic">
            Live visitor metrics, mobile agent status, and hardware integration monitoring.
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {lastRefreshedAt && (
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest" aria-live="polite">
              Data as of {lastRefreshedAt.toLocaleTimeString()} · {formatRefreshedAgo(lastRefreshedAt)}
            </p>
          )}
          <div className="flex items-center space-x-1 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded">
            <i className="fas fa-mobile-alt text-blue-400 text-xs" />
            <span className="text-[9px] text-blue-300">
              {mobileAgentDevices.filter(a => a.status === 'online').length}/{mobileAgentDevices.length} Agents
            </span>
          </div>
          <div className="flex items-center space-x-1 px-2 py-1 bg-orange-500/10 border border-orange-500/20 rounded">
            <i className="fas fa-microchip text-orange-400 text-xs" />
            <span className="text-[9px] text-orange-300">
              {hardwareDevices.filter(d => d.status === 'online').length}/{hardwareDevices.length} Hardware
            </span>
          </div>
          <div className="flex items-center space-x-1 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded">
            <i className={`fas ${systemConnectivity?.network_status === 'online' ? 'fa-wifi text-green-400' : 'fa-exclamation-triangle text-red-400'} text-xs`} />
            <span className={cn(
              "text-[9px]",
              systemConnectivity?.network_status === 'online' ? "text-green-300" : "text-red-300"
            )}>
              {systemConnectivity?.network_status || 'Checking...'}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshSystemStatus()}
            disabled={loading.systemStatus}
            className="text-[9px] font-black uppercase tracking-widest border-white/5 text-[color:var(--text-sub)] hover:bg-white/5"
          >
            <i className={cn("fas fa-sync-alt mr-1", loading.systemStatus && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Compact metrics bar (gold standard) */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-bold uppercase tracking-widest text-[color:var(--text-sub)] mb-6" role="group" aria-label="Visitor metrics">
        <span>Registered <strong className="font-black text-white">{metrics?.total || 0}</strong> · Check-ins <strong className="font-black text-white">{metrics?.checked_in || 0}</strong> · Clearances <strong className="font-black text-white">{metrics?.security_requests || 0}</strong> · Events <strong className="font-black text-white">{metrics?.active_events || 0}</strong></span>
      </div>

      {/* Mobile Agent Status (section per gold standard) */}
      <section aria-labelledby="vs-agent-status-heading" className="mb-6">
        <h3 id="vs-agent-status-heading" className="text-sm font-black uppercase tracking-widest text-[color:var(--text-main)] mb-4">Mobile Agent Status</h3>
        {mobileAgentDevices.length === 0 ? (
          <EmptyState
            icon="fas fa-mobile-alt"
            title="No Mobile Agents Connected"
            description="Register mobile patrol agent devices to monitor real-time visitor activity."
            className="bg-black/20 border-dashed border-2 border-white/5"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mobileAgentDevices.map((agent) => (
              <div
                key={agent.agent_id}
                className="p-4 rounded-md border border-white/5 bg-slate-900/30 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-white">{agent.agent_name || `Agent ${agent.agent_id.slice(0, 6)}`}</h4>
                  <span className={cn(
                    "px-2 py-1 text-[8px] font-bold uppercase tracking-wider rounded",
                    agent.status === 'online' ? "text-green-300 bg-green-500/20 border border-green-500/30" :
                    agent.status === 'offline' ? "text-red-300 bg-red-500/20 border border-red-500/30" :
                    agent.status === 'syncing' ? "text-blue-300 bg-blue-500/20 border border-blue-500/30" :
                    "text-orange-300 bg-orange-500/20 border border-orange-500/30"
                  )}>
                    {agent.status}
                  </span>
                </div>
                <div className="space-y-1 text-[10px] text-[color:var(--text-sub)]">
                  <div className="flex items-center justify-between">
                    <span>Last Sync:</span>
                    <span className="font-mono text-white">{agent.last_sync ? new Date(agent.last_sync).toLocaleTimeString() : 'Never'}</span>
                  </div>
                  {agent.battery_level != null && (
                    <div className="flex items-center justify-between">
                      <span>Battery:</span>
                      <span className="font-mono text-white">{agent.battery_level}%</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Site Access Log (section per gold standard) */}
      <section aria-labelledby="vs-access-log-heading">
        <div className="flex items-center justify-between mb-4">
          <h3 id="vs-access-log-heading" className="text-sm font-black uppercase tracking-widest text-white">Site Access Log</h3>
          <Button
            onClick={() => setShowRegisterModal(true)}
            variant="glass"
            className="text-xs font-black uppercase tracking-widest px-6"
          >
            <i className="fas fa-user-plus mr-2" />
            Register Visitor
          </Button>
        </div>
        <div>
          {filteredVisitors.length === 0 ? (
            <EmptyState
              icon="fas fa-users-slash"
              title="No Active Visitor Records"
              description="Initialize a new registration to begin security monitoring of on-site personnel."
              className="bg-black/20 border-dashed border-2 border-white/5"
              action={{
                label: "REGISTER VISITOR",
                onClick: () => setShowRegisterModal(true),
                variant: 'outline'
              }}
            />
          ) : (
            <div className="space-y-3 mt-4">
              {filteredVisitors.slice(0, 5).map(visitor => {
                // Enhanced source detection for mobile agent integration
                const hasMobileAgentSource = visitor.source_metadata && 
                  typeof visitor.source_metadata === 'object' && 
                  'mobile_agent_id' in visitor.source_metadata;
                
                const hasHardwareSource = visitor.badge_id || visitor.source_metadata?.card_reader_id;
                
                return (
                  <div
                    key={visitor.id}
                    className="flex items-center justify-between p-4 rounded-md border border-white/5 bg-[color:var(--console-dark)]/20 hover:bg-white/5 hover:border-blue-500/30 transition-colors group"
                  >
                    <div className="flex items-center space-x-4">
                      <Avatar className="bg-blue-600 border border-white/5">
                        {visitor.first_name[0]}{visitor.last_name[0]}
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-[color:var(--text-main)] group-hover:text-blue-400 transition-colors">
                            {visitor.first_name} {visitor.last_name}
                          </h4>
                          {/* PRODUCTION READINESS: Source Indicators */}
                          {hasMobileAgentSource && (
                            <span className="px-2 py-1 text-[8px] font-bold uppercase tracking-wider rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                              <i className="fas fa-mobile-alt mr-1" />
                              Mobile
                            </span>
                          )}
                          {hasHardwareSource && (
                            <span className="px-2 py-1 text-[8px] font-bold uppercase tracking-wider rounded bg-orange-500/10 text-orange-300 border border-orange-500/20">
                              <i className="fas fa-credit-card mr-1" />
                              Card Reader
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[color:var(--text-sub)]/70 italic">
                          {visitor.purpose} <span className="mx-1 opacity-30">•</span> {formatLocationDisplay(visitor.location)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <StatusBadge status={visitor.status} />
                      {visitor.qr_code && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedVisitor(visitor);
                            setShowQRModal(true);
                          }}
                          className="text-[10px] font-black uppercase tracking-widest px-3 text-[color:var(--text-sub)] border-white/5 hover:text-[color:var(--text-main)]"
                        >
                          <i className="fas fa-qrcode" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
});

OverviewTab.displayName = 'OverviewTab';
