import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { cn } from '../../../../utils/cn';

export const AnalyticsTab: React.FC = () => {
    return (
        <div className="space-y-6">
            <Card className="glass-card border-white/10 shadow-2xl">
                <CardHeader className="border-b border-white/5 pb-4">
                    <CardTitle className="flex items-center text-xl font-black uppercase tracking-tighter text-white">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center shadow-lg mr-3">
                            <i className="fas fa-chart-bar text-white text-lg" />
                        </div>
                        Analytics & Reports
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <AnalyticsItem
                            icon="fa-chart-line"
                            label="Detection Frequency"
                            value="2.3 per day"
                        />
                        <AnalyticsItem
                            icon="fa-check-circle"
                            label="False Positives"
                            value="3.2%"
                        />
                        <AnalyticsItem
                            icon="fa-shield-alt"
                            label="Security Effectiveness"
                            value="96.8%"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Visual Analytics Simulation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="glass-card border-white/10 shadow-2xl">
                    <CardHeader className="border-b border-white/5 pb-4">
                        <CardTitle className="text-xl font-black uppercase tracking-tighter text-white">Monthly Detection Trends</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="h-64 flex items-end justify-between space-x-2 px-2">
                            {[45, 60, 55, 75, 90, 85, 95, 110, 100, 120, 115, 130].map((val, i) => (
                                <div key={i} className="flex-1 space-y-2 group">
                                    <div
                                        className="bg-blue-500/40 border-t border-blue-400 group-hover:bg-blue-500/60 transition-all duration-300 w-full"
                                        style={{ height: `${val}%` }}
                                    />
                                    <div className="text-[10px] text-slate-500 text-center font-bold uppercase tracking-widest">M{i + 1}</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card border-white/10 shadow-2xl">
                    <CardHeader className="border-b border-white/5 pb-4">
                        <CardTitle className="text-xl font-black uppercase tracking-tighter text-white">Risk Level Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-6">
                            <RiskBar label="Critical" percentage={15} color="bg-red-500" borderColor="border-red-500/30" />
                            <RiskBar label="High" percentage={35} color="bg-orange-500" borderColor="border-orange-500/30" />
                            <RiskBar label="Medium" percentage={40} color="bg-yellow-500" borderColor="border-yellow-500/30" />
                            <RiskBar label="Low" percentage={10} color="bg-emerald-500" borderColor="border-emerald-500/30" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

const AnalyticsItem: React.FC<{ icon: string; label: string; value: string }> = ({ icon, label, value }) => (
    <div className="text-center p-8 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/[0.08] transition-all group shadow-inner">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300">
            <i className={cn("fas text-blue-400 text-2xl", icon)} />
        </div>
        <h3 className="text-[10px] font-bold text-slate-500 mb-3 uppercase tracking-[0.2em] italic opacity-70">{label}</h3>
        <p className="text-2xl font-black text-white uppercase tracking-tighter">{value}</p>
    </div>
);

const RiskBar: React.FC<{ label: string; percentage: number; color: string; borderColor: string }> = ({ label, percentage, color, borderColor }) => (
    <div className="space-y-2">
        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-[color:var(--text-sub)]">
            <span>{label}</span>
            <span className="text-white">{percentage}%</span>
        </div>
        <div className="w-full bg-black/40 rounded-full h-3 border border-white/5 p-[2px]">
            <div
                className={cn("h-full rounded-full transition-all duration-1000", color, borderColor, "border shadow-[0_0_10px_rgba(255,255,255,0.05)]")}
                style={{ width: `${percentage}%` }}
            />
        </div>
    </div>
);


