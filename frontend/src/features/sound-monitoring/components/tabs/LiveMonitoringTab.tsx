/**
 * Sound Monitoring - Live Monitoring Tab
 * Displays real-time audio visualization and zone status
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { useSoundMonitoringContext } from '../../context/SoundMonitoringContext';
import { getZoneTypeBadgeClass } from '../../utils/badgeHelpers';
import { cn } from '../../../../utils/cn';
import { EmptyState } from '../../../../components/UI/EmptyState';

export const LiveMonitoringTab: React.FC = () => {
  const { audioVisualization, soundZones } = useSoundMonitoringContext();

  return (
    <div className="space-y-6">
      {/* Live Audio Visualization */}
      {/* Live Audio Visualization */}
      <Card className="glass-card border-glass bg-transparent shadow-console">
        <CardHeader className="bg-white/5 border-b border-white/5 py-4">
          <CardTitle className="flex items-center text-xl font-black uppercase tracking-tighter text-white">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center mr-3 shadow-lg ring-1 ring-white/10" aria-hidden="true">
              <i className="fas fa-waveform-lines text-white text-lg" />
            </div>
            Live Audio Monitoring
            {audioVisualization.isRecording && (
              <div className="ml-3 w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Real-time Decibel Level */}
            <div className="text-center p-8 bg-black/40 border border-white/5 rounded-2xl shadow-inner group">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-[color:var(--text-sub)] mb-3">Current Sound Level</h3>
              <div className="text-5xl font-black text-white mb-6 uppercase tracking-tighter shadow-lg">
                {audioVisualization.realTimeLevel} <span className="text-xl text-slate-500 font-bold opacity-50">dB</span>
              </div>
              <div className="w-full bg-white/5 border border-white/5 rounded-full h-4 overflow-hidden shadow-inner">
                <div
                  className="bg-gradient-to-r from-blue-600 to-blue-400 h-4 rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                  style={{ width: `${Math.min((audioVisualization.realTimeLevel / 120) * 100, 100)}%` }}
                />
              </div>
              <p className="mt-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest opacity-50">System Baseline Calibration: Stable</p>
            </div>

            {/* Waveform Visualization */}
            <div className="bg-black/40 border border-white/5 rounded-2xl p-6 shadow-inner">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-[color:var(--text-sub)] mb-6">Live Waveform</h4>
              <div className="flex items-end space-x-1 h-20 px-2 border-b border-white/5">
                {audioVisualization.waveform.length > 0 ? (
                  audioVisualization.waveform.map((amplitude, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-t from-blue-600 to-blue-400 rounded-sm transition-all duration-100 shadow-[0_0_5px_rgba(59,130,246,0.3)]"
                      style={{
                        height: `${amplitude * 100}%`,
                        width: '8px'
                      }}
                    />
                  ))
                ) : (
                  <div className="w-full text-center text-slate-500 py-8">
                    No waveform data available
                  </div>
                )}
              </div>
            </div>

            {/* Frequency Spectrum */}
            <div className="bg-black/40 border border-white/5 rounded-2xl p-6 shadow-inner">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-[color:var(--text-sub)] mb-6">Frequency Spectrum</h4>
              <div className="flex items-end space-x-2 h-20 px-2 border-b border-white/5">
                {audioVisualization.spectrum.length > 0 ? (
                  audioVisualization.spectrum.map((data, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-t from-blue-700 to-blue-500 rounded-sm transition-all duration-100 shadow-[0_0_8px_rgba(29,78,216,0.3)]"
                      style={{
                        height: `${data.amplitude * 100}%`,
                        width: '12px'
                      }}
                      title={`${data.frequency}Hz: ${(data.amplitude * 100).toFixed(1)}%`}
                    />
                  ))
                ) : (
                  <div className="w-full text-center text-slate-500 py-8">
                    No spectrum data available
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sound Zones Status */}
      <Card className="glass-card border-glass bg-transparent shadow-console overflow-hidden">
        <CardHeader className="bg-white/5 border-b border-white/5 py-4">
          <CardTitle className="flex items-center text-xl font-black uppercase tracking-tighter text-white">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-lg flex items-center justify-center mr-3 shadow-lg ring-1 ring-white/10" aria-hidden="true">
              <i className="fas fa-map text-white text-lg" />
            </div>
            Sound Zones Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {soundZones.length > 0 ? (
              soundZones.map((zone) => (
                <div key={zone.id} className="p-6 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/[0.08] transition-all group shadow-inner">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-black text-white uppercase tracking-tighter group-hover:text-blue-400 transition-colors">{zone.name}</h3>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-50 text-[color:var(--text-sub)]">Zone Identification: {zone.id}</p>
                    </div>
                    <span className={cn("px-2.5 py-1 text-[10px] font-black rounded uppercase tracking-widest border", getZoneTypeBadgeClass(zone.type))}>
                      {zone.type}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-black/40 p-4 rounded-xl border border-white/5 shadow-inner">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">Current Level</span>
                      <p className="text-xl font-black text-white tracking-tighter">{zone.currentDecibelLevel} <span className="text-[10px] opacity-30">dB</span></p>
                    </div>
                    <div className="bg-black/40 p-4 rounded-xl border border-white/5 shadow-inner">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">Threshold</span>
                      <p className="text-xl font-black text-white tracking-tighter">{zone.threshold} <span className="text-[10px] opacity-30">dB</span></p>
                    </div>
                    <div className="bg-black/40 p-4 rounded-xl border border-white/5 shadow-inner">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">Sensors</span>
                      <p className="text-xl font-black text-white tracking-tighter">{zone.sensorCount} <span className="text-[10px] opacity-30">Active</span></p>
                    </div>
                  </div>
                  <div className="mt-6">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                      <span>Sound Intensity</span>
                      <span className="opacity-70">{zone.currentDecibelLevel} / {zone.threshold} dB</span>
                    </div>
                    <div className="w-full bg-black/40 border border-white/5 rounded-full h-2 overflow-hidden shadow-inner">
                      <div
                        className={cn(
                          "h-2 rounded-full transition-all duration-300 shadow-sm",
                          zone.currentDecibelLevel > zone.threshold
                            ? 'bg-gradient-to-r from-red-600 to-red-400 shadow-red-500/50'
                            : zone.currentDecibelLevel > zone.threshold * 0.8
                              ? 'bg-gradient-to-r from-amber-500 to-amber-300 shadow-amber-500/50'
                              : 'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-emerald-500/50'
                        )}
                        style={{ width: `${Math.min((zone.currentDecibelLevel / zone.threshold) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon="fas fa-map"
                title="No sound zones configured"
                description="Facility coverage map offline. Hardware registry sync required to initialize monitoring zones."
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


