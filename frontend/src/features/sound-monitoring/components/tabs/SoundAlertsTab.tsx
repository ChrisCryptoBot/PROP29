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
      <Card className="bg-slate-900/50 border border-white/5">
        <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
          <CardTitle className="flex items-center">
            <div className="w-10 h-10 bg-red-600 rounded-md flex items-center justify-center mr-3 border border-white/5" aria-hidden>
              <i className="fas fa-exclamation-triangle text-white" />
            </div>
            <span className="text-sm font-black uppercase tracking-widest text-white">Sound alerts</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 py-6">
          {loading.alerts && soundAlerts.length === 0 ? (
            <div className="text-center py-12">
              <i className="fas fa-spinner fa-spin text-3xl text-slate-400 mb-4" aria-hidden />
              <p className="text-slate-500">Loading alerts...</p>
            </div>
          ) : soundAlerts.length === 0 ? (
            <EmptyState
              icon="fas fa-exclamation-triangle"
              title="No sound alerts"
              description="No sound alerts in the current registry. Connect hardware or enable ingestion to see live data."
            />
          ) : (
            <div className="space-y-2">
              {soundAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
                  onClick={() => viewAlert(alert)}
                >
                  <div className="flex items-center space-x-5">
                    <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center border border-white/5">
                      <i className="fas fa-volume-up text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-widest">{alert.type}</h3>
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
                    <i className="fas fa-chevron-right text-slate-500 ml-4" aria-hidden />
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


