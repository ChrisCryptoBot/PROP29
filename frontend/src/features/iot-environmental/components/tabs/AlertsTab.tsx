import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { cn } from '../../../../utils/cn';
import { formatLocationDisplay } from '../../../../utils/formatLocation';
import { useIoTEnvironmentalContext } from '../../context/IoTEnvironmentalContext';

interface AlertsTabProps {
  embedded?: boolean;
}

const AlertsTab: React.FC<AlertsTabProps> = ({ embedded }) => {
  const [snoozedSensors, setSnoozedSensors] = React.useState<string[]>([]);
  const {
    activeAlerts,
    alerts,
    handleAcknowledgeAlert,
    handleResolveAlert,
    getAlertSeverityBadge,
    getStatusBadgeClass,
  } = useIoTEnvironmentalContext();

  const resolvedAlerts = alerts.filter(a => a.resolved);

  return (
    <div className="space-y-6">
      {!embedded && (
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="page-title">Alerts</h2>
            <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic">
              Environmental sensor alerts and resolution
            </p>
          </div>
          <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-black uppercase tracking-widest rounded">
            Monitoring active
          </span>
        </div>
      )}

      <Card className="bg-slate-900/50 border border-white/5">
        <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
          <CardTitle className="flex items-center">
            <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center mr-3 border border-white/5">
              <i className="fas fa-bell text-white" aria-hidden />
            </div>
            <span className="text-sm font-black uppercase tracking-widest text-white">Alert management</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {activeAlerts.length === 0 ? (
            <EmptyState
              icon="fas fa-bell-slash"
              title="No active alerts"
              description="System monitoring active. No alerts detected across environmental sensors."
            />
          ) : (
            <div className="space-y-6">
              {/* Group Alerts by Sensor */}
              {Object.entries(
                activeAlerts
                  .filter(a => !snoozedSensors.includes(a.sensor_id))
                  .reduce((groups, alert) => {
                    const sensorId = alert.sensor_id || 'UNKNOWN';
                    if (!groups[sensorId]) groups[sensorId] = [];
                    groups[sensorId].push(alert);
                    return groups;
                  }, {} as Record<string, typeof activeAlerts>)
              ).map(([sensorId, sensorAlerts]) => (
                <div key={sensorId} className="bg-white/5 border border-white/5 rounded-md overflow-hidden">
                  {/* Group Header */}
                  <div className="px-4 py-3 bg-white/5 flex items-center justify-between border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-blue-600 flex items-center justify-center text-white border border-white/5">
                        <i className="fas fa-microchip" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">SENSOR: {sensorId}</h3>
                        <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">{sensorAlerts.length} ACTIVE {sensorAlerts.length === 1 ? 'ALERT' : 'ALERTS'}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSnoozedSensors(prev => [...prev, sensorId])}
                      className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/5"
                    >
                      <i className="fas fa-bell-slash mr-2" />
                      Snooze Sensor
                    </Button>
                  </div>

                  {/* Alerts List */}
                  <div className="divide-y divide-white/5">
                    {sensorAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={cn(
                          "p-4 flex items-start gap-4 transition-colors hover:bg-white/10",
                          alert.severity === 'critical' ? 'bg-red-500/5' : ''
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 shrink-0 rounded flex items-center justify-center mt-1",
                          alert.severity === 'critical' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'
                        )}>
                          <i className="fas fa-exclamation-triangle text-xs" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            {getAlertSeverityBadge(alert.severity)}
                            <span className={cn('px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded border', getStatusBadgeClass(alert.status))}>
                              {alert.status}
                            </span>
                            <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest ml-auto">
                              {new Date(alert.timestamp).toLocaleTimeString()}
                            </span>
                          </div>

                          <p className="text-sm font-bold text-white/90 uppercase tracking-tight leading-tight">
                            {alert.message}
                          </p>
                          <p className="text-[10px] text-white/40 mt-1 uppercase tracking-wider font-medium">
                            Location: {formatLocationDisplay(alert.location as string | { lat?: number; lng?: number } | null) || '—'}
                          </p>
                        </div>

                        <div className="flex flex-col gap-2 self-center">
                          {activeAlerts.find(a => a.id === alert.id)?.status === 'active' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleAcknowledgeAlert(alert.id)}
                              className="h-6 text-[8px] font-black uppercase tracking-widest bg-white/5 hover:bg-white/10"
                            >
                              ACKNOWLEDGE
                            </Button>
                          )}
                          {activeAlerts.find(a => a.id === alert.id)?.status === 'acknowledged' && (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleResolveAlert(alert.id)}
                              className="h-6 text-[8px] font-black uppercase tracking-widest"
                            >
                              RESOLVE
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Snoozed Sensors Section */}
          {snoozedSensors.length > 0 && (
            <div className="mt-8 border-t border-white/5 pt-6">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-4">Snoozed sensors ({snoozedSensors.length})</p>
              <div className="flex flex-wrap gap-2">
                {snoozedSensors.map(sensorId => (
                  <div key={sensorId} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/5 rounded-md hover:bg-white/10 transition-colors">
                    <i className="fas fa-microchip text-white/40 text-xs" />
                    <span className="text-xs font-bold text-white/70">{sensorId}</span>
                    <button
                      onClick={() => setSnoozedSensors(prev => prev.filter(id => id !== sensorId))}
                      className="ml-2 text-white/40 hover:text-white transition-colors"
                      aria-label="Unsnooze"
                    >
                      <i className="fas fa-times" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resolved Alerts Section */}
      {resolvedAlerts.length > 0 && (
        <div className="space-y-4 mt-8 pt-6 border-t border-white/5">
          <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center">
            <i className="fas fa-check-circle mr-2 text-emerald-500" aria-hidden />
            Resolved ({resolvedAlerts.length})
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {resolvedAlerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="p-4 bg-white/5 border border-white/5 rounded-md flex items-center justify-between hover:bg-white/10 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                      Resolved
                    </span>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                      {alert.id.slice(0, 8)}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white uppercase tracking-wider truncate">{alert.message}</p>
                </div>
                <div className="text-right ml-4">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Closed</p>
                  <p className="text-[10px] font-mono text-white">{alert.resolved_at ? new Date(alert.resolved_at).toLocaleTimeString() : '—'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


export default AlertsTab;


