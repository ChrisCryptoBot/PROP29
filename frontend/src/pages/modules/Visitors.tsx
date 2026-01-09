import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Badge } from '../../components/UI/Badge';
import { Avatar } from '../../components/UI/Avatar';
import { cn } from '../../utils/cn';
import { showError, showSuccess, showLoading, dismissLoadingAndShowSuccess, dismissLoadingAndShowError } from '../../utils/toast';
import '../../styles/modern-glass.css';

// Security-Focused Visitor Management Interfaces
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
  visit_type: 'day_visitor' | 'guest_visitor' | 'service_personnel' | 'emergency_contact' | 'event_attendee';
  wifi_registered: boolean;
  security_requests: SecurityRequest[];
  emergency_contacts: EmergencyContact[];
  // Event badge system
  event_id?: string;
  event_name?: string;
  event_badge_type?: 'ticket' | 'vip' | 'staff' | 'vendor';
  access_points?: string[]; // Access point IDs this visitor can access
  badge_expires_at?: string;
}

interface SecurityRequest {
  id: string;
  type: 'access_request' | 'security_assistance' | 'emergency_alert' | 'incident_report' | 'escort_request' | 'lost_badge' | 'suspicious_activity';
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  location?: string;
  assigned_to?: string;
  response?: string;
}

interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

interface Event {
  id: string;
  name: string;
  type: 'wedding' | 'conference' | 'corporate' | 'social' | 'other';
  start_date: string;
  end_date: string;
  location: string;
  expected_attendees: number;
  badge_types: EventBadgeType[];
  qr_code_enabled: boolean;
  access_points: string[];
}

interface EventBadgeType {
  id: string;
  name: string;
  type: 'ticket' | 'vip' | 'staff' | 'vendor';
  color: string;
  access_level: string[];
}

// Mock Data
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
    security_requests: [
      {
        id: 'sr1',
        type: 'access_request',
        description: 'Requesting access to Executive Floor for meeting',
        status: 'pending',
        created_at: '2025-01-27 14:45',
        priority: 'normal',
        location: 'Executive Floor'
      }
    ],
    emergency_contacts: [
      {
        name: 'Jane Smith',
        relationship: 'Spouse',
        phone: '+1-555-0124',
        email: 'jane.smith@email.com'
      }
    ],
    access_points: ['1', '3']
  },
  {
    id: '2',
    first_name: 'Emily',
    last_name: 'Chen',
    email: 'emily.chen@email.com',
    phone: '+1-555-0321',
    purpose: 'Wedding Guest',
    host_name: 'Wedding Party',
    host_room: 'Ballroom A',
    check_in_time: '2025-01-27 18:00',
    expected_duration: 300,
    status: 'checked_in',
    location: 'Ballroom A',
    badge_id: 'EVT001',
    qr_code: 'WEDDING_001_QR',
    created_at: '2025-01-27 18:00',
    updated_at: '2025-01-27 18:00',
    security_clearance: 'approved',
    risk_level: 'low',
    visit_type: 'event_attendee',
    wifi_registered: true,
    security_requests: [],
    emergency_contacts: [],
    event_id: 'wedding_001',
    event_name: 'Smith-Johnson Wedding',
    event_badge_type: 'ticket',
    access_points: ['1', '5'],
    badge_expires_at: '2025-01-28 02:00'
  },
  {
    id: '3',
    first_name: 'David',
    last_name: 'Wilson',
    email: 'david.wilson@email.com',
    phone: '+1-555-0654',
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
    badge_id: 'V003',
    qr_code: 'VISITOR_003_QR',
    created_at: '2025-01-27 10:15',
    updated_at: '2025-01-27 12:30',
    security_clearance: 'approved',
    risk_level: 'low',
    visit_type: 'service_personnel',
    wifi_registered: false,
    security_requests: [
      {
        id: 'sr3',
        type: 'security_assistance',
        description: 'Lost badge, requesting replacement',
        status: 'completed',
        created_at: '2025-01-27 10:20',
        priority: 'high',
        response: 'Badge replaced and access re-enabled'
      }
    ],
    emergency_contacts: [],
    access_points: ['2', '4']
  }
];

