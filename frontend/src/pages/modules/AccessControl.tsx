import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter,
  Eye,
  Edit,
  Trash,
  Download,
  Key,
  Shield,
  UserCheck,
  AlertTriangle,
  Clock,
  MapPin,
  Smartphone,
  Fingerprint,
  CreditCard,
  Lock,
  Unlock,
  Users,
  Activity,
  Settings,
  Camera
} from 'lucide-react';

interface AccessEvent {
  event_id: string;
  user_id?: string;
  guest_id?: string;
  access_point: string;
  access_method: string;
  event_type: string;
  timestamp: string;
  location: any;
  device_info?: any;
  is_authorized: boolean;
  alert_triggered: boolean;
  photo_capture?: string;
  user_name?: string;
  guest_name?: string;
}

interface AccessPoint {
  id: string;
  name: string;
  location: string;
  type: 'entrance' | 'elevator' | 'room' | 'facility';
  status: 'active' | 'maintenance' | 'offline';
  access_methods: string[];
  last_activity: string;
}

interface DigitalKey {
  id: string;
  user_id: string;
  user_name: string;
  room_number: string;
  key_type: 'mobile' | 'card' | 'biometric';
  status: 'active' | 'expired' | 'revoked';
  created_at: string;
  expires_at: string;
  access_level: 'room' | 'floor' | 'building';
  permissions: string[];
}

interface CreateKeyForm {
  user_name: string;
  room_number: string;
  key_type: string;
  access_level: string;
  expires_at: string;
  permissions: string[];
}

