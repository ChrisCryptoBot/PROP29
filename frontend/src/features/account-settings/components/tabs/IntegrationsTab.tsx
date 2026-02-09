import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { Badge } from '../../../../components/UI/Badge';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { useAccountSettingsContext } from '../../context/AccountSettingsContext';
import { getIntegrationStatusColor } from '../../types/account-settings.types';
import type { Integration, IntegrationType } from '../../types/account-settings.types';

const iconMap: Record<IntegrationType, string> = {
  camera: 'fa-video',
  access_control: 'fa-key',
  alarm: 'fa-exclamation-triangle',
  mobile: 'fa-mobile-alt',
  reporting: 'fa-chart-bar',
};

interface IntegrationsTabProps {
  onAddIntegration: () => void;
}

export const IntegrationsTab: React.FC<IntegrationsTabProps> = ({ onAddIntegration }) => {
  const { integrations, loading, testIntegration } = useAccountSettingsContext();

  const handleTest = async (id: string) => {
    await testIntegration(id);
  };

  if (loading.integrations && integrations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4" role="status" aria-label="Loading integrations">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest animate-pulse">Loading integrations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" role="main" aria-label="Integrations">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="page-title">Integrations</h2>
          <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic ">
            Cameras, access control, alarms, mobile
          </p>
        </div>
      </div>

      <Card className="bg-slate-900/50 border border-white/10">
        <CardHeader className="border-b border-white/10 pb-4 px-6 pt-6">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-sm font-black uppercase tracking-widest text-[color:var(--text-main)]">
              <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center mr-3 border border-white/10">
                <i className="fas fa-plug text-white" aria-hidden />
              </div>
              System Integrations
            </CardTitle>
            <Button variant="glass" className="text-[9px] font-black uppercase tracking-widest" onClick={onAddIntegration}>
              <i className="fas fa-plus mr-2" aria-hidden /> Add Integration
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-6 py-6">
          {integrations.length === 0 ? (
            <EmptyState
              icon="fas fa-plug"
              title="No integrations"
              description="Add an integration to connect cameras, access control, or other systems."
              action={{ label: 'Add Integration', onClick: onAddIntegration, variant: 'primary' }}
              className="bg-black/20 border-dashed border-2 border-white/10 rounded-lg p-12"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {integrations.map((integration) => (
                <div key={integration.id} className="p-4 rounded-lg border border-white/10 bg-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center border border-white/10">
                        <i className={`fas ${iconMap[integration.type] || 'fa-plug'} text-white`} aria-hidden />
                      </div>
                      <div>
                        <h4 className="font-black text-white text-sm uppercase tracking-widest">{integration.name}</h4>
                        <p className="text-xs text-[color:var(--text-sub)]">{integration.endpoint}</p>
                      </div>
                    </div>
                    <Badge variant={getIntegrationStatusColor(integration.status) as 'success' | 'destructive' | 'warning' | 'default'}>
                      {integration.status}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-[color:var(--text-sub)] mb-3">Last sync: {new Date(integration.lastSync).toLocaleString()}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleTest(integration.id)} aria-label={`Test ${integration.name} connection`}>
                      <i className="fas fa-sync-alt mr-1" aria-hidden /> Test
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => {}} aria-label={`Configure ${integration.name}`}>
                      <i className="fas fa-cog mr-1" aria-hidden /> Configure
                    </Button>
                    {integration.status === 'error' && (
                      <Button size="sm" variant="outline" onClick={() => handleTest(integration.id)} aria-label={`Troubleshoot ${integration.name}`}>
                        <i className="fas fa-tools mr-1" aria-hidden /> Fix
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
