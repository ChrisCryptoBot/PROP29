import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../UI/Card';
import { Button } from '../UI/Button';
import { Badge } from '../UI/Badge';
import { showLoading, dismissLoadingAndShowSuccess, showError, showSuccess } from '../../utils/toast';
import { patrolAI } from '../../services/PatrolAIService';
import { logger } from '../../services/logger';
import '../../styles/modern-glass.css';

interface Route {
  id: string;
  name: string;
  checkpoints: Checkpoint[];
  estimatedDuration: string;
  performanceScore: number;
}

interface Checkpoint {
  id: string;
  name: string;
  location: string;
  coordinates: { lat: number; lng: number };
  estimatedTime: number;
  isCritical: boolean;
}

interface Props {
  selectedRoute: Route | null;
  onApplyOptimization?: (optimizedSequence: string[]) => void;
}

export const RouteOptimizationPanel: React.FC<Props> = ({ selectedRoute, onApplyOptimization }) => {
  const [optimization, setOptimization] = useState<any>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const handleOptimize = async () => {
    if (!selectedRoute) {
      showError('Please select a route first');
      return;
    }

    const toastId = showLoading('Optimizing route sequence...');
    setIsOptimizing(true);

    try {
      const result = await patrolAI.optimizeRoute(selectedRoute);
      setOptimization(result);
      dismissLoadingAndShowSuccess(toastId, `Route optimized! Saves ${result.timeSaved} minutes`);
    } catch (error) {
      logger.error('Route optimization error', error instanceof Error ? error : new Error(String(error)), { module: 'RouteOptimizationPanel', action: 'handleOptimizeRoute' });
      showError('Failed to optimize route');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleApply = () => {
    if (optimization && onApplyOptimization) {
      onApplyOptimization(optimization.optimizedSequence);
      showSuccess('Route optimization applied!');
    }
  };

  return (
    <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl">
      <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center text-white">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600/80 to-slate-900 rounded-xl flex items-center justify-center mr-3 border border-white/5 shadow-lg">
              <i className="fas fa-microchip text-white"></i>
            </div>
            <span className="text-sm font-black uppercase tracking-widest">Logic Path Optimization</span>
          </div>
          <Button
            onClick={handleOptimize}
            disabled={isOptimizing || !selectedRoute}
            variant="glass"
            className="h-10 px-6 border-indigo-500/20 hover:border-indigo-500/40 text-indigo-400"
          >
            <i className={`fas ${isOptimizing ? 'fa-spinner fa-spin' : 'fa-bolt'} mr-2`}></i>
            {isOptimizing ? 'ANALYZING...' : 'RUN OPTIMIZATION'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 py-6">
        {selectedRoute && (
          <div className="mb-6 p-4 bg-slate-900/30 rounded-xl border border-white/5 shadow-inner">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Target Path</p>
            <p className="text-sm font-black text-white">{selectedRoute.name}</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 opacity-70 italic">Current cycle duration: {selectedRoute.estimatedDuration}</p>
          </div>
        )}

        {optimization && (
          <div className="space-y-6">
            <div className="p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl shadow-inner group overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-all"></div>

              <div className="flex items-center justify-between mb-4 relative z-10">
                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Efficiency Gain</span>
                <span className="text-3xl font-black text-white">{optimization.timeSaved}<span className="text-xs text-slate-600 ml-1">MIN</span></span>
              </div>

              <div className="grid grid-cols-2 gap-4 relative z-10 bg-black/20 p-3 rounded-xl border border-white/5">
                <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Standard Duration</p>
                  <p className="text-sm font-black text-white">{optimization.originalDuration} MIN</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Optimized Execution</p>
                  <p className="text-sm font-black text-emerald-400">{optimization.optimizedDuration} MIN</p>
                </div>
              </div>
            </div>

            <div>
              <h5 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Neural Logic Reasoning</h5>
              <ul className="space-y-2">
                {optimization.reasoning.map((reason: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-3 p-3 bg-slate-900/30 rounded-xl border border-white/5 hover:border-indigo-500/20 transition-all">
                    <i className="fas fa-check-double text-emerald-500 text-[10px] mt-1 opacity-60"></i>
                    <span className="text-[11px] text-slate-400 font-medium leading-relaxed">{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-white/5">
              <Button
                onClick={handleApply}
                variant="glass"
                className="flex-1 h-10 border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 text-[10px] font-black uppercase tracking-widest"
              >
                <i className="fas fa-check-double mr-2"></i>
                Commit Optimized Path
              </Button>
              <Button
                variant="glass"
                onClick={() => setOptimization(null)}
                className="h-10 border-white/5 text-slate-500 text-[10px] font-black uppercase tracking-widest px-6"
              >
                Reset
              </Button>
            </div>
          </div>
        )}

        {!selectedRoute && !optimization && (
          <div className="text-center py-12 px-6 bg-slate-900/20 rounded-2xl border border-dashed border-white/5">
            <div className="w-16 h-16 bg-slate-900/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
              <i className="fas fa-project-diagram text-3xl text-slate-700"></i>
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Vector Data Required</p>
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em]">Select a path vector to initialize neural logic optimization</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};