const AccessControl: React.FC = () => {
  const [accessEvents, setAccessEvents] = useState<AccessEvent[]>([]);
  const [accessPoints, setAccessPoints] = useState<AccessPoint[]>([]);
  const [digitalKeys, setDigitalKeys] = useState<DigitalKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [authorizedFilter, setAuthorizedFilter] = useState('all');
  const [showCreateKeyModal, setShowCreateKeyModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AccessEvent | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [createKeyForm, setCreateKeyForm] = useState<CreateKeyForm>({
    user_name: '',
    room_number: '',
    key_type: 'mobile',
    access_level: 'room',
    expires_at: '',
    permissions: []
  });

  // Simulate access control data since we don't have a complete backend integration yet
  useEffect(() => {
    const mockAccessEvents: AccessEvent[] = [
      {
        event_id: '1',
        user_id: 'user-1',
        access_point: 'Main Entrance',
        access_method: 'mobile_key',
        event_type: 'access_granted',
        timestamp: '2024-01-15T14:30:00Z',
        location: { floor: '1', area: 'Lobby' },
        device_info: { device_type: 'iPhone', app_version: '2.1.0' },
        is_authorized: true,
        alert_triggered: false,
        user_name: 'John Smith'
      },
      {
        event_id: '2',
        guest_id: 'guest-1',
        access_point: 'Room 201',
        access_method: 'card_key',
        event_type: 'access_denied',
        timestamp: '2024-01-15T14:25:00Z',
        location: { floor: '2', area: 'Room 201' },
        device_info: { device_type: 'Card Reader', model: 'CR-2000' },
        is_authorized: false,
        alert_triggered: true,
        guest_name: 'Sarah Johnson'
      },
      {
        event_id: '3',
        user_id: 'user-2',
        access_point: 'Elevator A',
        access_method: 'biometric',
        event_type: 'access_granted',
        timestamp: '2024-01-15T14:20:00Z',
        location: { floor: '1', area: 'Elevator Lobby' },
        device_info: { device_type: 'Biometric Scanner', model: 'BS-500' },
        is_authorized: true,
        alert_triggered: false,
        user_name: 'Mike Wilson'
      }
    ];

    const mockAccessPoints: AccessPoint[] = [
      {
        id: '1',
        name: 'Main Entrance',
        location: 'Ground Floor',
        type: 'entrance',
        status: 'active',
        access_methods: ['mobile_key', 'card_key', 'biometric'],
        last_activity: '2024-01-15T14:30:00Z'
      },
      {
        id: '2',
        name: 'Elevator A',
        location: 'All Floors',
        type: 'elevator',
        status: 'active',
        access_methods: ['mobile_key', 'biometric'],
        last_activity: '2024-01-15T14:20:00Z'
      },
      {
        id: '3',
        name: 'Pool Area',
        location: 'Ground Floor',
        type: 'facility',
        status: 'active',
        access_methods: ['mobile_key', 'card_key'],
        last_activity: '2024-01-15T13:45:00Z'
      }
    ];

    const mockDigitalKeys: DigitalKey[] = [
      {
        id: '1',
        user_id: 'user-1',
        user_name: 'John Smith',
        room_number: '201',
        key_type: 'mobile',
        status: 'active',
        created_at: '2024-01-10T10:00:00Z',
        expires_at: '2024-01-20T10:00:00Z',
        access_level: 'room',
        permissions: ['room_access', 'elevator_access']
      },
      {
        id: '2',
        user_id: 'user-2',
        user_name: 'Mike Wilson',
        room_number: '305',
        key_type: 'card',
        status: 'active',
        created_at: '2024-01-12T14:00:00Z',
        expires_at: '2024-01-22T14:00:00Z',
        access_level: 'floor',
        permissions: ['room_access', 'elevator_access', 'floor_access']
      }
    ];

    setAccessEvents(mockAccessEvents);
    setAccessPoints(mockAccessPoints);
    setDigitalKeys(mockDigitalKeys);
    setLoading(false);
  }, []);

  const createDigitalKey = async (formData: CreateKeyForm) => {
    try {
      const newKey: DigitalKey = {
        id: String(digitalKeys.length + 1),
        user_id: `user-${Date.now()}`,
        user_name: formData.user_name,
        room_number: formData.room_number,
        key_type: formData.key_type as any,
        status: 'active',
        created_at: new Date().toISOString(),
        expires_at: formData.expires_at,
        access_level: formData.access_level as any,
        permissions: formData.permissions
      };

      setDigitalKeys(prev => [newKey, ...prev]);
      setShowCreateKeyModal(false);
      setCreateKeyForm({
        user_name: '',
        room_number: '',
        key_type: 'mobile',
        access_level: 'room',
        expires_at: '',
        permissions: []
      });
    } catch (err) {
      setError('Failed to create digital key');
    }
  };

  const revokeKey = async (keyId: string) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('Are you sure you want to revoke this key?')) return;

    try {
      setDigitalKeys(prev => prev.map(key => 
        key.id === keyId ? { ...key, status: 'revoked' } : key
      ));
    } catch (err) {
      setError('Failed to revoke key');
    }
  };

  const deleteEvent = async (eventId: string) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      setAccessEvents(prev => prev.filter(event => event.event_id !== eventId));
    } catch (err) {
      setError('Failed to delete event');
    }
  };

  const filteredEvents = accessEvents.filter(event => {
    const matchesSearch = 
      event.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.guest_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.access_point.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.access_method.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEventType = eventTypeFilter === 'all' || event.event_type === eventTypeFilter;
    const matchesAuthorized = authorizedFilter === 'all' || 
      (authorizedFilter === 'authorized' && event.is_authorized) ||
      (authorizedFilter === 'unauthorized' && !event.is_authorized);
    return matchesSearch && matchesEventType && matchesAuthorized;
  });

  const getEventTypeBadge = (eventType: string) => {
    const typeConfig = {
      access_granted: { color: 'bg-green-100 text-green-800', text: 'Granted' },
      access_denied: { color: 'bg-red-100 text-red-800', text: 'Denied' },
      key_expired: { color: 'bg-yellow-100 text-yellow-800', text: 'Expired' },
      suspicious_activity: { color: 'bg-orange-100 text-orange-800', text: 'Suspicious' }
    };
    const config = typeConfig[eventType as keyof typeof typeConfig] || typeConfig.access_granted;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getAccessMethodIcon = (method: string) => {
    switch (method) {
      case 'mobile_key': return <Smartphone className="h-4 w-4" />;
      case 'card_key': return <CreditCard className="h-4 w-4" />;
      case 'biometric': return <Fingerprint className="h-4 w-4" />;
      default: return <Key className="h-4 w-4" />;
    }
  };

  const getKeyStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', text: 'Active' },
      expired: { color: 'bg-red-100 text-red-800', text: 'Expired' },
      revoked: { color: 'bg-gray-100 text-gray-800', text: 'Revoked' }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Access Control</h1>
          <p className="text-gray-600">Digital key management and biometric verification system</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowCreateKeyModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Key
          </button>
          <button className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
            <Download className="h-5 w-5 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Total Events</p>
              <p className="text-2xl font-bold text-gray-900">{accessEvents.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Unlock className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Authorized</p>
              <p className="text-2xl font-bold text-gray-900">
                {accessEvents.filter(e => e.is_authorized).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <Lock className="h-5 w-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Denied</p>
              <p className="text-2xl font-bold text-gray-900">
                {accessEvents.filter(e => !e.is_authorized).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Key className="h-5 w-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Active Keys</p>
              <p className="text-2xl font-bold text-gray-900">
                {digitalKeys.filter(k => k.status === 'active').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'events', label: 'Access Events', icon: Activity },
              { id: 'keys', label: 'Digital Keys', icon: Key },
              { id: 'points', label: 'Access Points', icon: MapPin },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Events</option>
              <option value="access_granted">Access Granted</option>
              <option value="access_denied">Access Denied</option>
              <option value="key_expired">Key Expired</option>
              <option value="suspicious_activity">Suspicious Activity</option>
            </select>
            <select
              value={authorizedFilter}
              onChange={(e) => setAuthorizedFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Access</option>
              <option value="authorized">Authorized</option>
              <option value="unauthorized">Unauthorized</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'events' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Access Point
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEvents.map((event) => (
                  <tr key={event.event_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {event.user_name || event.guest_name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {event.user_id ? 'Staff' : 'Guest'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{event.access_point}</div>
                        <div className="text-sm text-gray-500">
                          {event.location?.floor && `Floor ${event.location.floor}`}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {getAccessMethodIcon(event.access_method)}
                        <span className="ml-2 text-sm text-gray-900">
                          {event.access_method.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getEventTypeBadge(event.event_type)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(event.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedEvent(event);
                            setShowDetailModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteEvent(event.event_id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Event"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'keys' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Room
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Key Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expires
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {digitalKeys.map((key) => (
                  <tr key={key.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{key.user_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{key.room_number}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {getAccessMethodIcon(key.key_type)}
                        <span className="ml-2 text-sm text-gray-900">
                          {key.key_type.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getKeyStatusBadge(key.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(key.expires_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => revokeKey(key.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Revoke Key"
                        >
                          <Lock className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'points' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accessPoints.map((point) => (
            <div key={point.id} className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium text-gray-900">{point.name}</h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  point.status === 'active' ? 'bg-green-100 text-green-800' :
                  point.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {point.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{point.location}</p>
              <div className="space-y-2">
                <div className="text-xs text-gray-500">Access Methods:</div>
                <div className="flex flex-wrap gap-1">
                  {point.access_methods.map((method) => (
                    <span key={method} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                      {method.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-500">
                Last activity: {new Date(point.last_activity).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Key Modal */}
      {showCreateKeyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create Digital Key</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              createDigitalKey(createKeyForm);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">User Name</label>
                  <input
                    type="text"
                    value={createKeyForm.user_name}
                    onChange={(e) => setCreateKeyForm({...createKeyForm, user_name: e.target.value})}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Room Number</label>
                  <input
                    type="text"
                    value={createKeyForm.room_number}
                    onChange={(e) => setCreateKeyForm({...createKeyForm, room_number: e.target.value})}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Key Type</label>
                  <select
                    value={createKeyForm.key_type}
                    onChange={(e) => setCreateKeyForm({...createKeyForm, key_type: e.target.value})}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="mobile">Mobile Key</option>
                    <option value="card">Card Key</option>
                    <option value="biometric">Biometric</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Access Level</label>
                  <select
                    value={createKeyForm.access_level}
                    onChange={(e) => setCreateKeyForm({...createKeyForm, access_level: e.target.value})}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="room">Room Only</option>
                    <option value="floor">Floor Access</option>
                    <option value="building">Building Access</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Expires At</label>
                  <input
                    type="datetime-local"
                    value={createKeyForm.expires_at}
                    onChange={(e) => setCreateKeyForm({...createKeyForm, expires_at: e.target.value})}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateKeyModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Access Event Details</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">User</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedEvent.user_name || selectedEvent.guest_name || 'Unknown'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedEvent.user_id ? 'Staff' : 'Guest'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Access Point</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedEvent.access_point}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Access Method</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedEvent.access_method}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1">{getEventTypeBadge(selectedEvent.event_type)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Authorized</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedEvent.is_authorized ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <p className="mt-1 text-sm text-gray-900">
                  {JSON.stringify(selectedEvent.location)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Timestamp</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(selectedEvent.timestamp).toLocaleString()}
                </p>
              </div>
              {selectedEvent.device_info && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Device Info</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {JSON.stringify(selectedEvent.device_info)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
};

export default AccessControl;
