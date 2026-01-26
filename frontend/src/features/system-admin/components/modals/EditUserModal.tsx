import React, { useEffect, useState } from 'react';
import { Button } from '../../../../components/UI/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { useSystemAdminContext } from '../../context/SystemAdminContext';

export const EditUserModal: React.FC = () => {
    const {
        showEditUserModal,
        setShowEditUserModal,
        selectedUser,
        setSelectedUser,
        handleUpdateUser
    } = useSystemAdminContext();

    // Use local state for form buffer
    const [userData, setUserData] = useState(selectedUser);

    useEffect(() => {
        setUserData(selectedUser);
    }, [selectedUser]);

    if (!showEditUserModal || !userData) return null;

    const onCommit = () => {
        if (userData) {
            setSelectedUser(userData);
            handleUpdateUser();
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <Card className="glass-card border-white/5 shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-300">
                <CardHeader className="border-b border-white/5 pb-4">
                    <CardTitle className="flex items-center text-xl font-bold text-white">
                        <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center mr-3 border border-blue-500/30">
                            <i className="fas fa-user-edit text-blue-400 text-lg" />
                        </div>
                        Modify Profile: {userData.name}
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Full Identity</label>
                            <input
                                type="text"
                                value={userData.name}
                                onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                                className="w-full px-5 py-3 border border-white/5 rounded-2xl focus:ring-2 focus:ring-blue-500/50 transition-all font-bold text-white bg-white/5 shadow-inner"
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Contact Email</label>
                            <input
                                type="email"
                                value={userData.email}
                                onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                                className="w-full px-5 py-3 border border-white/5 rounded-2xl focus:ring-2 focus:ring-blue-500/50 transition-all font-bold text-white bg-white/5 shadow-inner"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-4">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Security Role</label>
                                <select
                                    value={userData.role}
                                    onChange={(e) => setUserData({ ...userData, role: e.target.value })}
                                    className="w-full px-5 py-3 border border-white/5 rounded-2xl focus:ring-2 focus:ring-blue-500/50 transition-all font-bold text-white bg-white/5 appearance-none cursor-pointer shadow-inner"
                                >
                                    <option value="admin" className="bg-slate-900">Administrator</option>
                                    <option value="user" className="bg-slate-900">Staff Member</option>
                                    <option value="manager" className="bg-slate-900">Manager</option>
                                </select>
                            </div>
                            <div className="space-y-4">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Account Status</label>
                                <select
                                    value={userData.status}
                                    onChange={(e) => setUserData({ ...userData, status: e.target.value as any })}
                                    className="w-full px-5 py-3 border border-white/5 rounded-2xl focus:ring-2 focus:ring-blue-500/50 transition-all font-bold text-white bg-white/5 appearance-none cursor-pointer shadow-inner"
                                >
                                    <option value="active" className="bg-slate-900">Active</option>
                                    <option value="inactive" className="bg-slate-900">Inactive</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-4 pt-6 border-t border-white/5">
                            <Button
                                variant="glass"
                                onClick={() => setShowEditUserModal(false)}
                                className="font-bold uppercase text-[10px] tracking-widest text-slate-400 hover:text-white"
                            >
                                Abort
                            </Button>
                            <Button
                                variant="primary"
                                className="font-bold uppercase text-[10px] tracking-widest px-10 shadow-lg shadow-blue-600/20"
                                onClick={onCommit}
                            >
                                Commit Changes
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
