import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { useBannedIndividualsContext } from '../../context/BannedIndividualsContext';
import { cn } from '../../../../utils/cn';

export const FacialRecognitionTab: React.FC = () => {
    const { facialRecognitionStats } = useBannedIndividualsContext();

    return (
        <div className="space-y-6">
            <Card className="glass-card border-white/10 shadow-2xl">
                <CardHeader className="border-b border-white/5 pb-4 group cursor-pointer">
                    <CardTitle className="flex items-center text-xl font-black uppercase tracking-tighter text-white">
                        <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center mr-3 border border-blue-500/30 group-hover:scale-110 transition-transform">
                            <i className="fas fa-eye text-blue-400 text-lg" />
                        </div>
                        Biometric Controls
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <StatCard
                            icon="fa-shield-check"
                            label="Training Status"
                            value={facialRecognitionStats.trainingStatus}
                            color={facialRecognitionStats.trainingStatus === 'TRAINED' ? 'emerald' : (facialRecognitionStats.trainingStatus === 'TRAINING' ? 'amber' : 'red')}
                            isSpinning={facialRecognitionStats.trainingStatus === 'TRAINING'}
                        />
                        <StatCard
                            icon="fa-crosshairs"
                            label="Detection Accuracy"
                            value={`${facialRecognitionStats.accuracy}%`}
                            color="blue"
                        />
                        <StatCard
                            icon="fa-video"
                            label="Real-time Monitoring"
                            value="Active"
                            color="emerald"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Additional Management Controls could go here */}
            <Card className="glass-card border-white/10 shadow-2xl">
                <CardHeader className="border-b border-white/5 pb-4">
                    <CardTitle className="text-xl font-black uppercase tracking-tighter text-white">Model Configuration</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 px-6 pb-6">
                    <div className="space-y-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between p-6 bg-white/5 border border-white/5 rounded-2xl group hover:bg-white/[0.08] transition-all">
                            <div className="mb-4 lg:mb-0">
                                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-[color:var(--text-main)]">Confidence Threshold</h4>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Minimum confidence to trigger an alert</p>
                            </div>
                            <div className="flex items-center space-x-6">
                                <span className="font-black text-blue-400 text-xl tracking-tighter">85%</span>
                                <input type="range" min="50" max="99" defaultValue="85" className="accent-blue-500 h-1.5 w-48 rounded-lg appearance-none bg-white/10 cursor-pointer shadow-inner" />
                            </div>
                        </div>
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between p-6 bg-white/5 border border-white/5 rounded-2xl group hover:bg-white/[0.08] transition-all">
                            <div className="mb-4 lg:mb-0">
                                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-[color:var(--text-main)]">Biometric Retention</h4>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">How long to store facial recognition signatures</p>
                            </div>
                            <select className="px-6 py-2.5 border border-white/10 bg-black/40 text-xs font-bold uppercase tracking-widest text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer min-w-[150px] shadow-inner text-center">
                                <option className="bg-slate-900">90 Days</option>
                                <option className="bg-slate-900" selected>180 Days</option>
                                <option className="bg-slate-900">1 Year</option>
                                <option className="bg-slate-900">Indefinite</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

const StatCard: React.FC<{ icon: string; label: string; value: string; color: 'slate' | 'blue' | 'emerald' | 'amber' | 'red'; isSpinning?: boolean }> = ({ icon, label, value, color, isSpinning }) => {
    const colorClasses = {
        slate: "bg-white/10 border-white/10 text-slate-400 font-black",
        blue: "bg-blue-600/20 border-blue-500/30 text-blue-400",
        emerald: "bg-emerald-600/20 border-emerald-500/30 text-emerald-400",
        amber: "bg-amber-600/20 border-amber-500/30 text-amber-400",
        red: "bg-red-600/20 border-red-500/30 text-red-400",
    };

    return (
        <div className="text-center p-8 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/[0.08] transition-all group shadow-inner">
            <div className={cn(
                "w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg border transition-all duration-300 group-hover:scale-110",
                colorClasses[color]
            )}>
                <i className={cn("fas text-3xl transition-transform duration-500 group-hover:rotate-12", icon, isSpinning && "animate-spin-slow")} />
            </div>
            <h3 className="text-[10px] font-bold text-slate-500 mb-3 uppercase tracking-[0.2em] italic opacity-70">{label}</h3>
            <span className={cn(
                "text-sm font-black bg-black/40 px-6 py-2 rounded-full border border-white/10 inline-block shadow-lg uppercase tracking-widest",
                color === 'blue' && "text-blue-400",
                color === 'emerald' && "text-emerald-400",
                color === 'amber' && "text-amber-400",
                color === 'red' && "text-red-400",
                color === 'slate' && "text-white"
            )}>
                {value}
            </span>
        </div>
    );
};



