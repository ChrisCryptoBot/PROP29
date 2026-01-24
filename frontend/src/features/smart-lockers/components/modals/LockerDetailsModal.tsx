/**
 * Smart Lockers - Locker Details Modal
 * Modal for viewing locker details with actionable workflows
 * (Remote Unlock, Maintenance Request)
 */

import React, { useState } from 'react';
import { Button } from '../../../../components/UI/Button';
import { useSmartLockersContext } from '../../context/SmartLockersContext';
import type { SmartLocker } from '../../types/locker.types';
import { getStatusBadgeClass, getSizeBadgeClass } from '../../utils/badgeHelpers';
import { cn } from '../../../../utils/cn';
import { showError } from '../../../../utils/toast';

export const LockerDetailsModal: React.FC = () => {
  const { remoteUnlockLocker, requestMaintenance, canUpdateLocker, selectedLocker, setSelectedLocker } = useSmartLockersContext();
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  const [maintenanceReason, setMaintenanceReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!selectedLocker) return null;

  const locker = selectedLocker;

  const handleRemoteUnlock = async () => {
    const confirmed = window.confirm(`Are you sure you want to remotely unlock ${locker.lockerNumber}?`);
    if (!confirmed) return;

    setIsProcessing(true);
    try {
      await remoteUnlockLocker(locker.id);
      setSelectedLocker(null);
    } catch (error) {
      // Error is handled by the hook
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRequestMaintenance = async () => {
    if (!maintenanceReason.trim()) {
      showError('Please provide a reason for the maintenance request');
      return;
    }

    setIsProcessing(true);
    try {
      await requestMaintenance(locker.id, maintenanceReason);
      setShowMaintenanceForm(false);
      setMaintenanceReason('');
      setSelectedLocker(null);
    } catch (error) {
      // Error is handled by the hook
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="glass-card border-white/10 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="px-6 py-6 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <i className="fas fa-lock text-white text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">Locker Details</h2>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-[color:var(--text-sub)]">{locker.lockerNumber}</p>
            </div>
          </div>
          <button
            onClick={() => setSelectedLocker(null)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-all"
            aria-label="Close modal"
          >
            <i className="fas fa-times text-lg" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
          {/* Status Badges */}
          <div className="flex items-center space-x-3">
            <span className={cn("px-3 py-1.5 text-xs font-black rounded uppercase tracking-widest", getStatusBadgeClass(locker.status))}>
              {locker.status}
            </span>
            <span className={cn("px-3 py-1.5 text-xs font-black rounded uppercase tracking-widest", getSizeBadgeClass(locker.size))}>
              {locker.size}
            </span>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="group">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Location</label>
              <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-center group-hover:bg-white/[0.08] transition-all shadow-inner">
                <i className="fas fa-map-marker-alt text-blue-400 mr-3 opacity-70" />
                <p className="text-sm font-medium text-white">{locker.location}</p>
              </div>
            </div>
            <div className="group">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Locker Identification</label>
              <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-center group-hover:bg-white/[0.08] transition-all shadow-inner">
                <i className="fas fa-hashtag text-blue-400 mr-3 opacity-70" />
                <p className="text-sm font-medium text-white">{locker.lockerNumber}</p>
              </div>
            </div>
            {locker.batteryLevel !== undefined && (
              <div className="group">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Battery Level</label>
                <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-center group-hover:bg-white/[0.08] transition-all shadow-inner">
                  <i className={cn("fas mr-3 opacity-70", locker.batteryLevel > 20 ? "fa-battery-full text-emerald-400" : "fa-battery-quarter text-red-500")} />
                  <p className="text-sm font-medium text-white">{locker.batteryLevel}%</p>
                </div>
              </div>
            )}
            {locker.signalStrength !== undefined && (
              <div className="group">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Signal Strength</label>
                <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-center group-hover:bg-white/[0.08] transition-all shadow-inner">
                  <i className="fas fa-wifi text-blue-400 mr-3 opacity-70" />
                  <p className="text-sm font-medium text-white">{locker.signalStrength}%</p>
                </div>
              </div>
            )}
            {locker.currentGuestId && (
              <div className="group">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Assigned Guest</label>
                <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-center group-hover:bg-white/[0.08] transition-all shadow-inner">
                  <i className="fas fa-user-tag text-blue-400 mr-3 opacity-70" />
                  <p className="text-sm font-medium text-white">{locker.currentGuestId}</p>
                </div>
              </div>
            )}
            {locker.checkInTime && (
              <div className="group">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Registry Timestamp</label>
                <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-center group-hover:bg-white/[0.08] transition-all shadow-inner">
                  <i className="fas fa-clock text-blue-400 mr-3 opacity-70" />
                  <p className="text-sm font-medium text-white">
                    {new Date(locker.checkInTime).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Features */}
          {locker.features && locker.features.length > 0 && (
            <div className="group">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3 block">Hardware Features</label>
              <div className="flex flex-wrap gap-2">
                {locker.features.map((feature) => (
                  <span
                    key={feature}
                    className="px-4 py-2 text-xs font-black uppercase tracking-widest bg-blue-500/10 text-blue-300 rounded-xl border border-blue-500/20 shadow-lg"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Maintenance Request Form */}
          {showMaintenanceForm && (
            <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl animate-in slide-in-from-top duration-300">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-3">
                Maintenance Context <span className="text-red-500">*</span>
              </label>
              <textarea
                value={maintenanceReason}
                onChange={(e) => setMaintenanceReason(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all shadow-inner"
                placeholder="Technical description of the reported issue..."
              />
              <div className="flex justify-end space-x-3 mt-4">
                <Button
                  variant="outline"
                  className="text-slate-400 hover:text-white border-white/10"
                  onClick={() => {
                    setShowMaintenanceForm(false);
                    setMaintenanceReason('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="warning"
                  className="font-black uppercase tracking-widest px-8 shadow-lg shadow-amber-500/20"
                  onClick={handleRequestMaintenance}
                  disabled={isProcessing || !maintenanceReason.trim()}
                >
                  {isProcessing ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2" />
                      Dispatching...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-tools mr-2" />
                      Submit Request
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {canUpdateLocker && (
            <div className="pt-6 border-t border-white/10 flex flex-wrap gap-4">
              {locker.status === 'occupied' && (
                <Button
                  variant="primary"
                  className="font-black uppercase tracking-widest px-8 shadow-lg shadow-blue-500/20"
                  onClick={handleRemoteUnlock}
                  disabled={isProcessing}
                >
                  <i className="fas fa-unlock mr-2" />
                  Remote Unlock
                </Button>
              )}
              <Button
                variant="outline"
                className="font-black uppercase tracking-widest border-amber-500/30 text-amber-500 hover:bg-amber-500/10 px-8"
                onClick={() => setShowMaintenanceForm(!showMaintenanceForm)}
                disabled={isProcessing}
              >
                <i className="fas fa-tools mr-2" />
                {showMaintenanceForm ? 'Cancel Request' : 'Request Maintenance'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};



