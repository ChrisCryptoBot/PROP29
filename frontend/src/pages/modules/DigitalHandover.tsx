
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Badge } from '../../components/UI/Badge';
import { cn } from '../../utils/cn';
import { showLoading, dismissLoadingAndShowSuccess, dismissLoadingAndShowError, showSuccess } from '../../utils/toast';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../../styles/modern-glass.css';
import ModuleShell from '../../components/Layout/ModuleShell';

interface Handover {
  id: string;
  shiftType: 'morning' | 'afternoon' | 'night';
  handoverFrom: string;
  handoverTo: string;
  handoverDate: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'critical';
  handoverNotes: string;
  checklistItems: ChecklistItem[];
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  completedBy?: string;
  verificationStatus: 'pending' | 'verified' | 'disputed';
  handoverRating?: number;
  feedback?: string;
  incidentsSummary: string;
  pendingTasks: any[];
  specialInstructions: string;
  equipmentStatus: string;
}

interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  category: 'security' | 'maintenance' | 'incidents' | 'equipment' | 'general';
  status: 'pending' | 'completed' | 'skipped';
  priority: 'low' | 'medium' | 'high';
  assignedTo?: string;
  dueDate?: string;
  completedAt?: string;
  completedBy?: string;
  notes?: string;
}

interface Attachment {
  id: string;
  filename: string;
  fileType: string;
  fileSize: number;
  uploadDate: string;
  uploadedBy: string;
  url: string;
}

interface HandoverMetrics {
  totalHandovers: number;
  completedHandovers: number;
  pendingHandovers: number;
  overdueHandovers: number;
  averageCompletionTime: string;
  completionRate: number;
  handoversByShift: { [key: string]: number };
  handoversByStatus: { [key: string]: number };
  monthlyHandovers: { month: string; count: number }[];
  checklistCompletionRate: number;
  averageRating: number;
}

