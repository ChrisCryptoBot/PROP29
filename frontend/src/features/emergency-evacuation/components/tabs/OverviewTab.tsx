import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { Progress } from '../../../../components/UI/Progress';
import { cn } from '../../../../utils/cn';
import { useEmergencyEvacuationContext } from '../../context/EmergencyEvacuationContext';

const OverviewTab: React.FC = () => {
  const { metrics, timeline } = useEmergencyEvacuationContext();

  return (
    <div className="space-y-6">
      {/* Evacuation Progress */}
      <Card className="bg-black/20 backdrop-blur-xl border-white/10">
        <CardHeader className="border-b border-white/5 pb-6">
          <CardTitle className="flex items-center text-xl font-black text-white uppercase tracking-tighter">
            <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center shadow-lg mr-3">
              <i className="fas fa-chart-line text-blue-500 text-lg" />
            </div>
            Evacuation Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">OVERALL PROGRESS</span>
                <span className="text-sm font-black text-white">{metrics.evacuationProgress}%</span>
              </div>
              <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div
                  className="h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-1000"
                  style={{ width: `${metrics.evacuationProgress}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6 pt-4 border-t border-white/5">
              <div className="text-center space-y-1">
                <p className="text-2xl font-black text-green-500 tracking-tighter">{metrics.evacuated}</p>
                <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Evacuated</p>
              </div>
              <div className="text-center space-y-1">
                <p className="text-2xl font-black text-yellow-500 tracking-tighter">{metrics.inProgress}</p>
                <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">In Progress</p>
              </div>
              <div className="text-center space-y-1">
                <p className="text-2xl font-black text-red-500 tracking-tighter">{metrics.remaining}</p>
                <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Remaining</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card className="bg-black/20 backdrop-blur-xl border-white/10">
        <CardHeader className="border-b border-white/5 pb-6">
          <CardTitle className="flex items-center text-xl font-black text-white uppercase tracking-tighter">
            <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center shadow-lg mr-3">
              <i className="fas fa-clock text-blue-500 text-lg" />
            </div>
            Event Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-1">
            {timeline.slice(0, 8).map((event) => (
              <div
                key={event.id}
                className={cn(
                  'flex items-center space-x-4 p-4 rounded-xl transition-all border border-transparent',
                  event.current ? 'bg-blue-500/5 border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.05)]' : 'hover:bg-white/5'
                )}
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded flex items-center justify-center flex-shrink-0 border',
                    event.severity === 'critical' && 'bg-red-500/10 border-red-500/20 text-red-500',
                    event.severity === 'warning' && 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500',
                    event.severity === 'info' && 'bg-blue-500/10 border-blue-500/20 text-blue-500',
                    event.severity === 'success' && 'bg-green-500/10 border-green-500/20 text-green-500'
                  )}
                >
                  {event.icon === 'AlertTriangle' && <i className="fas fa-exclamation-triangle" />}
                  {event.icon === 'Zap' && <i className="fas fa-bolt" />}
                  {event.icon === 'Phone' && <i className="fas fa-phone" />}
                  {event.icon === 'Users' && <i className="fas fa-users" />}
                  {event.icon === 'CheckCircle' && <i className="fas fa-check-circle" />}
                  {event.icon === 'Activity' && <i className="fas fa-sync-alt animate-spin-slow" />}
                  {event.icon === 'Megaphone' && <i className="fas fa-bullhorn" />}
                  {event.icon === 'Unlock' && <i className="fas fa-unlock" />}
                  {!event.icon && <i className="fas fa-circle" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-white uppercase tracking-tight truncate">{event.content}</p>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mt-1 italic">{event.time}</p>
                </div>
                {event.current && (
                  <span className="px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded bg-blue-500/10 text-blue-500 border border-blue-500/20 animate-pulse">Live</span>
                )}
              </div>
            ))}
            {timeline.length === 0 && (
              <div className="py-10 text-center">
                <i className="fas fa-stream text-white/10 text-3xl mb-3" />
                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">No timeline data available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OverviewTab;


