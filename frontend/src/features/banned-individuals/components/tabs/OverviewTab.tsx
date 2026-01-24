import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { useBannedIndividualsContext } from '../../context/BannedIndividualsContext';
import { cn } from '../../../../utils/cn';

export const OverviewTab: React.FC = () => {
    const {
        metrics,
        bannedIndividuals,
        facialRecognitionStats,
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

    const handleViewDetails = (individual: any) => {
        setSelectedIndividual(individual);
        setShowDetailsModal(true);
    };

    return (
        <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <MetricCard
                    icon="fa-building"
                    label="Chain-wide Bans"
                    value={metrics.chainWideBans}
                    badge="Chain"
                    color="blue"
                />
            </div>

            {/* Recent Banned Individuals */}
            <Card className="bg-[color:var(--surface-card)] border-[1.5px] border-[color:var(--border-subtle)] group">
                <CardHeader>
                    <CardTitle className="flex items-center text-xl">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center shadow-lg mr-3 group-hover:scale-110 transition-transform">
                            <i className="fas fa-users text-white text-lg" />
                        </div>
                        <span className="text-xl font-black uppercase tracking-tighter">Recent Records</span>
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
                                    <div className="w-12 h-12 bg-gradient-to-br from-slate-500 to-slate-600 rounded-full flex items-center justify-center">
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

            {/* Facial Recognition Intelligence */}
            <Card className="bg-[color:var(--surface-card)] border-[1.5px] border-[color:var(--border-subtle)] group">
                <CardHeader>
                    <CardTitle className="flex items-center text-xl">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center shadow-lg mr-3 group-hover:scale-110 transition-transform">
                            <i className="fas fa-brain text-white text-lg" />
                        </div>
                        <span className="text-xl font-black uppercase tracking-tighter">Recognition Stats</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <IntelligenceItem
                            icon="fa-shield-check"
                            label="Training Status"
                            value={facialRecognitionStats.trainingStatus}
                            color={facialRecognitionStats.trainingStatus === 'TRAINED' ? 'emerald' : (facialRecognitionStats.trainingStatus === 'TRAINING' ? 'amber' : 'red')}
                        />
                        <IntelligenceItem
                            icon="fa-target-point"
                            label="Detection Accuracy"
                            value={`${facialRecognitionStats.accuracy}%`}
                            color="blue"
                        />
                        <IntelligenceItem
                            icon="fa-video"
                            label="Real-time Monitoring"
                            value="Active"
                            color="emerald"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Ban Expiration Notifications */}
            {expiringBans.length > 0 && (
                <Card className="bg-[color:var(--surface-card)] border-[1.5px] border-[color:var(--border-subtle)] border-l-4 border-l-yellow-500 group">
                    <CardHeader>
                        <CardTitle className="flex items-center text-xl">
                            <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center shadow-lg mr-3 group-hover:scale-110 transition-transform">
                                <i className="fas fa-clock text-white text-lg" />
                            </div>
                            <span className="text-xl font-black uppercase tracking-tighter text-yellow-500">Expiring Bans ({expiringBans.length})</span>
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


            {/* Module Integrations */}
            <Card className="bg-[color:var(--surface-card)] border-[1.5px] border-[color:var(--border-subtle)]">
                <CardHeader>
                    <CardTitle className="flex items-center text-xl">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center shadow-lg mr-3 group-hover:scale-110 transition-transform">
                            <i className="fas fa-plug text-white text-lg" />
                        </div>
                        <span className="text-xl font-black uppercase tracking-tighter">Integrations</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <IntegrationItem label="Incident Log" status="Connected" description="Automatically create bans from incidents" />
                        <IntegrationItem label="Access Control" status="Connected" description="Banned individuals automatically denied access" />
                        <IntegrationItem label="Facial Recognition" status="Active" description="Real-time detection and alerts" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

const MetricCard: React.FC<{ icon: string; label: string; value: string | number; badge: string; color: 'blue' | 'red' }> = ({ icon, label, value, badge, color }) => (
    <Card className="bg-[color:var(--surface-card)] border-[1.5px] border-[color:var(--border-subtle)] shadow-sm group transition-all duration-300">
        <CardContent className="pt-6 px-6 pb-6">
            <div className="flex items-center justify-between mb-4">
                <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shadow-lg mt-2 transition-transform duration-300 group-hover:scale-110",
                    color === 'blue' ? "bg-gradient-to-br from-blue-600 to-blue-800" : "bg-gradient-to-br from-red-500 to-red-700"
                )}>
                    <i className={cn("fas text-white text-xl", icon)} />
                </div>
                <span className={cn(
                    "px-2.5 py-1 text-xs font-semibold rounded",
                    color === 'blue' ? "text-blue-300 bg-blue-500/20 border border-blue-500/30" : "text-red-300 bg-red-500/20 border border-red-500/30"
                )}>
                    {badge}
                </span>
            </div>
            <div className="space-y-1">
                <h3 className="text-2xl font-black text-[color:var(--text-main)] uppercase tracking-tighter">{value}</h3>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-[color:var(--text-sub)]">{label}</p>
            </div>
        </CardContent>
    </Card>
);

const IntelligenceItem: React.FC<{ icon: string; label: string; value: string; color?: 'blue' | 'emerald' | 'amber' | 'red' }> = ({ icon, label, value, color = 'blue' }) => {
    const colorClasses = {
        blue: "from-blue-600 to-blue-800 shadow-blue-500/20",
        emerald: "from-emerald-600 to-emerald-800 shadow-emerald-500/20",
        amber: "from-amber-500 to-amber-700 shadow-amber-500/20",
        red: "from-red-500 to-red-700 shadow-red-500/20",
    };

    return (
        <div className="text-center group p-4 rounded-2xl hover:bg-white/5 transition-all">
            <div className={cn(
                "w-16 h-16 bg-gradient-to-br rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg transition-transform duration-300 group-hover:scale-110",
                colorClasses[color]
            )}>
                <i className={cn("fas text-white text-2xl", icon)} />
            </div>
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-[color:var(--text-sub)] mb-2">{label}</h3>
            <p className="text-sm font-black text-white uppercase tracking-widest">{value}</p>
        </div>
    );
};

const IntegrationItem: React.FC<{ label: string; status: string; description: string }> = ({ label, status, description }) => (
    <div className="p-4 rounded-lg bg-white/5 border border-white/5">
        <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-[color:var(--text-main)]">{label}</span>
            <span className="px-2.5 py-1 text-xs font-semibold rounded text-green-300 bg-green-500/20 border border-green-500/30">
                {status}
            </span>
        </div>
        <p className="text-sm text-[color:var(--text-sub)]">{description}</p>
    </div>
);




