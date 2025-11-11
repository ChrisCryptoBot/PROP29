import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Badge } from '../../components/UI/Badge';
import { Avatar } from '../../components/UI/Avatar';
import { cn } from '../../utils/cn';
import { showError, showSuccess, showLoading, dismissLoadingAndShowSuccess, dismissLoadingAndShowError } from '../../utils/toast';

interface Visitor {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone: string;
  company?: string;
  purpose: string;
  host_name: string;
  host_phone?: string;
  host_email?: string;
  host_room?: string;
  check_in_time: string;
  check_out_time?: string;
  expected_duration: number;
  status: 'registered' | 'checked_in' | 'checked_out' | 'overdue' | 'cancelled';
  location: string;
  badge_id?: string;
  qr_code?: string;
  photo_url?: string;
  vehicle_number?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  security_clearance: 'approved' | 'pending' | 'denied';
  risk_level: 'low' | 'medium' | 'high';
  visit_type: 'day_visitor' | 'guest_visitor' | 'service_personnel' | 'emergency_contact';
  wifi_registered: boolean;
  service_requests: ServiceRequest[];
  emergency_contacts: EmergencyContact[];
}

interface ServiceRequest {
  id: string;
  type: 'room_service' | 'housekeeping' | 'concierge' | 'transportation' | 'maintenance' | 'other';
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

const mockVisitors: Visitor[] = [
  {
    id: '1',
    first_name: 'John',
    last_name: 'Smith',
    email: 'john.smith@email.com',
    phone: '+1-555-0123',
    company: 'Tech Corp',
    purpose: 'Business Meeting',
    host_name: 'Sarah Johnson',
    host_phone: '+1-555-0456',
    host_email: 'sarah.j@email.com',
    host_room: '302',
    check_in_time: '2025-01-27 14:30',
    expected_duration: 120,
    status: 'checked_in',
    location: 'Conference Room A',
    badge_id: 'V001',
    qr_code: 'VISITOR_001_QR',
    created_at: '2025-01-27 14:30',
    updated_at: '2025-01-27 14:30',
    security_clearance: 'approved',
    risk_level: 'low',
    visit_type: 'day_visitor',
    wifi_registered: true,
    service_requests: [
      {
        id: 'sr1',
        type: 'concierge',
        description: 'Restaurant recommendations',
        status: 'completed',
        created_at: '2025-01-27 14:45',
        priority: 'normal'
      }
    ],
    emergency_contacts: [
      {
        name: 'Jane Smith',
        relationship: 'Spouse',
        phone: '+1-555-0124',
        email: 'jane.smith@email.com'
      }
    ]
  },
  {
    id: '2',
    first_name: 'Maria',
    last_name: 'Garcia',
    email: 'maria.garcia@email.com',
    phone: '+1-555-0789',
    company: 'Maintenance Plus',
    purpose: 'Equipment Repair',
    host_name: 'Mike Davis',
    host_phone: '+1-555-0321',
    host_room: '415',
    check_in_time: '2025-01-27 10:15',
    check_out_time: '2025-01-27 12:30',
    expected_duration: 180,
    status: 'checked_out',
    location: 'Guest Room 415',
    badge_id: 'V002',
    qr_code: 'VISITOR_002_QR',
    created_at: '2025-01-27 10:15',
    updated_at: '2025-01-27 12:30',
    security_clearance: 'approved',
    risk_level: 'low',
    visit_type: 'service_personnel',
    wifi_registered: false,
    service_requests: [
      {
        id: 'sr2',
        type: 'maintenance',
        description: 'AC unit repair in room 415',
        status: 'completed',
        created_at: '2025-01-27 10:20',
        priority: 'high'
      }
    ],
    emergency_contacts: []
  },
  {
    id: '3',
    first_name: 'David',
    last_name: 'Wilson',
    email: 'david.wilson@email.com',
    phone: '+1-555-0654',
    purpose: 'Family Visit',
    host_name: 'Lisa Brown',
    host_phone: '+1-555-0987',
    host_email: 'lisa.b@email.com',
    host_room: '208',
    check_in_time: '2025-01-27 16:00',
    expected_duration: 240,
    status: 'checked_in',
    location: 'Guest Room 208',
    badge_id: 'V003',
    qr_code: 'VISITOR_003_QR',
    created_at: '2025-01-27 16:00',
    updated_at: '2025-01-27 16:00',
    security_clearance: 'approved',
    risk_level: 'low',
    visit_type: 'guest_visitor',
    wifi_registered: true,
    service_requests: [
      {
        id: 'sr3',
        type: 'room_service',
        description: 'Extra towels and pillows',
        status: 'pending',
        created_at: '2025-01-27 16:15',
        priority: 'normal'
      }
    ],
    emergency_contacts: [
      {
        name: 'Lisa Brown',
        relationship: 'Host',
        phone: '+1-555-0987',
        email: 'lisa.b@email.com'
      }
    ]
  },
  {
    id: '4',
    first_name: 'Emily',
    last_name: 'Chen',
    email: 'emily.chen@email.com',
    phone: '+1-555-0321',
    company: 'Security Solutions Inc',
    purpose: 'Security Consultation',
    host_name: 'Tom Anderson',
    host_phone: '+1-555-0765',
    host_room: '501',
    check_in_time: '2025-01-27 09:00',
    expected_duration: 300,
    status: 'overdue',
    location: 'Executive Suite 501',
    badge_id: 'V004',
    qr_code: 'VISITOR_004_QR',
    created_at: '2025-01-27 09:00',
    updated_at: '2025-01-27 09:00',
    security_clearance: 'approved',
    risk_level: 'medium',
    visit_type: 'day_visitor',
    wifi_registered: true,
    service_requests: [],
    emergency_contacts: [
      {
        name: 'Tom Anderson',
        relationship: 'Host',
        phone: '+1-555-0765'
      }
    ]
  },
  {
    id: '5',
    first_name: 'Robert',
    last_name: 'Taylor',
    email: 'robert.taylor@email.com',
    phone: '+1-555-0543',
    purpose: 'Emergency Contact',
    host_name: 'Jennifer Lee',
    host_phone: '+1-555-0123',
    host_email: 'jennifer.l@email.com',
    host_room: '127',
    check_in_time: '2025-01-27 20:30',
    expected_duration: 60,
    status: 'registered',
    location: 'Emergency Contact',
    badge_id: 'V005',
    qr_code: 'VISITOR_005_QR',
    created_at: '2025-01-27 20:30',
    updated_at: '2025-01-27 20:30',
    security_clearance: 'approved',
    risk_level: 'low',
    visit_type: 'emergency_contact',
    wifi_registered: false,
    service_requests: [],
    emergency_contacts: []
  }
];

const tabs = [
  { id: 'dashboard', label: 'Dashboard', path: '/modules/visitors' },
  { id: 'operations', label: 'Visitor Operations', path: '/modules/visitor-operations' },
  { id: 'digital-services', label: 'Digital Services', path: '/modules/digital-services' },
  { id: 'settings', label: 'Settings', path: '/modules/visitor-settings' }
];

const Visitors: React.FC = () => {
  const [visitors, setVisitors] = useState<Visitor[]>(mockVisitors);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [filter, setFilter] = useState<'all' | 'registered' | 'checked_in' | 'checked_out' | 'overdue' | 'cancelled'>('all');
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showWifiModal, setShowWifiModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Type assertion to fix TypeScript strict literal type inference
  const currentTab = activeTab as any;
  
  // Form state for registering new visitors
  const [settings, setSettings] = useState({
    defaultCheckInDuration: '120',
    defaultSecurityClearance: 'V',
    overdueReminderTime: '60',
    dataRetentionDays: '90',
    defaultRiskLevel: 'medium',
    badgeRequirement: 'service',
    idVerification: 'service',
    wifiNetworkName: 'Guest_WiFi',
    wifiSessionDuration: '8',
    portalUrl: 'https://portal.yourhotel.com',
    mobileAppApiKey: 'app_key_123456789',
    checkInMessage: 'Welcome {visitor_name}! You have checked in at {facility_name}. Your badge ID is {badge_id}. For assistance, contact reception.',
    hostNotificationMessage: '{host_name}, your visitor {visitor_name} has arrived and checked in. Location: {location}. Badge: {badge_id}.',
    overdueMessage: '{visitor_name}, your visit duration has exceeded the expected time. Please check out at reception.'
  });

  const [registerForm, setRegisterForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    purpose: '',
    host_name: '',
    host_phone: '',
    host_email: '',
    host_room: '',
    expected_duration: 60,
    location: '',
    visit_type: 'day_visitor' as Visitor['visit_type'],
    notes: '',
    vehicle_number: ''
  });


