import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { SearchBar } from '../../../../components/UI/SearchBar';
import { useBannedIndividualsContext } from '../../context/BannedIndividualsContext';
import { cn } from '../../../../utils/cn';
import { useAuth } from '../../../../hooks/useAuth';
import { EmptyState } from '../../../../components/UI/EmptyState';

export const ManagementTab: React.FC = () => {
    const {
        filteredIndividuals,
        searchQuery, setSearchQuery,
        filterStatus, setFilterStatus,
        filterRiskLevel, setFilterRiskLevel,
        setShowAdvancedFiltersModal,
        selectedIndividuals,
        handleBulkExport,
        handleBulkDelete,
        handleToggleSelection,
        handleSelectAll,
        handleDeselectAll,
        setSelectedIndividual,
        setShowDetailsModal,
        setShowPhotoUploadModal
    } = useBannedIndividualsContext();

    const { user } = useAuth();
    const hasManagementAccess = user?.roles.some(role => ['ADMIN', 'SECURITY_OFFICER'].includes(role.toUpperCase()));

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
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-3xl font-black text-[color:var(--text-main)] uppercase tracking-tighter">Records</h2>
                    <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic opacity-70">
                        Search and modify ban records
                    </p>
                </div>
            </div>

            {/* Search and Filters */}
            <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl">
                <CardContent className="pt-6 px-6 pb-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tighter text-[color:var(--text-main)]">Individual Management</h3>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-[color:var(--text-sub)] mt-1">Search and modify ban records</p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Button
                                variant="outline"
                                onClick={handleBulkExport}
                                disabled={!hasManagementAccess}
                                title={!hasManagementAccess ? "Insufficient permissions" : ""}
                            >
                                <i className="fas fa-file-export mr-2" />
                                Export
                            </Button>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                        <div className="flex items-center gap-2 mr-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleSelectAll}
                                className="text-[10px] px-3 h-8"
                            >
                                Select All
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDeselectAll}
                                className="text-[10px] px-3 h-8"
                            >
                                Deselect All
                            </Button>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-8">
                        {['ALL', 'ACTIVE', 'EXPIRED', 'REMOVED'].map((status) => (
                            <Button
                                key={status}
                                variant={filterStatus === status ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilterStatus(status)}
                                className={cn(
                                    "font-black uppercase tracking-widest text-[10px] px-6 h-9 transition-all",
                                    filterStatus === status
                                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg border-none"
                                        : "border-white/10 text-[color:var(--text-sub)] hover:bg-white/5 hover:text-white"
                                )}
                            >
                                {status === 'ALL' ? 'All Records' : status}
                            </Button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2 relative">
                            <SearchBar
                                value={searchQuery}
                                onChange={setSearchQuery}
                                placeholder="Search by name, ID, or reason..."
                            />
                        </div>
                        <select
                            value={filterRiskLevel}
                            onChange={(e) => setFilterRiskLevel(e.target.value)}
                            className="px-4 py-2 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-white/5 font-black uppercase tracking-widest text-white text-[10px] cursor-pointer appearance-none"
                        >
                            <option value="ALL" className="bg-[#1a1c1e] text-white">All Risks</option>
                            <option value="LOW" className="bg-[#1a1c1e] text-white">Low Risk</option>
                            <option value="MEDIUM" className="bg-[#1a1c1e] text-white">Medium Risk</option>
                            <option value="HIGH" className="bg-[#1a1c1e] text-white">High Risk</option>
                            <option value="CRITICAL" className="bg-[#1a1c1e] text-white">Critical</option>
                        </select>
                        <Button
                            variant="outline"
                            onClick={() => setShowAdvancedFiltersModal(true)}
                        >
                            <i className="fas fa-sliders-h mr-2" />
                            Advanced Filters
                        </Button>
                    </div>

                    {selectedIndividuals.length > 0 && (
                        <div className="mt-4 flex items-center justify-between p-4 bg-red-500/10 border border-red-500/20 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex items-center">
                                <i className="fas fa-check-square text-red-400 mr-3" />
                                <span className="text-sm font-bold text-red-100">
                                    {selectedIndividuals.length} records selected for bulk action
                                </span>
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    size="sm"
                                    variant="glass"
                                    onClick={handleBulkExport}
                                    className="text-red-300 border-red-500/30 hover:bg-red-500/10 font-bold"
                                    disabled={!hasManagementAccess}
                                >
                                    Export Bulk
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={handleBulkDelete}
                                    disabled={!hasManagementAccess}
                                >
                                    Delete
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="overflow-hidden bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl">
                <CardHeader className="bg-white/5 border-b border-white/5 py-4 group cursor-pointer">
                    <CardTitle className="flex items-center text-xl font-black uppercase tracking-tighter text-white">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5 mr-3 group-hover:scale-110 transition-transform">
                            <i className="fas fa-clipboard-list text-white text-lg" />
                        </div>
                        Found {filteredIndividuals.length} Match{filteredIndividuals.length !== 1 ? 'es' : ''}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-white/5">
                        {filteredIndividuals.length === 0 ? (
                            <div className="p-20">
                                <EmptyState
                                    icon="fas fa-user-slash"
                                    title="No Records Found"
                                    description="No individuals match your current filter parameters. Adjust your search or clear filters to view all entries."
                                    className="bg-black/20 border-dashed border-2 border-white/5"
                                    action={{
                                        label: "CLEAR FILTERS",
                                        onClick: () => {
                                            setSearchQuery('');
                                            setFilterStatus('ALL');
                                            setFilterRiskLevel('ALL');
                                        },
                                        variant: 'outline'
                                    }}
                                />
                            </div>
                        ) : (
                            filteredIndividuals.map((individual) => (
                                <div
                                    key={individual.id}
                                    className="flex flex-col md:flex-row md:items-center justify-between p-5 hover:bg-white/5 transition-all group"
                                >
                                    <div className="flex items-center space-x-5 mb-4 md:mb-0">
                                        <input
                                            type="checkbox"
                                            checked={selectedIndividuals.includes(individual.id)}
                                            onChange={(e) => {
                                                e.stopPropagation();
                                                handleToggleSelection(individual.id);
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            className="w-5 h-5 accent-blue-600 cursor-pointer rounded border-white/10 bg-white/5"
                                        />
                                        <div className="relative">
                                            <div className="w-14 h-14 bg-gradient-to-br from-slate-400 to-slate-500 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-300">
                                                {individual.photoUrl ? (
                                                    <img src={individual.photoUrl} alt="" className="w-full h-full object-cover rounded-2xl" />
                                                ) : (
                                                    <span className="text-white font-bold text-xl">
                                                        {individual.firstName.charAt(0)}{individual.lastName.charAt(0)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className={cn("absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-[color:var(--surface-card)]", individual.status === 'ACTIVE' ? 'bg-green-500' : 'bg-slate-500')} />
                                        </div>
                                        <div 
                                            className="flex-1 min-w-[200px] cursor-pointer"
                                            onClick={() => handleViewDetails(individual)}
                                        >
                                            <h3 className="font-black uppercase tracking-tighter text-[color:var(--text-main)] text-xl group-hover:text-blue-400 transition-colors">
                                                {individual.firstName} {individual.lastName}
                                            </h3>
                                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-60 text-[color:var(--text-sub)] line-clamp-1">"{individual.reason}"</p>
                                            <div className="flex items-center text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-2">
                                                <i className="fas fa-id-badge mr-1 opacity-50" />
                                                ID: {individual.identificationNumber}
                                                <span className="mx-2 opacity-10">|</span>
                                                <i className="fas fa-calendar-plus mr-1 opacity-50" />
                                                Added: {new Date(individual.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
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
                                        <div className="h-8 w-[1px] bg-white/10 mx-2 hidden lg:block" />
                                        <Button
                                            size="sm"
                                            variant="glass"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedIndividual(individual);
                                                setShowPhotoUploadModal(true);
                                            }}
                                            className="text-[color:var(--text-sub)] border-white/10 hover:border-blue-500/50 hover:text-blue-400 rounded-lg px-3"
                                            disabled={!hasManagementAccess}
                                        >
                                            <i className="fas fa-fingerprint mr-2" />
                                            Add Photo
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};


