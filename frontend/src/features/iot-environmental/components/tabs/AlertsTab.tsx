import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { cn } from '../../../../utils/cn';
import { formatLocationDisplay } from '../../../../utils/formatLocation';
import { useIoTEnvironmentalContext } from '../../context/IoTEnvironmentalContext';

const AlertsTab: React.FC = () => {
  const [snoozedSensors, setSnoozedSensors] = React.useState<string[]>([]);
  const navigate = useNavigate();
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
      {/* Alert Management Header */}
      <div className="bg-black/20 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl">
        <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
          <h2 className="text-lg font-black text-white uppercase tracking-tighter flex items-center">
            <i className="fas fa-bell mr-3 text-blue-500" />
            ALERT MANAGEMENT
          </h2>
          <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-500 text-[9px] font-black uppercase tracking-widest rounded-full">
            SYSTEM MONITORING ACTIVE
          </span>
        </div>

        <div className="p-6">
          {activeAlerts.length === 0 ? (
            <div className="text-center py-24 bg-black/20 rounded-[2.5rem] border border-dashed border-white/5 mx-4 group relative overflow-hidden transition-all duration-700 hover:bg-black/40">
              <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

              <div className="relative z-10">
                <div className="w-24 h-24 bg-white/5 border border-white/5 rounded-3xl flex items-center justify-center mx-auto mb-8 transition-all duration-700 group-hover:scale-110 group-hover:rotate-6 group-hover:border-blue-500/30 shadow-2xl relative">
                  <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                  <i className="fas fa-bell-slash text-4xl text-white/10 group-hover:text-blue-400 transition-all duration-500 relative z-10" />
                </div>

                <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-3">NO ACTIVE ALERTS</h3>
                <p className="text-sm text-white/40 max-w-md mx-auto uppercase tracking-[0.2em] font-bold leading-relaxed px-6">
                  System monitoring active. <br />
                  <span className="text-blue-500/60 mt-2 block">No active alerts detected across all zones.</span>
                </p>

                <div className="mt-10 flex justify-center space-x-2 animate-pulse">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-1 h-1 bg-blue-500/30 rounded-full" />
                  ))}
                </div>
              </div>
            </div>
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
                <div key={sensorId} className="bg-white/5 border border-white/5 rounded-xl overflow-hidden">
                  {/* Group Header */}
                  <div className="px-4 py-3 bg-white/5 flex items-center justify-between border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center text-blue-400">
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
                          "p-4 flex items-start gap-4 transition-all group hover:bg-white/[0.02]",
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
              <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.2em] mb-4 flex items-center">
                <i className="fas fa-bed mr-2" />
                Snoozed Sensors ({snoozedSensors.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {snoozedSensors.map(sensorId => (
                  <div key={sensorId} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/5 rounded-lg group hover:border-white/20 transition-colors">
                    <i className="fas fa-microchip text-white/20 text-xs" />
                    <span className="text-xs font-bold text-white/60">{sensorId}</span>
                    <button
                      onClick={() => setSnoozedSensors(prev => prev.filter(id => id !== sensorId))}
                      className="ml-2 text-white/20 hover:text-white transition-colors"
                    >
                      <i className="fas fa-times" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resolved Alerts Section */}
      {resolvedAlerts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-3 px-1">
            <h2 className="text-[10px] font-bold text-white uppercase tracking-[0.2em] flex items-center">
              <i className="fas fa-check-circle mr-2 text-green-500" />
              RESOLVED INCIDENT LOG
            </h2>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="grid grid-cols-1 gap-3">
            {resolvedAlerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between opacity-60 hover:opacity-100 transition-opacity">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded border bg-green-500/10 text-green-500 border-green-500/20">
                      RESOLVED
                    </span>
                    <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">
                      ID: {alert.id.slice(0, 8)}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white/70 uppercase tracking-tight truncate">{alert.message}</p>
                </div>
                <div className="text-right ml-4">
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">CLOSED AT</p>
                  <p className="text-[10px] font-bold text-white/50">{alert.resolved_at ? new Date(alert.resolved_at).toLocaleTimeString() : 'N/A'}</p>
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


