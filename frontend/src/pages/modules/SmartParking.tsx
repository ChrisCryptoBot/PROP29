import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Badge } from '../../components/UI/Badge';
import { Avatar } from '../../components/UI/Avatar';
import { showSuccess, showError, showLoading, dismissLoadingAndShowSuccess, dismissLoadingAndShowError } from '../../utils/toast';

// Types
interface ParkingSpace {
  id: string;
  number: string;
  type: 'guest' | 'staff' | 'valet' | 'handicap' | 'ev';
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  floor: number;
  zone: string;
  guestId?: string;
  vehicleInfo?: {
    make: string;
    model: string;
    color: string;
    plate: string;
  };
  checkInTime?: string;
  checkOutTime?: string;
  duration?: number;
  cost?: number;
}

interface GuestParking {
  id: string;
  guestId: string;
  guestName: string;
  roomNumber: string;
  vehicleInfo: {
    make: string;
    model: string;
    color: string;
    plate: string;
  };
  spaceId: string;
  spaceNumber: string;
  checkInTime: string;
  expectedCheckOut?: string;
  status: 'active' | 'completed' | 'overdue';
  cost: number;
  valetRequested: boolean;
  notes?: string;
}

interface ParkingAnalytics {
  totalSpaces: number;
  occupiedSpaces: number;
  availableSpaces: number;
  guestSpaces: number;
  staffSpaces: number;
  valetSpaces: number;
  handicapSpaces: number;
  evSpaces: number;
  occupancyRate: number;
  revenue: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  peakHours: {
    hour: number;
    occupancy: number;
  }[];
}

interface ParkingSettings {
  pricing: {
    guestHourly: number;
    guestDaily: number;
    valetFee: number;
    evChargingFee: number;
  };
  policies: {
    maxStayHours: number;
    gracePeriodMinutes: number;
    lateFeeRate: number;
    autoCheckoutEnabled: boolean;
  };
  notifications: {
    lowOccupancyAlert: boolean;
    maintenanceReminders: boolean;
    guestCheckoutReminders: boolean;
    revenueReports: boolean;
  };
  integration: {
    accessControlEnabled: boolean;
    billingSystemEnabled: boolean;
    mobileAppEnabled: boolean;
    guestCheckinSync: boolean;
  };
}

