/**
 * Display names and Badge variants for Help & Support.
 */
import type { HelpArticleCategory } from '../types';

const CATEGORY_NAMES: Record<string, string> = {
  getting_started: 'Getting Started',
  incident_management: 'Incident Management',
  user_management: 'User Management',
  system_settings: 'System Settings',
  mobile_app: 'Mobile App',
  troubleshooting: 'Troubleshooting',
  technical: 'Technical',
  account: 'Account',
  feature_request: 'Feature Request',
  bug_report: 'Bug Report'
};

const CATEGORY_BADGE: Record<string, 'success' | 'destructive' | 'warning' | 'default' | 'outline' | 'secondary'> = {
  getting_started: 'success',
  incident_management: 'destructive',
  user_management: 'warning',
  system_settings: 'default',
  mobile_app: 'outline',
  troubleshooting: 'secondary',
  technical: 'default',
  account: 'outline',
  feature_request: 'warning',
  bug_report: 'destructive'
};

const STATUS_BADGE: Record<string, 'warning' | 'default' | 'success' | 'secondary'> = {
  open: 'warning',
  in_progress: 'default',
  resolved: 'success',
  closed: 'secondary'
};

const PRIORITY_BADGE: Record<string, 'secondary' | 'default' | 'warning' | 'destructive'> = {
  low: 'secondary',
  medium: 'default',
  high: 'warning',
  urgent: 'destructive'
};

export function getCategoryDisplayName(category: string): string {
  return CATEGORY_NAMES[category] ?? category;
}

export function getCategoryBadgeVariant(category: string): 'success' | 'destructive' | 'warning' | 'default' | 'outline' | 'secondary' {
  return CATEGORY_BADGE[category] ?? 'default';
}

export function getStatusBadgeVariant(status: string): 'warning' | 'default' | 'success' | 'secondary' {
  return STATUS_BADGE[status] ?? 'default';
}

export function getPriorityBadgeVariant(priority: string): 'secondary' | 'default' | 'warning' | 'destructive' {
  return PRIORITY_BADGE[priority] ?? 'default';
}

export function formatTicketCategory(category: string): string {
  return (CATEGORY_NAMES[category] ?? category).replace(/_/g, ' ');
}
