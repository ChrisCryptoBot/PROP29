import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
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
            default: return 'text-slate-400 bg-white/5 border-white/10';
        }
    };

    const getBanTypeBadgeClass = (banType: string): string => {
        switch (banType) {
            case 'TEMPORARY': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
            case 'PERMANENT': return 'text-red-400 bg-red-500/20 border-red-500/30';
            case 'CONDITIONAL': return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
            default: return 'text-slate-400 bg-white/5 border-white/10';
        }
    };

    const getStatusBadgeClass = (status: string): string => {
        switch (status) {
            case 'ACTIVE': return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
            case 'EXPIRED': return 'text-slate-400 bg-white/5 border-white/10';
            case 'REMOVED': return 'text-red-400 bg-red-500/20 border-red-500/30';
            default: return 'text-slate-400 bg-white/5 border-white/10';
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
                    color: 'text-slate-400 bg-white/5 border-white/10',
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
                    <h2 className="text-3xl font-black text-[color:var(--text-main)] uppercase tracking-tighter">Overview</h2>
                    <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic opacity-70">
                        Banned individuals monitoring and system status
                    </p>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <MetricCard
                    icon="fa-user-slash"
                    label="Active Bans"
                    value={metrics.activeBans}
                    badge="Active"
                    color="blue"
                />
                <MetricCard
                    icon="fa-exclamation-triangle"
                    label="Recent Detections"
                    value={metrics.recentDetections}
                    badge="Recent"
                    color="red"
                />
                <MetricCard
                    icon="fa-eye"
                    label="Facial Recognition"
                    value={`${metrics.facialRecognitionAccuracy}%`}
                    badge="Accuracy"
                    color="blue"
                />
            </div>

            {/* Recent Banned Individuals */}
            <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl group">
                <CardHeader>
                    <CardTitle className="flex items-center text-xl">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5 mr-3 group-hover:scale-110 transition-transform">
                            <i className="fas fa-users text-white text-lg" />
                        </div>
                        <span className="text-xl font-black uppercase tracking-tighter text-white">Recent Records</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {bannedIndividuals.slice(0, 2).map((individual) => (
                            <div
                                key={individual.id}
                                className="flex items-center justify-between p-4 border border-white/5 bg-white/5 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => handleViewDetails(individual)}
                            >
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-slate-500/80 to-slate-900 rounded-full flex items-center justify-center shadow-2xl border border-white/5">
                                        <span className="text-white font-semibold">
                                            {individual.firstName.charAt(0)}{individual.lastName.charAt(0)}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-[color:var(--text-main)]">
                                            {individual.firstName} {individual.lastName}
                                        </h3>
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
                </CardContent>
            </Card>

            {/* Ban Expiration Notifications */}
            {expiringBans.length > 0 && (
                <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 border-l-4 border-l-yellow-500 shadow-2xl group">
                    <CardHeader>
                        <CardTitle className="flex items-center text-xl">
                            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5 mr-3 group-hover:scale-110 transition-transform">
                                <i className="fas fa-clock text-white text-lg" />
                            </div>
                            <span className="text-xl font-black uppercase tracking-tighter text-yellow-400">Expiring Bans ({expiringBans.length})</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {expiringBans.slice(0, 3).map((ind) => {
                                const endDate = new Date(ind.banEndDate!);
                                const daysLeft = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                                return (
                                    <div key={ind.id} className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                                        <div>
                                            <span className="font-semibold text-yellow-100">{ind.firstName} {ind.lastName}</span>
                                            <span className="text-sm text-yellow-400 ml-2">
                                                - {daysLeft} day{daysLeft !== 1 ? 's' : ''} until expiration
                                            </span>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="primary" className=""
                                            onClick={() => handleViewDetails(ind)}
                                        >
                                            Review
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

const MetricCard: React.FC<{ icon: string; label: string; value: string | number; badge: string; color: 'blue' | 'red' }> = ({ icon, label, value, badge, color }) => (
    <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl group">
        <CardContent className="pt-6 px-6 pb-6 relative">
            <div className="absolute top-4 right-4">
                <span className={cn(
                    "px-2 py-0.5 text-[9px] font-black tracking-widest rounded uppercase",
                    color === 'blue' ? "text-white bg-blue-500/10 border border-blue-500/20" : "text-red-400 bg-red-500/10 border border-red-500/20"
                )}>
                    {badge}
                </span>
            </div>
            <div className="flex items-center justify-between mb-4 mt-2">
                <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shadow-2xl border border-white/5 transition-transform duration-300 group-hover:scale-110",
                    color === 'blue' ? "bg-gradient-to-br from-blue-600/80 to-slate-900" : "bg-gradient-to-br from-red-600/80 to-slate-900"
                )}>
                    <i className={cn("fas", icon, "text-white text-lg")} />
                </div>
            </div>
            <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">{label}</p>
                <h3 className="text-3xl font-black text-white">{value}</h3>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-slate-400">System metric</p>
            </div>
        </CardContent>
    </Card>
);





