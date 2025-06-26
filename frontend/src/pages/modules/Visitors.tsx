import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter,
  Eye,
  Edit,
  Trash,
  Download,
  Users,
  UserCheck,
  UserX,
  Clock,
  MapPin,
  Camera,
  Badge,
  Phone,
  Mail,
  Calendar,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Settings,
  QrCode
} from 'lucide-react';

interface Visitor {
  guest_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  room_number?: string;
  check_in_date?: string;
  check_out_date?: string;
  created_at: string;
  updated_at: string;
  preferences?: any;
  safety_concerns?: any[];
  status: 'checked_in' | 'checked_out' | 'scheduled' | 'cancelled';
  badge_id?: string;
  photo_url?: string;
  host_name?: string;
  purpose?: string;
  expected_duration?: string;
  access_level: 'restricted' | 'standard' | 'vip';
}

interface CreateVisitorForm {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  room_number: string;
  host_name: string;
  purpose: string;
  expected_duration: string;
  access_level: string;
  check_in_date: string;
  check_out_date: string;
}

const Visitors: React.FC = () => {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [accessLevelFilter, setAccessLevelFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [createForm, setCreateForm] = useState<CreateVisitorForm>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    room_number: '',
    host_name: '',
    purpose: '',
    expected_duration: '',
    access_level: 'standard',
    check_in_date: '',
    check_out_date: ''
  });

  // Simulate visitor data since we don't have a complete backend integration yet
  useEffect(() => {
    const mockVisitors: Visitor[] = [
      {
        guest_id: '1',
        first_name: 'Sarah',
        last_name: 'Johnson',
        email: 'sarah.j@email.com',
        phone: '+1-555-0123',
        room_number: '201',
        check_in_date: '2024-01-15T10:00:00Z',
        check_out_date: '2024-01-17T10:00:00Z',
        created_at: '2024-01-14T15:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        status: 'checked_in',
        badge_id: 'BADGE-001',
        photo_url: '/api/photos/visitor1.jpg',
        host_name: 'John Smith',
        purpose: 'Business Meeting',
        expected_duration: '2 days',
        access_level: 'standard'
      },
      {
        guest_id: '2',
        first_name: 'Mike',
        last_name: 'Wilson',
        email: 'mike.w@email.com',
        phone: '+1-555-0456',
        room_number: '305',
        check_in_date: '2024-01-15T14:00:00Z',
        created_at: '2024-01-15T13:00:00Z',
        updated_at: '2024-01-15T14:00:00Z',
        status: 'checked_in',
        badge_id: 'BADGE-002',
        photo_url: '/api/photos/visitor2.jpg',
        host_name: 'Jane Doe',
        purpose: 'Site Visit',
        expected_duration: '1 day',
        access_level: 'restricted'
      },
      {
        guest_id: '3',
        first_name: 'Emily',
        last_name: 'Davis',
        email: 'emily.d@email.com',
        phone: '+1-555-0789',
        room_number: '102',
        check_in_date: '2024-01-14T16:00:00Z',
        check_out_date: '2024-01-15T10:00:00Z',
        created_at: '2024-01-14T14:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        status: 'checked_out',
        badge_id: 'BADGE-003',
        photo_url: '/api/photos/visitor3.jpg',
        host_name: 'Robert Brown',
        purpose: 'Conference',
        expected_duration: '1 day',
        access_level: 'vip'
      }
    ];

    setVisitors(mockVisitors);
    setLoading(false);
  }, []);

  const createVisitor = async (formData: CreateVisitorForm) => {
    try {
      const badgeId = `BADGE-${String(visitors.length + 1).padStart(3, '0')}`;
      
      const newVisitor: Visitor = {
        guest_id: String(visitors.length + 1),
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        room_number: formData.room_number,
        host_name: formData.host_name,
        purpose: formData.purpose,
        expected_duration: formData.expected_duration,
        access_level: formData.access_level as any,
        check_in_date: formData.check_in_date,
        check_out_date: formData.check_out_date,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'scheduled',
        badge_id: badgeId
      };

      setVisitors(prev => [newVisitor, ...prev]);
      setShowCreateModal(false);
      setCreateForm({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        room_number: '',
        host_name: '',
        purpose: '',
        expected_duration: '',
        access_level: 'standard',
        check_in_date: '',
        check_out_date: ''
      });
    } catch (err) {
      setError('Failed to create visitor');
    }
  };

  const checkInVisitor = async (visitorId: string) => {
    try {
      setVisitors(prev => prev.map(visitor => 
        visitor.guest_id === visitorId 
          ? { 
              ...visitor, 
              status: 'checked_in',
              check_in_date: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          : visitor
      ));
    } catch (err) {
      setError('Failed to check in visitor');
    }
  };

  const checkOutVisitor = async (visitorId: string) => {
    try {
      setVisitors(prev => prev.map(visitor => 
        visitor.guest_id === visitorId 
          ? { 
              ...visitor, 
              status: 'checked_out',
              check_out_date: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          : visitor
      ));
    } catch (err) {
      setError('Failed to check out visitor');
    }
  };

  const deleteVisitor = async (visitorId: string) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('Are you sure you want to delete this visitor?')) return;

    try {
      setVisitors(prev => prev.filter(visitor => visitor.guest_id !== visitorId));
    } catch (err) {
      setError('Failed to delete visitor');
    }
  };

  const filteredVisitors = visitors.filter(visitor => {
    const matchesSearch = 
      visitor.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.host_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.room_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || visitor.status === statusFilter;
    const matchesAccessLevel = accessLevelFilter === 'all' || visitor.access_level === accessLevelFilter;
    return matchesSearch && matchesStatus && matchesAccessLevel;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      checked_in: { color: 'bg-green-100 text-green-800', text: 'Checked In', icon: CheckCircle },
      checked_out: { color: 'bg-gray-100 text-gray-800', text: 'Checked Out', icon: XCircle },
      scheduled: { color: 'bg-blue-100 text-blue-800', text: 'Scheduled', icon: Clock },
      cancelled: { color: 'bg-red-100 text-red-800', text: 'Cancelled', icon: XCircle }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled;
    const Icon = config.icon;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color} flex items-center`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.text}
      </span>
    );
  };

  const getAccessLevelBadge = (level: string) => {
    const levelConfig = {
      restricted: { color: 'bg-red-100 text-red-800', text: 'Restricted' },
      standard: { color: 'bg-blue-100 text-blue-800', text: 'Standard' },
      vip: { color: 'bg-purple-100 text-purple-800', text: 'VIP' }
    };
    const config = levelConfig[level as keyof typeof levelConfig] || levelConfig.standard;
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
          <h1 className="text-2xl font-bold text-gray-900">Visitor Management</h1>
          <p className="text-gray-600">Guest registration with facial recognition and badge tracking</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Register Visitor
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
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Total Visitors</p>
              <p className="text-2xl font-bold text-gray-900">{visitors.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserCheck className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Checked In</p>
              <p className="text-2xl font-bold text-gray-900">
                {visitors.filter(v => v.status === 'checked_in').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Scheduled</p>
              <p className="text-2xl font-bold text-gray-900">
                {visitors.filter(v => v.status === 'scheduled').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Badge className="h-5 w-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Active Badges</p>
              <p className="text-2xl font-bold text-gray-900">
                {visitors.filter(v => v.status === 'checked_in' && v.badge_id).length}
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
              { id: 'overview', label: 'Overview', icon: Users },
              { id: 'visitors', label: 'Visitors', icon: Users },
              { id: 'badges', label: 'Badges', icon: Badge },
              { id: 'analytics', label: 'Analytics', icon: Activity },
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
                placeholder="Search visitors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="checked_in">Checked In</option>
              <option value="checked_out">Checked Out</option>
              <option value="scheduled">Scheduled</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={accessLevelFilter}
              onChange={(e) => setAccessLevelFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Access Levels</option>
              <option value="restricted">Restricted</option>
              <option value="standard">Standard</option>
              <option value="vip">VIP</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'visitors' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Visitor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Host
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Access Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check In
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVisitors.map((visitor) => (
                  <tr key={visitor.guest_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {visitor.photo_url ? (
                            <img className="h-10 w-10 rounded-full" src={visitor.photo_url} alt="" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <Users className="h-5 w-5 text-gray-500" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {visitor.first_name} {visitor.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{visitor.email}</div>
                          <div className="text-xs text-gray-400">Room {visitor.room_number}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{visitor.host_name}</div>
                        <div className="text-sm text-gray-500">{visitor.purpose}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(visitor.status)}
                    </td>
                    <td className="px-6 py-4">
                      {getAccessLevelBadge(visitor.access_level)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {visitor.check_in_date ? new Date(visitor.check_in_date).toLocaleDateString() : 'Not checked in'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedVisitor(visitor);
                            setShowDetailModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {visitor.status === 'scheduled' && (
                          <button
                            onClick={() => checkInVisitor(visitor.guest_id)}
                            className="text-green-600 hover:text-green-900"
                            title="Check In"
                          >
                            <UserCheck className="h-4 w-4" />
                          </button>
                        )}
                        {visitor.status === 'checked_in' && (
                          <button
                            onClick={() => checkOutVisitor(visitor.guest_id)}
                            className="text-orange-600 hover:text-orange-900"
                            title="Check Out"
                          >
                            <UserX className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteVisitor(visitor.guest_id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Visitor"
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

      {activeTab === 'badges' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visitors.filter(v => v.badge_id).map((visitor) => (
            <div key={visitor.guest_id} className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium text-gray-900">{visitor.badge_id}</h3>
                {getStatusBadge(visitor.status)}
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <strong>Visitor:</strong> {visitor.first_name} {visitor.last_name}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Host:</strong> {visitor.host_name}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Room:</strong> {visitor.room_number}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Access Level:</strong> {visitor.access_level}
                </p>
                {visitor.check_in_date && (
                  <p className="text-sm text-gray-600">
                    <strong>Check In:</strong> {new Date(visitor.check_in_date).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="mt-3 flex justify-center">
                <QrCode className="h-16 w-16 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Visitor Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Register New Visitor</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              createVisitor(createForm);
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <input
                    type="text"
                    value={createForm.first_name}
                    onChange={(e) => setCreateForm({...createForm, first_name: e.target.value})}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    type="text"
                    value={createForm.last_name}
                    onChange={(e) => setCreateForm({...createForm, last_name: e.target.value})}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({...createForm, phone: e.target.value})}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Room Number</label>
                  <input
                    type="text"
                    value={createForm.room_number}
                    onChange={(e) => setCreateForm({...createForm, room_number: e.target.value})}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Host Name</label>
                  <input
                    type="text"
                    value={createForm.host_name}
                    onChange={(e) => setCreateForm({...createForm, host_name: e.target.value})}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Purpose</label>
                  <input
                    type="text"
                    value={createForm.purpose}
                    onChange={(e) => setCreateForm({...createForm, purpose: e.target.value})}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Expected Duration</label>
                  <input
                    type="text"
                    value={createForm.expected_duration}
                    onChange={(e) => setCreateForm({...createForm, expected_duration: e.target.value})}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 2 hours, 1 day"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Access Level</label>
                  <select
                    value={createForm.access_level}
                    onChange={(e) => setCreateForm({...createForm, access_level: e.target.value})}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="restricted">Restricted</option>
                    <option value="standard">Standard</option>
                    <option value="vip">VIP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Check In Date</label>
                  <input
                    type="datetime-local"
                    value={createForm.check_in_date}
                    onChange={(e) => setCreateForm({...createForm, check_in_date: e.target.value})}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Check Out Date</label>
                  <input
                    type="datetime-local"
                    value={createForm.check_out_date}
                    onChange={(e) => setCreateForm({...createForm, check_out_date: e.target.value})}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Register Visitor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedVisitor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Visitor Details</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                {selectedVisitor.photo_url ? (
                  <img className="h-16 w-16 rounded-full" src={selectedVisitor.photo_url} alt="" />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                    <Users className="h-8 w-8 text-gray-500" />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {selectedVisitor.first_name} {selectedVisitor.last_name}
                  </h3>
                  <p className="text-sm text-gray-500">{selectedVisitor.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedVisitor.status)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Access Level</label>
                  <div className="mt-1">{getAccessLevelBadge(selectedVisitor.access_level)}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedVisitor.phone}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Room Number</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedVisitor.room_number}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Host</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedVisitor.host_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Purpose</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedVisitor.purpose}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Expected Duration</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedVisitor.expected_duration}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Badge ID</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedVisitor.badge_id}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Check In</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedVisitor.check_in_date ? new Date(selectedVisitor.check_in_date).toLocaleString() : 'Not checked in'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Check Out</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedVisitor.check_out_date ? new Date(selectedVisitor.check_out_date).toLocaleString() : 'Not checked out'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created</label>
                  <p className="mt-1 text-sm text-gray-900">{new Date(selectedVisitor.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Updated</label>
                  <p className="mt-1 text-sm text-gray-900">{new Date(selectedVisitor.updated_at).toLocaleString()}</p>
                </div>
              </div>
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

export default Visitors;
