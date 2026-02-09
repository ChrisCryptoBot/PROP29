import React from 'react';
import { Button } from '../../../../components/UI/Button';
import { useBannedIndividualsContext } from '../../context/BannedIndividualsContext';
import { cn } from '../../../../utils/cn';

export const OverviewTab: React.FC = () => {
    const {
        metrics,
        bannedIndividuals,
        expiringBans,
        setSelectedIndividual,
        setShowDetailsModal
    } = useBannedIndividualsContext();

    const getRiskLevelBadgeClass = (riskLevel: string): string => {
        switch (riskLevel) {
            case 'LOW': return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
            case 'MEDIUM': return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
            case 'HIGH': return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
            case 'CRITICAL': return 'text-red-400 bg-red-500/20 border-red-500/30';
            default: return 'text-slate-400 bg-white/5 border-white/5';
        }
    };

    const getBanTypeBadgeClass = (banType: string): string => {
        switch (banType) {
            case 'TEMPORARY': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
            case 'PERMANENT': return 'text-red-400 bg-red-500/20 border-red-500/30';
            case 'CONDITIONAL': return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
            default: return 'text-slate-400 bg-white/5 border-white/5';
        }
    };

    const getStatusBadgeClass = (status: string): string => {
        switch (status) {
            case 'ACTIVE': return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
            case 'EXPIRED': return 'text-slate-400 bg-white/5 border-white/5';
            case 'REMOVED': return 'text-red-400 bg-red-500/20 border-red-500/30';
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
                    label: 'Agent',
                    color: 'text-blue-400 bg-blue-500/20 border-blue-500/30',
                    tooltip: sourceMetadata.agentName 
                        ? `Submitted by ${sourceMetadata.agentName}${sourceMetadata.agentTrustScore ? ` (Trust: ${sourceMetadata.agentTrustScore})` : ''}`
                        : 'Submitted by mobile agent'
                };
            case 'HARDWARE_DEVICE':
                return {
                    icon: 'fa-video',
                    label: 'Device',
                    color: 'text-purple-400 bg-purple-500/20 border-purple-500/30',
                    tooltip: sourceMetadata.deviceName 
                        ? `Detected by ${sourceMetadata.deviceName}`
                        : 'Detected by hardware device'
                };
            case 'AUTO_APPROVED':
                return {
                    icon: 'fa-check-circle',
                    label: 'Auto',
                    color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
                    tooltip: 'Auto-approved based on trust score'
                };
            case 'BULK_IMPORT':
                return {
                    icon: 'fa-file-import',
                    label: 'Import',
                    color: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
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

    const handleViewDetails = (individual: any) => {
        setSelectedIndividual(individual);
        setShowDetailsModal(true);
    };

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="page-title">Overview</h2>
                    <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic">
                        Banned individuals monitoring and system status
                    </p>
                </div>
            </div>

            {/* Compact metrics bar (gold standard — same size as Patrol Command Center) */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-bold uppercase tracking-widest text-[color:var(--text-sub)] mb-6" role="group" aria-label="Banned Individuals metrics">
                <span>Active Bans <strong className="font-black text-white">{metrics.activeBans}</strong> · Recent Detections <strong className="font-black text-white">{metrics.recentDetections}</strong> · Records with photo <strong className="font-black text-white">{metrics.facialRecognitionAccuracy}</strong></span>
            </div>

            {/* Recent Records (section per gold standard) */}
            <section aria-labelledby="bi-recent-records-heading" className="mb-6">
                <h3 id="bi-recent-records-heading" className="text-sm font-black uppercase tracking-widest text-[color:var(--text-main)] mb-4">Recent Records</h3>
                <div className="space-y-4">
                    {bannedIndividuals.slice(0, 2).map((individual) => (
                        <div
                            key={individual.id}
                            className="flex items-center justify-between p-4 border border-white/5 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                            onClick={() => handleViewDetails(individual)}
                        >
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-slate-500/80 to-slate-900 rounded-full flex items-center justify-center border border-white/5">
                                    <span className="text-white font-semibold">
                                        {individual.firstName.charAt(0)}{individual.lastName.charAt(0)}
                                    </span>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-[color:var(--text-main)]">
                                        {individual.firstName} {individual.lastName}
                                    </h4>
                                    <p className="text-sm text-[color:var(--text-sub)]">{individual.reason}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                {(() => {
                                    const sourceBadge = getSourceBadge(individual);
                                    return (
                                        <span 
                                            className={cn("px-2.5 py-1 text-xs font-semibold rounded flex items-center gap-1.5", sourceBadge.color)}
                                            title={sourceBadge.tooltip}
                                        >
                                            <i className={cn("fas text-[10px]", sourceBadge.icon)} />
                                            {sourceBadge.label}
                                        </span>
                                    );
                                })()}
                                <span className={cn("px-2.5 py-1 text-xs font-semibold rounded", getRiskLevelBadgeClass(individual.riskLevel))}>
                                    {individual.riskLevel}
                                </span>
                                <span className={cn("px-2.5 py-1 text-xs font-semibold rounded", getBanTypeBadgeClass(individual.banType))}>
                                    {individual.banType}
                                </span>
                                <span className={cn("px-2.5 py-1 text-xs font-semibold rounded", getStatusBadgeClass(individual.status))}>
                                    {individual.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Expiring Bans (section per gold standard) */}
            {expiringBans.length > 0 && (
                <section aria-labelledby="bi-expiring-heading" className="rounded-lg border border-white/5 border-l-4 border-l-yellow-500 bg-yellow-500/5 p-6">
                    <h3 id="bi-expiring-heading" className="text-sm font-black uppercase tracking-widest text-[color:var(--text-main)] mb-4">Expiring Bans ({expiringBans.length})</h3>
                    <div className="space-y-2">
                        {expiringBans.slice(0, 3).map((ind) => {
                            const endDate = new Date(ind.banEndDate!);
                            const daysLeft = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                            return (
                                <div key={ind.id} className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                                    <div>
                                        <span className="font-semibold text-yellow-100">{ind.firstName} {ind.lastName}</span>
                                        <span className="text-sm text-white ml-2">
                                            - {daysLeft} day{daysLeft !== 1 ? 's' : ''} until expiration
                                        </span>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="primary"
                                        onClick={() => handleViewDetails(ind)}
                                    >
                                        Review
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}
        </div>
    );
};





