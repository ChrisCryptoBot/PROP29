import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter,
  Eye,
  Edit,
  Trash,
  Download,
  Package as PackageIcon,
  CheckCircle,
  Clock,
  AlertTriangle,
  QrCode,
  Bell,
  Truck,
  User,
  MapPin,
  Calendar,
  Phone,
  Mail
} from 'lucide-react';

interface Package {
  id: string;
  tracking_number: string;
  recipient_name: string;
  recipient_room: string;
  recipient_phone: string;
  recipient_email: string;
  sender_name: string;
  sender_company: string;
  package_type: 'delivery' | 'pickup' | 'storage';
  status: 'received' | 'notified' | 'delivered' | 'picked_up' | 'expired';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  received_at: string;
  delivered_at?: string;
  location: string;
  description: string;
  weight?: number;
  dimensions?: string;
  barcode?: string;
  notes?: string;
  notification_sent: boolean;
  notification_count: number;
  last_notification?: string;
}

interface CreatePackageForm {
  recipient_name: string;
  recipient_room: string;
  recipient_phone: string;
  recipient_email: string;
  sender_name: string;
  sender_company: string;
  package_type: string;
  priority: string;
  description: string;
  weight?: number;
  dimensions?: string;
}

const Packages: React.FC = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [createForm, setCreateForm] = useState<CreatePackageForm>({
    recipient_name: '',
    recipient_room: '',
    recipient_phone: '',
    recipient_email: '',
    sender_name: '',
    sender_company: '',
    package_type: 'delivery',
    priority: 'medium',
    description: ''
  });

  // Simulate package data since we don't have a backend model yet
  useEffect(() => {
    const mockPackages: Package[] = [
      {
        id: '1',
        tracking_number: 'PKG-2024-001',
        recipient_name: 'John Smith',
        recipient_room: '201',
        recipient_phone: '+1-555-0123',
        recipient_email: 'john.smith@email.com',
        sender_name: 'Amazon',
        sender_company: 'Amazon.com',
        package_type: 'delivery',
        status: 'received',
        priority: 'medium',
        received_at: '2024-01-15T10:00:00Z',
        location: 'Front Desk',
        description: 'Small package, likely electronics',
        weight: 2.5,
        dimensions: '12x8x4 inches',
        barcode: '123456789012',
        notification_sent: false,
        notification_count: 0
      },
      {
        id: '2',
        tracking_number: 'PKG-2024-002',
        recipient_name: 'Sarah Johnson',
        recipient_room: '305',
        recipient_phone: '+1-555-0456',
        recipient_email: 'sarah.j@email.com',
        sender_name: 'FedEx',
        sender_company: 'FedEx Corporation',
        package_type: 'delivery',
        status: 'notified',
        priority: 'high',
        received_at: '2024-01-15T09:30:00Z',
        location: 'Package Room',
        description: 'Large box, fragile items',
        weight: 15.0,
        dimensions: '24x18x12 inches',
        barcode: '987654321098',
        notification_sent: true,
        notification_count: 2,
        last_notification: '2024-01-15T14:00:00Z'
      },
      {
        id: '3',
        tracking_number: 'PKG-2024-003',
        recipient_name: 'Mike Wilson',
        recipient_room: '102',
        recipient_phone: '+1-555-0789',
        recipient_email: 'mike.w@email.com',
        sender_name: 'UPS',
        sender_company: 'United Parcel Service',
        package_type: 'delivery',
        status: 'delivered',
        priority: 'low',
        received_at: '2024-01-14T16:00:00Z',
        delivered_at: '2024-01-15T11:00:00Z',
        location: 'Delivered to Room',
        description: 'Document envelope',
        weight: 0.5,
        dimensions: '9x12 inches',
        barcode: '456789123456',
        notification_sent: true,
        notification_count: 1
      }
    ];
    
    setPackages(mockPackages);
    setLoading(false);
  }, []);

  const createPackage = async (formData: CreatePackageForm) => {
    try {
      // Generate tracking number
      const trackingNumber = `PKG-${new Date().getFullYear()}-${String(packages.length + 1).padStart(3, '0')}`;
      const barcode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      const newPackage: Package = {
        id: String(packages.length + 1),
        tracking_number: trackingNumber,
        recipient_name: formData.recipient_name,
        recipient_room: formData.recipient_room,
        recipient_phone: formData.recipient_phone,
        recipient_email: formData.recipient_email,
        sender_name: formData.sender_name,
        sender_company: formData.sender_company,
        package_type: formData.package_type as any,
        status: 'received',
        priority: formData.priority as any,
        received_at: new Date().toISOString(),
        location: 'Front Desk',
        description: formData.description,
        weight: formData.weight,
        dimensions: formData.dimensions,
        barcode: barcode,
        notification_sent: false,
        notification_count: 0
      };

      setPackages(prev => [newPackage, ...prev]);
      setShowCreateModal(false);
      setCreateForm({
        recipient_name: '',
        recipient_room: '',
        recipient_phone: '',
        recipient_email: '',
        sender_name: '',
        sender_company: '',
        package_type: 'delivery',
        priority: 'medium',
        description: ''
      });
    } catch (err) {
      setError('Failed to create package');
    }
  };

  const updatePackageStatus = async (packageId: string, newStatus: Package['status']) => {
    try {
      setPackages(prev => prev.map(pkg => 
        pkg.id === packageId 
          ? { 
              ...pkg, 
              status: newStatus,
              delivered_at: newStatus === 'delivered' ? new Date().toISOString() : pkg.delivered_at
            }
          : pkg
      ));
    } catch (err) {
      setError('Failed to update package status');
    }
  };

  const sendNotification = async (packageId: string) => {
    try {
      setPackages(prev => prev.map(pkg => 
        pkg.id === packageId 
          ? { 
              ...pkg, 
              notification_sent: true,
              notification_count: pkg.notification_count + 1,
              last_notification: new Date().toISOString()
            }
          : pkg
      ));
    } catch (err) {
      setError('Failed to send notification');
    }
  };

  const deletePackage = async (packageId: string) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('Are you sure you want to delete this package?')) return;

    try {
      setPackages(prev => prev.filter(pkg => pkg.id !== packageId));
    } catch (err) {
      setError('Failed to delete package');
    }
  };

  const filteredPackages = packages.filter(pkg => {
    const matchesSearch = 
      pkg.tracking_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.recipient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.recipient_room.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.sender_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || pkg.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || pkg.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      received: { color: 'bg-blue-100 text-blue-800', text: 'Received' },
      notified: { color: 'bg-yellow-100 text-yellow-800', text: 'Notified' },
      delivered: { color: 'bg-green-100 text-green-800', text: 'Delivered' },
      picked_up: { color: 'bg-purple-100 text-purple-800', text: 'Picked Up' },
      expired: { color: 'bg-red-100 text-red-800', text: 'Expired' }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.received;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { color: 'bg-gray-100 text-gray-800', text: 'Low' },
      medium: { color: 'bg-blue-100 text-blue-800', text: 'Medium' },
      high: { color: 'bg-orange-100 text-orange-800', text: 'High' },
      urgent: { color: 'bg-red-100 text-red-800', text: 'Urgent' }
    };
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
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
          <h1 className="text-2xl font-bold text-gray-900">Package Management</h1>
          <p className="text-gray-600">Barcode scanning, guest notifications, and delivery tracking</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Package
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
              <PackageIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Total Packages</p>
              <p className="text-2xl font-bold text-gray-900">{packages.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Delivered</p>
              <p className="text-2xl font-bold text-gray-900">
                {packages.filter(p => p.status === 'delivered').length}
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
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {packages.filter(p => p.status === 'received' || p.status === 'notified').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Bell className="h-5 w-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Notifications</p>
              <p className="text-2xl font-bold text-gray-900">
                {packages.reduce((sum, p) => sum + p.notification_count, 0)}
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
              { id: 'overview', label: 'Overview', icon: PackageIcon },
              { id: 'items', label: 'Packages', icon: PackageIcon },
              { id: 'analytics', label: 'Analytics', icon: PackageIcon },
              { id: 'settings', label: 'Settings', icon: PackageIcon }
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
                placeholder="Search packages..."
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
              <option value="received">Received</option>
              <option value="notified">Notified</option>
              <option value="delivered">Delivered</option>
              <option value="picked_up">Picked Up</option>
              <option value="expired">Expired</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Packages Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Package
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recipient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Received
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPackages.map((pkg) => (
                <tr key={pkg.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{pkg.tracking_number}</div>
                      <div className="text-sm text-gray-500">{pkg.description}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {pkg.sender_name} • {pkg.weight}kg
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{pkg.recipient_name}</div>
                      <div className="text-sm text-gray-500">Room {pkg.recipient_room}</div>
                      <div className="text-xs text-gray-400">{pkg.recipient_phone}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(pkg.status)}
                  </td>
                  <td className="px-6 py-4">
                    {getPriorityBadge(pkg.priority)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(pkg.received_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedPackage(pkg);
                          setShowDetailModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {pkg.status === 'received' && (
                        <button
                          onClick={() => sendNotification(pkg.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Send Notification"
                        >
                          <Bell className="h-4 w-4" />
                        </button>
                      )}
                      {pkg.status === 'notified' && (
                        <button
                          onClick={() => updatePackageStatus(pkg.id, 'delivered')}
                          className="text-purple-600 hover:text-purple-900"
                          title="Mark Delivered"
                        >
                          <Truck className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deletePackage(pkg.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Package"
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

      {/* Create Package Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Add New Package</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              createPackage(createForm);
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Recipient Name</label>
                  <input
                    type="text"
                    value={createForm.recipient_name}
                    onChange={(e) => setCreateForm({...createForm, recipient_name: e.target.value})}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Room Number</label>
                  <input
                    type="text"
                    value={createForm.recipient_room}
                    onChange={(e) => setCreateForm({...createForm, recipient_room: e.target.value})}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    value={createForm.recipient_phone}
                    onChange={(e) => setCreateForm({...createForm, recipient_phone: e.target.value})}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={createForm.recipient_email}
                    onChange={(e) => setCreateForm({...createForm, recipient_email: e.target.value})}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sender Name</label>
                  <input
                    type="text"
                    value={createForm.sender_name}
                    onChange={(e) => setCreateForm({...createForm, sender_name: e.target.value})}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sender Company</label>
                  <input
                    type="text"
                    value={createForm.sender_company}
                    onChange={(e) => setCreateForm({...createForm, sender_company: e.target.value})}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Package Type</label>
                  <select
                    value={createForm.package_type}
                    onChange={(e) => setCreateForm({...createForm, package_type: e.target.value})}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="delivery">Delivery</option>
                    <option value="pickup">Pickup</option>
                    <option value="storage">Storage</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <select
                    value={createForm.priority}
                    onChange={(e) => setCreateForm({...createForm, priority: e.target.value})}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm({...createForm, description: e.target.value})}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
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
                  Create Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedPackage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Package Details</h2>
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
                  <label className="block text-sm font-medium text-gray-700">Tracking Number</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedPackage.tracking_number}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedPackage.status)}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Recipient</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedPackage.recipient_name}</p>
                  <p className="text-xs text-gray-500">Room {selectedPackage.recipient_room}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedPackage.recipient_phone}</p>
                  <p className="text-xs text-gray-500">{selectedPackage.recipient_email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sender</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedPackage.sender_name}</p>
                  <p className="text-xs text-gray-500">{selectedPackage.sender_company}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <div className="mt-1">{getPriorityBadge(selectedPackage.priority)}</div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <p className="mt-1 text-sm text-gray-900">{selectedPackage.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Weight</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedPackage.weight} kg</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Dimensions</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedPackage.dimensions}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Received</label>
                  <p className="mt-1 text-sm text-gray-900">{new Date(selectedPackage.received_at).toLocaleString()}</p>
                </div>
                {selectedPackage.delivered_at && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Delivered</label>
                    <p className="mt-1 text-sm text-gray-900">{new Date(selectedPackage.delivered_at).toLocaleString()}</p>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Barcode</label>
                <p className="mt-1 text-sm text-gray-900 font-mono">{selectedPackage.barcode}</p>
              </div>
              {selectedPackage.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedPackage.notes}</p>
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

export default Packages;
