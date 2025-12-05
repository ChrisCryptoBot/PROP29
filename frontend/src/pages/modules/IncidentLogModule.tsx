import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Badge } from '../../components/UI/Badge';
import { Avatar } from '../../components/UI/Avatar';
import { cn } from '../../utils/cn';
import { showError, showSuccess, showLoading, dismissLoadingAndShowSuccess, dismissLoadingAndShowError } from '../../utils/toast';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface Incident {
  id: number;
  title: string;
  type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  location: string;
  status: 'active' | 'investigating' | 'resolved' | 'escalated';
  description: string;
  timestamp: string;
  assignedTo?: string;
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
  witnesses?: string[];
  evidence?: string[];
  photos?: string[];
  videos?: string[];
  cctvClips?: string[];
  aiClassification?: string;
  aiSeverity?: string;
  relatedIncidents?: number[];
  escalationLevel?: number;
  resolutionTime?: string;
  cost?: number;
  guestImpact?: string;
  floorPlanLocation?: { x: number; y: number; floor: string };
  additionalData?: any;
}

const mockIncidents: Incident[] = [
  {
    id: 1,
    title: 'Suspicious Activity - Parking Garage',
    type: 'Security Breach',
    severity: 'HIGH',
    location: 'Parking Garage Level 2',
    status: 'investigating',
    description: 'Multiple individuals loitering near guest vehicles. Security camera footage shows suspicious behavior patterns.',
    timestamp: '2025-01-27 14:30',
    assignedTo: 'John Smith',
    witnesses: ['Mike Davis', 'Sarah Wilson'],
    evidence: ['CCTV_20250127_1430.mp4', 'Photo_1432.jpg'],
    photos: ['incident_1_photo1.jpg', 'incident_1_photo2.jpg'],
    videos: ['security_footage_1430.mp4'],
    cctvClips: ['garage_cam_2_1430.mp4'],
    aiClassification: 'Suspicious Behavior',
    aiSeverity: 'HIGH',
    relatedIncidents: [2, 3],
    escalationLevel: 2,
    guestImpact: 'Medium - 3 guests reported concerns',
    floorPlanLocation: { x: 150, y: 200, floor: 'P2' }
  },
  {
    id: 2,
    title: 'Fire Alarm Activation - Floor 8',
    type: 'Fire Safety',
    severity: 'CRITICAL',
    location: 'Floor 8 - Room 812',
    status: 'active',
    description: 'Fire alarm activated in guest room. Initial investigation shows no fire but requires full building evacuation protocol.',
    timestamp: '2025-01-27 15:45',
    assignedTo: 'Fire Safety Team',
    witnesses: ['Room 812 Guest', 'Housekeeping Staff'],
    evidence: ['Fire_Alarm_Log_1545.txt', 'Room_812_Photo.jpg'],
    escalationLevel: 3,
    guestImpact: 'High - Full building evacuation required'
  },
  {
    id: 3,
    title: 'Guest Injury - Pool Area',
    type: 'Guest Safety',
    severity: 'MEDIUM',
    location: 'Pool Area - Main Deck',
    status: 'resolved',
    description: 'Guest slipped on wet surface near pool. Minor injury, first aid administered.',
    timestamp: '2025-01-27 16:20',
    assignedTo: 'Pool Staff',
    witnesses: ['Lifeguard', 'Pool Guest'],
    evidence: ['Incident_Report_1620.pdf', 'Medical_Assessment.pdf'],
    resolutionTime: '2025-01-27 16:45',
    cost: 150,
    guestImpact: 'Low - Single guest affected'
  }
];

const tabs = [
  { id: 'overview', label: 'Overview', path: '/modules/event-log' },
  { id: 'incidents', label: 'Incident Management', path: '/modules/event-log/incidents' },
  { id: 'trends', label: 'Trend Analysis', path: '/modules/event-log/trends' },
  { id: 'predictions', label: 'Predictive Insights', path: '/modules/event-log/predictions' },
  { id: 'settings', label: 'Settings', path: '/modules/event-log/settings' }
];

