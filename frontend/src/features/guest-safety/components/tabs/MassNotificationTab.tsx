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
        description="Administrative privileges are required to send mass notifications."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-black text-[color:var(--text-main)] uppercase tracking-tighter">Mass Notification</h2>
          <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic opacity-70">
            Broadcast messages to guests across multiple channels
          </p>
        </div>
      </div>

      <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl overflow-hidden">
        <CardHeader className="bg-white/5 border-b border-white/5 py-4">
          <CardTitle className="flex items-center text-xl font-black uppercase tracking-tighter text-white">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5 mr-3 group-hover:scale-110 transition-transform">
              <i className="fas fa-bullhorn text-white text-lg" />
            </div>
            Mass Notification
          </CardTitle>
        </CardHeader>
          <CardContent className="pt-8 px-8 pb-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Quick Templates */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-[color:var(--text-sub)] ml-1">
                Quick Templates
              </label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    message: 'EMERGENCY EVACUATION: Please proceed to the nearest exit immediately. Do not use elevators. Once safe, please check in using the guest app.',
                    priority: 'urgent',
                    channels: ['in_app', 'sms'],
                  }))}
                  className="text-[10px] font-black uppercase tracking-widest border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  <i className="fas fa-exclamation-triangle mr-2" />
                  Evacuation Alert
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    message: 'EVACUATION COMPLETE: All clear. You may return to your rooms. Thank you for your cooperation.',
                    priority: 'normal',
                    channels: ['in_app', 'sms'],
                  }))}
                  className="text-[10px] font-black uppercase tracking-widest border-green-500/30 text-green-400 hover:bg-green-500/10"
                >
                  <i className="fas fa-check-circle mr-2" />
                  All Clear
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-[color:var(--text-sub)] ml-1">
                Broadcast Message Content
              </label>
              <textarea
                className="w-full bg-white/5 border border-white/5 rounded-md text-sm text-white focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 px-4 py-3 min-h-[160px] shadow-inner placeholder:text-white/20"
                placeholder="Enter message content..."
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                required
                disabled={loading.actions}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-[color:var(--text-sub)] ml-1">
                  Recipients
                </label>
                <select
                  className="w-full bg-white/5 border border-white/5 rounded-md text-sm text-white focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 px-4 py-3 appearance-none cursor-pointer shadow-inner"
                  value={formData.recipients}
                  onChange={(e) => setFormData(prev => ({ ...prev, recipients: e.target.value as any }))}
                  disabled={loading.actions}
                >
                  <option className="bg-slate-900" value="all">All Guests</option>
                  <option className="bg-slate-900" value="vip">VIP Only</option>
                  <option className="bg-slate-900" value="floor">By Floor</option>
                  <option className="bg-slate-900" value="room">By Room</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-[color:var(--text-sub)] ml-1">
                  Priority
                </label>
                <select
                  className="w-full bg-white/5 border border-white/5 rounded-md text-sm text-white focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 px-4 py-3 appearance-none cursor-pointer shadow-inner"
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                  disabled={loading.actions}
                >
                  <option className="bg-slate-900" value="normal">Normal</option>
                  <option className="bg-slate-900" value="high">High</option>
                  <option className="bg-slate-900" value="urgent">Urgent</option>
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
                  <span className="text-xs font-bold uppercase tracking-widest text-white">In-App</span>
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
                  <span className="text-xs font-bold uppercase tracking-widest text-white">SMS</span>
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
                  <span className="text-xs font-bold uppercase tracking-widest text-white">Email</span>
                </label>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full py-6 font-black uppercase tracking-[0.3em] text-[12px] bg-blue-600 hover:bg-blue-700 text-white border-none rounded-2xl transition-all active:scale-[0.98]"
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

