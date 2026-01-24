/**
 * ChecklistItemEditor Component
 * 
 * Component for adding and managing checklist items in handover forms.
 */

import React from 'react';
import { Button } from '../../../components/UI/Button';
import type { ChecklistItem, ChecklistCategory, ChecklistItemPriority } from '../types';
import { CHECKLIST_CATEGORIES, CHECKLIST_CATEGORY_LABELS, CHECKLIST_ITEM_PRIORITIES, CHECKLIST_ITEM_PRIORITY_LABELS } from '../utils/constants';

export interface ChecklistItemEditorProps {
  items: Omit<ChecklistItem, 'id' | 'status' | 'completedAt' | 'completedBy'>[];
  onItemsChange: (items: Omit<ChecklistItem, 'id' | 'status' | 'completedAt' | 'completedBy'>[]) => void;
}

/**
 * Checklist Item Editor Component
 */
export const ChecklistItemEditor: React.FC<ChecklistItemEditorProps> = ({
  items,
  onItemsChange,
}) => {
  const [currentItem, setCurrentItem] = React.useState<Omit<ChecklistItem, 'id' | 'status' | 'completedAt' | 'completedBy'>>({
    title: '',
    description: '',
    category: 'general',
    priority: 'medium',
    assignedTo: '',
    dueDate: '',
  });

  const addItem = () => {
    if (!currentItem.title.trim()) {
      return;
    }

    const newItem: Omit<ChecklistItem, 'id' | 'status' | 'completedAt' | 'completedBy'> = {
      title: currentItem.title,
      description: currentItem.description,
      category: currentItem.category,
      priority: currentItem.priority,
      assignedTo: currentItem.assignedTo,
      dueDate: currentItem.dueDate,
    };

    onItemsChange([...items, newItem]);

    // Reset form
    setCurrentItem({
      title: '',
      description: '',
      category: 'general',
      priority: 'medium',
      assignedTo: '',
      dueDate: '',
    });
  };

  const removeItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    onItemsChange(updatedItems);
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-black uppercase tracking-widest text-[color:var(--text-main)]">Checklist Items</h4>

      {/* Add Item Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-[10px] font-black uppercase tracking-widest text-[color:var(--text-sub)]/70">Item Title</label>
          <input
            type="text"
            value={currentItem.title}
            onChange={(e) => setCurrentItem({ ...currentItem, title: e.target.value })}
            className="w-full px-3 py-2 border border-white/10 rounded-lg bg-white/5 text-[color:var(--text-main)] placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:border-white/20 transition-all"
            placeholder="Enter checklist item title"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-[10px] font-black uppercase tracking-widest text-[color:var(--text-sub)]/70">Category</label>
          <select
            value={currentItem.category}
            onChange={(e) =>
              setCurrentItem({ ...currentItem, category: e.target.value as ChecklistCategory })
            }
            className="w-full px-3 py-2 border border-white/10 rounded-lg bg-white/5 text-[color:var(--text-main)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:border-white/20 transition-all cursor-pointer"
          >
            {CHECKLIST_CATEGORIES.map((cat: ChecklistCategory) => (
              <option key={cat} value={cat} className="bg-slate-900 text-white">
                {CHECKLIST_CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-[10px] font-black uppercase tracking-widest text-[color:var(--text-sub)]/70">Priority</label>
          <select
            value={currentItem.priority}
            onChange={(e) =>
              setCurrentItem({ ...currentItem, priority: e.target.value as ChecklistItemPriority })
            }
            className="w-full px-3 py-2 border border-white/10 rounded-lg bg-white/5 text-[color:var(--text-main)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:border-white/20 transition-all cursor-pointer"
          >
            {CHECKLIST_ITEM_PRIORITIES.map((priority: ChecklistItemPriority) => (
              <option key={priority} value={priority} className="bg-slate-900 text-white">
                {CHECKLIST_ITEM_PRIORITY_LABELS[priority]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-[10px] font-black uppercase tracking-widest text-[color:var(--text-sub)]/70">Assigned To</label>
          <input
            type="text"
            value={currentItem.assignedTo || ''}
            onChange={(e) => setCurrentItem({ ...currentItem, assignedTo: e.target.value })}
            className="w-full px-3 py-2 border border-white/10 rounded-lg bg-white/5 text-[color:var(--text-main)] placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:border-white/20 transition-all"
            placeholder="Enter assigned person"
          />
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className="block text-[10px] font-black uppercase tracking-widest text-[color:var(--text-sub)]/70">Description</label>
          <textarea
            value={currentItem.description || ''}
            onChange={(e) => setCurrentItem({ ...currentItem, description: e.target.value })}
            className="w-full px-3 py-2 border border-white/10 rounded-lg bg-white/5 text-[color:var(--text-main)] placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:border-white/20 transition-all"
            rows={2}
            placeholder="Enter description"
          />
        </div>
      </div>

      <Button
        type="button"
        onClick={addItem}
        variant="primary"
        className="w-full md:w-auto bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 font-black uppercase tracking-widest text-[10px]"
      >
        <i className="fas fa-plus mr-2" />
        Add Checklist Item
      </Button>

      {/* Items List */}
      {items.length > 0 && (
        <div className="space-y-2 mt-4">
          <h5 className="text-[10px] font-black uppercase tracking-widest text-[color:var(--text-sub)]/70">Added Items</h5>
          {items.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
            >
              <div>
                <div className="font-medium text-[color:var(--text-main)] text-sm">{item.title}</div>
                <div className="text-xs text-[color:var(--text-sub)] mt-1">
                  <span className="uppercase tracking-wider">{CHECKLIST_CATEGORY_LABELS[item.category]}</span>
                  <span className="mx-2 opacity-30">|</span>
                  <span className={`uppercase tracking-wider ${item.priority === 'critical' ? 'text-red-400' :
                      item.priority === 'high' ? 'text-orange-400' :
                        item.priority === 'medium' ? 'text-yellow-400' :
                          'text-green-400' // 'low' priority
                    }`}>
                    {CHECKLIST_ITEM_PRIORITY_LABELS[item.priority]}
                  </span>
                </div>
                {item.assignedTo && (
                  <div className="text-xs text-[color:var(--text-sub)]/60 mt-0.5">Assigned to: {item.assignedTo}</div>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeItem(index)}
                className="border-white/10 text-[color:var(--text-sub)] hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all"
              >
                <i className="fas fa-trash" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
