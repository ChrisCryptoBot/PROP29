import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Badge } from '../../components/UI/Badge';
import { cn } from '../../utils/cn';
import { showLoading, dismissLoadingAndShowSuccess, dismissLoadingAndShowError, showSuccess, showError } from '../../utils/toast';
import { ModuleService } from '../../services/ModuleService';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import {
  Shield, AlertTriangle, Activity, Clock, Search, Filter, Download,
  RefreshCw, Settings, X, ChevronLeft, ChevronRight, User, Calendar
} from 'lucide-react';

// Comprehensive TypeScript Interfaces
interface CybersecurityThreat {
  id: string;
  threatType: 'phishing' | 'malware' | 'ddos' | 'unauthorized_access' | 'data_breach' | 'ransomware';
  severity: 'low' | 'medium' | 'high' | 'critical';
  sourceIp: string;
  targetSystem: string;
  description: string;
  timestamp: string;
  status: 'active' | 'investigating' | 'blocked' | 'resolved';
  aiConfidence: number;
  threatIndicators: {
    attackVector: string;
    payload: string;
    targetPort: number;
    protocol: string;
  };
  responseTime?: number;
  blocked: boolean;
  assignedTo?: string;
}

interface NetworkTraffic {
  id: string;
  sourceIp: string;
  destinationIp: string;
  protocol: string;
  port: number;
  bytesTransferred: number;
  timestamp: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  isAnomalous: boolean;
  geoLocation?: {
    country: string;
    city: string;
    coordinates: { lat: number; lng: number };
  };
}

interface SecurityIncident {
  id: string;
  incidentType: 'breach' | 'intrusion' | 'malware' | 'ddos' | 'phishing' | 'insider_threat';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedSystems: string[];
  discoveredBy: string;
  discoveredAt: string;
  status: 'open' | 'investigating' | 'contained' | 'resolved' | 'closed';
  assignedTo?: string;
  resolutionTime?: number;
  impactAssessment: {
    dataExposed: boolean;
    systemsCompromised: number;
    financialImpact: number;
    reputationRisk: 'low' | 'medium' | 'high' | 'critical';
  };
}

interface SecurityMetrics {
  totalThreats: number;
  activeThreats: number;
  blockedThreats: number;
  resolvedIncidents: number;
  averageResponseTime: number;
  systemUptime: number;
  threatDetectionRate: number;
  falsePositiveRate: number;
  networkHealth: number;
  securityScore: number;
}

interface SecurityReport {
  id: string;
  reportType: 'daily' | 'weekly' | 'monthly' | 'incident';
  generatedAt: string;
  summary: string;
  keyFindings: string[];
  recommendations: string[];
  metrics: SecurityMetrics;
  topThreats: CybersecurityThreat[];
  incidentTrends: {
    period: string;
    count: number;
    severity: string;
  }[];
}

interface SecuritySettings {
  threatDetection: {
    enabled: boolean;
    sensitivity: 'low' | 'medium' | 'high';
    autoBlock: boolean;
    notificationChannels: string[];
  };
  networkMonitoring: {
    enabled: boolean;
    deepPacketInspection: boolean;
    anomalyDetection: boolean;
    trafficAnalysis: boolean;
  };
  incidentResponse: {
    autoEscalation: boolean;
    responseTimeThreshold: number;
    notificationRecipients: string[];
    escalationMatrix: {
      severity: string;
      responseTime: number;
      escalationLevel: number;
    }[];
  };
  accessControl: {
    ipWhitelist: string[];
    ipBlacklist: string[];
    geoBlocking: boolean;
    blockedCountries: string[];
  };
}