const SmartParking: React.FC = () => {
  // State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [spaces, setSpaces] = useState<ParkingSpace[]>([]);
  const [guestParkings, setGuestParkings] = useState<GuestParking[]>([]);
  const [analytics, setAnalytics] = useState<ParkingAnalytics>({
    totalSpaces: 200,
    occupiedSpaces: 145,
    availableSpaces: 55,
    guestSpaces: 80,
    staffSpaces: 60,
    valetSpaces: 30,
    handicapSpaces: 15,
    evSpaces: 15,
    occupancyRate: 72.5,
    revenue: {
      today: 1250.00,
      thisWeek: 8750.00,
      thisMonth: 35000.00
    },
    peakHours: [
      { hour: 8, occupancy: 45 },
      { hour: 9, occupancy: 78 },
      { hour: 10, occupancy: 89 },
      { hour: 11, occupancy: 92 },
      { hour: 12, occupancy: 88 },
      { hour: 13, occupancy: 85 },
      { hour: 14, occupancy: 82 },
      { hour: 15, occupancy: 79 },
      { hour: 16, occupancy: 76 },
      { hour: 17, occupancy: 73 },
      { hour: 18, occupancy: 68 },
      { hour: 19, occupancy: 55 }
    ]
  });
  const [settings, setSettings] = useState<ParkingSettings>({
    pricing: {
      guestHourly: 5.00,
      guestDaily: 25.00,
      valetFee: 15.00,
      evChargingFee: 2.50
    },
    policies: {
      maxStayHours: 24,
      gracePeriodMinutes: 15,
      lateFeeRate: 1.5,
      autoCheckoutEnabled: true
    },
    notifications: {
      lowOccupancyAlert: true,
      maintenanceReminders: true,
      guestCheckoutReminders: true,
      revenueReports: true
    },
    integration: {
      accessControlEnabled: true,
      billingSystemEnabled: true,
      mobileAppEnabled: true,
      guestCheckinSync: true
    }
  });

  // Modals
  const [showSpaceModal, setShowSpaceModal] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<ParkingSpace | null>(null);
  const [selectedGuest, setSelectedGuest] = useState<GuestParking | null>(null);

  // Forms
  const [spaceForm, setSpaceForm] = useState({
    number: '',
    type: 'guest' as ParkingSpace['type'],
    floor: 1,
    zone: '',
    status: 'available' as ParkingSpace['status']
  });

  const [guestForm, setGuestForm] = useState({
    guestId: '',
    guestName: '',
    roomNumber: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleColor: '',
    vehiclePlate: '',
    spaceId: '',
    valetRequested: false,
    notes: ''
  });

  // Mock data initialization
  useEffect(() => {
    const mockSpaces: ParkingSpace[] = Array.from({ length: 200 }, (_, i) => ({
      id: `space-${i + 1}`,
      number: `P${String(i + 1).padStart(3, '0')}`,
      type: i < 80 ? 'guest' : i < 140 ? 'staff' : i < 170 ? 'valet' : i < 185 ? 'handicap' : 'ev',
      status: Math.random() > 0.3 ? 'occupied' : 'available',
      floor: Math.floor(i / 50) + 1,
      zone: ['A', 'B', 'C', 'D'][Math.floor(i / 50)],
      ...(Math.random() > 0.3 && {
        guestId: `guest-${Math.floor(Math.random() * 100)}`,
        vehicleInfo: {
          make: ['Toyota', 'Honda', 'BMW', 'Mercedes', 'Audi'][Math.floor(Math.random() * 5)],
          model: ['Camry', 'Civic', 'X3', 'C-Class', 'A4'][Math.floor(Math.random() * 5)],
          color: ['White', 'Black', 'Silver', 'Blue', 'Red'][Math.floor(Math.random() * 5)],
          plate: `ABC-${Math.floor(Math.random() * 1000)}`
        },
        checkInTime: new Date(Date.now() - Math.random() * 86400000).toISOString(),
        duration: Math.floor(Math.random() * 8) + 1,
        cost: Math.floor(Math.random() * 50) + 10
      })
    }));

    const mockGuests: GuestParking[] = Array.from({ length: 50 }, (_, i) => ({
      id: `guest-parking-${i + 1}`,
      guestId: `guest-${i + 1}`,
      guestName: `Guest ${i + 1}`,
      roomNumber: `${Math.floor(Math.random() * 20) + 100}`,
      vehicleInfo: {
        make: ['Toyota', 'Honda', 'BMW', 'Mercedes', 'Audi'][Math.floor(Math.random() * 5)],
        model: ['Camry', 'Civic', 'X3', 'C-Class', 'A4'][Math.floor(Math.random() * 5)],
        color: ['White', 'Black', 'Silver', 'Blue', 'Red'][Math.floor(Math.random() * 5)],
        plate: `ABC-${Math.floor(Math.random() * 1000)}`
      },
      spaceId: `space-${i + 1}`,
      spaceNumber: `P${String(i + 1).padStart(3, '0')}`,
      checkInTime: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      expectedCheckOut: new Date(Date.now() + Math.random() * 86400000).toISOString(),
      status: Math.random() > 0.2 ? 'active' : 'completed',
      cost: Math.floor(Math.random() * 50) + 10,
      valetRequested: Math.random() > 0.7,
      notes: Math.random() > 0.8 ? 'Special requirements' : undefined
    }));

    setSpaces(mockSpaces);
    setGuestParkings(mockGuests);
  }, []);

  // Memoized calculations
  const availableSpaces = useMemo(() => spaces.filter(s => s.status === 'available'), [spaces]);
  const occupiedSpaces = useMemo(() => spaces.filter(s => s.status === 'occupied'), [spaces]);
  const reservedSpaces = useMemo(() => spaces.filter(s => s.status === 'reserved'), [spaces]);
  const maintenanceSpaces = useMemo(() => spaces.filter(s => s.status === 'maintenance'), [spaces]);

  const activeGuestParkings = useMemo(() => guestParkings.filter(g => g.status === 'active'), [guestParkings]);
  const completedGuestParkings = useMemo(() => guestParkings.filter(g => g.status === 'completed'), [guestParkings]);
  const overdueGuestParkings = useMemo(() => guestParkings.filter(g => g.status === 'overdue'), [guestParkings]);

  const guestSpaces = useMemo(() => spaces.filter(s => s.type === 'guest'), [spaces]);
  const staffSpaces = useMemo(() => spaces.filter(s => s.type === 'staff'), [spaces]);
  const valetSpaces = useMemo(() => spaces.filter(s => s.type === 'valet'), [spaces]);
  const handicapSpaces = useMemo(() => spaces.filter(s => s.type === 'handicap'), [spaces]);
  const evSpaces = useMemo(() => spaces.filter(s => s.type === 'ev'), [spaces]);

  // Handlers
  const handleSpaceAction = useCallback((spaceId: string, action: string) => {
    const space = spaces.find(s => s.id === spaceId);
    if (!space) return;

    setLoading(true);
    const toastId = showLoading('Processing...');

    setTimeout(() => {
      if (action === 'reserve') {
        setSpaces(prev => prev.map(s => 
          s.id === spaceId ? { ...s, status: 'reserved' as const } : s
        ));
        dismissLoadingAndShowSuccess(toastId, 'Space reserved successfully');
      } else if (action === 'release') {
        setSpaces(prev => prev.map(s => 
          s.id === spaceId ? { ...s, status: 'available' as const, guestId: undefined, vehicleInfo: undefined } : s
        ));
        dismissLoadingAndShowSuccess(toastId, 'Space released successfully');
      } else if (action === 'maintenance') {
        setSpaces(prev => prev.map(s => 
          s.id === spaceId ? { ...s, status: 'maintenance' as const } : s
        ));
        dismissLoadingAndShowSuccess(toastId, 'Space set to maintenance');
      }
      setLoading(false);
    }, 1000);
  }, [spaces]);

  const handleGuestAction = useCallback((guestId: string, action: string) => {
    const guest = guestParkings.find(g => g.id === guestId);
    if (!guest) return;

    setLoading(true);
    const toastId = showLoading('Processing...');

    setTimeout(() => {
      if (action === 'checkout') {
        setGuestParkings(prev => prev.map(g => 
          g.id === guestId ? { ...g, status: 'completed' as const } : g
        ));
        setSpaces(prev => prev.map(s => 
          s.id === guest.spaceId ? { ...s, status: 'available' as const, guestId: undefined, vehicleInfo: undefined } : s
        ));
        dismissLoadingAndShowSuccess(toastId, 'Guest checked out successfully');
      } else if (action === 'extend') {
        dismissLoadingAndShowSuccess(toastId, 'Parking extended successfully');
      } else if (action === 'valet') {
        dismissLoadingAndShowSuccess(toastId, 'Valet service requested');
      }
      setLoading(false);
    }, 1000);
  }, [guestParkings]);

  const handleAddSpace = useCallback(async () => {
    if (!spaceForm.number || !spaceForm.zone) {
      showError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    const toastId = showLoading('Adding parking space...');

    try {
      const newSpace: ParkingSpace = {
        id: `space-${Date.now()}`,
        number: spaceForm.number,
        type: spaceForm.type,
        status: spaceForm.status,
        floor: spaceForm.floor,
        zone: spaceForm.zone
      };

      setSpaces(prev => [newSpace, ...prev]);
      setShowSpaceModal(false);
      setSpaceForm({
        number: '',
        type: 'guest',
        floor: 1,
        zone: '',
        status: 'available'
      });

      dismissLoadingAndShowSuccess(toastId, 'Parking space added successfully');
    } catch (error) {
      dismissLoadingAndShowError(toastId, 'Failed to add parking space');
    } finally {
      setLoading(false);
    }
  }, [spaceForm]);

  const handleAddGuest = useCallback(async () => {
    if (!guestForm.guestName || !guestForm.vehiclePlate || !guestForm.spaceId) {
      showError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    const toastId = showLoading('Registering guest parking...');

    try {
      const newGuest: GuestParking = {
        id: `guest-parking-${Date.now()}`,
        guestId: guestForm.guestId,
        guestName: guestForm.guestName,
        roomNumber: guestForm.roomNumber,
        vehicleInfo: {
          make: guestForm.vehicleMake,
          model: guestForm.vehicleModel,
          color: guestForm.vehicleColor,
          plate: guestForm.vehiclePlate
        },
        spaceId: guestForm.spaceId,
        spaceNumber: spaces.find(s => s.id === guestForm.spaceId)?.number || '',
        checkInTime: new Date().toISOString(),
        status: 'active',
        cost: 0,
        valetRequested: guestForm.valetRequested,
        notes: guestForm.notes
      };

      setGuestParkings(prev => [newGuest, ...prev]);
      setSpaces(prev => prev.map(s => 
        s.id === guestForm.spaceId ? { ...s, status: 'occupied' as const, guestId: newGuest.guestId, vehicleInfo: newGuest.vehicleInfo } : s
      ));
      setShowGuestModal(false);
      setGuestForm({
        guestId: '',
        guestName: '',
        roomNumber: '',
        vehicleMake: '',
        vehicleModel: '',
        vehicleColor: '',
        vehiclePlate: '',
        spaceId: '',
        valetRequested: false,
        notes: ''
      });

      dismissLoadingAndShowSuccess(toastId, 'Guest parking registered successfully');
    } catch (error) {
      dismissLoadingAndShowError(toastId, 'Failed to register guest parking');
    } finally {
      setLoading(false);
    }
  }, [guestForm, spaces]);

  const handleSettingsChange = useCallback((key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const handleSaveSettings = useCallback(async () => {
    setLoading(true);
    const toastId = showLoading('Saving settings...');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'All settings saved successfully');
      }
    } catch (error) {
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to save settings');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleExportData = useCallback(() => {
    const data = {
      spaces,
      guestParkings,
      analytics,
      settings
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `parking-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showSuccess('Parking data exported successfully');
  }, [spaces, guestParkings, analytics, settings]);

  const handleRefresh = useCallback(() => {
    setLoading(true);
    const toastId = showLoading('Refreshing data...');
    
    setTimeout(() => {
      dismissLoadingAndShowSuccess(toastId, 'Data refreshed successfully');
      setLoading(false);
    }, 1000);
  }, []);

  // Tab content renderer
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
  return (
          <div className="space-y-6">
            {/* Key Metrics - GOLD STANDARD 4-CARD LAYOUT */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center mb-4">
                    <i className="fas fa-parking text-white text-xl" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 mb-1">{analytics.totalSpaces}</div>
                  <div className="text-sm text-slate-600">Total Spaces</div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center mb-4">
                    <i className="fas fa-check-circle text-white text-xl" />
        </div>
                  <div className="text-2xl font-bold text-slate-900 mb-1">{analytics.availableSpaces}</div>
                  <div className="text-sm text-slate-600">Available</div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center mb-4">
                    <i className="fas fa-users text-white text-xl" />
              </div>
                  <div className="text-2xl font-bold text-slate-900 mb-1">{activeGuestParkings.length}</div>
                  <div className="text-sm text-slate-600">Active Guests</div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center mb-4">
                    <i className="fas fa-dollar-sign text-white text-xl" />
              </div>
                  <div className="text-2xl font-bold text-slate-900 mb-1">${analytics.revenue.today}</div>
                  <div className="text-sm text-slate-600">Today's Revenue</div>
                </CardContent>
              </Card>
        </div>

            {/* Emergency Actions */}
            <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
              <CardHeader>
                <h3 className="flex items-center text-xl font-semibold text-slate-900">
                  <i className="fas fa-exclamation-triangle mr-3 text-slate-600" />
                  Emergency Actions
                </h3>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    onClick={() => {
                      const overdueVehicles = guestParkings.filter(g => g.status === 'overdue');
                      showSuccess(`${overdueVehicles.length} vehicles have exceeded their time limit`);
                    }}
                    className="!bg-red-600 hover:!bg-red-700 text-white"
                  >
                    <i className="fas fa-exclamation-triangle mr-2" />
                    Overdue Alert
                  </Button>
                  <Button 
                    onClick={() => {
                      const activeVehicles = guestParkings.filter(g => g.status === 'active');
                      showSuccess(`${activeVehicles.length} vehicles currently parked`);
                    }}
                    className="!bg-orange-600 hover:!bg-orange-700 text-white"
                  >
                    <i className="fas fa-car mr-2" />
                    Active Vehicles
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
              <CardHeader>
                <h3 className="text-lg font-semibold text-slate-900">Recent Parking Activity</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeGuestParkings.slice(0, 5).map((guest) => (
                    <div key={guest.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Avatar className="w-10 h-10 bg-blue-100 text-blue-600">
                          <i className="fas fa-car" />
                        </Avatar>
                        <div>
                          <div className="font-medium text-slate-900">{guest.guestName}</div>
                          <div className="text-sm text-slate-600">{guest.vehicleInfo.make} {guest.vehicleInfo.model}</div>
                </div>
              </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-slate-900">Space {guest.spaceNumber}</div>
                        <div className="text-sm text-slate-600">{guest.roomNumber}</div>
          </div>
        </div>
                  ))}
      </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'spaces':
        return (
          <div className="space-y-6">
            {/* Space Management Actions */}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-900">Parking Space Management</h3>
              <Button onClick={() => setShowSpaceModal(true)} className="!bg-[#2563eb] hover:!bg-blue-700 text-white">
                <i className="fas fa-plus mr-2" />
                Add Space
              </Button>
            </div>

            {/* Space Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                      <i className="fas fa-check-circle text-white text-xl" />
                </div>
              </div>
              <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-slate-900">{availableSpaces.length}</h3>
                    <p className="text-slate-600 text-sm">Available</p>
              </div>
            </CardContent>
          </Card>
              <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                      <i className="fas fa-parking text-white text-xl" />
                </div>
              </div>
              <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-slate-900">{occupiedSpaces.length}</h3>
                    <p className="text-slate-600 text-sm">Occupied</p>
              </div>
            </CardContent>
          </Card>
              <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                      <i className="fas fa-clock text-white text-xl" />
                </div>
              </div>
              <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-slate-900">{reservedSpaces.length}</h3>
                    <p className="text-slate-600 text-sm">Reserved</p>
              </div>
            </CardContent>
          </Card>
              <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                      <i className="fas fa-tools text-white text-xl" />
                </div>
              </div>
              <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-slate-900">{maintenanceSpaces.length}</h3>
                    <p className="text-slate-600 text-sm">Maintenance</p>
              </div>
            </CardContent>
          </Card>
        </div>

            {/* Spaces Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {spaces.map((space) => (
                <Card key={space.id} className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                    <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-semibold text-slate-900">{space.number}</div>
                      <Badge 
                        variant={space.status === 'available' ? 'success' : 
                                space.status === 'occupied' ? 'warning' : 
                                space.status === 'reserved' ? 'default' : 'destructive'}
                      >
                        {space.status}
                      </Badge>
                </div>
                    
                    <div className="space-y-2 text-sm text-slate-600">
                      <div className="flex justify-between">
                        <span>Type:</span>
                        <span className="capitalize">{space.type}</span>
                        </div>
                      <div className="flex justify-between">
                        <span>Floor:</span>
                        <span>{space.floor}</span>
                        </div>
                      <div className="flex justify-between">
                        <span>Zone:</span>
                        <span>{space.zone}</span>
                      </div>
                      {space.vehicleInfo && (
                        <div className="pt-2 border-t">
                          <div className="text-xs text-slate-500">
                            {space.vehicleInfo.make} {space.vehicleInfo.model}
                    </div>
                          <div className="text-xs text-slate-500">
                            {space.vehicleInfo.plate}
                </div>
          </div>
        )}
                  </div>

                    <div className="mt-4 flex space-x-2">
                      {space.status === 'available' && (
                  <Button
                          size="sm" 
                          onClick={() => handleSpaceAction(space.id, 'reserve')}
                          className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
                  >
                          Reserve
                  </Button>
                      )}
                      {space.status === 'occupied' && (
                        <Button 
                          size="sm" 
                          onClick={() => handleSpaceAction(space.id, 'release')}
                          className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
                        >
                          Release
                        </Button>
                      )}
                      {space.status !== 'maintenance' && (
                        <Button 
                          size="sm" 
                          onClick={() => handleSpaceAction(space.id, 'maintenance')}
                          className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
                        >
                          Maintenance
                        </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
          </div>
        );

      case 'guests':
        return (
          <div className="space-y-6">
            {/* Guest Management Actions */}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-900">Guest Parking Management</h3>
              <Button onClick={() => setShowGuestModal(true)} className="!bg-[#2563eb] hover:!bg-blue-700 text-white">
                <i className="fas fa-user-plus mr-2" />
                Register Guest
              </Button>
                            </div>

            {/* Guest Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                      <i className="fas fa-users text-white text-xl" />
                            </div>
                          </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-slate-900">{activeGuestParkings.length}</h3>
                    <p className="text-slate-600 text-sm">Active</p>
                        </div>
                </CardContent>
              </Card>
              <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                      <i className="fas fa-check-circle text-white text-xl" />
                          </div>
                          </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-slate-900">{completedGuestParkings.length}</h3>
                    <p className="text-slate-600 text-sm">Completed</p>
                        </div>
                      </CardContent>
                    </Card>
              <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                      <i className="fas fa-exclamation-triangle text-white text-xl" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-slate-900">{overdueGuestParkings.length}</h3>
                    <p className="text-slate-600 text-sm">Overdue</p>
                </div>
              </CardContent>
            </Card>
            </div>

            {/* Guest List */}
            <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm">
              <CardHeader>
                <h3 className="text-lg font-semibold text-slate-900">Guest Parking Records</h3>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-slate-900">Guest</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-900">Vehicle</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-900">Space</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-900">Room</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-900">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {guestParkings.map((guest) => (
                        <tr key={guest.id} className="border-b hover:bg-slate-50">
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium text-slate-900">{guest.guestName}</div>
                              <div className="text-sm text-slate-600">{guest.guestId}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium text-slate-900">{guest.vehicleInfo.make} {guest.vehicleInfo.model}</div>
                              <div className="text-sm text-slate-600">{guest.vehicleInfo.plate}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-slate-900">{guest.spaceNumber}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-slate-900">{guest.roomNumber}</div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge 
                              variant={guest.status === 'active' ? 'default' : 
                                      guest.status === 'completed' ? 'success' : 'destructive'}
                            >
                              {guest.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              {guest.status === 'active' && (
                                <>
                              <Button
                                size="sm"
                                    onClick={() => handleGuestAction(guest.id, 'checkout')}
                                    className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
                              >
                                    Checkout
                              </Button>
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleGuestAction(guest.id, 'extend')}
                                    className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
                                  >
                                    Extend
                                  </Button>
                                </>
                              )}
                              {guest.valetRequested && (
                              <Button
                                size="sm"
                                  onClick={() => handleGuestAction(guest.id, 'valet')}
                                  className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
                              >
                                  Valet
                              </Button>
                            )}
                          </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                        </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-6">
            {/* Analytics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                      <i className="fas fa-chart-line text-white text-xl" />
                          </div>
                          </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-slate-900">{analytics.occupancyRate}%</h3>
                    <p className="text-slate-600 text-sm">Occupancy Rate</p>
                          </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                      <i className="fas fa-dollar-sign text-white text-xl" />
                          </div>
                        </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-slate-900">${analytics.revenue.today}</h3>
                    <p className="text-slate-600 text-sm">Today's Revenue</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                      <i className="fas fa-calendar-week text-white text-xl" />
                            </div>
                          </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-slate-900">${analytics.revenue.thisWeek}</h3>
                    <p className="text-slate-600 text-sm">This Week</p>
                  </div>
                      </CardContent>
                    </Card>

              <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                      <i className="fas fa-calendar-alt text-white text-xl" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-slate-900">${analytics.revenue.thisMonth}</h3>
                    <p className="text-slate-600 text-sm">This Month</p>
                </div>
              </CardContent>
            </Card>
          </div>

            {/* Space Type Distribution */}
            <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm">
            <CardHeader>
                <h3 className="text-lg font-semibold text-slate-900">Space Type Distribution</h3>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <div className="text-2xl font-bold text-slate-900">{guestSpaces.length}</div>
                    <div className="text-sm text-slate-600">Guest Spaces</div>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <div className="text-2xl font-bold text-slate-900">{staffSpaces.length}</div>
                    <div className="text-sm text-slate-600">Staff Spaces</div>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <div className="text-2xl font-bold text-slate-900">{valetSpaces.length}</div>
                    <div className="text-sm text-slate-600">Valet Spaces</div>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <div className="text-2xl font-bold text-slate-900">{handicapSpaces.length}</div>
                    <div className="text-sm text-slate-600">Handicap Spaces</div>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <div className="text-2xl font-bold text-slate-900">{evSpaces.length}</div>
                    <div className="text-sm text-slate-600">EV Spaces</div>
                  </div>
              </div>
            </CardContent>
          </Card>

            {/* Peak Hours Chart */}
            <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm">
            <CardHeader>
                <h3 className="text-lg font-semibold text-slate-900">Peak Hours Analysis</h3>
            </CardHeader>
            <CardContent>
                <div className="h-64 flex items-end space-x-2">
                  {analytics.peakHours.map((hour) => (
                    <div key={hour.hour} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-blue-600 rounded-t"
                        style={{ height: `${(hour.occupancy / 100) * 200}px` }}
                      />
                      <div className="text-xs text-slate-600 mt-2">{hour.hour}:00</div>
                      <div className="text-xs text-slate-500">{hour.occupancy}%</div>
                    </div>
                  ))}
                </div>
                  </CardContent>
                </Card>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            {/* Settings Sections */}
            <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm">
              <CardHeader>
                <h3 className="text-lg font-semibold text-slate-900">Pricing Configuration</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Guest Hourly Rate</label>
                    <input
                      type="number"
                      step="0.01"
                      value={settings.pricing.guestHourly}
                      onChange={(e) => handleSettingsChange('pricing', { ...settings.pricing, guestHourly: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Guest Daily Rate</label>
                    <input
                      type="number"
                      step="0.01"
                      value={settings.pricing.guestDaily}
                      onChange={(e) => handleSettingsChange('pricing', { ...settings.pricing, guestDaily: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Valet Fee</label>
                    <input
                      type="number"
                      step="0.01"
                      value={settings.pricing.valetFee}
                      onChange={(e) => handleSettingsChange('pricing', { ...settings.pricing, valetFee: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">EV Charging Fee</label>
                    <input
                      type="number"
                      step="0.01"
                      value={settings.pricing.evChargingFee}
                      onChange={(e) => handleSettingsChange('pricing', { ...settings.pricing, evChargingFee: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                  </CardContent>
                </Card>

            <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm">
              <CardHeader>
                <h3 className="text-lg font-semibold text-slate-900">Policy Settings</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Max Stay Hours</label>
                    <input
                      type="number"
                      value={settings.policies.maxStayHours}
                      onChange={(e) => handleSettingsChange('policies', { ...settings.policies, maxStayHours: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Grace Period (Minutes)</label>
                    <input
                      type="number"
                      value={settings.policies.gracePeriodMinutes}
                      onChange={(e) => handleSettingsChange('policies', { ...settings.policies, gracePeriodMinutes: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Late Fee Rate</label>
                    <input
                      type="number"
                      step="0.1"
                      value={settings.policies.lateFeeRate}
                      onChange={(e) => handleSettingsChange('policies', { ...settings.policies, lateFeeRate: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="autoCheckout"
                      checked={settings.policies.autoCheckoutEnabled}
                      onChange={(e) => handleSettingsChange('policies', { ...settings.policies, autoCheckoutEnabled: e.target.checked })}
                      className="mr-2"
                    />
                    <label htmlFor="autoCheckout" className="text-sm font-medium text-slate-700">Auto Checkout Enabled</label>
                  </div>
                </div>
                  </CardContent>
                </Card>

            <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm">
              <CardHeader>
                <h3 className="text-lg font-semibold text-slate-900">Notification Settings</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="lowOccupancyAlert"
                      checked={settings.notifications.lowOccupancyAlert}
                      onChange={(e) => handleSettingsChange('notifications', { ...settings.notifications, lowOccupancyAlert: e.target.checked })}
                      className="mr-2"
                    />
                    <label htmlFor="lowOccupancyAlert" className="text-sm font-medium text-slate-700">Low Occupancy Alerts</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="maintenanceReminders"
                      checked={settings.notifications.maintenanceReminders}
                      onChange={(e) => handleSettingsChange('notifications', { ...settings.notifications, maintenanceReminders: e.target.checked })}
                      className="mr-2"
                    />
                    <label htmlFor="maintenanceReminders" className="text-sm font-medium text-slate-700">Maintenance Reminders</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="guestCheckoutReminders"
                      checked={settings.notifications.guestCheckoutReminders}
                      onChange={(e) => handleSettingsChange('notifications', { ...settings.notifications, guestCheckoutReminders: e.target.checked })}
                      className="mr-2"
                    />
                    <label htmlFor="guestCheckoutReminders" className="text-sm font-medium text-slate-700">Guest Checkout Reminders</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="revenueReports"
                      checked={settings.notifications.revenueReports}
                      onChange={(e) => handleSettingsChange('notifications', { ...settings.notifications, revenueReports: e.target.checked })}
                      className="mr-2"
                    />
                    <label htmlFor="revenueReports" className="text-sm font-medium text-slate-700">Revenue Reports</label>
                  </div>
              </div>
            </CardContent>
          </Card>

            <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm">
            <CardHeader>
                <h3 className="text-lg font-semibold text-slate-900">Integration Settings</h3>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center">
                <input
                      type="checkbox"
                      id="accessControlEnabled"
                      checked={settings.integration.accessControlEnabled}
                      onChange={(e) => handleSettingsChange('integration', { ...settings.integration, accessControlEnabled: e.target.checked })}
                      className="mr-2"
                    />
                    <label htmlFor="accessControlEnabled" className="text-sm font-medium text-slate-700">Access Control Integration</label>
              </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="billingSystemEnabled"
                      checked={settings.integration.billingSystemEnabled}
                      onChange={(e) => handleSettingsChange('integration', { ...settings.integration, billingSystemEnabled: e.target.checked })}
                      className="mr-2"
                    />
                    <label htmlFor="billingSystemEnabled" className="text-sm font-medium text-slate-700">Billing System Integration</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="mobileAppEnabled"
                      checked={settings.integration.mobileAppEnabled}
                      onChange={(e) => handleSettingsChange('integration', { ...settings.integration, mobileAppEnabled: e.target.checked })}
                      className="mr-2"
                    />
                    <label htmlFor="mobileAppEnabled" className="text-sm font-medium text-gray-700">Mobile App Integration</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="guestCheckinSync"
                      checked={settings.integration.guestCheckinSync}
                      onChange={(e) => handleSettingsChange('integration', { ...settings.integration, guestCheckinSync: e.target.checked })}
                      className="mr-2"
                    />
                    <label htmlFor="guestCheckinSync" className="text-sm font-medium text-gray-700">Guest Check-in Sync</label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Settings Button */}
            <div className="flex justify-end">
              <Button onClick={handleSaveSettings} className="!bg-[#2563eb] hover:!bg-blue-700 text-white">
                <i className="fas fa-save mr-2" />
                Save All Settings
              </Button>
            </div>
          </div>
        );

      default:
        return null;
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
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
                <i className="fas fa-parking text-white text-2xl" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                <i className="fas fa-check text-white text-xs" />
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-slate-900">
                Smart Parking
              </h1>
              <p className="text-slate-600 font-medium">
                Comprehensive parking management and guest services system
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center pb-4">
          <div className="flex space-x-1 bg-white/60 backdrop-blur-sm p-1 rounded-lg shadow-lg border border-white/30">
            {[
              { id: 'dashboard', label: 'Dashboard' },
              { id: 'spaces', label: 'Space Management' },
              { id: 'guests', label: 'Guest Parking' },
              { id: 'analytics', label: 'Analytics & Reports' },
              { id: 'settings', label: 'Settings' }
            ].map((tab) => (
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

      {/* Main Content - GOLD STANDARD LAYOUT */}
      <div className="relative max-w-7xl mx-auto px-6 py-6">
        {renderTabContent()}
      </div>

      {/* Add Space Modal */}
      {showSpaceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Parking Space</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Space Number</label>
                <input
                  type="text"
                  value={spaceForm.number}
                  onChange={(e) => setSpaceForm(prev => ({ ...prev, number: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., P001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Space Type</label>
                <select
                  value={spaceForm.type}
                  onChange={(e) => setSpaceForm(prev => ({ ...prev, type: e.target.value as ParkingSpace['type'] }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="guest">Guest</option>
                  <option value="staff">Staff</option>
                  <option value="valet">Valet</option>
                  <option value="handicap">Handicap</option>
                  <option value="ev">Electric Vehicle</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Floor</label>
                <input
                  type="number"
                  min="1"
                  value={spaceForm.floor}
                  onChange={(e) => setSpaceForm(prev => ({ ...prev, floor: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Zone</label>
                <input
                  type="text"
                  value={spaceForm.zone}
                  onChange={(e) => setSpaceForm(prev => ({ ...prev, zone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., A, B, C"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button onClick={() => setShowSpaceModal(false)} className="!bg-gray-600 hover:!bg-gray-700 text-white">
                  Cancel
                </Button>
              <Button onClick={handleAddSpace} className="!bg-[#2563eb] hover:!bg-blue-700 text-white">
                Add Space
                </Button>
              </div>
          </div>
        </div>
      )}

      {/* Register Guest Modal */}
      {showGuestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Register Guest Parking</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Guest Name</label>
                  <input
                    type="text"
                  value={guestForm.guestName}
                  onChange={(e) => setGuestForm(prev => ({ ...prev, guestName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Guest name"
                  />
                </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Room Number</label>
                  <input
                    type="text"
                  value={guestForm.roomNumber}
                  onChange={(e) => setGuestForm(prev => ({ ...prev, roomNumber: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Room number"
                  />
                </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Make</label>
                  <input
                    type="text"
                  value={guestForm.vehicleMake}
                  onChange={(e) => setGuestForm(prev => ({ ...prev, vehicleMake: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Toyota"
                  />
                </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Model</label>
                  <input
                    type="text"
                  value={guestForm.vehicleModel}
                  onChange={(e) => setGuestForm(prev => ({ ...prev, vehicleModel: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Camry"
                  />
                </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Color</label>
                  <input
                    type="text"
                  value={guestForm.vehicleColor}
                  onChange={(e) => setGuestForm(prev => ({ ...prev, vehicleColor: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., White"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">License Plate</label>
                <input
                  type="text"
                  value={guestForm.vehiclePlate}
                  onChange={(e) => setGuestForm(prev => ({ ...prev, vehiclePlate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., ABC-123"
                  />
                </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Parking Space</label>
                <select
                  value={guestForm.spaceId}
                  onChange={(e) => setGuestForm(prev => ({ ...prev, spaceId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a space</option>
                  {availableSpaces.map((space) => (
                    <option key={space.id} value={space.id}>
                      {space.number} - {space.type} (Floor {space.floor}, Zone {space.zone})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center">
                      <input
                        type="checkbox"
                  id="valetRequested"
                  checked={guestForm.valetRequested}
                  onChange={(e) => setGuestForm(prev => ({ ...prev, valetRequested: e.target.checked }))}
                  className="mr-2"
                />
                <label htmlFor="valetRequested" className="text-sm font-medium text-gray-700">Valet Service Requested</label>
                </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={guestForm.notes}
                  onChange={(e) => setGuestForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Special requirements or notes"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button onClick={() => setShowGuestModal(false)} className="!bg-gray-600 hover:!bg-gray-700 text-white">
                  Cancel
                </Button>
              <Button onClick={handleAddGuest} className="!bg-[#2563eb] hover:!bg-blue-700 text-white">
                Register Guest
                </Button>
              </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartParking;

