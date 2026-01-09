import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Badge } from '../../components/UI/Badge';
import { showLoading, dismissLoadingAndShowSuccess, dismissLoadingAndShowError, showSuccess, showError } from '../../utils/toast';

interface LockdownEvent {
  id: string;
  type: 'initiated' | 'cancelled' | 'test' | 'error';
  timestamp: string;
  initiatedBy: string;
  reason?: string;
  affectedHardware: string[];
  status: 'active' | 'completed' | 'failed';
}

interface HardwareDevice {
  id: string;
  name: string;
  type: 'door' | 'sensor' | 'alarm' | 'camera';
  location: string;
  status: 'locked' | 'unlocked' | 'error' | 'offline';
  lastActivity: string;
}

interface LockdownStatus {
  isActive: boolean;
  initiatedAt?: string;
  initiatedBy?: string;
  reason?: string;
  affectedZones: string[];
}

const LockdownFacility: React.FC = () => {
  const navigate = useNavigate();
  const [lockdownStatus, setLockdownStatus] = useState<LockdownStatus>({
    isActive: false,
    affectedZones: []
  });
  const [hardwareDevices, setHardwareDevices] = useState<HardwareDevice[]>([]);
  const [lockdownHistory, setLockdownHistory] = useState<LockdownEvent[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load initial data from API
    loadLockdownStatus();
    loadHardwareDevices();
    loadLockdownHistory();
  }, []);

  const loadLockdownStatus = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/lockdown/status');
      // const data = await response.json();
      setLockdownStatus({ isActive: false, affectedZones: [] });
    } catch (error) {
      console.error('Failed to load lockdown status:', error);
    }
  };

  const loadHardwareDevices = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/lockdown/hardware');
      // const data = await response.json();
      setHardwareDevices([]);
    } catch (error) {
      console.error('Failed to load hardware devices:', error);
    }
  };

  const loadLockdownHistory = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/lockdown/history');
      // const data = await response.json();
      setLockdownHistory([]);
    } catch (error) {
      console.error('Failed to load lockdown history:', error);
    }
  };

  const handleInitiateLockdown = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmLockdown = async () => {
    setLoading(true);
    const toastId = showLoading('Initiating lockdown...');
    
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/lockdown/initiate', { method: 'POST' });
      // const data = await response.json();
      
      setLockdownStatus({
        isActive: true,
        initiatedAt: new Date().toISOString(),
        initiatedBy: 'Current User', // TODO: Get from auth context
        reason: 'Emergency lockdown',
        affectedZones: ['All Zones']
      });

      const newEvent: LockdownEvent = {
        id: Date.now().toString(),
        type: 'initiated',
        timestamp: new Date().toISOString(),
        initiatedBy: 'Current User',
        reason: 'Emergency lockdown',
        affectedHardware: hardwareDevices.map(d => d.name),
        status: 'active'
      };

      setLockdownHistory(prev => [newEvent, ...prev]);
      setShowConfirmModal(false);
      
      dismissLoadingAndShowSuccess(toastId, 'Lockdown initiated successfully');
    } catch (error) {
      dismissLoadingAndShowError(toastId, 'Failed to initiate lockdown');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelLockdown = () => {
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    setLoading(true);
    const toastId = showLoading('Cancelling lockdown...');
    
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/lockdown/cancel', { method: 'POST' });
      // const data = await response.json();
      
      setLockdownStatus({
        isActive: false,
        affectedZones: []
      });

      const newEvent: LockdownEvent = {
        id: Date.now().toString(),
        type: 'cancelled',
        timestamp: new Date().toISOString(),
        initiatedBy: 'Current User',
        affectedHardware: hardwareDevices.map(d => d.name),
        status: 'completed'
      };

      setLockdownHistory(prev => [newEvent, ...prev]);
      setShowCancelModal(false);
      
      dismissLoadingAndShowSuccess(toastId, 'Lockdown cancelled successfully');
    } catch (error) {
      dismissLoadingAndShowError(toastId, 'Failed to cancel lockdown');
    } finally {
      setLoading(false);
    }
  };

  const handleTestLockdown = async () => {
    setLoading(true);
    const toastId = showLoading('Running test lockdown...');
    
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/lockdown/test', { method: 'POST' });
      
      const newEvent: LockdownEvent = {
        id: Date.now().toString(),
        type: 'test',
        timestamp: new Date().toISOString(),
        initiatedBy: 'Current User',
        affectedHardware: hardwareDevices.map(d => d.name),
        status: 'completed'
      };

      setLockdownHistory(prev => [newEvent, ...prev]);
      
      dismissLoadingAndShowSuccess(toastId, 'Test lockdown completed');
    } catch (error) {
      dismissLoadingAndShowError(toastId, 'Failed to run test lockdown');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'locked':
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'unlocked':
      case 'completed':
        return <Badge variant="default">Inactive</Badge>;
      case 'error':
      case 'failed':
        return <Badge variant="destructive">Error</Badge>;
      case 'offline':
        return <Badge variant="warning">Offline</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Lockdown Facility</h1>
          <p className="text-slate-600 mt-1">Emergency lockdown management and monitoring</p>
        </div>
      </div>

      {/* Lockdown Status */}
      <Card>
        <CardHeader>
          <CardTitle>Lockdown Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              {lockdownStatus.isActive ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="destructive" size="lg">LOCKDOWN ACTIVE</Badge>
                  </div>
                  <p className="text-sm text-slate-600">
                    Initiated: {lockdownStatus.initiatedAt ? new Date(lockdownStatus.initiatedAt).toLocaleString() : 'N/A'}
                  </p>
                  <p className="text-sm text-slate-600">
                    By: {lockdownStatus.initiatedBy || 'N/A'}
                  </p>
                  {lockdownStatus.reason && (
                    <p className="text-sm text-slate-600 mt-1">
                      Reason: {lockdownStatus.reason}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="success" size="lg">SYSTEM NORMAL</Badge>
                  </div>
                  <p className="text-sm text-slate-600">No active lockdown</p>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {!lockdownStatus.isActive ? (
                <Button
                  onClick={handleInitiateLockdown}
                  variant="destructive"
                  disabled={loading}
                >
                  Initiate Lockdown
                </Button>
              ) : (
                <Button
                  onClick={handleCancelLockdown}
                  variant="default"
                  disabled={loading}
                >
                  Cancel Lockdown
                </Button>
              )}
              <Button
                onClick={handleTestLockdown}
                variant="outline"
                disabled={loading}
              >
                Test Lockdown
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hardware Status */}
      <Card>
        <CardHeader>
          <CardTitle>Hardware Status</CardTitle>
        </CardHeader>
        <CardContent>
          {hardwareDevices.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No hardware devices configured
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {hardwareDevices.map((device) => (
                <div key={device.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-900">{device.name}</h3>
                    {getStatusBadge(device.status)}
                  </div>
                  <p className="text-sm text-slate-600">{device.type}</p>
                  <p className="text-sm text-slate-600">{device.location}</p>
                  <p className="text-xs text-slate-500 mt-2">
                    Last activity: {new Date(device.lastActivity).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lockdown History */}
      <Card>
        <CardHeader>
          <CardTitle>Lockdown History</CardTitle>
        </CardHeader>
        <CardContent>
          {lockdownHistory.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No lockdown events recorded
            </div>
          ) : (
            <div className="space-y-2">
              {lockdownHistory.map((event) => (
                <div key={event.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(event.type)}
                      <span className="font-semibold text-slate-900">
                        {event.type.charAt(0).toUpperCase() + event.type.slice(1)} Lockdown
                      </span>
                    </div>
                    <span className="text-sm text-slate-600">
                      {new Date(event.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">
                    Initiated by: {event.initiatedBy}
                  </p>
                  {event.reason && (
                    <p className="text-sm text-slate-600">
                      Reason: {event.reason}
                    </p>
                  )}
                  <p className="text-sm text-slate-600">
                    Affected hardware: {event.affectedHardware.length} devices
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Modals */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Confirm Lockdown</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-4">
                Are you sure you want to initiate a facility-wide lockdown? This will:
              </p>
              <ul className="list-disc list-inside text-slate-600 mb-4 space-y-1">
                <li>Lock all doors and access points</li>
                <li>Activate alarms and notifications</li>
                <li>Restrict access to all zones</li>
              </ul>
              <div className="flex gap-2 justify-end">
                <Button
                  onClick={() => setShowConfirmModal(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmLockdown}
                  variant="destructive"
                  disabled={loading}
                >
                  Confirm Lockdown
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Cancel Lockdown</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-4">
                Are you sure you want to cancel the active lockdown? This will:
              </p>
              <ul className="list-disc list-inside text-slate-600 mb-4 space-y-1">
                <li>Unlock all doors and access points</li>
                <li>Silence alarms</li>
                <li>Restore normal access</li>
              </ul>
              <div className="flex gap-2 justify-end">
                <Button
                  onClick={() => setShowCancelModal(false)}
                  variant="outline"
                >
                  Keep Lockdown Active
                </Button>
                <Button
                  onClick={handleConfirmCancel}
                  variant="default"
                  disabled={loading}
                >
                  Cancel Lockdown
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default LockdownFacility;
