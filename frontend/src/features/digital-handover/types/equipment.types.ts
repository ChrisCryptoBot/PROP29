/**
 * Digital Handover Module - Equipment Types
 * 
 * Type definitions for equipment status, maintenance requests, and equipment management.
 */

export type EquipmentStatus = 'operational' | 'maintenance' | 'offline' | 'damaged' | 'reserved';

export interface Equipment {
  id: string;
  name: string;
  category: EquipmentCategory;
  location: string;
  status: EquipmentStatus;
  operationalPost?: string; // Post this equipment belongs to
  lastCheckedAt?: string; // ISO datetime string
  lastCheckedBy?: string;
  notes?: string;
  serialNumber?: string;
  manufacturer?: string;
  model?: string;
  createdAt: string; // ISO datetime string
  updatedAt: string; // ISO datetime string
}

export type EquipmentCategory = 
  | 'security' 
  | 'communication' 
  | 'surveillance' 
  | 'access_control' 
  | 'safety' 
  | 'maintenance' 
  | 'other';

export interface MaintenanceRequest {
  id: string;
  equipmentId?: string; // Optional - can be a general request
  title: string;
  description: string;
  location: string;
  priority: MaintenancePriority;
  status: MaintenanceRequestStatus;
  reportedBy: string;
  reportedAt: string; // ISO datetime string
  assignedTo?: string;
  completedAt?: string; // ISO datetime string
  completedBy?: string;
  notes?: string;
  attachments?: string[]; // Attachment IDs
  handoverId?: string; // Linked to handover if created from handover
}

export type MaintenancePriority = 'low' | 'medium' | 'high' | 'critical';

export type MaintenanceRequestStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface EquipmentChecklistItem {
  id: string;
  equipmentId: string;
  item: string;
  category: string;
  completed: boolean;
  completedAt?: string; // ISO datetime string
  completedBy?: string;
  notes?: string;
}

export interface CreateEquipmentRequest {
  name: string;
  category: EquipmentCategory;
  location: string;
  status: EquipmentStatus;
  operationalPost?: string;
  serialNumber?: string;
  manufacturer?: string;
  model?: string;
  notes?: string;
}

export interface CreateMaintenanceRequestRequest {
  equipmentId?: string;
  title: string;
  description: string;
  location: string;
  priority: MaintenancePriority;
  reportedBy: string;
  handoverId?: string;
  notes?: string;
}
