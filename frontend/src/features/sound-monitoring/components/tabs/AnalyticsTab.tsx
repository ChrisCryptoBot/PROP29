/**
 * Sound Monitoring - Analytics Tab
 * Displays analytics and metrics
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { useSoundMonitoringContext } from '../../context/SoundMonitoringContext';

export const AnalyticsTab: React.FC = () => {
  const { metrics } = useSoundMonitoringContext();

  return (
    <div className="space-y-6">
      <Card className="glass-card border-glass bg-transparent shadow-console overflow-hidden">
        <CardHeader className="bg-white/5 border-b border-white/5 py-4">
          <CardTitle className="flex items-center text-xl font-black uppercase tracking-tighter text-white">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center mr-3 shadow-lg ring-1 ring-white/10" aria-hidden="true">
              <i className="fas fa-chart-bar text-white text-lg" />
            </div>
            Sound Analytics Engine
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-10 bg-white/5 border border-white/5 rounded-3xl group hover:bg-white/[0.08] transition-all shadow-inner">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-blue-500/20 ring-1 ring-white/10 group-hover:scale-110 transition-transform">
                <i className="fas fa-clock text-white text-3xl" />
              </div>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-[color:var(--text-sub)] mb-3">Response Efficiency</h3>
              <p className="text-2xl font-black text-white px-4 py-2 bg-black/40 border border-white/5 rounded-xl tracking-widest shadow-inner">{metrics?.responseTime ?? 0} <span className="text-xs opacity-30">MIN</span></p>
            </div>
            <div className="text-center p-10 bg-white/5 border border-white/5 rounded-3xl group hover:bg-white/[0.08] transition-all shadow-inner">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-emerald-500/20 ring-1 ring-white/10 group-hover:scale-110 transition-transform">
                <i className="fas fa-shield-alt text-white text-3xl" />
              </div>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-[color:var(--text-sub)] mb-3">System Reliability</h3>
              <p className="text-2xl font-black text-white px-4 py-2 bg-black/40 border border-white/5 rounded-xl tracking-widest shadow-inner">{metrics?.systemUptime ?? 0}<span className="text-xs opacity-30">%</span></p>
            </div>
            <div className="text-center p-10 bg-white/5 border border-white/5 rounded-3xl group hover:bg-white/[0.08] transition-all shadow-inner">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-amber-500/20 ring-1 ring-white/10 group-hover:scale-110 transition-transform">
                <i className="fas fa-bullseye text-white text-3xl" />
              </div>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-[color:var(--text-sub)] mb-3">Precision Accuracy</h3>
              <p className="text-2xl font-black text-white px-4 py-2 bg-black/40 border border-white/5 rounded-xl tracking-widest shadow-inner">{metrics?.falsePositiveRate ?? 0}<span className="text-xs opacity-30">%</span></p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


