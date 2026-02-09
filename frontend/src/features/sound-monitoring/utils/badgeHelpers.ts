/**
 * Badge Helper Functions
 * Utility functions for badge styling in Sound Monitoring module
 */

/**
 * Get badge class for alert severity
 */
export const getSeverityBadgeClass = (severity: string): string => {
  switch (severity.toLowerCase()) {
    case 'critical': return 'text-red-400 bg-red-500/10 border-red-500/20';
    case 'high': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
    case 'medium': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    case 'low': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
  }
};

/**
 * Get badge class for alert status
 */
export const getStatusBadgeClass = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'active': return 'text-red-400 bg-red-500/10 border-red-500/20';
    case 'investigating': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    case 'resolved': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    case 'false_positive': return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
  }
};

/**
 * Get badge class for zone type
 */
export const getZoneTypeBadgeClass = (type: string): string => {
  switch (type.toLowerCase()) {
    case 'public': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    case 'guest': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    case 'recreation': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    case 'private': return 'text-red-400 bg-red-500/10 border-red-500/20';
    case 'dining': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
    default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
  }
};
