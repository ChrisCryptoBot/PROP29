import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { useBannedIndividualsContext } from '../../context/BannedIndividualsContext';

export const PhotoUploadModal: React.FC = () => {
    const {
        showPhotoUploadModal,
        setShowPhotoUploadModal,
        selectedIndividual,
        handlePhotoUpload
    } = useBannedIndividualsContext();

    if (!showPhotoUploadModal || !selectedIndividual) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
            <Card className="glass-card border-white/10 shadow-2xl max-w-2xl w-full animate-in fade-in zoom-in duration-300">
                <CardHeader className="border-b border-white/10 mb-6 group cursor-pointer">
                    <CardTitle className="flex items-center text-xl text-white font-black uppercase tracking-tighter">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5 mr-3 group-hover:scale-110 transition-transform">
                            <i className="fas fa-camera text-white" />
                        </div>
                        Photo Upload
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        <div className="flex items-center space-x-4 p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5">
                                <i className="fas fa-user text-white text-lg" />
                            </div>
                            <div>
                                <h4 className="font-black text-blue-400 uppercase tracking-tighter text-sm">Name: {selectedIndividual.firstName} {selectedIndividual.lastName}</h4>
                                <p className="text-[10px] text-blue-300/40 font-bold uppercase tracking-widest mt-0.5">ID Ref: {selectedIndividual.id}</p>
                            </div>
                        </div>

                        <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                            <h5 className="text-[10px] font-bold text-amber-500 flex items-center mb-1.5 uppercase tracking-widest">
                                <i className="fas fa-shield-alt mr-2" />
                                Security Compliance Warning
                            </h5>
                            <p className="text-xs text-amber-200/60 leading-relaxed font-medium">
                                Upload a clear, front-facing biometric image. Images will be automatically purged based on your data retention policy.
                                By uploading, you certify that this imagery is required for legitimate security purposes and site safety.
                            </p>
                        </div>

                        <div className="relative group border-2 border-dashed border-white/5 rounded-2xl p-10 text-center hover:border-blue-500/30 transition-all cursor-pointer bg-white/[0.02] hover:bg-white/[0.05]">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file && selectedIndividual) {
                                        handlePhotoUpload(file, selectedIndividual.id);
                                    }
                                }}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="space-y-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center mx-auto shadow-2xl border border-white/5 group-hover:scale-110 transition-transform">
                                    <i className="fas fa-fingerprint text-white text-2xl" />
                                </div>
                                <div>
                                    <p className="text-white font-bold uppercase tracking-widest text-xs">Select Biometric Image</p>
                                    <p className="text-slate-500 text-[10px] mt-1.5 uppercase tracking-tighter">Accepts JPG, PNG, WEBP (Max 10MB)</p>
                                </div>
                            </div>
                        </div>

                        {selectedIndividual.photoUrl && (
                            <div className="mt-4 p-5 border border-white/10 rounded-2xl bg-white/5 flex items-center space-x-5 shadow-inner">
                                <div className="w-16 h-16 overflow-hidden rounded-xl shadow-2xl border border-white/5">
                                    <img
                                        src={selectedIndividual.photoUrl}
                                        alt="Current biometric"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div>
                                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Existing Signature Found</span>
                                    <span className="text-xs font-bold text-blue-400 italic mt-1 block">training_model_active.v4</span>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end pt-5 border-t border-white/5">
                            <Button
                                variant="outline"
                                onClick={() => setShowPhotoUploadModal(false)}
                                className="px-8 py-3 font-black uppercase tracking-widest text-[10px] text-slate-400 hover:text-white border-white/10 hover:border-white/20 transition-all"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
