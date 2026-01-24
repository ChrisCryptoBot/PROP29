/**
 * Register Item Modal
 * Form for registering new lost & found items
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { useLostFoundContext } from '../../context/LostFoundContext';
import { LostFoundItemCreate } from '../../types/lost-and-found.types';
import { useAuth } from '../../../../contexts/AuthContext';

interface RegisterItemModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const RegisterItemModal: React.FC<RegisterItemModalProps> = ({ isOpen, onClose }) => {
    const {
        createItem,
        loading
    } = useLostFoundContext();

    const { user } = useAuth();

    const [formData, setFormData] = useState<Partial<LostFoundItemCreate>>({
        item_type: '',
        description: '',
        location_found: '',
        value_estimate: undefined,
        notes: '',
        category: '',
        name: '',
        storageLocation: '',
        guestInfo: {}
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.item_type || !formData.description || !formData.location_found) {
            return;
        }

        // Get property_id from user (in real implementation)
        const propertyId = user?.roles?.[0] || 'default-property-id';

        const itemToCreate: LostFoundItemCreate = {
            property_id: propertyId,
            item_type: formData.item_type || formData.name || 'Unknown',
            description: formData.description,
            location_found: formData.location_found || '',
            value_estimate: formData.value_estimate,
            notes: formData.notes,
            category: formData.category,
            name: formData.name,
            storageLocation: formData.storageLocation
        };

        const result = await createItem(itemToCreate);
        if (result) {
            // Reset form
            setFormData({
                item_type: '',
                description: '',
                location_found: '',
                value_estimate: undefined,
                notes: '',
                category: '',
                name: '',
                storageLocation: '',
                guestInfo: {}
            });
            onClose();
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;

        if (id === 'item-name') {
            setFormData(prev => ({ ...prev, name: value, item_type: value }));
        } else if (id === 'category') {
            setFormData(prev => ({ ...prev, category: value, item_type: value }));
        } else if (id === 'description') {
            setFormData(prev => ({ ...prev, description: value }));
        } else if (id === 'location-found') {
            setFormData(prev => ({ ...prev, location_found: value }));
        } else if (id === 'estimated-value') {
            setFormData(prev => ({ ...prev, value_estimate: parseFloat(value) || undefined }));
        } else if (id === 'storage-location') {
            setFormData(prev => ({ ...prev, storageLocation: value }));
        } else if (id === 'notes') {
            setFormData(prev => ({ ...prev, notes: value }));
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="glass-card border-white/10 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <CardHeader className="flex flex-row items-center justify-between border-b border-white/10 pb-4">
                    <CardTitle className="flex items-center text-xl text-white">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center mr-3 shadow-lg ring-1 ring-white/10">
                            <i className="fas fa-plus text-white text-lg" />
                        </div>
                        Register New Lost Item
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="text-slate-400 hover:text-white hover:bg-white/10 rounded-full w-8 h-8 p-0 flex items-center justify-center transition-colors"
                    >
                        <i className="fas fa-times" />
                    </Button>
                </CardHeader>

                <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Item Information */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center border-b border-white/10 pb-2">
                                <i className="fas fa-info-circle text-blue-400 mr-2" />
                                Basic Item Information
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="item-name" className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        Item Name *
                                    </label>
                                    <input
                                        type="text"
                                        id="item-name"
                                        value={formData.name || ''}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-900/90 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                                        placeholder="e.g., iPhone 14 Pro, Gold Ring"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="category" className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        Category *
                                    </label>
                                    <select
                                        id="category"
                                        value={formData.category || ''}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-900/90 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all [&>option]:bg-slate-900 [&>option]:text-white"
                                        required
                                    >
                                        <option value="">Select Category</option>
                                        <option value="Electronics">Electronics</option>
                                        <option value="Jewelry">Jewelry</option>
                                        <option value="Personal Items">Personal Items</option>
                                        <option value="Accessories">Accessories</option>
                                        <option value="Clothing">Clothing</option>
                                        <option value="Weapons">⚠️ Weapons (Requires Manager Approval)</option>
                                        <option value="Documents">Documents</option>
                                        <option value="Other">Other</option>
                                    </select>
                                    {formData.category === 'Weapons' && (
                                        <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                                            <div className="flex items-start space-x-2">
                                                <i className="fas fa-exclamation-triangle text-red-500 mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-bold text-red-400">⚠️ Manager Approval Required</p>
                                                    <p className="text-xs text-red-300 mt-1">
                                                        This item requires immediate manager approval before it can be stored.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="description" className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Detailed Description *
                                </label>
                                <textarea
                                    id="description"
                                    rows={3}
                                    value={formData.description || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-900/90 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                                    placeholder="Provide a detailed description of the item including color, brand, size, etc."
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="location-found" className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        Location Found *
                                    </label>
                                    <input
                                        type="text"
                                        id="location-found"
                                        value={typeof formData.location_found === 'string' ? formData.location_found : ''}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-900/90 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                                        placeholder="e.g., Pool Deck, Lobby, Parking Garage"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="estimated-value" className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        Estimated Value ($)
                                    </label>
                                    <input
                                        type="number"
                                        id="estimated-value"
                                        value={formData.value_estimate || ''}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="storage-location" className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Storage Location
                                </label>
                                <select
                                    id="storage-location"
                                    value={formData.storageLocation || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all [&>option]:bg-slate-900 [&>option]:text-white"
                                >
                                    <option value="">Select Storage Location</option>
                                    <option value="Storage Room A - Shelf 1">Storage Room A - Shelf 1</option>
                                    <option value="Storage Room A - Shelf 2">Storage Room A - Shelf 2</option>
                                    <option value="Storage Room A - Shelf 3">Storage Room A - Shelf 3</option>
                                    <option value="Storage Room A - Safe 1">Storage Room A - Safe 1</option>
                                    <option value="Storage Room B - Drawer 1">Storage Room B - Drawer 1</option>
                                    <option value="Storage Room B - Drawer 2">Storage Room B - Drawer 2</option>
                                    <option value="Storage Room A - Secure Area">Storage Room A - Secure Area</option>
                                    <option value="Storage Room A - Pending">Storage Room A - Pending</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="notes" className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Additional Notes
                                </label>
                                <textarea
                                    id="notes"
                                    rows={2}
                                    value={formData.notes || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                                    placeholder="Any additional information about the item"
                                />
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="flex justify-end space-x-3 pt-6 border-t border-white/10">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                className="border-white/10 text-slate-300 hover:bg-white/5 disabled:opacity-50"
                                disabled={loading.items}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                className="bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50"
                                disabled={loading.items || !formData.name || !formData.category || !formData.description || !formData.location_found}
                            >
                                {loading.items ? (
                                    <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Registering...
                                    </div>
                                ) : (
                                    <>
                                        <i className="fas fa-save mr-2" />
                                        Register Item
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};



