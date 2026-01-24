/**
 * Mobile App Config Tab
 * Tab for mobile app configuration settings
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';

export const MobileAppConfigTab: React.FC = React.memo(() => {
  return (
    <Card className="bg-[color:var(--surface-card)] border border-[color:var(--border-subtle)]/50 shadow-2xl">
      <CardHeader className="px-6 pt-6 pb-4 border-b border-[color:var(--border-subtle)]/10">
        <CardTitle className="flex items-center text-xl text-[color:var(--text-main)] font-black uppercase tracking-tighter">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-700 to-blue-900 rounded-lg flex items-center justify-center mr-3 shadow-lg">
            <i className="fas fa-mobile-alt text-white text-sm" />
          </div>
          Mobile Integration Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6 mt-6">
        <div className="space-y-6">
          <div className="p-6 bg-[color:var(--console-dark)]/40 rounded-2xl border border-[color:var(--border-subtle)]/20 shadow-inner">
            <h4 className="text-xs font-black text-blue-400 mb-4 uppercase tracking-[0.2em] flex items-center">
              <i className="fas fa-network-wired mr-2" />
              System API Endpoints
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-[color:var(--text-sub)]/50 mb-2 uppercase tracking-widest">Master Security Key</label>
                <div className="relative group">
                  <input
                    type="text"
                    value="app_key_123456789_SECURED"
                    readOnly
                    className="w-full px-4 py-2 bg-[color:var(--console-dark)] border border-blue-500/20 rounded-lg text-blue-400 font-mono text-xs focus:ring-1 focus:ring-blue-500/30 transition-all"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400/30">
                    <i className="fas fa-lock" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-[color:var(--text-sub)]/50 mb-2 uppercase tracking-widest">System Registry Endpoint</label>
                <input
                  type="text"
                  value="https://api.security-console.local/v1/visitor/registry"
                  readOnly
                  className="w-full px-4 py-2 bg-[color:var(--console-dark)] border border-[color:var(--border-subtle)]/20 rounded-lg text-[color:var(--text-main)] font-mono text-xs"
                />
              </div>
            </div>
          </div>

          <div className="p-6 bg-green-500/5 rounded-2xl border border-green-500/10">
            <h4 className="text-xs font-black text-green-400 mb-4 uppercase tracking-[0.2em] flex items-center">
              <i className="fas fa-shield-virus mr-2" />
              Mobile Extension Capabilities
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { label: 'Dynamic QR Authentication', icon: 'fa-qrcode' },
                { label: 'Real-time Threat Reporting', icon: 'fa-exclamation-triangle' },
                { label: 'Situational Incident Logging', icon: 'fa-clipboard-list' },
                { label: 'Encrypted Registry Comms', icon: 'fa-comments' },
                { label: 'Biometric Access Integration', icon: 'fa-fingerprint' },
                { label: 'Crisis Push Notifications', icon: 'fa-bell' }
              ].map((feature, i) => (
                <div key={i} className="flex items-center p-3 bg-[color:var(--console-dark)]/40 rounded-xl border border-green-500/10 group hover:border-green-500/30 transition-all">
                  <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center mr-3">
                    <i className={`fas ${feature.icon} text-green-400 text-xs`} />
                  </div>
                  <span className="text-xs font-bold text-green-300/80 group-hover:text-green-400 transition-colors uppercase tracking-tight">{feature.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

MobileAppConfigTab.displayName = 'MobileAppConfigTab';
