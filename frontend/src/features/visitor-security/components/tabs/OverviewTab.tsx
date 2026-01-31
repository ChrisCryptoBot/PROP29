/**
 * Overview Tab
 * Main overview view with metrics and recent visitors
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { useVisitorContext } from '../../context/VisitorContext';
import { VisitorListItem, StatusBadge } from '../shared';
import { Avatar } from '../../../../components/UI/Avatar';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { cn } from '../../../../utils/cn';
import { formatLocationDisplay } from '../../utils/formatLocation';

export const OverviewTab: React.FC = React.memo(() => {
  const {
    metrics,
    filteredVisitors,
    loading,
    setSelectedVisitor,
    setShowQRModal,
    setShowRegisterModal,
    // Mobile Agent & Hardware Integration
    mobileAgentDevices,
    hardwareDevices,
    systemConnectivity,
    refreshSystemStatus
  } = useVisitorContext();

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
      {/* Page Header - Gold Standard */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-black text-[color:var(--text-main)] uppercase tracking-tighter">Overview</h2>
          <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic opacity-70">
            Live visitor metrics, mobile agent status, and hardware integration monitoring.
          </p>
        </div>
        
        {/* Live System Status Indicators */}
        <div className="flex items-center space-x-3">
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
            className="text-[9px] font-black uppercase tracking-widest border-white/5 text-slate-300 hover:bg-white/5"
          >
            <i className={cn("fas fa-sync-alt mr-1", loading.systemStatus && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics - Gold Standard Canonical Pattern (max 4 cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl group">
          <CardContent className="pt-6 px-6 pb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600/80 to-slate-900 border border-white/5 rounded-xl shadow-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <i className="fas fa-users text-white text-lg" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Registered Visitors</p>
              <h3 className="text-3xl font-black text-white">{metrics?.total || 0}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl group">
          <CardContent className="pt-6 px-6 pb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-600/80 to-slate-900 border border-white/5 rounded-xl shadow-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <i className="fas fa-check-circle text-white text-lg" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Active Check-ins</p>
              <h3 className="text-3xl font-black text-white">{metrics?.checked_in || 0}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl group">
          <CardContent className="pt-6 px-6 pb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-600/80 to-slate-900 border border-white/5 rounded-xl shadow-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <i className="fas fa-exclamation-triangle text-white text-lg" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Active Clearances</p>
              <h3 className="text-3xl font-black text-white">{metrics?.security_requests || 0}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl group">
          <CardContent className="pt-6 px-6 pb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600/80 to-slate-900 border border-white/5 rounded-xl shadow-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <i className="fas fa-calendar-alt text-white text-lg" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Monitored Events</p>
              <h3 className="text-3xl font-black text-white">{metrics?.active_events || 0}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Agent Status Overview */}
      <Card className="glass-card border border-white/5 shadow-2xl mb-6">
        <CardHeader>
          <CardTitle className="flex items-center text-xl text-white">
            <div className="w-10 h-10 bg-gradient-to-br from-green-600/80 to-slate-900 rounded-xl flex items-center justify-center mr-3 shadow-2xl border border-white/5">
              <i className="fas fa-user-shield text-white" />
            </div>
            <span className="uppercase tracking-tight">Mobile Agent Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                  className="p-4 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors"
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
                  <div className="space-y-1 text-[10px] text-slate-400">
                    <div className="flex items-center justify-between">
                      <span>Last Sync:</span>
                      <span className="font-mono">{agent.last_sync ? new Date(agent.last_sync).toLocaleTimeString() : 'Never'}</span>
                    </div>
                    {agent.battery_level && (
                      <div className="flex items-center justify-between">
                        <span>Battery:</span>
                        <span className={cn(
                          "font-mono",
                          agent.battery_level > 20 ? "text-green-400" : "text-red-400"
                        )}>
                          {agent.battery_level}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Visitors - Gold Standard Pattern */}
      <Card className="glass-card border border-white/5 shadow-2xl">
        <CardHeader className="px-6 pt-6 pb-4 border-b border-white/5">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-xl text-white font-black uppercase tracking-tighter">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600/80 to-slate-900 border border-white/5 rounded-xl shadow-2xl flex items-center justify-center mr-3">
                <i className="fas fa-shield-alt text-white text-sm" />
              </div>
              Site Access Log
            </CardTitle>
            <Button
              onClick={() => setShowRegisterModal(true)}
              variant="glass"
              className="text-xs font-black uppercase tracking-widest px-6"
            >
              <i className="fas fa-user-plus mr-2" />
              Register Visitor
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
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
                    className="flex items-center justify-between p-4 rounded-xl border border-[color:var(--border-subtle)]/10 bg-[color:var(--console-dark)]/20 hover:bg-[color:var(--border-subtle)]/10 hover:border-blue-500/30 transition-all group"
                  >
                    <div className="flex items-center space-x-4">
                      <Avatar className="bg-gradient-to-br from-blue-700 to-indigo-900 border border-white/5">
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
                          className="text-[10px] font-black uppercase tracking-widest px-3 text-[color:var(--text-sub)] border-[color:var(--border-subtle)] hover:text-[color:var(--text-main)]"
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
        </CardContent>
      </Card>
    </div>
  );
});

OverviewTab.displayName = 'OverviewTab';