  const filteredVisitors = useMemo(() => {
    return visitors.filter(visitor => {
    if (filter === 'all') return true;
    return visitor.status === filter;
  });
  }, [visitors, filter]);

  const handleSettingsChange = useCallback((key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSaveSettings = useCallback(async () => {
    let toastId: string | undefined;
    try {
      toastId = showLoading('Saving settings...');
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'All settings saved successfully');
      }
    } catch (error) {
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to save settings');
      }
    }
  }, []);

  const handleCheckIn = useCallback(async (visitorId: string) => {
    let toastId: string | undefined;
    try {
      toastId = showLoading('Checking in visitor...');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setVisitors(prev => prev.map(visitor =>
        visitor.id === visitorId
          ? { ...visitor, status: 'checked_in' as const }
          : visitor
      ));
      
      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Visitor checked in successfully');
      }
    } catch (error) {
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to check in visitor');
      }
    }
  }, []);

  const handleCheckOut = useCallback(async (visitorId: string) => {
    let toastId: string | undefined;
    try {
      toastId = showLoading('Checking out visitor...');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setVisitors(prev => prev.map(visitor =>
        visitor.id === visitorId
          ? { 
              ...visitor, 
              status: 'checked_out' as const,
              check_out_time: new Date().toISOString()
            }
          : visitor
      ));
      
      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Visitor checked out successfully');
      }
      } catch (error) {
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to check out visitor');
      }
    }
  }, []);

  const handleRegisterVisitor = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    let toastId: string | undefined;
    
    try {
      toastId = showLoading('Registering visitor...');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newVisitor: Visitor = {
        id: (visitors.length + 1).toString(),
        first_name: registerForm.first_name,
        last_name: registerForm.last_name,
        email: registerForm.email || undefined,
        phone: registerForm.phone,
        company: registerForm.company || undefined,
        purpose: registerForm.purpose,
        host_name: registerForm.host_name,
        host_phone: registerForm.host_phone || undefined,
        host_email: registerForm.host_email || undefined,
        host_room: registerForm.host_room || undefined,
        check_in_time: new Date().toISOString(),
        expected_duration: registerForm.expected_duration,
        status: 'registered',
        location: registerForm.location,
        badge_id: `V${visitors.length + 1}`.padStart(3, '0'),
        qr_code: `VISITOR_${visitors.length + 1}_QR`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        security_clearance: 'pending',
        risk_level: 'low',
        visit_type: registerForm.visit_type,
        wifi_registered: false,
        service_requests: [],
        emergency_contacts: [],
        vehicle_number: registerForm.vehicle_number || undefined,
        notes: registerForm.notes || undefined
      };

      setVisitors(prev => [newVisitor, ...prev]);
      setRegisterForm({
        first_name: '', last_name: '', email: '', phone: '', company: '',
        purpose: '', host_name: '', host_phone: '', host_email: '', host_room: '',
        expected_duration: 60, location: '', visit_type: 'day_visitor', notes: '', vehicle_number: ''
      });
      setShowRegisterModal(false);
      
      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Visitor registered successfully');
      }
    } catch (error) {
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to register visitor');
      }
    }
  }, [visitors.length, registerForm]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'registered': return 'default';
      case 'checked_in': return 'success';
      case 'checked_out': return 'secondary';
      case 'overdue': return 'destructive';
      case 'cancelled': return 'secondary';
      default: return 'secondary';
    }
  };

  const getVisitTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'day_visitor': return 'fas fa-user';
      case 'guest_visitor': return 'fas fa-users';
      case 'service_personnel': return 'fas fa-tools';
      case 'emergency_contact': return 'fas fa-phone';
      default: return 'fas fa-user';
    }
  };

  const getVisitTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'day_visitor': return '#3b82f6';
      case 'guest_visitor': return '#10b981';
      case 'service_personnel': return '#f59e0b';
      case 'emergency_contact': return '#ef4444';
      default: return '#3b82f6';
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'destructive';
      default: return 'success';
    }
  };

  // Memoized filtered visitor lists for performance
  const checkedInVisitors = useMemo(() => visitors.filter(v => v.status === 'checked_in'), [visitors]);
  const pendingSecurityVisitors = useMemo(() => visitors.filter(v => v.security_clearance === 'pending'), [visitors]);
  const overdueVisitors = useMemo(() => visitors.filter(v => v.status === 'overdue'), [visitors]);

  const metrics = useMemo(() => ({
    total: visitors.length,
    registered: visitors.filter(v => v.status === 'registered').length,
    checkedIn: checkedInVisitors.length,
    checkedOut: visitors.filter(v => v.status === 'checked_out').length,
    overdue: overdueVisitors.length,
    avgDuration: '2.1h',
    securityApproved: visitors.filter(v => v.security_clearance === 'approved').length
  }), [visitors, checkedInVisitors, overdueVisitors]);

    return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* HEADER - GOLD STANDARD LAYOUT */}
      <div className="w-full backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg relative">

        {/* Title Section - CENTER */}
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
                <i className="fas fa-users text-white text-2xl" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-slate-500 rounded-full flex items-center justify-center animate-pulse">
                <i className="fas fa-wifi text-white text-xs" />
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-slate-900">
                Visitor Management
              </h1>
              <p className="text-slate-600 font-medium">
                Comprehensive visitor registration, tracking, and security management
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

      {/* Main Content - GOLD STANDARD LAYOUT */}
      <div className="relative max-w-7xl mx-auto px-6 py-6">
        {/* Key Metrics - GOLD STANDARD 4-CARD LAYOUT */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Visitors */}
          <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                  <i className="fas fa-users text-white text-xl" />
                </div>
              </div>
        <div className="space-y-1">
                <h3 className="text-2xl font-bold text-slate-900">
                  {metrics.total}
                </h3>
                <p className="text-slate-600 text-sm">
                  Total Visitors
                </p>
          </div>
            </CardContent>
          </Card>

          {/* Currently Checked In */}
          <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                  <i className="fas fa-sign-in-alt text-white text-xl" />
            </div>
        </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-slate-900">
                  {metrics.checkedIn}
                </h3>
                <p className="text-slate-600 text-sm">
                  Currently On Site
                </p>
        </div>
            </CardContent>
          </Card>


          {/* Overdue Visits */}
          <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                  <i className="fas fa-clock text-white text-xl" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-slate-900">
                  {metrics.overdue}
                </h3>
                <p className="text-slate-600 text-sm">
                  Overdue Visits
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Security Approved */}
          <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                  <i className="fas fa-shield-alt text-white text-xl" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-slate-900">
                  {metrics.securityApproved}
                </h3>
                <p className="text-slate-600 text-sm">
                  Security Approved
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Overview Tab Content */}
        {currentTab === 'dashboard' && (
          <>
            {/* Visitor Management */}
            <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl mb-8">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center text-xl">
                  <i className="fas fa-user-friends mr-3 text-slate-600" />
                  Visitor Management
                </CardTitle>
                <div className="flex space-x-2">
                  {['all', 'registered', 'checked_in', 'checked_out', 'overdue', 'cancelled'].map(filterType => (
                    <Button
                      key={filterType}
                      variant={filter === filterType ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilter(filterType as any)}
                      className={cn(
                        "capitalize",
                        filter === filterType
                          ? "!bg-[#2563eb] hover:!bg-blue-700 text-white"
                          : "text-slate-600 border-slate-300 hover:bg-slate-50"
                      )}
                    >
                      {filterType.replace('_', ' ')}
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredVisitors.map(visitor => (
                    <Card 
                      key={visitor.id}
                      className={cn(
                        "backdrop-blur-sm bg-white/60 border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1",
                        visitor.status === 'checked_in' && "border-slate-200/50 bg-slate-50/60",
                        visitor.status === 'overdue' && "border-red-200/50 bg-red-50/60",
                        visitor.status === 'registered' && "border-slate-200/50 bg-slate-50/60"
                      )}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center shadow-lg">
                              <i className={cn("text-xl", getVisitTypeIcon(visitor.visit_type))} style={{ color: getVisitTypeColor(visitor.visit_type) }} />
        </div>
                            <div>
                              <h4 className="font-bold text-slate-900">{visitor.first_name} {visitor.last_name}</h4>
                              <p className="text-slate-600 text-sm">{visitor.company || 'Individual'}</p>
                            </div>
                          </div>
                          <div className="flex flex-col space-y-1">
                            <Badge variant={getStatusColor(visitor.status)}>
                              {visitor.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                            <Badge variant={getRiskLevelColor(visitor.risk_level)}>
                              {visitor.risk_level.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Purpose:</span>
                            <span className="font-medium">{visitor.purpose}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Host:</span>
                            <span className="font-medium">{visitor.host_name}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Room:</span>
                            <span className="font-medium">{visitor.host_room || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Location:</span>
                            <span className="font-medium">{visitor.location}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Duration:</span>
                            <span className="font-medium">{visitor.expected_duration}min</span>
                          </div>
                        </div>

                        {visitor.wifi_registered && (
                          <div className="mb-4 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                            <div className="flex items-center text-slate-700 text-sm">
                              <i className="fas fa-wifi mr-2" />
                              <span className="font-medium">WiFi Registered</span>
                            </div>
                          </div>
                        )}

                        {visitor.service_requests.length > 0 && (
                          <div className="mb-4 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                            <div className="flex items-center text-slate-700 text-sm">
                              <i className="fas fa-concierge-bell mr-2" />
                              <span className="font-medium">{visitor.service_requests.length} Service Request(s)</span>
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2">
                          {visitor.status === 'registered' && (
                            <Button 
                              className="flex-1 !bg-[#2563eb] hover:!bg-blue-700 text-white text-sm"
                              onClick={() => handleCheckIn(visitor.id)}
                              disabled={loading}
                            >
                              Check In
                            </Button>
                          )}
                          {visitor.status === 'checked_in' && (
                            <Button 
                              className="flex-1 !bg-[#2563eb] hover:!bg-blue-700 text-white text-sm"
                              onClick={() => handleCheckOut(visitor.id)}
                              disabled={loading}
                            >
                              Check Out
                            </Button>
                          )}
                          <Button 
                            variant="outline"
                            className="text-slate-600 border-slate-300 hover:bg-slate-50 text-sm"
                            onClick={() => setSelectedVisitor(visitor)}
                          >
                            View Details
                          </Button>
                </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* WiFi Integration Status */}
            <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl mb-8">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <i className="fas fa-wifi mr-3 text-slate-600" />
                  WiFi Integration Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="backdrop-blur-sm bg-white/60 border-white/30 shadow-lg">
                    <CardContent className="p-4 text-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                        <i className="fas fa-wifi text-slate-600 text-xl" />
                </div>
                      <h4 className="font-bold text-slate-900 mb-1">WiFi Portal</h4>
                      <p className="text-slate-600 text-sm mb-2">Self-Registration Active</p>
                      <Badge variant="success" className="text-xs">
                        Online
                      </Badge>
                    </CardContent>
                  </Card>
                  <Card className="backdrop-blur-sm bg-white/60 border-white/30 shadow-lg">
                    <CardContent className="p-4 text-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                        <i className="fas fa-mobile-alt text-slate-600 text-xl" />
                </div>
                      <h4 className="font-bold text-slate-900 mb-1">Mobile App</h4>
                      <p className="text-slate-600 text-sm mb-2">Service Requests</p>
                      <Badge variant="default" className="text-xs">
                        Available
                      </Badge>
                    </CardContent>
                  </Card>
                  <Card className="backdrop-blur-sm bg-white/60 border-white/30 shadow-lg">
                    <CardContent className="p-4 text-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                        <i className="fas fa-bell text-slate-600 text-xl" />
              </div>
                      <h4 className="font-bold text-slate-900 mb-1">Push Notifications</h4>
                      <p className="text-slate-600 text-sm mb-2">Real-time Alerts</p>
                      <Badge variant="success" className="text-xs">
                        Active
                      </Badge>
                    </CardContent>
                  </Card>
                  <Card className="backdrop-blur-sm bg-white/60 border-white/30 shadow-lg">
                    <CardContent className="p-4 text-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                        <i className="fas fa-qrcode text-slate-600 text-xl" />
            </div>
                      <h4 className="font-bold text-slate-900 mb-1">QR Code Access</h4>
                      <p className="text-slate-600 text-sm mb-2">Facility Access</p>
                      <Badge variant="success" className="text-xs">
                        Enabled
                      </Badge>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Actions */}
            <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <i className="fas fa-exclamation-triangle mr-3 text-slate-600" />
                  Emergency Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    className="!bg-red-600 hover:!bg-red-700 text-white"
                    onClick={() => {
                      const overdueVisitors = visitors.filter(v => v.status === 'overdue');
                      showSuccess(`${overdueVisitors.length} visitors have exceeded their time limit`);
                    }}
                  >
                    <i className="fas fa-exclamation-triangle mr-2" />
                    Overdue Alert
                  </Button>
                  <Button 
                    className="!bg-orange-600 hover:!bg-orange-700 text-white"
                    onClick={() => {
                      const pendingVisitors = visitors.filter(v => v.status === 'registered');
                      showSuccess(`${pendingVisitors.length} visitors are registered but not checked in`);
                    }}
                  >
                    <i className="fas fa-clock mr-2" />
                    Pending Alert
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Tab Content for other tabs */}
        {activeTab !== 'dashboard' && (
          <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl">
                {currentTab === 'operations' && 'Visitor Operations'}
                {currentTab === 'digital-services' && 'Digital Services'}
                {currentTab === 'settings' && 'Settings'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentTab === 'operations' && (
                <div className="space-y-6">
                  {/* Active Visitors Dashboard */}
                  <Card className="bg-white border-slate-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center">
                          <i className="fas fa-users text-slate-600 mr-2" />
                          Active Visitors
                        </div>
                        <Badge variant="default" className="text-lg px-4 py-1">
                          {checkedInVisitors.length} Currently On-Site
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {checkedInVisitors.map(visitor => (
                          <div key={visitor.id} className="p-4 border border-slate-200 rounded-lg hover:border-blue-300 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                                  <i className="fas fa-user text-slate-600" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-slate-900">{visitor.first_name} {visitor.last_name}</h4>
                                  <p className="text-sm text-slate-600">
                                    Host: {visitor.host_name} | Location: {visitor.location}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    Badge: {visitor.badge_id} | Checked in: {visitor.check_in_time}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge variant={visitor.security_clearance === 'approved' ? 'success' : 'warning'}>
                                  {visitor.security_clearance}
                                </Badge>
                                <Badge variant={
                                  visitor.risk_level === 'low' ? 'default' : 
                                  visitor.risk_level === 'medium' ? 'warning' : 'destructive'
                                }>
                                  {visitor.risk_level} risk
                                </Badge>
                                <Button
                                  size="sm"
                                  className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
                                  onClick={() => handleCheckOut(visitor.id)}
                                >
                                  <i className="fas fa-sign-out-alt mr-1" />
                                  Check Out
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                        {checkedInVisitors.length === 0 && (
                          <div className="text-center py-8 text-slate-500">
                            <i className="fas fa-user-clock text-4xl mb-3" />
                            <p>No active visitors at this time</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Security Clearance Queue */}
                  <Card className="bg-white border-slate-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <i className="fas fa-shield-alt text-slate-600 mr-2" />
                        Security Clearance Queue
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {pendingSecurityVisitors.map(visitor => (
                          <div key={visitor.id} className="p-4 border border-amber-200 bg-amber-50 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold text-slate-900">{visitor.first_name} {visitor.last_name}</h4>
                                <p className="text-sm text-slate-600">
                                  Purpose: {visitor.purpose} | Host: {visitor.host_name}
                                </p>
                                <p className="text-xs text-slate-500">
                                  Risk Level: <span className="font-medium">{visitor.risk_level}</span> | 
                                  Type: {visitor.visit_type.replace('_', ' ')}
                                </p>
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-300 hover:bg-red-50"
                                  onClick={() => {
                                    setVisitors(prev => prev.map(v => 
                                      v.id === visitor.id ? {...v, security_clearance: 'denied'} : v
                                    ));
                                    showError('Security clearance denied');
                                  }}
                                >
                                  <i className="fas fa-times mr-1" />
                                  Deny
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  onClick={() => {
                                    setVisitors(prev => prev.map(v => 
                                      v.id === visitor.id ? {...v, security_clearance: 'approved'} : v
                                    ));
                                    showSuccess('Security clearance approved');
                                  }}
                                >
                                  <i className="fas fa-check mr-1" />
                                  Approve
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                        {pendingSecurityVisitors.length === 0 && (
                          <div className="text-center py-8 text-slate-500">
                            <i className="fas fa-check-circle text-4xl mb-3 text-green-600" />
                            <p>No pending clearances</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Overdue Visitors Alert */}
                  <Card className="bg-white border-slate-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <i className="fas fa-exclamation-triangle text-slate-600 mr-2" />
                        Overdue Visitors
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {overdueVisitors.map(visitor => (
                          <div key={visitor.id} className="p-4 border border-red-200 bg-red-50 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold text-slate-900">{visitor.first_name} {visitor.last_name}</h4>
                                <p className="text-sm text-red-700">
                                  Expected duration: {visitor.expected_duration} min | 
                                  Location: {visitor.location}
                                </p>
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-slate-600 border-slate-300 hover:bg-slate-50"
                                  onClick={() => showSuccess('Reminder sent to visitor and host')}
                                >
                                  <i className="fas fa-bell mr-1" />
                                  Send Reminder
                                </Button>
                                <Button
                                  size="sm"
                                  className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
                                  onClick={() => handleCheckOut(visitor.id)}
                                >
                                  <i className="fas fa-sign-out-alt mr-1" />
                                  Force Check Out
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                        {overdueVisitors.length === 0 && (
                          <div className="text-center py-8 text-slate-500">
                            <i className="fas fa-check-circle text-4xl mb-3 text-green-600" />
                            <p>No overdue visitors</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Badge Management */}
                  <Card className="bg-white border-slate-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <i className="fas fa-id-card text-slate-600 mr-2" />
                        Badge Management
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <i className="fas fa-id-badge text-blue-600 text-2xl" />
                            <Badge variant="default">{visitors.filter(v => v.badge_id).length}</Badge>
                          </div>
                          <h4 className="font-semibold text-slate-900">Active Badges</h4>
                          <p className="text-sm text-slate-600">Currently assigned</p>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                          <div className="text-center space-y-2">
                            <i className="fas fa-print text-slate-600 text-2xl" />
                            <Button
                              className="!bg-[#2563eb] hover:!bg-blue-700 text-white w-full"
                              onClick={() => showSuccess('Badge printer ready (Hardware integration required)')}
                            >
                              <i className="fas fa-print mr-2" />
                              Print Badge
                            </Button>
                            <p className="text-xs text-slate-500">Requires badge printer hardware</p>
                          </div>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                          <div className="text-center space-y-2">
                            <i className="fas fa-qrcode text-slate-600 text-2xl" />
                            <Button
                              variant="outline"
                              className="text-slate-600 border-slate-300 hover:bg-slate-50 w-full"
                              onClick={() => showSuccess('QR code generated for visitor')}
                            >
                              <i className="fas fa-qrcode mr-2" />
                              Generate QR Code
                            </Button>
                            <p className="text-xs text-slate-500">Digital badge alternative</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
              {currentTab === 'digital-services' && (
                <div className="space-y-6">
                  {/* WiFi Registration Status */}
                  <Card className="bg-white border-slate-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center">
                          <i className="fas fa-wifi text-slate-600 mr-2" />
                          WiFi Registration Portal
                        </div>
                        <Badge variant="success" className="text-lg px-4 py-1">
                          <i className="fas fa-check-circle mr-1" />
                          Active
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <i className="fas fa-users text-blue-600 text-2xl" />
                            <Badge variant="default">{visitors.filter(v => v.wifi_registered).length}</Badge>
                          </div>
                          <h4 className="font-semibold text-slate-900">WiFi Users</h4>
                          <p className="text-sm text-slate-600">Currently registered</p>
                        </div>

                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <i className="fas fa-signal text-green-600 text-2xl" />
                            <Badge variant="success">98%</Badge>
                          </div>
                          <h4 className="font-semibold text-slate-900">Uptime</h4>
                          <p className="text-sm text-slate-600">Portal availability</p>
                        </div>

                        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <i className="fas fa-clock text-purple-600 text-2xl" />
                            <Badge variant="default">2.3 min</Badge>
                          </div>
                          <h4 className="font-semibold text-slate-900">Avg Registration</h4>
                          <p className="text-sm text-slate-600">Time to complete</p>
                        </div>

                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <i className="fas fa-exclamation-triangle text-amber-600 text-2xl" />
                            <Badge variant="default">0</Badge>
                          </div>
                          <h4 className="font-semibold text-slate-900">Portal Errors</h4>
                          <p className="text-sm text-slate-600">Last 24 hours</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border border-slate-200 rounded-lg">
                          <h4 className="font-semibold text-slate-900 mb-2 flex items-center">
                            <i className="fas fa-network-wired text-slate-600 mr-2" />
                            Portal Configuration
                          </h4>
                          <div className="space-y-2 text-sm">
                            <p className="text-slate-600"><strong>SSID:</strong> Guest_WiFi</p>
                            <p className="text-slate-600"><strong>Portal URL:</strong> https://portal.yourhotel.com</p>
                            <p className="text-slate-600"><strong>Session Duration:</strong> 24 hours</p>
                            <p className="text-slate-600"><strong>Auto-Renewal:</strong> Enabled</p>
                          </div>
                          <Button
                            className="!bg-[#2563eb] hover:!bg-blue-700 text-white w-full mt-4"
                            onClick={() => showSuccess('WiFi portal settings configured')}
                          >
                            <i className="fas fa-cog mr-2" />
                            Configure Portal
                          </Button>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-lg">
                          <h4 className="font-semibold text-slate-900 mb-2 flex items-center">
                            <i className="fas fa-shield-alt text-slate-600 mr-2" />
                            Security Settings
                          </h4>
                          <div className="space-y-2 text-sm">
                            <p className="text-slate-600"><strong>WPA Encryption:</strong> WPA3</p>
                            <p className="text-slate-600"><strong>Bandwidth Limit:</strong> 10 Mbps/user</p>
                            <p className="text-slate-600"><strong>Content Filtering:</strong> Enabled</p>
                            <p className="text-slate-600"><strong>Device Limit:</strong> 3 per user</p>
                          </div>
                          <Button
                            variant="outline"
                            className="text-slate-600 border-slate-300 hover:bg-slate-50 w-full mt-4"
                            onClick={() => showSuccess('Security settings updated')}
                          >
                            <i className="fas fa-shield-alt mr-2" />
                            Update Security
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Service Requests Dashboard */}
                  <Card className="bg-white border-slate-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center">
                          <i className="fas fa-concierge-bell text-slate-600 mr-2" />
                          Visitor Service Requests
                        </div>
                        <Badge variant="warning" className="text-lg px-4 py-1">
                          {visitors.reduce((acc, v) => acc + v.service_requests.filter(sr => sr.status === 'pending' || sr.status === 'in_progress').length, 0)} Active
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {visitors.flatMap(visitor => 
                          visitor.service_requests
                            .filter(sr => sr.status !== 'completed' && sr.status !== 'cancelled')
                            .map(request => (
                              <div key={request.id} className="p-4 border border-slate-200 rounded-lg">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="font-semibold text-slate-900">
                                      {request.type.replace('_', ' ').toUpperCase()}
                                    </h4>
                                    <p className="text-sm text-slate-600">
                                      Visitor: {visitor.first_name} {visitor.last_name} | Room: {visitor.host_room || 'N/A'}
                                    </p>
                                    <p className="text-sm text-slate-700 mt-1">{request.description}</p>
                                    <p className="text-xs text-slate-500 mt-1">
                                      Created: {request.created_at}
                                    </p>
                                  </div>
                                  <div className="flex flex-col items-end space-y-2">
                                    <Badge variant={
                                      request.priority === 'urgent' ? 'destructive' :
                                      request.priority === 'high' ? 'warning' : 'default'
                                    }>
                                      {request.priority} priority
                                    </Badge>
                                    <Badge variant={
                                      request.status === 'pending' ? 'default' :
                                      request.status === 'in_progress' ? 'warning' : 'success'
                                    }>
                                      {request.status}
                                    </Badge>
                                    <Button
                                      size="sm"
                                      className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
                                      onClick={() => showSuccess('Service request marked as completed')}
                                    >
                                      <i className="fas fa-check mr-1" />
                                      Complete
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))
                        )}
                        {visitors.flatMap(v => v.service_requests.filter(sr => sr.status !== 'completed')).length === 0 && (
                          <div className="text-center py-8 text-slate-500">
                            <i className="fas fa-check-circle text-4xl mb-3 text-green-600" />
                            <p>No pending service requests</p>
                          </div>
                        )}
                      </div>
            </CardContent>
          </Card>

                  {/* Mobile App Integration Status */}
                  <Card className="bg-white border-slate-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center">
                          <i className="fas fa-mobile-alt text-slate-600 mr-2" />
                          Mobile App Integration
                        </div>
                        <Badge variant="default" className="text-lg px-4 py-1">
                          <i className="fas fa-info-circle mr-1" />
                          Ready for Integration
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <i className="fas fa-mobile-alt text-slate-600 text-2xl" />
                            <Badge variant="default">Ready</Badge>
                          </div>
                          <h4 className="font-semibold text-slate-900 mb-2">iOS App</h4>
                          <p className="text-sm text-slate-600 mb-3">API endpoints configured for future iOS app integration</p>
                          <Button
                            variant="outline"
                            className="text-slate-600 border-slate-300 hover:bg-slate-50 w-full"
                            onClick={() => showSuccess('iOS app configuration available in Settings')}
                          >
                            View Config
                          </Button>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <i className="fas fa-mobile-alt text-slate-600 text-2xl" />
                            <Badge variant="default">Ready</Badge>
                          </div>
                          <h4 className="font-semibold text-slate-900 mb-2">Android App</h4>
                          <p className="text-sm text-slate-600 mb-3">API endpoints configured for future Android app integration</p>
                          <Button
                            variant="outline"
                            className="text-slate-600 border-slate-300 hover:bg-slate-50 w-full"
                            onClick={() => showSuccess('Android app configuration available in Settings')}
                          >
                            View Config
                          </Button>
                        </div>

                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <i className="fas fa-code text-blue-600 text-2xl" />
                            <Badge variant="default">Active</Badge>
                          </div>
                          <h4 className="font-semibold text-slate-900 mb-2">API Endpoints</h4>
                          <p className="text-sm text-slate-600 mb-3">REST API ready for mobile app integration</p>
                          <Button
                            className="bg-[#2563eb] hover:bg-blue-700 text-white w-full"
                            onClick={() => showSuccess('API documentation generated')}
                          >
                            View API Docs
                          </Button>
                        </div>
                      </div>

                      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start space-x-3">
                          <i className="fas fa-info-circle text-blue-600 text-xl mt-1" />
                          <div>
                            <h4 className="font-semibold text-slate-900 mb-1">Integration Note</h4>
                            <p className="text-sm text-slate-700">
                              The visitor management system is fully prepared for mobile app integration. API endpoints are configured and documented. 
                              When your mobile apps are ready, they can connect to submit service requests, view visitor status, and receive real-time notifications.
                            </p>
                            <p className="text-sm text-slate-600 mt-2">
                              <strong>Features ready for app:</strong> Visitor registration, Service requests, QR code access, Push notifications, WiFi auto-connect
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Push Notifications */}
                  <Card className="bg-white border-slate-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <i className="fas fa-bell text-slate-600 mr-2" />
                        Push Notification System
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border border-slate-200 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-slate-900">Notification Status</h4>
                            <Badge variant="success">Enabled</Badge>
                          </div>
                          <div className="space-y-2 text-sm">
                            <p className="text-slate-600"><strong>Provider:</strong> Firebase Cloud Messaging</p>
                            <p className="text-slate-600"><strong>Delivery Rate:</strong> 99.2%</p>
                            <p className="text-slate-600"><strong>Avg Latency:</strong> 0.8 seconds</p>
                            <p className="text-slate-600"><strong>Active Devices:</strong> {visitors.filter(v => v.status === 'checked_in').length * 2}</p>
                          </div>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-lg">
                          <h4 className="font-semibold text-slate-900 mb-3">Recent Notifications</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center text-slate-600">
                              <i className="fas fa-check text-green-600 mr-2" />
                              Check-in confirmation sent (2 min ago)
                            </div>
                            <div className="flex items-center text-slate-600">
                              <i className="fas fa-check text-green-600 mr-2" />
                              Service request update (15 min ago)
                            </div>
                            <div className="flex items-center text-slate-600">
                              <i className="fas fa-check text-green-600 mr-2" />
                              Host arrival notification (28 min ago)
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <Button
                          className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
                          onClick={() => showSuccess('Test notification sent to all active visitors')}
                        >
                          <i className="fas fa-paper-plane mr-2" />
                          Send Test Notification
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
              {currentTab === 'settings' && (
                <div className="space-y-6">
                  {/* System Configuration */}
                  <Card className="bg-white border-slate-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <i className="fas fa-cog text-slate-600 mr-2" />
                        System Configuration
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-slate-700">
                            Default Check-In Duration
                          </label>
                          <select 
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={settings.defaultCheckInDuration}
                            onChange={(e) => handleSettingsChange('defaultCheckInDuration', e.target.value)}
                          >
                            <option value="60">1 hour</option>
                            <option value="120">2 hours</option>
                            <option value="180">3 hours</option>
                            <option value="240">4 hours</option>
                            <option value="480">8 hours (Full day)</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-slate-700">
                            Badge ID Prefix
                          </label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="V"
                            defaultValue="V"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-slate-700">
                            Auto Check-Out After
                          </label>
                          <select className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="0">Never (Manual only)</option>
                            <option value="30">30 minutes overdue</option>
                            <option value="60">1 hour overdue</option>
                            <option value="120">2 hours overdue</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-slate-700">
                            Visitor Data Retention
                          </label>
                          <select className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="30">30 days</option>
                            <option value="60">60 days</option>
                            <option value="90">90 days</option>
                            <option value="180">180 days</option>
                            <option value="365">1 year</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-slate-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-slate-900">Require Photo Upload</h4>
                            <p className="text-sm text-slate-600">Mandatory photo for all visitors</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2563eb]"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-slate-900">Automatic Badge Printing</h4>
                            <p className="text-sm text-slate-600">Print badges on check-in</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2563eb]"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-slate-900">Host Notification</h4>
                            <p className="text-sm text-slate-600">Notify host on visitor arrival</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2563eb]"></div>
                          </label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Security Policies */}
                  <Card className="bg-white border-slate-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <i className="fas fa-shield-alt text-slate-600 mr-2" />
                        Security Policies
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-slate-700">
                            Default Security Clearance
                          </label>
                          <select className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="pending">Pending (Requires approval)</option>
                            <option value="approved">Approved (Auto-approve)</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-slate-700">
                            Risk Assessment Level
                          </label>
                          <select className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="low">Low (Standard visitors)</option>
                            <option value="medium">Medium (Service personnel)</option>
                            <option value="high">High (Restricted areas)</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-slate-700">
                            Background Check Required For
                          </label>
                          <select className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="none">None</option>
                            <option value="service">Service Personnel</option>
                            <option value="all">All Visitors</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-slate-700">
                            ID Verification Required
                          </label>
                          <select className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="always">Always</option>
                            <option value="service">Service Personnel Only</option>
                            <option value="never">Never</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-slate-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-slate-900">Watchlist Integration</h4>
                            <p className="text-sm text-slate-600">Check visitors against security watchlist</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2563eb]"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-slate-900">Vehicle Registration Required</h4>
                            <p className="text-sm text-slate-600">Capture vehicle information for parking</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2563eb]"></div>
                          </label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* WiFi & Digital Services */}
                  <Card className="bg-white border-slate-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <i className="fas fa-wifi text-slate-600 mr-2" />
                        WiFi & Digital Services
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-slate-700">
                            WiFi Network SSID
                          </label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Guest_WiFi"
                            defaultValue="Guest_WiFi"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-slate-700">
                            WiFi Session Duration
                          </label>
                          <select className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="1">1 hour</option>
                            <option value="4">4 hours</option>
                            <option value="8">8 hours</option>
                            <option value="24">24 hours</option>
                            <option value="unlimited">Unlimited</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-slate-700">
                            Portal URL
                          </label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="https://portal.yourhotel.com"
                            defaultValue="https://portal.yourhotel.com"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-slate-700">
                            Mobile App API Key
                          </label>
                          <input
                            type="password"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                            placeholder="••••••••••••••••"
                            defaultValue="app_key_123456789"
                          />
                        </div>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-slate-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-slate-900">Self-Service WiFi Registration</h4>
                            <p className="text-sm text-slate-600">Allow visitors to register via WiFi portal</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2563eb]"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-slate-900">Mobile App Service Requests</h4>
                            <p className="text-sm text-slate-600">Enable service requests through mobile app</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2563eb]"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-slate-900">Push Notifications</h4>
                            <p className="text-sm text-slate-600">Send real-time alerts to visitors</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2563eb]"></div>
                          </label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Notification Templates */}
                  <Card className="bg-white border-slate-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <i className="fas fa-bell text-slate-600 mr-2" />
                        Notification Templates
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">
                          Check-In Confirmation (Visitor)
                        </label>
                        <textarea
                          rows={3}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          defaultValue="Welcome {visitor_name}! You have checked in at {facility_name}. Your badge ID is {badge_id}. For assistance, contact reception."
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">
                          Host Notification (Arrival)
                        </label>
                        <textarea
                          rows={3}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          defaultValue="{host_name}, your visitor {visitor_name} has arrived and checked in. Location: {location}. Badge: {badge_id}."
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">
                          Overdue Reminder
                        </label>
                        <textarea
                          rows={2}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          defaultValue="{visitor_name}, your visit duration has exceeded the expected time. Please check out at reception."
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Save Settings Button */}
                  <div className="flex justify-end">
                      <Button
                        className="!bg-[#2563eb] hover:!bg-blue-700 text-white px-8 py-3"
                        onClick={handleSaveSettings}
                      >
                      <i className="fas fa-save mr-2" />
                      Save All Settings
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Register Visitor Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="backdrop-blur-xl bg-white/90 border-white/30 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200/50">
              <CardTitle className="flex items-center text-xl">
                <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center mr-3">
                  <i className="fas fa-plus text-white text-sm" />
                </div>
                Register New Visitor
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRegisterModal(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                <i className="fas fa-times text-lg" />
              </Button>
            </CardHeader>
            
            <CardContent className="p-6">
              <form onSubmit={handleRegisterVisitor} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                    <i className="fas fa-user text-blue-600 mr-2" />
                    Basic Information
                  </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="first-name" className="block text-sm font-medium text-slate-700">
                    First Name *
                  </label>
                  <input
                    type="text"
                        id="first-name"
                        value={registerForm.first_name}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, first_name: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="First name"
                        required
                  />
                </div>

                    <div className="space-y-2">
                      <label htmlFor="last-name" className="block text-sm font-medium text-slate-700">
                    Last Name *
                  </label>
                  <input
                    type="text"
                        id="last-name"
                        value={registerForm.last_name}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, last_name: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Last name"
                        required
                      />
                    </div>
                </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                        id="phone"
                        value={registerForm.phone}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Phone number"
                        required
                  />
                </div>

                    <div className="space-y-2">
                      <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                        Email Address
                  </label>
                  <input
                    type="email"
                        id="email"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Email address"
                      />
                    </div>
                </div>

                  <div className="space-y-2">
                    <label htmlFor="company" className="block text-sm font-medium text-slate-700">
                    Company
                  </label>
                  <input
                    type="text"
                      id="company"
                      value={registerForm.company}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, company: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Company name"
                    />
                  </div>
                </div>

                {/* Visit Information */}
                <div className="space-y-4 border-t border-slate-200/50 pt-6">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                    <i className="fas fa-calendar text-green-600 mr-2" />
                    Visit Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="purpose" className="block text-sm font-medium text-slate-700">
                    Purpose of Visit *
                  </label>
                  <input
                    type="text"
                        id="purpose"
                        value={registerForm.purpose}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, purpose: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Purpose of visit"
                        required
                  />
                </div>

                    <div className="space-y-2">
                      <label htmlFor="visit-type" className="block text-sm font-medium text-slate-700">
                        Visit Type *
                      </label>
                      <select
                        id="visit-type"
                        value={registerForm.visit_type}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, visit_type: e.target.value as Visitor['visit_type'] }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      >
                        <option value="day_visitor">Day Visitor</option>
                        <option value="guest_visitor">Guest Visitor</option>
                        <option value="service_personnel">Service Personnel</option>
                        <option value="emergency_contact">Emergency Contact</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="location" className="block text-sm font-medium text-slate-700">
                      Location *
                  </label>
                  <input
                    type="text"
                      id="location"
                      value={registerForm.location}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Meeting location or room"
                      required
                    />
                  </div>
                </div>

                {/* Host Information */}
                <div className="space-y-4 border-t border-slate-200/50 pt-6">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                    <i className="fas fa-user-tie text-purple-600 mr-2" />
                    Host Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="host-name" className="block text-sm font-medium text-slate-700">
                        Host Name *
                  </label>
                  <input
                        type="text"
                        id="host-name"
                        value={registerForm.host_name}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, host_name: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Host name"
                        required
                  />
                </div>

                    <div className="space-y-2">
                      <label htmlFor="host-room" className="block text-sm font-medium text-slate-700">
                        Host Room
                  </label>
                  <input
                        type="text"
                        id="host-room"
                        value={registerForm.host_room}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, host_room: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Room number"
                      />
                    </div>
                </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="host-phone" className="block text-sm font-medium text-slate-700">
                        Host Phone
                  </label>
                  <input
                        type="tel"
                        id="host-phone"
                        value={registerForm.host_phone}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, host_phone: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Host phone number"
                  />
                </div>

                    <div className="space-y-2">
                      <label htmlFor="host-email" className="block text-sm font-medium text-slate-700">
                        Host Email
                  </label>
                  <input
                        type="email"
                        id="host-email"
                        value={registerForm.host_email}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, host_email: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Host email address"
                  />
                </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4 border-t border-slate-200/50 pt-6">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                    <i className="fas fa-cog text-slate-600 mr-2" />
                    Additional Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="expected-duration" className="block text-sm font-medium text-slate-700">
                        Expected Duration (minutes)
                  </label>
                  <input
                        type="number"
                        id="expected-duration"
                        value={registerForm.expected_duration}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, expected_duration: parseInt(e.target.value) || 60 }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        min="15"
                        step="15"
                  />
                </div>

                    <div className="space-y-2">
                      <label htmlFor="vehicle-number" className="block text-sm font-medium text-slate-700">
                    Vehicle Number
                  </label>
                  <input
                    type="text"
                        id="vehicle-number"
                        value={registerForm.vehicle_number}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, vehicle_number: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Vehicle license plate"
                      />
                    </div>
                </div>

                  <div className="space-y-2">
                    <label htmlFor="notes" className="block text-sm font-medium text-slate-700">
                    Notes
                  </label>
                  <textarea
                      id="notes"
                    rows={3}
                      value={registerForm.notes}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Additional notes or special requirements"
                  />
                </div>
              </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200/50">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowRegisterModal(false)}
                    className="text-slate-600 border-slate-300 hover:bg-slate-50"
                >
                  Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-green-500 hover:bg-green-600 text-white"
                    disabled={loading || !registerForm.first_name || !registerForm.last_name || !registerForm.phone || !registerForm.purpose || !registerForm.host_name || !registerForm.location}
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Registering...
              </div>
                    ) : (
                      <>
                        <i className="fas fa-save mr-2" />
                        Register Visitor
                      </>
                    )}
                  </Button>
            </div>
              </form>
            </CardContent>
          </Card>
          </div>
        )}

      {/* WiFi Registration Modal */}
      {showWifiModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="backdrop-blur-xl bg-white/90 border-white/30 shadow-2xl max-w-md w-full">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200/50">
              <CardTitle className="flex items-center text-xl">
                <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center mr-3">
                  <i className="fas fa-wifi text-white text-sm" />
                </div>
                WiFi Registration
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowWifiModal(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                <i className="fas fa-times text-lg" />
              </Button>
            </CardHeader>
            
            <CardContent className="p-6 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-wifi text-purple-600 text-3xl" />
              </div>
              
              <h3 className="text-lg font-semibold text-slate-900 mb-2">WiFi Self-Registration</h3>
              <p className="text-slate-600 mb-6">Visitors can register themselves when connecting to hotel WiFi for enhanced services and security.</p>
              
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center text-green-700 text-sm">
                    <i className="fas fa-check-circle mr-2" />
                    <span className="font-medium">Self-service registration active</span>
              </div>
            </div>
                
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center text-blue-700 text-sm">
                    <i className="fas fa-mobile-alt mr-2" />
                    <span className="font-medium">Service requests available</span>
              </div>
                    </div>
                
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center text-orange-700 text-sm">
                    <i className="fas fa-bell mr-2" />
                    <span className="font-medium">Push notifications enabled</span>
                    </div>
                  </div>
                </div>
              
              <div className="mt-6">
                <Button
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white"
                  onClick={() => setShowWifiModal(false)}
                >
                  <i className="fas fa-wifi mr-2" />
                  WiFi Portal Active
                </Button>
              </div>
            </CardContent>
          </Card>
          </div>
        )}
    </div>
  );
};

export default Visitors;