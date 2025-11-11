import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Badge } from '../../components/UI/Badge';
import { Avatar } from '../../components/UI/Avatar';
import { cn } from '../../utils/cn';

// Types
interface EvidenceItem {
  id: string;
  type: 'photo' | 'video' | 'document' | 'cctv';
  title: string;
  date: string;
  size: string;
  tags: string[];
  source: string;
  cameraId?: string;
  incidentId?: string;
  uploadedBy: string;
  status: 'active' | 'archived' | 'pending';
  chainOfCustody: ChainOfCustodyEntry[];
}

interface ChainOfCustodyEntry {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  details: string;
}

interface EvidenceMetrics {
  totalFiles: number;
  totalSize: string;
  activeCases: number;
  pendingReview: number;
}

const tabs = [
  { id: 'overview', label: 'Overview', path: '/modules/evidence' },
  { id: 'files', label: 'Evidence Files', path: '/modules/evidence-files' },
  { id: 'custody', label: 'Chain of Custody', path: '/modules/evidence-custody' },
  { id: 'analytics', label: 'Analytics', path: '/modules/evidence-analytics' },
  { id: 'settings', label: 'Settings', path: '/modules/evidence-settings' }
];

const mockEvidenceItems: EvidenceItem[] = [
  {
    id: 'photo1',
    type: 'photo',
    title: 'Pool Area Incident - Camera 1',
    date: 'Jan 27, 16:45',
    size: '2.3 MB',
    tags: ['INC-001', 'Critical'],
    source: 'Mobile Upload',
    cameraId: 'CAM-001',
    incidentId: 'INC-001',
    uploadedBy: 'James Mitchell',
    status: 'active',
    chainOfCustody: [
      { id: '1', action: 'Uploaded', user: 'James Mitchell', timestamp: '16:45', details: 'Initial upload from mobile device' },
      { id: '2', action: 'Reviewed', user: 'Sarah Chen', timestamp: '17:20', details: 'Evidence review completed' }
    ]
  },
  {
    id: 'video1',
    type: 'video',
    title: 'CCTV - Lobby Entrance',
    date: 'Jan 27, 13:47',
    size: '156 MB',
    tags: ['INC-004', 'Low'],
    source: 'CCTV System',
    cameraId: 'CAM-002',
    incidentId: 'INC-004',
    uploadedBy: 'System Auto',
    status: 'active',
    chainOfCustody: [
      { id: '1', action: 'Auto Captured', user: 'System', timestamp: '13:47', details: 'Automatic capture from motion detection' }
    ]
  },
  {
    id: 'doc1',
    type: 'document',
    title: 'Witness Statement - Sarah Chen',
    date: 'Jan 27, 17:20',
    size: '245 KB',
    tags: ['INC-002', 'High'],
    source: 'Digital Upload',
    uploadedBy: 'Sarah Chen',
    status: 'active',
    chainOfCustody: [
      { id: '1', action: 'Uploaded', user: 'Sarah Chen', timestamp: '17:20', details: 'Witness statement document' }
    ]
  },
  {
    id: 'cctv1',
    type: 'cctv',
    title: 'Kitchen Fire Alarm',
    date: 'Jan 27, 14:12',
    size: '89 MB',
    tags: ['INC-003', 'Medium'],
    source: 'CCTV System',
    cameraId: 'CAM-003',
    incidentId: 'INC-003',
    uploadedBy: 'System Auto',
    status: 'active',
    chainOfCustody: [
      { id: '1', action: 'Auto Captured', user: 'System', timestamp: '14:12', details: 'Fire alarm triggered recording' }
    ]
  }
];

const mockMetrics: EvidenceMetrics = {
  totalFiles: 58,
  totalSize: '2.4 GB',
  activeCases: 12,
  pendingReview: 8
};

