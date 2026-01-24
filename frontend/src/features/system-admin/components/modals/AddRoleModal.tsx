import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { useSystemAdminContext } from '../../context/SystemAdminContext';

export const AddRoleModal: React.FC = () => {
    const {
        showAddRoleModal,
        setShowAddRoleModal,
        showSuccess
    } = useSystemAdminContext();

    const [roleData, setRoleData] = useState({
        title: '',
        description: '',
        permissions: 'Limited (75%)',
        modules: 'Most',
        badge: 'Active',
        badgeVariant: 'success' as const
    });

    if (!showAddRoleModal) return null;

    const handleSave = () => {
        showSuccess(`Role "${roleData.title}" created successfully (Simulated)`);
        setShowAddRoleModal(false);
    };

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <Card className="glass-card border-white/10 shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-300">
                <CardHeader className="border-b border-white/5 pb-4">
                    <CardTitle className="flex items-center text-xl font-bold text-white">
                        <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center mr-3 border border-blue-500/30">
                            <i className="fas fa-user-tag text-blue-400 text-lg" />
                        </div>
                        Create Security Role
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Role Identifier</label>
                            <input
                                type="text"
                                value={roleData.title}
                                onChange={(e) => setRoleData({ ...roleData, title: e.target.value })}
                                className="w-full px-5 py-3 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500/50 transition-all font-bold text-white bg-white/5 placeholder:text-slate-600 shadow-inner"
                                placeholder="e.g. System Auditor"
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Operational Description</label>
                            <textarea
                                value={roleData.description}
                                onChange={(e) => setRoleData({ ...roleData, description: e.target.value })}
                                className="w-full px-5 py-3 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500/50 transition-all font-bold text-white bg-white/5 placeholder:text-slate-600 shadow-inner h-24 resize-none"
                                placeholder="Describe the scope of this role..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-4">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Initial Badge</label>
                                <select
                                    value={roleData.badge}
                                    onChange={(e) => setRoleData({ ...roleData, badge: e.target.value })}
                                    className="w-full px-5 py-3 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500/50 transition-all font-bold text-white bg-white/5 appearance-none cursor-pointer shadow-inner"
                                >
                                    <option value="Active" className="bg-slate-900">Active</option>
                                    <option value="Standard" className="bg-slate-900">Standard</option>
                                    <option value="Restricted" className="bg-slate-900">Restricted</option>
                                </select>
                            </div>
                            <div className="space-y-4">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Security Clearance</label>
                                <select
                                    value={roleData.permissions}
                                    onChange={(e) => setRoleData({ ...roleData, permissions: e.target.value })}
                                    className="w-full px-5 py-3 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500/50 transition-all font-bold text-white bg-white/5 appearance-none cursor-pointer shadow-inner"
                                >
                                    <option value="Read (25%)" className="bg-slate-900">Level 1 (25%)</option>
                                    <option value="Limited (50%)" className="bg-slate-900">Level 2 (50%)</option>
                                    <option value="Limited (75%)" className="bg-slate-900">Level 3 (75%)</option>
                                    <option value="All (100%)" className="bg-slate-900">Level 4 (100%)</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-4 pt-6 border-t border-white/5">
                            <Button
                                variant="glass"
                                onClick={() => setShowAddRoleModal(false)}
                                className="font-bold uppercase text-[10px] tracking-widest text-slate-400 hover:text-white"
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                className="font-bold uppercase text-[10px] tracking-widest px-10 shadow-lg shadow-blue-600/20"
                                onClick={handleSave}
                            >
                                Create Role
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
