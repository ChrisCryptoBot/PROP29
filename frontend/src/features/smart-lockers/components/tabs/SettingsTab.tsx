/**
 * Smart Lockers - Settings Tab
 * Functional settings with threshold controls
 */

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { useSmartLockersContext } from '../../context/SmartLockersContext';
import { useAuth } from '../../../../hooks/useAuth';
import { cn } from '../../../../utils/cn';
import { showSuccess } from '../../../../utils/toast';

export const SettingsTab: React.FC = () => {
  const { user } = useAuth();
  const { settings, updateSettings, canManageSettings, loading } = useSmartLockersContext();
  const [localSettings, setLocalSettings] = useState(settings);
  const [isDirty, setIsDirty] = useState(false);

  const isAdmin = user?.roles.some(role => role.toUpperCase() === 'ADMIN');

  const handleThresholdChange = (field: 'batteryAlertThreshold' | 'signalStrengthAlertThreshold', value: number) => {
    setLocalSettings(prev => ({
      ...prev,
      [field]: value,
    }));
    setIsDirty(true);
  };

  const handleSaveSettings = async () => {
    try {
      await updateSettings(localSettings);
      setIsDirty(false);
      showSuccess('Settings saved successfully');
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleReset = () => {
    setLocalSettings(settings);
    setIsDirty(false);
  };

  if (loading.settings) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-white/5 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-[color:var(--surface-card)] border-[1.5px] border-[color:var(--border-subtle)] group">
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-black uppercase tracking-tighter text-white">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center mr-3 shadow-lg group-hover:scale-110 transition-transform" aria-hidden="true">
              <i className="fas fa-cog text-white" />
            </div>
            Smart Lockers System Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isAdmin && (
            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center text-amber-100 text-sm font-medium">
              <i className="fas fa-shield-alt mr-3 text-amber-500" />
              Restricted: Modifications require Administrative privileges.
            </div>
          )}

          <div className="space-y-8">
            {/* Alert Thresholds */}
            <section>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-[color:var(--text-main)] mb-6">Alert Thresholds</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-6 bg-white/5 border border-white/5 rounded-2xl group hover:bg-white/[0.08] transition-all">
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
                    Battery Alert Threshold (%)
                  </label>
                  <div className="flex items-center space-x-6">
                    <span className="font-black text-blue-400 text-xl tracking-tighter">{localSettings.batteryAlertThreshold}%</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={localSettings.batteryAlertThreshold}
                      onChange={(e) => handleThresholdChange('batteryAlertThreshold', parseInt(e.target.value, 10) || 0)}
                      disabled={!canManageSettings}
                      className="accent-blue-500 h-1.5 flex-1 rounded-lg appearance-none bg-white/10 cursor-pointer shadow-inner disabled:opacity-30"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-3">
                    Alert when battery level drops below this threshold
                  </p>
                </div>
                <div className="p-6 bg-white/5 border border-white/5 rounded-2xl group hover:bg-white/[0.08] transition-all">
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
                    Signal Strength Alert Threshold (%)
                  </label>
                  <div className="flex items-center space-x-6">
                    <span className="font-black text-blue-400 text-xl tracking-tighter">{localSettings.signalStrengthAlertThreshold}%</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={localSettings.signalStrengthAlertThreshold}
                      onChange={(e) => handleThresholdChange('signalStrengthAlertThreshold', parseInt(e.target.value, 10) || 0)}
                      disabled={!canManageSettings}
                      className="accent-blue-500 h-1.5 flex-1 rounded-lg appearance-none bg-white/10 cursor-pointer shadow-inner disabled:opacity-30"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-3">
                    Alert when signal strength drops below this threshold
                  </p>
                </div>
              </div>
            </section>

            <div className="pt-6 border-t border-white/5 flex justify-end space-x-3">
              {isDirty && (
                <Button
                  variant="outline"
                  className="font-black uppercase tracking-widest border-white/5 hover:bg-white/10 text-blue-300"
                  onClick={handleReset}
                  disabled={!canManageSettings}
                >
                  Reset
                </Button>
              )}
              <Button
                variant="primary"
                className="font-black uppercase tracking-widest px-8 shadow-lg shadow-blue-500/20"
                onClick={handleSaveSettings}
                disabled={!canManageSettings || !isDirty}
              >
                Save Settings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};




