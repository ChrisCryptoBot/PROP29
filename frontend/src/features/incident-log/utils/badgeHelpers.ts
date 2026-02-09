/**
 * Shared badge/display helpers for Incident Log.
 * Use these for consistent severity, status, and type styling across tabs.
 */

export function getSeverityBadgeClass(severity: string): string {
    switch ((severity || '').toLowerCase()) {
        case 'critical': return 'text-red-300 bg-red-500/20 border border-red-500/30';
        case 'high': return 'text-orange-300 bg-orange-500/20 border border-orange-500/30';
        case 'medium': return 'text-yellow-300 bg-yellow-500/20 border border-yellow-500/30';
        case 'low': return 'text-blue-300 bg-blue-500/20 border border-blue-500/30';
        default: return 'text-slate-300 bg-slate-500/20 border border-slate-500/30';
    }
}

export function getStatusBadgeClass(status: string): string {
    switch ((status || '').toLowerCase()) {
        case 'pending_review': return 'text-amber-300 bg-amber-500/20 border border-amber-500/30';
        case 'open':
        case 'active': return 'text-red-300 bg-red-500/20 border border-red-500/30';
        case 'investigating': return 'text-blue-300 bg-blue-500/20 border border-blue-500/30';
        case 'resolved': return 'text-green-300 bg-green-500/20 border border-green-500/30';
        case 'closed':
        case 'escalated': return 'text-orange-300 bg-orange-500/20 border border-orange-500/30';
        default: return 'text-slate-300 bg-slate-500/20 border border-slate-500/30';
    }
}

export function getTypeIcon(type: string): string {
    switch ((type || '').toLowerCase()) {
        case 'theft':
        case 'security breach': return 'fas fa-shield-alt';
        case 'fire':
        case 'fire safety': return 'fas fa-fire';
        case 'medical':
        case 'guest safety': return 'fas fa-user-shield';
        case 'flood':
        case 'facility maintenance': return 'fas fa-tools';
        case 'guest_complaint':
        case 'guest relations': return 'fas fa-comments';
        default: return 'fas fa-exclamation-triangle';
    }
}
