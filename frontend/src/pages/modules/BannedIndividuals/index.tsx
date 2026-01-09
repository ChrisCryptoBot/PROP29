import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/UI/Card';
import { Button } from '../../../components/UI/Button';
import { cn } from '../../../utils/cn';
import { showLoading, dismissLoadingAndShowSuccess, dismissLoadingAndShowError, showError, showSuccess } from '../../../utils/toast';
import { RiskAssessmentPanel, PatternDetectionPanel } from '../../../components/BannedIndividualsModule';
import { bannedIndividualsAI } from '../../../services/BannedIndividualsAIService';

interface BannedIndividual {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  reason: string;
  banType: 'TEMPORARY' | 'PERMANENT' | 'CONDITIONAL';
  banStartDate: string;
  banEndDate?: string;
  identificationNumber: string;
  identificationType: string;
  photoUrl?: string;
  notes: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REMOVED';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  bannedBy: string;
  createdAt: string;
  updatedAt: string;
  detectionCount: number;
  lastDetection?: string;
  facialRecognitionData?: any;
}

interface DetectionAlert {
  id: string;
  individualId: string;
  individualName: string;
  location: string;
  timestamp: string;
  confidence: number;
  status: 'ACTIVE' | 'RESOLVED' | 'FALSE_POSITIVE';
  responseTime: number;
  actionTaken: string;
  notes?: string;
}

interface FacialRecognitionStats {
  accuracy: number;
  trainingStatus: 'TRAINED' | 'TRAINING' | 'NEEDS_TRAINING';
  totalFaces: number;
  activeModels: number;
  lastTraining: string;
}

interface BannedIndividualsMetrics {
  activeBans: number;
  recentDetections: number;
  facialRecognitionAccuracy: number;
  chainWideBans: number;
}

