/**
 * Guest Safety - Assign Team Modal
 * Assign a response team to an incident
 */

import React, { useState } from 'react';
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4" role="dialog" aria-modal="true">
      <div className="glass-card border-glass bg-[color:var(--surface-card)]/90 shadow-2xl w-full max-w-md overflow-hidden rounded-3xl animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="bg-white/5 border-b border-white/5 px-8 py-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-900 rounded-2xl flex items-center justify-center shadow-lg ring-1 ring-white/10">
              <i className="fas fa-users-cog text-white text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">Deploy Response Team</h2>
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-0.5 italic">{selectedIncident.guestName}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all group"
            aria-label="Close modal"
          >
            <i className="fas fa-times text-lg group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-white uppercase tracking-widest opacity-30 italic ml-1">
              Select Strategic Asset
            </label>
            <div className="relative group">
              <select
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none cursor-pointer shadow-inner pr-12"
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                required
                disabled={loading.actions}
              >
                <option className="bg-slate-900 text-white/50" value="">Available Tactical Units...</option>
                {availableTeams.map((team) => (
                  <option key={team.id} value={team.id} className="bg-slate-900">
                    {team.name.toUpperCase()} — {team.role.toUpperCase()}
                  </option>
                ))}
              </select>
              <i className="fas fa-chevron-down absolute right-5 top-1/2 -translate-y-1/2 text-white/20 group-hover:text-blue-400 transition-colors pointer-events-none" />
            </div>
            {availableTeams.length === 0 && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] font-bold text-red-400 uppercase tracking-widest text-center">
                <i className="fas fa-exclamation-triangle mr-2" />
                Zero Assets Available for Deployment
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button
              type="submit"
              className="w-full py-6 font-black uppercase tracking-[0.2em] text-[12px] bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 border-none rounded-2xl transition-all active:scale-[0.98]"
              disabled={!selectedTeamId || loading.actions}
            >
              {loading.actions ? 'Finalizing Deployment...' : 'Confirm Assignment'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full py-6 font-black uppercase tracking-widest text-[10px] border-white/10 text-[color:var(--text-sub)] hover:hover:bg-white/5 hover:text-white transition-all shadow-lg rounded-2xl"
              onClick={handleClose}
              disabled={loading.actions}
            >
              Abort Assignment
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};


