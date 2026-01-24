import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { useBannedIndividualsContext } from '../../context/BannedIndividualsContext';
import { toast } from 'react-hot-toast';

export const CreateIndividualModal: React.FC = () => {
    const {
        showCreateModal,
        setShowCreateModal,
        handleCreateIndividual
    } = useBannedIndividualsContext();

    const [errors, setErrors] = useState<Record<string, string>>({});

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

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        if (validateForm(data)) {
            handleCreateIndividual(data);
            toast.success('Banned individual record created successfully');
        } else {
            toast.error('Please fix the errors in the form');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <Card className="glass-card border-white/10 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-300">
                <CardHeader className="border-b border-white/10 flex flex-row items-center justify-between pb-4 mb-2">
                    <CardTitle className="flex items-center text-xl font-black uppercase tracking-tighter text-white">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center shadow-lg mr-3">
                            <i className="fas fa-user-plus text-white text-lg" />
                        </div>
                        Add Record
                    </CardTitle>
                    <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full">
                        <i className="fas fa-times text-lg" />
                    </button>
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
                                    className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 transition-all font-medium border ${errors.firstName ? 'border-red-500/50 bg-red-500/10 focus:ring-red-500/50 text-white' : 'border-white/10 focus:ring-blue-500/50 bg-white/5 text-white placeholder:text-slate-600'}`}
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
                                    className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 transition-all font-medium border ${errors.lastName ? 'border-red-500/50 bg-red-500/10 focus:ring-red-500/50 text-white' : 'border-white/10 focus:ring-blue-500/50 bg-white/5 text-white placeholder:text-slate-600'}`}
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
                                className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 transition-all font-medium border ${errors.reason ? 'border-red-500/50 bg-red-500/10 focus:ring-red-500/50 text-white' : 'border-white/10 focus:ring-blue-500/50 bg-white/5 text-white placeholder:text-slate-600'}`}
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
                                    className="w-full px-4 py-3 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-white/5 font-bold text-white cursor-pointer appearance-none"
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
                                    className="w-full px-4 py-3 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-white/5 font-bold text-white cursor-pointer appearance-none"
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
                                className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 transition-all font-medium border ${errors.banStartDate ? 'border-red-500/50 bg-red-500/10 focus:ring-red-500/50 text-white' : 'border-white/10 focus:ring-blue-500/50 bg-white/5 text-white'}`}
                            />
                            {errors.banStartDate && <p className="text-[10px] font-bold text-red-400 mt-1 px-1">{errors.banStartDate}</p>}
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
                                className="font-black uppercase tracking-widest px-8 py-3 shadow-lg shadow-red-500/20"
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
