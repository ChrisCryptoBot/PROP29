/**
 * Guest Safety - Analytics Tab
 * Displays safety analytics and metrics
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { useGuestSafetyContext } from '../../context/GuestSafetyContext';

export const AnalyticsTab: React.FC = () => {
  const { metrics, loading } = useGuestSafetyContext();

  if (loading.metrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-white/5 border-t-blue-500 rounded-full animate-spin shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card border-glass bg-transparent shadow-console overflow-hidden" role="region" aria-label="Guest Safety Analytics Dashboard">
        <CardHeader className="bg-white/5 border-b border-white/5 py-6">
          <CardTitle className="flex items-center text-2xl font-black uppercase tracking-tighter text-white">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center mr-4 shadow-lg ring-1 ring-white/10 group-hover:scale-110 transition-transform duration-300" aria-hidden="true">
              <i className="fas fa-chart-line text-white text-xl" />
            </div>
            Safety Analytics Registry
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-white/5 rounded-3xl border border-white/5 shadow-inner transition-all hover:bg-white/[0.08] group">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-700 to-blue-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl ring-1 ring-white/10 group-hover:scale-110 transition-transform duration-300">
                <i className="fas fa-clock text-white text-3xl drop-shadow-sm" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-[color:var(--text-sub)] mb-2">Average Response Latency</p>
              <h3 className="text-4xl font-black tracking-tighter text-white">{metrics.responseMetrics.avgResponseTime}</h3>
              <p className="text-[10px] font-medium uppercase tracking-widest text-[color:var(--text-sub)] mt-2 opacity-50">Operational Sync Speed</p>
            </div>

            <div className="text-center p-8 bg-white/5 rounded-3xl border border-white/5 shadow-inner transition-all hover:bg-white/[0.08] group">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl ring-1 ring-white/10 group-hover:scale-110 transition-transform duration-300">
                <i className="fas fa-check-double text-white text-3xl drop-shadow-sm" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-[color:var(--text-sub)] mb-2">Registry Resolution Rate</p>
              <h3 className="text-4xl font-black tracking-tighter text-white">{metrics.responseMetrics.resolutionRate}</h3>
              <p className="text-[10px] font-medium uppercase tracking-widest text-[color:var(--text-sub)] mt-2 opacity-50">Successful Protocol Completion</p>
            </div>

            <div className="text-center p-8 bg-white/5 rounded-3xl border border-white/5 shadow-inner transition-all hover:bg-white/[0.08] group">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl ring-1 ring-white/10 group-hover:scale-110 transition-transform duration-300">
                <i className="fas fa-shield-heart text-white text-3xl drop-shadow-sm" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-[color:var(--text-sub)] mb-2">Guest Safety Sentiment</p>
              <h3 className="text-4xl font-black tracking-tighter text-white">{metrics.responseMetrics.guestSatisfaction}</h3>
              <p className="text-[10px] font-medium uppercase tracking-widest text-[color:var(--text-sub)] mt-2 opacity-50">Protection Quality Score</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

