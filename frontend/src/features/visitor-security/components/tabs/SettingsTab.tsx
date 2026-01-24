/**
 * Settings Tab
 * Tab for module settings configuration
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { EmptyState } from '../../../../components/UI/EmptyState';

export const SettingsTab: React.FC = React.memo(() => {
  return (
    <Card className="bg-[color:var(--surface-card)] border border-[color:var(--border-subtle)]/50 shadow-2xl">
      <CardHeader className="px-6 pt-6 pb-4 border-b border-[color:var(--border-subtle)]/10">
        <CardTitle className="flex items-center text-xl text-[color:var(--text-main)] font-black uppercase tracking-tighter">
          <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg flex items-center justify-center mr-3 shadow-lg">
            <i className="fas fa-cog text-white text-sm" />
          </div>
          Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6 mt-6">
        <EmptyState
          icon="fas fa-tools"
          title="Loading Settings"
          description="Settings for the Visitor Security module will appear here once configured."
          className="bg-black/20 border-dashed border-2 border-white/10"
        />
      </CardContent>
    </Card>
  );
});

SettingsTab.displayName = 'SettingsTab';
