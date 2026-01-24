export type HandoverStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';
export type HandoverPriority = 'low' | 'medium' | 'high' | 'critical';
export type VerificationStatus = 'pending' | 'verified' | 'disputed';
export type ChecklistItemStatus = 'pending' | 'completed' | 'skipped';
export type ChecklistItemCategory = 'security' | 'maintenance' | 'incidents' | 'equipment' | 'general';

export interface HandoverChecklistItem {
    item_id: string;
    handover_id: string;
    title: string;
    description?: string;
    category: ChecklistItemCategory;
    status: ChecklistItemStatus;
    priority: 'low' | 'medium' | 'high';
    assigned_to?: string;
    due_date?: string;
    completed_at?: string;
    completed_by?: string;
    notes?: string;
}

export interface Handover {
    handover_id: string;
    property_id: string;
    shift_type: string;
    handover_from: string;
    handover_to: string;
    handover_date: string;
    start_time: string;
    end_time: string;
    status: HandoverStatus;
    priority: HandoverPriority;
    handover_notes?: string;
    created_at: string;
    updated_at: string;
    completed_at?: string;
    completed_by?: string;
    verification_status: VerificationStatus;
    handover_rating?: number;
    feedback?: string;
    incidents_summary?: string;
    special_instructions?: string;
    equipment_status?: string;
    checklist_items: HandoverChecklistItem[];
}

export interface HandoverCreate {
    property_id: string;
    shift_type: string;
    handover_from: string;
    handover_to: string;
    handover_date: string;
    start_time: string;
    end_time: string;
    priority: HandoverPriority;
    handover_notes?: string;
    incidents_summary?: string;
    special_instructions?: string;
    equipment_status?: string;
    checklist_items: Omit<HandoverChecklistItem, 'item_id' | 'handover_id' | 'status'>[];
}

export interface HandoverUpdate {
    status?: HandoverStatus;
    priority?: HandoverPriority;
    handover_notes?: string;
    verification_status?: VerificationStatus;
    handover_rating?: number;
    feedback?: string;
    incidents_summary?: string;
    special_instructions?: string;
    equipment_status?: string;
}

export interface HandoverSettings {
    settings_id: string;
    property_id: string;
    shift_configurations: {
        morning: { start: string; end: string };
        afternoon: { start: string; end: string };
        night: { start: string; end: string };
    };
    notification_settings: {
        emailNotifications: boolean;
        smsNotifications: boolean;
        pushNotifications: boolean;
        reminderTime: string;
        escalationTime: string;
    };
    template_settings: {
        defaultPriority: HandoverPriority;
        defaultCategory: ChecklistItemCategory;
        autoAssignTasks: boolean;
        requireApproval: boolean;
    };
    updated_at: string;
}

export interface HandoverMetrics {
    totalHandovers: number;
    completedHandovers: number;
    pendingHandovers: number;
    overdueHandovers: number;
    averageCompletionTime: string;
    completionRate: number;
    handoversByShift: Record<string, number>;
    handoversByStatus: Record<string, number>;
    monthlyHandovers: Array<{ month: string; completed: number; total: number }>;
    checklistCompletionRate: number;
    averageRating: number;
}