const mockEvents: Event[] = [
  {
    id: 'wedding_001',
    name: 'Smith-Johnson Wedding',
    type: 'wedding',
    start_date: '2025-01-27 18:00',
    end_date: '2025-01-28 02:00',
    location: 'Ballroom A',
    expected_attendees: 150,
    badge_types: [
      { id: '1', name: 'Guest Ticket', type: 'ticket', color: '#3b82f6', access_level: ['lobby', 'ballroom'] },
      { id: '2', name: 'VIP Guest', type: 'vip', color: '#f59e0b', access_level: ['lobby', 'ballroom', 'vip_lounge'] },
      { id: '3', name: 'Wedding Staff', type: 'staff', color: '#10b981', access_level: ['lobby', 'ballroom', 'kitchen', 'staff_areas'] },
      { id: '4', name: 'Vendor', type: 'vendor', color: '#8b5cf6', access_level: ['lobby', 'loading_dock', 'ballroom'] }
    ],
    qr_code_enabled: true,
    access_points: ['1', '5', '7']
  }
];

// Security-Focused Tab Structure
const tabs = [
  { id: 'dashboard', label: 'Dashboard', path: '/modules/visitors' },
  { id: 'visitors', label: 'Visitor Management', path: '/modules/visitor-management' },
  { id: 'events', label: 'Event Badges', path: '/modules/visitor-events' },
  { id: 'security-requests', label: 'Security Requests', path: '/modules/security-requests' },
  { id: 'badges-access', label: 'Badges & Access', path: '/modules/badges-access' },
  { id: 'mobile-app', label: 'Mobile App Config', path: '/modules/mobile-app-config' },
  { id: 'settings', label: 'Settings', path: '/modules/visitor-settings' }
];

