/**
 * Guest Safety - Badge Helper Functions
 * Centralizes helper functions for badge variants
 */

/**
 * Get priority badge class
 */
export const getPriorityBadgeClass = (priority: string): string => {
  switch (priority.toLowerCase()) {
    case 'critical': return 'text-red-400 bg-red-500/10 border-red-500/20';
    case 'high': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
    case 'medium': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    case 'low': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
  }
};

/**
 * Get status badge class
 */
export const getStatusBadgeClass = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'reported': return 'text-red-400 bg-red-500/10 border-red-500/20';
    case 'responding':
    case 'investigating': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    case 'resolved': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
  }
};

/**
 * Get team status badge class
 */
export const getTeamStatusBadgeClass = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'available': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    case 'responding': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
    case 'offline': return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
  }
};
