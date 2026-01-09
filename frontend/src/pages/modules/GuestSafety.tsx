import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Badge } from '../../components/UI/Badge';
import { cn } from '../../utils/cn';
import { showError, showSuccess, showLoading, dismissLoadingAndShowSuccess, dismissLoadingAndShowError } from '../../utils/toast';

interface GuestIncident {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  type: 'medical' | 'security' | 'maintenance' | 'service' | 'noise' | 'other';
  guestName: string;
  guestRoom: string;
  guestType: 'VIP' | 'Family' | 'Business' | 'Regular';
  description: string;
  reportedTime: string;
  status: 'reported' | 'responding' | 'resolved';
  assignedTeam?: string;
  responseTime?: number;
  guestAvatar: string;
  icon: string;
  iconColor: string;
}

interface ResponseTeam {
  id: string;
  name: string;
  role: string;
  status: 'available' | 'responding' | 'offline';
  avatar: string;
}

interface SafetyMetrics {
  critical: number;
  high: number;
  medium: number;
  low: number;
  resolvedToday: number;
  avgResponseTime: string;
  categories: { [key: string]: number };
  responseMetrics: {
    avgResponseTime: string;
    resolutionRate: string;
    guestSatisfaction: string;
  };
}

const tabs = [
  { id: 'incidents', label: 'Incidents' },
  { id: 'mass-notification', label: 'Mass Notification' },
  { id: 'response-teams', label: 'Response Teams' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'settings', label: 'Settings' }
];

const mockIncidents: GuestIncident[] = [
  {
    id: '1',
    priority: 'critical',
    type: 'medical',
    guestName: 'John Smith',
    guestRoom: 'Room 318',
    guestType: 'VIP',
    description: 'Medical emergency - guest experiencing chest pain',
    reportedTime: '2 min ago',
    status: 'reported',
    guestAvatar: 'JS',
    icon: 'fas fa-heartbeat',
    iconColor: '#ef4444'
  },
  {
    id: '2',
    priority: 'high',
    type: 'security',
    guestName: 'Sarah Johnson',
    guestRoom: 'Room 567',
    guestType: 'Business',
    description: 'Security concern - suspicious activity reported',
    reportedTime: '15 min ago',
    status: 'responding',
    assignedTeam: 'Security Team Alpha',
    responseTime: 5,
    guestAvatar: 'SJ',
    icon: 'fas fa-shield-alt',
    iconColor: '#f59e0b'
  },
  {
    id: '3',
    priority: 'medium',
    type: 'maintenance',
    guestName: 'Mike Davis',
    guestRoom: 'Room 423',
    guestType: 'Regular',
    description: 'Air conditioning not working properly',
    reportedTime: '1 hour ago',
    status: 'resolved',
    guestAvatar: 'MD',
    icon: 'fas fa-tools',
    iconColor: '#10b981'
  },
  {
    id: '4',
    priority: 'low',
    type: 'service',
    guestName: 'Emily Brown',
    guestRoom: 'Room 234',
    guestType: 'Family',
    description: 'Extra towels requested',
    reportedTime: '2 hours ago',
    status: 'resolved',
    guestAvatar: 'EB',
    icon: 'fas fa-concierge-bell',
    iconColor: '#6b7280'
  }
];

const mockTeams: ResponseTeam[] = [
  { id: '1', name: 'Security Team Alpha', role: 'Security', status: 'available', avatar: 'SA' },
  { id: '2', name: 'Medical Response Team', role: 'Medical', status: 'responding', avatar: 'MR' },
  { id: '3', name: 'Maintenance Crew', role: 'Maintenance', status: 'available', avatar: 'MC' },
  { id: '4', name: 'Guest Services', role: 'Service', status: 'available', avatar: 'GS' }
];

