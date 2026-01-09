import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Badge } from '../../components/UI/Badge';
import { Avatar } from '../../components/UI/Avatar';
import { Progress } from '../../components/UI/Progress';
import { cn } from '../../utils/cn';
import { showError, showSuccess, showLoading, dismissLoadingAndShowSuccess, dismissLoadingAndShowError } from '../../utils/toast';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SmartMatchingPanel } from '../../components/PackageModule';
import '../../styles/modern-glass.css';

interface Package {
  id: string;
  tracking_number: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_email?: string;
  recipient_room?: string;
  sender_name: string;
  sender_company?: string;
  sender_phone?: string;
  sender_email?: string;
  package_type: 'parcel' | 'document' | 'food' | 'equipment' | 'other';
  package_size: 'small' | 'medium' | 'large' | 'oversized';
  weight?: number;
  dimensions?: string;
  description: string;
  status: 'received' | 'notified' | 'delivered' | 'picked_up' | 'expired' | 'returned';
  received_date: string;
  delivered_date?: string;
  pickup_date?: string;
  expiry_date?: string;
  location: string;
  notes?: string;
  signature_required: boolean;
  signature_url?: string;
  photo_url?: string;
  qr_code?: string;
  created_at: string;
  updated_at: string;
  delivered_by?: string;
  picked_up_by?: string;
  delivery_attempts: number;
  last_attempt_date?: string;
  carrier: 'FedEx' | 'UPS' | 'DHL' | 'USPS' | 'Amazon' | 'Other';
  carrier_tracking?: string;
  special_handling: 'fragile' | 'refrigerated' | 'high_value' | 'none';
  delivery_instructions?: string;
  guest_preferences?: {
    preferred_contact: 'email' | 'sms' | 'app' | 'phone';
    delivery_time?: string;
    room_delivery: boolean;
    hold_until_checkout: boolean;
  };
  routing_info?: {
    zone: string;
    priority: 'high' | 'normal' | 'low';
    assigned_staff?: string;
  };
  compliance: {
    restricted_item: boolean;
    requires_id: boolean;
    age_verification: boolean;
  };
}

const mockPackages: Package[] = [
  {
    id: '1',
    tracking_number: 'PKG123456789',
    recipient_name: 'John Smith',
    recipient_phone: '+1-555-0123',
    recipient_email: 'john.smith@email.com',
    recipient_room: '302',
    sender_name: 'Amazon',
    sender_company: 'Amazon.com',
    package_type: 'parcel',
    package_size: 'medium',
    weight: 2.5,
    dimensions: '12x8x6 inches',
    description: 'Electronics package',
    status: 'notified',
    received_date: '2025-01-27 14:30',
    location: 'Mail Room A',
    signature_required: true,
    photo_url: 'package_1_photo.jpg',
    qr_code: 'PKG_001_QR',
    created_at: '2025-01-27 14:30',
    updated_at: '2025-01-27 14:30',
    delivery_attempts: 0,
    carrier: 'Amazon',
    carrier_tracking: 'TBA123456789',
    special_handling: 'none',
    delivery_instructions: 'Please deliver to room 302',
    guest_preferences: {
      preferred_contact: 'app',
      room_delivery: true,
      hold_until_checkout: false
    },
    routing_info: {
      zone: 'East Wing',
      priority: 'normal'
    },
    compliance: {
      restricted_item: false,
      requires_id: false,
      age_verification: false
    }
  },
  {
    id: '2',
    tracking_number: 'PKG987654321',
    recipient_name: 'Sarah Johnson',
    recipient_phone: '+1-555-0456',
    recipient_email: 'sarah.j@email.com',
    recipient_room: '415',
    sender_name: 'FedEx',
    sender_company: 'FedEx Express',
    package_type: 'document',
    package_size: 'small',
    weight: 0.5,
    dimensions: '9x6x1 inches',
    description: 'Important documents',
    status: 'delivered',
    received_date: '2025-01-27 09:15',
    delivered_date: '2025-01-27 10:30',
    location: 'Front Desk',
    signature_required: true,
    signature_url: 'signature_2.jpg',
    photo_url: 'package_2_photo.jpg',
    qr_code: 'PKG_002_QR',
    created_at: '2025-01-27 09:15',
    updated_at: '2025-01-27 10:30',
    delivered_by: 'Mike Davis',
    delivery_attempts: 1,
    carrier: 'FedEx',
    carrier_tracking: '794123456789',
    special_handling: 'none',
    delivery_instructions: 'Urgent - deliver immediately',
    guest_preferences: {
      preferred_contact: 'sms',
      room_delivery: false,
      hold_until_checkout: false
    },
    routing_info: {
      zone: 'West Wing',
      priority: 'high',
      assigned_staff: 'Mike Davis'
    },
    compliance: {
      restricted_item: false,
      requires_id: false,
      age_verification: false
    }
  },
  {
    id: '3',
    tracking_number: 'PKG456789123',
    recipient_name: 'David Wilson',
    recipient_phone: '+1-555-0789',
    recipient_email: 'david.w@email.com',
    recipient_room: '201',
    sender_name: 'UPS',
    sender_company: 'UPS Ground',
    package_type: 'equipment',
    package_size: 'large',
    weight: 15.0,
    dimensions: '24x18x12 inches',
    description: 'Fragile equipment - handle with care',
    status: 'received',
    received_date: '2025-01-27 16:45',
    location: 'Storage Room B',
    signature_required: true,
    photo_url: 'package_3_photo.jpg',
    qr_code: 'PKG_003_QR',
    created_at: '2025-01-27 16:45',
    updated_at: '2025-01-27 16:45',
    delivery_attempts: 0,
    carrier: 'UPS',
    carrier_tracking: '1Z999AA1234567890',
    special_handling: 'fragile',
    delivery_instructions: 'Fragile - requires special handling',
    guest_preferences: {
      preferred_contact: 'email',
      room_delivery: true,
      hold_until_checkout: true
    },
    routing_info: {
      zone: 'Main Building',
      priority: 'high',
      assigned_staff: 'Sarah Wilson'
    },
    compliance: {
      restricted_item: false,
      requires_id: false,
      age_verification: false
    }
  },
  {
    id: '4',
    tracking_number: 'PKG789123456',
    recipient_name: 'Lisa Brown',
    recipient_phone: '+1-555-0321',
    recipient_email: 'lisa.b@email.com',
    recipient_room: '508',
    sender_name: 'DHL',
    sender_company: 'DHL Express',
    package_type: 'food',
    package_size: 'medium',
    weight: 1.2,
    dimensions: '10x8x4 inches',
    description: 'Refrigerated food delivery',
    status: 'notified',
    received_date: '2025-01-27 11:20',
    location: 'Refrigerated Storage',
    signature_required: false,
    photo_url: 'package_4_photo.jpg',
    qr_code: 'PKG_004_QR',
    created_at: '2025-01-27 11:20',
    updated_at: '2025-01-27 11:20',
    delivery_attempts: 0,
    carrier: 'DHL',
    carrier_tracking: '1234567890123',
    special_handling: 'refrigerated',
    delivery_instructions: 'Keep refrigerated - deliver within 2 hours',
    guest_preferences: {
      preferred_contact: 'phone',
      room_delivery: true,
      hold_until_checkout: false
    },
    routing_info: {
      zone: 'North Wing',
      priority: 'high',
      assigned_staff: 'Tom Anderson'
    },
    compliance: {
      restricted_item: false,
      requires_id: false,
      age_verification: false
    }
  },
  {
    id: '5',
    tracking_number: 'PKG321654987',
    recipient_name: 'Robert Taylor',
    recipient_phone: '+1-555-0654',
    recipient_email: 'robert.t@email.com',
    recipient_room: '127',
    sender_name: 'USPS',
    sender_company: 'USPS Priority',
    package_type: 'document',
    package_size: 'small',
    weight: 0.3,
    dimensions: '8x5x1 inches',
    description: 'Legal documents',
    status: 'picked_up',
    received_date: '2025-01-27 08:30',
    pickup_date: '2025-01-27 15:45',
    location: 'Front Desk',
    signature_required: true,
    signature_url: 'signature_5.jpg',
    photo_url: 'package_5_photo.jpg',
    qr_code: 'PKG_005_QR',
    created_at: '2025-01-27 08:30',
    updated_at: '2025-01-27 15:45',
    picked_up_by: 'Robert Taylor',
    delivery_attempts: 0,
    carrier: 'USPS',
    carrier_tracking: '9400128206191234567890',
    special_handling: 'high_value',
    delivery_instructions: 'High value documents - secure handling required',
    guest_preferences: {
      preferred_contact: 'email',
      room_delivery: false,
      hold_until_checkout: false
    },
    routing_info: {
      zone: 'South Wing',
      priority: 'high',
      assigned_staff: 'Jennifer Lee'
    },
    compliance: {
      restricted_item: false,
      requires_id: true,
      age_verification: false
    }
  }
];

