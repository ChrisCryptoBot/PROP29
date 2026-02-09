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
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="page-title">Analytics</h2>
          <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic">
            Sensor distribution and system health
          </p>
        </div>
        <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-black uppercase tracking-widest rounded">Real-time</span>
      </div>

      <Card className="bg-slate-900/50 border border-white/5">
        <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
          <CardTitle className="flex items-center">
            <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center mr-3 border border-white/5">
              <i className="fas fa-chart-bar text-white" />
            </div>
            <span className="text-sm font-black uppercase tracking-widest text-white">Environmental analytics</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {/* Sensors by Type */}
          <div className="mb-10">
            <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-4">Sensor distribution</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(analytics.sensorsByType).map(([type, count]) => (
                <div key={type} className="p-5 bg-white/5 border border-white/5 rounded-md hover:bg-white/10 transition-colors text-center">
                  <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center border border-white/5 mx-auto mb-3">
                    {renderSensorIcon(type as SensorType, 20)}
                  </div>
                  <h4 className="text-2xl font-black text-white mb-1">{count}</h4>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{type.replace('_', ' ')}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-1 gap-8">
            {/* Data Feed */}
            <div className="space-y-4">
              <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-500">Data feed</h3>
              <div className="p-6 bg-white/5 border border-white/5 rounded-md hover:bg-white/10 transition-colors">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center border border-white/5">
                    <i className="fas fa-database text-white" aria-hidden />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-white">Data integrity</h4>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Readings</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Daily</span>
                    <span className="text-sm font-black text-white">{(filteredData.length * 24).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Weekly</span>
                    <span className="text-sm font-black text-white">{(filteredData.length * 168).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Archive</span>
                    <span className="text-sm font-black text-white">2.14 GB</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-black uppercase tracking-widest text-white mb-0.5">Export data</h4>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">CSV or PDF</p>
            </div>
            <Button
              onClick={handleExportData}
              variant="primary"
              className="font-black uppercase tracking-widest text-[10px] px-6 h-10"
            >
              <i className="fas fa-file-export mr-2" aria-hidden />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


export default AnalyticsTab;

