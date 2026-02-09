/**
 * Help & Support feature types.
 * Used by tabs, modals, hook, and service.
 */

export type HelpArticleCategory =
  | 'getting_started'
  | 'incident_management'
  | 'user_management'
  | 'system_settings'
  | 'mobile_app'
  | 'troubleshooting';

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketCategory = 'technical' | 'account' | 'feature_request' | 'bug_report';

export interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: HelpArticleCategory;
  tags: string[];
  lastUpdated: string;
  views: number;
  helpful: number;
  role: string[];
}

export interface SupportTicket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  attachments?: string[];
}

export interface ContactInfo {
  name: string;
  role: string;
  email: string;
  phone: string;
  availability: string;
  specialties: string[];
}

export interface ResourceLink {
  id: string;
  title: string;
  description: string;
  url: string;
  type: 'download' | 'external' | 'video';
}

export interface CreateTicketPayload {
  title: string;
  description: string;
  priority: TicketPriority;
  category: TicketCategory;
}

export interface UpdateTicketPayload {
  title?: string;
  description?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
}
