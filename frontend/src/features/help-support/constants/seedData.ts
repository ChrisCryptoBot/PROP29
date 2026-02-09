/**
 * Seed data for Help & Support when API is unavailable.
 */
import type { HelpArticle, SupportTicket, ContactInfo } from '../types';

export const SEED_ARTICLES: HelpArticle[] = [
  {
    id: '1',
    title: 'Getting Started with Proper 2.9',
    content: 'Welcome to Proper 2.9 Security Management System. This guide will help you get started with the platform: navigate the dashboard, understand roles, and access key modules. Use the sidebar to switch between Incident Log, Access Control, Patrol Command Center, and other modules.',
    category: 'getting_started',
    tags: ['onboarding', 'basics', 'navigation'],
    lastUpdated: '2024-01-10',
    views: 1250,
    helpful: 89,
    role: ['all']
  },
  {
    id: '2',
    title: 'How to Report an Incident',
    content: 'Learn how to properly report security incidents using the incident management system. Go to Incident Log, click "New Incident", fill in location, severity, and description. You can attach photos and assign to a response team. For urgent issues use the Emergency Alert option.',
    category: 'incident_management',
    tags: ['incidents', 'reporting', 'security'],
    lastUpdated: '2024-01-12',
    views: 890,
    helpful: 67,
    role: ['patrol_agent', 'manager', 'director']
  },
  {
    id: '3',
    title: 'Managing Team Members',
    content: 'Administrators can add, remove, and manage team member permissions from Account Settings or System Administration. Assign roles (e.g. patrol_agent, manager, director), set property access, and manage certifications.',
    category: 'user_management',
    tags: ['users', 'permissions', 'administration'],
    lastUpdated: '2024-01-08',
    views: 650,
    helpful: 45,
    role: ['manager', 'director']
  },
  {
    id: '4',
    title: 'Mobile App Setup Guide',
    content: 'Set up the Proper 2.9 mobile app for patrol agents and field staff. Download from the Resources tab, sign in with your console credentials, and enable location and notifications. Use the app for check-ins, incident reporting, and real-time alerts.',
    category: 'mobile_app',
    tags: ['mobile', 'setup', 'patrol'],
    lastUpdated: '2024-01-14',
    views: 420,
    helpful: 32,
    role: ['patrol_agent', 'valet', 'front_desk']
  },
  {
    id: '5',
    title: 'Troubleshooting Camera Issues',
    content: 'Common camera system issues and how to resolve them: verify network and power, check Security Operations Center for device status, restart the stream from the camera tile, and escalate to Technical Support if the camera remains offline.',
    category: 'troubleshooting',
    tags: ['cameras', 'technical', 'hardware'],
    lastUpdated: '2024-01-11',
    views: 780,
    helpful: 56,
    role: ['manager', 'director']
  }
];

export const SEED_TICKETS: SupportTicket[] = [
  {
    id: 'TICKET-001',
    title: 'Camera System Offline',
    description: 'Main entrance camera has been offline for 2 hours',
    status: 'in_progress',
    priority: 'high',
    category: 'technical',
    createdAt: '2024-01-15T08:30:00Z',
    updatedAt: '2024-01-15T10:15:00Z',
    assignedTo: 'Technical Support Team'
  },
  {
    id: 'TICKET-002',
    title: 'Feature Request: Bulk User Import',
    description: 'Need ability to import multiple users from CSV file',
    status: 'open',
    priority: 'medium',
    category: 'feature_request',
    createdAt: '2024-01-14T14:20:00Z',
    updatedAt: '2024-01-14T14:20:00Z'
  },
  {
    id: 'TICKET-003',
    title: 'Mobile App Login Issue',
    description: 'Patrol agents unable to log in to mobile app',
    status: 'resolved',
    priority: 'urgent',
    category: 'bug_report',
    createdAt: '2024-01-13T16:45:00Z',
    updatedAt: '2024-01-14T09:30:00Z',
    assignedTo: 'Mobile Development Team'
  }
];

export const SEED_CONTACTS: ContactInfo[] = [
  {
    name: 'Sarah Chen',
    role: 'Technical Support Manager',
    email: 'sarah.chen@proper29.com',
    phone: '+15551234567',
    availability: '24/7 Emergency Support',
    specialties: ['System Integration', 'Hardware Issues', 'Emergency Response']
  },
  {
    name: 'Mike Rodriguez',
    role: 'Customer Success Manager',
    email: 'mike.rodriguez@proper29.com',
    phone: '+15552345678',
    availability: 'Mon-Fri 9 AM - 6 PM EST',
    specialties: ['Account Management', 'Training', 'Feature Requests']
  },
  {
    name: 'Lisa Thompson',
    role: 'Mobile App Specialist',
    email: 'lisa.thompson@proper29.com',
    phone: '+15553456789',
    availability: 'Mon-Fri 8 AM - 5 PM EST',
    specialties: ['Mobile App Issues', 'Patrol Management', 'Field Operations']
  }
];

export const EMERGENCY_PHONE = '+15559117777';
