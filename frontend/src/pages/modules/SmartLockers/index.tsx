import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/UI/Card';
import { Button } from '../../../components/UI/Button';
import { cn } from '../../../utils/cn';
import { showLoading, dismissLoadingAndShowSuccess, dismissLoadingAndShowError } from '../../../utils/toast';

// Interfaces
interface SmartLocker {
  id: string;
  lockerNumber: string;
  location: string;
  status: 'available' | 'occupied' | 'maintenance' | 'out_of_service';
  size: 'small' | 'medium' | 'large';
  currentGuestId?: string;
  checkInTime?: string;
  checkOutTime?: string;
  batteryLevel?: number;
  signalStrength?: number;
  lastMaintenance?: string;
  nextMaintenance?: string;
  features: string[];
}

interface LockerReservation {
  id: string;
  lockerId: string;
  guestId: string;
  guestName: string;
  startTime: string;
  endTime: string;
  status: 'active' | 'completed' | 'cancelled';
  purpose: string;
}

interface LockerMetrics {
  totalLockers: number;
  availableLockers: number;
  occupiedLockers: number;
  maintenanceLockers: number;
  utilizationRate: number;
  averageOccupancyTime: number;
  batteryAlerts: number;
  signalIssues: number;
}

const SmartLockers: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [selectedLocker, setSelectedLocker] = useState<SmartLocker | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Type assertion to fix TypeScript strict literal type inference
  const currentTab = activeTab as any;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'lockers', label: 'Locker Management' },
    { id: 'reservations', label: 'Reservations' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'settings', label: 'Settings' }
  ];

  // Mock data
  const [lockers, setLockers] = useState<SmartLocker[]>([
    {
      id: '1',
      lockerNumber: 'L001',
      location: 'Lobby - Floor 1',
      status: 'occupied',
      size: 'large',
      currentGuestId: 'guest-123',
      checkInTime: '2024-01-15T10:30:00Z',
      batteryLevel: 85,
      signalStrength: 92,
      lastMaintenance: '2024-01-10T09:00:00Z',
      nextMaintenance: '2024-02-10T09:00:00Z',
      features: ['RFID', 'NFC', 'LED Status', 'Temperature Sensor']
    },
    {
      id: '2',
      lockerNumber: 'L002',
      location: 'Lobby - Floor 1',
      status: 'available',
      size: 'medium',
      batteryLevel: 78,
      signalStrength: 88,
      lastMaintenance: '2024-01-12T14:30:00Z',
      nextMaintenance: '2024-02-12T14:30:00Z',
      features: ['RFID', 'NFC', 'LED Status']
    },
    {
      id: '3',
      lockerNumber: 'L003',
      location: 'Lobby - Floor 1',
      status: 'maintenance',
      size: 'small',
      batteryLevel: 45,
      signalStrength: 65,
      lastMaintenance: '2024-01-15T08:00:00Z',
      nextMaintenance: '2024-01-16T08:00:00Z',
      features: ['RFID', 'LED Status']
    }
  ]);

  const [reservations, setReservations] = useState<LockerReservation[]>([
    {
      id: '1',
      lockerId: '1',
      guestId: 'guest-123',
      guestName: 'John Smith',
      startTime: '2024-01-15T10:30:00Z',
      endTime: '2024-01-15T18:00:00Z',
      status: 'active',
      purpose: 'Luggage Storage'
    },
    {
      id: '2',
      lockerId: '2',
      guestId: 'guest-456',
      guestName: 'Sarah Johnson',
      startTime: '2024-01-15T14:00:00Z',
      endTime: '2024-01-16T10:00:00Z',
      status: 'active',
      purpose: 'Package Delivery'
    }
  ]);

  const [metrics, setMetrics] = useState<LockerMetrics>({
    totalLockers: 50,
    availableLockers: 35,
    occupiedLockers: 12,
    maintenanceLockers: 3,
    utilizationRate: 24,
    averageOccupancyTime: 4.5,
    batteryAlerts: 2,
    signalIssues: 1
  });

  // Gold Standard Badge Helper Functions
  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case 'available': return 'text-green-800 bg-green-100';
      case 'occupied': return 'text-blue-800 bg-blue-100';
      case 'maintenance': return 'text-yellow-800 bg-yellow-100';
      case 'out_of_service': return 'text-red-800 bg-red-100';
      default: return 'text-slate-800 bg-slate-100';
    }
  };

  const getSizeBadgeClass = (size: string): string => {
    switch (size) {
      case 'small': return 'text-slate-800 bg-slate-100';
      case 'medium': return 'text-blue-800 bg-blue-100';
      case 'large': return 'text-purple-800 bg-purple-100';
      default: return 'text-slate-800 bg-slate-100';
    }
  };

  const getReservationStatusBadgeClass = (status: string): string => {
    switch (status) {
      case 'active': return 'text-green-800 bg-green-100';
      case 'completed': return 'text-slate-800 bg-slate-100';
      case 'cancelled': return 'text-red-800 bg-red-100';
      default: return 'text-slate-800 bg-slate-100';
    }
  };

  const handleCreateLocker = useCallback(async (lockerData: any) => {
    let toastId: string | undefined;
    try {
      toastId = showLoading('Creating smart locker...');
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      const newLocker: SmartLocker = {
        id: String(lockers.length + 1),
        ...lockerData,
        status: 'available',
        batteryLevel: 100,
        signalStrength: 95,
        features: ['RFID', 'NFC', 'LED Status']
      };
      setLockers(prev => [newLocker, ...prev]);
      setMetrics(prev => ({ ...prev, totalLockers: prev.totalLockers + 1, availableLockers: prev.availableLockers + 1 }));
      
      dismissLoadingAndShowSuccess(toastId, 'Smart locker created successfully');
      setShowCreateModal(false);
    } catch (error) {
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to create smart locker');
      }
    }
  }, [lockers]);

  const handleViewLocker = (locker: SmartLocker) => {
    setSelectedLocker(locker);
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
                <i className="fas fa-lock text-white text-2xl" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center animate-pulse">
                <i className="fas fa-wifi text-white text-xs" />
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-slate-900">
                Smart Lockers
              </h1>
              <p className="text-slate-600 font-medium">
                Intelligent locker management and reservation system
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
                      <i className="fas fa-lock text-white text-xl" />
                    </div>
                    <span className="px-2.5 py-1 text-xs font-semibold rounded text-blue-800 bg-blue-100">
                      Total
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-blue-600">
                      {metrics.totalLockers}
                    </h3>
                    <p className="text-slate-600 font-medium">Total Lockers</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
                <CardContent className="pt-6 px-6 pb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center shadow-lg mt-2">
                      <i className="fas fa-check-circle text-white text-xl" />
                    </div>
                    <span className="px-2.5 py-1 text-xs font-semibold rounded text-green-800 bg-green-100">
                      Available
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-blue-600">
                      {metrics.availableLockers}
                    </h3>
                    <p className="text-slate-600 font-medium">Available Lockers</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
                <CardContent className="pt-6 px-6 pb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-xl flex items-center justify-center shadow-lg mt-2">
                      <i className="fas fa-user text-white text-xl" />
                    </div>
                    <span className="px-2.5 py-1 text-xs font-semibold rounded text-blue-800 bg-blue-100">
                      Occupied
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-blue-600">
                      {metrics.occupiedLockers}
                    </h3>
                    <p className="text-slate-600 font-medium">Occupied Lockers</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
                <CardContent className="pt-6 px-6 pb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-xl flex items-center justify-center shadow-lg mt-2">
                      <i className="fas fa-chart-line text-white text-xl" />
                    </div>
                    <span className="px-2.5 py-1 text-xs font-semibold rounded text-blue-800 bg-blue-100">
                      Rate
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-blue-600">
                      {metrics.utilizationRate}%
                    </h3>
                    <p className="text-slate-600 font-medium">Utilization Rate</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Lockers */}
            <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center shadow-lg mr-3">
                    <i className="fas fa-lock text-white text-lg" />
                  </div>
                  Recent Locker Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {lockers.slice(0, 3).map((locker) => (
                    <div 
                      key={locker.id} 
                      className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleViewLocker(locker)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                          <i className="fas fa-lock text-white text-xl" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">{locker.lockerNumber}</h3>
                          <p className="text-sm text-slate-600">{locker.location}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={cn("px-2.5 py-1 text-xs font-semibold rounded", getStatusBadgeClass(locker.status))}>
                          {locker.status}
                        </span>
                        <span className={cn("px-2.5 py-1 text-xs font-semibold rounded", getSizeBadgeClass(locker.size))}>
                          {locker.size}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

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
                    Add Locker
                  </Button>
                  <Button 
                    variant="outline"
                    className="text-slate-600 border-slate-300 hover:bg-slate-50"
                    onClick={() => setActiveTab('lockers')}
                  >
                    <i className="fas fa-cogs mr-2" />
                    Manage Lockers
                  </Button>
                  <Button 
                    variant="outline"
                    className="text-slate-600 border-slate-300 hover:bg-slate-50"
                    onClick={() => setActiveTab('reservations')}
                  >
                    <i className="fas fa-calendar mr-2" />
                    View Reservations
                  </Button>
                  <Button 
                    variant="outline"
                    className="text-slate-600 border-slate-300 hover:bg-slate-50"
                    onClick={() => setActiveTab('analytics')}
                  >
                    <i className="fas fa-chart-bar mr-2" />
                    Generate Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Locker Management Tab */}
        {currentTab === 'lockers' && (
          <div className="space-y-6">
            <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center shadow-lg mr-3">
                    <i className="fas fa-lock text-white text-lg" />
                  </div>
                  All Smart Lockers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {lockers.map((locker) => (
                    <div 
                      key={locker.id} 
                      className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleViewLocker(locker)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                          <i className="fas fa-lock text-white text-xl" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">{locker.lockerNumber}</h3>
                          <p className="text-sm text-slate-600">{locker.location}</p>
                          <p className="text-xs text-slate-500">
                            Battery: {locker.batteryLevel}% | Signal: {locker.signalStrength}%
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={cn("px-2.5 py-1 text-xs font-semibold rounded", getStatusBadgeClass(locker.status))}>
                          {locker.status}
                        </span>
                        <span className={cn("px-2.5 py-1 text-xs font-semibold rounded", getSizeBadgeClass(locker.size))}>
                          {locker.size}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Reservations Tab */}
        {currentTab === 'reservations' && (
          <div className="space-y-6">
            <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center shadow-lg mr-3">
                    <i className="fas fa-calendar text-white text-lg" />
                  </div>
                  Locker Reservations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reservations.map((reservation) => (
                    <div key={reservation.id} className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-slate-900">{reservation.guestName}</h3>
                        <span className={cn("px-2.5 py-1 text-xs font-semibold rounded", getReservationStatusBadgeClass(reservation.status))}>
                          {reservation.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-slate-600">Locker:</span>
                          <p className="font-medium">L{reservation.lockerId}</p>
                        </div>
                        <div>
                          <span className="text-slate-600">Start Time:</span>
                          <p className="font-medium">{new Date(reservation.startTime).toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-slate-600">Purpose:</span>
                          <p className="font-medium">{reservation.purpose}</p>
                        </div>
                      </div>
                    </div>
                  ))}
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
                  Locker Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-700 to-blue-800 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <i className="fas fa-clock text-white text-2xl" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Average Occupancy</h3>
                    <p className="text-slate-600">{metrics.averageOccupancyTime} hours</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl">
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <i className="fas fa-battery-quarter text-white text-2xl" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Battery Alerts</h3>
                    <p className="text-slate-600">{metrics.batteryAlerts} lockers</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl">
                    <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <i className="fas fa-wifi text-white text-2xl" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Signal Issues</h3>
                    <p className="text-slate-600">{metrics.signalIssues} lockers</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Settings Tab */}
        {currentTab === 'settings' && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-700 to-blue-800 rounded-xl flex items-center justify-center shadow-lg mx-auto mb-4">
              <i className="fas fa-cogs text-white text-2xl" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Smart Lockers Settings</h3>
            <p className="text-slate-600">Configure smart locker system settings and preferences.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartLockers;