const Visitors: React.FC = () => {
  const [visitors, setVisitors] = useState<Visitor[]>(mockVisitors);
  const [events, setEvents] = useState<Event[]>(mockEvents);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [filter, setFilter] = useState<'all' | 'registered' | 'checked_in' | 'checked_out' | 'overdue' | 'cancelled'>('all');
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Type assertion to fix TypeScript strict literal type inference
  const currentTab = activeTab as any;
  
  // Form states
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
    vehicle_number: '',
    event_id: ''
  });

  const [eventForm, setEventForm] = useState({
    name: '',
    type: 'wedding' as Event['type'],
    start_date: '',
    end_date: '',
    location: '',
    expected_attendees: 100,
    qr_code_enabled: true,
    access_points: [] as string[]
  });

  const filteredVisitors = useMemo(() => {
    return visitors.filter(visitor => {
      if (filter === 'all') return true;
      return visitor.status === filter;
    });
  }, [visitors, filter]);

  const metrics = {
    total: visitors.length,
    checked_in: visitors.filter(v => v.status === 'checked_in').length,
    pending: visitors.filter(v => v.security_clearance === 'pending').length,
    active_events: events.length,
    security_requests: visitors.reduce((acc, v) => acc + v.security_requests.filter(sr => sr.status === 'pending' || sr.status === 'in_progress').length, 0),
    overdue: visitors.filter(v => v.status === 'overdue').length
  };

  const handleCheckIn = useCallback(async (visitorId: string) => {
    const toastId = showLoading('Checking in visitor...');
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setVisitors(prev => prev.map(v =>
        v.id === visitorId ? { ...v, status: 'checked_in', check_in_time: new Date().toISOString() } : v
      ));
      dismissLoadingAndShowSuccess(toastId, 'Visitor checked in successfully');
    } catch (error) {
      dismissLoadingAndShowError(toastId, 'Failed to check in visitor');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCheckOut = useCallback(async (visitorId: string) => {
    const toastId = showLoading('Checking out visitor...');
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setVisitors(prev => prev.map(v =>
        v.id === visitorId ? { ...v, status: 'checked_out', check_out_time: new Date().toISOString() } : v
      ));
      dismissLoadingAndShowSuccess(toastId, 'Visitor checked out successfully');
    } catch (error) {
      dismissLoadingAndShowError(toastId, 'Failed to check out visitor');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleGenerateQR = useCallback((visitor: Visitor) => {
    setSelectedVisitor(visitor);
    setShowQRModal(true);
  }, []);

  const handleGenerateBadge = useCallback((visitor: Visitor) => {
    setSelectedVisitor(visitor);
    setShowBadgeModal(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* HEADER - GOLD STANDARD */}
      <div className="w-full backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg relative">
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-700 to-blue-800 rounded-2xl flex items-center justify-center shadow-lg">
                <i className="fas fa-user-shield text-white text-2xl" />
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-slate-900">
                Visitor Security
              </h1>
              <p className="text-slate-600 font-medium">
                Security-focused visitor screening, access control, and event badge management
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
      <div className="relative max-w-[1800px] mx-auto px-6 py-6">
        {/* Dashboard Tab */}
        {currentTab === 'dashboard' && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                <CardContent className="pt-6 px-6 pb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-xl flex items-center justify-center shadow-lg mt-2">
                      <i className="fas fa-users text-white text-xl" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-blue-600">{metrics.total}</h3>
                    <p className="text-slate-600 text-sm">Total Visitors</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                <CardContent className="pt-6 px-6 pb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center shadow-lg mt-2">
                      <i className="fas fa-check-circle text-white text-xl" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-blue-600">{metrics.checked_in}</h3>
                    <p className="text-slate-600 text-sm">Checked In</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                <CardContent className="pt-6 px-6 pb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl flex items-center justify-center shadow-lg mt-2">
                      <i className="fas fa-exclamation-triangle text-white text-xl" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-blue-600">{metrics.security_requests}</h3>
                    <p className="text-slate-600 text-sm">Security Requests</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                <CardContent className="pt-6 px-6 pb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg mt-2">
                      <i className="fas fa-calendar-alt text-white text-xl" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-blue-600">{metrics.active_events}</h3>
                    <p className="text-slate-600 text-sm">Active Events</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Visitors */}
            <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm mb-8">
              <CardHeader className="px-6 pt-6 pb-4">
                <CardTitle className="flex items-center text-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                    <i className="fas fa-list text-white" />
                  </div>
                  Recent Visitors
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="space-y-3">
                  {filteredVisitors.slice(0, 5).map(visitor => (
                    <div
                      key={visitor.id}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <Avatar className="bg-gradient-to-br from-blue-700 to-blue-800">
                          {visitor.first_name[0]}{visitor.last_name[0]}
                        </Avatar>
                        <div>
                          <h4 className="font-semibold text-slate-900">{visitor.first_name} {visitor.last_name}</h4>
                          <p className="text-sm text-slate-600">{visitor.purpose} • {visitor.location}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={cn(
                          "px-2.5 py-1 text-xs font-semibold rounded",
                          visitor.status === 'checked_in' ? 'text-green-800 bg-green-100' :
                          visitor.status === 'checked_out' ? 'text-slate-800 bg-slate-100' :
                          visitor.status === 'overdue' ? 'text-red-800 bg-red-100' :
                          'text-yellow-800 bg-yellow-100'
                        )}>
                          {visitor.status.toUpperCase().replace('_', ' ')}
                        </span>
                        {visitor.qr_code && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleGenerateQR(visitor)}
                            className="text-slate-600 border-slate-300"
                          >
                            <i className="fas fa-qrcode mr-2" />
                            QR Code
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Visitor Management Tab */}
        {currentTab === 'visitors' && (
          <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm">
            <CardHeader className="px-6 pt-6 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center text-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                    <i className="fas fa-users text-white" />
                  </div>
                  Visitor Management
                </CardTitle>
                <Button
                  onClick={() => setShowRegisterModal(true)}
                  className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
                >
                  <i className="fas fa-user-plus mr-2" />
                  Register Visitor
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              {/* Filter Buttons */}
              <div className="flex items-center space-x-2 mb-6">
                {['all', 'registered', 'checked_in', 'checked_out', 'overdue'].map(filterType => (
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

              {/* Visitors List */}
              <div className="space-y-3">
                {filteredVisitors.map(visitor => (
                  <div
                    key={visitor.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    onClick={() => setSelectedVisitor(visitor)}
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <Avatar className="bg-gradient-to-br from-blue-700 to-blue-800">
                        {visitor.first_name[0]}{visitor.last_name[0]}
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900">{visitor.first_name} {visitor.last_name}</h4>
                        <p className="text-sm text-slate-600">{visitor.purpose} • {visitor.location}</p>
                        {visitor.event_name && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded text-purple-800 bg-purple-100">
                            {visitor.event_name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={cn(
                        "px-2.5 py-1 text-xs font-semibold rounded",
                        visitor.security_clearance === 'approved' ? 'text-green-800 bg-green-100' :
                        visitor.security_clearance === 'pending' ? 'text-yellow-800 bg-yellow-100' :
                        'text-red-800 bg-red-100'
                      )}>
                        {visitor.security_clearance.toUpperCase()}
                      </span>
                      {visitor.status === 'registered' && (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCheckIn(visitor.id);
                          }}
                          className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
                        >
                          Check In
                        </Button>
                      )}
                      {visitor.status === 'checked_in' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCheckOut(visitor.id);
                          }}
                          className="text-slate-600 border-slate-300"
                        >
                          Check Out
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Event Badges Tab */}
        {currentTab === 'events' && (
          <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm">
            <CardHeader className="px-6 pt-6 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center text-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-700 to-purple-800 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                    <i className="fas fa-calendar-alt text-white" />
                  </div>
                  Event Badge Management
                </CardTitle>
                <Button
                  onClick={() => setShowEventModal(true)}
                  className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
                >
                  <i className="fas fa-plus mr-2" />
                  Create Event
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {events.map(event => (
                  <Card
                    key={event.id}
                    className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer"
                    onClick={() => setSelectedEvent(event)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-semibold text-slate-900 text-lg">{event.name}</h4>
                          <p className="text-sm text-slate-600 mt-1">{event.type.toUpperCase()}</p>
                        </div>
                        <span className="px-2.5 py-1 text-xs font-semibold rounded text-blue-800 bg-blue-100">
                          Active
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Location:</span>
                          <span className="font-medium">{event.location}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Attendees:</span>
                          <span className="font-medium">{event.expected_attendees}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">QR Enabled:</span>
                          <span className={cn(
                            "font-medium",
                            event.qr_code_enabled ? "text-green-600" : "text-slate-400"
                          )}>
                            {event.qr_code_enabled ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <p className="text-xs text-slate-600 mb-2">Badge Types:</p>
                        <div className="flex flex-wrap gap-2">
                          {event.badge_types.map(badge => (
                            <span
                              key={badge.id}
                              className="px-2 py-1 text-xs font-semibold rounded"
                              style={{ backgroundColor: `${badge.color}20`, color: badge.color }}
                            >
                              {badge.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Security Requests Tab */}
        {currentTab === 'security-requests' && (
          <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm">
            <CardHeader className="px-6 pt-6 pb-4">
              <CardTitle className="flex items-center text-xl">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-700 to-orange-800 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                  <i className="fas fa-shield-alt text-white" />
                </div>
                Security Requests
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="space-y-4">
                {visitors.flatMap(visitor =>
                  visitor.security_requests.map(request => (
                    <div
                      key={request.id}
                      className="p-4 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={cn(
                              "px-2.5 py-1 text-xs font-semibold rounded",
                              request.type === 'emergency_alert' ? 'text-red-800 bg-red-100' :
                              request.type === 'incident_report' ? 'text-orange-800 bg-orange-100' :
                              request.type === 'access_request' ? 'text-blue-800 bg-blue-100' :
                              'text-slate-800 bg-slate-100'
                            )}>
                              {request.type.replace('_', ' ').toUpperCase()}
                            </span>
                            <span className={cn(
                              "px-2.5 py-1 text-xs font-semibold rounded",
                              request.priority === 'urgent' ? 'text-red-800 bg-red-100' :
                              request.priority === 'high' ? 'text-orange-800 bg-orange-100' :
                              request.priority === 'normal' ? 'text-blue-800 bg-blue-100' :
                              'text-slate-800 bg-slate-100'
                            )}>
                              {request.priority.toUpperCase()}
                            </span>
                            <span className={cn(
                              "px-2.5 py-1 text-xs font-semibold rounded",
                              request.status === 'pending' ? 'text-yellow-800 bg-yellow-100' :
                              request.status === 'in_progress' ? 'text-blue-800 bg-blue-100' :
                              request.status === 'completed' ? 'text-green-800 bg-green-100' :
                              'text-slate-800 bg-slate-100'
                            )}>
                              {request.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                          <p className="text-slate-900 font-medium mb-1">{request.description}</p>
                          <p className="text-sm text-slate-600">
                            From: {visitors.find(v => v.security_requests.includes(request))?.first_name} {visitors.find(v => v.security_requests.includes(request))?.last_name}
                            {request.location && ` • Location: ${request.location}`}
                          </p>
                          {request.response && (
                            <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                              <p className="text-sm text-blue-900"><strong>Response:</strong> {request.response}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {request.status === 'pending' && (
                            <Button
                              size="sm"
                              className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
                              onClick={() => showSuccess('Request assigned and in progress')}
                            >
                              Assign
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Badges & Access Tab */}
        {currentTab === 'badges-access' && (
          <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm">
            <CardHeader className="px-6 pt-6 pb-4">
              <CardTitle className="flex items-center text-xl">
                <div className="w-10 h-10 bg-gradient-to-br from-green-700 to-green-800 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                  <i className="fas fa-id-badge text-white" />
                </div>
                Badges & Access Points
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="space-y-4">
                {filteredVisitors.filter(v => v.status === 'checked_in').map(visitor => (
                  <div
                    key={visitor.id}
                    className="p-4 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-slate-900">{visitor.first_name} {visitor.last_name}</h4>
                        <p className="text-sm text-slate-600">Badge ID: {visitor.badge_id}</p>
                        {visitor.event_name && (
                          <p className="text-sm text-purple-600 mt-1">Event: {visitor.event_name}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleGenerateQR(visitor)}
                          className="text-slate-600 border-slate-300"
                        >
                          <i className="fas fa-qrcode mr-2" />
                          View QR
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleGenerateBadge(visitor)}
                          className="text-slate-600 border-slate-300"
                        >
                          <i className="fas fa-id-card mr-2" />
                          Print Badge
                        </Button>
                      </div>
                    </div>
                    {visitor.access_points && visitor.access_points.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <p className="text-sm font-medium text-slate-700 mb-2">Access Points:</p>
                        <div className="flex flex-wrap gap-2">
                          {visitor.access_points.map(apId => (
                            <span key={apId} className="px-2.5 py-1 text-xs font-semibold rounded text-blue-800 bg-blue-100">
                              Access Point {apId}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mobile App Config Tab */}
        {currentTab === 'mobile-app' && (
          <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm">
            <CardHeader className="px-6 pt-6 pb-4">
              <CardTitle className="flex items-center text-xl">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-700 to-indigo-800 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                  <i className="fas fa-mobile-alt text-white" />
                </div>
                Mobile App Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="space-y-6">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-slate-900 mb-2">API Configuration</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">API Key</label>
                      <input
                        type="text"
                        value="app_key_123456789"
                        readOnly
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">API Endpoint</label>
                      <input
                        type="text"
                        value="https://api.yourhotel.com/visitors"
                        readOnly
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-slate-900 mb-2">Mobile App Features</h4>
                  <ul className="space-y-2 text-sm text-slate-700">
                    <li className="flex items-center">
                      <i className="fas fa-check-circle text-green-600 mr-2" />
                      QR Code Badge Display (for events)
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check-circle text-green-600 mr-2" />
                      Security Request Submission
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check-circle text-green-600 mr-2" />
                      Incident Reporting
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check-circle text-green-600 mr-2" />
                      Real-time Communication with Security
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check-circle text-green-600 mr-2" />
                      Access Point Badge Integration
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check-circle text-green-600 mr-2" />
                      Push Notifications
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Settings Tab - Placeholder */}
        {currentTab === 'settings' && (
          <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm">
            <CardHeader className="px-6 pt-6 pb-4">
              <CardTitle className="flex items-center text-xl">
                <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                  <i className="fas fa-cog text-white" />
                </div>
                Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <p className="text-slate-600">Settings configuration coming soon...</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* QR Code Modal */}
      {showQRModal && selectedVisitor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="backdrop-blur-xl bg-white/90 border-white/30 shadow-2xl max-w-md w-full">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200/50">
              <CardTitle className="flex items-center text-xl">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center mr-3">
                  <i className="fas fa-qrcode text-white text-sm" />
                </div>
                QR Code Badge
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowQRModal(false);
                  setSelectedVisitor(null);
                }}
                className="text-slate-500 hover:text-slate-700"
              >
                <i className="fas fa-times text-lg" />
              </Button>
            </CardHeader>
            <CardContent className="p-6 text-center">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-slate-900 mb-1">
                  {selectedVisitor.first_name} {selectedVisitor.last_name}
                </h3>
                {selectedVisitor.event_name && (
                  <p className="text-sm text-purple-600">{selectedVisitor.event_name}</p>
                )}
                <p className="text-sm text-slate-600 mt-1">Badge ID: {selectedVisitor.badge_id}</p>
              </div>
              <div className="w-64 h-64 bg-white border-4 border-slate-300 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <div className="text-center">
                  <i className="fas fa-qrcode text-6xl text-slate-400 mb-2" />
                  <p className="text-xs text-slate-500">QR Code: {selectedVisitor.qr_code}</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                This QR code can be displayed in the mobile app for access point scanning
              </p>
              <Button
                className="w-full !bg-[#2563eb] hover:!bg-blue-700 text-white"
                onClick={() => {
                  showSuccess('QR code copied to clipboard');
                  setShowQRModal(false);
                }}
              >
                <i className="fas fa-copy mr-2" />
                Copy QR Code
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Badge Print Modal */}
      {showBadgeModal && selectedVisitor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="backdrop-blur-xl bg-white/90 border-white/30 shadow-2xl max-w-md w-full">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200/50">
              <CardTitle className="flex items-center text-xl">
                <div className="w-8 h-8 bg-gradient-to-br from-green-700 to-green-800 rounded-lg flex items-center justify-center mr-3">
                  <i className="fas fa-id-card text-white text-sm" />
                </div>
                Print Badge
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowBadgeModal(false);
                  setSelectedVisitor(null);
                }}
                className="text-slate-500 hover:text-slate-700"
              >
                <i className="fas fa-times text-lg" />
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              <div className="border-2 border-slate-300 rounded-lg p-6 bg-white">
                <div className="text-center mb-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-700 to-blue-800 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white text-2xl font-bold">
                      {selectedVisitor.first_name[0]}{selectedVisitor.last_name[0]}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {selectedVisitor.first_name} {selectedVisitor.last_name}
                  </h3>
                  {selectedVisitor.event_name && (
                    <p className="text-sm text-purple-600 mt-1">{selectedVisitor.event_name}</p>
                  )}
                  <p className="text-sm text-slate-600 mt-2">Badge ID: {selectedVisitor.badge_id}</p>
                  {selectedVisitor.badge_expires_at && (
                    <p className="text-xs text-slate-500 mt-1">
                      Expires: {new Date(selectedVisitor.badge_expires_at).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="border-t border-slate-200 pt-4 mt-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600">Access Level:</span>
                    <span className="font-medium">{selectedVisitor.security_clearance}</span>
                  </div>
                  {selectedVisitor.access_points && selectedVisitor.access_points.length > 0 && (
                    <div className="text-sm">
                      <span className="text-slate-600">Access Points: </span>
                      <span className="font-medium">{selectedVisitor.access_points.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
              <Button
                className="w-full mt-4 !bg-[#2563eb] hover:!bg-blue-700 text-white"
                onClick={() => {
                  showSuccess('Badge sent to printer');
                  setShowBadgeModal(false);
                }}
              >
                <i className="fas fa-print mr-2" />
                Print Badge
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Visitors;
