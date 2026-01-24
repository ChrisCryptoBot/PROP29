import React from 'react';
import { Button } from '../../../../components/UI/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { useSystemAdminContext } from '../../context/SystemAdminContext';

export const AddUserModal: React.FC = () => {
    const {
        showAddUserModal,
        setShowAddUserModal,
        newUser,
        setNewUser,
        handleAddUser
    } = useSystemAdminContext();

    if (!showAddUserModal) return null;

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <Card className="glass-card border-white/10 shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-300">
                <CardHeader className="border-b border-white/5 pb-4">
                    <CardTitle className="flex items-center text-xl font-bold text-white">
                        <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center mr-3 border border-blue-500/30">
                            <i className="fas fa-user-plus text-blue-400 text-lg" />
                        </div>
                        Enlist System User
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Full Legal Name</label>
                            <div className="relative">
                                <i className="fas fa-id-card absolute left-4 top-1/2 -translate-y-1/2 text-blue-400/50" />
                                <input
                                    type="text"
                                    value={newUser.name}
                                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                    className="w-full pl-12 pr-5 py-3 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500/50 transition-all font-bold text-white bg-white/5 placeholder:text-slate-600 shadow-inner"
                                    placeholder="e.g. Alexander Pierce"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Secure Email Address</label>
                            <div className="relative">
                                <i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-blue-400/50" />
                                <input
                                    type="email"
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                    className="w-full pl-12 pr-5 py-3 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500/50 transition-all font-bold text-white bg-white/5 placeholder:text-slate-600 shadow-inner"
                                    placeholder="admin@proper.security"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-4">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Designated Role</label>
                                <select
                                    value={newUser.role}
                                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                    className="w-full px-5 py-3 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500/50 transition-all font-bold text-white bg-white/5 appearance-none cursor-pointer shadow-inner"
                                >
                                    <option value="admin" className="bg-slate-900">Administrator</option>
                                    <option value="user" className="bg-slate-900">Staff Member</option>
                                    <option value="manager" className="bg-slate-900">Manager</option>
                                </select>
                            </div>
                            <div className="space-y-4">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Status</label>
                                <select
                                    value={newUser.status}
                                    onChange={(e) => setNewUser({ ...newUser, status: e.target.value as any })}
                                    className="w-full px-5 py-3 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500/50 transition-all font-bold text-white bg-white/5 appearance-none cursor-pointer shadow-inner"
                                >
                                    <option value="active" className="bg-slate-900">Active</option>
                                    <option value="inactive" className="bg-slate-900">Inactive</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-4 pt-6 border-t border-white/5">
                            <Button
                                variant="glass"
                                onClick={() => setShowAddUserModal(false)}
                                className="font-bold uppercase text-[10px] tracking-widest text-slate-400 hover:text-white"
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                className="font-bold uppercase text-[10px] tracking-widest px-10 shadow-lg shadow-blue-600/20"
                                onClick={handleAddUser}
                            >
                                Create User
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
