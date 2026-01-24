import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { cn } from '../../../../utils/cn';

interface SafetyCheckInModalProps {
    onClose: () => void;
    onSubmit: (data: { name: string; id: string; location: string; notes: string }) => void;
}

const SafetyCheckInModal: React.FC<SafetyCheckInModalProps> = ({ onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        name: '',
        id: '',
        location: 'REMOTE_WEB_PORTAL',
        notes: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <Card className="w-full max-w-md bg-zinc-900 border-white/10 shadow-2xl relative overflow-hidden">
                {/* Gold Standard Header */}
                <CardHeader className="border-b border-white/10 bg-white/5 pb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center border border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                                <i className="fas fa-user-check text-green-500 text-xl" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-black text-white uppercase tracking-tighter">
                                    Why Safety Verification
                                </CardTitle>
                                <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest mt-1">
                                    Manual Entry Protocol
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="text-white/40 hover:text-white hover:bg-white/10"
                        >
                            <i className="fas fa-times text-lg" />
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Notice */}
                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-3">
                            <i className="fas fa-info-circle text-blue-400 mt-0.5" />
                            <p className="text-xs text-blue-200 leading-relaxed">
                                Use this form to log safety status for individuals reporting via SMS, Phone, or Public Web Portal.
                            </p>
                        </div>

                        {/* Fields Container */}
                        <div className="space-y-4">
                            {[
                                { label: 'Individual Name', key: 'name', type: 'text', icon: 'fa-user' },
                                { label: 'Visual ID / Badge #', key: 'id', type: 'text', icon: 'fa-id-badge' },
                                { label: 'Current Location', key: 'location', type: 'text', icon: 'fa-map-marker-alt' },
                            ].map((field) => (
                                <div key={field.key} className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">
                                        {field.label}
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-white/30 group-focus-within:text-green-500 transition-colors">
                                            <i className={`fas ${field.icon}`} />
                                        </div>
                                        <input
                                            type={field.type}
                                            required
                                            className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm font-medium text-white placeholder-white/20 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all uppercase"
                                            placeholder={`ENTER ${field.label}...`}
                                            value={(formData as any)[field.key]}
                                            onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                                        />
                                    </div>
                                </div>
                            ))}

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">
                                    Verification Notes
                                </label>
                                <textarea
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm font-medium text-white placeholder-white/20 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all min-h-[80px]"
                                    placeholder="ENTER DETAILS (E.G. 'CALLED FROM LOBBY')..."
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-4 grid grid-cols-2 gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                className="h-12 border-white/10 hover:bg-white/5 font-black uppercase tracking-widest text-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="h-12 bg-green-600 hover:bg-green-500 text-white font-black uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(22,163,74,0.2)]"
                            >
                                <i className="fas fa-check-double mr-2" />
                                Verify Safe
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default SafetyCheckInModal;
