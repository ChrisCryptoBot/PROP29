import React from 'react';
import { Button } from '../../../../components/UI/Button';
import { Badge } from '../../../../components/UI/Badge';
import { Card, CardContent } from '../../../../components/UI/Card';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { useSystemAdminContext } from '../../context/SystemAdminContext';
import { cn } from '../../../../utils/cn';

export const RolesTab: React.FC = () => {
    const {
        roles,
        setShowAddRoleModal,
        setShowEditRoleModal,
        setSelectedRole,
        showSuccess
    } = useSystemAdminContext();

    const getBadgeClass = (variant: string) => {
        switch (variant) {
            case 'success': return 'text-green-300 bg-green-500/20 border border-green-500/30';
            case 'secondary': return 'text-slate-300 bg-white/10 border border-white/20';
            case 'destructive': return 'text-red-300 bg-red-500/20 border border-red-500/30';
            default: return 'text-slate-300 bg-white/10 border border-white/20';
        }
    };

    return (
        <div className="space-y-6">
            {/* Role Management Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h3 className="text-2xl font-bold text-[color:var(--text-main)]">Role Management</h3>
                    <p className="text-[color:var(--text-sub)]">Manage user roles and permissions across the platform</p>
                </div>
                <div className="flex items-center space-x-3">
                    <Button
                        variant="primary"
                        className="font-bold uppercase text-[10px] tracking-widest px-6 shadow-lg shadow-blue-600/20"
                        onClick={() => setShowAddRoleModal(true)}
                    >
                        <i className="fas fa-plus mr-2"></i>
                        Add Role
                    </Button>
                    <Button
                        variant="outline"
                        className=""
                        onClick={() => showSuccess('Importing roles')}
                    >
                        <i className="fas fa-upload mr-2"></i>
                        Import
                    </Button>
                </div>
            </div>

            {/* Role Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon="fa-shield-alt" label="Total Roles" value={roles.length.toString()} />
                <StatCard icon="fa-check-circle" label="Active Roles" value={roles.filter(r => r.badge === 'Active').length.toString()} />
                <StatCard icon="fa-cog" label="Custom Roles" value="0" />
                <StatCard icon="fa-key" label="Permission Sets" value="12" />
            </div>

            {/* Role Cards */}
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {roles.map(role => (
                        <RoleCard
                            key={role.id}
                            {...role}
                            onEdit={() => {
                                setSelectedRole(role);
                                setShowEditRoleModal(true);
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Permission Matrix */}
            <div className="glass-card border-white/10 shadow-xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <h4 className="text-lg font-bold text-white uppercase tracking-wider">Permissions Matrix</h4>
                    <Button
                        variant="glass"
                        className="font-bold uppercase text-[10px] tracking-widest text-slate-400 hover:text-white border-white/5"
                        onClick={() => showSuccess('Editing permission matrix')}
                    >
                        <i className="fas fa-edit mr-2"></i>
                        Modify Matrix
                    </Button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="text-left py-4 px-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Module / Component</th>
                                <th className="text-center py-4 px-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Administrator</th>
                                <th className="text-center py-4 px-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Staff Ops</th>
                                <th className="text-center py-4 px-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Read Only</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {['Dashboard', 'Users', 'Roles', 'Properties', 'System', 'Security', 'Audit'].map((module) => (
                                <tr key={module} className="hover:bg-white/5 transition-colors">
                                    <td className="py-4 px-4 font-bold text-white text-sm">{module}</td>
                                    <td className="py-4 px-4 text-center">
                                        <Badge variant="success" className="bg-green-500/20 text-green-300 border-green-500/30">Total Access</Badge>
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                        <Badge
                                            className={cn(
                                                "font-bold uppercase text-[10px] tracking-widest px-2.5 py-1",
                                                module === 'System' || module === 'Security'
                                                    ? 'text-slate-400 bg-white/5 border border-white/10'
                                                    : 'text-blue-300 bg-blue-500/20 border border-blue-500/30'
                                            )}
                                        >
                                            {module === 'System' || module === 'Security' ? 'Restricted' : 'Operational'}
                                        </Badge>
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                        <Badge
                                            className={cn(
                                                "font-bold uppercase text-[10px] tracking-widest px-2.5 py-1",
                                                module === 'Dashboard' || module === 'Users'
                                                    ? 'text-blue-300 bg-blue-500/20 border border-blue-500/30'
                                                    : 'text-slate-500 bg-white/5 border border-white/5'
                                            )}
                                        >
                                            {module === 'Dashboard' || module === 'Users' ? 'Audit' : 'Denied'}
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const StatCard: React.FC<{ icon: string; label: string; value: string }> = ({ icon, label, value }) => (
    <div className="glass-card border-white/5 shadow-lg rounded-2xl p-6 transition-all duration-300 hover:border-white/20 hover:shadow-blue-500/10 group">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 group-hover:text-slate-400 transition-colors">{label}</p>
                <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600/20 to-indigo-600/20 rounded-xl flex items-center justify-center border border-blue-500/30 shadow-lg group-hover:scale-110 transition-transform">
                <i className={`fas ${icon} text-blue-400 text-lg`}></i>
            </div>
        </div>
    </div>
);

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
}> = ({ icon, title, description, users, permissions, modules, badge, badgeVariant, onEdit }) => {
    const { showSuccess } = useSystemAdminContext();

    const getBadgeStyle = (variant: string) => {
        switch (variant) {
            case 'destructive': return 'bg-red-500/20 text-red-300 border-red-500/30';
            case 'success': return 'bg-green-500/20 text-green-300 border-green-500/30';
            case 'secondary': return 'bg-white/5 text-slate-400 border-white/10';
            default: return 'bg-white/5 text-slate-400 border-white/10';
        }
    };

    return (
        <Card className="glass-card border-white/10 shadow-xl hover:shadow-blue-500/10 transition-all duration-300 group">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-5">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-600/20 to-indigo-600/20 rounded-2xl flex items-center justify-center border border-blue-500/30 shadow-lg group-hover:scale-110 transition-transform">
                        <i className={`fas ${icon} text-blue-400 text-2xl`}></i>
                    </div>
                    <Badge className={cn("font-bold uppercase text-[10px] tracking-widest px-3 py-1 shadow-inner", getBadgeStyle(badgeVariant))}>
                        {badge}
                    </Badge>
                </div>
                <h4 className="text-xl font-bold text-white mb-2 tracking-tight group-hover:text-blue-200 transition-colors uppercase">{title}</h4>
                <p className="text-xs font-medium text-slate-500 leading-relaxed mb-6">{description}</p>

                <div className="space-y-4 mb-6 border-y border-white/5 py-4">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Active Users</span>
                        <span className="text-sm font-bold text-white">{users}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Auth Level</span>
                        <span className="text-sm font-bold text-blue-400">{permissions}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Scope</span>
                        <span className="text-sm font-bold text-slate-300">{modules}</span>
                    </div>
                </div>

                <div className="flex space-x-3">
                    <Button
                        size="sm"
                        variant="glass"
                        className="flex-1 font-bold uppercase text-[10px] tracking-widest text-slate-400 hover:text-white border-white/5 hover:border-white/20"
                        onClick={onEdit}
                    >
                        <i className="fas fa-sliders-h mr-2" />
                        Configure
                    </Button>
                    <Button
                        size="sm"
                        variant="glass"
                        className="flex-1 font-bold uppercase text-[10px] tracking-widest text-slate-400 hover:text-white border-white/5 hover:border-white/20"
                        onClick={() => showSuccess(`Accessing logs for ${title}`)}
                    >
                        <i className="fas fa-history mr-2" />
                        History
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};


