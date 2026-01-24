import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { useSecurityOperationsContext } from '../../context/SecurityOperationsContext';

export const AnalyticsTab: React.FC = () => {
  const { analytics, loading } = useSecurityOperationsContext();

  if (loading.analytics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-white/5 border-t-blue-500 rounded-full animate-spin shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6" role="main" aria-label="Analytics">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Analytics</h2>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mt-1 italic opacity-70 text-slate-400">
            Motion, alerts, and response metrics
          </p>
        </div>
      </div>
      <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl overflow-hidden">
        <CardHeader className="border-b border-white/5 px-6 py-4">
          <CardTitle className="flex items-center text-xl font-black uppercase tracking-tighter text-white">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center mr-3 shadow-2xl border border-white/5" aria-hidden="true">
              <i className="fas fa-chart-line text-white text-lg" />
            </div>
            Security Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-8 px-8 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-8 bg-white/5 rounded-3xl border border-white/5 shadow-inner transition-all hover:bg-white/[0.08] group">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl border border-white/5 group-hover:scale-110 transition-transform duration-300">
                <i className="fas fa-running text-white text-2xl" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-[color:var(--text-sub)] mb-2">Motion Events</p>
              <h3 className="text-3xl font-black tracking-tighter text-white">{analytics.motionEvents}</h3>
              <p className="text-[10px] font-medium uppercase tracking-widest text-[color:var(--text-sub)] mt-2 opacity-50">Total detections</p>
            </div>

            <div className="text-center p-8 bg-white/5 rounded-3xl border border-white/5 shadow-inner transition-all hover:bg-white/[0.08] group">
              <div className="w-16 h-16 bg-gradient-to-br from-red-600/80 to-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl border border-white/5 group-hover:scale-110 transition-transform duration-300">
                <i className="fas fa-bell text-white text-2xl" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-[color:var(--text-sub)] mb-2">Alerts Triggered</p>
              <h3 className="text-3xl font-black tracking-tighter text-white">{analytics.alertsTriggered}</h3>
              <p className="text-[10px] font-medium uppercase tracking-widest text-[color:var(--text-sub)] mt-2 opacity-50">Active incidents</p>
            </div>

            <div className="text-center p-8 bg-white/5 rounded-3xl border border-white/5 shadow-inner transition-all hover:bg-white/[0.08] group">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-600/80 to-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl border border-white/5 group-hover:scale-110 transition-transform duration-300">
                <i className="fas fa-tachometer-alt text-white text-2xl" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-[color:var(--text-sub)] mb-2">Avg Response</p>
              <h3 className="text-3xl font-black tracking-tighter text-white">{analytics.averageResponseTime}</h3>
              <p className="text-[10px] font-medium uppercase tracking-widest text-[color:var(--text-sub)] mt-2 opacity-50">Response time</p>
            </div>

            <div className="text-center p-8 bg-white/5 rounded-3xl border border-white/5 shadow-inner transition-all hover:bg-white/[0.08] group">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-600/80 to-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl border border-white/5 group-hover:scale-110 transition-transform duration-300">
                <i className="fas fa-chart-area text-white text-2xl" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-[color:var(--text-sub)] mb-2">Peak Activity</p>
              <h3 className="text-3xl font-black tracking-tighter text-white">{analytics.peakActivity}</h3>
              <p className="text-[10px] font-medium uppercase tracking-widest text-[color:var(--text-sub)] mt-2 opacity-50">Usage trends</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};



