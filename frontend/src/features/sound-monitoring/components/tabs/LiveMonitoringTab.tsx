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

  const isEmpty = audioVisualization.waveform.length === 0 && soundZones.length === 0;

  return (
    <div className="space-y-6">
      {/* Live Audio Visualization */}
      <Card className="bg-slate-900/50 border border-white/5">
        <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
          <CardTitle className="flex items-center">
            <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center mr-3 border border-white/5" aria-hidden>
              <i className="fas fa-waveform-lines text-white" />
            </div>
            <span className="text-sm font-black uppercase tracking-widest text-white">Live audio monitoring</span>
            {audioVisualization.isRecording && (
              <div className="ml-3 w-3 h-3 bg-red-500 rounded-full animate-pulse" aria-hidden />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 py-6">
          <div className="space-y-6">
            {/* Real-time Decibel Level */}
            <div className="text-center p-8 bg-white/5 border border-white/5 rounded-md">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] italic text-[color:var(--text-sub)] mb-3">Current Sound Level</h3>
              <div className="text-5xl font-black text-white mb-6 uppercase tracking-tighter">
                {audioVisualization.realTimeLevel} <span className="text-xl text-slate-500 font-bold opacity-50">dB</span>
              </div>
              <div className="w-full bg-white/5 border border-white/5 rounded-full h-4 overflow-hidden shadow-inner">
                <div
                  className="bg-blue-600 h-4 rounded-full transition-colors"
                  style={{ width: `${Math.min((audioVisualization.realTimeLevel / 120) * 100, 100)}%` }}
                />
              </div>
              <p className="mt-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest opacity-50">System Baseline Calibration: Stable</p>
            </div>

            {/* Waveform Visualization */}
            <div className="bg-white/5 border border-white/5 rounded-md p-6">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] italic text-[color:var(--text-sub)] mb-6">Live Waveform</h4>
              <div className="flex items-end space-x-1 h-20 px-2 border-b border-white/5">
                {audioVisualization.waveform.length > 0 ? (
                  audioVisualization.waveform.map((amplitude, index) => (
                    <div
                      key={index}
                      className="bg-blue-600 rounded-sm transition-colors"
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
            <div className="bg-white/5 border border-white/5 rounded-md p-6">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] italic text-[color:var(--text-sub)] mb-6">Frequency Spectrum</h4>
              <div className="flex items-end space-x-2 h-20 px-2 border-b border-white/5">
                {audioVisualization.spectrum.length > 0 ? (
                  audioVisualization.spectrum.map((data, index) => (
                    <div
                      key={index}
                      className="bg-blue-600 rounded-sm transition-colors"
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

      {isEmpty ? (
        <EmptyState
          icon="fas fa-waveform-lines"
          title="No live monitoring data"
          description="No audio visualization or zones available. Connect hardware to see live data."
        />
      ) : (
        <>
          {/* Sound Zones Status */}
          <Card className="bg-slate-900/50 border border-white/5">
        <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
          <CardTitle className="flex items-center">
            <div className="w-10 h-10 bg-indigo-600 rounded-md flex items-center justify-center mr-3 border border-white/5" aria-hidden>
              <i className="fas fa-map text-white" />
            </div>
            <span className="text-sm font-black uppercase tracking-widest text-white">Sound zones</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 py-6">
          <div className="space-y-4">
            {soundZones.length > 0 ? (
              soundZones.map((zone) => (
                <div key={zone.id} className="p-6 bg-white/5 border border-white/5 rounded-md hover:bg-white/10 transition-colors">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-widest">{zone.name}</h3>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-50 text-[color:var(--text-sub)]">Zone Identification: {zone.id}</p>
                    </div>
                    <span className={cn("px-2.5 py-1 text-[10px] font-black rounded uppercase tracking-widest border", getZoneTypeBadgeClass(zone.type))}>
                      {zone.type}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white/5 p-4 rounded-md border border-white/5">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">Current Level</span>
                      <p className="text-xl font-black text-white tracking-tighter">{zone.currentDecibelLevel} <span className="text-[10px] opacity-30">dB</span></p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-md border border-white/5">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">Threshold</span>
                      <p className="text-xl font-black text-white tracking-tighter">{zone.threshold} <span className="text-[10px] opacity-30">dB</span></p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-md border border-white/5">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">Sensors</span>
                      <p className="text-xl font-black text-white tracking-tighter">{zone.sensorCount} <span className="text-[10px] opacity-30">Active</span></p>
                    </div>
                  </div>
                  <div className="mt-6">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                      <span>Sound Intensity</span>
                      <span className="text-[color:var(--text-sub)]">{zone.currentDecibelLevel} / {zone.threshold} dB</span>
                    </div>
                    <div className="w-full bg-white/5 border border-white/5 rounded-full h-2 overflow-hidden">
                      <div
                        className={cn(
                          "h-2 rounded-full transition-colors",
                          zone.currentDecibelLevel > zone.threshold
                            ? 'bg-red-600'
                            : zone.currentDecibelLevel > zone.threshold * 0.8
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
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
        </>
      )}
    </div>
  );
};