const GuestSafety: React.FC = () => {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<GuestIncident[]>(mockIncidents);
  const [teams, setTeams] = useState<ResponseTeam[]>(mockTeams);
  const [metrics, setMetrics] = useState<SafetyMetrics>({
    critical: 1,
    high: 1,
    medium: 1,
    low: 1,
    resolvedToday: 12,
    avgResponseTime: '4.2 min',
    categories: {
      medical: 1,
      security: 1,
      maintenance: 1,
      service: 1
    },
    responseMetrics: {
      avgResponseTime: '4.2 min',
      resolutionRate: '94.2%',
      guestSatisfaction: '4.8/5'
    }
  });
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedIncident, setSelectedIncident] = useState<GuestIncident | null>(null);
  const [messageText, setMessageText] = useState('');
  const [activeTab, setActiveTab] = useState('incidents');
  
  // Type assertion to fix TypeScript strict literal type inference
  const currentTab = activeTab as any;
  const [massNotificationData, setMassNotificationData] = useState({
    message: '',
    recipients: 'all',
    priority: 'normal',
    channels: ['in_app', 'sms', 'email']
  });
  const [recentActivity, setRecentActivity] = useState([
    { time: '2 min ago', content: 'Critical Alert: Medical emergency reported in Room 318' },
    { time: '5 min ago', content: 'Security team dispatched to Room 567' },
    { time: '8 min ago', content: 'Maintenance request resolved - Room 423' },
    { time: '12 min ago', content: 'Guest assistance provided - Room 156' },
    { time: '15 min ago', content: 'Noise complaint resolved - Floor 8' }
  ]);

  // Authentication check - Removed redirect to non-existent route
  // If authentication is needed, implement proper auth flow
  // useEffect(() => {
  //   const isAdmin = localStorage.getItem('admin_guestsafety_authenticated');
  //   if (!isAdmin) {
  //     navigate('/modules/GuestSafetyAuth');
  //   }
  // }, [navigate]);


  const handleAssignTeam = useCallback(async (incidentId: string, teamId: string) => {
    let toastId: string | undefined;
    try {
      toastId = showLoading('Assigning team...');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIncidents(prev => prev.map(incident => 
        incident.id === incidentId 
          ? { ...incident, status: 'responding' as const, assignedTeam: teams.find(t => t.id === teamId)?.name }
          : incident
      ));
      
      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Team assigned successfully');
      }
    } catch (error) {
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to assign team');
      }
    }
  }, [teams]);

  const handleResolveIncident = useCallback(async (incidentId: string) => {
    let toastId: string | undefined;
    try {
      toastId = showLoading('Resolving incident...');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIncidents(prev => prev.map(incident => 
        incident.id === incidentId 
          ? { ...incident, status: 'resolved' as const }
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

  const handleSendMessage = useCallback(async (incidentId: string, message: string) => {
    let toastId: string | undefined;
    try {
      toastId = showLoading('Sending message...');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMessageText('');
      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Message sent successfully');
      }
    } catch (error) {
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to send message');
      }
    }
  }, []);

  const handleMassNotification = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    let toastId: string | undefined;
    try {
      toastId = showLoading('Sending mass notification...');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Mass notification sent successfully');
      }
      setMassNotificationData({
        message: '',
        recipients: 'all',
        priority: 'normal',
        channels: ['in_app', 'sms', 'email']
      });
    } catch (error) {
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to send mass notification');
      }
    }
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'warning';
      case 'medium': return 'success';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reported': return 'destructive';
      case 'responding': return 'warning';
      case 'resolved': return 'success';
      default: return 'secondary';
    }
  };

  const filteredIncidents = incidents.filter(incident => {
    if (activeFilter === 'all') return true;
    return incident.status === activeFilter;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* HEADER - GOLD STANDARD LAYOUT */}
      <div className="w-full backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg relative">
        
        {/* Title Section - CENTER */}
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
                <i className="fas fa-user-shield text-white text-2xl" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                <i className="fas fa-bell text-white text-xs" />
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-slate-900">
                Guest Panic Alerts
              </h1>
              <p className="text-slate-600 font-medium">
                Monitor, respond, and manage guest safety incidents in real time
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
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Critical Incidents */}
          <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-lg">
                  <i className="fas fa-exclamation-triangle text-white text-xl" />
                </div>
                <Badge variant="destructive" className="animate-pulse">
                  Critical
                </Badge>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-slate-900">
                  {metrics.critical}
                </h3>
                <p className="text-slate-600 text-sm">
                  Critical Incidents
                </p>
              </div>
            </CardContent>
          </Card>

          {/* High Priority */}
          <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-lg">
                  <i className="fas fa-exclamation-circle text-white text-xl" />
                </div>
                <Badge variant="warning" className="animate-pulse">
                  High
                </Badge>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-slate-900">
                  {metrics.high}
                </h3>
                <p className="text-slate-600 text-sm">
                  High Priority
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Resolved Today */}
          <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-lg">
                  <i className="fas fa-check-circle text-white text-xl" />
                </div>
                <Badge variant="success" className="animate-pulse">
                  Resolved
                </Badge>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-slate-900">
                  {metrics.resolvedToday}
                </h3>
                <p className="text-slate-600 text-sm">
                  Resolved Today
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Avg Response Time */}
          <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-lg">
                  <i className="fas fa-clock text-white text-xl" />
                </div>
                <Badge variant="default" className="animate-pulse">
                  Response
                </Badge>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-slate-900">
                  {metrics.avgResponseTime}
                </h3>
                <p className="text-slate-600 text-sm">
                  Avg Response Time
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Medium Priority */}
          <Card className="backdrop-blur-xl bg-white/90 border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-lg">
                  <i className="fas fa-exclamation text-white text-xl" />
                </div>
                <Badge variant="default" className="animate-pulse">
                  Medium
                </Badge>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-slate-900">
                  {metrics.medium}
                </h3>
                <p className="text-slate-600 text-sm">
                  Medium Priority
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Low Priority */}
          <Card className="backdrop-blur-xl bg-white/90 border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-lg">
                  <i className="fas fa-info-circle text-white text-xl" />
                </div>
                <Badge variant="default" className="animate-pulse">
                  Low
                </Badge>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-slate-900">
                  {metrics.low}
                </h3>
                <p className="text-slate-600 text-sm">
                  Low Priority
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Content */}
        {currentTab === 'incidents' && (
          <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl mb-8">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <i className="fas fa-exclamation-triangle mr-3 text-orange-600" />
                Active Incidents
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Filter Buttons */}
              <div className="flex gap-2 mb-6">
                <Button
                  variant={activeFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setActiveFilter('all')}
                  className="text-sm"
                >
                  All Incidents
                </Button>
                <Button
                  variant={activeFilter === 'reported' ? 'default' : 'outline'}
                  onClick={() => setActiveFilter('reported')}
                  className="text-sm"
                >
                  Reported
                </Button>
                <Button
                  variant={activeFilter === 'responding' ? 'default' : 'outline'}
                  onClick={() => setActiveFilter('responding')}
                  className="text-sm"
                >
                  Responding
                </Button>
                <Button
                  variant={activeFilter === 'resolved' ? 'default' : 'outline'}
                  onClick={() => setActiveFilter('resolved')}
                  className="text-sm"
                >
                  Resolved
                </Button>
              </div>

              {/* Incidents Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredIncidents.map(incident => (
                  <Card 
                    key={incident.id}
                    className={cn(
                      "backdrop-blur-sm bg-white/60 border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1",
                      incident.priority === 'critical' && "border-red-200/50 bg-red-50/60",
                      incident.priority === 'high' && "border-orange-200/50 bg-orange-50/60",
                      incident.priority === 'medium' && "border-green-200/50 bg-green-50/60",
                      incident.priority === 'low' && "border-gray-200/50 bg-gray-50/60"
                    )}
                    onClick={() => setSelectedIncident(incident)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-slate-900">{incident.guestName}</h4>
                        <Badge variant={getPriorityColor(incident.priority)}>
                          {incident.priority.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Room:</span>
                          <span className="font-medium">{incident.guestRoom}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Type:</span>
                          <span className="font-medium">{incident.type}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Status:</span>
                          <Badge variant={getStatusColor(incident.status)} size="sm">
                            {incident.status}
                          </Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Time:</span>
                          <span className="font-medium">{incident.reportedTime}</span>
                        </div>
                      </div>
                      
                      <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                        {incident.description}
                      </p>
                      
                      <div className="flex gap-2">
                        <Button 
                          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm"
                          disabled={incident.status === 'resolved'}
                        >
                          {incident.status === 'reported' ? 'Assign Team' : incident.status === 'responding' ? 'View Details' : 'Resolved'}
                        </Button>
                        <Button 
                          variant="outline"
                          className="flex-1 text-slate-600 border-slate-300 hover:bg-slate-50 text-sm"
                        >
                          Message
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions - Always Visible */}
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
                className="bg-slate-600 hover:bg-slate-700 text-white"
                onClick={() => setActiveTab('mass-notification')}
              >
                <i className="fas fa-bullhorn mr-2" />
                Send Alert
              </Button>
              <Button 
                variant="outline"
                className="text-slate-600 border-slate-300 hover:bg-slate-50"
                onClick={() => setActiveTab('response-teams')}
              >
                <i className="fas fa-users mr-2" />
                Deploy Teams
              </Button>
              <Button 
                variant="outline"
                className="text-slate-600 border-slate-300 hover:bg-slate-50"
                onClick={() => setActiveTab('analytics')}
              >
                <i className="fas fa-chart-bar mr-2" />
                View Reports
              </Button>
              <Button 
                variant="outline"
                className="text-slate-600 border-slate-300 hover:bg-slate-50"
                onClick={() => setActiveTab('settings')}
              >
                <i className="fas fa-cogs mr-2" />
                Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Mass Notification Section */}
        {currentTab === 'mass-notification' && (
          <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <i className="fas fa-bullhorn mr-3 text-orange-600" />
                Mass Notification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleMassNotification} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Message
                  </label>
                  <textarea
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    rows={4}
                    placeholder="Enter your message..."
                    value={massNotificationData.message}
                    onChange={(e) => setMassNotificationData(prev => ({ ...prev, message: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Recipients
                    </label>
                    <select
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      value={massNotificationData.recipients}
                      onChange={(e) => setMassNotificationData(prev => ({ ...prev, recipients: e.target.value }))}
                    >
                      <option value="all">All Guests</option>
                      <option value="vip">VIP Guests Only</option>
                      <option value="floor">Specific Floor</option>
                      <option value="room">Specific Room</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Priority
                    </label>
                    <select
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      value={massNotificationData.priority}
                      onChange={(e) => setMassNotificationData(prev => ({ ...prev, priority: e.target.value }))}
                    >
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 px-4 rounded-xl font-semibold"
                  disabled={!massNotificationData.message.trim()}
                >
                  <i className="fas fa-bullhorn mr-2" />
                  Send Mass Notification
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Response Teams Section */}
        {currentTab === 'response-teams' && (
          <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <i className="fas fa-users mr-3 text-orange-600" />
                Response Teams
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {teams.map(team => (
                  <Card 
                    key={team.id}
                    className={cn(
                      "backdrop-blur-sm bg-white/60 border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1",
                      team.status === 'available' && "border-green-200/50 bg-green-50/60",
                      team.status === 'responding' && "border-orange-200/50 bg-orange-50/60",
                      team.status === 'offline' && "border-gray-200/50 bg-gray-50/60"
                    )}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <span className="text-white font-bold text-lg">{team.avatar}</span>
                      </div>
                      <h4 className="font-bold text-slate-900 mb-2">{team.name}</h4>
                      <p className="text-slate-600 text-sm mb-3">{team.role}</p>
                      <Badge variant={team.status === 'available' ? 'success' : team.status === 'responding' ? 'warning' : 'secondary'}>
                        {team.status}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analytics Section */}
        {currentTab === 'analytics' && (
          <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <i className="fas fa-chart-bar mr-3 text-orange-600" />
                Safety Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-slate-900 mb-2">{metrics.responseMetrics.avgResponseTime}</div>
                  <p className="text-slate-600">Average Response Time</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-slate-900 mb-2">{metrics.responseMetrics.resolutionRate}</div>
                  <p className="text-slate-600">Resolution Rate</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-slate-900 mb-2">{metrics.responseMetrics.guestSatisfaction}</div>
                  <p className="text-slate-600">Guest Satisfaction</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Settings Section */}
        {currentTab === 'settings' && (
          <div className="space-y-6">
            <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <i className="fas fa-cogs mr-3 text-slate-600" />
                  Safety Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Alert Threshold (minutes)
                      </label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                        placeholder="5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Auto-Escalation
                      </label>
                      <select className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500">
                        <option>Enabled</option>
                        <option>Disabled</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Notification Channels
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input type="checkbox" className="mr-2" defaultChecked />
                          <span className="text-sm text-slate-600">In-App Notifications</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" className="mr-2" defaultChecked />
                          <span className="text-sm text-slate-600">SMS Alerts</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" className="mr-2" defaultChecked />
                          <span className="text-sm text-slate-600">Email Notifications</span>
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Response Team Assignment
                      </label>
                      <select className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500">
                        <option>Automatic</option>
                        <option>Manual</option>
                        <option>Round Robin</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-4">
                    <Button variant="outline" className="text-slate-600 border-slate-300 hover:bg-slate-50">
                      Reset to Defaults
                    </Button>
                    <Button className="bg-slate-600 hover:bg-slate-700 text-white">
                      Save Settings
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Incident Details Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="backdrop-blur-xl bg-white/90 border-white/30 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl">Incident Details</CardTitle>
              <Button
                variant="outline"
                onClick={() => setSelectedIncident(null)}
                className="text-slate-600 hover:text-slate-800"
              >
                <i className="fas fa-times"></i>
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">{selectedIncident.guestName}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Room:</span>
                      <span className="font-medium">{selectedIncident.guestRoom}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Type:</span>
                      <span className="font-medium">{selectedIncident.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Priority:</span>
                      <Badge variant={getPriorityColor(selectedIncident.priority)}>
                        {selectedIncident.priority}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Status:</span>
                      <Badge variant={getStatusColor(selectedIncident.status)}>
                        {selectedIncident.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-slate-900 mb-2">Description</h4>
                  <p className="text-slate-600 mb-4">{selectedIncident.description}</p>
                  
                  <div className="flex gap-2">
                    <Button 
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                      disabled={selectedIncident.status === 'resolved'}
                    >
                      {selectedIncident.status === 'reported' ? 'Assign Team' : 'Resolve'}
                    </Button>
                    <Button 
                      variant="outline"
                      className="text-slate-600 border-slate-300 hover:bg-slate-50"
                    >
                      Send Message
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default GuestSafety;