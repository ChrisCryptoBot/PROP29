/**
 * Guest Safety - Mass Notification Tab
 * Send mass notifications to guests
 */

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { useGuestSafetyContext } from '../../context/GuestSafetyContext';
import type { MassNotificationData } from '../../types/guest-safety.types';

import { EmptyState } from '../../../../components/UI/EmptyState';

export const MassNotificationTab: React.FC = () => {
  const {
    sendMassNotification,
    loading,
    canSendNotification,
  } = useGuestSafetyContext();

  const [formData, setFormData] = useState<MassNotificationData>({
    message: '',
    recipients: 'all',
    priority: 'normal',
    channels: ['in_app', 'sms', 'email'],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.message.trim()) return;

    try {
      await sendMassNotification(formData);
      setFormData({
        message: '',
        recipients: 'all',
        priority: 'normal',
        channels: ['in_app', 'sms', 'email'],
      });
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleChannelToggle = (channel: 'in_app' | 'sms' | 'email') => {
    setFormData(prev => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter(c => c !== channel)
        : [...prev.channels, channel],
    }));
  };

  if (!canSendNotification) {
    return (
      <EmptyState
        icon="fas fa-lock"
        title="Access Denied"
        description="Registry offline. Administrative privileges are required to broadcast high-priority mass notifications."
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="glass-card border-glass bg-transparent shadow-console overflow-hidden">
        <CardHeader className="bg-white/5 border-b border-white/5 py-4">
          <CardTitle className="flex items-center text-xl font-black uppercase tracking-tighter text-white">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center mr-3 shadow-lg ring-1 ring-white/10" aria-hidden="true">
              <i className="fas fa-bullhorn text-white text-lg" />
            </div>
            Mass Notification Broadcast
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-8 px-8 pb-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-[color:var(--text-sub)] ml-1">
                Broadcast Message Content
              </label>
              <textarea
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all min-h-[160px] shadow-inner placeholder:text-white/20"
                placeholder="Enter mandatory safety directive or announcement..."
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                required
                disabled={loading.actions}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-[color:var(--text-sub)] ml-1">
                  Target Recipient Matrix
                </label>
                <select
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none cursor-pointer shadow-inner"
                  value={formData.recipients}
                  onChange={(e) => setFormData(prev => ({ ...prev, recipients: e.target.value as any }))}
                  disabled={loading.actions}
                >
                  <option className="bg-slate-900" value="all">All Registered Guests</option>
                  <option className="bg-slate-900" value="vip">VIP Protocols Only</option>
                  <option className="bg-slate-900" value="floor">Sector/Floor Isolation</option>
                  <option className="bg-slate-900" value="room">Selective Unit Broadcast</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-[color:var(--text-sub)] ml-1">
                  Transmission Priority
                </label>
                <select
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none cursor-pointer shadow-inner"
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                  disabled={loading.actions}
                >
                  <option className="bg-slate-900" value="normal">Standard Routine</option>
                  <option className="bg-slate-900" value="high">Elevated Priority</option>
                  <option className="bg-slate-900" value="urgent">Critical/Emergency</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-[color:var(--text-sub)] ml-1">
                Communication Channels
              </label>
              <div className="flex flex-wrap gap-6 bg-white/5 p-6 rounded-2xl border border-white/5 shadow-inner">
                <label className="flex items-center space-x-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      className="w-5 h-5 bg-white/5 border border-white/20 rounded-lg checked:bg-blue-600 checked:border-transparent transition-all cursor-pointer appearance-none shadow-inner"
                      checked={formData.channels.includes('in_app')}
                      onChange={() => handleChannelToggle('in_app')}
                      disabled={loading.actions}
                    />
                    <i className="fas fa-check absolute left-1 text-[10px] text-white opacity-0 group-hover:opacity-20 transition-opacity" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-white">In-App Registry</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      className="w-5 h-5 bg-white/5 border border-white/20 rounded-lg checked:bg-blue-600 checked:border-transparent transition-all cursor-pointer appearance-none shadow-inner"
                      checked={formData.channels.includes('sms')}
                      onChange={() => handleChannelToggle('sms')}
                      disabled={loading.actions}
                    />
                    <i className="fas fa-check absolute left-1 text-[10px] text-white opacity-0 group-hover:opacity-20 transition-opacity" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-white">SMS Protocol</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      className="w-5 h-5 bg-white/5 border border-white/20 rounded-lg checked:bg-blue-600 checked:border-transparent transition-all cursor-pointer appearance-none shadow-inner"
                      checked={formData.channels.includes('email')}
                      onChange={() => handleChannelToggle('email')}
                      disabled={loading.actions}
                    />
                    <i className="fas fa-check absolute left-1 text-[10px] text-white opacity-0 group-hover:opacity-20 transition-opacity" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-white">Email Sync</span>
                </label>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full py-6 font-black uppercase tracking-[0.3em] text-[12px] bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 border-none rounded-2xl transition-all active:scale-[0.98]"
              disabled={!formData.message.trim() || loading.actions}
            >
              {loading.actions ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-3" />
                  Finalizing Transmission...
                </>
              ) : (
                <>
                  <i className="fas fa-bullhorn mr-3" />
                  Initialize Broadcast
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

