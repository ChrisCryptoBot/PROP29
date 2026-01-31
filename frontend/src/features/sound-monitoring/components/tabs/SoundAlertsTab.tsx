/**
 * Sound Monitoring - Sound Alerts Tab
 * Displays and manages sound alerts
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { useSoundMonitoringContext } from '../../context/SoundMonitoringContext';
import { getSeverityBadgeClass, getStatusBadgeClass } from '../../utils/badgeHelpers';
import { cn } from '../../../../utils/cn';
import { formatLocationDisplay } from '../../../../utils/formatLocation';
import { EmptyState } from '../../../../components/UI/EmptyState';

export const SoundAlertsTab: React.FC = () => {
  const {
    soundAlerts,
    acknowledgeAlert,
    resolveAlert,
    viewAlert,
    loading,
    canAcknowledgeAlert,
    canResolveAlert
  } = useSoundMonitoringContext();

  return (
    <div className="space-y-6">
      <Card className="glass-card border-glass bg-transparent shadow-console overflow-hidden">
        <CardHeader className="bg-white/5 border-b border-white/5 py-4">
          <CardTitle className="flex items-center text-xl font-black uppercase tracking-tighter text-white">
            <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center mr-3 shadow-lg ring-1 ring-white/10" aria-hidden="true">
              <i className="fas fa-exclamation-triangle text-white text-lg" />
            </div>
            Sound Alerts Registry
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading.alerts && soundAlerts.length === 0 ? (
            <div className="text-center py-12">
              <i className="fas fa-spinner fa-spin text-3xl text-slate-400 mb-4" />
              <p className="text-slate-600">Loading alerts...</p>
            </div>
          ) : soundAlerts.length === 0 ? (
            <EmptyState
              icon="fas fa-exclamation-triangle"
              title="No sound alerts found"
              description="Acoustic monitoring active. No anomalies detected in the current registry. Environmental decibel levels within normal range."
            />
          ) : (
            <div className="space-y-2">
              {soundAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/[0.08] transition-all cursor-pointer group shadow-inner"
                  onClick={() => viewAlert(alert)}
                >
                  <div className="flex items-center space-x-5">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center shadow-lg ring-1 ring-white/10 group-hover:scale-110 transition-transform">
                      <i className="fas fa-volume-up text-white text-xl" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white uppercase tracking-tighter group-hover:text-blue-400 transition-colors">{alert.type}</h3>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-50 text-[color:var(--text-sub)]">{formatLocationDisplay(alert.location as string | { lat?: number; lng?: number } | null) || '—'}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center">
                          <i className="fas fa-id-badge mr-1.5 opacity-40" />
                          {alert.assignedTo || "Unassigned"}
                        </p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center">
                          <i className="fas fa-stopwatch mr-1.5 opacity-40" />
                          {alert.responseTime ? `${alert.responseTime}s LATENCY` : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={cn("px-2.5 py-1 text-[10px] font-black rounded uppercase tracking-widest border", getSeverityBadgeClass(alert.severity))}>
                      {alert.severity}
                    </span>
                    <span className={cn("px-2.5 py-1 text-[10px] font-black rounded uppercase tracking-widest border", getStatusBadgeClass(alert.status))}>
                      {alert.status}
                    </span>
                    <div className="flex gap-2 ml-4">
                      {alert.status === 'active' && canAcknowledgeAlert && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            acknowledgeAlert(alert.id);
                          }}
                          disabled={loading.actions}
                          className="text-[10px] font-black uppercase tracking-widest border-blue-500/30 text-blue-300 hover:bg-blue-500/10 px-4"
                        >
                          Acknowledge
                        </Button>
                      )}
                      {alert.status === 'investigating' && canResolveAlert && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            resolveAlert(alert.id);
                          }}
                          disabled={loading.actions}
                          className="text-[10px] font-black uppercase tracking-widest border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 px-4"
                        >
                          Resolve
                        </Button>
                      )}
                    </div>
                    <i className="fas fa-chevron-right text-slate-700 group-hover:text-white transition-colors ml-4" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};


