/**
 * Guest Safety - Assign Team Modal
 * Assign a response team to an incident
 */

import React, { useState } from 'react';
import { Modal } from '../../../../components/UI/Modal';
import { Button } from '../../../../components/UI/Button';
import { useGuestSafetyContext } from '../../context/GuestSafetyContext';

export const AssignTeamModal: React.FC = () => {
  const {
    selectedIncident,
    teams,
    assignTeam,
    showAssignTeamModal,
    setShowAssignTeamModal,
    loading,
  } = useGuestSafetyContext();

  const [selectedTeamId, setSelectedTeamId] = useState<string>('');

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
    >
      <form onSubmit={handleSubmit} className="space-y-6">
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

        <div className="flex justify-end gap-4 pt-4 border-t border-white/5">
          <Button
            type="button"
            variant="outline"
            className="px-8 font-black uppercase tracking-widest text-[10px] border-white/5 text-slate-400 hover:bg-white/5 hover:text-white"
            onClick={handleClose}
            disabled={loading.actions}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="px-8 font-black uppercase tracking-widest text-[10px] bg-blue-600 hover:bg-blue-700 text-white border-none"
            disabled={!selectedTeamId || loading.actions}
          >
            {loading.actions ? 'Assigning...' : 'Assign Team'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};


