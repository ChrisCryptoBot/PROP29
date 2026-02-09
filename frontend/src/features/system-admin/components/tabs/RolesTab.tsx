import React from 'react';
import { Button } from '../../../../components/UI/Button';
import { Badge } from '../../../../components/UI/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { useSystemAdminContext } from '../../context/SystemAdminContext';
import { cn } from '../../../../utils/cn';

export const RolesTab: React.FC = () => {
    const {
        roles,
        setShowAddRoleModal,
        setShowEditRoleModal,
        setShowImportRolesModal,
        setShowModifyMatrixModal,
        setSelectedRole,
        setActiveTab,
        setAuditCategory,
        setAuditSearchQuery,
        permissionMatrix,
    } = useSystemAdminContext();

    return (
        <div className="space-y-6">
            {/* Role Management Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h2 className="page-title">Role Management</h2>
                    <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic">
                        Manage user roles and permissions across the platform
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="primary"
                        className="font-bold uppercase text-[10px] tracking-widest px-6"
                        onClick={() => setShowAddRoleModal(true)}
                    >
                        <i className="fas fa-plus mr-2"></i>
                        Add Role
                    </Button>
                    <Button
                        variant="outline"
                        className="font-bold uppercase text-[10px] tracking-widest border-white/5"
                        onClick={() => setShowImportRolesModal(true)}
                    >
                        <i className="fas fa-upload mr-2 text-slate-400" aria-hidden />
                        Import
                    </Button>
                </div>
            </div>

            {/* Metrics Bar - Gold Standard Pattern (no KPI card grid) */}
            <div className="flex flex-wrap items-center gap-6 py-3 border-b border-white/5 text-sm mb-6">
                <span className="text-slate-400 font-medium">
                    Total Roles <strong className="text-white ml-1">{roles.length}</strong>
                </span>
                <span className="text-slate-400 font-medium">
                    Active <strong className="text-white ml-1">{roles.filter(r => r.badge === 'Active').length}</strong>
                </span>
                <span className="text-slate-400 font-medium">
                    Standard <strong className="text-white ml-1">{roles.filter(r => r.badge === 'Standard').length}</strong>
                </span>
                <span className="text-slate-400 font-medium">
                    Restricted <strong className="text-white ml-1">{roles.filter(r => r.badge === 'Restricted').length}</strong>
                </span>
            </div>

            {/* Role Cards */}
            <Card className="bg-slate-900/50 border border-white/5">
                <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
                    <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center">
                            <div className="card-title-icon-box" aria-hidden="true">
                                <i className="fas fa-user-shield text-white" />
                            </div>
                            <span className="card-title-text">Role Directory</span>
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    {roles.length === 0 ? (
                        <EmptyState
                            icon="fas fa-user-shield"
                            title="No Roles Defined"
                            description="Access hierarchy is currently unset. Define security roles to manage operational permissions across the console."
                            action={{
                                label: "Add Role",
                                onClick: () => setShowAddRoleModal(true)
                            }}
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {roles.map(role => (
                                <RoleCard
                                    key={role.id}
                                    {...role}
                                    onEdit={() => {
                                        setSelectedRole(role);
                                        setShowEditRoleModal(true);
                                    }}
                                    onHistory={() => {
                                        setActiveTab('audit');
                                        setAuditCategory('Role Management');
                                        setAuditSearchQuery(role.title);
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Permission Matrix */}
            <Card className="bg-slate-900/50 border border-white/5">
                <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
                    <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center">
                            <div className="card-title-icon-box" aria-hidden="true">
                                <i className="fas fa-th text-white" />
                            </div>
                            <span className="card-title-text">Permissions Matrix</span>
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            className="font-bold uppercase text-[10px] tracking-widest text-slate-400 hover:text-white border-white/5"
                            onClick={() => setShowModifyMatrixModal(true)}
                        >
                            <i className="fas fa-edit mr-2 text-slate-400" aria-hidden />
                            Modify Matrix
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/5">
                                    <th className="text-left py-4 px-6 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Module / Component</th>
                                    <th className="text-center py-4 px-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Administrator</th>
                                    <th className="text-center py-4 px-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Staff Ops</th>
                                    <th className="text-center py-4 px-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Read Only</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {Object.entries(permissionMatrix).map(([module, row]) => (
                                    <tr key={module} className="hover:bg-white/5 transition-colors">
                                        <td className="py-4 px-6 font-bold text-white text-sm">{module}</td>
                                        <td className="py-4 px-4 text-center">
                                            <Badge variant="success" size="sm">{row['Administrator'] ?? 'Total Access'}</Badge>
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            <Badge variant={(row['Staff Ops'] ?? '').includes('Restricted') ? 'secondary' : 'info'} size="sm">
                                                {row['Staff Ops'] ?? 'Operational'}
                                            </Badge>
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            <Badge variant={(row['Read Only'] ?? '').includes('Audit') ? 'info' : 'secondary'} size="sm">
                                                {row['Read Only'] ?? 'Denied'}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

const RoleCard: React.FC<{
    id: string;
    icon: string;
    title: string;
    description: string;
    users: number;
    permissions: string;
    modules: string;
    badge: string;
    badgeVariant: 'destructive' | 'success' | 'secondary' | 'outline';
    onEdit: () => void;
    onHistory: () => void;
}> = ({ icon, title, description, users, permissions, modules, badge, badgeVariant, onEdit, onHistory }) => {

    const getBadgeStyle = (variant: string) => {
        switch (variant) {
            case 'destructive': return 'bg-red-500/20 text-red-300 border-red-500/30';
            case 'success': return 'bg-green-500/20 text-green-300 border-green-500/30';
            case 'secondary': return 'bg-white/5 text-slate-400 border-white/5';
            default: return 'bg-white/5 text-slate-400 border-white/5';
        }
    };

    return (
        <div className="bg-white/5 border border-white/5 rounded-md p-5 hover:border-white/10 transition-colors">
            <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center border border-white/5">
                    <i className={`fas ${icon} text-white text-lg`}></i>
                </div>
                <Badge className={cn("font-bold uppercase text-[9px] tracking-widest px-2 py-0.5", getBadgeStyle(badgeVariant))}>
                    {badge}
                </Badge>
            </div>
            <h4 className="text-base font-black text-white mb-1 uppercase tracking-tight">{title}</h4>
            <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-2">{description || 'No description provided'}</p>

            <div className="space-y-2 mb-4 border-t border-white/5 pt-4">
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Users</span>
                    <span className="text-sm font-bold text-white">{users}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Auth Level</span>
                    <span className="text-sm font-bold text-blue-400">{permissions}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Scope</span>
                    <span className="text-sm font-bold text-slate-400">{modules}</span>
                </div>
            </div>

            <div className="flex gap-2">
                <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 font-bold uppercase text-[9px] tracking-widest text-slate-400 hover:text-white border-white/5"
                    onClick={onEdit}
                >
                    <i className="fas fa-cog mr-1 text-slate-400" aria-hidden />
                    Configure
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 font-bold uppercase text-[9px] tracking-widest text-slate-400 hover:text-white border-white/5"
                    onClick={onHistory}
                >
                    <i className="fas fa-history mr-1 text-slate-400" aria-hidden />
                    History
                </Button>
            </div>
        </div>
    );
};
