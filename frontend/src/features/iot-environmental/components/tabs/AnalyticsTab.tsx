import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { useIoTEnvironmentalContext } from '../../context/IoTEnvironmentalContext';
import type { SensorType } from '../../types/iot-environmental.types';
import { renderSensorIcon } from '../../utils/sensorIcons';

const AnalyticsTab: React.FC = () => {
  const { analytics, filteredData, handleExportData } = useIoTEnvironmentalContext();

  return (
    <div className="space-y-6">
      <div className="bg-black/20 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl">
        <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
          <h2 className="text-lg font-black text-white uppercase tracking-tighter flex items-center">
            <i className="fas fa-chart-bar mr-3 text-blue-500" />
            ENVIRONMENTAL ANALYTICS
          </h2>
          <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-500 text-[9px] font-black uppercase tracking-widest rounded-full">
            REAL-TIME DATA PROCESSING
          </span>
        </div>

        <div className="p-6">
          {/* Sensors by Type */}
          <div className="mb-10">
            <div className="flex items-center space-x-3 px-1 mb-6">
              <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">SENSOR DISTRIBUTION</h3>
              <div className="h-px flex-1 bg-white/10" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(analytics.sensorsByType).map(([type, count]) => (
                <div key={type} className="group p-5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-center">
                  <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-3 transition-transform group-hover:scale-110">
                    {renderSensorIcon(type as SensorType, 20)}
                  </div>
                  <h4 className="text-2xl font-black text-white mb-1 tracking-tighter">{count}</h4>
                  <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest leading-tight">{type.replace('_', ' ')}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* System Health */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3 px-1">
                <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">SYSTEM HEALTH</h3>
                <div className="h-px flex-1 bg-white/10" />
              </div>
              <div className="p-8 bg-white/5 border border-white/10 rounded-2xl relative overflow-hidden group hover:bg-white/[0.07] transition-all duration-500 shadow-2xl">
                <div className="absolute -right-4 -top-4 w-32 h-32 bg-blue-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="flex items-center space-x-4 mb-8 relative z-10">
                  <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-500 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    <i className="fas fa-chart-line text-xl" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-tight">System Status</h4>
                    <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">System Performance</p>
                  </div>
                </div>
                <div className="space-y-6 relative z-10">
                  <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5 group-hover:border-green-500/20 transition-colors duration-500">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none">Overall Status</span>
                    <span className="px-3 py-1.5 text-[9px] font-black rounded uppercase tracking-widest bg-green-500/10 text-green-500 border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                      Operational
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-4">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Global Uptime</span>
                    <span className="text-sm font-black text-white tracking-[0.1em]">99.98%</span>
                  </div>
                  <div className="flex items-center justify-between px-4">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Sync Latency</span>
                    <span className="text-sm font-black text-blue-400 tracking-[0.1em]">24ms</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Telemetry Pipeline */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3 px-1">
                <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">DATA FEED</h3>
                <div className="h-px flex-1 bg-white/10" />
              </div>
              <div className="p-8 bg-white/5 border border-white/10 rounded-2xl relative overflow-hidden group hover:bg-white/[0.07] transition-all duration-500 shadow-2xl">
                <div className="absolute -right-4 -top-4 w-32 h-32 bg-purple-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="flex items-center space-x-4 mb-8 relative z-10">
                  <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center text-purple-500 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    <i className="fas fa-database text-xl" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-tight">Data Integrity</h4>
                    <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Active Readings</p>
                  </div>
                </div>
                <div className="space-y-6 relative z-10">
                  <div className="flex items-center justify-between px-4">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Daily Readings</span>
                    <span className="text-sm font-black text-white tracking-[0.1em]">{(filteredData.length * 24).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between px-4">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Weekly Total</span>
                    <span className="text-sm font-black text-white tracking-[0.1em]">{(filteredData.length * 168).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between px-4">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Archive Size</span>
                    <span className="text-sm font-black text-purple-400 tracking-[0.1em]">2.14 GB</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12">
            <div className="p-6 bg-black/40 border border-blue-500/20 rounded-2xl flex items-center justify-between relative overflow-hidden">
              <div className="absolute inset-0 bg-blue-500/5 backdrop-blur-sm" />
              <div className="relative z-10">
                <h4 className="text-lg font-black text-white uppercase tracking-tighter mb-1">EXPORT DATA</h4>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Download sensor telemetry in CSV or PDF format</p>
              </div>
              <Button
                onClick={handleExportData}
                variant="primary"
                className="relative z-10 font-black uppercase tracking-widest text-[10px] px-8 h-10 shadow-lg shadow-blue-500/20"
              >
                <i className="fas fa-file-export mr-2" />
                EXPORT DATA
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default AnalyticsTab;

