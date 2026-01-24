import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { cn } from '../../../../utils/cn';
import { useIoTEnvironmentalContext } from '../../context/IoTEnvironmentalContext';
import { renderSensorIcon } from '../../utils/sensorIcons';

const OverviewTab: React.FC = () => {
  const navigate = useNavigate();
  const {
    analytics,
    activeAlerts,
    getAlertSeverityBadge,
    getStatusBadgeClass,
    environmentalData,
    getStatusBadge,
  } = useIoTEnvironmentalContext();

  const sensorSnapshot = environmentalData.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Current Environmental Readings */}
      <div className="bg-black/20 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl">
        <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
          <h2 className="text-lg font-black text-white uppercase tracking-tighter flex items-center">
            <i className="fas fa-chart-line mr-3 text-blue-500" />
            LIVE TELEMETRY FEED
          </h2>
          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest italic opacity-70">Sector-Wide Environmental Monitoring</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'Temperature', value: analytics.average_temperature.toFixed(1) + '°C', type: 'temperature', color: 'red' },
              { label: 'Humidity', value: analytics.average_humidity.toFixed(1) + '%', type: 'humidity', color: 'blue' },
              { label: 'Air Quality', value: analytics.average_air_quality.toFixed(0) + ' PPM', type: 'air_quality', color: 'green' }
            ].map((stat, idx) => (
              <div key={idx} className="group relative p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-500 overflow-hidden">
                <div className={cn(
                  "absolute -right-4 -top-4 w-24 h-24 blur-3xl opacity-10 transition-opacity duration-500 group-hover:opacity-20",
                  stat.color === 'red' ? 'bg-red-500' : stat.color === 'blue' ? 'bg-blue-500' : 'bg-green-500'
                )} />
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className={cn(
                    "w-12 h-12 rounded flex items-center justify-center shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6",
                    stat.color === 'red' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                      stat.color === 'blue' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                        'bg-green-500/10 text-green-500 border border-green-500/20'
                  )}>
                    {renderSensorIcon(stat.type as any, 24)}
                  </div>
                  <span className={cn(
                    "px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded border",
                    stat.color === 'red' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      stat.color === 'blue' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        'bg-green-500/10 text-green-400 border-green-500/20'
                  )}>{stat.label}</span>
                </div>
                <div className="text-center relative z-10">
                  <h3 className="text-4xl font-black text-white mb-1 tracking-tighter">
                    {stat.value}
                  </h3>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] group-hover:text-white/50 transition-colors">Avg Telemetry Data</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sensor Status Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Normal Status', count: analytics.normalSensors, icon: 'fa-check', color: 'green' },
          { label: 'Warning Status', count: analytics.warningSensors, icon: 'fa-exclamation-triangle', color: 'yellow' },
          { label: 'Critical Status', count: analytics.criticalSensors, icon: 'fa-bolt', color: 'red' }
        ].map((dist, idx) => (
          <div key={idx} className={cn(
            "p-6 bg-black/40 border rounded-2xl backdrop-blur-md text-center group transition-all duration-300 hover:-translate-y-1 hover:bg-black/60",
            dist.color === 'green' ? 'border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.05)]' :
              dist.color === 'yellow' ? 'border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.05)]' :
                'border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.05)]'
          )}>
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3",
              dist.color === 'green' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                dist.color === 'yellow' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                  'bg-red-500/10 text-red-500 border border-red-500/20'
            )}>
              <i className={cn("fas", dist.icon, "text-xl")} />
            </div>
            <h3 className="text-4xl font-black mb-1 text-white tracking-tighter group-hover:text-blue-400 transition-colors">{dist.count}</h3>
            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">{dist.label}</p>
          </div>
        ))}
      </div>

      {/* Sensor Snapshots Grid */}
      {sensorSnapshot.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-3 px-1">
            <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">SENSOR STATUS</h3>
            <div className="h-px flex-1 bg-white/10" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sensorSnapshot.map((sensor) => (
              <div key={sensor.id} className="group p-5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all duration-300 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white/5 border border-white/10 rounded flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform duration-300">
                      {renderSensorIcon(sensor.sensor_type, 18)}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white uppercase tracking-tight">{sensor.sensor_id}</h4>
                      <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">{sensor.sensor_type.replace('_', ' ')}</p>
                    </div>
                  </div>
                  {getStatusBadge(sensor.status)}
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                    <span className="text-white/20">Current Value</span>
                    <span className="text-white">{sensor.value ?? '--'} {sensor.unit || ''}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                    <span className="text-white/20">Location Vector</span>
                    <span className="text-white/70">{sensor.location}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <span className={cn('px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded border', getStatusBadgeClass(sensor.status))}>
                    {sensor.status}
                  </span>
                  {sensor.camera_id && (
                    <button
                      onClick={() => navigate(`/modules/security-operations-center?cameraId=${sensor.camera_id}`)}
                      className="text-[9px] font-black text-blue-500 hover:text-blue-400 uppercase tracking-widest flex items-center transition-colors"
                    >
                      <i className="fas fa-video mr-1.5" />
                      SECURE FEED
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Active Alerts */}
      {activeAlerts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[10px] font-bold text-red-500 uppercase tracking-[0.2em] flex items-center">
              <i className="fas fa-exclamation-circle mr-2" />
              PRIORITY ALERTS
            </h2>
            <span className="px-3 py-1 bg-red-500/10 border border-red-500/30 text-red-500 text-[9px] font-black uppercase tracking-widest rounded-full">
              {activeAlerts.length} ACTIVE INCIDENTS
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {activeAlerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl flex items-start gap-4 hover:bg-red-500/10 transition-all group overflow-hidden relative">
                <div className="absolute -left-1 top-0 bottom-0 w-1 bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.5)]" />
                <div className="w-10 h-10 shrink-0 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                  <i className="fas fa-exclamation-triangle" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    {getAlertSeverityBadge(alert.severity)}
                    <span className={cn('px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded border', getStatusBadgeClass(alert.status))}>
                      {alert.status}
                    </span>
                  </div>
                  <p className="text-sm font-black text-white uppercase tracking-tight mb-2 leading-tight">{alert.message}</p>
                  <div className="flex flex-wrap items-center gap-4 text-[9px] font-bold text-white/30 uppercase tracking-[0.15em]">
                    <span className="flex items-center gap-1.5">
                      <i className="fas fa-map-marker-alt text-red-500/60" />
                      {alert.location}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <i className="fas fa-microchip text-red-500/60" />
                      SENSOR: {alert.sensor_id}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <i className="fas fa-clock text-red-500/60" />
                      {new Date(alert.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OverviewTab;


