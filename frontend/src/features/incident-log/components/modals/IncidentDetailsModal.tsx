import React, { useEffect, useState } from 'react';
import { Button } from '../../../../components/UI/Button';
import { Modal } from '../../../../components/UI/Modal';
import { Select } from '../../../../components/UI/Select';
import { useIncidentLogContext } from '../../context/IncidentLogContext';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { Incident, IncidentEvidence } from '../../types/incident-log.types';
import { cn } from '../../../../utils/cn';
import { useAuth } from '../../../../hooks/useAuth';
import { showError, showSuccess } from '../../../../utils/toast';
import { incidentService } from '../../services/IncidentService';

interface IncidentDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    incident: Incident | null;
}

export const IncidentDetailsModal: React.FC<IncidentDetailsModalProps> = ({ isOpen, onClose, incident }) => {
    const {
        resolveIncident,
        assignIncident,
        updateIncident,
        getIncidentActivity,
        activityByIncident,
        setShowEscalationModal,
        loading
    } = useIncidentLogContext();
    const { user } = useAuth();

    if (!incident) return null;

    const getSeverityBadgeClass = (severity: string) => {
        switch (severity.toLowerCase()) {
            case 'critical': return 'text-red-300 bg-red-500/20 border border-red-500/30';
            case 'high': return 'text-orange-300 bg-orange-500/20 border border-orange-500/30';
            case 'medium': return 'text-yellow-300 bg-yellow-500/20 border border-yellow-500/30';
            case 'low': return 'text-blue-300 bg-blue-500/20 border border-blue-500/30';
            default: return 'text-slate-300 bg-slate-500/20 border border-slate-500/30';
        }
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending_review': return 'text-amber-300 bg-amber-500/20 border border-amber-500/30';
            case 'open':
            case 'active': return 'text-red-300 bg-red-500/20 border border-red-500/30';
            case 'investigating': return 'text-blue-300 bg-blue-500/20 border border-blue-500/30';
            case 'resolved': return 'text-green-300 bg-green-500/20 border border-green-500/30';
            default: return 'text-slate-300 bg-slate-500/20 border border-slate-500/30';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case 'theft':
            case 'security breach': return 'fas fa-shield-alt';
            case 'fire':
            case 'fire safety': return 'fas fa-fire';
            default: return 'fas fa-exclamation-triangle';
        }
    };

    const id = incident.incident_id;
    const sourceLabel = incident.source
        || (incident.source_metadata && typeof incident.source_metadata === 'object' && 'source' in incident.source_metadata 
            ? String(incident.source_metadata.source) 
            : undefined);
    const reporterLabel = incident.reporter_name || incident.reported_by || 'Unknown';
    const rejectionReason = (incident.source_metadata && typeof incident.source_metadata === 'object' && 'rejection_reason' in incident.source_metadata
        ? String(incident.source_metadata.rejection_reason)
        : undefined);
    const evidence = incident.evidence || {};
    const activities = activityByIncident[id] || [];

    const [evidenceType, setEvidenceType] = useState<'photos' | 'videos' | 'documents' | 'cctv_clips'>('photos');
    const [evidenceUrl, setEvidenceUrl] = useState('');
    const [users, setUsers] = useState<Array<{ user_id: string; name: string; email?: string }>>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [showAssignDropdown, setShowAssignDropdown] = useState(false);

    useEffect(() => {
        if (isOpen && incident?.incident_id) {
            getIncidentActivity(incident.incident_id);
        }
    }, [isOpen, incident?.incident_id, getIncidentActivity]);

    const handleAssignToMe = async () => {
        if (!user?.user_id) {
            showError('Unable to assign incident: missing user context.');
            return;
        }
        await assignIncident(id, user.user_id);
    };

    const handleAssignToUser = async (userId: string) => {
        if (!userId) {
            showError('Please select a user to assign.');
            return;
        }
        await assignIncident(id, userId);
        setShowAssignDropdown(false);
    };

    const handleAddEvidence = async () => {
        if (!evidenceUrl.trim()) {
            showError('Provide a valid evidence URL.');
            return;
        }
        // URL validation
        try {
            new URL(evidenceUrl.trim());
        } catch {
            showError('Please enter a valid URL (e.g., https://example.com/file.jpg)');
            return;
        }
        const existing: string[] = Array.isArray(evidence?.[evidenceType]) ? (evidence[evidenceType] as string[]) : [];
        const updatedEvidence = {
            ...evidence,
            [evidenceType]: [...existing, evidenceUrl.trim()]
        };
        const result = await updateIncident(id, { evidence: updatedEvidence });
        if (result) {
            setEvidenceUrl('');
            showSuccess('Evidence added to incident.');
        }
    };

    const handleRemoveEvidence = async (type: typeof evidenceType, url: string) => {
        const existing = Array.isArray(evidence[type]) ? evidence[type] : [];
        if (!Array.isArray(existing)) return;
        const updatedEvidence = {
            ...evidence,
            [type]: existing.filter((entry: string) => entry !== url)
        };
        await updateIncident(id, { evidence: updatedEvidence });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Incident Details" size="lg">
            <div className="space-y-6">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-lg flex items-center justify-center border border-white/5 shadow-2xl">
                                    <i className={cn(getTypeIcon(incident.incident_type), "text-white text-lg")} />
                                </div>
                                <h3 className="text-lg font-bold text-white">{incident.title}</h3>
                                <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded ${getSeverityBadgeClass(incident.severity)}`}>
                                    {incident.severity}
                                </span>
                                <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded ${getStatusBadgeClass(incident.status)}`}>
                                    {incident.status}
                                </span>
                            </div>
                            <p className="text-slate-300 leading-relaxed bg-white/5 p-4 rounded-lg border border-white/5">{incident.description}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] block mb-1">Type</label>
                                <div className="flex items-center space-x-3 text-white bg-white/5 p-3 rounded-lg border border-white/5">
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-lg flex items-center justify-center border border-white/5 shadow-2xl">
                                        <i className={cn(getTypeIcon(incident.incident_type), "text-white text-sm")} />
                                    </div>
                                    <span>{incident.incident_type}</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] block mb-1">Location</label>
                                <div className="flex items-center space-x-3 text-white bg-white/5 p-3 rounded-lg border border-white/5">
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-lg flex items-center justify-center border border-white/5 shadow-2xl">
                                        <i className="fas fa-map-marker-alt text-white text-sm" />
                                    </div>
                                    <span>{typeof incident.location === 'string' ? incident.location : incident.location?.area || 'Unknown'}</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] block mb-1">Created At</label>
                                <div className="flex items-center space-x-3 text-white bg-white/5 p-3 rounded-lg border border-white/5">
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-lg flex items-center justify-center border border-white/5 shadow-2xl">
                                        <i className="fas fa-clock text-white text-sm" />
                                    </div>
                                    <span>{new Date(incident.created_at).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] block mb-1">Reporter</label>
                                <div className="flex items-center space-x-3 text-white bg-white/5 p-3 rounded-lg border border-white/5">
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-lg flex items-center justify-center border border-white/5 shadow-2xl">
                                        <i className="fas fa-user-shield text-white text-sm" />
                                    </div>
                                    <span>{reporterLabel}</span>
                                </div>
                            </div>
                            {sourceLabel && (
                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] block mb-1">Source</label>
                                    <div className="flex items-center space-x-3 text-white bg-white/5 p-3 rounded-lg border border-white/5">
                                        <div className="w-8 h-8 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-lg flex items-center justify-center border border-white/5 shadow-2xl">
                                            <i className="fas fa-satellite-dish text-white text-sm" />
                                        </div>
                                        <span>{sourceLabel}</span>
                                    </div>
                                </div>
                            )}
                            {rejectionReason && (
                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] block mb-1">Rejection Reason</label>
                                    <div className="text-slate-300 leading-relaxed bg-white/5 p-3 rounded-lg border border-white/5 text-sm">
                                        {rejectionReason}
                                    </div>
                                </div>
                            )}
                            <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] block mb-1">Assigned To</label>
                                {showAssignDropdown ? (
                                    <div className="space-y-2">
                                        <Select
                                            id="assign-user"
                                            value={incident.assigned_to || ''}
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    handleAssignToUser(e.target.value);
                                                } else {
                                                    setShowAssignDropdown(false);
                                                }
                                            }}
                                            disabled={loadingUsers || loading.incidents}
                                        >
                                            <option value="">Unassigned</option>
                                            {users.map((u) => (
                                                <option key={u.user_id} value={u.user_id}>
                                                    {u.name} {u.email ? `(${u.email})` : ''}
                                                </option>
                                            ))}
                                        </Select>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setShowAssignDropdown(false)}
                                            className="text-[9px] font-black uppercase tracking-widest border-white/5 text-slate-300 hover:bg-white/5 hover:text-white"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center space-x-3 text-white bg-white/5 p-3 rounded-lg border border-white/5">
                                        <div className="w-8 h-8 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-lg flex items-center justify-center border border-white/5 shadow-2xl">
                                            <i className="fas fa-user text-white text-sm" />
                                        </div>
                                        <span className="flex-1">
                                            {incident.assigned_to 
                                                ? users.find(u => u.user_id === incident.assigned_to)?.name || incident.assigned_to
                                                : 'Unassigned'}
                                        </span>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setShowAssignDropdown(true)}
                                            className="text-[9px] font-black uppercase tracking-widest border-white/5 text-slate-300 hover:bg-white/5 hover:text-white"
                                        >
                                            <i className="fas fa-edit mr-1" />
                                            Change
                                        </Button>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] block mb-1">Last Updated</label>
                                <div className="flex items-center space-x-3 text-white bg-white/5 p-3 rounded-lg border border-white/5">
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-lg flex items-center justify-center border border-white/5 shadow-2xl">
                                        <i className="fas fa-history text-white text-sm" />
                                    </div>
                                    <span>{incident.updated_at ? new Date(incident.updated_at).toLocaleString() : 'Never'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-6 border-t border-white/5">
                        <Button
                            variant="outline"
                            onClick={handleAssignToMe}
                            disabled={loading.incidents}
                            className="text-[9px] font-black uppercase tracking-widest text-slate-300 hover:text-white"
                        >
                            <i className="fas fa-user-plus mr-2" />
                            Assign to Me
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setShowEscalationModal(true)}
                            disabled={loading.incidents}
                            className="text-[9px] font-black uppercase tracking-widest text-slate-300 hover:text-white"
                        >
                            <i className="fas fa-arrow-up mr-2" />
                            Escalate
                        </Button>
                        {incident.status !== 'resolved' && (
                            <Button
                                onClick={() => resolveIncident(id)}
                                disabled={loading.incidents}
                                variant="outline"
                                className="col-span-2 text-[9px] font-black uppercase tracking-widest border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                            >
                                <i className="fas fa-check-circle mr-2" />
                                Mark as Resolved
                            </Button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6 border-t border-white/5">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-[color:var(--text-sub)]">Evidence</h4>
                            </div>

                            {['photos', 'videos', 'documents', 'cctv_clips'].every((key) => {
                                const evidenceKey = key as keyof IncidentEvidence;
                                const arr = evidence?.[evidenceKey];
                                return !Array.isArray(arr) || arr.length === 0;
                            }) ? (
                                <EmptyState
                                    icon="fas fa-folder-open"
                                    title="No Evidence Uploaded"
                                    description="Attach links to photos, videos, documents, or CCTV clips."
                                    className="bg-black/20 border-dashed border-2 border-white/5"
                                />
                            ) : (
                                <div className="space-y-3">
                                    {(['photos', 'videos', 'documents', 'cctv_clips'] as const).map((key) => {
                                        const items = Array.isArray(evidence?.[key]) ? evidence[key] : [];
                                        if (!items?.length) return null;
                                        const label = key === 'cctv_clips' ? 'CCTV Clips' : key.charAt(0).toUpperCase() + key.slice(1);
                                        return (
                                            <div key={key} className="space-y-2">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">{label}</p>
                                                <div className="space-y-2">
                                                    {items.map((url: string) => (
                                                        <div key={url} className="flex items-center justify-between gap-2 bg-white/5 border border-white/5 rounded-md px-3 py-2">
                                                            <a href={url} target="_blank" rel="noreferrer" className="text-xs text-slate-200 truncate">
                                                                {url}
                                                            </a>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="text-[9px] font-black uppercase tracking-widest border-red-500/30 text-red-300 hover:bg-red-500/10"
                                                                onClick={() => handleRemoveEvidence(key, url)}
                                                            >
                                                                Remove
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <div className="space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] block mb-2">Evidence Type</label>
                                        <select
                                            value={evidenceType}
                                            onChange={(event) => setEvidenceType(event.target.value as 'photos' | 'videos' | 'documents' | 'cctv_clips')}
                                            className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10"
                                        >
                                            <option value="photos">Photos</option>
                                            <option value="videos">Videos</option>
                                            <option value="documents">Documents</option>
                                            <option value="cctv_clips">CCTV Clips</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] block mb-2">Evidence URL or File</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={evidenceUrl}
                                                onChange={(event) => setEvidenceUrl(event.target.value)}
                                                className="flex-1 px-3 py-2 bg-white/5 border border-white/5 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono"
                                                placeholder="https://..."
                                            />
                                            <input
                                                type="file"
                                                id="evidence-file-upload"
                                                accept="image/*,video/*,.pdf,.doc,.docx"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;
                                                    
                                                    // Validate file size (max 10MB)
                                                    if (file.size > 10 * 1024 * 1024) {
                                                        showError('File size exceeds 10MB limit.');
                                                        return;
                                                    }
                                                    
                                                    // Validate file type
                                                    const allowedTypes = ['image/', 'video/', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
                                                    if (!allowedTypes.some(type => file.type.startsWith(type))) {
                                                        showError('Invalid file type. Allowed: images, videos, PDF, Word documents.');
                                                        return;
                                                    }
                                                    
                                                    // For now, create object URL and add as evidence
                                                    // In production, this would upload to server and return URL
                                                    const objectUrl = URL.createObjectURL(file);
                                                    setEvidenceUrl(objectUrl);
                                                    showSuccess('File selected. Click "Add" to attach.');
                                                }}
                                                className="hidden"
                                            />
                                            <label
                                                htmlFor="evidence-file-upload"
                                                className="px-3 py-2 bg-white/5 border border-white/5 rounded-md text-sm text-white cursor-pointer hover:bg-white/10 transition-colors flex items-center"
                                            >
                                                <i className="fas fa-upload mr-2" />
                                                Upload
                                            </label>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={handleAddEvidence}
                                                disabled={!evidenceUrl.trim() || loading.incidents}
                                                className="text-[9px] font-black uppercase tracking-widest border-white/5 text-slate-300 hover:bg-white/5 hover:text-white"
                                            >
                                                <i className="fas fa-paperclip mr-2" />
                                                Add
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-[color:var(--text-sub)]">Activity Timeline</h4>
                            </div>
                            {activities.length === 0 ? (
                                <EmptyState
                                    icon="fas fa-clock"
                                    title="No Activity Logged"
                                    description="Incident status changes and review actions will appear here."
                                    className="bg-black/20 border-dashed border-2 border-white/5"
                                />
                            ) : (
                                <div className="space-y-3">
                                    {activities.map((activity) => (
                                        <div key={activity.activity_id} className="flex items-start gap-3 bg-white/5 border border-white/5 rounded-md px-3 py-2">
                                            <div className="w-8 h-8 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-lg flex items-center justify-center border border-white/5 shadow-2xl shrink-0">
                                                <i className="fas fa-history text-white text-xs" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <>
                                                    <p className="text-xs text-white font-semibold uppercase tracking-wider">
                                                        {activity.action_type.replace(/_/g, ' ')}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400">
                                                        {activity.user_name || 'System'} · {new Date(activity.timestamp).toLocaleString()}
                                                    </p>
                                                    {activity.activity_metadata?.rejection_reason && (
                                                        <p className="text-[10px] text-red-300 mt-1">
                                                            {String(activity.activity_metadata.rejection_reason)}
                                                        </p>
                                                    )}
                                                </>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
            </div>
        </Modal>
    );
};

export default IncidentDetailsModal;


