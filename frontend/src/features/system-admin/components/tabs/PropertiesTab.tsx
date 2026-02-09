import React from 'react';
import { Button } from '../../../../components/UI/Button';
import { Badge } from '../../../../components/UI/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { useSystemAdminContext } from '../../context/SystemAdminContext';
import { cn } from '../../../../utils/cn';

export const PropertiesTab: React.FC = () => {
    const {
        integrations,
        properties,
        setShowAddIntegrationModal,
        setShowAddPropertyModal,
        setShowEditPropertyModal,
        setSelectedProperty,
        setSelectedIntegration,
        setShowEditIntegrationModal,
        setActiveTab,
        setAuditCategory,
        setSelectedPropertyForMetrics,
        setShowPropertyMetricsModal,
        handleTestIntegration,
        handleSyncIntegration,
        handleDisableIntegration,
        handleExportIntegrations,
    } = useSystemAdminContext();

    const getBadgeStyle = (status: string) => {
        switch (status) {
            case 'Operational': return 'text-green-300 bg-green-500/20 border border-green-500/30';
            case 'Maintenance': return 'text-amber-300 bg-amber-500/20 border border-amber-500/30';
            case 'Closed': return 'text-red-300 bg-red-500/20 border border-red-500/30';
            default: return 'text-slate-300 bg-white/10 border border-white/20';
        }
    };

    return (
        <div className="space-y-6">
            {/* Property Management Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h2 className="page-title">Property & Integration Management</h2>
                    <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic">Manage multiple properties and system integrations</p>
                </div>
                <div className="flex items-center space-x-3">
                    <Button
                        variant="outline"
                        className="font-bold uppercase text-[10px] tracking-widest text-slate-400 hover:text-white border-white/5 hover:border-white/20"
                        onClick={() => setShowAddPropertyModal(true)}
                    >
                        <i className="fas fa-building mr-2"></i>
                        Add Property
                    </Button>
                    <Button
                        onClick={() => setShowAddIntegrationModal(true)}
                        variant="primary"
                        className="font-bold uppercase text-[10px] tracking-widest px-6"
                    >
                        <i className="fas fa-plus mr-2"></i>
                        Add Integration
                    </Button>
                </div>
            </div>

            {/* Metrics Bar - Gold Standard Pattern */}
            <div className="flex flex-wrap items-center gap-6 py-3 border-b border-white/5 text-sm mb-6 font-bold uppercase tracking-widest text-[color:var(--text-sub)]" role="group" aria-label="Property metrics">
                <span>Total Properties <strong className="font-black text-white ml-1">{properties.length}</strong></span>
                <span className="text-white/30" aria-hidden>·</span>
                <span>Active <strong className="font-black text-white ml-1">{properties.filter(p => p.status === 'Operational').length}</strong></span>
                <span className="text-white/30" aria-hidden>·</span>
                <span>Maintenance <strong className="font-black text-white ml-1">{properties.filter(p => p.status === 'Maintenance').length}</strong></span>
                <span className="text-white/30" aria-hidden>·</span>
                <span>Integrations <strong className="font-black text-white ml-1">{integrations.length}</strong></span>
            </div>

            {/* Properties Card - Gold Standard Pattern */}
            <Card className="bg-slate-900/50 border border-white/5">
                <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
                    <CardTitle className="flex items-center">
                        <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center mr-3 border border-white/5" aria-hidden>
                            <i className="fas fa-building text-white" />
                        </div>
                        <span className="text-sm font-black uppercase tracking-widest text-white">Properties</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    {properties.length === 0 ? (
                        <EmptyState
                            icon="fas fa-city"
                            title="No Properties Registered"
                            description="Property list is empty. Add your first facility to begin multi-property management."
                            action={{
                                label: "Add Property",
                                onClick: () => setShowAddPropertyModal(true)
                            }}
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {properties.map(property => (
                                <PropertyCard
                                    key={property.id}
                                    {...property}
                                    onEdit={() => {
                                        setSelectedProperty(property);
                                        setShowEditPropertyModal(true);
                                    }}
                                    onMetrics={() => {
                                        setSelectedPropertyForMetrics(property);
                                        setShowPropertyMetricsModal(true);
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Integration Management Card - Gold Standard Pattern */}
            <Card className="bg-slate-900/50 border border-white/5">
                <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
                    <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center">
                            <div className="w-10 h-10 bg-indigo-600 rounded-md flex items-center justify-center mr-3 border border-white/5" aria-hidden>
                                <i className="fas fa-plug text-white" />
                            </div>
                            <span className="text-sm font-black uppercase tracking-widest text-white">System Integrations</span>
                        </span>
                        <div className="flex items-center space-x-2">
                            <Button
                                size="sm"
                                variant="outline"
                                className="font-bold uppercase text-[10px] tracking-widest text-slate-400 hover:text-white border-white/5"
                                onClick={() => integrations.forEach(i => handleTestIntegration(i.id))}
                            >
                                <i className="fas fa-play mr-2 text-green-400" aria-hidden />
                                Global test
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="font-bold uppercase text-[10px] tracking-widest text-slate-400 hover:text-white border-white/5"
                                onClick={() => integrations.forEach(i => handleSyncIntegration(i.id))}
                            >
                                <i className="fas fa-sync-alt mr-2 text-blue-400" aria-hidden />
                                Network sync
                            </Button>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                {integrations.length === 0 ? (
                    <EmptyState
                        icon="fas fa-plug"
                        title="No Integrations Active"
                        description="External connections are currently detached. Add system integrations to synchronize with external systems."
                        action={{
                            label: "Add Integration",
                            onClick: () => setShowAddIntegrationModal(true)
                        }}
                    />
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Integration Name</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Protocol</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Endpoint</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Link Status</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Last Sync</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Operations</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {integrations.map((integration) => (
                                        <tr key={integration.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 bg-blue-600/20 rounded-md flex items-center justify-center mr-4 border border-blue-500/30">
                                                        <i className="fas fa-bolt text-blue-400 text-sm"></i>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-white uppercase tracking-tight">{integration.name}</div>
                                                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">ID: {integration.id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge className="bg-white/5 text-slate-400 border border-white/5 font-bold uppercase text-[10px] tracking-widest">
                                                    {integration.type}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400 font-mono italic">
                                                {integration.endpoint}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className={`w-2 h-2 rounded-full mr-3 ${integration.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                                                        }`}></div>
                                                    <Badge className={cn(
                                                        "font-bold uppercase text-[10px] tracking-widest px-2 py-0.5",
                                                        integration.status === 'active' ? 'text-green-300 bg-green-500/20 border border-green-500/30' : 'text-red-300 bg-red-500/20 border border-red-500/30'
                                                    )}>
                                                        {integration.status}
                                                    </Badge>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 font-bold">
                                                {integration.lastSync}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="w-10 h-10 p-0 border-white/5 hover:border-white/20"
                                                        onClick={() => handleTestIntegration(integration.id)}
                                                        aria-label="Test connection"
                                                    >
                                                        <i className="fas fa-play text-xs text-green-400" aria-hidden />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="w-10 h-10 p-0 border-white/5 hover:border-white/20"
                                                        onClick={() => {
                                                            setSelectedIntegration(integration);
                                                            setShowEditIntegrationModal(true);
                                                        }}
                                                        aria-label="Integration settings"
                                                    >
                                                        <i className="fas fa-cog text-xs text-blue-400" aria-hidden />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="w-10 h-10 p-0 border-white/5 hover:border-red-500/30"
                                                        onClick={() => handleDisableIntegration(integration.id)}
                                                        aria-label={integration.status === 'active' ? 'Disable integration' : 'Enable integration'}
                                                    >
                                                        <i className="fas fa-power-off text-xs text-red-400" aria-hidden />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Integration Table Footer */}
                        <div className="px-6 py-4 border-t border-white/5 bg-white/5">
                            <div className="flex items-center justify-between">
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    Viewing <span className="text-blue-400">1</span> to <span className="text-blue-400">{integrations.length}</span> of <span className="text-white">{integrations.length}</span> Integrations
                                </div>
                                <div className="flex items-center space-x-3">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="font-bold uppercase text-[10px] tracking-widest text-slate-400 hover:text-white border-white/5"
                                        onClick={handleExportIntegrations}
                                    >
                                        <i className="fas fa-download mr-2 text-slate-400" aria-hidden />
                                        Export
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="font-bold uppercase text-[10px] tracking-widest text-slate-400 hover:text-white border-white/5"
                                        onClick={() => {
                                            setActiveTab('audit');
                                            setAuditCategory('Integration');
                                        }}
                                    >
                                        <i className="fas fa-file-alt mr-2 text-slate-400" aria-hidden />
                                        Logs
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
                </CardContent>
            </Card>
        </div>
    );
};


const PropertyCard: React.FC<{
    id: string;
    icon: string;
    title: string;
    description: string;
    rooms: number;
    occupancy: string;
    revenue: string;
    status: string;
    onEdit: () => void;
    onMetrics: () => void;
}> = ({ icon, title, description, rooms, occupancy, revenue, status, onEdit, onMetrics }) => {

    const getBadgeStyle = (val: string) => {
        switch (val) {
            case 'Operational': return 'bg-green-500/20 text-green-300 border-green-500/30';
            case 'Maintenance': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
            case 'Closed': return 'bg-red-500/20 text-red-300 border-red-500/30';
            default: return 'bg-white/5 text-slate-400 border-white/5';
        }
    };

    return (
        <Card className="bg-slate-900/50 border border-white/5 border-white/5 transition-colors">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-5">
                    <div className="w-14 h-14 bg-blue-600 rounded-md flex items-center justify-center border border-white/5">
                        <i className={`fas ${icon} text-white text-2xl`} aria-hidden />
                    </div>
                    <Badge className={cn("font-bold uppercase text-[10px] tracking-widest px-3 py-1", getBadgeStyle(status))}>
                        {status}
                    </Badge>
                </div>
                <h4 className="text-xl font-black text-white mb-2 uppercase tracking-tighter group-hover:text-blue-200 transition-colors">{title}</h4>
                <p className="text-xs font-medium text-slate-500 leading-relaxed mb-6 h-10 line-clamp-2">{description}</p>

                <div className="space-y-4 mb-6 border-y border-white/5 py-4">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Inventory</span>
                        <span className="text-sm font-bold text-white">{rooms} Units</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Occupancy</span>
                        <span className="text-sm font-bold text-blue-400">{occupancy}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Revenue</span>
                        <span className="text-sm font-bold text-green-400">{revenue}</span>
                    </div>
                </div>

                <div className="flex space-x-3">
                    <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 font-bold uppercase text-[10px] tracking-widest text-slate-400 hover:text-white border-white/5 hover:border-white/20"
                        onClick={onEdit}
                    >
                        <i className="fas fa-cog mr-2 text-slate-400" aria-hidden />
                        Manage
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 font-bold uppercase text-[10px] tracking-widest text-slate-400 hover:text-white border-white/5 hover:border-white/20"
                        onClick={onMetrics}
                    >
                        <i className="fas fa-chart-bar mr-2 text-slate-400" aria-hidden />
                        Metrics
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};



