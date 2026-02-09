/**
 * Guest Safety - Incident Details Modal
 * Displays detailed information about an incident with actionable workflows
 */

import React, { useState } from 'react';
import { Modal } from '../../../../components/UI/Modal';
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

  const [showResolveConfirm, setShowResolveConfirm] = useState(false);

  if (!selectedIncident) return null;

  const incident = selectedIncident;

  const handleAssignTeam = () => {
    setShowAssignTeamModal(true);
  };

  const handleResolveClick = () => {
    setShowResolveConfirm(true);
  };

  const handleResolveConfirm = async () => {
    try {
      await resolveIncident(incident.id);
      setShowResolveConfirm(false);
      setSelectedIncident(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleResolveCancel = () => {
    setShowResolveConfirm(false);
  };

  const handleSendMessage = () => {
    setShowSendMessageModal(true);
  };

  const handleClose = () => {
    setSelectedIncident(null);
  };

  return (
    <Modal
      isOpen={!!selectedIncident}
      onClose={handleClose}
      title={`Incident Details - ${incident.guestName}`}
      size="lg"
    >

      <div className="space-y-6">
        {/* Status Indicators */}
        <div className="flex items-center space-x-3">
          <span className={cn("px-4 py-1.5 text-[10px] font-black rounded-md uppercase tracking-widest border", getPriorityBadgeClass(incident.priority))}>
            Priority: {incident.priority}
          </span>
          <span className={cn("px-4 py-1.5 text-[10px] font-black rounded-md uppercase tracking-widest border", getStatusBadgeClass(incident.status))}>
            Status: {incident.status}
          </span>
        </div>

          {/* Details Grid - Field Container Pattern */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/30 p-6 rounded-md border border-white/5">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Guest Name</label>
              <div className="bg-white/5 rounded-md px-4 py-3 border border-white/5 font-black text-white text-sm">
                {incident.guestName}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Room</label>
              <div className="bg-white/5 rounded-md px-4 py-3 border border-white/5 font-black text-white text-sm">
                {incident.guestRoom}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Guest Type</label>
              <div className="bg-white/5 rounded-md px-4 py-3 border border-white/5 font-black text-white text-sm">
                {incident.guestType}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Incident Type</label>
              <div className="bg-white/5 rounded-md px-4 py-3 border border-white/5 font-black text-white text-sm">
                {incident.type}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Reported</label>
              <div className="bg-white/5 rounded-md px-4 py-3 border border-white/5 font-black text-white text-sm">
                {incident.reportedTime}
              </div>
            </div>
            {incident.assignedTeam && (
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Assigned Team</label>
                <div className="bg-blue-500/10 rounded-md px-4 py-3 border border-blue-500/20 font-black text-blue-400 text-sm">
                  {incident.assignedTeam}
                </div>
              </div>
            )}
          </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Description</label>
          <div className="bg-white/5 p-6 rounded-md border border-white/5 leading-relaxed text-slate-300 text-sm">
            {incident.description}
          </div>
        </div>

        {/* In-app resolve confirmation */}
        {showResolveConfirm && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-md space-y-3">
            <p className="text-sm font-bold text-amber-200">Are you sure you want to resolve this incident?</p>
            <div className="flex gap-2">
              <Button type="button" variant="subtle" size="sm" onClick={handleResolveCancel} disabled={loading.actions} className="text-[10px] font-black uppercase tracking-widest">
                Cancel
              </Button>
              <Button type="button" variant="primary" size="sm" onClick={handleResolveConfirm} disabled={loading.actions} className="text-[10px] font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700">
                {loading.actions ? 'Resolving...' : 'Yes, resolve'}
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t border-white/5">
        <Button
          variant="outline"
          className="px-8 font-black uppercase tracking-widest text-[10px] border-white/5 text-slate-400 hover:bg-white/5 hover:text-white"
          onClick={handleClose}
        >
          Close
        </Button>
        {incident.status === 'reported' && canAssignTeam && (
          <Button
            className="px-8 font-black uppercase tracking-widest text-[10px] bg-blue-600 hover:bg-blue-700 text-white border-none"
            onClick={handleAssignTeam}
            disabled={loading.actions}
          >
            <i className="fas fa-users-cog mr-2" />
            Assign Team
          </Button>
        )}
        {incident.status === 'responding' && canResolveIncident && !showResolveConfirm && (
          <Button
            className="px-8 font-black uppercase tracking-widest text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white border-none"
            onClick={handleResolveClick}
            disabled={loading.actions}
          >
            <i className="fas fa-check-circle mr-2" />
            Resolve
          </Button>
        )}
        <Button
          variant="outline"
          className="px-8 font-black uppercase tracking-widest text-[10px] border-blue-500/20 text-blue-400 hover:bg-blue-500/5 hover:text-blue-300"
          onClick={handleSendMessage}
        >
          <i className="fas fa-envelope mr-2" />
          Send Message
        </Button>
      </div>
    </Modal>
  );
};