const CybersecurityHub: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [threats, setThreats] = useState<CybersecurityThreat[]>([]);
  const [networkTraffic, setNetworkTraffic] = useState<NetworkTraffic[]>([]);
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalThreats: 0,
    activeThreats: 0,
    blockedThreats: 0,
    resolvedIncidents: 0,
    averageResponseTime: 0,
    systemUptime: 0,
    threatDetectionRate: 0,
    falsePositiveRate: 0,
    networkHealth: 0,
    securityScore: 0
  });
  const [loading, setLoading] = useState(false);
  const [selectedThreat, setSelectedThreat] = useState<CybersecurityThreat | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<SecurityIncident | null>(null);
  
  // Search, Filter, and Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<'timestamp' | 'severity'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Settings State
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settings, setSettings] = useState<SecuritySettings>({
    threatDetection: {
      enabled: true,
      sensitivity: 'high',
      autoBlock: false,
      notificationChannels: ['email', 'dashboard']
    },
    networkMonitoring: {
      enabled: true,
      deepPacketInspection: true,
      anomalyDetection: true,
      trafficAnalysis: true
    },
    incidentResponse: {
      autoEscalation: true,
      responseTimeThreshold: 15,
      notificationRecipients: ['security@hotel.com'],
      escalationMatrix: [
        { severity: 'critical', responseTime: 5, escalationLevel: 3 },
        { severity: 'high', responseTime: 15, escalationLevel: 2 },
        { severity: 'medium', responseTime: 30, escalationLevel: 1 }
      ]
    },
    accessControl: {
      ipWhitelist: ['192.168.1.0/24'],
      ipBlacklist: [],
      geoBlocking: false,
      blockedCountries: []
    }
  });
  const [settingsFormData, setSettingsFormData] = useState(settings);
  
  // Type assertion to fix TypeScript strict literal type inference
  const currentTab = activeTab as any;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'threats', label: 'Threat Detection' },
    { id: 'monitoring', label: 'Network Monitoring' },
    { id: 'incidents', label: 'Security Incidents' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'settings', label: 'Settings' }
  ];

  // Sync settings with form data
  useEffect(() => {
    setSettingsFormData(settings);
  }, [settings]);

  // Mock Data - Expanded for testing
  const mockThreats: CybersecurityThreat[] = [
    {
      id: '1',
      threatType: 'malware',
      severity: 'high',
      sourceIp: '192.168.1.100',
      targetSystem: 'Guest WiFi Network',
      description: 'Malicious payload detected in network traffic',
      timestamp: '2024-01-15T10:30:00Z',
      status: 'active',
      aiConfidence: 0.95,
      threatIndicators: {
        attackVector: 'Email Attachment',
        payload: 'Trojan.Win32.Generic',
        targetPort: 443,
        protocol: 'HTTPS'
      },
      blocked: false,
      assignedTo: 'Security Team Alpha'
    },
    {
      id: '2',
      threatType: 'phishing',
      severity: 'medium',
      sourceIp: '10.0.0.50',
      targetSystem: 'Staff Email Server',
      description: 'Phishing attempt targeting hotel staff credentials',
      timestamp: '2024-01-15T09:15:00Z',
      status: 'blocked',
      aiConfidence: 0.87,
      threatIndicators: {
        attackVector: 'Email',
        payload: 'Fake Login Page',
        targetPort: 25,
        protocol: 'SMTP'
      },
      responseTime: 45,
      blocked: true,
      assignedTo: 'Security Team Bravo'
    },
    {
      id: '3',
      threatType: 'ddos',
      severity: 'critical',
      sourceIp: '203.0.113.1',
      targetSystem: 'Booking Website',
      description: 'Distributed Denial of Service attack detected',
      timestamp: '2024-01-15T08:00:00Z',
      status: 'investigating',
      aiConfidence: 0.99,
      threatIndicators: {
        attackVector: 'Network Flood',
        payload: 'SYN Flood',
        targetPort: 80,
        protocol: 'TCP'
      },
      blocked: false,
      assignedTo: 'Security Team Alpha'
    },
    {
      id: '4',
      threatType: 'unauthorized_access',
      severity: 'high',
      sourceIp: '198.51.100.1',
      targetSystem: 'Guest Database',
      description: 'Multiple failed login attempts detected',
      timestamp: '2024-01-15T07:45:00Z',
      status: 'resolved',
      aiConfidence: 0.91,
      threatIndicators: {
        attackVector: 'Brute Force',
        payload: 'Password Guessing',
        targetPort: 3306,
        protocol: 'MySQL'
      },
      responseTime: 30,
      blocked: true
    },
    {
      id: '5',
      threatType: 'ransomware',
      severity: 'critical',
      sourceIp: '192.168.2.45',
      targetSystem: 'POS Terminals',
      description: 'Ransomware encryption activity detected',
      timestamp: '2024-01-14T22:15:00Z',
      status: 'blocked',
      aiConfidence: 0.98,
      threatIndicators: {
        attackVector: 'File Download',
        payload: 'WannaCry Variant',
        targetPort: 445,
        protocol: 'SMB'
      },
      responseTime: 10,
      blocked: true,
      assignedTo: 'IT Security Team'
    }
  ];

  const mockNetworkTraffic: NetworkTraffic[] = [
    {
      id: '1',
      sourceIp: '203.0.113.1',
      destinationIp: '192.168.1.50',
      protocol: 'TCP',
      port: 22,
      bytesTransferred: 1024000,
      timestamp: '2024-01-15T11:00:00Z',
      riskLevel: 'high',
      isAnomalous: true,
      geoLocation: {
        country: 'China',
        city: 'Beijing',
        coordinates: { lat: 39.9042, lng: 116.4074 }
      }
    },
    {
      id: '2',
      sourceIp: '198.51.100.1',
      destinationIp: '192.168.1.100',
      protocol: 'UDP',
      port: 53,
      bytesTransferred: 512,
      timestamp: '2024-01-15T10:45:00Z',
      riskLevel: 'low',
      isAnomalous: false,
      geoLocation: {
        country: 'United States',
        city: 'New York',
        coordinates: { lat: 40.7128, lng: -74.0060 }
      }
    }
  ];

  const mockIncidents: SecurityIncident[] = [
    {
      id: '1',
      incidentType: 'breach',
      severity: 'critical',
      title: 'Guest Database Compromise',
      description: 'Unauthorized access to guest personal information database',
      affectedSystems: ['Guest Database', 'Booking System', 'Payment Gateway'],
      discoveredBy: 'AI Security Monitor',
      discoveredAt: '2024-01-15T08:30:00Z',
      status: 'investigating',
      assignedTo: 'Security Team Alpha',
      impactAssessment: {
        dataExposed: true,
        systemsCompromised: 3,
        financialImpact: 50000,
        reputationRisk: 'critical'
      }
    },
    {
      id: '2',
      incidentType: 'malware',
      severity: 'high',
      title: 'Ransomware Attack on POS Systems',
      description: 'Ransomware detected on point-of-sale terminals',
      affectedSystems: ['POS Terminal 1', 'POS Terminal 3'],
      discoveredBy: 'Endpoint Protection',
      discoveredAt: '2024-01-14T16:20:00Z',
      status: 'contained',
      assignedTo: 'IT Security Team',
      resolutionTime: 120,
      impactAssessment: {
        dataExposed: false,
        systemsCompromised: 2,
        financialImpact: 15000,
        reputationRisk: 'high'
      }
    }
  ];

  const mockMetrics: SecurityMetrics = {
    totalThreats: 47,
    activeThreats: 3,
    blockedThreats: 44,
    resolvedIncidents: 12,
    averageResponseTime: 2.5,
    systemUptime: 99.8,
    threatDetectionRate: 94.2,
    falsePositiveRate: 5.8,
    networkHealth: 87.5,
    securityScore: 85.0
  };

  // Helper Functions
  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'warning';
      case 'low': return 'default';
      default: return 'secondary';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'destructive';
      case 'investigating': return 'warning';
      case 'blocked': return 'default';
      case 'resolved': return 'secondary';
      case 'open': return 'destructive';
      case 'contained': return 'warning';
      case 'closed': return 'secondary';
      case 'closed': return 'outline';
      default: return 'secondary';
    }
  };

  const getThreatTypeIcon = (threatType: string) => {
    switch (threatType) {
      case 'malware': return 'fas fa-virus';
      case 'phishing': return 'fas fa-fish';
      case 'ddos': return 'fas fa-bomb';
      case 'unauthorized_access': return 'fas fa-user-secret';
      case 'data_breach': return 'fas fa-database';
      case 'ransomware': return 'fas fa-lock';
      default: return 'fas fa-shield-alt';
    }
  };

  // Event Handlers
  const handleBlockThreat = useCallback(async (threatId: string) => {
    let toastId: string | undefined;
    try {
      toastId = showLoading('Blocking threat...');
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setThreats(prev => prev.map(threat => 
        threat.id === threatId ? { ...threat, status: 'blocked', blocked: true } : threat
      ));
      
      dismissLoadingAndShowSuccess(toastId, 'Threat blocked successfully');
    } catch (error) {
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to block threat');
      }
    }
  }, []);

  const handleResolveIncident = useCallback(async (incidentId: string) => {
    let toastId: string | undefined;
    try {
      toastId = showLoading('Resolving incident...');
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIncidents(prev => prev.map(incident => 
        incident.id === incidentId ? { ...incident, status: 'resolved' } : incident
      ));
      
      dismissLoadingAndShowSuccess(toastId, 'Incident resolved successfully');
    } catch (error) {
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to resolve incident');
      }
    }
  }, []);

  const handleViewThreat = (threat: CybersecurityThreat) => {
    setSelectedThreat(threat);
  };

  const handleViewIncident = (incident: SecurityIncident) => {
    setSelectedIncident(incident);
  };

  // Additional Handler Functions
  const handleRefreshData = useCallback(async () => {
    let toastId: string | undefined;
    try {
      toastId = showLoading('Refreshing security data...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setThreats(mockThreats);
      setNetworkTraffic(mockNetworkTraffic);
      setIncidents(mockIncidents);
      setMetrics(mockMetrics);
      
      dismissLoadingAndShowSuccess(toastId, 'Data refreshed successfully');
    } catch (error) {
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to refresh data');
      }
    }
  }, []);

  const handleExportThreats = useCallback(() => {
    try {
      const csv = [
        ['ID', 'Type', 'Severity', 'Source IP', 'Target', 'Status', 'Timestamp'],
        ...threats.map(t => [
          t.id,
          t.threatType,
          t.severity,
          t.sourceIp,
          t.targetSystem,
          t.status,
          new Date(t.timestamp).toLocaleString()
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `security-threats-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      showSuccess('Threats exported successfully');
    } catch (error) {
      showError('Failed to export threats');
    }
  }, [threats]);

  const handleExportIncidents = useCallback(() => {
    try {
      const csv = [
        ['ID', 'Type', 'Severity', 'Title', 'Status', 'Discovered', 'Assigned To'],
        ...incidents.map(i => [
          i.id,
          i.incidentType,
          i.severity,
          i.title,
          i.status,
          new Date(i.discoveredAt).toLocaleString(),
          i.assignedTo || 'Unassigned'
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `security-incidents-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      showSuccess('Incidents exported successfully');
    } catch (error) {
      showError('Failed to export incidents');
    }
  }, [incidents]);

  const handleAssignThreat = useCallback(async (threatId: string, assignee: string) => {
    let toastId: string | undefined;
    try {
      toastId = showLoading('Assigning threat...');
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setThreats(prev => prev.map(threat => 
        threat.id === threatId ? { ...threat, assignedTo: assignee } : threat
      ));
      
      dismissLoadingAndShowSuccess(toastId, `Threat assigned to ${assignee}`);
    } catch (error) {
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to assign threat');
      }
    }
  }, []);

  const handleAssignIncident = useCallback(async (incidentId: string, assignee: string) => {
    let toastId: string | undefined;
    try {
      toastId = showLoading('Assigning incident...');
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setIncidents(prev => prev.map(incident => 
        incident.id === incidentId ? { ...incident, assignedTo: assignee } : incident
      ));
      
      dismissLoadingAndShowSuccess(toastId, `Incident assigned to ${assignee}`);
    } catch (error) {
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to assign incident');
      }
    }
  }, []);

  const handleSaveSettings = useCallback(async () => {
    let toastId: string | undefined;
    try {
      toastId = showLoading('Saving settings...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSettings(settingsFormData);
      setShowSettingsModal(false);
      
      dismissLoadingAndShowSuccess(toastId, 'Settings saved successfully');
    } catch (error) {
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to save settings');
      }
    }
  }, [settingsFormData]);

  const handleResetSettings = useCallback(() => {
    setSettingsFormData(settings);
    showSuccess('Settings reset to last saved state');
  }, [settings]);

  // Load data on component mount
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setThreats(mockThreats);
      setNetworkTraffic(mockNetworkTraffic);
      setIncidents(mockIncidents);
      setMetrics(mockMetrics);
      setLoading(false);
    }, 500);
  }, []);

  // Real-time data updates (polling every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      // In production, this would fetch new data from API
      // For now, we just update the timestamp to simulate real-time updates
      setMetrics(prev => ({
        ...prev,
        systemUptime: Math.min(99.9, prev.systemUptime + Math.random() * 0.1)
      }));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Filtered and Sorted Data
  const filteredThreats = useMemo(() => {
    let filtered = threats;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(threat =>
        threat.sourceIp.toLowerCase().includes(searchQuery.toLowerCase()) ||
        threat.targetSystem.toLowerCase().includes(searchQuery.toLowerCase()) ||
        threat.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        threat.threatType.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Severity filter
    if (filterSeverity !== 'all') {
      filtered = filtered.filter(threat => threat.severity === filterSeverity);
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(threat => threat.status === filterStatus);
    }

    // Sorting
    filtered.sort((a, b) => {
      if (sortBy === 'timestamp') {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
      } else {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const severityA = severityOrder[a.severity];
        const severityB = severityOrder[b.severity];
        return sortOrder === 'asc' ? severityA - severityB : severityB - severityA;
      }
    });

    return filtered;
  }, [threats, searchQuery, filterSeverity, filterStatus, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredThreats.length / itemsPerPage);
  const paginatedThreats = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredThreats.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredThreats, currentPage, itemsPerPage]);

  // Analytics Chart Data
  const threatTrendData = [
    { date: '01/10', threats: 12, blocked: 10 },
    { date: '01/11', threats: 15, blocked: 13 },
    { date: '01/12', threats: 8, blocked: 7 },
    { date: '01/13', threats: 18, blocked: 16 },
    { date: '01/14', threats: 22, blocked: 20 },
    { date: '01/15', threats: 19, blocked: 18 },
    { date: 'Today', threats: 5, blocked: 4 }
  ];

  const threatTypeData = [
    { name: 'Malware', value: 28, color: '#ef4444' },
    { name: 'Phishing', value: 22, color: '#f59e0b' },
    { name: 'DDoS', value: 18, color: '#8b5cf6' },
    { name: 'Unauthorized Access', value: 15, color: '#3b82f6' },
    { name: 'Data Breach', value: 10, color: '#10b981' },
    { name: 'Ransomware', value: 7, color: '#ec4899' }
  ];

  const responseTimeData = [
    { severity: 'Critical', avgTime: 5, target: 5 },
    { severity: 'High', avgTime: 12, target: 15 },
    { severity: 'Medium', avgTime: 28, target: 30 },
    { severity: 'Low', avgTime: 55, target: 60 }
  ];

  // Render Tab Content Function
  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-slate-600">Loading cybersecurity data...</div>
        </div>
      );
    }

    switch (currentTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                      <i className="fas fa-shield-alt text-white text-xl" />
            </div>
                    <Badge variant="destructive" className="animate-pulse">
                      Active
                    </Badge>
              </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-slate-900">
                      {metrics.activeThreats}
                </h3>
                    <p className="text-slate-600 font-medium">Active Threats</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                      <i className="fas fa-ban text-white text-xl" />
                    </div>
                    <Badge variant="default" className="animate-pulse">
                      Blocked
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-slate-900">
                      {metrics.blockedThreats}
                    </h3>
                    <p className="text-slate-600 font-medium">Blocked Threats</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                      <i className="fas fa-chart-line text-white text-xl" />
                    </div>
                    <Badge variant="default" className="animate-pulse">
                      Score
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-slate-900">
                      {metrics.securityScore}%
                    </h3>
                    <p className="text-slate-600 font-medium">Security Score</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                      <i className="fas fa-clock text-white text-xl" />
                    </div>
                    <Badge variant="default" className="animate-pulse">
                      Response
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-slate-900">
                      {metrics.averageResponseTime}m
                    </h3>
                    <p className="text-slate-600 font-medium">Avg Response Time</p>
                </div>
                </CardContent>
              </Card>
              </div>

              {/* Recent Threats */}
            <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <i className="fas fa-exclamation-triangle mr-3 text-slate-600" />
                  Recent Security Threats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {threats.slice(0, 3).map((threat) => (
                    <div 
                      key={threat.id} 
                      className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleViewThreat(threat)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                          <i className={`${getThreatTypeIcon(threat.threatType)} text-white text-xl`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">{threat.threatType.toUpperCase()}</h3>
                          <p className="text-sm text-slate-600">{threat.sourceIp} → {threat.targetSystem}</p>
                          <p className="text-xs text-slate-500">{new Date(threat.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getSeverityBadgeVariant(threat.severity)}>
                          {threat.severity}
                        </Badge>
                        <Badge variant={getStatusBadgeVariant(threat.status)}>
                          {threat.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <i className="fas fa-bolt mr-3 text-slate-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button 
                    className="bg-[#2563eb] hover:bg-blue-700 text-white"
                    onClick={() => setActiveTab('threats')}
                  >
                    <i className="fas fa-shield-alt mr-2" />
                    View Threats
                  </Button>
                  <Button 
                    className="bg-[#2563eb] hover:bg-blue-700 text-white"
                    onClick={() => setActiveTab('monitoring')}
                  >
                    <i className="fas fa-network-wired mr-2" />
                    Monitor Network
                  </Button>
                  <Button 
                    className="bg-[#2563eb] hover:bg-blue-700 text-white"
                    onClick={() => setActiveTab('incidents')}
                  >
                    <i className="fas fa-exclamation-circle mr-2" />
                    View Incidents
                  </Button>
                  <Button 
                    className="bg-[#2563eb] hover:bg-blue-700 text-white"
                    onClick={() => setActiveTab('analytics')}
                  >
                    <i className="fas fa-chart-bar mr-2" />
                    View Reports
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'threats':
        return (
          <div className="space-y-6">
            {/* Search, Filter, and Actions Bar */}
            <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1 flex items-center space-x-4">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search threats..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Severity Filter */}
                    <select
                      value={filterSeverity}
                      onChange={(e) => setFilterSeverity(e.target.value)}
                      className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Severities</option>
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>

                    {/* Status Filter */}
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="investigating">Investigating</option>
                      <option value="blocked">Blocked</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      onClick={handleRefreshData}
                      className="text-slate-600 border-slate-300 hover:bg-slate-50"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                    <Button
                      onClick={handleExportThreats}
                      className="bg-[#2563eb] hover:bg-blue-700 text-white"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Threats List */}
            <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-xl">
                  <div className="flex items-center">
                    <i className="fas fa-shield-alt mr-3 text-slate-600" />
                    Active Security Threats
                  </div>
                  <Badge variant="default" className="text-lg">
                    {filteredThreats.length} Total
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {paginatedThreats.length > 0 ? (
                    paginatedThreats.map((threat) => (
                      <div 
                        key={threat.id} 
                        className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleViewThreat(threat)}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                            <i className={`${getThreatTypeIcon(threat.threatType)} text-white text-xl`} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">{threat.threatType.toUpperCase()}</h3>
                            <p className="text-sm text-slate-600">{threat.sourceIp} → {threat.targetSystem}</p>
                            <p className="text-xs text-slate-500">
                              AI Confidence: {(threat.aiConfidence * 100).toFixed(1)}% | 
                              {threat.assignedTo && ` Assigned to: ${threat.assignedTo}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={getSeverityBadgeVariant(threat.severity)}>
                            {threat.severity}
                          </Badge>
                          <Badge variant={getStatusBadgeVariant(threat.status)}>
                            {threat.status}
                          </Badge>
                          {threat.status === 'active' && (
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBlockThreat(threat.id);
                              }}
                              className="bg-[#2563eb] hover:bg-blue-700 text-white"
                            >
                              Block
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-slate-600">
                      No threats found matching your filters.
                    </div>
                  )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-200">
                    <div className="text-sm text-slate-600">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredThreats.length)} of {filteredThreats.length}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => prev - 1)}
                        className="text-slate-600 border-slate-300 hover:bg-slate-50"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={page === currentPage ? "default" : "outline"}
                          onClick={() => setCurrentPage(page)}
                          className={page === currentPage ? "bg-[#2563eb] hover:bg-blue-700 text-white" : "text-slate-600 border-slate-300 hover:bg-slate-50"}
                        >
                          {page}
                        </Button>
                      ))}
                      <Button
                        variant="outline"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        className="text-slate-600 border-slate-300 hover:bg-slate-50"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case 'monitoring':
        return (
          <div className="space-y-6">
            <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <i className="fas fa-network-wired mr-3 text-slate-600" />
                  Network Traffic Monitoring
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {networkTraffic.map((traffic) => (
                    <div key={traffic.id} className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-slate-900">
                          {traffic.sourceIp} → {traffic.destinationIp}
                        </h3>
                        <Badge variant={getSeverityBadgeVariant(traffic.riskLevel)}>
                          {traffic.riskLevel}
                        </Badge>
              </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-slate-600">Protocol:</span>
                          <p className="font-medium">{traffic.protocol}:{traffic.port}</p>
              </div>
                        <div>
                          <span className="text-slate-600">Data:</span>
                          <p className="font-medium">{(traffic.bytesTransferred / 1024).toFixed(1)} KB</p>
              </div>
                        <div>
                          <span className="text-slate-600">Location:</span>
                          <p className="font-medium">
                            {traffic.geoLocation ? `${traffic.geoLocation.city}, ${traffic.geoLocation.country}` : 'Unknown'}
                          </p>
              </div>
            </div>
                      {traffic.isAnomalous && (
                        <div className="mt-3 p-3 bg-red-50 rounded-lg">
                          <div className="flex items-center">
                            <i className="fas fa-exclamation-triangle text-red-500 mr-2" />
                            <span className="text-red-700 text-sm font-medium">Anomalous traffic pattern detected</span>
                </div>
                </div>
                      )}
                </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'incidents':
        return (
          <div className="space-y-6">
            {/* Actions Bar */}
            <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-600">
                    Total Incidents: <span className="font-semibold text-slate-900">{incidents.length}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      onClick={handleRefreshData}
                      className="text-slate-600 border-slate-300 hover:bg-slate-50"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                    <Button
                      onClick={handleExportIncidents}
                      className="bg-[#2563eb] hover:bg-blue-700 text-white"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <i className="fas fa-exclamation-circle mr-3 text-slate-600" />
                  Security Incidents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {incidents.map((incident) => (
                    <div 
                      key={incident.id} 
                      className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleViewIncident(incident)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                          <i className="fas fa-exclamation-triangle text-white text-xl" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">{incident.title}</h3>
                          <p className="text-sm text-slate-600">{incident.description}</p>
                          <p className="text-xs text-slate-500">
                            Discovered by: {incident.discoveredBy} | 
                            {incident.assignedTo && ` Assigned to: ${incident.assignedTo}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getSeverityBadgeVariant(incident.severity)}>
                          {incident.severity}
                        </Badge>
                        <Badge variant={getStatusBadgeVariant(incident.status)}>
                          {incident.status}
                        </Badge>
                        {incident.status === 'open' && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResolveIncident(incident.id);
                            }}
                            className="bg-[#2563eb] hover:bg-blue-700 text-white"
                          >
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-6">
            {/* Threat Trends Over Time */}
            <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <Activity className="mr-3 w-6 h-6 text-slate-600" />
                  Threat Trends (Last 7 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={threatTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="threats" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} name="Total Threats" />
                    <Area type="monotone" dataKey="blocked" stroke="#10b981" fill="#10b981" fillOpacity={0.3} name="Blocked" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Threat Type Distribution and Response Time */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl">
                    <i className="fas fa-chart-pie mr-3 text-slate-600" />
                    Threat Type Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={threatTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {threatTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl">
                    <Clock className="mr-3 w-6 h-6 text-slate-600" />
                    Response Time by Severity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={responseTimeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="severity" stroke="#64748b" />
                      <YAxis stroke="#64748b" label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="avgTime" fill="#2563eb" name="Actual Response Time" />
                      <Bar dataKey="target" fill="#94a3b8" name="Target Response Time" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Key Metrics */}
            <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <i className="fas fa-tachometer-alt mr-3 text-slate-600" />
                  Key Performance Indicators
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <i className="fas fa-shield-alt text-white text-2xl" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Threat Detection Rate</h3>
                    <p className="text-2xl font-bold text-[#2563eb]">{metrics.threatDetectionRate}%</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <i className="fas fa-network-wired text-white text-2xl" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Network Health</h3>
                    <p className="text-2xl font-bold text-[#2563eb]">{metrics.networkHealth}%</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <i className="fas fa-clock text-white text-2xl" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">System Uptime</h3>
                    <p className="text-2xl font-bold text-[#2563eb]">{metrics.systemUptime.toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'settings':
        return (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg mx-auto mb-4">
              <Settings className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Cybersecurity Settings</h3>
            <p className="text-slate-600 mb-6">Configure security monitoring and threat detection settings.</p>
            <Button
              onClick={() => setShowSettingsModal(true)}
              className="bg-[#2563eb] hover:bg-blue-700 text-white"
            >
              <Settings className="w-4 h-4 mr-2" />
              Open Settings
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* HEADER - GOLD STANDARD LAYOUT */}
      <div className="w-full backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg relative">
        
        {/* Title Section - CENTER */}
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
                <i className="fas fa-shield-virus text-white text-2xl" />
      </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                <i className="fas fa-exclamation-triangle text-white text-xs" />
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-slate-900">
                Cybersecurity Hub
              </h1>
              <p className="text-slate-600 font-medium">
                Advanced threat detection and network security monitoring
              </p>
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {renderTabContent()}
      </div>

      {/* Threat Details Modal */}
      {selectedThreat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-slate-900">Threat Details</h2>
              <Button
                variant="outline"
                onClick={() => setSelectedThreat(null)}
                className="text-slate-600 border-slate-300 hover:bg-slate-50"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-6 space-y-6">
              {/* Threat Overview */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Threat Overview</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-slate-600">Threat Type:</span>
                    <p className="font-semibold text-slate-900">{selectedThreat.threatType.toUpperCase()}</p>
                  </div>
                  <div>
                    <span className="text-sm text-slate-600">Severity:</span>
                    <Badge variant={getSeverityBadgeVariant(selectedThreat.severity)}>
                      {selectedThreat.severity}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-sm text-slate-600">Status:</span>
                    <Badge variant={getStatusBadgeVariant(selectedThreat.status)}>
                      {selectedThreat.status}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-sm text-slate-600">AI Confidence:</span>
                    <p className="font-semibold text-slate-900">{(selectedThreat.aiConfidence * 100).toFixed(1)}%</p>
                  </div>
                </div>
              </div>

              {/* Network Information */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Network Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-slate-600">Source IP:</span>
                    <p className="font-semibold text-slate-900">{selectedThreat.sourceIp}</p>
                  </div>
                  <div>
                    <span className="text-sm text-slate-600">Target System:</span>
                    <p className="font-semibold text-slate-900">{selectedThreat.targetSystem}</p>
                  </div>
                  <div>
                    <span className="text-sm text-slate-600">Protocol:</span>
                    <p className="font-semibold text-slate-900">{selectedThreat.threatIndicators.protocol}</p>
                  </div>
                  <div>
                    <span className="text-sm text-slate-600">Target Port:</span>
                    <p className="font-semibold text-slate-900">{selectedThreat.threatIndicators.targetPort}</p>
                  </div>
                </div>
              </div>

              {/* Threat Indicators */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Threat Indicators</h3>
                <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                  <div>
                    <span className="text-sm text-slate-600">Attack Vector:</span>
                    <p className="font-semibold text-slate-900">{selectedThreat.threatIndicators.attackVector}</p>
                  </div>
                  <div>
                    <span className="text-sm text-slate-600">Payload:</span>
                    <p className="font-semibold text-slate-900">{selectedThreat.threatIndicators.payload}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Description</h3>
                <p className="text-slate-700">{selectedThreat.description}</p>
              </div>

              {/* Assignment */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Assignment</h3>
                {selectedThreat.assignedTo ? (
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-blue-600" />
                      <span className="text-blue-900 font-medium">{selectedThreat.assignedTo}</span>
                    </div>
                    <Badge variant="default">Assigned</Badge>
                  </div>
                ) : (
                  <p className="text-slate-600">Not assigned</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-200">
                {selectedThreat.status === 'active' && (
                  <Button
                    onClick={() => {
                      handleBlockThreat(selectedThreat.id);
                      setSelectedThreat(null);
                    }}
                    className="bg-[#2563eb] hover:bg-blue-700 text-white"
                  >
                    Block Threat
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setSelectedThreat(null)}
                  className="text-slate-600 border-slate-300 hover:bg-slate-50"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Incident Details Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-slate-900">Incident Details</h2>
              <Button
                variant="outline"
                onClick={() => setSelectedIncident(null)}
                className="text-slate-600 border-slate-300 hover:bg-slate-50"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-6 space-y-6">
              {/* Incident Overview */}
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{selectedIncident.title}</h3>
                <p className="text-slate-700 mb-4">{selectedIncident.description}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-slate-600">Type:</span>
                    <p className="font-semibold text-slate-900">{selectedIncident.incidentType.toUpperCase()}</p>
                  </div>
                  <div>
                    <span className="text-sm text-slate-600">Severity:</span>
                    <Badge variant={getSeverityBadgeVariant(selectedIncident.severity)}>
                      {selectedIncident.severity}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-sm text-slate-600">Status:</span>
                    <Badge variant={getStatusBadgeVariant(selectedIncident.status)}>
                      {selectedIncident.status}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-sm text-slate-600">Discovered:</span>
                    <p className="font-semibold text-slate-900">{new Date(selectedIncident.discoveredAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Affected Systems */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Affected Systems</h3>
                <div className="space-y-2">
                  {selectedIncident.affectedSystems.map((system, index) => (
                    <div key={index} className="flex items-center space-x-2 p-3 bg-red-50 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span className="text-red-900 font-medium">{system}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Impact Assessment */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Impact Assessment</h3>
                <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Data Exposed:</span>
                    <Badge variant={selectedIncident.impactAssessment.dataExposed ? "destructive" : "default"}>
                      {selectedIncident.impactAssessment.dataExposed ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Systems Compromised:</span>
                    <span className="font-semibold text-slate-900">{selectedIncident.impactAssessment.systemsCompromised}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Financial Impact:</span>
                    <span className="font-semibold text-slate-900">${selectedIncident.impactAssessment.financialImpact.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Reputation Risk:</span>
                    <Badge variant={getSeverityBadgeVariant(selectedIncident.impactAssessment.reputationRisk)}>
                      {selectedIncident.impactAssessment.reputationRisk}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Discovery & Assignment */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Discovery & Assignment</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-slate-600">Discovered By:</span>
                    <p className="font-semibold text-slate-900">{selectedIncident.discoveredBy}</p>
                  </div>
                  <div>
                    <span className="text-sm text-slate-600">Assigned To:</span>
                    <p className="font-semibold text-slate-900">{selectedIncident.assignedTo || 'Unassigned'}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-200">
                {selectedIncident.status === 'open' && (
                  <Button
                    onClick={() => {
                      handleResolveIncident(selectedIncident.id);
                      setSelectedIncident(null);
                    }}
                    className="bg-[#2563eb] hover:bg-blue-700 text-white"
                  >
                    Resolve Incident
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setSelectedIncident(null)}
                  className="text-slate-600 border-slate-300 hover:bg-slate-50"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-slate-900">Cybersecurity Settings</h2>
              <Button
                variant="outline"
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-600 border-slate-300 hover:bg-slate-50"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-6 space-y-6">
              {/* Threat Detection Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Threat Detection</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">Enable Threat Detection</span>
                    <input
                      type="checkbox"
                      checked={settingsFormData.threatDetection.enabled}
                      onChange={(e) => setSettingsFormData({
                        ...settingsFormData,
                        threatDetection: { ...settingsFormData.threatDetection, enabled: e.target.checked }
                      })}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Sensitivity Level</label>
                    <select
                      value={settingsFormData.threatDetection.sensitivity}
                      onChange={(e) => setSettingsFormData({
                        ...settingsFormData,
                        threatDetection: { ...settingsFormData.threatDetection, sensitivity: e.target.value as any }
                      })}
                      className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">Auto-Block Threats</span>
                    <input
                      type="checkbox"
                      checked={settingsFormData.threatDetection.autoBlock}
                      onChange={(e) => setSettingsFormData({
                        ...settingsFormData,
                        threatDetection: { ...settingsFormData.threatDetection, autoBlock: e.target.checked }
                      })}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Network Monitoring Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Network Monitoring</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">Enable Network Monitoring</span>
                    <input
                      type="checkbox"
                      checked={settingsFormData.networkMonitoring.enabled}
                      onChange={(e) => setSettingsFormData({
                        ...settingsFormData,
                        networkMonitoring: { ...settingsFormData.networkMonitoring, enabled: e.target.checked }
                      })}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">Deep Packet Inspection</span>
                    <input
                      type="checkbox"
                      checked={settingsFormData.networkMonitoring.deepPacketInspection}
                      onChange={(e) => setSettingsFormData({
                        ...settingsFormData,
                        networkMonitoring: { ...settingsFormData.networkMonitoring, deepPacketInspection: e.target.checked }
                      })}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">Anomaly Detection</span>
                    <input
                      type="checkbox"
                      checked={settingsFormData.networkMonitoring.anomalyDetection}
                      onChange={(e) => setSettingsFormData({
                        ...settingsFormData,
                        networkMonitoring: { ...settingsFormData.networkMonitoring, anomalyDetection: e.target.checked }
                      })}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">Traffic Analysis</span>
                    <input
                      type="checkbox"
                      checked={settingsFormData.networkMonitoring.trafficAnalysis}
                      onChange={(e) => setSettingsFormData({
                        ...settingsFormData,
                        networkMonitoring: { ...settingsFormData.networkMonitoring, trafficAnalysis: e.target.checked }
                      })}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Incident Response Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Incident Response</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">Auto-Escalation</span>
                    <input
                      type="checkbox"
                      checked={settingsFormData.incidentResponse.autoEscalation}
                      onChange={(e) => setSettingsFormData({
                        ...settingsFormData,
                        incidentResponse: { ...settingsFormData.incidentResponse, autoEscalation: e.target.checked }
                      })}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Response Time Threshold (minutes)</label>
                    <input
                      type="number"
                      value={settingsFormData.incidentResponse.responseTimeThreshold}
                      onChange={(e) => setSettingsFormData({
                        ...settingsFormData,
                        incidentResponse: { ...settingsFormData.incidentResponse, responseTimeThreshold: parseInt(e.target.value) }
                      })}
                      className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Access Control Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Access Control</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">Geo-Blocking</span>
                    <input
                      type="checkbox"
                      checked={settingsFormData.accessControl.geoBlocking}
                      onChange={(e) => setSettingsFormData({
                        ...settingsFormData,
                        accessControl: { ...settingsFormData.accessControl, geoBlocking: e.target.checked }
                      })}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">IP Whitelist (comma-separated)</label>
                    <textarea
                      value={settingsFormData.accessControl.ipWhitelist.join(', ')}
                      onChange={(e) => setSettingsFormData({
                        ...settingsFormData,
                        accessControl: { ...settingsFormData.accessControl, ipWhitelist: e.target.value.split(',').map(ip => ip.trim()) }
                      })}
                      className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-200">
                <Button
                  variant="outline"
                  onClick={handleResetSettings}
                  className="text-slate-600 border-slate-300 hover:bg-slate-50"
                >
                  Reset
                </Button>
                <Button
                  onClick={handleSaveSettings}
                  className="bg-[#2563eb] hover:bg-blue-700 text-white"
                >
                  Save Settings
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CybersecurityHub;