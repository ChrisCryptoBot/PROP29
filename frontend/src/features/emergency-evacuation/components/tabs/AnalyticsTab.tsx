import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { cn } from '../../../../utils/cn';
import { showSuccess } from '../../../../utils/toast';
import { useEmergencyEvacuationContext } from '../../context/EmergencyEvacuationContext';

const AnalyticsTab: React.FC = () => {
  const { evacuationDrills, handleExportData, loading } = useEmergencyEvacuationContext();

  return (
    <div className="space-y-6">
      <Card className="bg-black/20 backdrop-blur-xl border-white/10">
        <CardHeader className="border-b border-white/5 pb-6">
          <CardTitle className="flex items-center text-xl font-black text-white uppercase tracking-tighter">
            <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center shadow-lg mr-3">
              <i className="fas fa-chart-bar text-blue-500 text-lg" />
            </div>
            Analytics & Protocol Reports
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Performance Metrics */}
            <div className="group relative p-6 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.05] transition-all duration-300">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <i className="fas fa-chart-line text-blue-500 text-xl" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-widest">Performance Vectors</h3>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">Historical Response Data</p>
                </div>
              </div>
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">AVERAGE TIME</span>
                  <span className="text-sm font-black text-white">12:34</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">SUCCESS RATE</span>
                  <span className="text-sm font-black text-green-500">98.5%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">STAFF RESPONSE</span>
                  <span className="text-sm font-black text-white">2:15</span>
                </div>
              </div>
              <Button
                onClick={() => showSuccess('Performance report generated')}
                className="w-full font-black uppercase tracking-widest text-[10px] h-10 h-10"
              >
                GENERATE REPORT
              </Button>
            </div>

            {/* Compliance Reports */}
            <div className="group relative p-6 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.05] transition-all duration-300">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <i className="fas fa-file-shield text-green-500 text-xl" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-widest">Compliance Status</h3>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">Regulatory Alignment</p>
                </div>
              </div>
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">LAST INSPECTION</span>
                  <span className="text-sm font-black text-white">JAN 15, 2025</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">AUDIT DUE</span>
                  <span className="text-sm font-black text-yellow-500">APR 15, 2025</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">AGGREGATE SCORE</span>
                  <span className="text-sm font-black text-green-500">100%</span>
                </div>
              </div>
              <Button
                onClick={() => showSuccess('Compliance report generated')}
                className="w-full font-black uppercase tracking-widest text-[10px] h-10"
              >
                DOWNLOAD AUDIT
              </Button>
            </div>

            {/* Staff Metrics */}
            <div className="group relative p-6 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.05] transition-all duration-300">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <i className="fas fa-users-gear text-purple-500 text-xl" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-widest">Staff Efficiency</h3>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">Intervention Analysis</p>
                </div>
              </div>
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">AVG RESPONSE</span>
                  <span className="text-sm font-black text-white">1:45</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">LEADING UNIT</span>
                  <span className="text-sm font-black text-white">SARAH MILLER</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">TRAINING INDEX</span>
                  <span className="text-sm font-black text-green-500">94%</span>
                </div>
              </div>
              <Button
                onClick={() => showSuccess('Staff metrics report generated')}
                className="w-full font-black uppercase tracking-widest text-[10px] h-10"
              >
                ANALYZE PERSONNEL
              </Button>
            </div>

            {/* Export Data */}
            <div className="group relative p-6 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.05] transition-all duration-300">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <i className="fas fa-file-export text-orange-500 text-xl" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-widest">Data Export</h3>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">External Log Retrieval</p>
                </div>
              </div>
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">FILE ARCHIVE</span>
                  <span className="text-sm font-black text-white uppercase">PDF, CSV, JSON</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">LAST SYNC</span>
                  <span className="text-sm font-black text-white uppercase tracking-tight">SYSTEM LIVE</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">SECURITY GRADE</span>
                  <span className="text-sm font-black text-blue-500 uppercase tracking-widest">A+</span>
                </div>
              </div>
              <Button
                onClick={handleExportData}
                disabled={loading}
                className="w-full font-black uppercase tracking-widest text-[10px] h-10 bg-orange-600 hover:bg-orange-700 h-10"
              >
                INITIALIZE EXPORT
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Evacuation Drills History */}
      <Card className="bg-black/20 backdrop-blur-xl border-white/10">
        <CardHeader className="border-b border-white/5 pb-6">
          <CardTitle className="flex items-center text-xl font-black text-white uppercase tracking-tighter">
            <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center shadow-lg mr-3">
              <i className="fas fa-bullseye text-blue-500 text-lg" />
            </div>
            Evacuation Drill Ledger
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-1">
            {evacuationDrills.map((drill) => (
              <div
                key={drill.id}
                className="group flex items-center justify-between p-4 bg-white/[0.02] border border-transparent hover:bg-white/5 hover:border-white/5 rounded-xl transition-all duration-300"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-white/[0.03] border border-white/5 rounded-xl flex items-center justify-center group-hover:bg-blue-500/10 group-hover:border-blue-500/20 transition-all duration-300">
                    <span className="text-2xl font-black text-white tracking-tighter group-hover:text-blue-500 transition-colors">{drill.score}</span>
                  </div>
                  <div>
                    <p className="text-sm font-black text-white uppercase tracking-tight">{drill.date}</p>
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1 italic">
                      Duration: <span className="text-white/60">{drill.duration}</span> | Participation: <span className="text-white/60">{drill.participationRate}%</span>
                    </p>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <span
                    className={cn(
                      'inline-block px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded border shadow-sm',
                      drill.score >= 90 ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                    )}
                  >
                    RATING: {drill.score}/100
                  </span>
                  <div className="flex items-center justify-end gap-2">
                    <i className="fas fa-triangle-exclamation text-[10px] text-white/20" />
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{drill.issues} VARIANCE RECORDS</p>
                  </div>
                </div>
              </div>
            ))}
            {evacuationDrills.length === 0 && (
              <div className="py-12 text-center">
                <i className="fas fa-bullseye text-white/10 text-4xl mb-4" />
                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">No drill history available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsTab;

