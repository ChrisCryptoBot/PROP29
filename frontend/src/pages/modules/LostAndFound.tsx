import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Badge } from '../../components/UI/Badge';
import { Avatar } from '../../components/UI/Avatar';
import { Progress } from '../../components/UI/Progress';
import { cn } from '../../utils/cn';
import { showError, showSuccess, showLoading, dismissLoadingAndShowSuccess, dismissLoadingAndShowError } from '../../utils/toast';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface LostItem {
  id: number;
  name: string;
  category: string;
  description: string;
  location: string;
  dateFound: string;
  status: 'found' | 'claimed' | 'expired' | 'donated';
  value?: number;
  photos?: string[];
  guestInfo?: {
    name: string;
    room: string;
    phone: string;
    email: string;
    checkInDate: string;
    checkOutDate: string;
  };
  storageLocation: string;
  qrCode?: string;
  aiMatchConfidence?: number;
  expirationDate: string;
  notificationsSent: number;
  lastNotificationDate?: string;
  legalCompliance: {
    retentionPeriod: number;
    disposalDate?: string;
    disposalMethod?: string;
  };
  managerApproved?: boolean;
  managerApprovedBy?: string;
  managerApprovedDate?: string;
}

const tabs = [
  { id: 'overview', label: 'Overview', path: '/modules/lost-and-found' },
  { id: 'storage', label: 'Storage Management', path: '/modules/storage-management' },
  { id: 'analytics', label: 'Analytics & Reports', path: '/modules/lost-found-analytics' },
  { id: 'settings', label: 'Settings', path: '/modules/lost-found-settings' }
];

