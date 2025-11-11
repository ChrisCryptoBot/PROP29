import React, { useState, useEffect } from 'react';
import DataTable from '../../components/UI/DataTable';
import RealTimeChart from '../../components/UI/RealTimeChart';
import { useWebSocket } from '../../components/UI/WebSocketProvider';
import apiService from '../../services/ApiService';
import { showSuccess, showError, showLoading, dismissLoadingAndShowSuccess, dismissLoadingAndShowError } from '../../utils/toast';
import './ModulePanel.css';
import { ModuleService } from '../../services';
import BackToDashboardButton from '../../components/UI/BackToDashboardButton';

interface Report {
  id: string;
  title: string;
  type: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
  file_url?: string;
  parameters: any;
}

interface ReportAnalytics {
  total_reports: number;
  completed_reports: number;
  failed_reports: number;
  average_generation_time: number;
  reports_by_type: { [key: string]: number };
  reports_by_status: { [key: string]: number };
  daily_generation: { date: string; count: number }[];
}

const tabs = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'reports', label: 'Reports' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'history', label: 'History' }
];

const analytics = [
  { label: 'Reports Today', value: 6, color: '#3b82f6', description: 'Reports generated today' },
  { label: 'Critical Events', value: 2, color: '#ef4444', description: 'Critical events detected' },
  { label: 'AI Insights', value: 4, color: '#10b981', description: 'AI-driven insights' },
  { label: 'Avg Resolution', value: '3.2h', color: '#8b5cf6', description: 'Average event resolution' }
];

interface ReportEntry {
  id: number;
  title: string;
  category: string;
  description: string;
  date: string;
}

const AdvancedReports: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAddModal, setShowAddModal] = useState(false);
  const [reports, setReports] = useState<ReportEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [form, setForm] = useState({ title: '', category: '', description: '', date: '' });
  const moduleService = ModuleService.getInstance();

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const apiReports = await moduleService.getReports();
      setReports(apiReports);
    } catch (error) {
      console.error('Failed to load reports:', error);
      // Fallback to mock data
      setReports([
        { id: 1, title: 'Unauthorized Access', category: 'Security', description: 'AI flagged multiple failed logins', date: '2024-07-01' },
        { id: 2, title: 'Suspicious Package', category: 'Safety', description: 'Unattended package detected by camera', date: '2024-07-01' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.category || !form.description || !form.date) {
      showError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const newReport = await moduleService.createReport({
        title: form.title,
        category: form.category,
        description: form.description,
        date: form.date,
        type: 'manual',
        status: 'pending'
      });

      setReports(prev => [
        {
          id: newReport.id,
          title: newReport.title,
          category: newReport.category,
          description: newReport.description,
          date: newReport.date,
        },
        ...prev,
      ]);

      setForm({ title: '', category: '', description: '', date: '' });
      setShowAddModal(false);
      showSuccess('Report created successfully');
    } catch (error) {
      showError('Failed to create report');
      console.error('Error creating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async (reportId: string) => {
    setExportLoading(true);
    try {
      const blob = await moduleService.exportReport(reportId, 'pdf');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${reportId}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showSuccess('Report exported successfully');
    } catch (error) {
      showError('Failed to export report');
      console.error('Error exporting report:', error);
    } finally {
      setExportLoading(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <button 
                className="add-btn" 
                onClick={() => setShowAddModal(true)}
                disabled={loading}
              >
                <i className="fas fa-plus" style={{ marginRight: 6 }}></i> Add Report
              </button>
            </div>
            <div className="analytics-cards-row">
              {analytics.map(card => (
                <div className="analytics-card" key={card.label}>
                  <h4>{card.label}</h4>
                  <div className="analytics-value" style={{ color: card.color }}>{card.value}</div>
                  <p>{card.description}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 'reports':
        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <button 
                className="add-btn" 
                onClick={() => setShowAddModal(true)}
                disabled={loading}
              >
                <i className="fas fa-plus" style={{ marginRight: 6 }}></i> Add Report
              </button>
            </div>
            {loading ? (
              <div className="loading-spinner">Loading reports...</div>
            ) : (
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map(report => (
                    <tr key={report.id}>
                      <td>{report.title}</td>
                      <td>{report.category}</td>
                      <td>{report.description}</td>
                      <td>{report.date}</td>
                      <td>
                        <button 
                          className="btn btn-sm btn-primary"
                          onClick={() => handleExportReport(report.id.toString())}
                          disabled={exportLoading}
                        >
                          <i className={`fas fa-download ${exportLoading ? 'fa-spin' : ''}`}></i> Export
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );
      case 'analytics':
        return (
          <div>
            <h3>Analytics</h3>
            <p>AI-driven analytics and predictive event intelligence.</p>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <strong>Analytics Dashboard</strong>
                <button 
                  className="btn btn-primary"
                  onClick={() => handleExportReport('analytics')}
                  disabled={exportLoading}
                >
                  <i className={`fas fa-download ${exportLoading ? 'fa-spin' : ''}`}></i> Export Analytics
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '6px' }}>
                  <h4>Report Generation</h4>
                  <p>Total: {reports.length}</p>
                  <p>This Week: {reports.filter(r => new Date(r.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}</p>
                </div>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '6px' }}>
                  <h4>Categories</h4>
                  <p>Security: {reports.filter(r => r.category === 'Security').length}</p>
                  <p>Safety: {reports.filter(r => r.category === 'Safety').length}</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'history':
        return (
          <div>
            <h3>Report History</h3>
            <p>View all past reports and AI event logs.</p>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <strong>Report History</strong>
                <button 
                  className="btn btn-primary"
                  onClick={() => handleExportReport('history')}
                  disabled={exportLoading}
                >
                  <i className={`fas fa-download ${exportLoading ? 'fa-spin' : ''}`}></i> Export History
                </button>
              </div>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {reports.map(report => (
                  <div key={report.id} style={{ padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>
                    <strong>{report.title}</strong> - {report.category} ({report.date})
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="module-panel advanced-reports-panel">
      <div className="module-header">
        <h1 className="module-title">
          <i className="fas fa-brain" style={{ color: '#8b5cf6', marginRight: 12 }}></i>
          Advanced Reports
        </h1>
        <div className="module-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`module-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              disabled={loading}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="module-content">
        {renderTabContent()}
      </div>
      {/* Add Report Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Add New Report</h2>
            <form onSubmit={handleAddReport} style={{ display: 'grid', gap: 12 }}>
              <label>
                Report Title
                <input 
                  type="text" 
                  name="title"
                  value={form.title} 
                  onChange={handleFormChange} 
                  required 
                />
              </label>
              <label>
                Category
                <select 
                  name="category"
                  value={form.category} 
                  onChange={handleFormChange} 
                  required
                >
                  <option value="">Select Category</option>
                  <option value="Security">Security</option>
                  <option value="Safety">Safety</option>
                  <option value="Operations">Operations</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </label>
              <label>
                Description
                <textarea 
                  name="description"
                  value={form.description} 
                  onChange={handleFormChange} 
                  required 
                />
              </label>
              <label>
                Date
                <input 
                  type="date" 
                  name="date"
                  value={form.date} 
                  onChange={handleFormChange} 
                  required 
                />
              </label>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  style={{ background: '#3b82f6', color: 'white' }}
                >
                  {loading ? 'Creating...' : 'Create Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedReports;