const EvidenceManagement: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<'all' | 'photo' | 'video' | 'document' | 'cctv'>('all');
  const [loading, setLoading] = useState(false);

  // Filtered evidence items
  const filteredItems = mockEvidenceItems.filter(item => {
    const text = (item.title + ' ' + item.tags.join(' ')).toLowerCase();
    const matchesSearch = text.includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || item.type === filter;
    return matchesSearch && matchesFilter;
  });

  const handleUploadEvidence = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Upload logic here
    } catch (error) {
      console.error('Failed to upload evidence:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleExportReport = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Export logic here
    } catch (error) {
      console.error('Failed to export report:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'photo': return 'fas fa-camera';
      case 'video': return 'fas fa-video';
      case 'document': return 'fas fa-file-alt';
      case 'cctv': return 'fas fa-video';
      default: return 'fas fa-file';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'photo': return 'bg-blue-100 text-blue-600';
      case 'video': return 'bg-green-100 text-green-600';
      case 'document': return 'bg-yellow-100 text-yellow-600';
      case 'cctv': return 'bg-purple-100 text-purple-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'archived': return 'secondary';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
  return (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="backdrop-blur-xl bg-white/90 border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-lg">
                      <i className="fas fa-folder text-white text-xl" />
                    </div>
                    <Badge variant="default" className="bg-slate-100 text-slate-700 border-slate-300">
                      Total
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-slate-900">
                      {mockMetrics.totalFiles}
                    </h3>
                    <p className="text-slate-600 text-sm">
                      Evidence Files
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/90 border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-lg">
                      <i className="fas fa-hdd text-white text-xl" />
                    </div>
                    <Badge variant="default" className="bg-slate-100 text-slate-700 border-slate-300">
                      Storage
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-slate-900">
                      {mockMetrics.totalSize}
                    </h3>
                    <p className="text-slate-600 text-sm">
                      Total Size
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/90 border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-lg">
                      <i className="fas fa-clipboard-list text-white text-xl" />
                    </div>
                    <Badge variant="default" className="bg-slate-100 text-slate-700 border-slate-300">
                      Active
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-slate-900">
                      {mockMetrics.activeCases}
                    </h3>
                    <p className="text-slate-600 text-sm">
                      Active Cases
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/90 border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-lg">
                      <i className="fas fa-clock text-white text-xl" />
                    </div>
                    <Badge variant="warning" className="bg-yellow-100 text-yellow-600 border-yellow-300">
                      Pending
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-slate-900">
                      {mockMetrics.pendingReview}
                    </h3>
                    <p className="text-slate-600 text-sm">
                      Pending Review
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Evidence */}
            <Card className="backdrop-blur-xl bg-white/90 border-slate-200/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <i className="fas fa-history mr-3 text-slate-600" />
                  Recent Evidence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockEvidenceItems.slice(0, 3).map((item) => (
                    <div key={item.id} className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                            <i className={`${getTypeIcon(item.type)} text-slate-600`} />
        </div>
                          <div>
                            <h4 className="font-semibold text-slate-900">{item.title}</h4>
                            <p className="text-slate-600 text-sm">{item.source} • {item.date}</p>
        </div>
      </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={getStatusColor(item.status)}>
                            {item.status}
                          </Badge>
                          <Badge variant="outline" className={getTypeColor(item.type)}>
                            {item.type.toUpperCase()}
                          </Badge>
                        </div>
            </div>
                      <div className="flex justify-between items-center text-sm text-slate-500">
                        <span>Size: {item.size}</span>
                        <span>By: {item.uploadedBy}</span>
            </div>
          </div>
        ))}
      </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'files':
        return (
          <div className="space-y-6">
            {/* Search and Filters */}
            <Card className="backdrop-blur-xl bg-white/90 border-slate-200/50 shadow-lg">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search evidence..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {[
                      { key: 'all', label: 'All Types' },
                      { key: 'photo', label: 'Photos' },
                      { key: 'video', label: 'Videos' },
                      { key: 'document', label: 'Documents' },
                      { key: 'cctv', label: 'CCTV' }
                    ].map(filterOption => (
                      <Button
                        key={filterOption.key}
                        variant={filter === filterOption.key ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter(filterOption.key as any)}
                        className={filter === filterOption.key ? 'bg-slate-600 hover:bg-slate-700 text-white' : 'text-slate-600 border-slate-300 hover:bg-slate-50'}
                      >
                        {filterOption.label}
                      </Button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={view === 'grid' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setView('grid')}
                      className={view === 'grid' ? 'bg-slate-600 hover:bg-slate-700 text-white' : 'text-slate-600 border-slate-300 hover:bg-slate-50'}
                    >
                      <i className="fas fa-th mr-1" />
                      Grid
                    </Button>
                    <Button
                      variant={view === 'list' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setView('list')}
                      className={view === 'list' ? 'bg-slate-600 hover:bg-slate-700 text-white' : 'text-slate-600 border-slate-300 hover:bg-slate-50'}
                    >
                      <i className="fas fa-list mr-1" />
                      List
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Evidence Files */}
            <div className={view === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
              {filteredItems.map((item) => (
                <Card key={item.id} className="backdrop-blur-xl bg-white/90 border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                          <i className={`${getTypeIcon(item.type)} text-slate-600 text-lg`} />
              </div>
                        <div>
                          <h4 className="font-semibold text-slate-900">{item.title}</h4>
                          <p className="text-slate-600 text-sm">{item.source} • {item.date}</p>
              </div>
            </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getStatusColor(item.status)}>
                          {item.status}
                        </Badge>
                        <Badge variant="outline" className={getTypeColor(item.type)}>
                          {item.type.toUpperCase()}
                        </Badge>
          </div>
                </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm text-slate-500">
                        <span>Size: {item.size}</span>
                        <span>By: {item.uploadedBy}</span>
                  </div>
                      
                      <div className="flex flex-wrap gap-2">
                    {item.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <i className="fas fa-eye mr-1" />
                          View
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <i className="fas fa-download mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                    ))}
                  </div>
          </div>
        );

      case 'custody':
        return (
          <div className="space-y-6">
            <Card className="backdrop-blur-xl bg-white/90 border-slate-200/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <i className="fas fa-shield-alt mr-3 text-slate-600" />
                  Chain of Custody
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {mockEvidenceItems.map((item) => (
                    <div key={item.id} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                            <i className={`${getTypeIcon(item.type)} text-slate-600`} />
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-900">{item.title}</h4>
                            <p className="text-slate-600 text-sm">{item.source} • {item.date}</p>
                          </div>
                        </div>
                        <Badge variant={getStatusColor(item.status)}>
                          {item.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-3">
                        {item.chainOfCustody.map((entry, index) => (
                          <div key={entry.id} className="flex items-center">
                            <div className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-semibold text-slate-600">{index + 1}</span>
                            </div>
                            <div className="ml-4 flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-slate-900">{entry.action}</span>
                                <span className="text-sm text-slate-500">{entry.timestamp}</span>
                              </div>
                              <p className="text-sm text-slate-600">{entry.user} • {entry.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return (
          <div className="space-y-6">
            <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl">
                  {activeTab === 'analytics' && 'Evidence Analytics'}
                  {activeTab === 'settings' && 'Evidence Settings'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Content for {activeTab} tab is coming soon...
                </p>
              </CardContent>
            </Card>
            </div>
        );
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
              <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl flex items-center justify-center shadow-lg">
                <i className="fas fa-folder-open text-white text-2xl" />
                  </div>
                </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-slate-900">
                Evidence Management
              </h1>
              <p className="text-slate-600 font-medium">
                Photos, videos, documents, and CCTV clips with chain of custody tracking
              </p>
                  </div>
                </div>
        </div>

        {/* Action Buttons - FAR RIGHT */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20">
          <div className="flex gap-3">
            <Button 
              variant="outline"
              onClick={handleExportReport}
              disabled={loading}
              className="backdrop-blur-sm bg-white/80 border-slate-300 hover:bg-slate-50 text-slate-700 shadow-lg px-6 py-3 text-lg"
            >
              <i className="fas fa-download mr-2" />
              Export Report
            </Button>
            <Button 
              onClick={handleUploadEvidence}
              disabled={loading}
              className="bg-slate-600 hover:bg-slate-700 text-white shadow-lg px-6 py-3 text-lg"
            >
              <i className="fas fa-upload mr-2" />
              Upload Evidence
            </Button>
                  </div>
                </div>
              </div>

      {/* Tab Navigation */}
      <div className="relative w-full backdrop-blur-xl bg-white/60 border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-center">
            <div className="flex space-x-1 bg-white/60 backdrop-blur-sm p-1 rounded-lg shadow-lg border border-white/30">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    activeTab === tab.id
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
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default EvidenceManagement; 