const LostAndFound: React.FC = () => {
  const [items, setItems] = useState<LostItem[]>([]);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [filter, setFilter] = useState<'all' | 'found' | 'claimed' | 'expired' | 'donated'>('all');
  const [selectedItem, setSelectedItem] = useState<LostItem | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Type assertion to fix TypeScript strict literal type inference
  const currentTab = activeTab as any;
  
  // Form state for registering new items
  const [registerForm, setRegisterForm] = useState({
    name: '',
    category: '',
    description: '',
    location: '',
    value: '',
    guestName: '',
    guestRoom: '',
    guestPhone: '',
    guestEmail: '',
    estimatedValue: '',
    condition: '',
    storageLocation: ''
  });


  const filteredItems = items.filter(item => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  const handleNotifyGuest = useCallback(async (itemId: number) => {
    let toastId: string | undefined;
    try {
      toastId = showLoading('Sending notification...');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setItems(prev => prev.map(item =>
        item.id === itemId
          ? { 
              ...item, 
              notificationsSent: item.notificationsSent + 1,
              lastNotificationDate: new Date().toISOString()
            }
          : item
      ));
      
      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Guest notification sent successfully');
      }
    } catch (error) {
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to send notification');
      }
    }
  }, []);

  const handleClaimItem = useCallback(async (itemId: number) => {
    let toastId: string | undefined;
    try {
      toastId = showLoading('Processing claim...');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setItems(prev => prev.map(item =>
        item.id === itemId
          ? { ...item, status: 'claimed' as const }
          : item
      ));
      
      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Item claimed successfully');
      }
    } catch (error) {
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to claim item');
      }
    }
  }, []);

  const handleArchiveItem = useCallback(async (itemId: number) => {
    let toastId: string | undefined;
    try {
      toastId = showLoading('Archiving item...');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setItems(prev => prev.map(item =>
        item.id === itemId
          ? { ...item, status: 'donated' as const }
          : item
      ));
      
      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Item archived successfully');
      }
    } catch (error) {
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to archive item');
      }
    }
  }, []);

  const handleRegisterItem = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    let toastId: string | undefined;
    
    try {
      toastId = showLoading('Registering item...');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const isWeapon = registerForm.category === 'Weapons';
      
      const newItem: LostItem = {
        id: items.length + 1,
        name: registerForm.name,
        category: registerForm.category,
        description: registerForm.description,
        location: registerForm.location,
        dateFound: new Date().toISOString(),
        status: 'found',
        value: registerForm.value ? parseInt(registerForm.value) : undefined,
        storageLocation: isWeapon ? 'Security Office - Pending Manager Approval' : (registerForm.storageLocation || 'Storage Room A - Pending'),
        qrCode: `LOST_ITEM_${items.length + 1}_QR`,
        aiMatchConfidence: 0,
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notificationsSent: 0,
        legalCompliance: {
          retentionPeriod: 90
        },
        managerApproved: isWeapon ? false : undefined,
        ...(registerForm.guestName && {
          guestInfo: {
            name: registerForm.guestName,
            room: registerForm.guestRoom,
            phone: registerForm.guestPhone,
            email: registerForm.guestEmail,
            checkInDate: new Date().toISOString().split('T')[0],
            checkOutDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          }
        })
      };

      setItems(prev => [newItem, ...prev]);
      setRegisterForm({
        name: '', category: '', description: '', location: '', value: '',
        guestName: '', guestRoom: '', guestPhone: '', guestEmail: '',
        estimatedValue: '', condition: '', storageLocation: ''
      });
      setShowRegisterModal(false);
      
      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Item registered successfully');
      }
    } catch (error) {
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to register item');
      }
    }
  }, [items.length, registerForm]);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'found': return 'text-blue-800 bg-blue-100';
      case 'claimed': return 'text-green-800 bg-green-100';
      case 'expired': return 'text-yellow-800 bg-yellow-100';
      case 'donated': return 'text-slate-800 bg-slate-100';
      default: return 'text-slate-800 bg-slate-100';
    }
  };

  // Legacy function for compatibility
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'found': return 'default';
      case 'claimed': return 'success';
      case 'expired': return 'warning';
      case 'donated': return 'secondary';
      default: return 'secondary';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'electronics': return 'fas fa-mobile-alt';
      case 'jewelry': return 'fas fa-gem';
      case 'personal items': return 'fas fa-wallet';
      case 'accessories': return 'fas fa-sunglasses';
      case 'clothing': return 'fas fa-tshirt';
      case 'documents': return 'fas fa-file-alt';
      case 'keys': return 'fas fa-key';
      case 'sports equipment': return 'fas fa-basketball-ball';
      case 'weapons': return 'fas fa-exclamation-triangle';
      default: return 'fas fa-box';
    }
  };

  const metrics = {
    total: items.length,
    found: items.filter(i => i.status === 'found').length,
    claimed: items.filter(i => i.status === 'claimed').length,
    expired: items.filter(i => i.status === 'expired').length,
    notificationsSent: items.reduce((sum, item) => sum + item.notificationsSent, 0),
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
                <i className="fas fa-search text-white text-2xl" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                <i className="fas fa-check text-white text-xs" />
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-slate-900">
                Lost & Found
              </h1>
              <p className="text-slate-600 font-medium">
                Comprehensive lost item management and guest recovery system
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
          {/* Total Items */}
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
                  Total Items
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Found Items */}
          <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="pt-6 px-6 pb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center shadow-lg mt-2">
                  <i className="fas fa-search text-white text-xl" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-blue-600">
                  {metrics.found}
                </h3>
                <p className="text-slate-600 text-sm">
                  Found Items
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Claimed Items */}
          <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="pt-6 px-6 pb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center shadow-lg mt-2">
                  <i className="fas fa-check-circle text-white text-xl" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-blue-600">
                  {metrics.claimed}
                </h3>
                <p className="text-slate-600 text-sm">
                  Claimed Items
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Expired Items */}
          <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="pt-6 px-6 pb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-lg mt-2">
                  <i className="fas fa-clock text-white text-xl" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-blue-600">
                  {metrics.expired}
                </h3>
                <p className="text-slate-600 text-sm">
                  Expired Items
                </p>
              </div>
            </CardContent>
          </Card>


        </div>

        {/* Overview Tab Content */}
        {currentTab === 'overview' && (
          <>
            {/* Item Management */}
            <Card className="bg-white border-[1.5px] border-slate-200 shadow-sm mb-8">
              <CardHeader className="flex flex-row items-center justify-between px-6 pt-6 pb-4">
                <CardTitle className="flex items-center text-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                    <i className="fas fa-box-open text-white" />
                  </div>
                  Item Management
                </CardTitle>
                <div className="flex items-center space-x-2">
                  {['all', 'found', 'claimed', 'expired', 'donated'].map(filterType => (
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
                      {filterType}
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredItems.map(item => (
                    <Card 
                      key={item.id}
                      className={cn(
                        "backdrop-blur-sm bg-white/60 border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1",
                        item.status === 'found' && "border-slate-200/50 bg-slate-50/60",
                        item.status === 'claimed' && "border-slate-200/50 bg-slate-50/60",
                        item.status === 'expired' && "border-slate-200/50 bg-slate-50/60"
                      )}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center shadow-lg">
                              <i className={cn("text-xl text-slate-600", getCategoryIcon(item.category))} />
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900">{item.name}</h4>
                              <p className="text-slate-600 text-sm">{item.category}</p>
                            </div>
                          </div>
                          <span className={`px-2.5 py-1 text-xs font-semibold rounded ${getStatusBadgeClass(item.status)}`}>
                            {item.status.toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Location:</span>
                            <span className="font-medium">{item.location}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Value:</span>
                            <span className="font-medium">{item.value ? `$${item.value}` : 'Unknown'}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Storage:</span>
                            <span className="font-medium">{item.storageLocation}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Found:</span>
                            <span className="font-medium">{item.dateFound}</span>
                          </div>
                        </div>

                        {item.guestInfo && (
                          <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                            <p className="text-sm font-medium text-slate-700 mb-1">Guest Info:</p>
                            <p className="text-sm text-slate-600">{item.guestInfo.name} - Room {item.guestInfo.room}</p>
                            <p className="text-xs text-slate-500">{item.guestInfo.phone}</p>
                          </div>
                        )}

                        {item.category === 'Weapons' && item.managerApproved === false && (
                          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <i className="fas fa-exclamation-triangle text-red-600" />
                              <p className="text-sm font-semibold text-red-900">⚠️ Pending Manager Approval</p>
                            </div>
                            <p className="text-xs text-red-700 mt-1">This item requires manager review before processing.</p>
                          </div>
                        )}

                        {item.category === 'Weapons' && item.managerApproved === true && (
                          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <i className="fas fa-check-circle text-green-600" />
                              <p className="text-sm font-semibold text-green-900">✓ Manager Approved</p>
                            </div>
                            {item.managerApprovedBy && (
                              <p className="text-xs text-green-700 mt-1">
                                Approved by {item.managerApprovedBy} on {item.managerApprovedDate}
                              </p>
                            )}
                          </div>
                        )}

                        <div className="flex gap-2">
                          {item.status === 'found' && (
                            <>
                              <Button 
                                className="flex-1 !bg-[#2563eb] hover:!bg-blue-700 text-white text-sm"
                                onClick={() => handleNotifyGuest(item.id)}
                                disabled={loading}
                              >
                                Notify Guest
                              </Button>
                              <Button 
                                variant="outline"
                                className="flex-1 text-slate-600 border-slate-300 hover:bg-slate-50 text-sm"
                                onClick={() => handleClaimItem(item.id)}
                                disabled={loading}
                              >
                                Claim
                              </Button>
                            </>
                          )}
                          {item.status === 'expired' && (
                            <Button 
                              className="flex-1 !bg-[#2563eb] hover:!bg-blue-700 text-white text-sm"
                              onClick={() => handleArchiveItem(item.id)}
                              disabled={loading}
                            >
                              Archive
                            </Button>
                          )}
                          <Button 
                            variant="outline"
                            className="text-slate-600 border-slate-300 hover:bg-slate-50 text-sm"
                            onClick={() => setSelectedItem(item)}
                          >
                            View Details
                          </Button>
                        </div>
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
                    className="!bg-red-600 hover:!bg-red-700 text-white"
                    onClick={() => {
                      const weaponItems = items.filter(i => i.category === 'Weapons' && i.managerApproved === false);
                      showSuccess(`${weaponItems.length} weapons require immediate manager approval`);
                    }}
                  >
                    <i className="fas fa-exclamation-triangle mr-2" />
                    Weapon Alert
                  </Button>
                  <Button 
                    className="!bg-orange-600 hover:!bg-orange-700 text-white"
                    onClick={() => {
                      const expiredItems = items.filter(i => i.status === 'expired');
                      showSuccess(`${expiredItems.length} items require disposal`);
                    }}
                  >
                    <i className="fas fa-trash mr-2" />
                    Disposal Alert
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Storage Management Tab */}
        {currentTab === 'storage' && (
          <div className="space-y-6">
            {/* Storage Location Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {['Storage A', 'Storage B', 'Storage C', 'Storage D'].map((location, idx) => {
                const itemCount = items.filter(i => i.storageLocation === location).length;
                const capacity = 20;
                const percentage = Math.round((itemCount / capacity) * 100);
                const nearExpiry = items.filter(i => 
                  i.storageLocation === location && 
                  new Date(i.expirationDate).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000
                ).length;

                return (
                  <Card key={location} className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center">
                          <i className="fas fa-warehouse text-slate-600" />
                        </div>
                        <span className="px-2.5 py-1 text-xs font-semibold rounded text-slate-800 bg-slate-100">{location}</span>
                      </div>
                      <h3 className="text-3xl font-bold text-slate-900 mb-1">{itemCount}</h3>
                      <p className="text-sm text-slate-600 mb-3">Items Stored</p>
                      <Progress value={percentage} className="h-2 mb-2" />
                      <p className="text-xs text-slate-500 mb-3">{percentage}% Capacity ({itemCount}/{capacity})</p>
                      {nearExpiry > 0 && (
                        <div className="flex items-center space-x-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                          <i className="fas fa-exclamation-triangle" />
                          <span>{nearExpiry} expiring soon</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Storage Location Details */}
            <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
                <CardTitle>Storage Location Details</CardTitle>
                <p className="text-sm text-slate-600 mt-1">Manage items by storage location</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {['Storage A', 'Storage B', 'Storage C', 'Storage D'].map((location) => {
                    const locationItems = items.filter(i => i.storageLocation === location);
                    
                    return (
                      <div key={location} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center">
                              <i className="fas fa-warehouse text-slate-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-900">{location}</h3>
                              <p className="text-sm text-slate-600">{locationItems.length} items</p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => showSuccess(`Viewing ${location}`)}
                            className="text-slate-600 border-slate-300 hover:bg-slate-50"
                          >
                            <i className="fas fa-eye mr-2" />
                            View All
                          </Button>
                        </div>

                        {locationItems.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {locationItems.slice(0, 6).map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                onClick={() => setSelectedItem(item)}
                              >
                                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                                  <i className={cn("text-sm text-slate-600", getCategoryIcon(item.category))} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-900 truncate">{item.name}</p>
                                  <p className="text-xs text-slate-600">{item.category}</p>
                                </div>
                                <span className={`px-2.5 py-1 text-xs font-semibold rounded flex-shrink-0 ${getStatusBadgeClass(item.status)}`}>
                                  {item.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500 text-center py-8">No items in this location</p>
                        )}

                        {locationItems.length > 6 && (
                          <p className="text-sm text-slate-600 text-center mt-3">
                            +{locationItems.length - 6} more items
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Capacity Alerts */}
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>Capacity Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['Storage A', 'Storage B', 'Storage C', 'Storage D'].map((location) => {
                    const itemCount = items.filter(i => i.storageLocation === location).length;
                    const capacity = 20;
                    const percentage = Math.round((itemCount / capacity) * 100);
                    
                    if (percentage < 80) return null;
                    
                    return (
                      <div key={location} className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <i className="fas fa-exclamation-triangle text-amber-600" />
                          <div>
                            <p className="text-sm font-medium text-slate-900">{location} at {percentage}% capacity</p>
                            <p className="text-xs text-slate-600">{itemCount} of {capacity} spaces used</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => showSuccess('Transferring items...')}
                          className="text-slate-600 border-slate-300 hover:bg-white"
                        >
                          Transfer Items
                        </Button>
                      </div>
                    );
                  })}
                  {!['Storage A', 'Storage B', 'Storage C', 'Storage D'].some(location => {
                    const itemCount = items.filter(i => i.storageLocation === location).length;
                    return Math.round((itemCount / 20) * 100) >= 80;
                  }) && (
                    <p className="text-sm text-slate-600 text-center py-4">No capacity alerts at this time</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Analytics & Reports Tab */}
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
                  <h3 className="text-3xl font-bold text-slate-900 mb-1">
                    {Math.round((items.filter(i => i.status === 'claimed').length / items.length) * 100)}%
                  </h3>
                  <p className="text-sm text-slate-600">Recovery Rate</p>
                  <p className="text-xs text-green-600 mt-1">+5% from last month</p>
                </CardContent>
              </Card>

              <Card className="bg-white border-slate-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <i className="fas fa-clock text-slate-600 text-xl" />
                  </div>
                  <h3 className="text-3xl font-bold text-slate-900 mb-1">2.3</h3>
                  <p className="text-sm text-slate-600">Avg Days to Claim</p>
                  <p className="text-xs text-slate-500 mt-1">Industry avg: 4.5 days</p>
                </CardContent>
              </Card>

              <Card className="bg-white border-slate-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <i className="fas fa-dollar-sign text-slate-600 text-xl" />
                    <i className="fas fa-arrow-up text-green-600 text-sm" />
                  </div>
                  <h3 className="text-3xl font-bold text-slate-900 mb-1">
                    ${items.reduce((sum, item) => sum + (item.value || 0), 0).toLocaleString()}
                  </h3>
                  <p className="text-sm text-slate-600">Total Value Recovered</p>
                  <p className="text-xs text-green-600 mt-1">+12% from last month</p>
                </CardContent>
              </Card>

              <Card className="bg-white border-slate-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <i className="fas fa-box text-slate-600 text-xl" />
                  </div>
                  <h3 className="text-3xl font-bold text-slate-900 mb-1">{items.length}</h3>
                  <p className="text-sm text-slate-600">Total Items This Month</p>
                  <p className="text-xs text-slate-500 mt-1">Across all categories</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Recovery Rate Trend */}
              <Card className="bg-white border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                      <i className="fas fa-chart-line text-white" />
                    </div>
                    Recovery Rate Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={[
                      { month: 'Jul', recovered: 65, total: 78 },
                      { month: 'Aug', recovered: 72, total: 85 },
                      { month: 'Sep', recovered: 78, total: 92 },
                      { month: 'Oct', recovered: 85, total: 98 },
                      { month: 'Nov', recovered: 92, total: 105 },
                      { month: 'Dec', recovered: 98, total: 112 }
                    ]}>
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
                      <Line type="monotone" dataKey="recovered" stroke="#2563eb" strokeWidth={2} name="Recovered" />
                      <Line type="monotone" dataKey="total" stroke="#94a3b8" strokeWidth={2} name="Total Found" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Common Items */}
              <Card className="bg-white border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                      <i className="fas fa-chart-bar text-white" />
                    </div>
                    Most Common Items
              </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[
                      { category: 'Electronics', count: 45 },
                      { category: 'Clothing', count: 32 },
                      { category: 'Jewelry', count: 28 },
                      { category: 'Documents', count: 22 },
                      { category: 'Keys', count: 18 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="category" stroke="#64748b" />
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
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                      <i className="fas fa-chart-pie text-white" />
                    </div>
                    Status Distribution
              </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Found', value: items.filter(i => i.status === 'found').length },
                          { name: 'Claimed', value: items.filter(i => i.status === 'claimed').length },
                          { name: 'Expired', value: items.filter(i => i.status === 'expired').length },
                          { name: 'Donated', value: items.filter(i => i.status === 'donated').length }
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
                        <Cell fill="#10b981" />
                        <Cell fill="#f59e0b" />
                        <Cell fill="#6366f1" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Value Recovered Over Time */}
              <Card className="bg-white border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <i className="fas fa-dollar-sign text-slate-600 mr-2" />
                    Value Recovered Over Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={[
                      { month: 'Jul', value: 12500 },
                      { month: 'Aug', value: 15200 },
                      { month: 'Sep', value: 18900 },
                      { month: 'Oct', value: 22400 },
                      { month: 'Nov', value: 28100 },
                      { month: 'Dec', value: 31800 }
                    ]}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px'
                        }}
                        formatter={(value: number) => `$${value.toLocaleString()}`}
                      />
                      <Area type="monotone" dataKey="value" stroke="#2563eb" fillOpacity={1} fill="url(#colorValue)" />
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

        {/* Settings Tab */}
        {currentTab === 'settings' && (
          <div className="space-y-6">
            {/* System Settings */}
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <p className="text-sm text-slate-600 mt-1">Configure general system preferences</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">
                      Default Retention Period (days)
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      defaultValue={90}
                    />
                    <p className="text-xs text-slate-500">Items will be marked as expired after this period</p>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">
                      Expiration Warning (days before)
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      defaultValue={7}
                    />
                    <p className="text-xs text-slate-500">Send notifications this many days before expiration</p>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">
                      QR Code Prefix
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      defaultValue="LF"
                      placeholder="LF"
                    />
                    <p className="text-xs text-slate-500">Prefix for QR code generation (e.g., LF-001)</p>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">
                      Auto-Archive After (days)
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      defaultValue={30}
                    />
                    <p className="text-xs text-slate-500">Automatically archive expired items after this period</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Auto-Notification Enabled</p>
                    <p className="text-xs text-slate-600">Automatically notify guests when their items are found</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-900">AI Matching Enabled</p>
                    <p className="text-xs text-slate-600">Use AI to match found items with guest descriptions</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600" />
                </div>
                <Button 
                  className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
                  onClick={() => showSuccess('System settings updated')}
                >
                  <i className="fas fa-save mr-2" />
                  Save System Settings
                </Button>
              </CardContent>
            </Card>

            {/* Category Management */}
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>Category Management</CardTitle>
                <p className="text-sm text-slate-600 mt-1">Manage item categories and their properties</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  {['Electronics', 'Clothing', 'Jewelry', 'Documents', 'Keys', 'Accessories', 'Sports Equipment', 'Weapons'].map((category) => (
                    <div key={category} className={cn(
                      "flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50",
                      category === 'Weapons' ? 'border-red-200 bg-red-50' : 'border-slate-200'
                    )}>
                      <div className="flex items-center space-x-3">
                        <div className={cn(
                          "w-8 h-8 bg-gradient-to-br rounded-lg flex items-center justify-center",
                          category === 'Weapons' ? 'from-red-100 to-red-200' : 'from-slate-100 to-slate-200'
                        )}>
                          <i className={cn("text-sm", category === 'Weapons' ? 'text-red-600' : 'text-slate-600', getCategoryIcon(category))} />
                        </div>
                        <div>
                          <span className={cn("text-sm font-medium", category === 'Weapons' ? 'text-red-900' : 'text-slate-900')}>{category}</span>
                          {category === 'Weapons' && (
                            <p className="text-xs text-red-600 mt-0.5">⚠️ Requires Manager Approval</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => showSuccess(`Editing ${category}`)}
                          className="text-slate-600 border-slate-300 hover:bg-slate-50"
                        >
                          <i className="fas fa-edit" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => showSuccess(`Deleted ${category}`)}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <i className="fas fa-trash" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  className="w-full text-slate-600 border-slate-300 hover:bg-slate-50"
                  onClick={() => showSuccess('Add new category')}
                >
                  <i className="fas fa-plus mr-2" />
                  Add New Category
                </Button>
              </CardContent>
            </Card>

            {/* Storage Location Management */}
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>Storage Location Management</CardTitle>
                <p className="text-sm text-slate-600 mt-1">Configure storage locations and capacity</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  {['Storage A', 'Storage B', 'Storage C', 'Storage D'].map((location) => (
                    <div key={location} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center">
                          <i className="fas fa-warehouse text-slate-600 text-sm" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{location}</p>
                          <p className="text-xs text-slate-600">Capacity: 20 items</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => showSuccess(`Editing ${location}`)}
                          className="text-slate-600 border-slate-300 hover:bg-slate-50"
                        >
                          <i className="fas fa-edit" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => showSuccess(`Deleted ${location}`)}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <i className="fas fa-trash" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  className="w-full text-slate-600 border-slate-300 hover:bg-slate-50"
                  onClick={() => showSuccess('Add new storage location')}
                >
                  <i className="fas fa-plus mr-2" />
                  Add New Location
                </Button>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <p className="text-sm text-slate-600 mt-1">Configure notification templates and preferences</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">
                      Email Subject Template
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      defaultValue="Your Lost Item Has Been Found - {item_name}"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">
                      Email Body Template
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={4}
                      defaultValue="Dear {guest_name},\n\nWe've found your {item_name}. Please visit our Lost & Found desk to claim it.\n\nLocation: {storage_location}\nItem ID: {item_id}"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">
                      SMS Template
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      defaultValue="Hi {guest_name}, we found your {item_name}. Visit Lost & Found desk. ID: {item_id}"
                    />
                  </div>
                </div>
                <Button 
                  className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
                  onClick={() => showSuccess('Notification templates updated')}
                >
                  <i className="fas fa-save mr-2" />
                  Save Templates
                </Button>
              </CardContent>
            </Card>

            {/* Legal & Compliance */}
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>Legal & Compliance Settings</CardTitle>
                <p className="text-sm text-slate-600 mt-1">Configure disposal and legal compliance settings</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">
                      Default Disposal Method
                    </label>
                    <select className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>Donation</option>
                      <option>Auction</option>
                      <option>Disposal</option>
                      <option>Return to Owner</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">
                      High-Value Threshold
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      defaultValue={500}
                      placeholder="500"
                    />
                    <p className="text-xs text-slate-500">Items above this value require manager approval</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Require Photo Documentation</p>
                    <p className="text-xs text-slate-600">Require photos for all registered items</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Chain of Custody Tracking</p>
                    <p className="text-xs text-slate-600">Track who handled each item</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600" />
                </div>
                <Button 
                  className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
                  onClick={() => showSuccess('Legal settings updated')}
                >
                  <i className="fas fa-save mr-2" />
                  Save Legal Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Item Details Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="backdrop-blur-xl bg-white/90 border-white/30 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200/50">
              <CardTitle className="flex items-center text-xl">
                <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center mr-3">
                  <i className={cn("text-white text-sm", getCategoryIcon(selectedItem.category))} />
                </div>
                {selectedItem.name}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedItem(null)}
                className="text-slate-500 hover:text-slate-700"
              >
                <i className="fas fa-times text-lg" />
              </Button>
            </CardHeader>
            
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column - Item Details */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Item Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-2 border-b border-slate-100">
                        <span className="text-sm text-slate-600">Category</span>
                        <span className="px-2.5 py-1 text-xs font-semibold rounded text-slate-800 bg-slate-100">{selectedItem.category}</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-slate-100">
                        <span className="text-sm text-slate-600">Status</span>
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded ${getStatusBadgeClass(selectedItem.status)}`}>{selectedItem.status.toUpperCase()}</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-slate-100">
                        <span className="text-sm text-slate-600">Estimated Value</span>
                        <span className="font-medium text-slate-900">{selectedItem.value ? `$${selectedItem.value}` : 'Unknown'}</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-slate-100">
                        <span className="text-sm text-slate-600">Date Found</span>
                        <span className="font-medium text-slate-900">{new Date(selectedItem.dateFound).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-slate-100">
                        <span className="text-sm text-slate-600">Location Found</span>
                        <span className="font-medium text-slate-900">{selectedItem.location}</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-slate-100">
                        <span className="text-sm text-slate-600">Storage Location</span>
                        <span className="font-medium text-slate-900">{selectedItem.storageLocation}</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-slate-100">
                        <span className="text-sm text-slate-600">Expiration Date</span>
                        <span className="font-medium text-slate-900">{new Date(selectedItem.expirationDate).toLocaleDateString()}</span>
                      </div>
                      {selectedItem.aiMatchConfidence && (
                        <div className="flex items-center justify-between py-2 border-b border-slate-100">
                          <span className="text-sm text-slate-600">AI Match Confidence</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-[#2563eb] transition-all duration-300"
                                style={{ width: `${selectedItem.aiMatchConfidence}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-slate-900">{selectedItem.aiMatchConfidence}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-3">Description</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{selectedItem.description}</p>
                  </div>

                  {selectedItem.qrCode && (
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-3">QR Code</h3>
                      <div className="p-4 bg-slate-50 rounded-lg text-center">
                        <div className="w-32 h-32 bg-white border-2 border-slate-200 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <i className="fas fa-qrcode text-4xl text-slate-400" />
                        </div>
                        <p className="text-xs text-slate-500 font-mono">{selectedItem.qrCode}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column - Guest Info & Actions */}
                <div className="space-y-6">
                  {selectedItem.guestInfo && (
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">Guest Information</h3>
                      <Card className="bg-slate-50 border-slate-200">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-12 h-12">
                              <div className="w-full h-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white font-semibold">
                                {selectedItem.guestInfo.name.charAt(0)}
                              </div>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-slate-900">{selectedItem.guestInfo.name}</p>
                              <p className="text-sm text-slate-600">Room {selectedItem.guestInfo.room}</p>
                            </div>
                          </div>
                          <div className="space-y-2 pt-3 border-t border-slate-200">
                            <div className="flex items-center space-x-2 text-sm">
                              <i className="fas fa-phone text-slate-400 w-4" />
                              <span className="text-slate-600">{selectedItem.guestInfo.phone}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm">
                              <i className="fas fa-envelope text-slate-400 w-4" />
                              <span className="text-slate-600">{selectedItem.guestInfo.email}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm">
                              <i className="fas fa-calendar text-slate-400 w-4" />
                              <span className="text-slate-600">
                                {new Date(selectedItem.guestInfo.checkInDate).toLocaleDateString()} - {new Date(selectedItem.guestInfo.checkOutDate).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
            </CardContent>
          </Card>
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Notifications</h3>
                    <Card className="bg-slate-50 border-slate-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm text-slate-600">Notifications Sent</span>
                          <span className="px-2.5 py-1 text-xs font-semibold rounded text-blue-800 bg-blue-100">{selectedItem.notificationsSent}</span>
                        </div>
                        {selectedItem.lastNotificationDate && (
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-sm text-slate-600">Last Notification</span>
                            <span className="text-sm text-slate-900">{new Date(selectedItem.lastNotificationDate).toLocaleString()}</span>
                          </div>
                        )}
                        {selectedItem.status === 'found' && selectedItem.guestInfo && (
                          <Button
                            className="w-full !bg-[#2563eb] hover:!bg-blue-700 text-white"
                            onClick={() => {
                              handleNotifyGuest(selectedItem.id);
                              setSelectedItem(null);
                            }}
                          >
                            <i className="fas fa-bell mr-2" />
                            Send Notification
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Legal Compliance</h3>
                    <Card className="bg-slate-50 border-slate-200">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Retention Period</span>
                          <span className="font-medium text-slate-900">{selectedItem.legalCompliance.retentionPeriod} days</span>
                        </div>
                        {selectedItem.legalCompliance.disposalDate && (
                          <>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-600">Disposal Date</span>
                              <span className="font-medium text-slate-900">{new Date(selectedItem.legalCompliance.disposalDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-600">Disposal Method</span>
                              <span className="font-medium text-slate-900">{selectedItem.legalCompliance.disposalMethod}</span>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Manager Approval Status */}
                  {selectedItem.category === 'Weapons' && (
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">Manager Approval</h3>
                      {selectedItem.managerApproved === false ? (
                        <Card className="bg-red-50 border-red-200">
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-2 mb-2">
                              <i className="fas fa-exclamation-triangle text-red-600" />
                              <span className="font-semibold text-red-900">⚠️ Pending Manager Review</span>
                            </div>
                            <p className="text-sm text-red-700 mb-3">
                              This item requires manager approval before it can be processed or released.
                            </p>
                            <Button
                              className="w-full bg-red-600 hover:bg-red-700 text-white text-sm"
                              onClick={() => {
                                // In real implementation, this would trigger a manager approval workflow
                                showSuccess('Manager notification sent');
                              }}
                            >
                              <i className="fas fa-user-shield mr-2" />
                              Request Manager Approval
                            </Button>
                          </CardContent>
                        </Card>
                      ) : selectedItem.managerApproved === true ? (
                        <Card className="bg-green-50 border-green-200">
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-2 mb-2">
                              <i className="fas fa-check-circle text-green-600" />
                              <span className="font-semibold text-green-900">✓ Approved</span>
                            </div>
                            {selectedItem.managerApprovedBy && (
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-green-700">Approved By:</span>
                                  <span className="font-medium text-green-900">{selectedItem.managerApprovedBy}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-green-700">Date:</span>
                                  <span className="font-medium text-green-900">{selectedItem.managerApprovedDate}</span>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ) : null}
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="space-y-2">
                    {selectedItem.status === 'found' && (
                      <Button
                        className="w-full !bg-[#2563eb] hover:!bg-blue-700 text-white"
                        onClick={() => {
                          handleClaimItem(selectedItem.id);
                          setSelectedItem(null);
                        }}
                      >
                        <i className="fas fa-check mr-2" />
                        Mark as Claimed
                      </Button>
                    )}
                    {selectedItem.status === 'expired' && (
                      <Button
                        className="w-full !bg-[#2563eb] hover:!bg-blue-700 text-white"
                        onClick={() => {
                          handleArchiveItem(selectedItem.id);
                          setSelectedItem(null);
                        }}
                      >
                        <i className="fas fa-archive mr-2" />
                        Archive Item
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className="w-full text-slate-600 border-slate-300 hover:bg-slate-50"
                      onClick={() => showSuccess('QR code printed')}
                    >
                      <i className="fas fa-print mr-2" />
                      Print QR Code
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Register New Item Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="backdrop-blur-xl bg-white/90 border-white/30 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200/50">
              <CardTitle className="flex items-center text-xl">
                <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center mr-3">
                  <i className="fas fa-plus text-white text-sm" />
                </div>
                Register New Lost Item
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
              <form onSubmit={handleRegisterItem} className="space-y-6">
                {/* Basic Item Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                    <i className="fas fa-info-circle text-slate-600 mr-2" />
                    Basic Item Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="item-name" className="block text-sm font-medium text-slate-700">
                        Item Name *
                      </label>
                      <input
                        type="text"
                        id="item-name"
                        value={registerForm.name}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., iPhone 14 Pro, Gold Ring"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="category" className="block text-sm font-medium text-slate-700">
                        Category *
                      </label>
                      <select
                        id="category"
                        value={registerForm.category}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select Category</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Jewelry">Jewelry</option>
                        <option value="Personal Items">Personal Items</option>
                        <option value="Accessories">Accessories</option>
                        <option value="Clothing">Clothing</option>
                        <option value="Weapons" className="text-red-600 font-medium">⚠️ Weapons (Requires Manager Approval)</option>
                        <option value="Documents">Documents</option>
                        <option value="Other">Other</option>
                      </select>
                      {registerForm.category === 'Weapons' && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <i className="fas fa-exclamation-triangle text-red-600 mt-0.5" />
                            <div>
                              <p className="text-sm font-semibold text-red-900">⚠️ Manager Approval Required</p>
                              <p className="text-xs text-red-700 mt-1">
                                This item requires immediate manager approval before it can be stored. The item will be flagged as "Pending Manager Review" until approved. Please contact security immediately.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="description" className="block text-sm font-medium text-slate-700">
                      Detailed Description *
                    </label>
                    <textarea
                      id="description"
                      rows={3}
                      value={registerForm.description}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Provide a detailed description of the item including color, brand, size, etc."
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="location-found" className="block text-sm font-medium text-slate-700">
                        Location Found *
                      </label>
                      <input
                        type="text"
                        id="location-found"
                        value={registerForm.location}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, location: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Pool Deck, Lobby, Parking Garage"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="estimated-value" className="block text-sm font-medium text-slate-700">
                        Estimated Value ($)
                      </label>
                      <input
                        type="number"
                        id="estimated-value"
                        value={registerForm.value}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, value: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="condition" className="block text-sm font-medium text-slate-700">
                      Item Condition
                    </label>
                    <select
                      id="condition"
                      value={registerForm.condition}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, condition: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="">Select Condition</option>
                      <option value="Excellent">Excellent</option>
                      <option value="Good">Good</option>
                      <option value="Fair">Fair</option>
                      <option value="Poor">Poor</option>
                      <option value="Unknown">Unknown</option>
                    </select>
                  </div>
                </div>

                {/* Guest Information */}
                <div className="space-y-4 border-t border-slate-200/50 pt-6">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                    <i className="fas fa-user text-slate-600 mr-2" />
                    Guest Information (if known)
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="guest-name" className="block text-sm font-medium text-slate-700">
                        Guest Name
                      </label>
                      <input
                        type="text"
                        id="guest-name"
                        value={registerForm.guestName}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, guestName: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Full name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="guest-room" className="block text-sm font-medium text-slate-700">
                        Room Number
                      </label>
                      <input
                        type="text"
                        id="guest-room"
                        value={registerForm.guestRoom}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, guestRoom: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Room number"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="guest-phone" className="block text-sm font-medium text-slate-700">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="guest-phone"
                        value={registerForm.guestPhone}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, guestPhone: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Phone number"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="guest-email" className="block text-sm font-medium text-slate-700">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="guest-email"
                        value={registerForm.guestEmail}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, guestEmail: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Email address"
                      />
                    </div>
                  </div>
                </div>

                {/* Storage Information */}
                <div className="space-y-4 border-t border-slate-200/50 pt-6">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                    <i className="fas fa-warehouse text-slate-600 mr-2" />
                    Storage Information
                  </h3>
                  
                  <div className="space-y-2">
                    <label htmlFor="storage-location" className="block text-sm font-medium text-slate-700">
                      Storage Location
                    </label>
                    <select
                      id="storage-location"
                      value={registerForm.storageLocation}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, storageLocation: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="">Select Storage Location</option>
                      <option value="Storage Room A - Shelf 1">Storage Room A - Shelf 1</option>
                      <option value="Storage Room A - Shelf 2">Storage Room A - Shelf 2</option>
                      <option value="Storage Room A - Shelf 3">Storage Room A - Shelf 3</option>
                      <option value="Storage Room A - Safe 1">Storage Room A - Safe 1</option>
                      <option value="Storage Room B - Drawer 1">Storage Room B - Drawer 1</option>
                      <option value="Storage Room B - Drawer 2">Storage Room B - Drawer 2</option>
                      <option value="Storage Room A - Secure Area">Storage Room A - Secure Area</option>
                      <option value="Storage Room A - Pending">Storage Room A - Pending</option>
                    </select>
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
                    disabled={loading || !registerForm.name || !registerForm.category || !registerForm.description || !registerForm.location}
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Registering...
                      </div>
                    ) : (
                      <>
                        <i className="fas fa-save mr-2" />
                        Register Item
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default LostAndFound;