import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { showSuccess } from '../../../../utils/toast';
import { useEmergencyEvacuationContext } from '../../context/EmergencyEvacuationContext';

const PredictiveTab: React.FC = () => {
  const { clearRoutes, routes } = useEmergencyEvacuationContext();

  return (
    <div className="space-y-6">
      <Card className="bg-black/20 backdrop-blur-xl border-white/10">
        <CardHeader className="border-b border-white/5 pb-6">
          <CardTitle className="flex items-center text-xl font-black text-white uppercase tracking-tighter">
            <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center shadow-lg mr-3">
              <i className="fas fa-microchip text-blue-500 text-lg" />
            </div>
            Predictive Intelligence & AI Simulation
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Risk Assessment */}
            <div className="group relative p-6 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.05] transition-all duration-300">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                  <i className="fas fa-exclamation-triangle text-red-500 text-2xl" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-widest">Risk Assessment</h3>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest leading-none">THREAT LEVEL:</span>
                      <span className="px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded border border-yellow-500/20 bg-yellow-500/10 text-yellow-500 leading-none">MEDIUM</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest leading-none">CONFIDENCE:</span>
                      <span className="text-[10px] font-black text-white leading-none">87%</span>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => showSuccess('Risk assessment analysis updated')}
                  className="w-full font-black uppercase tracking-widest text-[10px] h-10"
                >
                  RUN SIMULATION
                </Button>
              </div>
            </div>

            {/* Early Warning System */}
            <div className="group relative p-6 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.05] transition-all duration-300">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-14 h-14 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <i className="fas fa-radar text-yellow-500 text-2xl" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-widest">Proactive Warning</h3>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest leading-none">ACTIVE ALERTS:</span>
                      <span className="text-[10px] font-black text-white leading-none">0</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest leading-none">SYSTEM:</span>
                      <span className="px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded border border-green-500/20 bg-green-500/10 text-green-500 leading-none">ONLINE</span>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => showSuccess('Early warning system configured')}
                  className="w-full font-black uppercase tracking-widest text-[10px] h-10"
                >
                  CONFIGURE IDS
                </Button>
              </div>
            </div>

            {/* Route Optimization */}
            <div className="group relative p-6 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.05] transition-all duration-300">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-14 h-14 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <i className="fas fa-route text-green-500 text-2xl" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-widest">Route Optimizer</h3>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest leading-none">CLEAR PATHS:</span>
                      <span className="text-[10px] font-black text-white leading-none">{clearRoutes.length}/{routes.length}</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest leading-none">AI VECTOR:</span>
                      <span className="px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded border border-green-500/20 bg-green-500/10 text-green-500 leading-none">ACTIVE</span>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => showSuccess('Routes optimized successfully')}
                  className="w-full font-black uppercase tracking-widest text-[10px] h-10"
                >
                  CALCULATE VECTORS
                </Button>
              </div>
            </div>

            {/* Scenario Planning */}
            <div className="group relative p-6 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.05] transition-all duration-300">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-14 h-14 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <i className="fas fa-object-group text-purple-500 text-2xl" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-widest">Scenario Engine</h3>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest leading-none">DATABASE:</span>
                      <span className="text-[10px] font-black text-white leading-none">12 MODELS</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest leading-none">LAST SYNC:</span>
                      <span className="text-[10px] font-black text-white leading-none uppercase">JAN 15</span>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => showSuccess('Scenario simulation started')}
                  className="w-full font-black uppercase tracking-widest text-[10px] h-10 bg-purple-600 hover:bg-purple-700"
                >
                  INITIALIZE
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card className="bg-black/20 backdrop-blur-xl border-white/10">
        <CardHeader className="border-b border-white/5 pb-6">
          <CardTitle className="flex items-center text-xl font-black text-white uppercase tracking-tighter">
            <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center shadow-lg mr-3">
              <i className="fas fa-bolt text-blue-500 text-lg" />
            </div>
            AI Generated Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="p-6 bg-blue-500/5 border border-blue-500/20 rounded-xl relative overflow-hidden group hover:bg-blue-500/10 transition-all duration-300">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <i className="fas fa-chart-line text-6xl text-blue-500" />
              </div>
              <div className="flex items-start space-x-6">
                <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                  <i className="fas fa-trending-up text-blue-500 text-xl" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-tight mb-2">Optimized Response Matrix</h4>
                  <p className="text-xs text-white/50 leading-relaxed max-w-2xl font-medium italic">
                    Analysis indicates a <span className="text-blue-500 font-black">15% efficiency increase</span> in sector clearance protocols over recent intervals. Training effectiveness metrics are trending upwards across primary response units.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-yellow-500/5 border border-yellow-500/20 rounded-xl relative overflow-hidden group hover:bg-yellow-500/10 transition-all duration-300">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <i className="fas fa-triangle-exclamation text-6xl text-yellow-500" />
              </div>
              <div className="flex items-start space-x-6">
                <div className="w-12 h-12 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                  <i className="fas fa-route text-yellow-500 text-xl" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-tight mb-2">Structural Congestion Pattern</h4>
                  <p className="text-xs text-white/50 leading-relaxed max-w-2xl font-medium italic">
                    <span className="text-yellow-500 font-black uppercase">Vertical Hub B</span> consistently registers bottleneck telemetry during drill activations. Recommendation: Deploy supplemental guidance units or re-map primary flow vectors for this sector.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-green-500/5 border border-green-500/20 rounded-xl relative overflow-hidden group hover:bg-green-500/10 transition-all duration-300">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <i className="fas fa-circle-check text-6xl text-green-500" />
              </div>
              <div className="flex items-start space-x-6">
                <div className="w-12 h-12 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                  <i className="fas fa-users text-green-500 text-xl" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-tight mb-2">Protocol Adherence Index</h4>
                  <p className="text-xs text-white/50 leading-relaxed max-w-2xl font-medium italic">
                    Personnel compliance and protocol adherence rates are exceptional, maintaining a <span className="text-green-500 font-black">94% stability rating</span>. Primary notification delivery systems are functioning at peak theoretical capacity.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PredictiveTab;

