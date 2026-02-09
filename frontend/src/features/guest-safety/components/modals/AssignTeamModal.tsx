/**
 * Guest Safety - Assign Team Modal
 * Assign a response team to an incident
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '../../../../components/UI/Modal';
import { Button } from '../../../../components/UI/Button';
import { useGuestSafetyContext } from '../../context/GuestSafetyContext';

export const AssignTeamModal: React.FC = () => {
  const {
    selectedIncident,
    teams,
    assignTeam,
    refreshTeams,
    showAssignTeamModal,
    setShowAssignTeamModal,
    loading,
  } = useGuestSafetyContext();

  const [selectedTeamId, setSelectedTeamId] = useState<string>('');

  // Refresh teams when modal opens so list is up to date
  useEffect(() => {
    if (showAssignTeamModal) refreshTeams();
  }, [showAssignTeamModal, refreshTeams]);

  if (!showAssignTeamModal || !selectedIncident) return null;

  const availableTeams = teams.filter(team => team.status === 'available');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamId) return;

    try {
      await assignTeam(selectedIncident.id, selectedTeamId);
      setShowAssignTeamModal(false);
      setSelectedTeamId('');
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleClose = () => {
    setShowAssignTeamModal(false);
    setSelectedTeamId('');
  };

  return (
    <Modal
      isOpen={showAssignTeamModal}
      onClose={handleClose}
      title={`Assign Team - ${selectedIncident.guestName}`}
      size="md"
      footer={
        <>
          <Button type="button" variant="subtle" onClick={handleClose} disabled={loading.actions} className="px-8 font-black uppercase tracking-widest text-[10px]">
            Cancel
          </Button>
          <Button type="submit" form="assign-team-form" variant="primary" disabled={!selectedTeamId || loading.actions} className="px-8 font-black uppercase tracking-widest text-[10px]">
            {loading.actions ? 'Assigning...' : 'Assign Team'}
          </Button>
        </>
      }
    >
      <form id="assign-team-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
            Select Team
          </label>
          <select
            className="w-full bg-white/5 border border-white/5 rounded-md px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 appearance-none cursor-pointer disabled:opacity-50"
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            required
            disabled={loading.actions}
          >
            <option className="bg-slate-900 text-white/50" value="">Select a team...</option>
            {availableTeams.map((team) => (
              <option key={team.id} value={team.id} className="bg-slate-900">
                {team.name} - {team.role}
              </option>
            ))}
          </select>
          {availableTeams.length === 0 && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-xs font-bold text-red-400 text-center">
              <i className="fas fa-exclamation-triangle mr-2" />
              No teams available
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
};