const tabs = [
  { id: 'overview', label: 'Overview', path: '/modules/packages' },
  { id: 'operations', label: 'Operations', path: '/modules/package-operations' },
  { id: 'analytics', label: 'Analytics & Reports', path: '/modules/package-analytics' },
  { id: 'settings', label: 'Settings', path: '/modules/package-settings' }
];

const Packages: React.FC = () => {
  const [packages, setPackages] = useState<Package[]>(mockPackages);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [filter, setFilter] = useState<'all' | 'received' | 'notified' | 'delivered' | 'picked_up' | 'expired' | 'returned'>('all');
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [isEditingPackage, setIsEditingPackage] = useState(false);
  const [editedPackage, setEditedPackage] = useState<Package | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Type assertion to fix TypeScript strict literal type inference
  const currentTab = activeTab as any;
  
  // Form state for registering new packages
  const [registerForm, setRegisterForm] = useState({
    recipient_name: '',
    recipient_phone: '',
    recipient_email: '',
    recipient_room: '',
    sender_name: '',
    sender_company: '',
    tracking_number: '',
    package_type: 'parcel' as Package['package_type'],
    package_size: 'medium' as Package['package_size'],
    description: '',
    carrier: 'Other' as Package['carrier'],
    special_handling: 'none' as Package['special_handling'],
    delivery_instructions: '',
    signature_required: false,
    weight: '',
    dimensions: '',
    location: 'Mail Room A'
  });


  const filteredPackages = packages.filter(pkg => {
    if (filter === 'all') return true;
    return pkg.status === filter;
  });

  const handleNotifyGuest = useCallback(async (packageId: string) => {
    let toastId: string | undefined;
    try {
      toastId = showLoading('Notifying guest...');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPackages(prev => prev.map(pkg =>
        pkg.id === packageId
          ? { ...pkg, status: 'notified' as const }
          : pkg
      ));
      
      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Guest notification sent successfully');
      }
    } catch (error) {
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to notify guest');
      }
    }
  }, []);

  const handleDeliverPackage = useCallback(async (packageId: string) => {
    let toastId: string | undefined;
    try {
      toastId = showLoading('Processing delivery...');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPackages(prev => prev.map(pkg =>
        pkg.id === packageId
          ? { 
              ...pkg, 
              status: 'delivered' as const,
              delivered_date: new Date().toISOString(),
              delivered_by: 'Staff Member'
            }
          : pkg
      ));
      
      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Package delivered successfully');
      }
    } catch (error) {
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to deliver package');
      }
    }
  }, []);

  const handleRegisterPackage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    let toastId: string | undefined;
    
    try {
      toastId = showLoading('Registering package...');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newPackage: Package = {
        id: (packages.length + 1).toString(),
        tracking_number: registerForm.tracking_number,
        recipient_name: registerForm.recipient_name,
        recipient_phone: registerForm.recipient_phone,
        recipient_email: registerForm.recipient_email || undefined,
        recipient_room: registerForm.recipient_room || undefined,
        sender_name: registerForm.sender_name,
        sender_company: registerForm.sender_company || undefined,
        package_type: registerForm.package_type,
        package_size: registerForm.package_size,
        weight: registerForm.weight ? parseFloat(registerForm.weight) : undefined,
        dimensions: registerForm.dimensions || undefined,
        description: registerForm.description,
        status: 'received',
        received_date: new Date().toISOString(),
        location: registerForm.location,
        signature_required: registerForm.signature_required,
        qr_code: `PKG_${packages.length + 1}_QR`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        delivery_attempts: 0,
        carrier: registerForm.carrier,
        special_handling: registerForm.special_handling,
        delivery_instructions: registerForm.delivery_instructions || undefined,
        guest_preferences: {
          preferred_contact: 'app',
          room_delivery: true,
          hold_until_checkout: false
        },
        routing_info: {
          zone: 'Main Building',
          priority: 'normal'
        },
        compliance: {
          restricted_item: false,
          requires_id: false,
          age_verification: false
        }
      };

      setPackages(prev => [newPackage, ...prev]);
      setRegisterForm({
        recipient_name: '', recipient_phone: '', recipient_email: '', recipient_room: '',
        sender_name: '', sender_company: '', tracking_number: '', package_type: 'parcel',
        package_size: 'medium', description: '', carrier: 'Other', special_handling: 'none',
        delivery_instructions: '', signature_required: false, weight: '', dimensions: '', location: 'Mail Room A'
      });
      setShowRegisterModal(false);
      
      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Package registered successfully');
      }
    } catch (error) {
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to register package');
      }
    }
  }, [packages.length, registerForm]);

  const handleUpdatePackage = useCallback(async (updatedPackage: Package) => {
    const toastId = showLoading('Updating package...');
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPackages(prev => prev.map(pkg =>
        pkg.id === updatedPackage.id ? updatedPackage : pkg
      ));
      dismissLoadingAndShowSuccess(toastId, 'Package updated successfully');
      setSelectedPackage(updatedPackage);
      setIsEditingPackage(false);
      setEditedPackage(null);
    } catch (error) {
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to update package');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'received': return 'text-blue-800 bg-blue-100';
      case 'notified': return 'text-yellow-800 bg-yellow-100';
      case 'delivered': return 'text-green-800 bg-green-100';
      case 'picked_up': return 'text-green-800 bg-green-100';
      case 'expired': return 'text-red-800 bg-red-100';
      case 'returned': return 'text-slate-800 bg-slate-100';
      default: return 'text-slate-800 bg-slate-100';
    }
  };

  // Legacy function for compatibility
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received': return 'default';
      case 'notified': return 'warning';
      case 'delivered': return 'success';
      case 'picked_up': return 'success';
      case 'expired': return 'destructive';
      case 'returned': return 'secondary';
      default: return 'secondary';
    }
  };

  const getCarrierColor = (carrier: string) => {
    switch (carrier) {
      case 'FedEx': return '#64748b';
      case 'UPS': return '#64748b';
      case 'DHL': return '#64748b';
      case 'USPS': return '#64748b';
      case 'Amazon': return '#64748b';
      default: return '#64748b';
    }
  };

  const getPackageTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'parcel': return 'fas fa-box';
      case 'document': return 'fas fa-file-alt';
      case 'food': return 'fas fa-utensils';
      case 'equipment': return 'fas fa-tools';
      default: return 'fas fa-box';
    }
  };

  const getSpecialHandlingIcon = (handling: string) => {
    switch (handling.toLowerCase()) {
      case 'fragile': return 'fas fa-exclamation-triangle';
      case 'refrigerated': return 'fas fa-snowflake';
      case 'high_value': return 'fas fa-gem';
      default: return null;
    }
  };

  const metrics = {
    total: packages.length,
    received: packages.filter(p => p.status === 'received').length,
    notified: packages.filter(p => p.status === 'notified').length,
    delivered: packages.filter(p => p.status === 'delivered').length,
    pickedUp: packages.filter(p => p.status === 'picked_up').length,
    expired: packages.filter(p => p.status === 'expired').length,
    carrierIntegrations: 5
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
                <i className="fas fa-box text-white text-2xl" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-slate-500 rounded-full flex items-center justify-center animate-pulse">
                <i className="fas fa-exclamation text-white text-xs" />
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-slate-900">
                Package Management
              </h1>
              <p className="text-slate-600 font-medium">
                Comprehensive package tracking and delivery management system
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

      {/* Main Content - GOLD STANDARD LAYOUT */}
      <div className="relative max-w-[1800px] mx-auto px-6 py-6">
        {/* Key Metrics - GOLD STANDARD 4-CARD LAYOUT */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Packages */}
          <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="pt-6 px-6 pb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-xl flex items-center justify-center shadow-lg mt-2">
                  <i className="fas fa-box text-white text-xl" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-blue-600">
                  {metrics.total}
                </h3>
                <p className="text-slate-600 text-sm">
                  Total Packages
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Received Packages */}
          <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="pt-6 px-6 pb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-xl flex items-center justify-center shadow-lg mt-2">
                  <i className="fas fa-inbox text-white text-xl" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-blue-600">
                  {metrics.received}
                </h3>
                <p className="text-slate-600 text-sm">
                  Received Packages
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Notified Packages */}
          <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="pt-6 px-6 pb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl flex items-center justify-center shadow-lg mt-2">
                  <i className="fas fa-bell text-white text-xl" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-blue-600">
                  {metrics.notified}
                </h3>
                <p className="text-slate-600 text-sm">
                  Notified Guests
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Delivered Packages */}
          <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="pt-6 px-6 pb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center shadow-lg mt-2">
                  <i className="fas fa-check-circle text-white text-xl" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-blue-600">
                  {metrics.delivered}
                </h3>
                <p className="text-slate-600 text-sm">
                  Delivered Today
                </p>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Overview Tab Content */}
        {currentTab === 'overview' && (
          <>
            {/* Package Management */}
            <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm mb-8">
              <CardHeader className="flex flex-row items-center justify-between px-6 pt-6 pb-4">
                <CardTitle className="flex items-center text-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                    <i className="fas fa-box-open text-white" />
                  </div>
                  Package Management
                </CardTitle>
                <div className="flex items-center space-x-2">
                  {['all', 'received', 'notified', 'delivered', 'picked_up', 'expired', 'returned'].map(filterType => (
                    <Button
                      key={filterType}
                      variant={filter === filterType ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilter(filterType as any)}
                      className={cn(
                        "capitalize",
                        filter === filterType
                          ? "!bg-[#2563eb] hover:!bg-blue-700 text-white"
                          : "text-slate-600 border-slate-300 hover:bg-slate-50"
                      )}
                    >
                      {filterType.replace('_', ' ')}
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPackages.map(pkg => (
                    <Card
                      key={pkg.id}
                      className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <CardContent className="pt-6 px-6 pb-6">
                        {/* Header with Icon, Name, Room, and Status Tags */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0 mt-2">
                              <i className={cn("text-white text-lg", getPackageTypeIcon(pkg.package_type))} />
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-900">{pkg.recipient_name}</h4>
                              <p className="text-sm text-slate-600">{pkg.recipient_room ? `Room ${pkg.recipient_room}` : 'No room assigned'}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-1">
                            <span className={cn(
                              "px-2.5 py-1 text-xs font-semibold rounded",
                              pkg.status === 'received' ? 'text-blue-800 bg-blue-100' :
                              pkg.status === 'notified' ? 'text-yellow-800 bg-yellow-100' :
                              pkg.status === 'delivered' ? 'text-green-800 bg-green-100' :
                              pkg.status === 'picked_up' ? 'text-green-800 bg-green-100' :
                              pkg.status === 'expired' ? 'text-red-800 bg-red-100' :
                              'text-slate-800 bg-slate-100'
                            )}>
                              {pkg.status.toUpperCase().replace('_', ' ')}
                            </span>
                            <span className="px-2.5 py-1 text-xs font-semibold rounded text-slate-800 bg-slate-100">
                              {pkg.carrier.toUpperCase()}
                            </span>
                          </div>
                        </div>

                        {/* Package Details */}
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Tracking:</span>
                            <span className="font-medium font-mono">{pkg.tracking_number}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Type:</span>
                            <span className="font-medium capitalize">{pkg.package_type}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Size:</span>
                            <span className="font-medium capitalize">{pkg.package_size}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Location:</span>
                            <span className="font-medium">{pkg.location}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Received:</span>
                            <span className="font-medium">{pkg.received_date.split(' ')[0]}</span>
                          </div>
                        </div>

                        {/* Description Box */}
                        {pkg.description && (
                          <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <p className="text-sm text-slate-700">{pkg.description}</p>
                          </div>
                        )}

                        {/* Special Handling */}
                        {pkg.special_handling !== 'none' && (
                          <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="flex items-center text-slate-700 text-sm">
                              <i className={cn("mr-2 text-yellow-600", getSpecialHandlingIcon(pkg.special_handling))} />
                              <span className="font-medium">Special Handling: {pkg.special_handling}</span>
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          {pkg.status === 'received' && (
                            <Button 
                              className="flex-1 !bg-[#2563eb] hover:!bg-blue-700 text-white text-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNotifyGuest(pkg.id);
                              }}
                              disabled={loading}
                            >
                              <i className="fas fa-bell mr-2" />
                              Notify Guest
                            </Button>
                          )}
                          {pkg.status === 'notified' && (
                            <Button 
                              className="flex-1 !bg-[#2563eb] hover:!bg-blue-700 text-white text-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeliverPackage(pkg.id);
                              }}
                              disabled={loading}
                            >
                              <i className="fas fa-check mr-2" />
                              Mark Delivered
                            </Button>
                          )}
                          <Button 
                            variant="outline"
                            className="flex-1 text-slate-600 border-slate-300 hover:bg-slate-50 text-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPackage(pkg);
                            }}
                          >
                            <i className="fas fa-eye mr-2" />
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Carrier Integration Status */}
            <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl mb-8">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                    <i className="fas fa-truck text-white" />
                  </div>
                  Carrier Integration Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {['FedEx', 'UPS', 'DHL', 'USPS', 'Amazon'].map(carrier => (
                    <Card key={carrier} className="backdrop-blur-sm bg-white/60 border-white/30 shadow-lg">
                      <CardContent className="p-4 text-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                          <i className="fas fa-truck text-xl" style={{ color: getCarrierColor(carrier) }} />
                        </div>
                        <h4 className="font-bold text-slate-900 mb-1">{carrier}</h4>
                        <p className="text-slate-600 text-sm mb-2">API Integration Active</p>
                        <span className="px-2.5 py-1 text-xs font-semibold rounded text-green-800 bg-green-100">
                          Connected
                        </span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Emergency Actions */}
            <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
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
                    className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
                    onClick={() => {
                      const expiredPackages = packages.filter(p => p.status === 'expired');
                      showSuccess(`${expiredPackages.length} packages have expired and require disposal`);
                    }}
                  >
                    <i className="fas fa-exclamation-triangle mr-2" />
                    Expired Alert
                  </Button>
                  <Button 
                    className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
                    onClick={() => {
                      const overduePackages = packages.filter(p => p.status === 'notified');
                      showSuccess(`${overduePackages.length} packages are awaiting pickup`);
                    }}
                  >
                    <i className="fas fa-clock mr-2" />
                    Overdue Alert
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Tab Content for other tabs */}
        {currentTab !== 'overview' && (
          <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                  <i className={cn(
                    "text-white",
                    currentTab === 'operations' && 'fas fa-cogs',
                    currentTab === 'analytics' && 'fas fa-chart-bar',
                    currentTab === 'settings' && 'fas fa-sliders-h'
                  )} />
                </div>
                {currentTab === 'operations' && 'Operations'}
                {currentTab === 'analytics' && 'Analytics & Reports'}
                {currentTab === 'settings' && 'Settings'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentTab === 'operations' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-6 bg-slate-50 rounded-lg">
                      <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center">
                        <i className="fas fa-truck mr-2 text-slate-600" />
                        Delivery Operations
                      </h3>
                      <p className="text-slate-600 mb-4">Delivery operations management including route optimization, staff assignments, and delivery tracking.</p>
                      <Button className="!bg-[#2563eb] hover:!bg-blue-700 text-white">
                        Manage Deliveries
                      </Button>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-lg">
                      <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center">
                        <i className="fas fa-link mr-2 text-slate-600" />
                        Carrier Integration
                      </h3>
                      <p className="text-slate-600 mb-4">Carrier integration management with real-time API connections, tracking updates, and delivery notifications.</p>
                      <Button className="!bg-[#2563eb] hover:!bg-blue-700 text-white">
                        Manage Carriers
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              {currentTab === 'analytics' && (
                <div className="space-y-6">
                  {/* Key Performance Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-white border-slate-200 shadow-sm">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                          <i className="fas fa-percentage text-slate-600 text-xl" />
                          <i className="fas fa-arrow-up text-green-600 text-sm" />
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900 mb-1">94%</h3>
                        <p className="text-sm text-slate-600">On-Time Delivery Rate</p>
                        <p className="text-xs text-green-600 mt-1">+3% from last month</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-white border-slate-200 shadow-sm">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                          <i className="fas fa-clock text-slate-600 text-xl" />
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900 mb-1">1.8h</h3>
                        <p className="text-sm text-slate-600">Avg Handling Time</p>
                        <p className="text-xs text-slate-500 mt-1">Target: 2.0h</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-white border-slate-200 shadow-sm">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                          <i className="fas fa-star text-slate-600 text-xl" />
                          <i className="fas fa-arrow-up text-green-600 text-sm" />
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900 mb-1">4.8</h3>
                        <p className="text-sm text-slate-600">Guest Satisfaction</p>
                        <p className="text-xs text-green-600 mt-1">+0.2 from last month</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-white border-slate-200 shadow-sm">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                          <i className="fas fa-box text-slate-600 text-xl" />
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900 mb-1">{packages.length}</h3>
                        <p className="text-sm text-slate-600">Total This Month</p>
                        <p className="text-xs text-slate-500 mt-1">Across all carriers</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Charts Row 1 */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Delivery Time Trend */}
                    <Card className="bg-white border-slate-200 shadow-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                            <i className="fas fa-chart-line text-white" />
                          </div>
                          Delivery Time Trend
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={[
                            { month: 'Jul', avgTime: 2.3, target: 2.0 },
                            { month: 'Aug', avgTime: 2.1, target: 2.0 },
                            { month: 'Sep', avgTime: 1.9, target: 2.0 },
                            { month: 'Oct', avgTime: 1.8, target: 2.0 },
                            { month: 'Nov', avgTime: 1.8, target: 2.0 },
                            { month: 'Dec', avgTime: 1.8, target: 2.0 }
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="month" stroke="#64748b" />
                            <YAxis stroke="#64748b" label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'white', 
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px'
                              }}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="avgTime" stroke="#2563eb" strokeWidth={2} name="Avg Time" />
                            <Line type="monotone" dataKey="target" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" name="Target" />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Package Volume by Carrier */}
                    <Card className="bg-white border-slate-200 shadow-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                            <i className="fas fa-chart-bar text-white" />
                          </div>
                          Package Volume by Carrier
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={[
                            { carrier: 'FedEx', count: packages.filter(p => p.carrier === 'FedEx').length },
                            { carrier: 'UPS', count: packages.filter(p => p.carrier === 'UPS').length },
                            { carrier: 'DHL', count: packages.filter(p => p.carrier === 'DHL').length },
                            { carrier: 'USPS', count: packages.filter(p => p.carrier === 'USPS').length },
                            { carrier: 'Amazon', count: packages.filter(p => p.carrier === 'Amazon').length }
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="carrier" stroke="#64748b" />
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
                                { name: 'Received', value: packages.filter(p => p.status === 'received').length },
                                { name: 'Notified', value: packages.filter(p => p.status === 'notified').length },
                                { name: 'Delivered', value: packages.filter(p => p.status === 'delivered').length },
                                { name: 'Picked Up', value: packages.filter(p => p.status === 'picked_up').length },
                                { name: 'Expired', value: packages.filter(p => p.status === 'expired').length }
                              ]}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              <Cell fill="#2563eb" />
                              <Cell fill="#f59e0b" />
                              <Cell fill="#10b981" />
                              <Cell fill="#6366f1" />
                              <Cell fill="#ef4444" />
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Peak Hours Heatmap */}
                    <Card className="bg-white border-slate-200 shadow-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <i className="fas fa-fire text-slate-600 mr-2" />
                          Peak Hours Activity
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart data={[
                            { hour: '8AM', packages: 12 },
                            { hour: '10AM', packages: 28 },
                            { hour: '12PM', packages: 45 },
                            { hour: '2PM', packages: 38 },
                            { hour: '4PM', packages: 52 },
                            { hour: '6PM', packages: 35 }
                          ]}>
                            <defs>
                              <linearGradient id="colorPackages" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="hour" stroke="#64748b" />
                            <YAxis stroke="#64748b" />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'white', 
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px'
                              }}
                            />
                            <Area type="monotone" dataKey="packages" stroke="#2563eb" fillOpacity={1} fill="url(#colorPackages)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Export Reports */}
                  <Card className="bg-white border-slate-200 shadow-sm">
                    <CardHeader>
                      <CardTitle>Export Reports</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Button
                          className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
                          onClick={() => showSuccess('Daily report generated')}
                        >
                          <i className="fas fa-file-pdf mr-2" />
                          Daily Report
                        </Button>
                        <Button
                          variant="outline"
                          className="text-slate-600 border-slate-300 hover:bg-slate-50"
                          onClick={() => showSuccess('Weekly report generated')}
                        >
                          <i className="fas fa-file-excel mr-2" />
                          Weekly Report
                        </Button>
                        <Button
                          variant="outline"
                          className="text-slate-600 border-slate-300 hover:bg-slate-50"
                          onClick={() => showSuccess('Monthly report generated')}
                        >
                          <i className="fas fa-file-alt mr-2" />
                          Monthly Report
                        </Button>
                        <Button
                          variant="outline"
                          className="text-slate-600 border-slate-300 hover:bg-slate-50"
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
                  {/* System Configuration */}
                  <Card className="bg-white border-slate-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <i className="fas fa-cog text-slate-600 mr-2" />
                        System Configuration
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-slate-700">
                            Default Storage Location
                          </label>
                          <select className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="Mail Room A">Mail Room A</option>
                            <option value="Mail Room B">Mail Room B</option>
                            <option value="Front Desk">Front Desk</option>
                            <option value="Storage Room A">Storage Room A</option>
                            <option value="Storage Room B">Storage Room B</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-slate-700">
                            Auto-Notification Timing
                          </label>
                          <select className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="immediate">Immediate</option>
                            <option value="15min">15 minutes</option>
                            <option value="30min">30 minutes</option>
                            <option value="1hour">1 hour</option>
                            <option value="manual">Manual Only</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-slate-700">
                            Package Retention Period
                          </label>
                          <select className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="7">7 days</option>
                            <option value="14">14 days</option>
                            <option value="30">30 days</option>
                            <option value="60">60 days</option>
                            <option value="90">90 days</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-slate-700">
                            QR Code Size
                          </label>
                          <select className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="small">Small (2x2 inches)</option>
                            <option value="medium">Medium (3x3 inches)</option>
                            <option value="large">Large (4x4 inches)</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-slate-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-slate-900">Automatic Photo Documentation</h4>
                            <p className="text-sm text-slate-600">Require photo upload for all packages</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2563eb]"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-slate-900">Signature Required by Default</h4>
                            <p className="text-sm text-slate-600">Require signature for all deliveries</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2563eb]"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-slate-900">SMS Notifications</h4>
                            <p className="text-sm text-slate-600">Send SMS alerts to recipients</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2563eb]"></div>
                          </label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Carrier Management */}
                  <Card className="bg-white border-slate-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <i className="fas fa-truck text-slate-600 mr-2" />
                        Carrier Management
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {['FedEx', 'UPS', 'DHL', 'USPS', 'Amazon'].map((carrier) => (
                        <div key={carrier} className="p-4 border border-slate-200 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                                <i className="fas fa-truck text-slate-600" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-slate-900">{carrier}</h4>
                                <p className="text-sm text-slate-600">API Integration Active</p>
                              </div>
                            </div>
                            <span className="px-2.5 py-1 text-xs font-semibold rounded text-green-800 bg-green-100">Connected</span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-slate-700">
                                API Key
                              </label>
                              <input
                                type="password"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                placeholder="••••••••••••••••"
                                defaultValue="sk_test_123456789"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-slate-700">
                                Webhook URL
                              </label>
                              <input
                                type="text"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                placeholder="https://api.yourhotel.com/webhooks"
                                defaultValue={`https://api.yourhotel.com/webhooks/${carrier.toLowerCase()}`}
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                            <div className="text-sm text-slate-600">
                              Last sync: 2 minutes ago
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-slate-600 border-slate-300 hover:bg-slate-50"
                                onClick={() => showSuccess(`${carrier} connection tested successfully`)}
                              >
                                Test Connection
                              </Button>
                              <Button
                                size="sm"
                                className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
                                onClick={() => showSuccess(`${carrier} settings saved`)}
                              >
                                Save
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Notification Templates */}
                  <Card className="bg-white border-slate-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <i className="fas fa-bell text-slate-600 mr-2" />
                        Notification Templates
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">
                          Package Received Email Template
                        </label>
                        <textarea
                          rows={4}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          defaultValue="Dear {guest_name},

A package has been received for you. 
Tracking: {tracking_number}
Location: {storage_location}

Please contact the front desk to arrange pickup.

Thank you,
{hotel_name}"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">
                          SMS Notification Template
                        </label>
                        <textarea
                          rows={2}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          defaultValue="{hotel_name}: Package received. Tracking: {tracking_number}. Reply PICKUP to schedule."
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">
                          Delivery Confirmation Template
                        </label>
                        <textarea
                          rows={3}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          defaultValue="Dear {guest_name},

Your package (Tracking: {tracking_number}) has been delivered to Room {room_number}.

Delivered by: {staff_name}
Time: {delivery_time}

Thank you,
{hotel_name}"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Security & Compliance */}
                  <Card className="bg-white border-slate-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <i className="fas fa-shield-alt text-slate-600 mr-2" />
                        Security & Compliance
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-slate-700">
                            Data Retention Policy
                          </label>
                          <select className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="30">30 days after delivery</option>
                            <option value="60">60 days after delivery</option>
                            <option value="90">90 days after delivery</option>
                            <option value="180">180 days after delivery</option>
                            <option value="365">1 year after delivery</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-slate-700">
                            Photo Storage Duration
                          </label>
                          <select className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="30">30 days</option>
                            <option value="60">60 days</option>
                            <option value="90">90 days</option>
                            <option value="365">1 year</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-slate-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-slate-900">ID Verification for High-Value Items</h4>
                            <p className="text-sm text-slate-600">Require ID check for packages marked as high-value</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2563eb]"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-slate-900">Audit Logging</h4>
                            <p className="text-sm text-slate-600">Log all package access and modifications</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2563eb]"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-slate-900">GDPR Compliance Mode</h4>
                            <p className="text-sm text-slate-600">Enable additional privacy protections</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2563eb]"></div>
                          </label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Save Settings Button */}
                  <div className="flex justify-end">
                    <Button
                      className="!bg-[#2563eb] hover:!bg-blue-700 text-white px-8 py-3"
                      onClick={() => showSuccess('All settings saved successfully')}
                    >
                      <i className="fas fa-save mr-2" />
                      Save All Settings
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Register Package Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="backdrop-blur-xl bg-white/90 border-white/30 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200/50">
              <CardTitle className="flex items-center text-xl">
                <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center mr-3">
                  <i className="fas fa-plus text-white text-sm" />
                </div>
                Register New Package
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRegisterModal(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                <i className="fas fa-times text-lg" />
              </Button>
            </CardHeader>
            
            <CardContent className="p-6">
              <form onSubmit={handleRegisterPackage} className="space-y-6">
                {/* Recipient Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                    <i className="fas fa-user text-slate-600 mr-2" />
                    Recipient Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="recipient-name" className="block text-sm font-medium text-slate-700">
                        Recipient Name *
                      </label>
                      <input
                        type="text"
                        id="recipient-name"
                        value={registerForm.recipient_name}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, recipient_name: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Full name"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="recipient-phone" className="block text-sm font-medium text-slate-700">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        id="recipient-phone"
                        value={registerForm.recipient_phone}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, recipient_phone: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Phone number"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="recipient-email" className="block text-sm font-medium text-slate-700">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="recipient-email"
                        value={registerForm.recipient_email}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, recipient_email: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Email address"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="recipient-room" className="block text-sm font-medium text-slate-700">
                        Room Number
                      </label>
                      <input
                        type="text"
                        id="recipient-room"
                        value={registerForm.recipient_room}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, recipient_room: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Room number"
                      />
                    </div>
                  </div>
                </div>

                {/* Package Information */}
                <div className="space-y-4 border-t border-slate-200/50 pt-6">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                    <i className="fas fa-box text-slate-600 mr-2" />
                    Package Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="tracking-number" className="block text-sm font-medium text-slate-700">
                        Tracking Number *
                      </label>
                      <input
                        type="text"
                        id="tracking-number"
                        value={registerForm.tracking_number}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, tracking_number: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        placeholder="Tracking number"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="carrier" className="block text-sm font-medium text-slate-700">
                        Carrier *
                      </label>
                      <select
                        id="carrier"
                        value={registerForm.carrier}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, carrier: e.target.value as Package['carrier'] }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="FedEx">FedEx</option>
                        <option value="UPS">UPS</option>
                        <option value="DHL">DHL</option>
                        <option value="USPS">USPS</option>
                        <option value="Amazon">Amazon</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="package-type" className="block text-sm font-medium text-slate-700">
                        Package Type *
                      </label>
                      <select
                        id="package-type"
                        value={registerForm.package_type}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, package_type: e.target.value as Package['package_type'] }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="parcel">Parcel</option>
                        <option value="document">Document</option>
                        <option value="food">Food</option>
                        <option value="equipment">Equipment</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="package-size" className="block text-sm font-medium text-slate-700">
                        Package Size *
                      </label>
                      <select
                        id="package-size"
                        value={registerForm.package_size}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, package_size: e.target.value as Package['package_size'] }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                        <option value="oversized">Oversized</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="description" className="block text-sm font-medium text-slate-700">
                      Description *
                    </label>
                    <textarea
                      id="description"
                      rows={3}
                      value={registerForm.description}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Package description and contents"
                      required
                    />
                  </div>
                </div>

                {/* Sender Information */}
                <div className="space-y-4 border-t border-slate-200/50 pt-6">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                    <i className="fas fa-shipping-fast text-slate-600 mr-2" />
                    Sender Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="sender-name" className="block text-sm font-medium text-slate-700">
                        Sender Name *
                      </label>
                      <input
                        type="text"
                        id="sender-name"
                        value={registerForm.sender_name}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, sender_name: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Sender name or company"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="sender-company" className="block text-sm font-medium text-slate-700">
                        Company
                      </label>
                      <input
                        type="text"
                        id="sender-company"
                        value={registerForm.sender_company}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, sender_company: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Company name"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4 border-t border-slate-200/50 pt-6">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                    <i className="fas fa-cog text-slate-600 mr-2" />
                    Additional Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="special-handling" className="block text-sm font-medium text-slate-700">
                        Special Handling
                      </label>
                      <select
                        id="special-handling"
                        value={registerForm.special_handling}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, special_handling: e.target.value as Package['special_handling'] }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="none">None</option>
                        <option value="fragile">Fragile</option>
                        <option value="refrigerated">Refrigerated</option>
                        <option value="high_value">High Value</option>
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="location" className="block text-sm font-medium text-slate-700">
                        Storage Location
                      </label>
                      <select
                        id="location"
                        value={registerForm.location}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, location: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Mail Room A">Mail Room A</option>
                        <option value="Mail Room B">Mail Room B</option>
                        <option value="Front Desk">Front Desk</option>
                        <option value="Storage Room A">Storage Room A</option>
                        <option value="Storage Room B">Storage Room B</option>
                        <option value="Refrigerated Storage">Refrigerated Storage</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="delivery-instructions" className="block text-sm font-medium text-slate-700">
                      Delivery Instructions
                    </label>
                    <textarea
                      id="delivery-instructions"
                      rows={2}
                      value={registerForm.delivery_instructions}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, delivery_instructions: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Special delivery instructions"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="signature-required"
                      checked={registerForm.signature_required}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, signature_required: e.target.checked }))}
                      className="h-4 w-4 text-slate-600 focus:ring-blue-500 border-slate-300 rounded"
                    />
                    <label htmlFor="signature-required" className="text-sm font-medium text-slate-700">
                      Signature Required
                    </label>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200/50">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowRegisterModal(false)}
                    className="text-slate-600 border-slate-300 hover:bg-slate-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
                    disabled={loading || !registerForm.recipient_name || !registerForm.recipient_phone || !registerForm.tracking_number || !registerForm.sender_name || !registerForm.description}
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Registering...
                      </div>
                    ) : (
                      <>
                        <i className="fas fa-save mr-2" />
                        Register Package
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Package Details Modal */}
      {selectedPackage && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="backdrop-blur-xl bg-white/90 border-white/30 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200/50">
              <CardTitle className="flex items-center text-xl">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                  <i className={cn("text-white", getPackageTypeIcon((editedPackage || selectedPackage).package_type))} />
                </div>
                Package Details {isEditingPackage && <span className="ml-2 text-sm text-blue-600">(Editing)</span>}
              </CardTitle>
              <div className="flex items-center gap-2">
                {!isEditingPackage ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditingPackage(true);
                      setEditedPackage({ ...selectedPackage });
                    }}
                    className="text-blue-600 border-blue-300 hover:bg-blue-50"
                  >
                    <i className="fas fa-edit mr-2" />
                    Edit
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditingPackage(false);
                      setEditedPackage(null);
                    }}
                    className="text-slate-600 border-slate-300 hover:bg-slate-50"
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedPackage(null);
                    setIsEditingPackage(false);
                    setEditedPackage(null);
                  }}
                  className="text-slate-500 hover:text-slate-700"
                >
                  <i className="fas fa-times text-lg" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Header Info */}
                <div className="flex items-start justify-between pb-4 border-b border-slate-200">
                  <div className="flex-1">
                    {isEditingPackage && editedPackage ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-slate-600">Recipient Name</label>
                          <input
                            type="text"
                            value={editedPackage.recipient_name}
                            onChange={(e) => setEditedPackage({ ...editedPackage, recipient_name: e.target.value })}
                            className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">Room Number</label>
                          <input
                            type="text"
                            value={editedPackage.recipient_room || ''}
                            onChange={(e) => setEditedPackage({ ...editedPackage, recipient_room: e.target.value })}
                            className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h3 className="text-2xl font-bold text-slate-900">{selectedPackage.recipient_name}</h3>
                        <p className="text-slate-600 mt-1">{selectedPackage.recipient_room ? `Room ${selectedPackage.recipient_room}` : 'No room assigned'}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    {isEditingPackage && editedPackage ? (
                      <div className="space-y-2 w-48">
                        <div>
                          <label className="text-sm font-medium text-slate-600">Status</label>
                          <select
                            value={editedPackage.status}
                            onChange={(e) => setEditedPackage({ ...editedPackage, status: e.target.value as Package['status'] })}
                            className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          >
                            <option value="received">Received</option>
                            <option value="notified">Notified</option>
                            <option value="delivered">Delivered</option>
                            <option value="picked_up">Picked Up</option>
                            <option value="expired">Expired</option>
                            <option value="returned">Returned</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">Carrier</label>
                          <select
                            value={editedPackage.carrier}
                            onChange={(e) => setEditedPackage({ ...editedPackage, carrier: e.target.value as Package['carrier'] })}
                            className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          >
                            <option value="FedEx">FedEx</option>
                            <option value="UPS">UPS</option>
                            <option value="DHL">DHL</option>
                            <option value="USPS">USPS</option>
                            <option value="Amazon">Amazon</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>
                    ) : (
                      <>
                        <span className={cn(
                          "px-3 py-1.5 text-sm font-semibold rounded",
                          selectedPackage.status === 'received' ? 'text-blue-800 bg-blue-100' :
                          selectedPackage.status === 'notified' ? 'text-yellow-800 bg-yellow-100' :
                          selectedPackage.status === 'delivered' ? 'text-green-800 bg-green-100' :
                          selectedPackage.status === 'picked_up' ? 'text-green-800 bg-green-100' :
                          selectedPackage.status === 'expired' ? 'text-red-800 bg-red-100' :
                          'text-slate-800 bg-slate-100'
                        )}>
                          {selectedPackage.status.toUpperCase().replace('_', ' ')}
                        </span>
                        <span className="px-3 py-1.5 text-sm font-semibold rounded text-slate-800 bg-slate-100">
                          {selectedPackage.carrier}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Package Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-slate-600">Tracking Number</label>
                      {isEditingPackage && editedPackage ? (
                        <input
                          type="text"
                          value={editedPackage.tracking_number}
                          onChange={(e) => setEditedPackage({ ...editedPackage, tracking_number: e.target.value })}
                          className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        />
                      ) : (
                        <p className="text-base font-mono text-slate-900 mt-1">{selectedPackage.tracking_number}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-600">Package Type</label>
                      {isEditingPackage && editedPackage ? (
                        <select
                          value={editedPackage.package_type}
                          onChange={(e) => setEditedPackage({ ...editedPackage, package_type: e.target.value as Package['package_type'] })}
                          className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="parcel">Parcel</option>
                          <option value="document">Document</option>
                          <option value="food">Food</option>
                          <option value="equipment">Equipment</option>
                          <option value="other">Other</option>
                        </select>
                      ) : (
                        <p className="text-base capitalize text-slate-900 mt-1">{selectedPackage.package_type}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-600">Size</label>
                      {isEditingPackage && editedPackage ? (
                        <select
                          value={editedPackage.package_size}
                          onChange={(e) => setEditedPackage({ ...editedPackage, package_size: e.target.value as Package['package_size'] })}
                          className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="small">Small</option>
                          <option value="medium">Medium</option>
                          <option value="large">Large</option>
                          <option value="oversized">Oversized</option>
                        </select>
                      ) : (
                        <p className="text-base capitalize text-slate-900 mt-1">{selectedPackage.package_size}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-600">Location</label>
                      {isEditingPackage && editedPackage ? (
                        <input
                          type="text"
                          value={editedPackage.location}
                          onChange={(e) => setEditedPackage({ ...editedPackage, location: e.target.value })}
                          className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-base text-slate-900 mt-1">{selectedPackage.location}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-slate-600">Received Date</label>
                      {isEditingPackage && editedPackage ? (
                        <input
                          type="text"
                          value={editedPackage.received_date}
                          onChange={(e) => setEditedPackage({ ...editedPackage, received_date: e.target.value })}
                          className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="YYYY-MM-DD HH:MM"
                        />
                      ) : (
                        <p className="text-base text-slate-900 mt-1">{selectedPackage.received_date}</p>
                      )}
                    </div>
                    {(selectedPackage.delivered_date || (isEditingPackage && editedPackage)) && (
                      <div>
                        <label className="text-sm font-medium text-slate-600">Delivered Date</label>
                        {isEditingPackage && editedPackage ? (
                          <input
                            type="text"
                            value={editedPackage.delivered_date || ''}
                            onChange={(e) => setEditedPackage({ ...editedPackage, delivered_date: e.target.value })}
                            className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="YYYY-MM-DD HH:MM"
                          />
                        ) : (
                          <p className="text-base text-slate-900 mt-1">{selectedPackage.delivered_date}</p>
                        )}
                      </div>
                    )}
                    {(selectedPackage.pickup_date || (isEditingPackage && editedPackage)) && (
                      <div>
                        <label className="text-sm font-medium text-slate-600">Pickup Date</label>
                        {isEditingPackage && editedPackage ? (
                          <input
                            type="text"
                            value={editedPackage.pickup_date || ''}
                            onChange={(e) => setEditedPackage({ ...editedPackage, pickup_date: e.target.value })}
                            className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="YYYY-MM-DD HH:MM"
                          />
                        ) : (
                          <p className="text-base text-slate-900 mt-1">{selectedPackage.pickup_date}</p>
                        )}
                      </div>
                    )}
                    {(selectedPackage.carrier_tracking || (isEditingPackage && editedPackage)) && (
                      <div>
                        <label className="text-sm font-medium text-slate-600">Carrier Tracking</label>
                        {isEditingPackage && editedPackage ? (
                          <input
                            type="text"
                            value={editedPackage.carrier_tracking || ''}
                            onChange={(e) => setEditedPackage({ ...editedPackage, carrier_tracking: e.target.value })}
                            className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                          />
                        ) : (
                          <p className="text-base font-mono text-slate-900 mt-1">{selectedPackage.carrier_tracking}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <label className="text-sm font-medium text-slate-600 mb-2 block">Description</label>
                  {isEditingPackage && editedPackage ? (
                    <textarea
                      value={editedPackage.description}
                      onChange={(e) => setEditedPackage({ ...editedPackage, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-base text-slate-700">{selectedPackage.description}</p>
                  )}
                </div>

                {/* Special Handling */}
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <label className="text-sm font-medium text-slate-600 mb-2 block">Special Handling</label>
                  {isEditingPackage && editedPackage ? (
                    <select
                      value={editedPackage.special_handling}
                      onChange={(e) => setEditedPackage({ ...editedPackage, special_handling: e.target.value as Package['special_handling'] })}
                      className="w-full px-3 py-2 border border-yellow-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    >
                      <option value="none">None</option>
                      <option value="fragile">Fragile</option>
                      <option value="refrigerated">Refrigerated</option>
                      <option value="high_value">High Value</option>
                    </select>
                  ) : (
                    <div className="flex items-center text-slate-700">
                      <i className={cn("mr-2 text-yellow-600", getSpecialHandlingIcon(selectedPackage.special_handling))} />
                      <span className="font-medium">{selectedPackage.special_handling !== 'none' ? `Special Handling: ${selectedPackage.special_handling}` : 'No special handling required'}</span>
                    </div>
                  )}
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                  <div>
                    <label className="text-sm font-medium text-slate-600">Phone</label>
                    {isEditingPackage && editedPackage ? (
                      <input
                        type="tel"
                        value={editedPackage.recipient_phone}
                        onChange={(e) => setEditedPackage({ ...editedPackage, recipient_phone: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-base text-slate-900 mt-1">{selectedPackage.recipient_phone}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Email</label>
                    {isEditingPackage && editedPackage ? (
                      <input
                        type="email"
                        value={editedPackage.recipient_email || ''}
                        onChange={(e) => setEditedPackage({ ...editedPackage, recipient_email: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-base text-slate-900 mt-1">{selectedPackage.recipient_email || 'No email'}</p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  {isEditingPackage && editedPackage ? (
                    <>
                      <Button 
                        className="flex-1 !bg-[#2563eb] hover:!bg-blue-700 text-white"
                        onClick={() => {
                          if (editedPackage) {
                            handleUpdatePackage(editedPackage);
                          }
                        }}
                        disabled={loading}
                      >
                        <i className="fas fa-save mr-2" />
                        Save Changes
                      </Button>
                      <Button 
                        variant="outline"
                        className="flex-1 text-slate-600 border-slate-300 hover:bg-slate-50"
                        onClick={() => {
                          setIsEditingPackage(false);
                          setEditedPackage(null);
                        }}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      {selectedPackage.status === 'received' && (
                        <Button 
                          className="flex-1 !bg-[#2563eb] hover:!bg-blue-700 text-white"
                          onClick={() => {
                            handleNotifyGuest(selectedPackage.id);
                            setSelectedPackage(null);
                          }}
                          disabled={loading}
                        >
                          <i className="fas fa-bell mr-2" />
                          Notify Guest
                        </Button>
                      )}
                      {selectedPackage.status === 'notified' && (
                        <Button 
                          className="flex-1 !bg-[#2563eb] hover:!bg-blue-700 text-white"
                          onClick={() => {
                            handleDeliverPackage(selectedPackage.id);
                            setSelectedPackage(null);
                          }}
                          disabled={loading}
                        >
                          <i className="fas fa-check mr-2" />
                          Mark Delivered
                        </Button>
                      )}
                      <Button 
                        variant="outline"
                        className="flex-1 text-slate-600 border-slate-300 hover:bg-slate-50"
                        onClick={() => {
                          setSelectedPackage(null);
                          setIsEditingPackage(false);
                          setEditedPackage(null);
                        }}
                      >
                        Close
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Scan Package Modal */}
      {showScanModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="backdrop-blur-xl bg-white/90 border-white/30 shadow-2xl max-w-md w-full">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200/50">
              <CardTitle className="flex items-center text-xl">
                <div className="w-8 h-8 bg-gradient-to-br from-slate-500 to-slate-600 rounded-lg flex items-center justify-center mr-3">
                  <i className="fas fa-barcode text-white text-sm" />
                </div>
                Scan Package
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowScanModal(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                <i className="fas fa-times text-lg" />
              </Button>
            </CardHeader>
            
            <CardContent className="p-6 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-barcode text-slate-600 text-3xl" />
              </div>
              
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Package Scanner</h3>
              <p className="text-slate-600 mb-6">Position barcode under scanner or enter manually</p>
              
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Enter tracking number manually..."
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  autoFocus
                />
                
                <div className="flex space-x-3">
                  <Button
                    className="flex-1 !bg-[#2563eb] hover:!bg-blue-700 text-white"
                    onClick={() => {
                      // Handle scan logic here
                      setShowScanModal(false);
                    }}
                  >
                    <i className="fas fa-barcode mr-2" />
                    Scan Package
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowScanModal(false)}
                    className="text-slate-600 border-slate-300 hover:bg-slate-50"
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

export default Packages;