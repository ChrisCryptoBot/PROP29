import React, { useState, useEffect } from 'react';
import DataTable from '../UI/DataTable';
import apiService from '../../services/ApiService';
import { showError } from '../../utils/toast';

interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  resource_type: string;
  resource_id: string;
  timestamp: string;
  ip_address: string;
  user_agent: string;
  details?: any;
}

interface Column {
  key: string;
  label: string;
  header: string;
  accessorKey: string;
  cell?: ({ row }: any) => JSX.Element;
}

const AuditLogTable: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    user_id: '',
    action: '',
    resource_type: '',
    date_from: '',
    date_to: '',
  });

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      const response = await fetch('/api/audit-logs');
      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data);
      } else {
        setAuditLogs([]);
      }
    } catch (error) {
      showError('Failed to load audit logs');
      setAuditLogs([]);
      console.error('Audit log error:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns: Column[] = [
    {
      key: 'timestamp',
      label: 'Timestamp',
      header: 'Timestamp',
      accessorKey: 'timestamp',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <i className="fas fa-clock w-4 h-4 text-gray-500" />
          <span>{new Date(row.original.timestamp).toLocaleString()}</span>
        </div>
      ),
    },
    {
      key: 'user_name',
      label: 'User',
      header: 'User',
      accessorKey: 'user_name',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <i className="fas fa-user w-4 h-4 text-gray-500" />
          <span>{row.original.user_name}</span>
        </div>
      ),
    },
    {
      key: 'action',
      label: 'Action',
      header: 'Action',
      accessorKey: 'action',
      cell: ({ row }: any) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.original.action === 'LOGIN' ? 'bg-green-100 text-green-800' :
          row.original.action === 'ACCESS' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {row.original.action}
        </span>
      ),
    },
    {
      key: 'resource_type',
      label: 'Resource',
      header: 'Resource',
      accessorKey: 'resource_type',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <i className="fas fa-cog w-4 h-4 text-gray-500" />
          <span>{row.original.resource_type}</span>
        </div>
      ),
    },
    {
      key: 'ip_address',
      label: 'IP Address',
      header: 'IP Address',
      accessorKey: 'ip_address',
    },
    {
      key: 'details',
      label: 'Details',
      header: 'Details',
      accessorKey: 'details',
      cell: ({ row }: any) => (
        <button
          onClick={() => console.log('View details:', row.original.details)}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          View
        </button>
      ),
    },
  ];

  const filteredData = auditLogs.filter(log => {
    if (filters.user_id && !log.user_name.includes(filters.user_id)) return false;
    if (filters.action && !log.action.includes(filters.action)) return false;
    if (filters.resource_type && !log.resource_type.includes(filters.resource_type)) return false;
    if (filters.date_from && new Date(log.timestamp) < new Date(filters.date_from)) return false;
    if (filters.date_to && new Date(log.timestamp) > new Date(filters.date_to)) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Audit Log</h2>
        <button
          onClick={loadAuditLogs}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <input
            type="text"
            placeholder="Filter by user..."
            value={filters.user_id}
            onChange={(e) => setFilters(prev => ({ ...prev, user_id: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Filter by action..."
            value={filters.action}
            onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Filter by resource..."
            value={filters.resource_type}
            onChange={(e) => setFilters(prev => ({ ...prev, resource_type: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date"
            value={filters.date_from}
            onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date"
            value={filters.date_to}
            onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading audit logs...</p>
          </div>
        ) : (
          <DataTable
            data={filteredData}
            columns={columns}
          />
        )}
      </div>
    </div>
  );
};

export default AuditLogTable; 