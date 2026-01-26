import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { useSystemAdminContext } from '../../context/SystemAdminContext';

export const EditRoleModal: React.FC = () => {
    const {
        showEditRoleModal,
        setShowEditRoleModal,
        selectedRole,
        handleUpdateRole
    } = useSystemAdminContext();

    const [roleData, setRoleData] = useState(selectedRole);

    useEffect(() => {
        setRoleData(selectedRole);
    }, [selectedRole]);

    if (!showEditRoleModal || !roleData) return null;

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <Card className="glass-card border-white/5 shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-300">
                <CardHeader className="border-b border-white/5 pb-4">
                    <CardTitle className="flex items-center text-xl font-bold text-white">
                        <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center mr-3 border border-blue-500/30">
                            <i className="fas fa-edit text-blue-400 text-lg" />
                        </div>
                        Modify Role: {roleData.title}
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
                                className="w-full px-5 py-3 border border-white/5 rounded-2xl focus:ring-2 focus:ring-blue-500/50 transition-all font-bold text-white bg-white/5 placeholder:text-slate-600 shadow-inner font-mono"
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Operational Description</label>
                            <textarea
                                value={roleData.description}
                                onChange={(e) => setRoleData({ ...roleData, description: e.target.value })}
                                className="w-full px-5 py-3 border border-white/5 rounded-2xl focus:ring-2 focus:ring-blue-500/50 transition-all font-bold text-white bg-white/5 placeholder:text-slate-600 shadow-inner h-24 resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-4">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Badge Label</label>
                                <input
                                    type="text"
                                    value={roleData.badge}
                                    onChange={(e) => setRoleData({ ...roleData, badge: e.target.value })}
                                    className="w-full px-5 py-3 border border-white/5 rounded-2xl focus:ring-2 focus:ring-blue-500/50 transition-all font-bold text-white bg-white/5 shadow-inner"
                                />
                            </div>
                            <div className="space-y-4">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Clearance Level</label>
                                <input
                                    type="text"
                                    value={roleData.permissions}
                                    onChange={(e) => setRoleData({ ...roleData, permissions: e.target.value })}
                                    className="w-full px-5 py-3 border border-white/5 rounded-2xl focus:ring-2 focus:ring-blue-500/50 transition-all font-bold text-white bg-white/5 shadow-inner"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end space-x-4 pt-6 border-t border-white/5">
                            <Button
                                variant="glass"
                                onClick={() => setShowEditRoleModal(false)}
                                className="font-bold uppercase text-[10px] tracking-widest text-slate-400 hover:text-white"
                            >
                                Abort Changes
                            </Button>
                            <Button
                                variant="primary"
                                className="font-bold uppercase text-[10px] tracking-widest px-10 shadow-lg shadow-blue-600/20"
                                onClick={handleUpdateRole}
                            >
                                Commit Update
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
