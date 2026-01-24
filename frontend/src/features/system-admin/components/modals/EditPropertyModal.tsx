import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { useSystemAdminContext } from '../../context/SystemAdminContext';

export const EditPropertyModal: React.FC = () => {
    const {
        showEditPropertyModal,
        setShowEditPropertyModal,
        selectedProperty,
        handleUpdateProperty
    } = useSystemAdminContext();

    const [propertyData, setPropertyData] = useState(selectedProperty);

    useEffect(() => {
        setPropertyData(selectedProperty);
    }, [selectedProperty]);

    if (!showEditPropertyModal || !propertyData) return null;

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <Card className="glass-card border-white/10 shadow-2xl max-w-lg w-full animate-in fade-in zoom-in duration-300">
                <CardHeader className="border-b border-white/5 pb-4">
                    <CardTitle className="flex items-center text-xl font-bold text-white">
                        <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center mr-3 border border-blue-500/30">
                            <i className="fas fa-edit text-blue-400 text-lg" />
                        </div>
                        Manage Asset: {propertyData.title}
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Property Name</label>
                            <input
                                type="text"
                                value={propertyData.title}
                                onChange={(e) => setPropertyData({ ...propertyData, title: e.target.value })}
                                className="w-full px-5 py-3 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500/50 transition-all font-bold text-white bg-white/5 shadow-inner"
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Asset Description</label>
                            <textarea
                                value={propertyData.description}
                                onChange={(e) => setPropertyData({ ...propertyData, description: e.target.value })}
                                className="w-full px-5 py-3 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500/50 transition-all font-bold text-white bg-white/5 shadow-inner h-20 resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Room Inventory</label>
                                <input
                                    type="text"
                                    value={propertyData.rooms}
                                    onChange={(e) => setPropertyData({ ...propertyData, rooms: parseInt(e.target.value) || 0 })}
                                    className="w-full px-5 py-3 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500/50 transition-all font-bold text-white bg-white/5 shadow-inner"
                                />
                            </div>
                            <div className="space-y-4">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Asset Status</label>
                                <select
                                    value={propertyData.status}
                                    onChange={(e) => setPropertyData({ ...propertyData, status: e.target.value as any })}
                                    className="w-full px-5 py-3 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500/50 transition-all font-bold text-white bg-white/5 appearance-none cursor-pointer shadow-inner"
                                >
                                    <option value="Operational" className="bg-slate-900">Operational</option>
                                    <option value="Maintenance" className="bg-slate-900">Maintenance</option>
                                    <option value="Closed" className="bg-slate-900">Closed</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-4 pt-6 border-t border-white/5">
                            <Button
                                variant="glass"
                                onClick={() => setShowEditPropertyModal(false)}
                                className="font-bold uppercase text-[10px] tracking-widest text-slate-400 hover:text-white"
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                className="font-bold uppercase text-[10px] tracking-widest px-10 shadow-lg shadow-blue-600/20"
                                onClick={handleUpdateProperty}
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