const IncidentLogModule: React.FC = () => {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<Incident[]>(mockIncidents);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'investigating' | 'resolved' | 'escalated'>('all');
  const [loading, setLoading] = useState(false);
  
  // Enhanced state management
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({start: '', end: ''});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);
  const [selectedIncidents, setSelectedIncidents] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<'timestamp' | 'severity' | 'status' | 'title'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // AI Classification state
  const [aiSuggestion, setAiSuggestion] = useState<{
    incident_type: string;
    severity: string;
    confidence: number;
    reasoning: string;
    fallback_used: boolean;
  } | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [showAISuggestion, setShowAISuggestion] = useState(false);
  
  // Settings state management
  const [settings, setSettings] = useState({
    autoAssign: false,
    autoEscalate: false,
    emailNotifications: true,
    retentionPeriod: '2 years',
    archiveFrequency: 'Quarterly',
    emailNewIncidents: true,
    emailStatusChanges: true,
    emailEscalations: true,
    smsCritical: true,
    smsEmergency: true,
    apiEndpoint: '',
    apiKey: '',
    slackIntegration: false,
    teamsIntegration: false,
    webhookNotifications: false,
    requireAuth: true,
    sessionTimeout: 30,
    encryptData: true,
    auditLogAccess: true
  });
  
  // Type assertion to fix TypeScript strict literal type inference
  const currentTab = activeTab as any;

  const filteredIncidents = incidents.filter(incident => {
    // Status filter
    if (filter !== 'all' && incident.status !== filter) return false;
    
    // Search term filter
    if (searchTerm && !incident.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !incident.description.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !incident.location.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    
    // Severity filter
    if (severityFilter !== 'all' && incident.severity !== severityFilter) return false;
    
    // Type filter
    if (typeFilter !== 'all' && incident.type !== typeFilter) return false;
    
    // Date range filter
    if (dateRange.start && new Date(incident.timestamp) < new Date(dateRange.start)) return false;
    if (dateRange.end && new Date(incident.timestamp) > new Date(dateRange.end)) return false;
    
    return true;
  }).sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    
    if (sortBy === 'timestamp') {
      return sortOrder === 'asc' 
        ? new Date(aValue as string).getTime() - new Date(bValue as string).getTime()
        : new Date(bValue as string).getTime() - new Date(aValue as string).getTime();
    }
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(filteredIncidents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedIncidents = filteredIncidents.slice(startIndex, endIndex);

  // Get unique types for filter dropdown
  const incidentTypes = [...new Set(incidents.map(incident => incident.type))];

  const handleAssignIncident = useCallback(async (incidentId: number, assignee: string) => {
    let toastId: string | undefined;
    try {
      toastId = showLoading('Assigning incident...');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIncidents(prev => prev.map(incident =>
        incident.id === incidentId
          ? { ...incident, assignedTo: assignee, status: 'investigating' as const }
          : incident
      ));
      
      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Incident assigned successfully');
      }
    } catch (error) {
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to assign incident');
      }
    }
  }, []);

  const handleEscalateIncident = useCallback(async (incidentId: number) => {
    let toastId: string | undefined;
    try {
      toastId = showLoading('Escalating incident...');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIncidents(prev => prev.map(incident =>
        incident.id === incidentId
          ? { ...incident, status: 'escalated' as const, escalationLevel: (incident.escalationLevel || 0) + 1 }
          : incident
      ));
      
      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Incident escalated successfully');
      }
    } catch (error) {
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to escalate incident');
      }
    }
  }, []);

  // Enhanced handler functions
  // AI Classification Handler
  const handleGetAISuggestion = useCallback(async () => {
    const title = (document.getElementById('incident-title') as HTMLInputElement)?.value;
    const description = (document.getElementById('incident-description') as HTMLTextAreaElement)?.value;
    const location = (document.getElementById('incident-location') as HTMLInputElement)?.value;

    if (!description || description.trim().length < 10) {
      showError('Please enter a detailed description (at least 10 characters) before requesting AI suggestions');
      return;
    }

    setIsLoadingAI(true);
    setAiSuggestion(null);
    setShowAISuggestion(false);

    try {
      const response = await fetch('http://localhost:8000/incidents/ai-classify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        },
        body: JSON.stringify({
          title: title || '',
          description: description,
          location: location ? { area: location } : null
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      setAiSuggestion(data);
      setShowAISuggestion(true);
      showSuccess('AI analysis complete!');
    } catch (error) {
      console.error('AI classification error:', error);
      showError('Failed to get AI suggestions. Using manual classification.');
    } finally {
      setIsLoadingAI(false);
    }
  }, []);

  // Apply AI Suggestion to form
  const handleApplyAISuggestion = useCallback(() => {
    if (!aiSuggestion) return;

    const typeSelect = document.getElementById('incident-type') as HTMLSelectElement;
    const severitySelect = document.getElementById('incident-severity') as HTMLSelectElement;

    // Map AI incident type to form options
    const typeMapping: Record<string, string> = {
      'theft': 'Security',
      'disturbance': 'Security',
      'medical': 'Emergency',
      'fire': 'Emergency',
      'flood': 'Maintenance',
      'cyber': 'System',
      'guest_complaint': 'Guest Service',
      'other': 'Security'
    };

    const mappedType = typeMapping[aiSuggestion.incident_type] || 'Security';
    if (typeSelect) typeSelect.value = mappedType;
    if (severitySelect) severitySelect.value = aiSuggestion.severity.toUpperCase();

    showSuccess('AI suggestion applied!');
  }, [aiSuggestion]);

  const handleCreateIncident = useCallback(async (incidentData: Partial<Incident>) => {
    let toastId: string | undefined;
    try {
      toastId = showLoading('Creating incident...');

      await new Promise(resolve => setTimeout(resolve, 1000));

      const newIncident: Incident = {
        id: Math.max(...incidents.map(i => i.id)) + 1,
        title: incidentData.title || 'New Incident',
        type: incidentData.type || 'General',
        severity: incidentData.severity || 'MEDIUM',
        location: incidentData.location || 'Unknown',
        status: 'active',
        description: incidentData.description || '',
        timestamp: new Date().toISOString(),
        aiClassification: aiSuggestion ? `${aiSuggestion.incident_type} (${(aiSuggestion.confidence * 100).toFixed(0)}% confidence)` : undefined,
        ...incidentData
      };

      setIncidents(prev => [newIncident, ...prev]);
      setShowCreateModal(false);
      setAiSuggestion(null);
      setShowAISuggestion(false);

      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Incident created successfully');
      }
    } catch (error) {
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to create incident');
      }
    }
  }, [incidents, aiSuggestion]);

  const handleEditIncident = useCallback(async (incidentId: number, updates: Partial<Incident>) => {
    let toastId: string | undefined;
    try {
      toastId = showLoading('Updating incident...');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIncidents(prev => prev.map(incident =>
        incident.id === incidentId ? { ...incident, ...updates } : incident
      ));
      
      setShowEditModal(false);
      setEditingIncident(null);
      
      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Incident updated successfully');
      }
    } catch (error) {
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to update incident');
      }
    }
  }, []);

  const handleDeleteIncident = useCallback(async (incidentId: number) => {
    if (!window.confirm('Are you sure you want to delete this incident?')) return;
    
    let toastId: string | undefined;
    try {
      toastId = showLoading('Deleting incident...');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIncidents(prev => prev.filter(incident => incident.id !== incidentId));
      
      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Incident deleted successfully');
      }
    } catch (error) {
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to delete incident');
      }
    }
  }, []);

  const handleBulkDelete = useCallback(async () => {
    if (selectedIncidents.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedIncidents.length} incidents?`)) return;
    
    let toastId: string | undefined;
    try {
      toastId = showLoading('Deleting incidents...');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIncidents(prev => prev.filter(incident => !selectedIncidents.includes(incident.id)));
      setSelectedIncidents([]);
      
      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, `${selectedIncidents.length} incidents deleted successfully`);
      }
    } catch (error) {
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to delete incidents');
      }
    }
  }, [selectedIncidents]);

  const handleBulkStatusChange = useCallback(async (status: Incident['status']) => {
    if (selectedIncidents.length === 0) return;
    
    let toastId: string | undefined;
    try {
      toastId = showLoading('Updating incidents...');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIncidents(prev => prev.map(incident =>
        selectedIncidents.includes(incident.id) ? { ...incident, status } : incident
      ));
      
      setSelectedIncidents([]);
      
      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, `${selectedIncidents.length} incidents updated successfully`);
      }
    } catch (error) {
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to update incidents');
      }
    }
  }, [selectedIncidents]);

  const handleExportData = useCallback(async () => {
    let toastId: string | undefined;
    try {
      toastId = showLoading('Exporting data...');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const csvContent = [
        ['ID', 'Title', 'Type', 'Severity', 'Status', 'Location', 'Timestamp', 'Assigned To'],
        ...filteredIncidents.map(incident => [
          incident.id,
          incident.title,
          incident.type,
          incident.severity,
          incident.status,
          incident.location,
          incident.timestamp,
          incident.assignedTo || 'Unassigned'
        ])
      ].map(row => row.join(',')).join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `incidents-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Data exported successfully');
      }
    } catch (error) {
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to export data');
      }
    }
  }, [filteredIncidents]);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      showSuccess('Data refreshed successfully');
    } catch (error) {
      showError('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelectIncident = useCallback((incident: Incident) => {
    setSelectedIncident(incident);
    setShowDetailsModal(true);
  }, []);

  const handleEditIncidentClick = useCallback((incident: Incident) => {
    setEditingIncident(incident);
    setShowEditModal(true);
  }, []);

  const handleToggleSelectIncident = useCallback((incidentId: number) => {
    setSelectedIncidents(prev => 
      prev.includes(incidentId) 
        ? prev.filter(id => id !== incidentId)
        : [...prev, incidentId]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedIncidents.length === filteredIncidents.length) {
      setSelectedIncidents([]);
    } else {
      setSelectedIncidents(filteredIncidents.map(incident => incident.id));
    }
  }, [selectedIncidents.length, filteredIncidents]);

  const handleResolveIncident = useCallback(async (incidentId: number) => {
    let toastId: string | undefined;
    try {
      toastId = showLoading('Resolving incident...');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIncidents(prev => prev.map(incident =>
        incident.id === incidentId
          ? { ...incident, status: 'resolved' as const, resolutionTime: new Date().toISOString() }
          : incident
      ));
      
      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Incident resolved successfully');
      }
    } catch (error) {
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to resolve incident');
      }
    }
  }, []);

  const handleSaveSettings = useCallback(async () => {
    let toastId: string | undefined;
    try {
      toastId = showLoading('Saving settings...');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Settings saved successfully');
      }
    } catch (error) {
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to save settings');
      }
    }
  }, [settings]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'destructive';
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'success';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'destructive';
      case 'investigating': return 'warning';
      case 'resolved': return 'success';
      case 'escalated': return 'destructive';
      default: return 'secondary';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'security breach': return 'fas fa-shield-alt';
      case 'fire safety': return 'fas fa-fire';
      case 'guest safety': return 'fas fa-user-shield';
      case 'facility maintenance': return 'fas fa-tools';
      case 'guest relations': return 'fas fa-comments';
      default: return 'fas fa-exclamation-triangle';
    }
  };

  // Chart data for Trends and Analytics
  const trendData = [
    { month: 'Jan', incidents: 12, critical: 2, high: 5, medium: 3, low: 2 },
    { month: 'Feb', incidents: 15, critical: 3, high: 6, medium: 4, low: 2 },
    { month: 'Mar', incidents: 18, critical: 4, high: 7, medium: 5, low: 2 },
    { month: 'Apr', incidents: 14, critical: 2, high: 6, medium: 4, low: 2 },
    { month: 'May', incidents: 20, critical: 5, high: 8, medium: 5, low: 2 },
    { month: 'Jun', incidents: 16, critical: 3, high: 6, medium: 5, low: 2 }
  ];

  const typeDistribution = [
    { type: 'Security Breach', count: 15, percentage: 30 },
    { type: 'Fire Safety', count: 10, percentage: 20 },
    { type: 'Guest Safety', count: 12, percentage: 24 },
    { type: 'Facility Maintenance', count: 8, percentage: 16 },
    { type: 'Guest Relations', count: 5, percentage: 10 }
  ];

  const locationHotspots = [
    { location: 'Parking Garage', count: 18, risk: 'High' },
    { location: 'Pool Area', count: 15, risk: 'Medium' },
    { location: 'Lobby', count: 12, risk: 'Medium' },
    { location: 'Restaurant', count: 8, risk: 'Low' },
    { location: 'Guest Rooms', count: 7, risk: 'Low' }
  ];

  const timePatterns = [
    { time: '00:00', incidents: 2 },
    { time: '04:00', incidents: 1 },
    { time: '08:00', incidents: 5 },
    { time: '12:00', incidents: 8 },
    { time: '16:00', incidents: 12 },
    { time: '20:00', incidents: 15 },
    { time: '24:00', incidents: 6 }
  ];

  const predictiveData = [
    { metric: 'Security Risk', current: 65, predicted: 72, threshold: 80 },
    { metric: 'Guest Safety', current: 45, predicted: 38, threshold: 60 },
    { metric: 'Fire Safety', current: 25, predicted: 28, threshold: 40 },
    { metric: 'Maintenance', current: 55, predicted: 60, threshold: 70 }
  ];

  const COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe'];

  const metrics = {
    total: incidents.length,
    active: incidents.filter(i => i.status === 'active').length,
    investigating: incidents.filter(i => i.status === 'investigating').length,
    resolved: incidents.filter(i => i.status === 'resolved').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      {/* HEADER - GOLD STANDARD LAYOUT */}
      <div className="w-full backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg relative">
        
        {/* Title Section - CENTER */}
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
                <i className="fas fa-list-alt text-white text-2xl" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                <i className="fas fa-exclamation text-white text-xs" />
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-slate-900">
                Incident Log
              </h1>
              <p className="text-slate-600 font-medium">
                Comprehensive incident logging, management, and analytics
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="relative w-full backdrop-blur-xl bg-white/60 border-b border-white/20 shadow-lg">
        <div className="px-6 py-4">
          <div className="flex justify-center">
            <div className="flex space-x-1 bg-white/60 backdrop-blur-sm p-1 rounded-lg shadow-lg border border-white/30">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    currentTab === tab.id
                      ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - GOLD STANDARD LAYOUT */}
      <div className="relative max-w-7xl mx-auto px-6 py-6">
        {/* Key Metrics - GOLD STANDARD 4-CARD LAYOUT */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Incidents */}
          <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                  <i className="fas fa-list-alt text-white text-xl" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-slate-900">
                  {metrics.total}
                </h3>
                <p className="text-slate-600 text-sm">
                  Total Incidents
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Active Incidents */}
          <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                  <i className="fas fa-exclamation-triangle text-white text-xl" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-slate-900">
                  {metrics.active}
                </h3>
                <p className="text-slate-600 text-sm">
                  Active Incidents
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Investigating */}
          <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                  <i className="fas fa-search text-white text-xl" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-slate-900">
                  {metrics.investigating}
                </h3>
                <p className="text-slate-600 text-sm">
                  Under Investigation
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Resolved */}
          <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                  <i className="fas fa-check-circle text-white text-xl" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-slate-900">
                  {metrics.resolved}
                </h3>
                <p className="text-slate-600 text-sm">
                  Resolved Incidents
                </p>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Content based on active tab */}
        {currentTab === 'overview' && (
          <>
            {/* Enhanced Search and Filters */}
            <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm mb-8">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <i className="fas fa-search mr-3 text-slate-600" />
                  Search & Filter Incidents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {/* Search */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Search</label>
                    <input
                      type="text"
                      placeholder="Search incidents..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  {/* Status Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Status</label>
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="investigating">Investigating</option>
                      <option value="resolved">Resolved</option>
                      <option value="escalated">Escalated</option>
                    </select>
                  </div>
                  
                  {/* Severity Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Severity</label>
                    <select
                      value={severityFilter}
                      onChange={(e) => setSeverityFilter(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Severity</option>
                      <option value="CRITICAL">Critical</option>
                      <option value="HIGH">High</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LOW">Low</option>
                    </select>
                  </div>
                  
                  {/* Type Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Type</label>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Types</option>
                      {incidentTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Date Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Start Date</label>
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">End Date</label>
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => setShowCreateModal(true)} className="!bg-[#2563eb] hover:!bg-blue-700 text-white">
                    <i className="fas fa-plus mr-2" />
                    Create Incident
                  </Button>
                  <Button onClick={handleExportData} className="!bg-[#2563eb] hover:!bg-blue-700 text-white">
                    <i className="fas fa-download mr-2" />
                    Export Data
                  </Button>
                  <Button onClick={handleRefresh} className="!bg-[#2563eb] hover:!bg-blue-700 text-white" disabled={loading}>
                    <i className={`fas fa-sync-alt mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  {selectedIncidents.length > 0 && (
                    <>
                      <Button onClick={handleBulkDelete} style={{background: '#ef4444'}} className="hover:bg-red-600 text-white border-none">
                        <i className="fas fa-trash mr-2" />
                        Delete Selected ({selectedIncidents.length})
                      </Button>
                      <Button onClick={() => handleBulkStatusChange('resolved')} className="!bg-[#2563eb] hover:!bg-blue-700 text-white">
                        <i className="fas fa-check mr-2" />
                        Mark Resolved
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Incident List */}
            <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm mb-8">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center text-xl">
                  <i className="fas fa-list-alt mr-3 text-slate-600" />
                  Incidents ({filteredIncidents.length})
                </CardTitle>
                <div className="flex items-center space-x-4">
                  {/* Sort Options */}
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-slate-600">Sort by:</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="px-2 py-1 border border-slate-300 rounded text-sm"
                    >
                      <option value="timestamp">Date</option>
                      <option value="severity">Severity</option>
                      <option value="status">Status</option>
                      <option value="title">Title</option>
                    </select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    >
                      <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`} />
                    </Button>
                  </div>
                  
                  {/* Select All */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    {selectedIncidents.length === filteredIncidents.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredIncidents.map((incident) => (
                    <div
                      key={incident.id}
                      className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => setSelectedIncident(incident)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <i className={cn(getTypeIcon(incident.type), "text-slate-600")} />
                            <h4 className="font-semibold text-slate-900">{incident.title}</h4>
                            <Badge variant={getSeverityColor(incident.severity) as any}>
                              {incident.severity}
                            </Badge>
                            <Badge variant={getStatusColor(incident.status) as any}>
                              {incident.status}
                            </Badge>
                          </div>
                          <p className="text-slate-600 text-sm mb-2">{incident.description}</p>
                          <div className="flex items-center space-x-4 text-xs text-slate-500">
                            <span><i className="fas fa-map-marker-alt mr-1" />{incident.location}</span>
                            <span><i className="fas fa-clock mr-1" />{incident.timestamp}</span>
                            {incident.assignedTo && (
                              <span><i className="fas fa-user mr-1" />{incident.assignedTo}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAssignIncident(incident.id, 'Current User');
                            }}
                            disabled={loading}
                          >
                            Assign
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEscalateIncident(incident.id);
                            }}
                            disabled={loading}
                          >
                            Escalate
                          </Button>
                          {incident.status !== 'resolved' && (
                            <Button
                              size="sm"
                              className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleResolveIncident(incident.id);
                              }}
                              disabled={loading}
                            >
                              Resolve
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Other tabs content would go here */}
        {currentTab === 'incidents' && (
          <div className="space-y-6">
            {/* Incident Management Header */}
          <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm">
            <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-xl">
                    <i className="fas fa-tasks mr-3 text-slate-600" />
                    Incident Management
                  </CardTitle>
                  <div className="flex space-x-2">
                    <Button onClick={handleExportData} className="!bg-[#2563eb] hover:!bg-blue-700 text-white">
                      <i className="fas fa-download mr-2" />
                      Export
                    </Button>
                    <Button onClick={handleRefresh} className="!bg-[#2563eb] hover:!bg-blue-700 text-white" disabled={loading}>
                      <i className={`fas fa-sync-alt mr-2 ${loading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-50 rounded-lg border-[1.5px] border-slate-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Active Incidents</p>
                        <p className="text-2xl font-bold text-slate-900">{incidents.filter(i => i.status === 'active').length}</p>
                      </div>
                      <i className="fas fa-exclamation-triangle text-slate-600 text-2xl" />
                    </div>
                  </div>
                  
                  <div className="p-4 bg-slate-50 rounded-lg border-[1.5px] border-slate-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Investigating</p>
                        <p className="text-2xl font-bold text-slate-900">{incidents.filter(i => i.status === 'investigating').length}</p>
                      </div>
                      <i className="fas fa-search text-slate-600 text-2xl" />
                    </div>
                  </div>
                  
                  <div className="p-4 bg-slate-50 rounded-lg border-[1.5px] border-slate-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Resolved</p>
                        <p className="text-2xl font-bold text-slate-900">{incidents.filter(i => i.status === 'resolved').length}</p>
                      </div>
                      <i className="fas fa-check-circle text-slate-600 text-2xl" />
                    </div>
                  </div>
                  
                  <div className="p-4 bg-slate-50 rounded-lg border-[1.5px] border-slate-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Escalated</p>
                        <p className="text-2xl font-bold text-slate-900">{incidents.filter(i => i.status === 'escalated').length}</p>
                      </div>
                      <i className="fas fa-arrow-up text-slate-600 text-2xl" />
                    </div>
                  </div>
                </div>
            </CardContent>
          </Card>

            {/* Incident List with Enhanced Management */}
            <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <i className="fas fa-list-alt mr-3 text-slate-600" />
                  All Incidents ({incidents.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {incidents.map((incident) => (
                    <div
                      key={incident.id}
                      className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <i className={cn(getTypeIcon(incident.type), "text-slate-600")} />
                            <h4 className="font-semibold text-slate-900">{incident.title}</h4>
                            <Badge variant={getSeverityColor(incident.severity) as any}>
                              {incident.severity}
                            </Badge>
                            <Badge variant={getStatusColor(incident.status) as any}>
                              {incident.status}
                            </Badge>
                          </div>
                          <p className="text-slate-600 text-sm mb-2">{incident.description}</p>
                          <div className="flex items-center space-x-4 text-xs text-slate-500">
                            <span><i className="fas fa-map-marker-alt mr-1" />{incident.location}</span>
                            <span><i className="fas fa-clock mr-1" />{incident.timestamp}</span>
                            {incident.assignedTo && (
                              <span><i className="fas fa-user mr-1" />{incident.assignedTo}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSelectIncident(incident)}
                          >
                            <i className="fas fa-eye mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditIncidentClick(incident)}
                          >
                            <i className="fas fa-edit mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAssignIncident(incident.id, 'Security Team')}
                          >
                            <i className="fas fa-user-plus mr-1" />
                            Assign
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEscalateIncident(incident.id)}
                          >
                            <i className="fas fa-arrow-up mr-1" />
                            Escalate
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteIncident(incident.id)}
                          >
                            <i className="fas fa-trash mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentTab === 'trends' && (
          <div className="space-y-6">
            {/* Incident Trends Over Time */}
            <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center mr-3">
                    <i className="fas fa-chart-line text-white" />
                  </div>
                  Incident Trends Over Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="incidents" stackId="1" stroke="#2563eb" fill="#2563eb" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Incident Type Distribution */}
            <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center mr-3">
                    <i className="fas fa-chart-pie text-white" />
                  </div>
                  Incident Type Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={typeDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.type}: ${entry.percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {typeDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  <div className="space-y-3">
                    {typeDistribution.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-4 h-4 rounded" style={{backgroundColor: COLORS[index % COLORS.length]}} />
                          <span className="text-sm font-medium text-slate-700">{item.type}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-slate-900">{item.count}</span>
                          <span className="text-xs text-slate-500 ml-1">({item.percentage}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location Hotspots */}
            <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center mr-3">
                    <i className="fas fa-map-marker-alt text-white" />
                  </div>
                  Location Hotspots
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={locationHotspots}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="location" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#2563eb" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Time Pattern Analysis */}
            <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center mr-3">
                    <i className="fas fa-clock text-white" />
                  </div>
                  Time Pattern Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timePatterns}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="incidents" stroke="#2563eb" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {currentTab === 'predictions' && (
          <div className="space-y-6">
            {/* AI Risk Predictions */}
            <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center mr-3">
                    <i className="fas fa-brain text-white" />
                  </div>
                  AI Risk Predictions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {predictiveData.map((item, index) => (
                    <div key={index} className="p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-slate-900">{item.metric}</span>
                        <Badge variant={item.predicted > item.threshold ? 'destructive' : item.predicted > item.current ? 'warning' : 'success'}>
                          {item.predicted > item.threshold ? 'High Risk' : item.predicted > item.current ? 'Increasing' : 'Improving'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-slate-600">Current</p>
                          <p className="text-lg font-bold text-slate-900">{item.current}%</p>
                        </div>
                        <div>
                          <p className="text-slate-600">Predicted</p>
                          <p className="text-lg font-bold text-blue-600">{item.predicted}%</p>
                        </div>
                        <div>
                          <p className="text-slate-600">Threshold</p>
                          <p className="text-lg font-bold text-red-600">{item.threshold}%</p>
                        </div>
                      </div>
                      <div className="mt-3 w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${item.predicted > item.threshold ? 'bg-red-500' : 'bg-blue-600'}`}
                          style={{width: `${(item.predicted / item.threshold) * 100}%`}}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Pattern Recognition */}
            <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center mr-3">
                    <i className="fas fa-lightbulb text-white" />
                  </div>
                  Pattern Recognition
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border-l-4 border-blue-600">
                    <div className="flex items-start">
                      <i className="fas fa-info-circle text-blue-600 mt-1 mr-3" />
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-1">Parking Garage Pattern Detected</h4>
                        <p className="text-sm text-slate-600">
                          Incidents in the parking garage increase by 40% on weekends. Recommend additional security patrols.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-yellow-50 border-l-4 border-yellow-600">
                    <div className="flex items-start">
                      <i className="fas fa-exclamation-triangle text-yellow-600 mt-1 mr-3" />
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-1">Evening Spike Anomaly</h4>
                        <p className="text-sm text-slate-600">
                          Unusual spike in incidents between 8-10 PM. This pattern began 2 weeks ago.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-green-50 border-l-4 border-green-600">
                    <div className="flex items-start">
                      <i className="fas fa-check-circle text-green-600 mt-1 mr-3" />
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-1">Pool Area Improvement</h4>
                        <p className="text-sm text-slate-600">
                          Pool area incidents decreased by 25% after implementing new safety protocols.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Early Warning System */}
            <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-xl">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center mr-3">
                      <i className="fas fa-bell text-white" />
                    </div>
                    Early Warning Alerts
                  </CardTitle>
                  <Button onClick={() => showSuccess('Alerts configured')} style={{background: '#2563eb'}} className="hover:bg-blue-700 text-white border-none">
                    <i className="fas fa-cog mr-2" />
                    Configure
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <i className="fas fa-shield-alt text-red-600" />
                      <div>
                        <p className="font-semibold text-slate-900">Security Risk Alert</p>
                        <p className="text-xs text-slate-600">Predicted to exceed threshold in 3 days</p>
                      </div>
                    </div>
                    <Badge variant="destructive">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <i className="fas fa-tools text-yellow-600" />
                      <div>
                        <p className="font-semibold text-slate-900">Maintenance Alert</p>
                        <p className="text-xs text-slate-600">Increasing trend detected</p>
                      </div>
                    </div>
                    <Badge variant="warning">Warning</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentTab === 'settings' && (
          <div className="space-y-6">
            {/* System Settings */}
          <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center mr-3">
                    <i className="fas fa-cogs text-white" />
                  </div>
                  System Settings
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900">Incident Configuration</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">Auto-assign incidents</span>
                        <input 
                          type="checkbox" 
                          checked={settings.autoAssign}
                          onChange={(e) => setSettings({...settings, autoAssign: e.target.checked})}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">Auto-escalate after 24h</span>
                        <input 
                          type="checkbox" 
                          checked={settings.autoEscalate}
                          onChange={(e) => setSettings({...settings, autoEscalate: e.target.checked})}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">Email notifications</span>
                        <input 
                          type="checkbox" 
                          checked={settings.emailNotifications}
                          onChange={(e) => setSettings({...settings, emailNotifications: e.target.checked})}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900">Data Retention</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Incident retention period</label>
                        <select 
                          value={settings.retentionPeriod}
                          onChange={(e) => setSettings({...settings, retentionPeriod: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option>1 year</option>
                          <option>2 years</option>
                          <option>5 years</option>
                          <option>Permanent</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Archive frequency</label>
                        <select 
                          value={settings.archiveFrequency}
                          onChange={(e) => setSettings({...settings, archiveFrequency: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option>Monthly</option>
                          <option>Quarterly</option>
                          <option>Annually</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
            </CardContent>
          </Card>

            {/* Notification Settings */}
          <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center mr-3">
                    <i className="fas fa-bell text-white" />
                  </div>
                  Notification Settings
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900">Email Notifications</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">New incidents</span>
                        <input 
                          type="checkbox" 
                          checked={settings.emailNewIncidents}
                          onChange={(e) => setSettings({...settings, emailNewIncidents: e.target.checked})}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">Status changes</span>
                        <input 
                          type="checkbox" 
                          checked={settings.emailStatusChanges}
                          onChange={(e) => setSettings({...settings, emailStatusChanges: e.target.checked})}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">Escalations</span>
                        <input 
                          type="checkbox" 
                          checked={settings.emailEscalations}
                          onChange={(e) => setSettings({...settings, emailEscalations: e.target.checked})}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900">SMS Notifications</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">Critical incidents</span>
                        <input 
                          type="checkbox" 
                          checked={settings.smsCritical}
                          onChange={(e) => setSettings({...settings, smsCritical: e.target.checked})}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">Emergency alerts</span>
                        <input 
                          type="checkbox" 
                          checked={settings.smsEmergency}
                          onChange={(e) => setSettings({...settings, smsEmergency: e.target.checked})}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
            </CardContent>
          </Card>

            {/* Integration Settings */}
            <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center mr-3">
                    <i className="fas fa-plug text-white" />
                  </div>
                  Integration Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900">API Configuration</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">API Endpoint</label>
                        <input 
                          type="text" 
                          value={settings.apiEndpoint}
                          onChange={(e) => setSettings({...settings, apiEndpoint: e.target.value})}
                          placeholder="https://api.example.com/incidents"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">API Key</label>
                        <input 
                          type="password" 
                          value={settings.apiKey}
                          onChange={(e) => setSettings({...settings, apiKey: e.target.value})}
                          placeholder="Enter API key"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900">Third-party Integrations</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">Slack integration</span>
                        <input 
                          type="checkbox" 
                          checked={settings.slackIntegration}
                          onChange={(e) => setSettings({...settings, slackIntegration: e.target.checked})}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">Microsoft Teams</span>
                        <input 
                          type="checkbox" 
                          checked={settings.teamsIntegration}
                          onChange={(e) => setSettings({...settings, teamsIntegration: e.target.checked})}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">Webhook notifications</span>
                        <input 
                          type="checkbox" 
                          checked={settings.webhookNotifications}
                          onChange={(e) => setSettings({...settings, webhookNotifications: e.target.checked})}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center mr-3">
                    <i className="fas fa-shield-alt text-white" />
                  </div>
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900">Access Control</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">Require authentication</span>
                        <input 
                          type="checkbox" 
                          checked={settings.requireAuth}
                          onChange={(e) => setSettings({...settings, requireAuth: e.target.checked})}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">Session timeout (minutes)</span>
                        <input 
                          type="number" 
                          value={settings.sessionTimeout}
                          onChange={(e) => setSettings({...settings, sessionTimeout: parseInt(e.target.value)})}
                          className="w-20 px-2 py-1 border border-slate-300 rounded text-sm" 
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900">Data Security</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">Encrypt sensitive data</span>
                        <input 
                          type="checkbox" 
                          checked={settings.encryptData}
                          onChange={(e) => setSettings({...settings, encryptData: e.target.checked})}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">Audit log access</span>
                        <input 
                          type="checkbox" 
                          checked={settings.auditLogAccess}
                          onChange={(e) => setSettings({...settings, auditLogAccess: e.target.checked})}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Settings Button */}
            <div className="flex justify-end">
              <Button onClick={handleSaveSettings} className="!bg-[#2563eb] hover:!bg-blue-700 text-white px-6 py-2">
                <i className="fas fa-save mr-2" />
                Save Settings
              </Button>
            </div>
          </div>
        )}

        {/* Create Incident Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-900">Create New Incident</h2>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="incident-title" className="block text-sm font-medium text-slate-700 mb-2">Incident Title</label>
                    <input
                      type="text"
                      id="incident-title"
                      className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter incident title"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="incident-type" className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                    <select
                      id="incident-type"
                      className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Security">Security</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Guest Service">Guest Service</option>
                      <option value="System">System</option>
                      <option value="Emergency">Emergency</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="incident-severity" className="block text-sm font-medium text-slate-700 mb-2">Severity</label>
                    <select
                      id="incident-severity"
                      className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="incident-location" className="block text-sm font-medium text-slate-700 mb-2">Location</label>
                    <input
                      type="text"
                      id="incident-location"
                      className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter location"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="incident-description" className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                  <textarea
                    id="incident-description"
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    placeholder="Enter incident description"
                  />
                </div>

                {/* AI Suggestion Button - Gold Standard Design */}
                <div className="glass-card p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="duotone-overlay duotone-primary">
                        <i className="fas fa-robot"></i>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">AI-Powered Classification</p>
                        <p className="text-xs text-slate-600">Get instant suggestions for incident type and severity</p>
                      </div>
                    </div>
                    <Button
                      onClick={handleGetAISuggestion}
                      disabled={isLoadingAI}
                      className="btn btn-primary"
                    >
                      {isLoadingAI ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-magic mr-2"></i>
                          Get AI Suggestion
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* AI Suggestion Display - Gold Standard Design */}
                {showAISuggestion && aiSuggestion && (
                  <div className="glass-card-strong p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="duotone-overlay duotone-warning">
                          <i className="fas fa-lightbulb"></i>
                        </div>
                        <h4 className="font-semibold text-slate-900">AI Suggestion</h4>
                        <Badge className={cn(
                          "badge",
                          aiSuggestion.confidence >= 0.8 ? "badge-success" :
                          aiSuggestion.confidence >= 0.6 ? "badge-warning" :
                          "badge-danger"
                        )}>
                          {(aiSuggestion.confidence * 100).toFixed(0)}% Confidence
                        </Badge>
                        {aiSuggestion.fallback_used && (
                          <Badge className="badge badge-glass">
                            Keyword-based
                          </Badge>
                        )}
                      </div>
                      <button
                        onClick={() => setShowAISuggestion(false)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div className="glass-card p-3">
                        <p className="text-xs text-slate-600 mb-1">Suggested Type</p>
                        <p className="font-semibold text-slate-900 capitalize">
                          {aiSuggestion.incident_type.replace('_', ' ')}
                        </p>
                      </div>
                      <div className="glass-card p-3">
                        <p className="text-xs text-slate-600 mb-1">Suggested Severity</p>
                        <Badge className={cn(
                          "badge",
                          aiSuggestion.severity.toLowerCase() === 'critical' ? "badge-danger" :
                          aiSuggestion.severity.toLowerCase() === 'high' ? "badge-warning" :
                          aiSuggestion.severity.toLowerCase() === 'medium' ? "badge-info" :
                          "badge-success"
                        )}>
                          {aiSuggestion.severity.toUpperCase()}
                        </Badge>
                      </div>
                    </div>

                    <div className="glass-card p-3 mb-3">
                      <p className="text-xs text-slate-600 mb-1">AI Reasoning</p>
                      <p className="text-sm text-slate-700">{aiSuggestion.reasoning}</p>
                    </div>

                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => setShowAISuggestion(false)}
                        className="btn btn-ghost"
                      >
                        Dismiss
                      </button>
                      <Button
                        onClick={handleApplyAISuggestion}
                        className="btn btn-success"
                      >
                        <i className="fas fa-check mr-2"></i>
                        Apply Suggestion
                      </Button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="incident-assigned" className="block text-sm font-medium text-slate-700 mb-2">Assign To</label>
                    <select
                      id="incident-assigned"
                      className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Unassigned</option>
                      <option value="Security Team">Security Team</option>
                      <option value="Maintenance Team">Maintenance Team</option>
                      <option value="Front Desk">Front Desk</option>
                      <option value="Management">Management</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="incident-priority" className="block text-sm font-medium text-slate-700 mb-2">Priority</label>
                    <select
                      id="incident-priority"
                      className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateModal(false)}
                  className="border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    // Get form data and create incident
                    const title = (document.getElementById('incident-title') as HTMLInputElement)?.value;
                    const type = (document.getElementById('incident-type') as HTMLSelectElement)?.value;
                    const severity = (document.getElementById('incident-severity') as HTMLSelectElement)?.value;
                    const location = (document.getElementById('incident-location') as HTMLInputElement)?.value;
                    const description = (document.getElementById('incident-description') as HTMLTextAreaElement)?.value;
                    const assignedTo = (document.getElementById('incident-assigned') as HTMLSelectElement)?.value;
                    const priority = (document.getElementById('incident-priority') as HTMLSelectElement)?.value;
                    
                    if (title && type && severity && location && description) {
                      handleCreateIncident({
                        title,
                        type,
                        severity: severity as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
                        location,
                        description,
                        assignedTo: assignedTo || undefined,
                        priority: priority as 'Low' | 'Medium' | 'High' | 'Urgent'
                      });
                    } else {
                      showError('Please fill in all required fields');
                    }
                  }}
                  className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
                >
                  Create Incident
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Incident Modal */}
        {showEditModal && editingIncident && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-900">Edit Incident</h2>
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="edit-title" className="block text-sm font-medium text-slate-700 mb-2">Incident Title</label>
                    <input
                      type="text"
                      id="edit-title"
                      defaultValue={editingIncident.title}
                      className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="edit-type" className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                    <select
                      id="edit-type"
                      defaultValue={editingIncident.type}
                      className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Security">Security</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Guest Service">Guest Service</option>
                      <option value="System">System</option>
                      <option value="Emergency">Emergency</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="edit-severity" className="block text-sm font-medium text-slate-700 mb-2">Severity</label>
                    <select
                      id="edit-severity"
                      defaultValue={editingIncident.severity}
                      className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="edit-status" className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                    <select
                      id="edit-status"
                      defaultValue={editingIncident.status}
                      className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="active">Active</option>
                      <option value="investigating">Investigating</option>
                      <option value="resolved">Resolved</option>
                      <option value="escalated">Escalated</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="edit-description" className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                  <textarea
                    id="edit-description"
                    defaultValue={editingIncident.description}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="edit-assigned" className="block text-sm font-medium text-slate-700 mb-2">Assign To</label>
                    <select
                      id="edit-assigned"
                      defaultValue={editingIncident.assignedTo || ''}
                      className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Unassigned</option>
                      <option value="Security Team">Security Team</option>
                      <option value="Maintenance Team">Maintenance Team</option>
                      <option value="Front Desk">Front Desk</option>
                      <option value="Management">Management</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="edit-location" className="block text-sm font-medium text-slate-700 mb-2">Location</label>
                    <input
                      type="text"
                      id="edit-location"
                      defaultValue={editingIncident.location}
                      className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setShowEditModal(false)}
                  className="border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    // Get form data and update incident
                    const title = (document.getElementById('edit-title') as HTMLInputElement)?.value;
                    const type = (document.getElementById('edit-type') as HTMLSelectElement)?.value;
                    const severity = (document.getElementById('edit-severity') as HTMLSelectElement)?.value;
                    const status = (document.getElementById('edit-status') as HTMLSelectElement)?.value;
                    const description = (document.getElementById('edit-description') as HTMLTextAreaElement)?.value;
                    const assignedTo = (document.getElementById('edit-assigned') as HTMLSelectElement)?.value;
                    const location = (document.getElementById('edit-location') as HTMLInputElement)?.value;
                    
                    if (title && type && severity && status && description && location) {
                      handleEditIncident(editingIncident.id, {
                        title,
                        type,
                        severity: severity as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
                        status: status as 'active' | 'investigating' | 'resolved' | 'escalated',
                        description,
                        assignedTo: assignedTo || undefined,
                        location
                      });
                    } else {
                      showError('Please fill in all required fields');
                    }
                  }}
                  className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
                >
                  Update Incident
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Incident Details Modal */}
        {showDetailsModal && selectedIncident && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-900">Incident Details</h2>
                <button 
                  onClick={() => setShowDetailsModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Incident Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <i className={cn(getTypeIcon(selectedIncident.type), "text-slate-600 text-xl")} />
                      <h3 className="text-lg font-semibold text-slate-900">{selectedIncident.title}</h3>
                      <Badge variant={getSeverityColor(selectedIncident.severity) as any}>
                        {selectedIncident.severity}
                      </Badge>
                      <Badge variant={getStatusColor(selectedIncident.status) as any}>
                        {selectedIncident.status}
                      </Badge>
                    </div>
                    <p className="text-slate-600">{selectedIncident.description}</p>
                  </div>
                </div>
                
                {/* Incident Information Grid */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700">Type</label>
                      <p className="text-slate-900">{selectedIncident.type}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Location</label>
                      <p className="text-slate-900">{selectedIncident.location}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Timestamp</label>
                      <p className="text-slate-900">{new Date(selectedIncident.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700">Assigned To</label>
                      <p className="text-slate-900">{selectedIncident.assignedTo || 'Unassigned'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Priority</label>
                      <p className="text-slate-900">{selectedIncident.priority || 'Medium'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Escalation Level</label>
                      <p className="text-slate-900">{selectedIncident.escalationLevel || 0}</p>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowDetailsModal(false);
                      setShowEditModal(true);
                    }}
                    className="border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    <i className="fas fa-edit mr-2" />
                    Edit Incident
                  </Button>
                  <Button 
                    onClick={() => handleAssignIncident(selectedIncident.id, 'Security Team')}
                    className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
                  >
                    <i className="fas fa-user-plus mr-2" />
                    Assign
                  </Button>
                  <Button 
                    onClick={() => handleEscalateIncident(selectedIncident.id)}
                    className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
                  >
                    <i className="fas fa-arrow-up mr-2" />
                    Escalate
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IncidentLogModule;
