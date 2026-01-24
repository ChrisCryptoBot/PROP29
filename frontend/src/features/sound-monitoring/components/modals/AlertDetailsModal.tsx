/**
 * Sound Monitoring - Alert Details Modal
 * Displays detailed information about a sound alert
 */

import React from 'react';
import { useSoundMonitoringContext } from '../../context/SoundMonitoringContext';
import { Button } from '../../../../components/UI/Button';
import { getSeverityBadgeClass, getStatusBadgeClass } from '../../utils/badgeHelpers';
import { cn } from '../../../../utils/cn';
import type { SoundAlert } from '../../types/sound-monitoring.types';

interface AlertDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  alert: SoundAlert | null;
}

export const AlertDetailsModal: React.FC<AlertDetailsModalProps> = ({
  isOpen,
  onClose,
  alert,
}) => {
  const {
    acknowledgeAlert,
    resolveAlert,
    loading,
    canAcknowledgeAlert,
    canResolveAlert
  } = useSoundMonitoringContext();

  if (!isOpen || !alert) return null;

  const handleAcknowledge = async () => {
    await acknowledgeAlert(alert.id);
    // Modal stays open to show updated status
  };

  const handleResolve = async () => {
    await resolveAlert(alert.id);
    // Modal stays open to show updated status
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-card border-glass bg-black/80 shadow-2xl rounded-2xl max-w-2xl max-h-[90vh] overflow-hidden flex flex-col w-full shadow-console">
        {/* Header */}
        <div className="bg-white/5 border-b border-white/5 px-6 py-5 shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-white flex items-center uppercase tracking-tighter">
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center mr-3 shadow-lg ring-1 ring-white/10">
                <i className="fas fa-exclamation-triangle text-white" />
              </div>
              Alert Intelligence Details
            </h2>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"
              aria-label="Close modal"
            >
              <i className="fas fa-times text-xl" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-8 overflow-y-auto">
          <div className="space-y-8">
            {/* Alert Type and Location */}
            <div className="bg-white/5 p-6 rounded-2xl border border-white/5 shadow-inner">
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">{alert.type}</h3>
              <div className="flex items-center text-blue-400 font-bold uppercase tracking-widest text-[10px] bg-blue-500/10 px-3 py-1.5 rounded-lg w-fit border border-blue-500/20">
                <i className="fas fa-map-marker-alt mr-2" />
                {alert.location}
              </div>
            </div>

            {/* Status and Severity */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 shadow-inner">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Status</span>
                <span className={cn("inline-block px-3 py-1 text-[10px] font-black rounded uppercase tracking-widest border shadow-sm", getStatusBadgeClass(alert.status))}>
                  {alert.status}
                </span>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 shadow-inner">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Severity</span>
                <span className={cn("inline-block px-3 py-1 text-[10px] font-black rounded uppercase tracking-widest border shadow-sm", getSeverityBadgeClass(alert.severity))}>
                  {alert.severity}
                </span>
              </div>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-black/40 p-4 rounded-xl border border-white/5 shadow-inner">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">Detected Time</span>
                  <p className="text-sm font-black text-white uppercase tracking-widest">{new Date(alert.timestamp).toLocaleString()}</p>
                </div>
                <div className="bg-black/40 p-4 rounded-xl border border-white/5 shadow-inner">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">Decibel Intensity</span>
                  <p className="text-xl font-black text-white tracking-tighter">{alert.decibelLevel} <span className="text-xs opacity-30">dB</span></p>
                </div>
                <div className="bg-black/40 p-4 rounded-xl border border-white/5 shadow-inner">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">Frequency Mapping</span>
                  <p className="text-xl font-black text-white tracking-tighter">{alert.frequency} <span className="text-xs opacity-30">Hz</span></p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-black/40 p-4 rounded-xl border border-white/5 shadow-inner">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">Assigned Unit</span>
                  <p className="text-sm font-black text-white uppercase tracking-widest">{alert.assignedTo || "Unassigned"}</p>
                </div>
                <div className="bg-black/40 p-4 rounded-xl border border-white/5 shadow-inner">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">Acoustic Duration</span>
                  <p className="text-xl font-black text-white tracking-tighter">{alert.duration} <span className="text-xs opacity-30">SEC</span></p>
                </div>
                <div className="bg-black/40 p-4 rounded-xl border border-white/5 shadow-inner">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">Response Latency</span>
                  <p className="text-xl font-black text-white tracking-tighter">{alert.responseTime || "0"} <span className="text-xs opacity-30">SEC</span></p>
                </div>
              </div>
            </div>

            {/* Description */}
            {alert.description && (
              <div className="bg-black/40 p-6 rounded-2xl border border-white/5 shadow-inner">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-3">Intelligence Narrative</span>
                <p className="text-slate-300 text-sm leading-relaxed font-medium italic">"{alert.description}"</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-white/5 shrink-0 px-6 py-6 font-black uppercase tracking-widest text-[10px]">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-white/10 hover:bg-white/5 text-slate-400 font-black uppercase tracking-widest px-8"
          >
            Close
          </Button>
          {alert.status === 'active' && canAcknowledgeAlert && (
            <Button
              onClick={handleAcknowledge}
              disabled={loading.actions}
              variant="primary"
              className="font-black uppercase tracking-widest px-8 shadow-lg shadow-blue-500/20"
            >
              {loading.actions ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2" />
                  Logging...
                </>
              ) : (
                <>
                  <i className="fas fa-check mr-2" />
                  Acknowledge Alert
                </>
              )}
            </Button>
          )}
          {alert.status === 'investigating' && canResolveAlert && (
            <Button
              onClick={handleResolve}
              disabled={loading.actions}
              variant="primary"
              className="font-black uppercase tracking-widest px-8 shadow-lg shadow-emerald-500/20"
            >
              {loading.actions ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2" />
                  Committing...
                </>
              ) : (
                <>
                  <i className="fas fa-check-circle mr-2" />
                  Commit Resolution
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};


