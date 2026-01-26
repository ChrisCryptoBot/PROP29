import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { useBannedIndividualsContext } from '../../context/BannedIndividualsContext';
import { cn } from '../../../../utils/cn';

export const FacialRecognitionTab: React.FC = () => {
    const { 
        facialRecognitionStats, 
        settings, 
        setSettings, 
        handleTriggerTraining,
        hardwareStatus,
        loading
    } = useBannedIndividualsContext();

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-3xl font-black text-[color:var(--text-main)] uppercase tracking-tighter">Biometrics</h2>
                    <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic opacity-70">
                        Facial recognition system configuration and monitoring
                    </p>
                </div>
            </div>

            <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl">
                <CardHeader className="border-b border-white/5 pb-4 group cursor-pointer">
                    <CardTitle className="flex items-center text-xl font-black uppercase tracking-tighter text-white">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5 mr-3 group-hover:scale-110 transition-transform">
                            <i className="fas fa-eye text-white text-lg" />
                        </div>
                        Biometric Controls
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <StatCard
                            icon="fa-graduation-cap"
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
            <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl">
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
                                <span className="font-black text-blue-400 text-xl tracking-tighter">{settings.confidenceThreshold}%</span>
                                <input 
                                    type="range" 
                                    min="50" 
                                    max="99" 
                                    value={settings.confidenceThreshold}
                                    onChange={(e) => setSettings(prev => ({ ...prev, confidenceThreshold: parseInt(e.target.value) }))}
                                    className="accent-blue-500 h-1.5 w-48 rounded-lg appearance-none bg-white/10 cursor-pointer shadow-inner" 
                                />
                            </div>
                        </div>
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between p-6 bg-white/5 border border-white/5 rounded-2xl group hover:bg-white/[0.08] transition-all">
                            <div className="mb-4 lg:mb-0">
                                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-[color:var(--text-main)]">Biometric Retention</h4>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">How long to store facial recognition signatures</p>
                            </div>
                            <select 
                                value={settings.retentionDays.toString()}
                                onChange={(e) => setSettings(prev => ({ ...prev, retentionDays: parseInt(e.target.value) }))}
                                className="px-6 py-2.5 border border-white/5 bg-black/40 text-xs font-bold uppercase tracking-widest text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer min-w-[150px] shadow-inner text-center"
                            >
                                <option value="90" className="bg-slate-900">90 Days</option>
                                <option value="180" className="bg-slate-900">180 Days</option>
                                <option value="365" className="bg-slate-900">1 Year</option>
                                <option value="0" className="bg-slate-900">Indefinite</option>
                            </select>
                        </div>
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between p-6 bg-white/5 border border-white/5 rounded-2xl group hover:bg-white/[0.08] transition-all">
                            <div className="mb-4 lg:mb-0">
                                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-[color:var(--text-main)]">Model Training</h4>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Trigger facial recognition model training</p>
                            </div>
                            <button
                                onClick={handleTriggerTraining}
                                disabled={loading.settings || facialRecognitionStats.trainingStatus === 'TRAINING'}
                                className="px-6 py-2.5 border border-blue-500/30 bg-blue-600/20 text-xs font-bold uppercase tracking-widest text-blue-400 rounded-xl hover:bg-blue-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {facialRecognitionStats.trainingStatus === 'TRAINING' ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin mr-2" />
                                        Training...
                                    </>
                                ) : (
                                    'Trigger Training'
                                )}
                            </button>
                        </div>
                        {hardwareStatus.cameras.length > 0 && (
                            <div className="p-6 bg-white/5 border border-white/5 rounded-2xl">
                                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-[color:var(--text-main)] mb-4">Hardware Status</h4>
                                <div className="space-y-2">
                                    {hardwareStatus.cameras.map((cam) => {
                                        const isOffline = cam.status === 'offline' || cam.status === 'error';
                                        const hasLastKnownGood = hardwareStatus.lastKnownGoodState && isOffline;
                                        
                                        return (
                                            <div key={cam.id} className="p-3 bg-white/5 rounded-lg border border-white/5">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center space-x-2">
                                                        <i className={cn(
                                                            "fas text-xs",
                                                            cam.status === 'online' ? 'fa-wifi text-green-400' :
                                                            cam.status === 'offline' ? 'fa-wifi-slash text-red-400' :
                                                            'fa-exclamation-triangle text-amber-400'
                                                        )} />
                                                        <span className="text-sm font-bold text-white">{cam.name}</span>
                                                    </div>
                                                    <span className={cn(
                                                        "px-2 py-1 text-xs font-bold rounded",
                                                        cam.status === 'online' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                                        cam.status === 'offline' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                                        'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                                    )}>
                                                        {cam.status.toUpperCase()}
                                                    </span>
                                                </div>
                                                {isOffline && hasLastKnownGood && (
                                                    <div className="mt-2 pt-2 border-t border-white/5">
                                                        <p className="text-[9px] font-bold uppercase tracking-widest text-amber-400/80 flex items-center">
                                                            <i className="fas fa-clock mr-1.5" />
                                                            Last Known Good State: {hardwareStatus.lastKnownGoodState ? hardwareStatus.lastKnownGoodState.toLocaleString() : 'N/A'}
                                                        </p>
                                                    </div>
                                                )}
                                                {cam.status === 'online' && (
                                                    <div className="mt-2 pt-2 border-t border-white/5">
                                                        <p className="text-[9px] font-bold uppercase tracking-widest text-green-400/80 flex items-center">
                                                            <i className="fas fa-check-circle mr-1.5" />
                                                            Last Seen: {cam.lastSeen.toLocaleString()}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                {hardwareStatus.cameras.every(c => c.status === 'offline' || c.status === 'error') && hardwareStatus.lastKnownGoodState && (
                                    <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-amber-400 flex items-center mb-1">
                                            <i className="fas fa-exclamation-triangle mr-2" />
                                            All Cameras Offline
                                        </p>
                                        <p className="text-[9px] text-amber-300/80">
                                            Last Known Good State: {hardwareStatus.lastKnownGoodState.toLocaleString()}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

const StatCard: React.FC<{ icon: string; label: string; value: string; color: 'slate' | 'blue' | 'emerald' | 'amber' | 'red'; isSpinning?: boolean }> = ({ icon, label, value, color, isSpinning }) => {
    const colorClasses = {
        slate: "from-slate-600/80 to-slate-900",
        blue: "from-blue-600/80 to-slate-900",
        emerald: "from-emerald-600/80 to-slate-900",
        amber: "from-amber-500/80 to-slate-900",
        red: "from-red-500/80 to-slate-900",
    };

    return (
        <div className="text-center p-8 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/[0.08] transition-all group shadow-inner">
            <div className={cn(
                "w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-2xl border border-white/5 transition-all duration-300 group-hover:scale-110 bg-gradient-to-br",
                colorClasses[color]
            )}>
                <i className={`fas ${icon} text-white text-3xl transition-transform duration-500 group-hover:rotate-12 ${isSpinning ? 'animate-spin-slow' : ''}`} />
            </div>
            <h3 className="text-[10px] font-bold text-slate-500 mb-3 uppercase tracking-[0.2em] italic opacity-70">{label}</h3>
            <span className="text-sm font-black bg-black/40 px-6 py-2 rounded-full border border-white/5 inline-block shadow-lg uppercase tracking-widest text-white">
                {value}
            </span>
        </div>
    );
};



