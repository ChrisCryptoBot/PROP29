/**
 * Sound Monitoring - Settings Tab
 * Configuration and settings for sound monitoring
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';

export const SettingsTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card className="glass-card border-glass bg-transparent shadow-console overflow-hidden">
        <CardHeader className="bg-white/5 border-b border-white/5 py-4">
          <CardTitle className="flex items-center text-xl font-black uppercase tracking-tighter text-white">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center mr-3 shadow-lg ring-1 ring-white/10" aria-hidden="true">
              <i className="fas fa-cogs text-white text-lg" />
            </div>
            Sound System Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-10 pb-20">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/10 mx-auto mb-8 animate-pulse">
              <i className="fas fa-shield-halved text-white text-3xl opacity-50" />
            </div>
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">Registry Locked</h3>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-50 text-[color:var(--text-sub)] max-w-xs mx-auto mb-8">System configuration under administrative lock. No modifications available in the current sector.</p>
            <div className="inline-block px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 flex items-center">
                <i className="fas fa-lock mr-2" />
                Administrative Bypass Required
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