const BannedIndividuals: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [showAdvancedFiltersModal, setShowAdvancedFiltersModal] = useState(false);
  const [showPhotoUploadModal, setShowPhotoUploadModal] = useState(false);
  const [selectedIndividual, setSelectedIndividual] = useState<BannedIndividual | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Filter and search state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterRiskLevel, setFilterRiskLevel] = useState<string>('ALL');
  const [filterBanType, setFilterBanType] = useState<string>('ALL');
  const [filterNationality, setFilterNationality] = useState<string>('ALL');
  
  // Bulk operations
  const [selectedIndividuals, setSelectedIndividuals] = useState<string[]>([]);
  
  // Ban expiration notifications
  const [expiringBans, setExpiringBans] = useState<BannedIndividual[]>([]);
  
  // Type assertion to fix TypeScript strict literal type inference
  const currentTab = activeTab as any;

  // Mock data
  const [bannedIndividuals, setBannedIndividuals] = useState<BannedIndividual[]>([
    {
      id: '1',
      firstName: 'John',
      lastName: 'Smith',
      dateOfBirth: '1985-03-15',
      nationality: 'US',
      reason: 'Aggressive behavior and threats to staff',
      banType: 'TEMPORARY',
      banStartDate: '2024-01-10',
      banEndDate: '2024-07-10',
      identificationNumber: 'US123456789',
      identificationType: 'Passport',
      photoUrl: '/api/placeholder/150/150',
      notes: 'Subject was aggressive towards front desk staff and made threats. Security was called.',
      status: 'ACTIVE',
      riskLevel: 'HIGH',
      bannedBy: 'Security Manager',
      createdAt: '2024-01-10T10:30:00Z',
      updatedAt: '2024-01-10T10:30:00Z',
      detectionCount: 2,
      lastDetection: '2024-01-15T14:22:00Z'
    },
    {
      id: '2',
      firstName: 'Sarah',
      lastName: 'Johnson',
      dateOfBirth: '1990-08-22',
      nationality: 'CA',
      reason: 'Fraudulent credit card usage',
      banType: 'PERMANENT',
      banStartDate: '2024-01-12',
      identificationNumber: 'CA987654321',
      identificationType: 'Driver License',
      photoUrl: '/api/placeholder/150/150',
      notes: 'Used stolen credit card for multiple transactions. Police report filed.',
      status: 'ACTIVE',
      riskLevel: 'CRITICAL',
      bannedBy: 'Front Desk Manager',
      createdAt: '2024-01-12T16:45:00Z',
      updatedAt: '2024-01-12T16:45:00Z',
      detectionCount: 1,
      lastDetection: '2024-01-12T16:45:00Z'
    }
  ]);

  const [detectionAlerts, setDetectionAlerts] = useState<DetectionAlert[]>([
    {
      id: '1',
      individualId: '1',
      individualName: 'John Smith',
      location: 'Main Lobby',
      timestamp: '2024-01-15T14:22:00Z',
      confidence: 94.2,
      status: 'RESOLVED',
      responseTime: 3,
      actionTaken: 'Security notified, subject escorted out',
      notes: 'Subject attempted to enter through main lobby. Facial recognition triggered alert.'
    },
    {
      id: '2',
      individualId: '2',
      individualName: 'Sarah Johnson',
      location: 'Restaurant',
      timestamp: '2024-01-12T16:45:00Z',
      confidence: 98.7,
      status: 'RESOLVED',
      responseTime: 2,
      actionTaken: 'Subject identified and removed from premises',
      notes: 'Subject was dining in restaurant when recognized.'
    }
  ]);

  const [facialRecognitionStats, setFacialRecognitionStats] = useState<FacialRecognitionStats>({
    accuracy: 96.8,
    trainingStatus: 'TRAINED',
    totalFaces: 1247,
    activeModels: 3,
    lastTraining: '2024-01-10T09:00:00Z'
  });

  const [metrics, setMetrics] = useState<BannedIndividualsMetrics>({
    activeBans: 2,
    recentDetections: 2,
    facialRecognitionAccuracy: 96.8,
    chainWideBans: 1
  });

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'management', label: 'Individual Management' },
    { id: 'facial-recognition', label: 'Facial Recognition' },
    { id: 'detections', label: 'Detection Alerts' },
    { id: 'ai-analytics', label: 'AI Analytics' },
    { id: 'analytics', label: 'Analytics & Reports' },
    { id: 'settings', label: 'Settings' }
  ];
  
  // Check for expiring bans
  useEffect(() => {
    const now = new Date();
    const expiring = bannedIndividuals.filter(ind => {
      if (!ind.banEndDate || ind.status !== 'ACTIVE') return false;
      const endDate = new Date(ind.banEndDate);
      const daysUntilExpiry = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    });
    setExpiringBans(expiring);
  }, [bannedIndividuals]);
  
  // Filtered individuals
  const filteredIndividuals = bannedIndividuals.filter(ind => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!ind.firstName.toLowerCase().includes(query) &&
          !ind.lastName.toLowerCase().includes(query) &&
          !ind.identificationNumber.toLowerCase().includes(query) &&
          !ind.reason.toLowerCase().includes(query)) {
        return false;
      }
    }
    if (filterStatus !== 'ALL' && ind.status !== filterStatus) return false;
    if (filterRiskLevel !== 'ALL' && ind.riskLevel !== filterRiskLevel) return false;
    if (filterBanType !== 'ALL' && ind.banType !== filterBanType) return false;
    if (filterNationality !== 'ALL' && ind.nationality !== filterNationality) return false;
    return true;
  });

  const handleCreateIndividual = useCallback(async (formData: any) => {
    let toastId: string | undefined;
    try {
      toastId = showLoading('Creating banned individual...');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newIndividual: BannedIndividual = {
        id: Date.now().toString(),
        ...formData,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        detectionCount: 0
      };
      
      setBannedIndividuals(prev => [newIndividual, ...prev]);
      setMetrics(prev => ({ ...prev, activeBans: prev.activeBans + 1 }));
      
      dismissLoadingAndShowSuccess(toastId, 'Banned individual created successfully');
      setShowCreateModal(false);
    } catch (error) {
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to create banned individual');
      }
    }
  }, []);

  const handleViewDetails = (individual: BannedIndividual) => {
    setSelectedIndividual(individual);
    setShowDetailsModal(true);
  };
  
  // Bulk import/export handlers
  const handleBulkImport = async (file: File) => {
    const toastId = showLoading('Importing individuals...');
    try {
      // Simulate CSV parsing
      const text = await file.text();
      const lines = text.split('\n').slice(1); // Skip header
      const imported: BannedIndividual[] = [];
      
      lines.forEach((line, index) => {
        if (!line.trim()) return;
        const [firstName, lastName, nationality, reason, banType, riskLevel] = line.split(',');
        if (firstName && lastName) {
          imported.push({
            id: `imported-${Date.now()}-${index}`,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            dateOfBirth: '',
            nationality: nationality?.trim() || 'UNKNOWN',
            reason: reason?.trim() || '',
            banType: (banType?.trim() as any) || 'TEMPORARY',
            banStartDate: new Date().toISOString().split('T')[0],
            identificationNumber: '',
            identificationType: 'Unknown',
            notes: '',
            status: 'ACTIVE',
            riskLevel: (riskLevel?.trim() as any) || 'MEDIUM',
            bannedBy: 'Bulk Import',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            detectionCount: 0
          });
        }
      });
      
      setBannedIndividuals(prev => [...imported, ...prev]);
      setMetrics(prev => ({ ...prev, activeBans: prev.activeBans + imported.length }));
      dismissLoadingAndShowSuccess(toastId, `Successfully imported ${imported.length} individuals`);
      setShowBulkImportModal(false);
    } catch (error) {
      dismissLoadingAndShowError(toastId, 'Failed to import file');
    }
  };
  
  const handleBulkExport = () => {
    const csv = [
      ['First Name', 'Last Name', 'Nationality', 'Reason', 'Ban Type', 'Risk Level', 'Status', 'Ban Start Date', 'Ban End Date'].join(','),
      ...bannedIndividuals.map(ind => [
        ind.firstName,
        ind.lastName,
        ind.nationality,
        `"${ind.reason.replace(/"/g, '""')}"`,
        ind.banType,
        ind.riskLevel,
        ind.status,
        ind.banStartDate,
        ind.banEndDate || ''
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `banned-individuals-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showSuccess('Export completed successfully');
  };
  
  // Photo upload handler
  const handlePhotoUpload = async (file: File, individualId: string) => {
    const toastId = showLoading('Uploading photo and training facial recognition...');
    try {
      // Simulate upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const photoUrl = URL.createObjectURL(file);
      setBannedIndividuals(prev => prev.map(ind => 
        ind.id === individualId ? { ...ind, photoUrl } : ind
      ));
      
      setFacialRecognitionStats(prev => ({
        ...prev,
        totalFaces: prev.totalFaces + 1,
        lastTraining: new Date().toISOString()
      }));
      
      dismissLoadingAndShowSuccess(toastId, 'Photo uploaded and facial recognition model updated');
      setShowPhotoUploadModal(false);
    } catch (error) {
      dismissLoadingAndShowError(toastId, 'Failed to upload photo');
    }
  };
  
  // Toggle individual selection
  const handleToggleSelection = (id: string) => {
    setSelectedIndividuals(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };
  
  // Bulk delete
  const handleBulkDelete = () => {
    if (selectedIndividuals.length === 0) {
      showError('No individuals selected');
      return;
    }
    
    if (window.confirm(`Are you sure you want to remove ${selectedIndividuals.length} individual(s)?`)) {
      setBannedIndividuals(prev => prev.filter(ind => !selectedIndividuals.includes(ind.id)));
      setMetrics(prev => ({ ...prev, activeBans: Math.max(0, prev.activeBans - selectedIndividuals.length) }));
      setSelectedIndividuals([]);
      showSuccess(`${selectedIndividuals.length} individual(s) removed`);
    }
  };

  // Gold Standard Badge Helper Functions
  const getRiskLevelBadgeClass = (riskLevel: string): string => {
    switch (riskLevel) {
      case 'LOW': return 'text-green-800 bg-green-100';
      case 'MEDIUM': return 'text-yellow-800 bg-yellow-100';
      case 'HIGH': return 'text-orange-800 bg-orange-100';
      case 'CRITICAL': return 'text-red-800 bg-red-100';
      default: return 'text-slate-800 bg-slate-100';
    }
  };

  const getBanTypeBadgeClass = (banType: string): string => {
    switch (banType) {
      case 'TEMPORARY': return 'text-blue-800 bg-blue-100';
      case 'PERMANENT': return 'text-red-800 bg-red-100';
      case 'CONDITIONAL': return 'text-yellow-800 bg-yellow-100';
      default: return 'text-slate-800 bg-slate-100';
    }
  };

  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case 'ACTIVE': return 'text-green-800 bg-green-100';
      case 'EXPIRED': return 'text-slate-800 bg-slate-100';
      case 'REMOVED': return 'text-red-800 bg-red-100';
      default: return 'text-slate-800 bg-slate-100';
    }
  };

  const getDetectionStatusBadgeClass = (status: string): string => {
    switch (status) {
      case 'ACTIVE': return 'text-red-800 bg-red-100';
      case 'RESOLVED': return 'text-green-800 bg-green-100';
      case 'FALSE_POSITIVE': return 'text-yellow-800 bg-yellow-100';
      default: return 'text-slate-800 bg-slate-100';
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
              <div className="w-16 h-16 bg-gradient-to-br from-blue-700 to-blue-800 rounded-2xl flex items-center justify-center shadow-lg">
                <i className="fas fa-user-times text-white text-2xl" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center animate-pulse">
                <i className="fas fa-exclamation text-white text-xs" />
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-slate-900">
                Banned Individuals
              </h1>
              <p className="text-slate-600 font-medium">
                Manage security bans and facial recognition monitoring
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
      <div className="max-w-[1800px] mx-auto px-6 py-8">
        {/* Overview Tab */}
        {currentTab === 'overview' && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
                <CardContent className="pt-6 px-6 pb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-xl flex items-center justify-center shadow-lg mt-2">
                      <i className="fas fa-user-slash text-white text-xl" />
                    </div>
                    <span className="px-2.5 py-1 text-xs font-semibold rounded text-green-800 bg-green-100">
                      Active
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-blue-600">
                      {metrics.activeBans}
                    </h3>
                    <p className="text-slate-600 font-medium">Active Bans</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
                <CardContent className="pt-6 px-6 pb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center shadow-lg mt-2">
                      <i className="fas fa-exclamation-triangle text-white text-xl" />
                    </div>
                    <span className="px-2.5 py-1 text-xs font-semibold rounded text-red-800 bg-red-100">
                      Recent
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-blue-600">
                      {metrics.recentDetections}
                    </h3>
                    <p className="text-slate-600 font-medium">Recent Detections</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
                <CardContent className="pt-6 px-6 pb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-xl flex items-center justify-center shadow-lg mt-2">
                      <i className="fas fa-eye text-white text-xl" />
                    </div>
                    <span className="px-2.5 py-1 text-xs font-semibold rounded text-blue-800 bg-blue-100">
                      Accuracy
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-blue-600">
                      {metrics.facialRecognitionAccuracy}%
                    </h3>
                    <p className="text-slate-600 font-medium">Facial Recognition</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
                <CardContent className="pt-6 px-6 pb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-xl flex items-center justify-center shadow-lg mt-2">
                      <i className="fas fa-building text-white text-xl" />
                    </div>
                    <span className="px-2.5 py-1 text-xs font-semibold rounded text-blue-800 bg-blue-100">
                      Chain
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-blue-600">
                      {metrics.chainWideBans}
                    </h3>
                    <p className="text-slate-600 font-medium">Chain-wide Bans</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Banned Individuals */}
            <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center shadow-lg mr-3">
                    <i className="fas fa-users text-white text-lg" />
                  </div>
                  Recent Banned Individuals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bannedIndividuals.slice(0, 2).map((individual) => (
                    <div 
                      key={individual.id}
                      className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleViewDetails(individual)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-slate-500 to-slate-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold">
                            {individual.firstName.charAt(0)}{individual.lastName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">
                            {individual.firstName} {individual.lastName}
                          </h3>
                          <p className="text-sm text-slate-600">{individual.reason}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={cn("px-2.5 py-1 text-xs font-semibold rounded", getRiskLevelBadgeClass(individual.riskLevel))}>
                          {individual.riskLevel}
                        </span>
                        <span className={cn("px-2.5 py-1 text-xs font-semibold rounded", getBanTypeBadgeClass(individual.banType))}>
                          {individual.banType}
                        </span>
                        <span className={cn("px-2.5 py-1 text-xs font-semibold rounded", getStatusBadgeClass(individual.status))}>
                          {individual.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Facial Recognition Intelligence */}
            <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center shadow-lg mr-3">
                    <i className="fas fa-brain text-white text-lg" />
                  </div>
                  Facial Recognition Intelligence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <i className="fas fa-check-circle text-white text-2xl" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Training Status</h3>
                    <p className="text-slate-600">{facialRecognitionStats.trainingStatus}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <i className="fas fa-chart-line text-white text-2xl" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Detection Accuracy</h3>
                    <p className="text-slate-600">{facialRecognitionStats.accuracy}%</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <i className="fas fa-eye text-white text-2xl" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Real-time Monitoring</h3>
                    <p className="text-slate-600">Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ban Expiration Notifications */}
            {expiringBans.length > 0 && (
              <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl border-l-4 border-yellow-500">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-lg flex items-center justify-center shadow-lg mr-3">
                      <i className="fas fa-clock text-white text-lg" />
                    </div>
                    Expiring Bans ({expiringBans.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {expiringBans.slice(0, 3).map((ind) => {
                      const endDate = new Date(ind.banEndDate!);
                      const daysLeft = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                      return (
                        <div key={ind.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                          <div>
                            <span className="font-semibold text-slate-900">{ind.firstName} {ind.lastName}</span>
                            <span className="text-sm text-slate-600 ml-2">
                              - {daysLeft} day{daysLeft !== 1 ? 's' : ''} until expiration
                            </span>
                          </div>
                          <Button
                            size="sm"
                            className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
                            onClick={() => handleViewDetails(ind)}
                          >
                            Review
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center shadow-lg mr-3">
                    <i className="fas fa-bolt text-white text-lg" />
                  </div>
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button 
                    className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
                    onClick={() => setShowCreateModal(true)}
                  >
                    <i className="fas fa-plus mr-2" />
                    Add Individual
                  </Button>
                  <Button 
                    variant="outline"
                    className="text-slate-600 border-slate-300 hover:bg-slate-50"
                    onClick={() => setShowBulkImportModal(true)}
                  >
                    <i className="fas fa-file-import mr-2" />
                    Bulk Import
                  </Button>
                  <Button 
                    variant="outline"
                    className="text-slate-600 border-slate-300 hover:bg-slate-50"
                    onClick={handleBulkExport}
                  >
                    <i className="fas fa-file-export mr-2" />
                    Export CSV
                  </Button>
                  <Button 
                    variant="outline"
                    className="text-slate-600 border-slate-300 hover:bg-slate-50"
                    onClick={() => setActiveTab('ai-analytics')}
                  >
                    <i className="fas fa-brain mr-2" />
                    AI Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Module Integrations */}
            <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center shadow-lg mr-3">
                    <i className="fas fa-plug text-white text-lg" />
                  </div>
                  Module Integrations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-slate-900">Incident Log</span>
                      <span className="px-2.5 py-1 text-xs font-semibold rounded text-green-800 bg-green-100">
                        Connected
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">
                      Automatically create bans from incidents
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-slate-900">Access Control</span>
                      <span className="px-2.5 py-1 text-xs font-semibold rounded text-green-800 bg-green-100">
                        Connected
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">
                      Banned individuals automatically denied access
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-slate-900">Facial Recognition</span>
                      <span className="px-2.5 py-1 text-xs font-semibold rounded text-green-800 bg-green-100">
                        Active
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">
                      Real-time detection and alerts
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Individual Management Tab */}
        {currentTab === 'management' && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
              <CardContent className="pt-6 px-6 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      placeholder="Search by name, ID, or reason..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ALL">All Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="EXPIRED">Expired</option>
                    <option value="REMOVED">Removed</option>
                  </select>
                  <select
                    value={filterRiskLevel}
                    onChange={(e) => setFilterRiskLevel(e.target.value)}
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ALL">All Risk Levels</option>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                  <Button
                    variant="outline"
                    onClick={() => setShowAdvancedFiltersModal(true)}
                    className="text-slate-600 border-slate-300 hover:bg-slate-50"
                  >
                    <i className="fas fa-filter mr-2" />
                    More Filters
                  </Button>
                </div>
                {selectedIndividuals.length > 0 && (
                  <div className="mt-4 flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium text-blue-900">
                      {selectedIndividuals.length} individual(s) selected
                    </span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleBulkExport}
                        className="text-slate-600"
                      >
                        Export Selected
                      </Button>
                      <Button
                        size="sm"
                        className="!bg-red-600 hover:!bg-red-700 text-white"
                        onClick={handleBulkDelete}
                      >
                        Delete Selected
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center shadow-lg mr-3">
                    <i className="fas fa-users text-white text-lg" />
                  </div>
                  All Banned Individuals ({filteredIndividuals.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredIndividuals.map((individual) => (
                    <div 
                      key={individual.id}
                      className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleViewDetails(individual)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-slate-500 to-slate-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold">
                            {individual.firstName.charAt(0)}{individual.lastName.charAt(0)}
                          </span>
                        </div>
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => handleViewDetails(individual)}
                        >
                          <h3 className="font-semibold text-slate-900">
                            {individual.firstName} {individual.lastName}
                          </h3>
                          <p className="text-sm text-slate-600">{individual.reason}</p>
                          <p className="text-xs text-slate-500">
                            ID: {individual.identificationNumber} | Added: {new Date(individual.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={cn("px-2.5 py-1 text-xs font-semibold rounded", getRiskLevelBadgeClass(individual.riskLevel))}>
                          {individual.riskLevel}
                        </span>
                        <span className={cn("px-2.5 py-1 text-xs font-semibold rounded", getBanTypeBadgeClass(individual.banType))}>
                          {individual.banType}
                        </span>
                        <span className={cn("px-2.5 py-1 text-xs font-semibold rounded", getStatusBadgeClass(individual.status))}>
                          {individual.status}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedIndividual(individual);
                            setShowPhotoUploadModal(true);
                          }}
                          className="text-slate-600"
                        >
                          <i className="fas fa-camera mr-1" />
                          Photo
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Facial Recognition Tab */}
        {currentTab === 'facial-recognition' && (
          <div className="space-y-6">
            <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center shadow-lg mr-3">
                    <i className="fas fa-eye text-white text-lg" />
                  </div>
                  Facial Recognition Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="text-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl">
                    <div className="w-16 h-16 bg-gradient-to-br from-slate-500 to-slate-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <i className="fas fa-check-circle text-white text-2xl" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Training Status</h3>
                    <p className="text-slate-600">{facialRecognitionStats.trainingStatus}</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <i className="fas fa-chart-line text-white text-2xl" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Detection Accuracy</h3>
                    <p className="text-slate-600">{facialRecognitionStats.accuracy}%</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl">
                    <div className="w-16 h-16 bg-gradient-to-br from-slate-500 to-slate-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <i className="fas fa-eye text-white text-2xl" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Real-time Monitoring</h3>
                    <p className="text-slate-600">Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Detection Alerts Tab */}
        {currentTab === 'detections' && (
          <div className="space-y-6">
            <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex items-center justify-center shadow-lg mr-3">
                    <i className="fas fa-exclamation-triangle text-white text-lg" />
                  </div>
                  Detection Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {detectionAlerts.map((alert) => (
                    <div key={alert.id} className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-slate-900">{alert.individualName}</h3>
                        <span className={cn("px-2.5 py-1 text-xs font-semibold rounded", getDetectionStatusBadgeClass(alert.status))}>
                          {alert.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-slate-600">Location:</span>
                          <p className="font-medium">{alert.location}</p>
                        </div>
                        <div>
                          <span className="text-slate-600">Confidence:</span>
                          <p className="font-medium">{alert.confidence}%</p>
                        </div>
                        <div>
                          <span className="text-slate-600">Response Time:</span>
                          <p className="font-medium">{alert.responseTime} minutes</p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 mt-2">{alert.actionTaken}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* AI Analytics Tab */}
        {currentTab === 'ai-analytics' && (
          <div className="space-y-6">
            <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center shadow-lg mr-3">
                    <i className="fas fa-brain text-white text-lg" />
                  </div>
                  AI Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Risk Assessment */}
                  {selectedIndividual && (
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">Risk Assessment</h3>
                      <RiskAssessmentPanel
                        individual={selectedIndividual}
                        allIndividuals={bannedIndividuals}
                      />
                    </div>
                  )}
                  
                  {/* Pattern Detection */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Pattern Detection</h3>
                    <PatternDetectionPanel individuals={bannedIndividuals} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Analytics Tab */}
        {currentTab === 'analytics' && (
          <div className="space-y-6">
            <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center shadow-lg mr-3">
                    <i className="fas fa-chart-bar text-white text-lg" />
                  </div>
                  Analytics & Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl">
                    <div className="w-16 h-16 bg-gradient-to-br from-slate-500 to-slate-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <i className="fas fa-chart-line text-white text-2xl" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Detection Frequency</h3>
                    <p className="text-slate-600">2.3 per day</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl">
                    <div className="w-16 h-16 bg-gradient-to-br from-slate-500 to-slate-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <i className="fas fa-check-circle text-white text-2xl" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">False Positives</h3>
                    <p className="text-slate-600">3.2%</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl">
                    <div className="w-16 h-16 bg-gradient-to-br from-slate-500 to-slate-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <i className="fas fa-shield-alt text-white text-2xl" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Security Effectiveness</h3>
                    <p className="text-slate-600">96.8%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Settings Tab */}
        {currentTab === 'settings' && (
          <div className="space-y-6">
            <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center shadow-lg mr-3">
                    <i className="fas fa-cog text-white text-lg" />
                  </div>
                  Banned Individuals Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Manage banned individuals system settings.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Create Individual Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="backdrop-blur-xl bg-white/90 border-white/30 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <i className="fas fa-user-plus mr-3 text-slate-600" />
                  Add Banned Individual
                </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const data = Object.fromEntries(formData.entries());
                handleCreateIndividual(data);
              }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      required
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      required
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reason" className="block text-sm font-medium text-slate-700 mb-2">
                    Reason for Ban *
                  </label>
                  <textarea
                    id="reason"
                    name="reason"
                    required
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="banType" className="block text-sm font-medium text-slate-700 mb-2">
                      Ban Type *
                    </label>
                    <select
                      id="banType"
                      name="banType"
                      required
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="TEMPORARY">Temporary</option>
                      <option value="PERMANENT">Permanent</option>
                      <option value="CONDITIONAL">Conditional</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="riskLevel" className="block text-sm font-medium text-slate-700 mb-2">
                      Risk Level *
                    </label>
                    <select
                      id="riskLevel"
                      name="riskLevel"
                      required
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="banStartDate" className="block text-sm font-medium text-slate-700 mb-2">
                    Ban Start Date *
                  </label>
                  <input
                    type="date"
                    id="banStartDate"
                    name="banStartDate"
                    required
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="multiProperty"
                    name="multiProperty"
                    className="mr-2"
                  />
                  <label htmlFor="multiProperty" className="text-sm font-medium text-slate-700">
                    Multi-Property Ban
                  </label>
                </div>

                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                    className="px-6 py-3"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="!bg-[#2563eb] hover:!bg-blue-700 text-white px-6 py-3"
                  >
                    Add Banned Individual
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Individual Details Modal */}
      {showDetailsModal && selectedIndividual && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="backdrop-blur-xl bg-white/90 border-white/30 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <i className="fas fa-user mr-3 text-slate-600" />
                  Individual Details
                </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-slate-500 to-slate-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-xl">
                      {selectedIndividual.firstName.charAt(0)}{selectedIndividual.lastName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">
                      {selectedIndividual.firstName} {selectedIndividual.lastName}
                    </h3>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className={cn("px-2.5 py-1 text-xs font-semibold rounded", getRiskLevelBadgeClass(selectedIndividual.riskLevel))}>
                        {selectedIndividual.riskLevel}
                      </span>
                      <span className={cn("px-2.5 py-1 text-xs font-semibold rounded", getBanTypeBadgeClass(selectedIndividual.banType))}>
                        {selectedIndividual.banType}
                      </span>
                      <span className={cn("px-2.5 py-1 text-xs font-semibold rounded", getStatusBadgeClass(selectedIndividual.status))}>
                        {selectedIndividual.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-600">Date of Birth</label>
                    <p className="text-slate-900">{selectedIndividual.dateOfBirth}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Nationality</label>
                    <p className="text-slate-900">{selectedIndividual.nationality}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">ID Number</label>
                    <p className="text-slate-900">{selectedIndividual.identificationNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">ID Type</label>
                    <p className="text-slate-900">{selectedIndividual.identificationType}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-600">Reason for Ban</label>
                  <p className="text-slate-900">{selectedIndividual.reason}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-600">Notes</label>
                  <p className="text-slate-900">{selectedIndividual.notes}</p>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-slate-900 mb-4">Detection History</h4>
                  <div className="space-y-2">
                    {detectionAlerts
                      .filter(alert => alert.individualId === selectedIndividual.id)
                      .map((alert) => (
                        <div key={alert.id} className="p-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{alert.location}</span>
                            <span className="text-sm text-slate-600">{alert.confidence}% confidence</span>
                          </div>
                          <p className="text-sm text-slate-600 mt-1">{alert.actionTaken}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(alert.timestamp).toLocaleString()}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() => setShowDetailsModal(false)}
                    className="!bg-[#2563eb] hover:!bg-blue-700 text-white px-6 py-3"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulkImportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="backdrop-blur-xl bg-white/90 border-white/30 shadow-2xl max-w-2xl w-full">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <i className="fas fa-file-import mr-3 text-slate-600" />
                Bulk Import Individuals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  Upload a CSV file with columns: First Name, Last Name, Nationality, Reason, Ban Type, Risk Level
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleBulkImport(file);
                  }}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl"
                />
                <div className="flex justify-end space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowBulkImportModal(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Advanced Filters Modal */}
      {showAdvancedFiltersModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="backdrop-blur-xl bg-white/90 border-white/30 shadow-2xl max-w-2xl w-full">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <i className="fas fa-filter mr-3 text-slate-600" />
                Advanced Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Ban Type</label>
                  <select
                    value={filterBanType}
                    onChange={(e) => setFilterBanType(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="ALL">All Types</option>
                    <option value="TEMPORARY">Temporary</option>
                    <option value="PERMANENT">Permanent</option>
                    <option value="CONDITIONAL">Conditional</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Nationality</label>
                  <select
                    value={filterNationality}
                    onChange={(e) => setFilterNationality(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="ALL">All Nationalities</option>
                    {[...new Set(bannedIndividuals.map(i => i.nationality))].map(nat => (
                      <option key={nat} value={nat}>{nat}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFilterBanType('ALL');
                      setFilterNationality('ALL');
                      setShowAdvancedFiltersModal(false);
                    }}
                  >
                    Clear All
                  </Button>
                  <Button
                    className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
                    onClick={() => setShowAdvancedFiltersModal(false)}
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Photo Upload Modal */}
      {showPhotoUploadModal && selectedIndividual && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="backdrop-blur-xl bg-white/90 border-white/30 shadow-2xl max-w-2xl w-full">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <i className="fas fa-camera mr-3 text-slate-600" />
                Upload Photo for {selectedIndividual.firstName} {selectedIndividual.lastName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  Upload a clear front-facing photo. The facial recognition system will automatically train on this image.
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && selectedIndividual) {
                      handlePhotoUpload(file, selectedIndividual.id);
                    }
                  }}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl"
                />
                {selectedIndividual.photoUrl && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-slate-700 mb-2">Current Photo:</p>
                    <img
                      src={selectedIndividual.photoUrl}
                      alt={`${selectedIndividual.firstName} ${selectedIndividual.lastName}`}
                      className="w-32 h-32 object-cover rounded-lg border border-slate-300"
                    />
                  </div>
                )}
                <div className="flex justify-end space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowPhotoUploadModal(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default BannedIndividuals;