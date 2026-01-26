import React, { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { useBannedIndividualsContext } from '../../context/BannedIndividualsContext';
import { toast } from 'react-hot-toast';

export const CreateIndividualModal: React.FC = () => {
    const {
        showCreateModal,
        setShowCreateModal,
        handleCreateIndividual,
        handlePhotoUpload
    } = useBannedIndividualsContext();

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [createdIndividualId, setCreatedIndividualId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!showCreateModal) return null;

    const validateForm = (data: any) => {
        const newErrors: Record<string, string> = {};
        if (!data.firstName || data.firstName.trim().length < 2) {
            newErrors.firstName = 'First name must be at least 2 characters';
        }
        if (!data.lastName || data.lastName.trim().length < 2) {
            newErrors.lastName = 'Last name must be at least 2 characters';
        }
        if (!data.reason || data.reason.trim().length < 10) {
            newErrors.reason = 'Please provide a detailed reason (at least 10 characters)';
        }
        if (!data.banStartDate) {
            newErrors.banStartDate = 'Ban start date is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                toast.error('File size must be less than 10MB');
                return;
            }
            if (!file.type.startsWith('image/')) {
                toast.error('File must be an image');
                return;
            }
            setPhotoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        if (validateForm(data)) {
            try {
                // Create the individual
                await handleCreateIndividual(data);
                
                // Reset photo state
                setPhotoFile(null);
                setPhotoPreview(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                
                // Note: Photo can be uploaded separately after creation via the "Add Photo" button
                // This keeps the creation flow simple and allows for better error handling
            } catch (error) {
                console.error('Error creating individual:', error);
            }
        } else {
            toast.error('Please fix the errors in the form');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
            <Card className="glass-card border-white/5 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-300">
                <CardHeader className="border-b border-white/5 flex flex-row items-center justify-between pb-4 mb-2">
                    <CardTitle className="flex items-center text-xl font-black uppercase tracking-tighter text-white">
                        <div className="w-12 h-12 bg-gradient-to-br from-red-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5 mr-3">
                            <i className="fas fa-user-plus text-white text-lg" />
                        </div>
                        Add Record
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <form onSubmit={onSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label htmlFor="firstName" className="block text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
                                    First Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="firstName"
                                    name="firstName"
                                    className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 transition-all font-medium border ${errors.firstName ? 'border-red-500/50 bg-red-500/10 focus:ring-red-500/50 text-white' : 'border-white/5 focus:ring-blue-500/50 bg-white/5 text-white placeholder:text-slate-600'}`}
                                    placeholder="e.g. John"
                                />
                                {errors.firstName && <p className="text-[10px] font-bold text-red-400 mt-1 px-1">{errors.firstName}</p>}
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="lastName" className="block text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
                                    Last Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="lastName"
                                    name="lastName"
                                    className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 transition-all font-medium border ${errors.lastName ? 'border-red-500/50 bg-red-500/10 focus:ring-red-500/50 text-white' : 'border-white/5 focus:ring-blue-500/50 bg-white/5 text-white placeholder:text-slate-600'}`}
                                    placeholder="e.g. Doe"
                                />
                                {errors.lastName && <p className="text-[10px] font-bold text-red-400 mt-1 px-1">{errors.lastName}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="reason" className="block text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
                                Official Incident Reason <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                id="reason"
                                name="reason"
                                rows={3}
                                className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 transition-all font-medium border ${errors.reason ? 'border-red-500/50 bg-red-500/10 focus:ring-red-500/50 text-white' : 'border-white/5 focus:ring-blue-500/50 bg-white/5 text-white placeholder:text-slate-600'}`}
                                placeholder="Describe the incident that led to this ban..."
                            />
                            {errors.reason && <p className="text-[10px] font-bold text-red-400 mt-1 px-1">{errors.reason}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label htmlFor="banType" className="block text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
                                    Ban Classification <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="banType"
                                    name="banType"
                                    className="w-full px-4 py-3 border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-white/5 font-bold text-white cursor-pointer appearance-none"
                                >
                                    <option value="TEMPORARY" className="bg-slate-900">Temporary</option>
                                    <option value="PERMANENT" className="bg-slate-900">Permanent</option>
                                    <option value="CONDITIONAL" className="bg-slate-900">Conditional</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="riskLevel" className="block text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
                                    Risk Intensity <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="riskLevel"
                                    name="riskLevel"
                                    className="w-full px-4 py-3 border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-white/5 font-bold text-white cursor-pointer appearance-none"
                                >
                                    <option value="LOW" className="bg-slate-900">Low</option>
                                    <option value="MEDIUM" className="bg-slate-900">Medium</option>
                                    <option value="HIGH" className="bg-slate-900">High</option>
                                    <option value="CRITICAL" className="bg-slate-900">Critical</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="banStartDate" className="block text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
                                Enforcement Start Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                id="banStartDate"
                                name="banStartDate"
                                className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 transition-all font-medium border ${errors.banStartDate ? 'border-red-500/50 bg-red-500/10 focus:ring-red-500/50 text-white' : 'border-white/5 focus:ring-blue-500/50 bg-white/5 text-white'}`}
                            />
                            {errors.banStartDate && <p className="text-[10px] font-bold text-red-400 mt-1 px-1">{errors.banStartDate}</p>}
                        </div>

                        {/* Photo Upload Section */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
                                Biometric Photo <span className="text-blue-400">(Optional)</span>
                            </label>
                            <div className="relative group border-2 border-dashed border-white/5 rounded-2xl p-6 text-center hover:border-blue-500/40 hover:bg-white/[0.02] transition-all cursor-pointer">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                {photoPreview ? (
                                    <div className="space-y-3">
                                        <div className="relative mx-auto w-32 h-32 rounded-xl overflow-hidden border-2 border-blue-500/30 shadow-xl">
                                            <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setPhotoFile(null);
                                                    setPhotoPreview(null);
                                                    if (fileInputRef.current) {
                                                        fileInputRef.current.value = '';
                                                    }
                                                }}
                                                className="absolute top-1 right-1 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
                                            >
                                                <i className="fas fa-times text-white text-xs" />
                                            </button>
                                        </div>
                                        <p className="text-xs text-blue-400 font-bold uppercase tracking-widest">Photo Selected</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="w-16 h-16 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center mx-auto shadow-2xl border border-white/5 group-hover:scale-110 transition-transform">
                                            <i className="fas fa-camera text-white text-xl" />
                                        </div>
                                        <div>
                                            <p className="text-white font-bold text-sm">Click to upload photo</p>
                                            <p className="text-slate-500 text-[10px] mt-1 font-bold uppercase tracking-widest">JPG, PNG, WEBP (Max 10MB)</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <p className="text-[10px] text-slate-500 italic px-1">
                                Upload a clear, front-facing photo for facial recognition. Can be added later if needed.
                            </p>
                        </div>

                        <div className="flex items-center space-x-3 p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl group cursor-pointer transition-colors hover:bg-blue-500/10">
                            <div className="relative flex items-center">
                                <input
                                    type="checkbox"
                                    id="multiProperty"
                                    name="multiProperty"
                                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer opacity-0 absolute inset-0 z-10"
                                />
                                <div className="w-5 h-5 border-2 border-white/20 rounded bg-white/5 flex items-center justify-center peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all">
                                    <i className="fas fa-check text-[10px] text-white opacity-0 group-hover:opacity-20 transition-opacity" />
                                </div>
                            </div>
                            <label htmlFor="multiProperty" className="text-sm font-bold text-blue-400 cursor-pointer select-none">
                                Multi-Property Synchronization
                                <span className="block text-[10px] text-blue-300/60 mt-0.5 normal-case font-medium">Auto-replicate this ban across all properties in the cluster</span>
                            </label>
                        </div>

                        <div className="flex justify-end space-x-4 pt-6 border-t border-white/5">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowCreateModal(false)}
                                className="px-6 py-3 font-bold uppercase text-[10px] tracking-widest text-slate-400 hover:text-white"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="destructive"
                                className="font-black uppercase tracking-widest px-8 py-3 shadow-lg"
                            >
                                Add Individual
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};
