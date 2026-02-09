import React from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../../../utils/cn';
import { formatLocationDisplay } from '../../../../utils/formatLocation';
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
    <div className="space-y-6" role="main" aria-label="IoT Environmental Overview">
      {/* Page header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="page-title">Overview</h2>
          <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic">
            Sector-wide environmental monitoring and sensor status
          </p>
        </div>
      </div>

      {/* Compact metrics bar (gold standard) */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3 border-b border-white/5 text-sm mb-6 font-bold uppercase tracking-widest text-[color:var(--text-sub)]" role="group" aria-label="Environmental metrics">
        <span>Temperature <strong className="font-black text-white">{analytics.average_temperature.toFixed(1)}°C</strong></span>
        <span className="text-white/30" aria-hidden="true">|</span>
        <span>Humidity <strong className="font-black text-white">{analytics.average_humidity.toFixed(1)}%</strong></span>
        <span className="text-white/30" aria-hidden="true">|</span>
        <span>Air quality <strong className="font-black text-white">{analytics.average_air_quality.toFixed(0)} PPM</strong></span>
        <span className="text-white/30" aria-hidden="true">|</span>
        <span>Normal <strong className="font-black text-white">{analytics.normalSensors}</strong></span>
        <span className="text-white/30" aria-hidden="true">|</span>
        <span>Warning <strong className="font-black text-white">{analytics.warningSensors}</strong></span>
        <span className="text-white/30" aria-hidden="true">|</span>
        <span>Critical <strong className="font-black text-white">{analytics.criticalSensors}</strong></span>
      </div>

      {/* Sensor Status (section per gold standard) */}
      {sensorSnapshot.length > 0 && (
        <section aria-labelledby="iot-env-sensor-status-heading" className="space-y-4">
          <h3 id="iot-env-sensor-status-heading" className="text-sm font-black uppercase tracking-widest text-[color:var(--text-main)] mb-4">Sensor Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sensorSnapshot.map((sensor) => (
              <div key={sensor.id} className="p-4 rounded-md border border-white/5 bg-slate-900/50 hover:bg-white/5 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 border border-white/5 rounded-md flex items-center justify-center text-white">
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
                    <span className="text-white/70">{formatLocationDisplay(sensor.location as string | { lat?: number; lng?: number } | null) || '—'}</span>
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
        </section>
      )}

      {/* Priority Alerts (section per gold standard) */}
      {activeAlerts.length > 0 && (
        <section aria-labelledby="iot-env-priority-alerts-heading" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 id="iot-env-priority-alerts-heading" className="text-sm font-black uppercase tracking-widest text-[color:var(--text-main)] flex items-center">
              <i className="fas fa-exclamation-circle mr-2 text-red-500" aria-hidden />
              Priority Alerts
            </h3>
            <span className="px-3 py-1 bg-red-500/10 border border-red-500/30 text-red-500 text-[9px] font-black uppercase tracking-widest rounded-full">
              {activeAlerts.length} active
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {activeAlerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className="p-4 bg-red-500/5 border border-red-500/20 rounded-md flex items-start gap-4 hover:bg-red-500/10 transition-colors overflow-hidden relative">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-600" aria-hidden />
                <div className="w-10 h-10 shrink-0 bg-red-500/10 border border-red-500/20 rounded-md flex items-center justify-center text-red-500">
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
                      {formatLocationDisplay(alert.location as string | { lat?: number; lng?: number } | null) || '—'}
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
        </section>
      )}
    </div>
  );
};

export default OverviewTab;


