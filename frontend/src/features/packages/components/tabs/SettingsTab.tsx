/**
 * Settings Tab
 * Package management configuration
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { EmptyState } from '../../../../components/UI/EmptyState';

export const SettingsTab: React.FC = React.memo(() => {
    return (
        <div className="space-y-6">
            <Card className="glass-card border-white/10 shadow-lg">
                <CardHeader className="border-b border-white/10 pb-4">
                    <CardTitle className="flex items-center text-xl text-white font-bold uppercase tracking-tight">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center mr-3 shadow-lg ring-1 ring-white/10">
                            <i className="fas fa-sliders-h text-white" />
                        </div>
                        Settings
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                                    Default Storage Location
                                </label>
                                <select className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer hover:bg-white/10 transition-colors">
                                    <option value="Mail Room A" className="bg-slate-900 text-white">Mail Room A</option>
                                    <option value="Mail Room B" className="bg-slate-900 text-white">Mail Room B</option>
                                    <option value="Front Desk" className="bg-slate-900 text-white">Front Desk</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                                    Auto-Notification Timing
                                </label>
                                <select className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer hover:bg-white/10 transition-colors">
                                    <option value="immediate" className="bg-slate-900 text-white">Immediate</option>
                                    <option value="15min" className="bg-slate-900 text-white">15 minutes</option>
                                    <option value="30min" className="bg-slate-900 text-white">30 minutes</option>
                                    <option value="1hour" className="bg-slate-900 text-white">1 hour</option>
                                </select>
                            </div>
                        </div>

                        <EmptyState
                            icon="fas fa-sliders-h"
                            title="Configuration Pending"
                            description="Package settings configuration will be implemented here."
                            className="bg-black/20 border-dashed border-2 border-white/10"
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
});

SettingsTab.displayName = 'SettingsTab';

