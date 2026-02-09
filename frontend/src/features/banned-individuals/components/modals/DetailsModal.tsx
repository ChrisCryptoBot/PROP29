import React from 'react';
import { Button } from '../../../../components/UI/Button';
import { Modal } from '../../../../components/UI/Modal';
import { useBannedIndividualsContext } from '../../context/BannedIndividualsContext';
import { cn } from '../../../../utils/cn';

export const DetailsModal: React.FC = () => {
    const {
        showDetailsModal,
        setShowDetailsModal,
        selectedIndividual,
        detectionAlerts
    } = useBannedIndividualsContext();

    if (!showDetailsModal || !selectedIndividual) return null;

    const getRiskLevelBadgeClass = (riskLevel: string): string => {
        switch (riskLevel) {
            case 'LOW': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'MEDIUM': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            case 'HIGH': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
            case 'CRITICAL': return 'text-red-400 bg-red-500/10 border-red-500/20';
            default: return 'text-slate-400 bg-white/5 border-white/5';
        }
    };

    const getBanTypeBadgeClass = (banType: string): string => {
        switch (banType) {
            case 'TEMPORARY': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
            case 'PERMANENT': return 'text-red-400 bg-red-500/10 border-red-500/20';
            case 'CONDITIONAL': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            default: return 'text-slate-400 bg-white/5 border-white/5';
        }
    };

    const getStatusBadgeClass = (status: string): string => {
        switch (status) {
            case 'ACTIVE': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'EXPIRED': return 'text-slate-400 bg-white/5 border-white/5';
            case 'REMOVED': return 'text-red-400 bg-red-500/10 border-red-500/20';
            default: return 'text-slate-400 bg-white/5 border-white/5';
        }
    };

    const getSourceBadge = (individual: any) => {
        const source = individual.source || 'MANAGER';
        const sourceMetadata = individual.sourceMetadata || {};
        
        switch (source) {
            case 'MOBILE_AGENT':
                return {
                    icon: 'fa-mobile-alt',
                    label: 'Mobile Agent',
                    color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
                    tooltip: sourceMetadata.agentName 
                        ? `Submitted by ${sourceMetadata.agentName}${sourceMetadata.agentTrustScore ? ` (Trust: ${sourceMetadata.agentTrustScore})` : ''}`
                        : 'Submitted by mobile agent'
                };
            case 'HARDWARE_DEVICE':
                return {
                    icon: 'fa-video',
                    label: 'Hardware Device',
                    color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
                    tooltip: sourceMetadata.deviceName 
                        ? `Detected by ${sourceMetadata.deviceName}`
                        : 'Detected by hardware device'
                };
            case 'AUTO_APPROVED':
                return {
                    icon: 'fa-check-circle',
                    label: 'Auto-Approved',
                    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                    tooltip: 'Auto-approved based on trust score'
                };
            case 'BULK_IMPORT':
                return {
                    icon: 'fa-file-import',
                    label: 'Bulk Import',
                    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                    tooltip: 'Bulk imported'
                };
            default:
                return {
                    icon: 'fa-user-shield',
                    label: 'Manager',
                    color: 'text-slate-400 bg-white/5 border-white/5',
                    tooltip: 'Manually created by manager'
                };
        }
    };

    return (
        <Modal
            isOpen={showDetailsModal}
            onClose={() => setShowDetailsModal(false)}
            title={`${selectedIndividual.firstName} ${selectedIndividual.lastName}`}
            size="lg"
            footer={<Button variant="subtle" onClick={() => setShowDetailsModal(false)}>Cancel</Button>}
        >
            <div className="space-y-6">
                        <div className="flex items-center space-x-6 p-5 border border-white/5 rounded-md bg-white/5">
                            <div className="relative">
                                <div className="w-20 h-20 bg-blue-600 rounded-md flex items-center justify-center border border-white/5">
                                    <span className="text-white font-bold text-2xl">
                                        {selectedIndividual.firstName.charAt(0)}{selectedIndividual.lastName.charAt(0)}
                                    </span>
                                </div>
                                {selectedIndividual.status === 'ACTIVE' && (
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-red-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                                        <i className="fas fa-exclamation text-white text-[10px]" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-2xl font-black text-[color:var(--text-main)] leading-tight uppercase tracking-tighter">
                                    {selectedIndividual.firstName} {selectedIndividual.lastName}
                                </h3>
                                <div className="flex flex-wrap items-center gap-2 mt-4">
                                    {(() => {
                                        const sourceBadge = getSourceBadge(selectedIndividual);
                                        return (
                                            <span 
                                                className={cn("px-2.5 py-1 text-[10px] font-bold rounded border uppercase tracking-widest shadow-sm flex items-center gap-1.5", sourceBadge.color)}
                                                title={sourceBadge.tooltip}
                                            >
                                                <i className={cn("fas text-[9px]", sourceBadge.icon)} />
                                                {sourceBadge.label}
                                            </span>
                                        );
                                    })()}
                                    <span className={cn("px-2.5 py-1 text-[10px] font-bold rounded border uppercase tracking-widest shadow-sm", getRiskLevelBadgeClass(selectedIndividual.riskLevel))}>
                                        {selectedIndividual.riskLevel} Risk
                                    </span>
                                    <span className={cn("px-2.5 py-1 text-[10px] font-bold rounded border uppercase tracking-widest shadow-sm", getBanTypeBadgeClass(selectedIndividual.banType))}>
                                        {selectedIndividual.banType} Ban
                                    </span>
                                    <span className={cn("px-2.5 py-1 text-[10px] font-bold rounded border uppercase tracking-widest shadow-sm", getStatusBadgeClass(selectedIndividual.status))}>
                                        {selectedIndividual.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 px-2">
                            <DetailRow label="Date of Birth" value={selectedIndividual.dateOfBirth || "Unknown"} icon="fa-birthday-cake" />
                            <DetailRow label="Nationality" value={selectedIndividual.nationality} icon="fa-flag" />
                            <DetailRow label="ID Number" value={selectedIndividual.identificationNumber || "N/A"} icon="fa-id-card" />
                            <DetailRow label="ID Type" value={selectedIndividual.identificationType || "N/A"} icon="fa-passport" />
                        </div>

                        <div className="space-y-4 px-2">
                            <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
                                <h4 className="text-xs font-bold text-red-400 flex items-center mb-2 uppercase tracking-widest">
                                    <i className="fas fa-gavel mr-2" />
                                    Official Reason for Ban
                                </h4>
                                <p className="text-white text-sm leading-relaxed font-medium">{selectedIndividual.reason}</p>
                            </div>

                            {selectedIndividual.notes && (
                                <div className="p-4 border border-white/5 rounded-lg bg-white/5">
                                    <h4 className="text-xs font-bold text-slate-400 flex items-center mb-2 uppercase tracking-widest">
                                        <i className="fas fa-sticky-note mr-2 text-blue-500" />
                                        Internal Security Notes
                                    </h4>
                                    <p className="text-[color:var(--text-sub)] text-sm leading-relaxed italic">"{selectedIndividual.notes}"</p>
                                </div>
                            )}
                        </div>

                        <div className="px-2">
                            <h4 className="text-lg font-bold text-white mb-4 flex items-center">
                                <i className="fas fa-history mr-2 text-slate-400" />
                                Recent Detection History
                            </h4>
                            <div className="space-y-3">
                                {detectionAlerts
                                    .filter(alert => alert.individualId === selectedIndividual.id)
                                    .map((alert) => (
                                        <div key={alert.id} className="p-4 bg-white/5 border border-white/5 rounded-lg shadow-sm hover:border-blue-500/30 transition-all hover:bg-white/[0.07]">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-bold text-white">
                                                    {typeof alert.location === 'string'
                                                        ? alert.location
                                                        : alert.location != null && typeof alert.location === 'object' && 'lat' in alert.location && 'lng' in alert.location
                                                            ? `${Number((alert.location as { lat: number; lng: number }).lat).toFixed(6)}, ${Number((alert.location as { lat: number; lng: number }).lng).toFixed(6)}`
                                                            : 'Unknown'}
                                                </span>
                                                <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 uppercase tracking-widest">
                                                    {alert.confidence != null ? `${alert.confidence}%` : ''} Confirmed
                                                </span>
                                            </div>
                                            <p className="text-sm text-[color:var(--text-sub)] mb-2">{alert.actionTaken}</p>
                                            <div className="flex items-center text-[10px] text-[color:var(--text-sub)] font-bold uppercase tracking-widest">
                                                <i className="far fa-clock mr-1" />
                                                {new Date(alert.timestamp).toLocaleString()}
                                            </div>
                                        </div>
                                    ))}
                                {detectionAlerts.filter(alert => alert.individualId === selectedIndividual.id).length === 0 && (
                                    <div className="text-center p-10 border-2 border-dashed border-white/5 rounded-lg text-[color:var(--text-sub)] bg-black/20 font-bold uppercase tracking-[0.2em] text-[10px] opacity-40">
                                        <i className="fas fa-check-circle text-2xl mb-3" />
                                        <p>No detections recorded</p>
                                    </div>
                                )}
                            </div>
                        </div>

            </div>
        </Modal>
    );
};

const DetailRow: React.FC<{ label: string; value: string; icon: string }> = ({ label, value, icon }) => (
    <div className="flex items-center space-x-3 p-2">
        <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center text-white border border-white/5">
            <i className={cn("fas", icon, "text-xs")} />
        </div>
        <div>
            <span className="block text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-widest leading-none mb-1.5">{label}</span>
            <span className="block text-sm font-bold text-[color:var(--text-main)] leading-none">{value}</span>
        </div>
    </div>
);