const DigitalHandover: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('management');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedHandover, setSelectedHandover] = useState<Handover | null>(null);
  const [editingHandover, setEditingHandover] = useState<Handover | null>(null);

  // Type assertion to fix TypeScript strict literal type inference
  const currentTab = activeTab as any;

  // Mock data
  const [handovers, setHandovers] = useState<Handover[]>([
    {
      id: '1',
      shiftType: 'morning',
      handoverFrom: 'John Smith',
      handoverTo: 'Sarah Johnson',
      handoverDate: '2024-01-15',
      startTime: '06:00',
      endTime: '14:00',
      status: 'completed',
      priority: 'high',
      handoverNotes: 'All systems operational. Guest complaint about room temperature resolved. Security patrol completed without incidents.',
      checklistItems: [
        {
          id: '1',
          title: 'Security Patrol',
          description: 'Complete security rounds of all floors',
          category: 'security',
          status: 'completed',
          priority: 'high',
          assignedTo: 'Security Team',
          completedAt: '2024-01-15T13:30:00Z',
          completedBy: 'John Smith'
        },
        {
          id: '2',
          title: 'Equipment Check',
          description: 'Verify all equipment is operational',
          category: 'equipment',
          status: 'completed',
          priority: 'medium',
          assignedTo: 'Maintenance',
          completedAt: '2024-01-15T12:45:00Z',
          completedBy: 'John Smith'
        }
      ],
      attachments: [],
      createdAt: '2024-01-15T06:00:00Z',
      updatedAt: '2024-01-15T14:00:00Z',
      completedAt: '2024-01-15T14:00:00Z',
      completedBy: 'Sarah Johnson',
      verificationStatus: 'verified',
      handoverRating: 4.5,
      feedback: 'Excellent handover, all information clear and complete.',
      incidentsSummary: 'No security incidents. Guest complaint resolved.',
      pendingTasks: ['Follow up on maintenance request'],
      specialInstructions: 'Monitor room 205 for temperature issues',
      equipmentStatus: 'All operational'
    },
    {
      id: '2',
      shiftType: 'afternoon',
      handoverFrom: 'Sarah Johnson',
      handoverTo: 'Mike Wilson',
      handoverDate: '2024-01-15',
      startTime: '14:00',
      endTime: '22:00',
      status: 'in_progress',
      priority: 'medium',
      handoverNotes: 'Ongoing maintenance in lobby. VIP guest arriving at 18:00.',
      checklistItems: [
        {
          id: '3',
          title: 'VIP Arrival Preparation',
          description: 'Prepare VIP suite and amenities',
          category: 'general',
          status: 'pending',
          priority: 'high',
          assignedTo: 'Concierge',
          dueDate: '2024-01-15T17:30:00Z'
        }
      ],
      attachments: [],
      createdAt: '2024-01-15T14:00:00Z',
      updatedAt: '2024-01-15T14:00:00Z',
      verificationStatus: 'pending',
      incidentsSummary: 'Lobby maintenance ongoing',
      pendingTasks: ['VIP arrival preparation', 'Lobby maintenance completion'],
      specialInstructions: 'VIP guest special requirements',
      equipmentStatus: 'Lobby equipment temporarily offline'
    }
  ]);

  const [metrics, setMetrics] = useState<HandoverMetrics>({
    totalHandovers: 156,
    completedHandovers: 142,
    pendingHandovers: 8,
    overdueHandovers: 2,
    averageCompletionTime: '12 min',
    completionRate: 91,
    handoversByShift: { morning: 52, afternoon: 48, night: 56 },
    handoversByStatus: { pending: 8, in_progress: 4, completed: 142, overdue: 2 },
    monthlyHandovers: [
      { month: 'Jan', count: 45 },
      { month: 'Feb', count: 52 },
      { month: 'Mar', count: 48 },
      { month: 'Apr', count: 51 }
    ],
    checklistCompletionRate: 87,
    averageRating: 4.3
  });

  const [formData, setFormData] = useState({
    shiftType: 'morning' as const,
    handoverFrom: '',
    handoverTo: '',
    handoverDate: '',
    startTime: '',
    endTime: '',
    priority: 'medium' as const,
    handoverNotes: '',
    checklistItems: [] as ChecklistItem[],
  });

  const [checklistItem, setChecklistItem] = useState({
    title: '',
    description: '',
    category: 'general' as const,
    priority: 'medium' as const,
    assignedTo: '',
    dueDate: '',
  });

  const tabs = [
    { id: 'management', label: 'Handover Management' },
    { id: 'tracking', label: 'Live Tracking' },
    { id: 'equipment', label: 'Equipment & Tasks' },
    { id: 'analytics', label: 'Analytics & Reports' },
    { id: 'settings', label: 'Settings' }
  ];


  const [settings, setSettings] = useState({
    shiftConfigurations: {
      morning: { start: '06:00', end: '14:00' },
      afternoon: { start: '14:00', end: '22:00' },
      night: { start: '22:00', end: '06:00' }
    },
    notificationSettings: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      reminderTime: '30',
      escalationTime: '2'
    },
    templateSettings: {
      defaultPriority: 'medium',
      defaultCategory: 'general',
      autoAssignTasks: true,
      requireApproval: false
    }
  });

  const handleSettingsChange = useCallback((key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSaveSettings = useCallback(async () => {
    let toastId: string | undefined;
    try {
      toastId = showLoading('Saving settings...');
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'All settings saved successfully');
      }
    } catch (error) {
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to save settings');
      }
    }
  }, []);

  // Memoized filtered handover lists for performance
  const inProgressHandovers = useMemo(() => handovers.filter(h => h.status === 'in_progress'), [handovers]);
  const completedHandovers = useMemo(() => handovers.filter(h => h.status === 'completed'), [handovers]);
  const pendingHandovers = useMemo(() => handovers.filter(h => h.status === 'pending'), [handovers]);
  const overdueHandovers = useMemo(() => handovers.filter(h => h.status === 'overdue'), [handovers]);

  const handleCreateHandover = useCallback(async () => {
    let toastId: string | undefined;
    try {
      toastId = showLoading('Creating handover...');
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newHandover: Handover = {
        id: Date.now().toString(),
        shiftType: formData.shiftType,
        handoverFrom: formData.handoverFrom,
        handoverTo: formData.handoverTo,
        handoverDate: formData.handoverDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        status: 'pending',
        priority: formData.priority,
        handoverNotes: formData.handoverNotes,
        checklistItems: formData.checklistItems,
        attachments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        verificationStatus: 'pending',
        incidentsSummary: '',
        pendingTasks: [],
        specialInstructions: '',
        equipmentStatus: 'operational'
      };

      setHandovers(prev => [newHandover, ...prev]);
      setShowCreateModal(false);
      resetForm();

      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Handover created successfully');
      }
    } catch (error) {
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to create handover');
      }
    }
  }, [formData]);

  const handleCompleteHandover = useCallback(async (id: string) => {
    let toastId: string | undefined;
    try {
      toastId = showLoading('Completing handover...');
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setHandovers(prev => prev.map(handover =>
        handover.id === id
          ? { ...handover, status: 'completed' as const, completedAt: new Date().toISOString() }
          : handover
      ));

      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Handover completed successfully');
      }
    } catch (error) {
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to complete handover');
      }
    }
  }, []);

  const addChecklistItem = () => {
    if (!checklistItem.title.trim()) {
      return;
    }

    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      title: checklistItem.title,
      description: checklistItem.description,
      category: checklistItem.category,
      status: 'pending',
      priority: checklistItem.priority,
      assignedTo: checklistItem.assignedTo,
      dueDate: checklistItem.dueDate,
    };

    setFormData({
      ...formData,
      checklistItems: [...formData.checklistItems, newItem],
    });

    setChecklistItem({
      title: '',
      description: '',
      category: 'general',
      priority: 'medium',
      assignedTo: '',
      dueDate: '',
    });
  };

  const removeChecklistItem = (index: number) => {
    const updatedItems = formData.checklistItems.filter((_, i) => i !== index);
    setFormData({ ...formData, checklistItems: updatedItems });
  };

  const resetForm = () => {
    setFormData({
      shiftType: 'morning',
      handoverFrom: '',
      handoverTo: '',
      handoverDate: '',
      startTime: '',
      endTime: '',
      priority: 'medium',
      handoverNotes: '',
      checklistItems: [],
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'default';
      case 'overdue': return 'destructive';
      default: return 'warning';
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-800 bg-green-100';
      case 'in_progress': return 'text-blue-800 bg-blue-100';
      case 'pending': return 'text-yellow-800 bg-yellow-100';
      case 'overdue': return 'text-red-800 bg-red-100';
      default: return 'text-slate-800 bg-slate-100';
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-800 bg-red-100';
      case 'high': return 'text-orange-800 bg-orange-100';
      case 'medium': return 'text-blue-800 bg-blue-100';
      case 'low': return 'text-slate-800 bg-slate-100';
      default: return 'text-slate-800 bg-slate-100';
    }
  };

  const getShiftTypeBadge = (type: string) => {
    const typeConfig = {
      morning: { color: 'bg-blue-100 text-blue-800', label: 'Morning' },
      afternoon: { color: 'bg-green-100 text-green-800', label: 'Afternoon' },
      night: { color: 'bg-purple-100 text-purple-800', label: 'Night' },
    };

    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.morning;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <ModuleShell
      icon={<i className="fas fa-exchange-alt" />}
      title="Digital Handover"
      subtitle="Seamless shift transitions and operational continuity"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >

      {/* Main Content */}
      <div className="relative max-w-[1800px] mx-auto px-6 py-6">
        {/* Key Metrics with Glass Morphism */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Handovers */}
          <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="pt-6 px-6 pb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-xl flex items-center justify-center shadow-lg mt-2">
                  <i className="fas fa-clipboard-list text-white text-xl" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-slate-900">
                  {metrics.totalHandovers}
                </h3>
                <p className="text-slate-600 text-sm">
                  All Handovers
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Completed Handovers */}
          <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="pt-6 px-6 pb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center shadow-lg mt-2">
                  <i className="fas fa-check-circle text-white text-xl" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-slate-900">
                  {metrics.completedHandovers}
                </h3>
                <p className="text-slate-600 text-sm">
                  Completed Shifts
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Pending Handovers */}
          <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="pt-6 px-6 pb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl flex items-center justify-center shadow-lg mt-2">
                  <i className="fas fa-clock text-white text-xl" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-slate-900">
                  {metrics.pendingHandovers}
                </h3>
                <p className="text-slate-600 text-sm">
                  Pending Handovers
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Overdue Handovers */}
          <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="pt-6 px-6 pb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center shadow-lg mt-2">
                  <i className="fas fa-exclamation-triangle text-white text-xl" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-slate-900">
                  {metrics.overdueHandovers}
                </h3>
                <p className="text-slate-600 text-sm">
                  Overdue Handovers
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Content */}
        {currentTab === 'management' && (
          <div className="space-y-6">
            {/* Emergency Actions */}
            <Card className="">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                    <i className="fas fa-exclamation-triangle text-white" />
                  </div>
                  Emergency Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={() => {
                      const overdueHandovers = handovers.filter(h => h.status === 'overdue');
                      showSuccess(`${overdueHandovers.length} handovers are overdue`);
                    }}
                    className=""
                  >
                    <i className="fas fa-exclamation-triangle mr-2" />
                    Overdue Alert
                  </Button>
                  <Button
                    onClick={() => {
                      const incompleteHandovers = handovers.filter(h => h.status === 'in_progress');
                      showSuccess(`${incompleteHandovers.length} handovers are incomplete`);
                    }}
                    className=""
                  >
                    <i className="fas fa-clock mr-2" />
                    Incomplete Alert
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Handover List */}
            <Card className="">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                    <i className="fas fa-list text-white" />
                  </div>
                  Recent Handovers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {handovers.length === 0 ? (
                    <Card className="">
                      <CardContent className="p-12 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <i className="fas fa-clipboard-list text-slate-400 text-2xl"></i>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">No handovers found</h3>
                        <p className="text-slate-600">Create your first handover to get started.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    handovers.map(handover => (
                      <Card
                        key={handover.id}
                        className=" hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1"
                        onClick={() => setSelectedHandover(handover)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-slate-500 to-slate-600 rounded-xl flex items-center justify-center shadow-lg">
                                <i className="fas fa-exchange-alt text-white text-lg" />
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-900 text-lg">
                                  {handover.handoverFrom} → {handover.handoverTo}
                                </h4>
                                <p className="text-slate-600 text-sm">
                                  {handover.shiftType.charAt(0).toUpperCase() + handover.shiftType.slice(1)} Shift
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {getShiftTypeBadge(handover.shiftType)}
                              <span className={cn("px-2.5 py-1 text-xs font-semibold rounded", getStatusBadgeClass(handover.status))}>
                                {handover.status.toUpperCase().replace('_', ' ')}
                              </span>
                              <span className={cn("px-2.5 py-1 text-xs font-semibold rounded", getPriorityBadgeClass(handover.priority))}>
                                {handover.priority.toUpperCase()}
                              </span>
                            </div>
                          </div>

                          <p className="text-slate-700 mb-4 leading-relaxed">{handover.handoverNotes}</p>

                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-4">
                              <span className="text-slate-600">
                                <i className="fas fa-calendar mr-1" />
                                {new Date(handover.handoverDate).toLocaleDateString()}
                              </span>
                              <span className="text-slate-600">
                                <i className="fas fa-clock mr-1" />
                                {handover.startTime} - {handover.endTime}
                              </span>
                              <span className="text-slate-600">
                                <i className="fas fa-list-check mr-1" />
                                {handover.checklistItems.length} items
                              </span>
                            </div>
                            {handover.status !== 'completed' && (
                              <Button
                                size="sm"
                                onClick={(e: React.MouseEvent) => {
                                  e.stopPropagation();
                                  handleCompleteHandover(handover.id);
                                }}
                                className=""
                              >
                                <i className="fas fa-check mr-1" />
                                Complete
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentTab === 'tracking' && (
          <div className="space-y-6">
            {/* Active Handovers */}
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                      <i className="fas fa-clock text-white" />
                    </div>
                    Active Handovers
                  </div>
                  <span className="px-3 py-1.5 text-base font-semibold rounded text-blue-800 bg-blue-100">
                    {inProgressHandovers.length} In Progress
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {inProgressHandovers.map(handover => (
                    <div key={handover.id} className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-slate-900">
                            {handover.handoverFrom} → {handover.handoverTo}
                          </h4>
                          <p className="text-sm text-slate-600">
                            {handover.shiftType.charAt(0).toUpperCase() + handover.shiftType.slice(1)} Shift |
                            {handover.startTime} - {handover.endTime}
                          </p>
                        </div>
                        <span className="px-2.5 py-1 text-xs font-semibold rounded text-yellow-800 bg-yellow-100 animate-pulse">In Progress</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Checklist Progress</span>
                          <span className="font-medium">
                            {handover.checklistItems.filter(i => i.status === 'completed').length} / {handover.checklistItems.length}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{
                              width: `${(handover.checklistItems.filter(i => i.status === 'completed').length / handover.checklistItems.length) * 100}%`
                            }}
                          />
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className=" mt-3"
                        onClick={() => setSelectedHandover(handover)}
                      >
                        <i className="fas fa-eye mr-1" />
                        View Details
                      </Button>
                    </div>
                  ))}
                  {inProgressHandovers.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                      <i className="fas fa-check-circle text-4xl mb-3 text-green-600" />
                      <p>No active handovers at this time</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Shift Timeline */}
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                    <i className="fas fa-calendar-alt text-white" />
                  </div>
                  Today's Shift Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { shift: 'Morning', time: '06:00 - 14:00', staff: 'John Smith → Sarah Johnson', status: 'completed' },
                    { shift: 'Afternoon', time: '14:00 - 22:00', staff: 'Sarah Johnson → Mike Wilson', status: 'in_progress' },
                    { shift: 'Night', time: '22:00 - 06:00', staff: 'Mike Wilson → John Smith', status: 'pending' }
                  ].map((shift, index) => (
                    <div key={index} className={`p-4 rounded-lg border ${shift.status === 'completed' ? 'border-green-200 bg-green-50' :
                      shift.status === 'in_progress' ? 'border-blue-200 bg-blue-50' :
                        'border-slate-200 '
                      }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-slate-900">{shift.shift} Shift</h4>
                          <p className="text-sm text-slate-600">{shift.time}</p>
                          <p className="text-sm text-slate-700 mt-1">{shift.staff}</p>
                        </div>
                        <span className={cn(
                          "px-2.5 py-1 text-xs font-semibold rounded",
                          shift.status === 'completed' ? 'text-green-800 bg-green-100' :
                            shift.status === 'in_progress' ? 'text-yellow-800 bg-yellow-100' : 'text-slate-800 bg-slate-100'
                        )}>
                          {shift.status.charAt(0).toUpperCase() + shift.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Staff Availability */}
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                    <i className="fas fa-users text-white" />
                  </div>
                  Staff Availability
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['John Smith', 'Sarah Johnson', 'Mike Wilson', 'Lisa Brown', 'Tom Anderson', 'Jennifer Lee'].map((staff, index) => (
                    <div key={index} className="p-4 border border-slate-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                            <i className="fas fa-user text-slate-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-900 text-sm">{staff}</h4>
                            <p className="text-xs text-slate-600">Security Staff</p>
                          </div>
                        </div>
                      </div>
                      <span className={cn(
                        "px-2.5 py-1 text-xs font-semibold rounded",
                        index % 3 === 0 ? 'text-green-800 bg-green-100' : index % 3 === 1 ? 'text-yellow-800 bg-yellow-100' : 'text-slate-800 bg-slate-100'
                      )}>
                        {index % 3 === 0 ? 'Available' : index % 3 === 1 ? 'On Duty' : 'Off Duty'}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentTab === 'equipment' && (
          <div className="space-y-6">
            {/* Equipment Status Overview */}
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="fas fa-clipboard-check text-slate-600 mr-2" />
                  Equipment Status Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[
                    { name: 'Security Cameras', count: 24, operational: 23, icon: 'fa-video' },
                    { name: 'Access Control', count: 18, operational: 18, icon: 'fa-door-closed' },
                    { name: 'Fire Alarms', count: 32, operational: 31, icon: 'fa-fire-extinguisher' },
                    { name: 'Communication', count: 12, operational: 12, icon: 'fa-walkie-talkie' }
                  ].map((equipment, index) => (
                    <div key={index} className="p-4 border border-slate-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                          <i className={`fas ${equipment.icon} text-slate-600`} />
                        </div>
                        <span className={cn(
                          "px-2.5 py-1 text-xs font-semibold rounded",
                          equipment.operational === equipment.count ? 'text-green-800 bg-green-100' : 'text-yellow-800 bg-yellow-100'
                        )}>
                          {equipment.operational}/{equipment.count}
                        </span>
                      </div>
                      <h4 className="font-semibold text-slate-900 text-sm">{equipment.name}</h4>
                      <p className="text-xs text-slate-600 mt-1">
                        {equipment.operational === equipment.count ? 'All Operational' : `${equipment.count - equipment.operational} Issue(s)`}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Pending Tasks */}
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <i className="fas fa-tasks text-slate-600 mr-2" />
                    Pending Tasks
                  </div>
                  <span className="px-3 py-1.5 text-base font-semibold rounded text-yellow-800 bg-yellow-100">
                    {handovers.flatMap(h => h.pendingTasks).length} Open
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {handovers.flatMap((handover, hIndex) =>
                    handover.pendingTasks.map((task, tIndex) => (
                      <div key={`${hIndex}-${tIndex}`} className="p-4 border border-amber-200 bg-amber-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-slate-900">{task}</h4>
                            <p className="text-sm text-slate-600 mt-1">
                              Assigned from: {handover.handoverFrom} | Shift: {handover.shiftType}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              Created: {new Date(handover.handoverDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              className=""
                              onClick={() => showSuccess('Task marked as completed')}
                            >
                              <i className="fas fa-check mr-1" />
                              Complete
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  {handovers.flatMap(h => h.pendingTasks).length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                      <i className="fas fa-check-circle text-4xl mb-3 text-green-600" />
                      <p>No pending tasks</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Equipment Checklist */}
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="fas fa-list-check text-slate-600 mr-2" />
                  Standard Equipment Checklist
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { item: 'Security patrol completed', category: 'Security', completed: true },
                    { item: 'All cameras functional', category: 'Equipment', completed: true },
                    { item: 'Communication devices charged', category: 'Equipment', completed: true },
                    { item: 'Access control systems verified', category: 'Security', completed: true },
                    { item: 'Fire alarm system tested', category: 'Safety', completed: false },
                    { item: 'Emergency exits clear', category: 'Safety', completed: true },
                    { item: 'Incident reports filed', category: 'Documentation', completed: true },
                    { item: 'Equipment logs updated', category: 'Documentation', completed: false }
                  ].map((item, index) => (
                    <div key={index} className={`p-3 rounded-lg border ${item.completed ? 'border-green-200 bg-green-50' : 'border-slate-200 '
                      }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${item.completed ? 'bg-green-600' : 'bg-slate-300'
                            }`}>
                            {item.completed && <i className="fas fa-check text-white text-xs" />}
                          </div>
                          <div>
                            <h5 className="font-medium text-slate-900 text-sm">{item.item}</h5>
                            <p className="text-xs text-slate-600">{item.category}</p>
                          </div>
                        </div>
                        {!item.completed && (
                          <Button
                            size="sm"
                            variant="outline"
                            className=""
                            onClick={() => showSuccess(`${item.item} marked complete`)}
                          >
                            Mark Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Maintenance Requests */}
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                    <i className="fas fa-wrench text-white" />
                  </div>
                  Maintenance Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { issue: 'Camera 12 offline', location: 'North Wing', priority: 'high', status: 'pending' },
                    { issue: 'Door lock malfunction', location: 'Parking Garage', priority: 'critical', status: 'in_progress' },
                    { issue: 'Light replacement needed', location: 'Stairwell B', priority: 'low', status: 'pending' }
                  ].map((request, index) => (
                    <div key={index} className="p-4 border border-slate-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className={cn(
                          "px-2.5 py-1 text-xs font-semibold rounded",
                          request.priority === 'critical' ? 'text-red-800 bg-red-100' :
                            request.priority === 'high' ? 'text-orange-800 bg-orange-100' : 'text-blue-800 bg-blue-100'
                        )}>
                          {request.priority.toUpperCase()}
                        </span>
                        <span className={cn(
                          "px-2.5 py-1 text-xs font-semibold rounded",
                          request.status === 'in_progress' ? 'text-yellow-800 bg-yellow-100' : 'text-slate-800 bg-slate-100'
                        )}>
                          {request.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <h4 className="font-semibold text-slate-900 text-sm">{request.issue}</h4>
                      <p className="text-xs text-slate-600 mt-1">
                        <i className="fas fa-map-marker-alt mr-1" />
                        {request.location}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className=" w-full mt-3"
                        onClick={() => showSuccess('Maintenance team notified')}
                      >
                        <i className="fas fa-bell mr-1" />
                        Notify Maintenance
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentTab === 'analytics' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-white border-slate-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <i className="fas fa-percentage text-slate-600 text-xl" />
                    <i className="fas fa-arrow-up text-green-600 text-sm" />
                  </div>
                  <h3 className="text-3xl font-bold text-slate-900 mb-1">{metrics.completionRate}%</h3>
                  <p className="text-sm text-slate-600">Completion Rate</p>
                  <p className="text-xs text-green-600 mt-1">+5% from last month</p>
                </CardContent>
              </Card>

              <Card className="bg-white border-slate-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <i className="fas fa-star text-slate-600 text-xl" />
                  </div>
                  <h3 className="text-3xl font-bold text-slate-900 mb-1">{metrics.averageRating}/5</h3>
                  <p className="text-sm text-slate-600">Average Rating</p>
                  <p className="text-xs text-slate-500 mt-1">Handover quality</p>
                </CardContent>
              </Card>

              <Card className="bg-white border-slate-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <i className="fas fa-clock text-slate-600 text-xl" />
                  </div>
                  <h3 className="text-3xl font-bold text-slate-900 mb-1">{metrics.averageCompletionTime}</h3>
                  <p className="text-sm text-slate-600">Avg Completion Time</p>
                  <p className="text-xs text-slate-500 mt-1">Per handover</p>
                </CardContent>
              </Card>

              <Card className="bg-white border-slate-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <i className="fas fa-list-check text-slate-600 text-xl" />
                  </div>
                  <h3 className="text-3xl font-bold text-slate-900 mb-1">{metrics.checklistCompletionRate}%</h3>
                  <p className="text-sm text-slate-600">Checklist Completion</p>
                  <p className="text-xs text-slate-500 mt-1">Average rate</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Monthly Handover Trend */}
              <Card className="bg-white border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <i className="fas fa-chart-line text-slate-600 mr-2" />
                    Monthly Handover Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={metrics.monthlyHandovers}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} name="Handovers" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Handovers by Shift */}
              <Card className="bg-white border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <i className="fas fa-chart-bar text-slate-600 mr-2" />
                    Handovers by Shift
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[
                      { shift: 'Morning', count: metrics.handoversByShift.morning || 0 },
                      { shift: 'Afternoon', count: metrics.handoversByShift.afternoon || 0 },
                      { shift: 'Night', count: metrics.handoversByShift.night || 0 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="shift" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="count" fill="#2563eb" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Status Distribution */}
              <Card className="bg-white border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <i className="fas fa-chart-pie text-slate-600 mr-2" />
                    Status Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Completed', value: metrics.handoversByStatus.completed || 0 },
                          { name: 'In Progress', value: metrics.handoversByStatus.in_progress || 0 },
                          { name: 'Pending', value: metrics.handoversByStatus.pending || 0 },
                          { name: 'Overdue', value: metrics.handoversByStatus.overdue || 0 }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#f59e0b" />
                        <Cell fill="#6366f1" />
                        <Cell fill="#ef4444" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Performance Summary */}
              <Card className="bg-white border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <i className="fas fa-chart-area text-slate-600 mr-2" />
                    Performance Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-600">On-Time Completion</span>
                        <span className="text-sm font-medium">{metrics.completionRate}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: `${metrics.completionRate}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-600">Checklist Adherence</span>
                        <span className="text-sm font-medium">{metrics.checklistCompletionRate}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${metrics.checklistCompletionRate}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-600">Quality Rating</span>
                        <span className="text-sm font-medium">{(metrics.averageRating / 5 * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${(metrics.averageRating / 5 * 100)}%` }} />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-200">
                      <p className="text-sm text-slate-600 mb-2">Quick Stats:</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-3  rounded-lg">
                          <div className="text-2xl font-bold text-slate-900">{metrics.totalHandovers}</div>
                          <div className="text-xs text-slate-600">Total Handovers</div>
                        </div>
                        <div className="text-center p-3  rounded-lg">
                          <div className="text-2xl font-bold text-slate-900">{metrics.averageCompletionTime}</div>
                          <div className="text-xs text-slate-600">Avg Time</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Export Reports */}
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>Export Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Button
                    className=""
                    onClick={() => showSuccess('Daily report generated')}
                  >
                    <i className="fas fa-file-pdf mr-2" />
                    Daily Report
                  </Button>
                  <Button
                    variant="outline"
                    className=""
                    onClick={() => showSuccess('Weekly report generated')}
                  >
                    <i className="fas fa-file-excel mr-2" />
                    Weekly Report
                  </Button>
                  <Button
                    variant="outline"
                    className=""
                    onClick={() => showSuccess('Monthly report generated')}
                  >
                    <i className="fas fa-file-alt mr-2" />
                    Monthly Report
                  </Button>
                  <Button
                    variant="outline"
                    className=""
                    onClick={() => showSuccess('Custom report generated')}
                  >
                    <i className="fas fa-cog mr-2" />
                    Custom Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentTab === 'settings' && (
          <div className="space-y-6">
            {/* Shift Configuration */}
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="fas fa-clock text-slate-600 mr-2" />
                  Shift Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { shift: 'Morning', start: '06:00', end: '14:00', icon: 'fa-sun' },
                    { shift: 'Afternoon', start: '14:00', end: '22:00', icon: 'fa-cloud-sun' },
                    { shift: 'Night', start: '22:00', end: '06:00', icon: 'fa-moon' }
                  ].map((config, index) => (
                    <div key={index} className="p-4 border border-slate-200 rounded-lg">
                      <div className="flex items-center space-x-2 mb-3">
                        <i className={`fas ${config.icon} text-slate-600`} />
                        <h4 className="font-semibold text-slate-900">{config.shift} Shift</h4>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <label className="text-xs text-slate-600">Start Time</label>
                          <input
                            type="time"
                            value={settings.shiftConfigurations[config.shift.toLowerCase() as keyof typeof settings.shiftConfigurations].start}
                            onChange={(e) => handleSettingsChange('shiftConfigurations', {
                              ...settings.shiftConfigurations,
                              [config.shift.toLowerCase()]: {
                                ...settings.shiftConfigurations[config.shift.toLowerCase() as keyof typeof settings.shiftConfigurations],
                                start: e.target.value
                              }
                            })}
                            className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-600">End Time</label>
                          <input
                            type="time"
                            value={settings.shiftConfigurations[config.shift.toLowerCase() as keyof typeof settings.shiftConfigurations].end}
                            onChange={(e) => handleSettingsChange('shiftConfigurations', {
                              ...settings.shiftConfigurations,
                              [config.shift.toLowerCase()]: {
                                ...settings.shiftConfigurations[config.shift.toLowerCase() as keyof typeof settings.shiftConfigurations],
                                end: e.target.value
                              }
                            })}
                            className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Checklist Templates */}
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <i className="fas fa-list-check text-slate-600 mr-2" />
                    Checklist Templates
                  </div>
                  <Button
                    size="sm"
                    className=""
                    onClick={() => showSuccess('New template created')}
                  >
                    <i className="fas fa-plus mr-1" />
                    Add Template
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: 'Security Checklist', items: 8, category: 'Security' },
                    { name: 'Equipment Inspection', items: 12, category: 'Equipment' },
                    { name: 'Safety Verification', items: 6, category: 'Safety' },
                    { name: 'Documentation Requirements', items: 4, category: 'Admin' }
                  ].map((template, index) => (
                    <div key={index} className="p-4 border border-slate-200 rounded-lg flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-slate-900">{template.name}</h4>
                        <p className="text-sm text-slate-600">{template.items} items • {template.category}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className=""
                          onClick={() => showSuccess(`${template.name} edited`)}
                        >
                          <i className="fas fa-edit" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className=""
                          onClick={() => showSuccess(`${template.name} deleted`)}
                        >
                          <i className="fas fa-trash" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="fas fa-bell text-slate-600 mr-2" />
                  Notification Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'Email notifications for new handovers', key: 'emailNotifications' },
                  { label: 'SMS alerts for overdue handovers', key: 'smsNotifications' },
                  { label: 'Push notifications for handover updates', key: 'pushNotifications' },
                  { label: 'Daily handover summary reports', key: 'dailyReports' },
                  { label: 'Notify on checklist completion', key: 'checklistNotifications' }
                ].map((setting, index) => (
                  <div key={index} className="flex items-center justify-between p-3  rounded-lg">
                    <span className="text-slate-700">{setting.label}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notificationSettings[setting.key as keyof typeof settings.notificationSettings] as boolean}
                        className="sr-only peer"
                        onChange={(e) => handleSettingsChange('notificationSettings', {
                          ...settings.notificationSettings,
                          [setting.key]: e.target.checked
                        })}
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Auto-Handover Rules */}
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="fas fa-magic text-slate-600 mr-2" />
                  Auto-Handover Rules
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <i className="fas fa-robot text-blue-600" />
                      <h4 className="font-semibold text-slate-900">Automatic Handover Creation</h4>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-semibold rounded text-blue-800 bg-blue-100">Active</span>
                  </div>
                  <p className="text-sm text-slate-600 mb-3">
                    Automatically create handovers 30 minutes before shift change
                  </p>
                  <div className="space-y-2">
                    <label className="text-xs text-slate-600">Lead Time (minutes)</label>
                    <input
                      type="number"
                      defaultValue="30"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <i className="fas fa-exclamation-triangle text-amber-600" />
                      <h4 className="font-semibold text-slate-900">Overdue Reminders</h4>
                    </div>
                    <Badge variant="warning">Active</Badge>
                  </div>
                  <p className="text-sm text-slate-600 mb-3">
                    Send reminders for incomplete handovers after 2 hours
                  </p>
                  <div className="space-y-2">
                    <label className="text-xs text-slate-600">Reminder Interval (hours)</label>
                    <input
                      type="number"
                      defaultValue="2"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Retention */}
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="fas fa-database text-slate-600 mr-2" />
                  Data Retention
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Retain Handover Records</label>
                    <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option>30 Days</option>
                      <option>90 Days</option>
                      <option selected>180 Days</option>
                      <option>1 Year</option>
                      <option>Forever</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Archive Completed Handovers</label>
                    <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option>After 7 Days</option>
                      <option>After 14 Days</option>
                      <option selected>After 30 Days</option>
                      <option>After 90 Days</option>
                      <option>Never</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Settings Button */}
            <div className="flex justify-end">
              <Button
                className=" px-8 py-3"
                onClick={handleSaveSettings}
              >
                <i className="fas fa-save mr-2" />
                Save All Settings
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create Handover Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="backdrop-blur-xl bg-white/90 border-white/30 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <i className="fas fa-plus mr-3 text-slate-600" />
                Create New Handover
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Shift Type *</label>
                  <select
                    value={formData.shiftType}
                    onChange={(e) => setFormData({ ...formData, shiftType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                  >
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                    <option value="night">Night</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Handover Date *</label>
                  <input
                    type="date"
                    value={formData.handoverDate}
                    onChange={(e) => setFormData({ ...formData, handoverDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Handover From *</label>
                  <input
                    type="text"
                    value={formData.handoverFrom}
                    onChange={(e) => setFormData({ ...formData, handoverFrom: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                    placeholder="Enter name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Handover To *</label>
                  <input
                    type="text"
                    value={formData.handoverTo}
                    onChange={(e) => setFormData({ ...formData, handoverTo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                    placeholder="Enter name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Start Time *</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">End Time *</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              {/* Handover Notes */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Handover Notes</label>
                <textarea
                  value={formData.handoverNotes}
                  onChange={(e) => setFormData({ ...formData, handoverNotes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="Enter handover notes and important information"
                />
              </div>

              {/* Checklist Items */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-slate-900">Checklist Items</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Item Title</label>
                    <input
                      type="text"
                      value={checklistItem.title}
                      onChange={(e) => setChecklistItem({ ...checklistItem, title: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                      placeholder="Enter checklist item title"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Category</label>
                    <select
                      value={checklistItem.category}
                      onChange={(e) => setChecklistItem({ ...checklistItem, category: e.target.value as any })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                    >
                      <option value="security">Security</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="incidents">Incidents</option>
                      <option value="equipment">Equipment</option>
                      <option value="general">General</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Priority</label>
                    <select
                      value={checklistItem.priority}
                      onChange={(e) => setChecklistItem({ ...checklistItem, priority: e.target.value as any })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Assigned To</label>
                    <input
                      type="text"
                      value={checklistItem.assignedTo}
                      onChange={(e) => setChecklistItem({ ...checklistItem, assignedTo: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                      placeholder="Enter assigned person"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Description</label>
                    <textarea
                      value={checklistItem.description}
                      onChange={(e) => setChecklistItem({ ...checklistItem, description: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                      rows={2}
                      placeholder="Enter description"
                    />
                  </div>
                </div>

                <Button
                  onClick={addChecklistItem}
                  className=""
                >
                  <i className="fas fa-plus mr-2" />
                  Add Checklist Item
                </Button>
              </div>

              {/* Checklist Items List */}
              {formData.checklistItems.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-slate-900">Added Checklist Items:</h5>
                  {formData.checklistItems.map((item, index) => (
                    <div key={item.id} className="flex items-center justify-between p-3 /60 border border-slate-200/50 rounded-lg">
                      <div>
                        <div className="font-medium text-slate-900">{item.title}</div>
                        <div className="text-sm text-slate-600">{item.category} • {item.priority}</div>
                        {item.assignedTo && (
                          <div className="text-sm text-slate-500">Assigned to: {item.assignedTo}</div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeChecklistItem(index)}
                        className=""
                      >
                        <i className="fas fa-trash" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className=""
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateHandover}
                  disabled={!formData.handoverFrom || !formData.handoverTo || !formData.handoverDate}
                  className=""
                >
                  <i className="fas fa-plus mr-2" />
                  Create Handover
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Handover Details Modal */}
      {selectedHandover && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="backdrop-blur-xl bg-white/90 border-white/30 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                    <i className="fas fa-info-circle text-white" />
                  </div>
                  Handover Details
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedHandover(null)}
                  className=""
                >
                  <i className="fas fa-times" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-600">Shift Type</p>
                  <p className="mt-1">{selectedHandover && getShiftTypeBadge(selectedHandover.shiftType)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Status</p>
                  <p className="mt-1">
                    {selectedHandover && (
                      <span className={cn("px-2.5 py-1 text-xs font-semibold rounded", getStatusBadgeClass(selectedHandover.status))}>
                        {selectedHandover.status.toUpperCase().replace('_', ' ')}
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Priority</p>
                  <p className="mt-1">
                    {selectedHandover && (
                      <span className={cn("px-2.5 py-1 text-xs font-semibold rounded", getPriorityBadgeClass(selectedHandover.priority))}>
                        {selectedHandover.priority.toUpperCase()}
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Date</p>
                  <p className="text-sm text-slate-900 mt-1">
                    {selectedHandover && new Date(selectedHandover.handoverDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Handover From</p>
                  <p className="text-sm text-slate-900 mt-1">{selectedHandover?.handoverFrom}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Handover To</p>
                  <p className="text-sm text-slate-900 mt-1">{selectedHandover?.handoverTo}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Time Range</p>
                  <p className="text-sm text-slate-900 mt-1">
                    {selectedHandover?.startTime} - {selectedHandover?.endTime}
                  </p>
                </div>
              </div>

              {/* Handover Notes */}
              {selectedHandover?.handoverNotes && (
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-2">Handover Notes</p>
                  <p className="text-sm text-slate-900 /60 border border-slate-200/50 p-3 rounded-lg">
                    {selectedHandover?.handoverNotes}
                  </p>
                </div>
              )}

              {/* Checklist Items */}
              {selectedHandover?.checklistItems && selectedHandover.checklistItems.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-3">Checklist Items</p>
                  <div className="space-y-2">
                    {selectedHandover?.checklistItems?.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 /60 border border-slate-200/50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-slate-900">{item.title}</div>
                          {item.description && (
                            <div className="text-sm text-slate-600 mt-1">{item.description}</div>
                          )}
                          <div className="flex items-center gap-4 mt-2">
                            <span className={cn(
                              "px-2.5 py-1 text-xs font-semibold rounded",
                              item.status === 'completed' ? 'text-green-800 bg-green-100' :
                                item.status === 'skipped' ? 'text-slate-800 bg-slate-100' : 'text-yellow-800 bg-yellow-100'
                            )}>
                              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                            </span>
                            <span className="text-xs text-slate-500">{item.category}</span>
                            <span className="text-xs text-slate-500">{item.priority}</span>
                          </div>
                        </div>
                        {item.status === 'completed' && (
                          <i className="fas fa-check-circle w-5 h-5 text-green-600" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-sm text-slate-500 pt-4 border-t border-slate-200">
                Created on {selectedHandover && new Date(selectedHandover.createdAt).toLocaleString()}
                {selectedHandover?.completedAt && (
                  <span> • Completed on {new Date(selectedHandover.completedAt).toLocaleString()}</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </ModuleShell>
  );
};

export default DigitalHandover;



