/**
 * ChecklistTemplateModal Component
 * 
 * Modal for creating and editing checklist templates.
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '../../../../components/UI/Modal';
import { Button } from '../../../../components/UI/Button';
import { showError } from '../../../../utils/toast';
import type { ChecklistTemplate, ChecklistTemplateItem } from '../../types';

export interface ChecklistTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateTemplateData) => Promise<void>;
    initialData?: ChecklistTemplate;
    mode: 'create' | 'edit';
}

export interface CreateTemplateData {
    name: string;
    category: string;
    items: Omit<ChecklistTemplateItem, 'order'>[];
}

export const ChecklistTemplateModal: React.FC<ChecklistTemplateModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    mode,
}) => {
    const [name, setName] = useState(initialData?.name || '');
    const [category, setCategory] = useState(initialData?.category || 'general');
    const [items, setItems] = useState<Omit<ChecklistTemplateItem, 'order'>[]>(
        initialData?.items.map(({ order, ...rest }) => rest) || []
    );
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setCategory(initialData.category);
            setItems(initialData.items.map(({ order, ...rest }) => rest));
        }
    }, [initialData]);

    const handleAddItem = () => {
        setItems([
            ...items,
            {
                title: '',
                description: '',
                category: 'general',
                priority: 'medium',
                required: false,
            },
        ]);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleItemChange = (index: number, field: keyof Omit<ChecklistTemplateItem, 'order'>, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const handleSubmit = async () => {
        if (!name.trim()) {
            showError('Please enter a template name');
            return;
        }

        if (items.length === 0) {
            showError('Please add at least one checklist item');
            return;
        }

        if (items.some(item => !item.title.trim())) {
            showError('All checklist items must have a title');
            return;
        }

        try {
            setSubmitting(true);
            await onSubmit({
                name: name.trim(),
                category,
                items,
            });
            onClose();
        } catch {
            showError('Failed to save template');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={mode === 'create' ? 'Create Checklist Template' : 'Edit Checklist Template'}
            size="lg"
        >
            <div className="space-y-6">
                {/* Template Name */}
                <div>
                    <label className="block text-sm font-bold text-[color:var(--text-main)] mb-2 uppercase tracking-wider">
                        Template Name
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-md text-[color:var(--text-main)] focus:outline focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Morning Shift Checklist"
                    />
                </div>

                {/* Category */}
                <div>
                    <label className="block text-sm font-bold text-[color:var(--text-main)] mb-2 uppercase tracking-wider">
                        Category
                    </label>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-md text-[color:var(--text-main)] focus:outline focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="general">General</option>
                        <option value="security">Security</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="equipment">Equipment</option>
                        <option value="incidents">Incidents</option>
                    </select>
                </div>

                {/* Checklist Items */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-bold text-[color:var(--text-main)] uppercase tracking-wider">
                            Checklist Items
                        </label>
                        <Button size="sm" variant="outline" onClick={handleAddItem}>
                            <i className="fas fa-plus mr-2" />
                            Add Item
                        </Button>
                    </div>

                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {items.length === 0 ? (
                            <div className="text-center py-8 text-[color:var(--text-sub)] bg-slate-900/30 rounded-lg border-2 border-dashed border-white/5">
                                <i className="fas fa-clipboard-list text-3xl mb-2 opacity-50" />
                                <p>No items added yet</p>
                            </div>
                        ) : (
                            items.map((item, index) => (
                                <div
                                    key={index}
                                    className="p-4 bg-white/5 border border-white/5 rounded-md space-y-3"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 space-y-3">
                                            <input
                                                type="text"
                                                value={item.title}
                                                onChange={(e) => handleItemChange(index, 'title', e.target.value)}
                                                className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded text-[color:var(--text-main)] text-sm focus:ring-2 focus:ring-blue-500"
                                                placeholder="Item title"
                                            />
                                            <textarea
                                                value={item.description}
                                                onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                                className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded text-[color:var(--text-main)] text-sm focus:ring-2 focus:ring-blue-500"
                                                placeholder="Description (optional)"
                                                rows={2}
                                            />
                                            <div className="grid grid-cols-3 gap-2">
                                                <select
                                                    value={item.category}
                                                    onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                                                    className="px-3 py-2 bg-white/5 border border-white/5 rounded-md text-[color:var(--text-main)] text-xs focus:outline focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="general">General</option>
                                                    <option value="security">Security</option>
                                                    <option value="maintenance">Maintenance</option>
                                                    <option value="equipment">Equipment</option>
                                                </select>
                                                <select
                                                    value={item.priority}
                                                    onChange={(e) => handleItemChange(index, 'priority', e.target.value as 'low' | 'medium' | 'high')}
                                                    className="px-3 py-2 bg-white/5 border border-white/5 rounded-md text-[color:var(--text-main)] text-xs focus:outline focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="low">Low</option>
                                                    <option value="medium">Medium</option>
                                                    <option value="high">High</option>
                                                </select>
                                                <label className="flex items-center px-3 py-2 bg-white/5 border border-white/5 rounded text-[color:var(--text-main)] text-xs cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={item.required}
                                                        onChange={(e) => handleItemChange(index, 'required', e.target.checked)}
                                                        className="mr-2"
                                                    />
                                                    Required
                                                </label>
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleRemoveItem(index)}
                                            className="ml-3 text-red-500 hover:bg-red-500/10"
                                        >
                                            <i className="fas fa-trash" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-white/5">
                    <Button variant="ghost" onClick={onClose} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
                        {submitting ? (
                            <>
                                <i className="fas fa-spinner fa-spin mr-2" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-save mr-2" />
                                {mode === 'create' ? 'Create Template' : 'Save Changes'}
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
