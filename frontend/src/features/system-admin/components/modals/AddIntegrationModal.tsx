import React from 'react';
import { Button } from '../../../../components/UI/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { useSystemAdminContext } from '../../context/SystemAdminContext';

export const AddIntegrationModal: React.FC = () => {
    const {
        showAddIntegrationModal,
        setShowAddIntegrationModal,
        newIntegration,
        setNewIntegration,
        handleAddIntegration
    } = useSystemAdminContext();

    if (!showAddIntegrationModal) return null;

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <Card className="glass-card border-white/5 shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-300">
                <CardHeader className="border-b border-white/5 pb-4">
                    <CardTitle className="flex items-center text-xl font-bold text-white">
                        <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center mr-3 border border-indigo-500/30">
                            <i className="fas fa-network-wired text-indigo-400 text-lg" />
                        </div>
                        Initialize System Integration
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Service Identity</label>
                            <input
                                type="text"
                                value={newIntegration.name}
                                onChange={(e) => setNewIntegration({ ...newIntegration, name: e.target.value })}
                                className="w-full px-5 py-3 border border-white/5 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold text-white bg-white/5 placeholder:text-slate-600 shadow-inner"
                                placeholder="e.g. Master CCTV Node"
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Communication Type</label>
                            <input
                                type="text"
                                value={newIntegration.type}
                                onChange={(e) => setNewIntegration({ ...newIntegration, type: e.target.value })}
                                className="w-full px-5 py-3 border border-white/5 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold text-white bg-white/5 placeholder:text-slate-600 shadow-inner"
                                placeholder="e.g. WebSocket, REST API"
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Network Endpoint / Protocol</label>
                            <input
                                type="text"
                                value={newIntegration.endpoint}
                                onChange={(e) => setNewIntegration({ ...newIntegration, endpoint: e.target.value })}
                                className="w-full px-5 py-3 border border-white/5 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold text-white bg-white/5 placeholder:text-slate-600 shadow-inner font-mono text-sm"
                                placeholder="wss://internal.security.node:8443"
                            />
                        </div>

                        <div className="flex justify-end space-x-4 pt-6 border-t border-white/5">
                            <Button
                                variant="glass"
                                onClick={() => setShowAddIntegrationModal(false)}
                                className="font-bold uppercase text-[10px] tracking-widest text-slate-400 hover:text-white"
                            >
                                Terminate
                            </Button>
                            <Button
                                variant="primary"
                                className="font-bold uppercase text-[10px] tracking-widest px-10 bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20"
                                onClick={handleAddIntegration}
                            >
                                Connect Service
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
