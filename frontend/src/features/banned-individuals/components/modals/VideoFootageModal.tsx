import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { useBannedIndividualsContext } from '../../context/BannedIndividualsContext';

export const VideoFootageModal: React.FC = () => {
    const {
        showVideoFootageModal,
        setShowVideoFootageModal,
        selectedVideoUrl
    } = useBannedIndividualsContext();

    if (!showVideoFootageModal || !selectedVideoUrl) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
            <Card className="glass-card border-white/5 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-300">
                <CardHeader className="border-b border-white/5 pb-4 mb-6">
                    <CardTitle className="flex items-center text-xl text-white font-black uppercase tracking-tighter">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5 mr-3">
                            <i className="fas fa-video text-white text-lg" />
                        </div>
                        Detection Video Footage
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        <div className="relative bg-black rounded-xl overflow-hidden border border-white/5">
                            <video
                                src={selectedVideoUrl}
                                controls
                                className="w-full h-auto max-h-[60vh]"
                                autoPlay
                            >
                                Your browser does not support the video tag.
                            </video>
                        </div>
                        <div className="flex justify-end pt-5 border-t border-white/5">
                            <Button
                                onClick={() => setShowVideoFootageModal(false)}
                                variant="primary"
                                className="font-bold uppercase text-[10px] tracking-widest px-10 py-3 shadow-lg"
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
