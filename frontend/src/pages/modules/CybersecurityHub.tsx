import React, { useState, useEffect } from 'react';

interface DataItem {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'pending' | 'completed' | 'error';
  createdAt: string;
  updatedAt: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

const CybersecurityHub: React.FC = () => {
  const [items, setItems] = useState<DataItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data
  useEffect(() => {
    const mockData: DataItem[] = [
      {
        id: '1',
        title: 'Sample Item 1',
        description: 'This is a sample item for the Cybersecurity Hub module',
        status: 'active',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T14:30:00Z',
        priority: 'medium'
      },
      {
        id: '2',
        title: 'Sample Item 2',
        description: 'Another sample item with different status',
        status: 'pending',
        createdAt: '2024-01-15T11:00:00Z',
        updatedAt: '2024-01-15T12:00:00Z',
        priority: 'high'
      }
    ];
    setItems(mockData);
  }, []);

  const statusColors = {
    active: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-blue-100 text-blue-800',
    error: 'bg-red-100 text-red-800'
  };

  const priorityColors = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800'
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Cybersecurity Hub</h1>
            <p className="text-gray-600 mt-1">24/7 threat monitoring with AI-powered attack prevention</p>
          </div>
          <div className="flex gap-3">
            <button className="btn btn-secondary">
              <i className="fas fa-plus mr-2"></i>
              Add New
            </button>
            <button className="btn btn-primary">
              <i className="fas fa-download mr-2"></i>
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <i className="fas fa-list text-blue-600"></i>
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">{items.length}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <i className="fas fa-check-circle text-green-600"></i>
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">{items.filter(i => i.status === 'active').length}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <i className="fas fa-clock text-yellow-600"></i>
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{items.filter(i => i.status === 'pending').length}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <i className="fas fa-chart-line text-purple-600"></i>
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Analytics</p>
                <p className="text-2xl font-bold text-gray-900">24</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: 'fas fa-home' },
              { id: 'items', label: 'Items', icon: 'fas fa-list' },
              { id: 'analytics', label: 'Analytics', icon: 'fas fa-chart-bar' },
              { id: 'settings', label: 'Settings', icon: 'fas fa-cog' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <i className={`${tab.icon} mr-2`}></i>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card mb-6">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Search</label>
              <input
                type="text"
                placeholder="Search items..."
                className="input"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Status</label>
              <select className="select">
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="error">Error</option>
              </select>
            </div>
            <div>
              <label className="form-label">Priority</label>
              <select className="select">
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Recent Activity</h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {items.slice(0, 5).map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <h4 className="font-medium text-gray-900">{item.title}</h4>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                    <span className={`badge ${statusColors[item.status]}`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Quick Actions</h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-2 gap-3">
                <button className="btn btn-primary">
                  <i className="fas fa-plus mr-2"></i>
                  Add Item
                </button>
                <button className="btn btn-secondary">
                  <i className="fas fa-download mr-2"></i>
                  Export Data
                </button>
                <button className="btn btn-success">
                  <i className="fas fa-sync mr-2"></i>
                  Sync Data
                </button>
                <button className="btn btn-warning">
                  <i className="fas fa-cog mr-2"></i>
                  Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'items' && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">All Items</h3>
          </div>
          <div className="card-body p-0">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id}>
                      <td className="font-medium">{item.title}</td>
                      <td>{item.description}</td>
                      <td>
                        <span className={`badge ${statusColors[item.status]}`}>
                          {item.status}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${priorityColors[item.priority]}`}>
                          {item.priority}
                        </span>
                      </td>
                      <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="flex gap-2">
                          <button className="btn btn-sm btn-secondary">
                            <i className="fas fa-edit"></i>
                          </button>
                          <button className="btn btn-sm btn-danger">
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Analytics Overview</h3>
            </div>
            <div className="card-body">
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <i className="fas fa-chart-line text-4xl mb-2"></i>
                  <p>Analytics charts would be displayed here</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Performance Metrics</h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Items</span>
                  <span className="font-medium">{items.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active Items</span>
                  <span className="font-medium">{items.filter(i => i.status === 'active').length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Completion Rate</span>
                  <span className="font-medium">85%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">Module Settings</h3>
          </div>
          <div className="card-body">
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-3">General Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Module Name</label>
                    <input type="text" className="input" defaultValue="Cybersecurity Hub" />
                  </div>
                  <div>
                    <label className="form-label">Status</label>
                    <select className="select">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Notification Settings</h4>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" defaultChecked />
                    Enable email notifications
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" defaultChecked />
                    Enable SMS notifications
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    Enable push notifications
                  </label>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button className="btn btn-primary">Save Settings</button>
                <button className="btn btn-secondary">Reset to Default</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CybersecurityHub;
