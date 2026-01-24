/**
 * Guest Safety - Incident Details Modal
 * Displays detailed information about an incident with actionable workflows
 */

import React from 'react';
import { Button } from '../../../../components/UI/Button';
import { getPriorityBadgeClass, getStatusBadgeClass } from '../../utils/badgeHelpers';
import { cn } from '../../../../utils/cn';
import { useGuestSafetyContext } from '../../context/GuestSafetyContext';

export const IncidentDetailsModal: React.FC = () => {
  const {
    selectedIncident,
    setSelectedIncident,
    resolveIncident,
    loading,
    canAssignTeam,
    canResolveIncident,
    setShowAssignTeamModal,
    setShowSendMessageModal,
  } = useGuestSafetyContext();

  if (!selectedIncident) return null;

  const incident = selectedIncident;

  const handleAssignTeam = () => {
    setShowAssignTeamModal(true);
  };

  const handleResolve = async () => {
    const confirmed = window.confirm(`Are you sure you want to resolve this incident?`);
    if (!confirmed) return;

    try {
      await resolveIncident(incident.id);
      setSelectedIncident(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleSendMessage = () => {
    setShowSendMessageModal(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="glass-card border-glass bg-[color:var(--surface-card)]/90 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col rounded-3xl animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="bg-white/5 border-b border-white/5 px-8 py-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-900 rounded-2xl flex items-center justify-center shadow-lg ring-1 ring-white/10">
              <i className="fas fa-shield-alt text-white text-xl" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Incident Protocol Details</h2>
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-0.5 italic">{incident.guestName} <span className="mx-2 opacity-30 text-white">|</span> Unit {incident.guestRoom}</p>
            </div>
          </div>
          <button
            onClick={() => setSelectedIncident(null)}
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all group"
            aria-label="Close modal"
          >
            <i className="fas fa-times text-lg group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto space-y-8">
          {/* Status Indicators */}
          <div className="flex items-center space-x-3">
            <span className={cn("px-4 py-1.5 text-[10px] font-black rounded-lg uppercase tracking-widest border shadow-sm", getPriorityBadgeClass(incident.priority))}>
              PRIORITY: {incident.priority}
            </span>
            <span className={cn("px-4 py-1.5 text-[10px] font-black rounded-lg uppercase tracking-widest border shadow-sm", getStatusBadgeClass(incident.status))}>
              STATUS: {incident.status}
            </span>
          </div>

          {/* Details Grid - Field Container Pattern */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-black/40 p-6 rounded-3xl border border-white/5 shadow-inner">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-white uppercase tracking-widest opacity-30 italic ml-1">Guest Identification</label>
              <div className="bg-white/5 rounded-xl px-4 py-3 border border-white/5 font-black text-white tracking-widest text-xs">
                {incident.guestName}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-white uppercase tracking-widest opacity-30 italic ml-1">Room Locator</label>
              <div className="bg-white/5 rounded-xl px-4 py-3 border border-white/5 font-black text-white tracking-widest text-xs">
                UNIT {incident.guestRoom}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-white uppercase tracking-widest opacity-30 italic ml-1">Classification</label>
              <div className="bg-white/5 rounded-xl px-4 py-3 border border-white/5 font-black text-white tracking-widest text-xs">
                {incident.guestType.toUpperCase()}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-white uppercase tracking-widest opacity-30 italic ml-1">Incident Profile</label>
              <div className="bg-white/5 rounded-xl px-4 py-3 border border-white/5 font-black text-white tracking-widest text-xs">
                {incident.type.toUpperCase()}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-white uppercase tracking-widest opacity-30 italic ml-1">Registry Sync Time</label>
              <div className="bg-white/5 rounded-xl px-4 py-3 border border-white/5 font-black text-white tracking-widest text-xs">
                {incident.reportedTime}
              </div>
            </div>
            {incident.assignedTeam && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-white uppercase tracking-widest opacity-30 italic ml-1">Assigned Response Team</label>
                <div className="bg-blue-500/10 rounded-xl px-4 py-3 border border-blue-500/20 font-black text-blue-400 tracking-widest text-xs">
                  {incident.assignedTeam.toUpperCase()}
                </div>
              </div>
            )}
          </div>

          {/* Forensic Narrative */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-white uppercase tracking-widest opacity-30 italic ml-1">Forensic Narrative</label>
            <div className="bg-white/5 p-6 rounded-3xl border border-white/5 shadow-inner leading-relaxed text-[color:var(--text-sub)] text-sm italic">
              "{incident.description}"
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-8 bg-white/5 border-t border-white/5 flex gap-4">
          <Button
            variant="outline"
            className="flex-1 py-6 font-black uppercase tracking-widest text-[10px] border-white/10 text-[color:var(--text-sub)] hover:hover:bg-white/5 hover:text-white transition-all shadow-lg"
            onClick={() => setSelectedIncident(null)}
          >
            Close Registry
          </Button>

          <div className="flex gap-4 flex-[2]">
            {incident.status === 'reported' && canAssignTeam && (
              <Button
                className="flex-1 py-6 font-black uppercase tracking-widest text-[10px] bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 border-none transition-all active:scale-[0.98]"
                onClick={handleAssignTeam}
                disabled={loading.actions}
              >
                <i className="fas fa-users-cog mr-2" />
                Deploy Team
              </Button>
            )}
            {incident.status === 'responding' && canResolveIncident && (
              <Button
                className="flex-1 py-6 font-black uppercase tracking-widest text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 border-none transition-all active:scale-[0.98]"
                onClick={handleResolve}
                disabled={loading.actions}
              >
                <i className="fas fa-check-circle mr-2" />
                {loading.actions ? 'Finalizing...' : 'Resolve Registry'}
              </Button>
            )}
            <Button
              variant="outline"
              className="px-8 py-6 font-black uppercase tracking-widest text-[10px] border-blue-500/20 text-blue-400 hover:bg-blue-500/5 hover:text-blue-300 transition-all shadow-lg"
              onClick={handleSendMessage}
            >
              <i className="fas fa-envelope mr-2" />
              Direct Message
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};


