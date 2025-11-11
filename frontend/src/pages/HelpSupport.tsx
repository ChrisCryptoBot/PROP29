import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Badge } from '../components/UI/Badge';

interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: 'getting_started' | 'incident_management' | 'user_management' | 'system_settings' | 'mobile_app' | 'troubleshooting';
  tags: string[];
  lastUpdated: string;
  views: number;
  helpful: number;
  role: string[];
}

interface SupportTicket {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'technical' | 'account' | 'feature_request' | 'bug_report';
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  attachments?: string[];
}

interface ContactInfo {
  name: string;
  role: string;
  email: string;
  phone: string;
  availability: string;
  specialties: string[];
}

const HelpSupport: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const [helpArticles] = useState<HelpArticle[]>([
    {
      id: '1',
      title: 'Getting Started with Proper 2.9',
      content: 'Welcome to Proper 2.9 Security Management System. This guide will help you get started with the platform...',
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
      content: 'Learn how to properly report security incidents using the incident management system...',
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
      content: 'Administrators can add, remove, and manage team member permissions...',
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
      content: 'Set up the Proper 2.9 mobile app for patrol agents and field staff...',
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
      content: 'Common camera system issues and how to resolve them...',
      category: 'troubleshooting',
      tags: ['cameras', 'technical', 'hardware'],
      lastUpdated: '2024-01-11',
      views: 780,
      helpful: 56,
      role: ['manager', 'director']
    }
  ]);

  const [supportTickets] = useState<SupportTicket[]>([
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
  ]);

  const [contactInfo] = useState<ContactInfo[]>([
    {
      name: 'Sarah Chen',
      role: 'Technical Support Manager',
      email: 'sarah.chen@proper29.com',
      phone: '+1 (555) 123-4567',
      availability: '24/7 Emergency Support',
      specialties: ['System Integration', 'Hardware Issues', 'Emergency Response']
    },
    {
      name: 'Mike Rodriguez',
      role: 'Customer Success Manager',
      email: 'mike.rodriguez@proper29.com',
      phone: '+1 (555) 234-5678',
      availability: 'Mon-Fri 9 AM - 6 PM EST',
      specialties: ['Account Management', 'Training', 'Feature Requests']
    },
    {
      name: 'Lisa Thompson',
      role: 'Mobile App Specialist',
      email: 'lisa.thompson@proper29.com',
      phone: '+1 (555) 345-6789',
      availability: 'Mon-Fri 8 AM - 5 PM EST',
      specialties: ['Mobile App Issues', 'Patrol Management', 'Field Operations']
    }
  ]);

  const [newTicket, setNewTicket] = useState<Partial<SupportTicket>>({
    title: '',
    description: '',
    priority: 'medium',
    category: 'technical'
  });

  const [showNewTicketModal, setShowNewTicketModal] = useState(false);

  const showError = useCallback((message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  }, []);

  const showSuccess = useCallback((message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 5000);
  }, []);

  const getCategoryDisplayName = (category: string) => {
    const names = {
      getting_started: 'Getting Started',
      incident_management: 'Incident Management',
      user_management: 'User Management',
      system_settings: 'System Settings',
      mobile_app: 'Mobile App',
      troubleshooting: 'Troubleshooting'
    };
    return names[category as keyof typeof names] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      getting_started: 'success',
      incident_management: 'destructive',
      user_management: 'warning',
      system_settings: 'default',
      mobile_app: 'outline',
      troubleshooting: 'secondary'
    };
    return colors[category as keyof typeof colors] || 'default';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      open: 'warning',
      in_progress: 'default',
      resolved: 'success',
      closed: 'secondary'
    };
    return colors[status as keyof typeof colors] || 'default';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'secondary',
      medium: 'default',
      high: 'warning',
      urgent: 'destructive'
    };
    return colors[priority as keyof typeof colors] || 'default';
  };

  const filteredArticles = helpArticles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'fas fa-home' },
    { id: 'help', label: 'Help Center', icon: 'fas fa-question-circle' },
    { id: 'tickets', label: 'Support Tickets', icon: 'fas fa-ticket-alt' },
    { id: 'contact', label: 'Contact Support', icon: 'fas fa-headset' },
    { id: 'resources', label: 'Resources', icon: 'fas fa-book' }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <i className="fas fa-book text-white text-lg" />
              </div>
              <Badge variant="success" className="text-xs">Available</Badge>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-slate-900">{helpArticles.length}</h3>
              <p className="text-slate-600 text-sm">Help Articles</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <i className="fas fa-ticket-alt text-white text-lg" />
              </div>
              <Badge variant="warning" className="text-xs">Active</Badge>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-slate-900">{supportTickets.filter(t => t.status !== 'closed').length}</h3>
              <p className="text-slate-600 text-sm">Open Tickets</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <i className="fas fa-headset text-white text-lg" />
              </div>
              <Badge variant="success" className="text-xs">Online</Badge>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-slate-900">{contactInfo.length}</h3>
              <p className="text-slate-600 text-sm">Support Agents</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <i className="fas fa-clock text-white text-lg" />
              </div>
              <Badge variant="success" className="text-xs">24/7</Badge>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-slate-900">&lt;2h</h3>
              <p className="text-slate-600 text-sm">Avg Response</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <i className="fas fa-bolt mr-3 text-slate-600" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              className="!bg-[#2563eb] hover:!bg-blue-700 text-white h-16 flex-col"
              onClick={() => setActiveTab('help')}
            >
              <i className="fas fa-search text-xl mb-2" />
              Search Help
            </Button>
            <Button
              variant="outline"
              className="text-slate-600 border-slate-300 hover:bg-slate-50 h-16 flex-col"
              onClick={() => setShowNewTicketModal(true)}
            >
              <i className="fas fa-plus text-xl mb-2" />
              New Ticket
            </Button>
            <Button
              variant="outline"
              className="text-slate-600 border-slate-300 hover:bg-slate-50 h-16 flex-col"
              onClick={() => setActiveTab('contact')}
            >
              <i className="fas fa-phone text-xl mb-2" />
              Contact Support
            </Button>
            <Button
              variant="outline"
              className="text-slate-600 border-slate-300 hover:bg-slate-50 h-16 flex-col"
              onClick={() => showSuccess('Opening live chat')}
            >
              <i className="fas fa-comments text-xl mb-2" />
              Live Chat
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Tickets */}
      <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-xl">
              <i className="fas fa-ticket-alt mr-3 text-slate-600" />
              Recent Support Tickets
            </CardTitle>
            <Button
              variant="outline"
              className="text-slate-600 border-slate-300 hover:bg-slate-50"
              onClick={() => setActiveTab('tickets')}
            >
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {supportTickets.slice(0, 3).map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-1">
                    <h4 className="font-semibold text-slate-900">{ticket.title}</h4>
                    <Badge variant={getStatusColor(ticket.status) as any}>
                      {ticket.status}
                    </Badge>
                    <Badge variant={getPriorityColor(ticket.priority) as any}>
                      {ticket.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600">{ticket.description}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Created: {new Date(ticket.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-slate-600 border-slate-300 hover:bg-slate-50"
                  onClick={() => showSuccess(`Viewing ticket ${ticket.id}`)}
                >
                  <i className="fas fa-eye mr-1" />
                  View
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderHelpCenter = () => (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search help articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <i className="fas fa-search absolute left-3 top-3 text-slate-400" />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="getting_started">Getting Started</option>
                <option value="incident_management">Incident Management</option>
                <option value="user_management">User Management</option>
                <option value="system_settings">System Settings</option>
                <option value="mobile_app">Mobile App</option>
                <option value="troubleshooting">Troubleshooting</option>
              </select>
              <Button
                variant="outline"
                className="text-slate-600 border-slate-300 hover:bg-slate-50"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
              >
                <i className="fas fa-times mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help Articles */}
      <div className="space-y-4">
        {filteredArticles.length === 0 ? (
          <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-search text-slate-400 text-2xl" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No articles found</h3>
              <p className="text-slate-600">Try adjusting your search terms or category filter.</p>
            </CardContent>
          </Card>
        ) : (
          filteredArticles.map((article) => (
            <Card key={article.id} className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">{article.title}</h3>
                    <p className="text-slate-600 text-sm mb-3">{article.content}</p>
                    <div className="flex items-center space-x-4 text-xs text-slate-500">
                      <span>
                        <i className="fas fa-eye mr-1" />
                        {article.views} views
                      </span>
                      <span>
                        <i className="fas fa-thumbs-up mr-1" />
                        {article.helpful} helpful
                      </span>
                      <span>
                        <i className="fas fa-calendar mr-1" />
                        Updated {new Date(article.lastUpdated).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <Badge variant={getCategoryColor(article.category) as any}>
                      {getCategoryDisplayName(article.category)}
                    </Badge>
                    <Button
                      size="sm"
                      className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
                      onClick={() => showSuccess(`Opening article: ${article.title}`)}
                    >
                      <i className="fas fa-external-link-alt mr-1" />
                      Read More
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <span key={tag} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded">
                      #{tag}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );

  const renderSupportTickets = () => (
    <div className="space-y-6">
      <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-xl">
              <i className="fas fa-ticket-alt mr-3 text-slate-600" />
              Support Tickets
            </CardTitle>
            <Button
              onClick={() => setShowNewTicketModal(true)}
              className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
            >
              <i className="fas fa-plus mr-2" />
              New Ticket
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Ticket</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {supportTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-slate-900">{ticket.title}</div>
                        <div className="text-sm text-slate-500">{ticket.id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getStatusColor(ticket.status) as any}>
                        {ticket.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getPriorityColor(ticket.priority) as any}>
                        {ticket.priority}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 capitalize">
                      {ticket.category.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-slate-600 border-slate-300 hover:bg-slate-50"
                          onClick={() => showSuccess(`Viewing ticket ${ticket.id}`)}
                        >
                          <i className="fas fa-eye" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-slate-600 border-slate-300 hover:bg-slate-50"
                          onClick={() => showSuccess(`Updating ticket ${ticket.id}`)}
                        >
                          <i className="fas fa-edit" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderContactSupport = () => (
    <div className="space-y-6">
      {/* Support Team */}
      <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <i className="fas fa-headset mr-3 text-slate-600" />
            Support Team
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contactInfo.map((contact, index) => (
              <div key={index} className="p-4 border border-slate-200 rounded-lg">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                    <i className="fas fa-user text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">{contact.name}</h4>
                    <p className="text-sm text-slate-600">{contact.role}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <i className="fas fa-envelope text-slate-400" />
                    <span className="text-slate-600">{contact.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <i className="fas fa-phone text-slate-400" />
                    <span className="text-slate-600">{contact.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <i className="fas fa-clock text-slate-400" />
                    <span className="text-slate-600">{contact.availability}</span>
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-xs text-slate-500 mb-2">Specialties:</p>
                  <div className="flex flex-wrap gap-1">
                    {contact.specialties.map((specialty, idx) => (
                      <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-4 flex space-x-2">
                  <Button
                    size="sm"
                    className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
                    onClick={() => showSuccess(`Contacting ${contact.name}`)}
                  >
                    <i className="fas fa-envelope mr-1" />
                    Email
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-slate-600 border-slate-300 hover:bg-slate-50"
                    onClick={() => showSuccess(`Calling ${contact.name}`)}
                  >
                    <i className="fas fa-phone mr-1" />
                    Call
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card className="bg-red-50 border-red-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-xl text-red-800">
            <i className="fas fa-exclamation-triangle mr-3" />
            Emergency Support
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-red-900">24/7 Emergency Hotline</h4>
              <p className="text-red-700">For critical system failures or security emergencies</p>
              <p className="text-red-600 font-medium mt-2">+1 (555) 911-SUPPORT</p>
            </div>
            <Button
              className="!bg-red-600 hover:!bg-red-700 text-white"
              onClick={() => showSuccess('Connecting to emergency support')}
            >
              <i className="fas fa-phone mr-2" />
              Call Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderResources = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <i className="fas fa-download mr-3 text-slate-600" />
              Downloads
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <h4 className="font-semibold text-slate-900">User Manual</h4>
                <p className="text-sm text-slate-600">Complete system documentation</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="text-slate-600 border-slate-300 hover:bg-slate-50"
                onClick={() => showSuccess('Downloading user manual')}
              >
                <i className="fas fa-download mr-1" />
                Download
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <h4 className="font-semibold text-slate-900">Mobile App</h4>
                <p className="text-sm text-slate-600">iOS and Android applications</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="text-slate-600 border-slate-300 hover:bg-slate-50"
                onClick={() => showSuccess('Opening app store')}
              >
                <i className="fas fa-external-link-alt mr-1" />
                Download
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <h4 className="font-semibold text-slate-900">API Documentation</h4>
                <p className="text-sm text-slate-600">Developer integration guide</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="text-slate-600 border-slate-300 hover:bg-slate-50"
                onClick={() => showSuccess('Opening API docs')}
              >
                <i className="fas fa-code mr-1" />
                View Docs
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <i className="fas fa-video mr-3 text-slate-600" />
              Training Videos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <h4 className="font-semibold text-slate-900">Getting Started</h4>
                <p className="text-sm text-slate-600">5-minute overview video</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="text-slate-600 border-slate-300 hover:bg-slate-50"
                onClick={() => showSuccess('Playing getting started video')}
              >
                <i className="fas fa-play mr-1" />
                Watch
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <h4 className="font-semibold text-slate-900">Incident Management</h4>
                <p className="text-sm text-slate-600">How to report and manage incidents</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="text-slate-600 border-slate-300 hover:bg-slate-50"
                onClick={() => showSuccess('Playing incident management video')}
              >
                <i className="fas fa-play mr-1" />
                Watch
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <h4 className="font-semibold text-slate-900">Mobile App Training</h4>
                <p className="text-sm text-slate-600">Patrol agent mobile app guide</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="text-slate-600 border-slate-300 hover:bg-slate-50"
                onClick={() => showSuccess('Playing mobile app training video')}
              >
                <i className="fas fa-play mr-1" />
                Watch
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'help':
        return renderHelpCenter();
      case 'tickets':
        return renderSupportTickets();
      case 'contact':
        return renderContactSupport();
      case 'resources':
        return renderResources();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="w-full backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg relative">
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
                <i className="fas fa-question-circle text-white text-2xl" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                <i className="fas fa-check text-white text-xs" />
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-slate-900">Help & Support</h1>
              <p className="text-slate-600 font-medium">Get help, submit tickets, and access resources</p>
            </div>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex justify-center pb-4">
          <div className="flex space-x-1 bg-white/60 backdrop-blur-sm p-1 rounded-lg shadow-lg border border-white/30">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <i className={`${tab.icon} mr-2`} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-6">
        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <i className="fas fa-exclamation-triangle mr-2" />
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            <i className="fas fa-check-circle mr-2" />
            {success}
          </div>
        )}

        {renderTabContent()}

        {/* New Ticket Modal */}
        {showNewTicketModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl mx-4">
              <CardHeader>
                <CardTitle>Create Support Ticket</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={newTicket.title || ''}
                    onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Brief description of the issue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                  <textarea
                    value={newTicket.description || ''}
                    onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Detailed description of the issue, steps to reproduce, etc."
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Priority</label>
                    <select
                      value={newTicket.priority || 'medium'}
                      onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value as any })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                    <select
                      value={newTicket.category || 'technical'}
                      onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value as any })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="technical">Technical</option>
                      <option value="account">Account</option>
                      <option value="feature_request">Feature Request</option>
                      <option value="bug_report">Bug Report</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={() => setShowNewTicketModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      setShowNewTicketModal(false);
                      setNewTicket({ title: '', description: '', priority: 'medium', category: 'technical' });
                      showSuccess('Support ticket created successfully');
                    }}
                    className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
                  >
                    Create Ticket
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default HelpSupport;
