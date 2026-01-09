import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Badge } from '../../components/UI/Badge';
import { Progress } from '../../components/UI/Progress';
import { cn } from '../../utils/cn';
import { showLoading, dismissLoadingAndShowSuccess, dismissLoadingAndShowError, showSuccess, showError } from '../../utils/toast';

// Types
interface CameraEntry {
  id: number;
  name: string;
  location: string;
  status: 'online' | 'offline' | 'maintenance';
  resolution: string;
  uptime: string;
  previewType: 'online' | 'offline' | 'maintenance';
  actionsDisabled?: boolean;
  recording?: boolean;
  motionDetection?: boolean;
  fps?: string;
  storage?: string;
}

interface CameraMetrics {
  total: number;
  online: number;
  offline: number;
  maintenance: number;
  recording: number;
  avgUptime: string;
}

interface Recording {
  id: string;
  cameraId: number;
  cameraName: string;
  date: string;
  time: string;
  duration: string;
  size: string;
  thumbnail?: string;
}

interface EvidenceItem {
  id: string;
  title: string;
  camera: string;
  time: string;
  date: string;
  type: 'video' | 'photo';
  size: string;
  incidentId?: string;
  chainOfCustody: Array<{ timestamp: string; handler: string; action: string }>;
  tags: string[];
  status: 'pending' | 'reviewed' | 'archived';
}

interface AnalyticsData {
  motionEvents: number;
  alertsTriggered: number;
  averageResponseTime: string;
  peakActivity: string;
}

const tabs = [
  { id: 'live', label: 'Live View' },
  { id: 'recordings', label: 'Recordings' },
  { id: 'evidence', label: 'Evidence Management' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'settings', label: 'Settings' }
];

const FILTER_OPTIONS = ['All Cameras', 'Online Only', 'Offline Only', 'Maintenance'];

const initialCameras: CameraEntry[] = [
  { id: 1, name: 'Lobby Main Entrance', location: 'Lobby - Main Floor', status: 'online', resolution: '4K', uptime: '99.8%', previewType: 'online', recording: true, motionDetection: true, fps: '30', storage: '2.4 TB' },
  { id: 2, name: 'Pool Area Camera', location: 'Pool Deck - Outdoor', status: 'online', resolution: '1080p', uptime: '98.5%', previewType: 'online', recording: false, motionDetection: true, fps: '30', storage: '1.2 TB' },
  { id: 3, name: 'Parking Lot East', location: 'Parking - East Wing', status: 'maintenance', resolution: '720p', uptime: '--', previewType: 'maintenance', actionsDisabled: true, recording: false, motionDetection: false, fps: '--', storage: '--' },
  { id: 4, name: 'Staff Entrance', location: 'East Wing - Staff Area', status: 'online', resolution: '1080p', uptime: '98.5%', previewType: 'online', recording: false, motionDetection: false, fps: '24', storage: '0.8 TB' },
  { id: 5, name: 'Elevator Bank A', location: 'Main Floor - Central', status: 'online', resolution: '4K', uptime: '99.9%', previewType: 'online', recording: false, motionDetection: true, fps: '30', storage: '1.9 TB' },
  { id: 6, name: 'Restaurant Kitchen', location: 'Restaurant - Kitchen', status: 'offline', resolution: '1080p', uptime: '0%', previewType: 'offline', actionsDisabled: true, recording: false, motionDetection: false, fps: '--', storage: '--' },
];

const initialRecordings: Recording[] = [
  { id: 'rec-1', cameraId: 1, cameraName: 'Lobby Main Entrance', date: '2025-10-24', time: '14:30', duration: '02:15:30', size: '3.2 GB' },
  { id: 'rec-2', cameraId: 2, cameraName: 'Pool Area Camera', date: '2025-10-24', time: '12:00', duration: '01:45:20', size: '1.8 GB' },
  { id: 'rec-3', cameraId: 1, cameraName: 'Lobby Main Entrance', date: '2025-10-23', time: '16:45', duration: '03:20:15', size: '4.1 GB' },
  { id: 'rec-4', cameraId: 4, cameraName: 'Staff Entrance', date: '2025-10-23', time: '08:30', duration: '08:00:00', size: '9.6 GB' },
];

const initialEvidence: EvidenceItem[] = [
  { 
    id: 'ev-1', 
    title: 'Pool Area Incident - Camera 1', 
    camera: 'CAM-001', 
    time: '16:45', 
    date: '2025-10-24',
    type: 'video', 
    size: '156 MB',
    status: 'pending',
    chainOfCustody: [
      { timestamp: '2025-10-24 16:50', handler: 'Officer Smith', action: 'Evidence captured' }
    ],
    tags: ['incident', 'pool-area']
  },
  { 
    id: 'ev-2', 
    title: 'Lobby Entrance - Camera 2', 
    camera: 'CAM-002', 
    time: '13:47', 
    date: '2025-10-24',
    type: 'video', 
    size: '89 MB',
    incidentId: 'INC-2024-001',
    status: 'reviewed',
    chainOfCustody: [
      { timestamp: '2025-10-24 13:50', handler: 'Officer Johnson', action: 'Evidence captured' },
      { timestamp: '2025-10-24 14:15', handler: 'Supervisor Davis', action: 'Reviewed and approved' }
    ],
    tags: ['lobby', 'reviewed']
  },
  { 
    id: 'ev-3', 
    title: 'Kitchen Fire Alarm - Camera 3', 
    camera: 'CAM-003', 
    time: '14:12', 
    date: '2025-10-23',
    type: 'video', 
    size: '67 MB',
    status: 'archived',
    chainOfCustody: [
      { timestamp: '2025-10-23 14:15', handler: 'Officer Martinez', action: 'Evidence captured' },
      { timestamp: '2025-10-23 15:00', handler: 'Supervisor Davis', action: 'Reviewed' },
      { timestamp: '2025-10-24 09:00', handler: 'Admin', action: 'Archived' }
    ],
    tags: ['kitchen', 'fire-alarm', 'archived']
  }
];

const SecurityOperationsCenter: React.FC = () => {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State
  const [cameras, setCameras] = useState<CameraEntry[]>(initialCameras);
  const [recordings, setRecordings] = useState<Recording[]>(initialRecordings);
  const [evidence, setEvidence] = useState<EvidenceItem[]>(initialEvidence);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All Cameras');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState('live');
  
  // Modal states
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [showCustodyModal, setShowCustodyModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showLiveViewer, setShowLiveViewer] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState<CameraEntry | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(null);
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);
  const [expandedCameras, setExpandedCameras] = useState<CameraEntry[]>([]);
  
  // Form states
  const [cameraForm, setCameraForm] = useState({
    name: '',
    location: '',
    resolution: '1080p',
    fps: '30'
  });
  const [uploadForm, setUploadForm] = useState({
    title: '',
    camera: '',
    tags: '',
    incidentId: ''
  });
  
  // Settings state
  const [settings, setSettings] = useState({
    recordingQuality: '1080p',
    recordingDuration: '24',
    motionSensitivity: '75',
    storageRetention: '30',
    autoDelete: true,
    notifyOnMotion: true,
    notifyOnOffline: true,
    nightVisionAuto: true
  });
  const [settingsForm, setSettingsForm] = useState(settings);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Authentication check
  useEffect(() => {
    const isAdmin = localStorage.getItem('admin_viewcameras_authenticated');
    if (isAdmin) {
      setAuthenticated(true);
    } else {
      navigate('/modules/ViewCamerasAuth');
    }
  }, [navigate]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        // Handle dropdown close if needed
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync settings form when modal opens
  useEffect(() => {
    if (showSettingsModal) {
      setSettingsForm(settings);
    }
  }, [showSettingsModal, settings]);

  // Computed values with useMemo
  const metrics: CameraMetrics = useMemo(() => ({
    total: cameras.length,
    online: cameras.filter(c => c.status === 'online').length,
    offline: cameras.filter(c => c.status === 'offline').length,
    maintenance: cameras.filter(c => c.status === 'maintenance').length,
    recording: cameras.filter(c => c.recording).length,
    avgUptime: '99.2%'
  }), [cameras]);

  const filteredCameras = useMemo(() => {
    return cameras.filter(cam => {
      if (filter === 'All Cameras') return true;
      if (filter === 'Online Only') return cam.status === 'online';
      if (filter === 'Offline Only') return cam.status === 'offline';
      if (filter === 'Maintenance') return cam.status === 'maintenance';
      return true;
    }).filter(cam => {
      const term = search.toLowerCase();
      return (
        cam.name.toLowerCase().includes(term) ||
        cam.location.toLowerCase().includes(term)
      );
    });
  }, [cameras, filter, search]);

  const analyticsData: AnalyticsData = useMemo(() => ({
    motionEvents: 247,
    alertsTriggered: 12,
    averageResponseTime: '2.3s',
    peakActivity: '14:00 - 16:00'
  }), []);

  // Handlers with useCallback
  const handleAddCamera = useCallback(() => {
    setCameraForm({
      name: '',
      location: '',
      resolution: '1080p',
      fps: '30'
    });
    setSelectedCamera(null);
    setShowCameraModal(true);
  }, []);

  const handleSaveCamera = useCallback(async () => {
    if (!cameraForm.name || !cameraForm.location) {
      showError('Please fill in all required fields');
      return;
    }

    let toastId: string | undefined;
    try {
      toastId = showLoading('Saving camera...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (selectedCamera) {
        // Edit existing
        setCameras(prev => prev.map(cam => 
          cam.id === selectedCamera.id 
            ? { ...cam, ...cameraForm, previewType: cam.status }
            : cam
        ));
        if (toastId) {
          dismissLoadingAndShowSuccess(toastId, 'Camera updated successfully');
        }
      } else {
        // Add new
        const newCamera: CameraEntry = {
          id: cameras.length + 1,
          ...cameraForm,
          status: 'online',
          uptime: '100%',
          previewType: 'online',
          recording: false,
          motionDetection: false,
          storage: '0 TB'
        };
        setCameras(prev => [newCamera, ...prev]);
        if (toastId) {
          dismissLoadingAndShowSuccess(toastId, 'Camera added successfully');
        }
      }

      setShowCameraModal(false);
    } catch (error) {
      console.error('Failed to save camera:', error);
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to save camera');
      }
    }
  }, [cameraForm, selectedCamera, cameras.length]);

  const handleEditCamera = useCallback((camera: CameraEntry) => {
    setCameraForm({
      name: camera.name,
      location: camera.location,
      resolution: camera.resolution,
      fps: camera.fps || '30'
    });
    setSelectedCamera(camera);
    setShowCameraModal(true);
  }, []);

  const handleDeleteCamera = useCallback(async (id: number) => {
    const confirmed = window.confirm('Are you sure you want to delete this camera?');
    if (!confirmed) return;

    let toastId: string | undefined;
    try {
      toastId = showLoading('Deleting camera...');
      await new Promise(resolve => setTimeout(resolve, 800));

      setCameras(prev => prev.filter(cam => cam.id !== id));
      
      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Camera deleted successfully');
      }
    } catch (error) {
      console.error('Failed to delete camera:', error);
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to delete camera');
      }
    }
  }, []);

  const handleViewLive = useCallback(async (camera: CameraEntry) => {
    let toastId: string | undefined;
    try {
      toastId = showLoading('Connecting to camera...');
      await new Promise(resolve => setTimeout(resolve, 800));

      // Check if camera is already in expanded view
      if (!expandedCameras.find(c => c.id === camera.id)) {
        setExpandedCameras(prev => [...prev, camera]);
      }
      setShowLiveViewer(true);

      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Connected to live feed');
      }
    } catch (error) {
      console.error('Failed to connect:', error);
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to connect to camera');
      }
    }
  }, [expandedCameras]);

  const handleRemoveFromViewer = useCallback((cameraId: number) => {
    setExpandedCameras(prev => prev.filter(c => c.id !== cameraId));
    if (expandedCameras.length <= 1) {
      setShowLiveViewer(false);
    }
  }, [expandedCameras.length]);

  const handleAddToViewer = useCallback((camera: CameraEntry) => {
    if (!expandedCameras.find(c => c.id === camera.id)) {
      setExpandedCameras(prev => [...prev, camera]);
      setShowLiveViewer(true);
      showSuccess(`Added ${camera.name} to viewer`);
    }
  }, [expandedCameras]);

  const toggleRecording = useCallback(async (id: number) => {
    let toastId: string | undefined;
    try {
      const camera = cameras.find(c => c.id === id);
      const newState = !camera?.recording;
      
      toastId = showLoading(newState ? 'Starting recording...' : 'Stopping recording...');
      await new Promise(resolve => setTimeout(resolve, 800));

      setCameras(prev => prev.map(cam => 
        cam.id === id ? { ...cam, recording: newState } : cam
      ));

      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, newState ? 'Recording started' : 'Recording stopped');
      }
    } catch (error) {
      console.error('Failed to toggle recording:', error);
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to toggle recording');
      }
    }
  }, [cameras]);

  const toggleMotionDetection = useCallback(async (id: number) => {
    let toastId: string | undefined;
    try {
      const camera = cameras.find(c => c.id === id);
      const newState = !camera?.motionDetection;
      
      toastId = showLoading('Updating motion detection...');
      await new Promise(resolve => setTimeout(resolve, 600));

      setCameras(prev => prev.map(cam => 
        cam.id === id ? { ...cam, motionDetection: newState } : cam
      ));

      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, `Motion detection ${newState ? 'enabled' : 'disabled'}`);
      }
    } catch (error) {
      console.error('Failed to toggle motion detection:', error);
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to update motion detection');
      }
    }
  }, [cameras]);

  const handleRefreshCameras = useCallback(async () => {
    let toastId: string | undefined;
    try {
      toastId = showLoading('Refreshing cameras...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // In production, this would fetch latest camera data from API
      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Cameras refreshed');
      }
    } catch (error) {
      console.error('Failed to refresh:', error);
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to refresh cameras');
      }
    }
  }, []);

  const handleViewRecording = useCallback((recording: Recording) => {
    setSelectedRecording(recording);
    showSuccess(`Opening recording: ${recording.cameraName}`);
    // In production, this would open a video player
  }, []);

  const handleDownloadRecording = useCallback(async (recordingId: string) => {
    let toastId: string | undefined;
    try {
      toastId = showLoading('Preparing download...');
      await new Promise(resolve => setTimeout(resolve, 1200));

      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Download started');
      }
    } catch (error) {
      console.error('Failed to download:', error);
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to download recording');
      }
    }
  }, []);

  const handleDeleteRecording = useCallback(async (recordingId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this recording?');
    if (!confirmed) return;

    let toastId: string | undefined;
    try {
      toastId = showLoading('Deleting recording...');
      await new Promise(resolve => setTimeout(resolve, 800));

      setRecordings(prev => prev.filter(rec => rec.id !== recordingId));
      
      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Recording deleted');
      }
    } catch (error) {
      console.error('Failed to delete recording:', error);
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to delete recording');
      }
    }
  }, []);

  const handleUploadEvidence = useCallback(() => {
    setUploadForm({
      title: '',
      camera: '',
      tags: '',
      incidentId: ''
    });
    setShowUploadModal(true);
  }, []);

  const handleSaveEvidence = useCallback(async () => {
    if (!uploadForm.title || !uploadForm.camera) {
      showError('Please fill in required fields');
      return;
    }

    let toastId: string | undefined;
    try {
      toastId = showLoading('Uploading evidence...');
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newEvidence: EvidenceItem = {
        id: `ev-${evidence.length + 1}`,
        title: uploadForm.title,
        camera: uploadForm.camera,
        time: new Date().toLocaleTimeString(),
        date: new Date().toISOString().split('T')[0],
        type: 'video',
        size: '125 MB',
        status: 'pending',
        chainOfCustody: [
          { 
            timestamp: new Date().toLocaleString(), 
            handler: 'Current User', 
            action: 'Evidence uploaded' 
          }
        ],
        tags: uploadForm.tags.split(',').map(t => t.trim()),
        incidentId: uploadForm.incidentId || undefined
      };

      setEvidence(prev => [newEvidence, ...prev]);
      
      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Evidence uploaded successfully');
      }

      setShowUploadModal(false);
    } catch (error) {
      console.error('Failed to upload evidence:', error);
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to upload evidence');
      }
    }
  }, [uploadForm, evidence.length]);

  const handleViewEvidence = useCallback((item: EvidenceItem) => {
    setSelectedEvidence(item);
    setShowEvidenceModal(true);
  }, []);

  const handleDownloadEvidence = useCallback(async (evidenceId: string) => {
    let toastId: string | undefined;
    try {
      toastId = showLoading('Preparing download...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Download started');
      }
    } catch (error) {
      console.error('Failed to download evidence:', error);
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to download evidence');
      }
    }
  }, []);

  const handleChainOfCustody = useCallback((item: EvidenceItem) => {
    setSelectedEvidence(item);
    setShowCustodyModal(true);
  }, []);

  const handleLinkToIncident = useCallback(async (evidenceId: string) => {
    const incidentId = prompt('Enter Incident ID to link:');
    if (!incidentId) return;

    let toastId: string | undefined;
    try {
      toastId = showLoading('Linking to incident...');
      await new Promise(resolve => setTimeout(resolve, 800));

      setEvidence(prev => prev.map(ev => 
        ev.id === evidenceId ? { ...ev, incidentId } : ev
      ));

      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, `Linked to incident ${incidentId}`);
      }
    } catch (error) {
      console.error('Failed to link incident:', error);
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to link to incident');
      }
    }
  }, []);

  const handleExportReport = useCallback(async () => {
    let toastId: string | undefined;
    try {
      toastId = showLoading('Generating report...');
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Report exported successfully');
      }
    } catch (error) {
      console.error('Failed to export report:', error);
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to export report');
      }
    }
  }, []);

  const handleSaveSettings = useCallback(async () => {
    let toastId: string | undefined;
    try {
      toastId = showLoading('Saving settings...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSettings(settingsForm);

      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Settings saved successfully');
      }

      setShowSettingsModal(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to save settings');
      }
    }
  }, [settingsForm]);

  const handleResetSettings = useCallback(() => {
    const defaultSettings = {
      recordingQuality: '1080p',
      recordingDuration: '24',
      motionSensitivity: '75',
      storageRetention: '30',
      autoDelete: true,
      notifyOnMotion: true,
      notifyOnOffline: true,
      nightVisionAuto: true
    };
    setSettingsForm(defaultSettings);
    showSuccess('Settings reset to defaults');
  }, []);

  // Helper functions
  const getStatusBadge = useCallback((status: string) => {
    if (status === 'online') return <Badge variant="default" className="bg-green-100 text-green-800">Online</Badge>;
    if (status === 'offline') return <Badge variant="destructive">Offline</Badge>;
    if (status === 'maintenance') return <Badge variant="warning">Maintenance</Badge>;
    return null;
  }, []);

  const getPreviewPlaceholder = useCallback((type: string, recording?: boolean) => (
    <div className={cn(
      "w-full h-full flex items-center justify-center text-white text-2xl relative",
      type === 'online' && "bg-gradient-to-br from-slate-500 to-slate-600",
      type === 'offline' && "bg-gradient-to-br from-slate-400 to-slate-500",
      type === 'maintenance' && "bg-gradient-to-br from-slate-500 to-slate-600"
    )}>
      <i className="fas fa-video"></i>
      {recording && (
        <div className="absolute top-2 left-2">
          <div className="flex items-center space-x-1 bg-red-600 px-2 py-1 rounded">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-xs font-semibold">REC</span>
          </div>
        </div>
      )}
    </div>
  ), []);

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="backdrop-blur-xl bg-white/90 border-white/30 shadow-2xl max-w-md w-full">
          <CardHeader className="text-center pb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <i className="fas fa-video text-white text-2xl" />
            </div>
            <CardTitle className="text-xl font-bold text-slate-900 mb-2">
              Security Operations Center
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-600 text-center">Please authenticate to access the camera monitoring controls.</p>
            <Button 
              onClick={() => navigate('/modules/ViewCamerasAuth')}
              className="w-full bg-[#2563eb] hover:bg-blue-700 text-white"
            >
              Access Controls (Demo)
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* HEADER - GOLD STANDARD LAYOUT */}
      <div className="w-full backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg relative">
        
        {/* Action Buttons - FAR RIGHT CORNER */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 flex items-center space-x-3">
          <Button
            onClick={handleRefreshCameras}
            variant="outline"
            className="text-slate-600 border-slate-300 hover:bg-slate-50"
          >
            <i className="fas fa-sync-alt mr-2" />
            Refresh
          </Button>
          {activeTab === 'live' && (
            <Button
              onClick={handleAddCamera}
              className="bg-[#2563eb] hover:bg-blue-700 text-white"
            >
              <i className="fas fa-plus mr-2" />
              Add Camera
            </Button>
          )}
        </div>

        {/* Title Section - CENTER */}
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl flex items-center justify-center shadow-lg">
                <i className="fas fa-video text-white text-2xl" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                <i className="fas fa-check text-white text-xs" />
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-slate-900">
                Security Operations Center
              </h1>
              <p className="text-slate-600 font-medium">
                Live camera feeds, evidence management, and security analytics
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Key Metrics - Always Visible */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Cameras */}
          <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-lg">
                  <i className="fas fa-video text-white text-xl" />
                </div>
                <Badge variant="default" className="animate-pulse">
                  Active
                </Badge>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-slate-900">
                  {metrics.total}
                </h3>
                <p className="text-slate-600 text-sm">
                  Total Cameras
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Online Cameras */}
          <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-lg">
                  <i className="fas fa-check-circle text-white text-xl" />
                </div>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Online
                </Badge>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-slate-900">
                  {metrics.online}
                </h3>
                <p className="text-slate-600 text-sm">
                  Online Cameras
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Recording Cameras */}
          <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-lg">
                  <i className="fas fa-record-vinyl text-white text-xl" />
                </div>
                <Badge variant="destructive" className="animate-pulse">
                  Recording
                </Badge>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-slate-900">
                  {metrics.recording}
                </h3>
                <p className="text-slate-600 text-sm">
                  Recording Now
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Average Uptime */}
          <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-lg">
                  <i className="fas fa-clock text-white text-xl" />
                </div>
                <Badge variant="default">
                  Uptime
                </Badge>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-slate-900">
                  {metrics.avgUptime}
                </h3>
                <p className="text-slate-600 text-sm">
                  Average Uptime
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* LIVE VIEW TAB */}
        {activeTab === 'live' && (
          <>
            {/* Controls Section */}
            <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl mb-8">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <i className="fas fa-cog mr-3 text-slate-600" />
                  Camera Controls
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-4">
                  <select 
                    className="backdrop-blur-sm bg-white/60 border border-slate-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={filter} 
                    onChange={e => setFilter(e.target.value)}
                  >
                    {FILTER_OPTIONS.map(option => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                  
                  <input 
                    type="text" 
                    className="backdrop-blur-sm bg-white/60 border border-slate-300 rounded-xl px-4 py-2 text-sm w-64 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Search cameras..." 
                    value={search} 
                    onChange={e => setSearch(e.target.value)} 
                  />
                  
                  <div className="flex backdrop-blur-sm bg-white/60 border border-slate-300 rounded-xl p-1">
                    <button 
                      className={cn(
                        "px-4 py-2 text-sm rounded-lg transition-all",
                        view === 'grid' ? 'bg-[#2563eb] text-white shadow-md' : 'text-slate-600 hover:text-slate-800'
                      )}
                      onClick={() => setView('grid')}
                    >
                      <i className="fas fa-th mr-2" />
                      Grid
                    </button>
                    <button 
                      className={cn(
                        "px-4 py-2 text-sm rounded-lg transition-all",
                        view === 'list' ? 'bg-[#2563eb] text-white shadow-md' : 'text-slate-600 hover:text-slate-800'
                      )}
                      onClick={() => setView('list')}
                    >
                      <i className="fas fa-list mr-2" />
                      List
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Camera Grid */}
            <div className={cn(
              "grid gap-6",
              view === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
            )}>
              {filteredCameras.length === 0 ? (
                <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl col-span-full">
                  <CardContent className="p-12 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-video text-slate-400 text-2xl"></i>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No cameras found</h3>
                    <p className="text-slate-600">Try adjusting your search or filter criteria.</p>
                  </CardContent>
                </Card>
              ) : filteredCameras.map(cam => (
                <Card 
                  key={cam.id} 
                  className="backdrop-blur-sm bg-white/60 border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-slate-900">{cam.name}</h4>
                      {getStatusBadge(cam.status)}
                    </div>
                    
                    <div className="relative h-32 bg-slate-100 rounded-lg overflow-hidden mb-4">
                      {getPreviewPlaceholder(cam.previewType, cam.recording)}
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Location:</span>
                        <span className="font-medium text-slate-900">{cam.location}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Resolution:</span>
                        <span className="font-medium text-slate-900">{cam.resolution}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Uptime:</span>
                        <span className="font-medium text-slate-900">{cam.uptime}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mb-3">
                      <Button 
                        className="flex-1 bg-[#2563eb] hover:bg-blue-700 text-white text-sm"
                        disabled={cam.actionsDisabled}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewLive(cam);
                        }}
                      >
                        <i className="fas fa-play mr-2" />
                        View Live
                      </Button>
                      <Button 
                        variant="outline"
                        className="flex-1 text-slate-600 border-slate-300 hover:bg-slate-50 text-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCamera(cam);
                        }}
                      >
                        <i className="fas fa-cog mr-2" />
                        Edit
                      </Button>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs border-t border-slate-200 pt-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMotionDetection(cam.id);
                        }}
                        disabled={cam.actionsDisabled}
                        className={cn(
                          "flex items-center space-x-1 px-2 py-1 rounded transition-colors",
                          cam.motionDetection ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-500 hover:bg-slate-50'
                        )}
                      >
                        <i className={cn("fas", cam.motionDetection ? "fa-eye" : "fa-eye-slash")} />
                        <span>Motion</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRecording(cam.id);
                        }}
                        disabled={cam.actionsDisabled}
                        className={cn(
                          "flex items-center space-x-1 px-2 py-1 rounded transition-colors",
                          cam.recording ? 'bg-red-100 text-red-900 font-semibold' : 'text-slate-500 hover:bg-slate-50'
                        )}
                      >
                        <i className={cn("fas", cam.recording ? "fa-circle" : "fa-circle-notch")} />
                        <span>Recording</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCamera(cam.id);
                        }}
                        disabled={cam.actionsDisabled}
                        className="text-red-600 hover:text-red-700 px-2 py-1"
                      >
                        <i className="fas fa-trash" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* RECORDINGS TAB */}
        {activeTab === 'recordings' && (
          <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-xl">
                <div className="flex items-center">
                  <i className="fas fa-film mr-3 text-slate-600" />
                  Camera Recordings
                </div>
                <Button
                  onClick={handleExportReport}
                  variant="outline"
                  className="text-slate-600 border-slate-300 hover:bg-slate-50"
                >
                  <i className="fas fa-download mr-2" />
                  Export List
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recordings.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-film text-slate-400 text-2xl"></i>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No recordings available</h3>
                    <p className="text-slate-600">Recordings will appear here once cameras start recording.</p>
                  </div>
                ) : recordings.map(rec => (
                  <Card key={rec.id} className="backdrop-blur-sm bg-white/60 border-white/30 shadow-lg hover:shadow-xl transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="w-16 h-16 bg-slate-200 rounded-lg flex items-center justify-center">
                            <i className="fas fa-video text-slate-600 text-xl" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-900 mb-1">{rec.cameraName}</h4>
                            <div className="flex items-center space-x-4 text-sm text-slate-600">
                              <span><i className="fas fa-calendar mr-1" />{rec.date}</span>
                              <span><i className="fas fa-clock mr-1" />{rec.time}</span>
                              <span><i className="fas fa-hourglass-half mr-1" />{rec.duration}</span>
                              <span><i className="fas fa-hdd mr-1" />{rec.size}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleViewRecording(rec)}
                            className="bg-[#2563eb] hover:bg-blue-700 text-white"
                          >
                            <i className="fas fa-play mr-1" />
                            Play
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadRecording(rec.id)}
                            className="text-slate-600 border-slate-300 hover:bg-slate-50"
                          >
                            <i className="fas fa-download mr-1" />
                            Download
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteRecording(rec.id)}
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            <i className="fas fa-trash" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {recordings.length > 0 && (
                <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">Storage Usage</p>
                      <p className="text-xs text-slate-600">18.9 GB / 500 GB used</p>
                    </div>
                    <Progress value={3.78} className="w-64" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* EVIDENCE MANAGEMENT TAB */}
        {activeTab === 'evidence' && (
          <div className="space-y-6">
            {/* Evidence Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-lg">
                      <i className="fas fa-folder text-white text-xl" />
                    </div>
                    <Badge variant="default">
                      Total
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-slate-900">{evidence.length}</h3>
                    <p className="text-slate-600 text-sm">Evidence Files</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-lg">
                      <i className="fas fa-video text-white text-xl" />
                    </div>
                    <Badge variant="default">
                      Camera
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-slate-900">{evidence.filter(e => e.type === 'video').length}</h3>
                    <p className="text-slate-600 text-sm">CCTV Clips</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-lg">
                      <i className="fas fa-shield-alt text-white text-xl" />
                    </div>
                    <Badge variant="warning">
                      Pending
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-slate-900">{evidence.filter(e => e.status === 'pending').length}</h3>
                    <p className="text-slate-600 text-sm">Pending Review</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Evidence */}
              <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl">
                    <i className="fas fa-camera mr-3 text-slate-600" />
                    Recent Evidence from Cameras
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {evidence.map((item) => (
                      <div key={item.id} className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                              <i className={`fas ${item.type === 'video' ? 'fa-video' : 'fa-image'} text-slate-600`} />
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-900">{item.title}</h4>
                              <p className="text-slate-600 text-sm">{item.camera} • {item.time}</p>
                            </div>
                          </div>
                          <Badge variant={
                            item.status === 'pending' ? 'warning' :
                            item.status === 'reviewed' ? 'default' :
                            'secondary'
                          } className={cn(
                            item.status === 'reviewed' && 'bg-green-100 text-green-800'
                          )}>
                            {item.status}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center text-sm text-slate-500 mt-3">
                          <span>Size: {item.size}</span>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleViewEvidence(item)}
                              className="text-slate-600 border-slate-300 hover:bg-slate-50"
                            >
                              <i className="fas fa-eye mr-1" />
                              View
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDownloadEvidence(item.id)}
                              className="text-slate-600 border-slate-300 hover:bg-slate-50"
                            >
                              <i className="fas fa-download mr-1" />
                              Download
                            </Button>
                          </div>
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
                    <i className="fas fa-bolt mr-3 text-slate-600" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-3">
                    <Button 
                      onClick={handleUploadEvidence}
                      className="bg-[#2563eb] hover:bg-blue-700 text-white"
                    >
                      <i className="fas fa-upload mr-2" />
                      Upload Evidence
                    </Button>
                    <Button 
                      onClick={handleExportReport}
                      variant="outline" 
                      className="text-slate-600 border-slate-300 hover:bg-slate-50"
                    >
                      <i className="fas fa-download mr-2" />
                      Export Report
                    </Button>
                    <Button 
                      onClick={() => {
                        if (evidence.length > 0) {
                          handleLinkToIncident(evidence[0].id);
                        }
                      }}
                      variant="outline" 
                      className="text-slate-600 border-slate-300 hover:bg-slate-50"
                    >
                      <i className="fas fa-link mr-2" />
                      Link to Incident
                    </Button>
                    <Button 
                      onClick={() => {
                        if (evidence.length > 0) {
                          handleChainOfCustody(evidence[0]);
                        }
                      }}
                      variant="outline" 
                      className="text-slate-600 border-slate-300 hover:bg-slate-50"
                    >
                      <i className="fas fa-shield-alt mr-2" />
                      Chain of Custody
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Analytics Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-lg">
                      <i className="fas fa-chart-line text-white text-xl" />
                    </div>
                    <Badge variant="default">Today</Badge>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-slate-900">{analyticsData.motionEvents}</h3>
                    <p className="text-slate-600 text-sm">Motion Events</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-lg">
                      <i className="fas fa-exclamation-triangle text-white text-xl" />
                    </div>
                    <Badge variant="warning">Alerts</Badge>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-slate-900">{analyticsData.alertsTriggered}</h3>
                    <p className="text-slate-600 text-sm">Alerts Triggered</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-lg">
                      <i className="fas fa-tachometer-alt text-white text-xl" />
                    </div>
                    <Badge variant="default" className="bg-green-100 text-green-800">Fast</Badge>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-slate-900">{analyticsData.averageResponseTime}</h3>
                    <p className="text-slate-600 text-sm">Avg Response</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-lg">
                      <i className="fas fa-clock text-white text-xl" />
                    </div>
                    <Badge variant="default">Peak</Badge>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-slate-900">{analyticsData.peakActivity}</h3>
                    <p className="text-slate-600 text-sm">Peak Activity</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Analytics Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl">
                    <i className="fas fa-chart-area mr-3 text-slate-600" />
                    Motion Detection Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-slate-600">AI-powered motion detection insights and activity patterns across all cameras.</p>
                    <div className="h-48 bg-slate-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <i className="fas fa-chart-line text-slate-400 text-4xl mb-2"></i>
                        <p className="text-slate-500 text-sm">Analytics chart placeholder</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-slate-900">87%</p>
                        <p className="text-xs text-slate-600">Detection Accuracy</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-slate-900">1.2s</p>
                        <p className="text-xs text-slate-600">Avg Detection Time</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-slate-900">23</p>
                        <p className="text-xs text-slate-600">False Positives</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl">
                    <i className="fas fa-heatmap mr-3 text-slate-600" />
                    Activity Heatmap
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-slate-600">Visual representation of activity patterns throughout the day.</p>
                    <div className="h-48 bg-slate-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <i className="fas fa-th text-slate-400 text-4xl mb-2"></i>
                        <p className="text-slate-500 text-sm">Heatmap placeholder</p>
                      </div>
                    </div>
                    <Button 
                      onClick={handleExportReport}
                      className="w-full bg-[#2563eb] hover:bg-blue-700 text-white"
                    >
                      <i className="fas fa-download mr-2" />
                      Export Analytics Report
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl">
                    <i className="fas fa-users mr-3 text-slate-600" />
                    Occupancy Tracking
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-slate-600">Real-time and historical occupancy data across monitored areas.</p>
                    <div className="space-y-3">
                      {['Lobby Area', 'Pool Deck', 'Parking Lot'].map((area, index) => (
                        <div key={area} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-slate-900">{area}</span>
                            <span className="text-sm text-slate-600">{[45, 23, 67][index]} people</span>
                          </div>
                          <Progress value={[75, 35, 90][index]} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl">
                    <i className="fas fa-bell mr-3 text-slate-600" />
                    Alert Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-slate-600">Overview of triggered alerts and system notifications.</p>
                    <div className="space-y-3">
                      {[
                        { type: 'Motion Detected', count: 8, color: 'yellow' },
                        { type: 'Camera Offline', count: 2, color: 'red' },
                        { type: 'Maintenance Due', count: 1, color: 'blue' },
                        { type: 'Storage Warning', count: 1, color: 'orange' }
                      ].map((alert) => (
                        <div key={alert.type} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="flex items-center space-x-3">
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center",
                              alert.color === 'yellow' && "bg-yellow-100",
                              alert.color === 'red' && "bg-red-100",
                              alert.color === 'blue' && "bg-blue-100",
                              alert.color === 'orange' && "bg-orange-100"
                            )}>
                              <i className="fas fa-exclamation text-xs" />
                            </div>
                            <span className="font-medium text-slate-900">{alert.type}</span>
                          </div>
                          <Badge variant="outline">{alert.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <i className="fas fa-cog mr-3 text-slate-600" />
                Camera System Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <p className="text-slate-600">Configure system-wide camera settings and preferences.</p>
                <Button 
                  onClick={() => setShowSettingsModal(true)}
                  className="bg-[#2563eb] hover:bg-blue-700 text-white"
                >
                  <i className="fas fa-cog mr-2" />
                  Open Settings Panel
                </Button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <Card className="backdrop-blur-sm bg-white/60 border-white/30 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-lg">Recording Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Default Quality:</span>
                        <span className="font-medium">{settings.recordingQuality}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Recording Duration:</span>
                        <span className="font-medium">{settings.recordingDuration}h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Auto-Delete Old:</span>
                        <Badge variant={settings.autoDelete ? 'default' : 'secondary'} className={settings.autoDelete ? 'bg-green-100 text-green-800' : ''}>
                          {settings.autoDelete ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="backdrop-blur-sm bg-white/60 border-white/30 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-lg">Detection Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Motion Sensitivity:</span>
                        <span className="font-medium">{settings.motionSensitivity}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Motion Alerts:</span>
                        <Badge variant={settings.notifyOnMotion ? 'default' : 'secondary'} className={settings.notifyOnMotion ? 'bg-green-100 text-green-800' : ''}>
                          {settings.notifyOnMotion ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Night Vision:</span>
                        <Badge variant={settings.nightVisionAuto ? 'default' : 'secondary'} className={settings.nightVisionAuto ? 'bg-green-100 text-green-800' : ''}>
                          {settings.nightVisionAuto ? 'Auto' : 'Manual'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="backdrop-blur-sm bg-white/60 border-white/30 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-lg">Storage Management</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Retention Period:</span>
                        <span className="font-medium">{settings.storageRetention} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Current Usage:</span>
                        <span className="font-medium">18.9 GB / 500 GB</span>
                      </div>
                      <Progress value={3.78} className="h-2" />
                    </CardContent>
                  </Card>

                  <Card className="backdrop-blur-sm bg-white/60 border-white/30 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-lg">Notifications</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Motion Alerts:</span>
                        <Badge variant={settings.notifyOnMotion ? 'default' : 'secondary'} className={settings.notifyOnMotion ? 'bg-green-100 text-green-800' : ''}>
                          {settings.notifyOnMotion ? 'ON' : 'OFF'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Offline Alerts:</span>
                        <Badge variant={settings.notifyOnOffline ? 'default' : 'secondary'} className={settings.notifyOnOffline ? 'bg-green-100 text-green-800' : ''}>
                          {settings.notifyOnOffline ? 'ON' : 'OFF'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      </div>

      {/* MODALS */}
      
      {/* Add/Edit Camera Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="backdrop-blur-xl bg-white/95 border-white/30 shadow-2xl max-w-2xl w-full">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200">
              <CardTitle className="text-xl">
                {selectedCamera ? 'Edit Camera' : 'Add New Camera'}
              </CardTitle>
              <Button
                variant="outline"
                onClick={() => setShowCameraModal(false)}
                className="text-slate-600 hover:text-slate-800"
              >
                <i className="fas fa-times"></i>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Camera Name *</label>
                <input
                  type="text"
                  value={cameraForm.name}
                  onChange={(e) => setCameraForm({...cameraForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Lobby Main Entrance"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Location *</label>
                <input
                  type="text"
                  value={cameraForm.location}
                  onChange={(e) => setCameraForm({...cameraForm, location: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Lobby - Main Floor"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Resolution</label>
                  <select
                    value={cameraForm.resolution}
                    onChange={(e) => setCameraForm({...cameraForm, resolution: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option>720p</option>
                    <option>1080p</option>
                    <option>4K</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">FPS</label>
                  <select
                    value={cameraForm.fps}
                    onChange={(e) => setCameraForm({...cameraForm, fps: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option>24</option>
                    <option>30</option>
                    <option>60</option>
                  </select>
                </div>
              </div>
            </CardContent>
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-slate-200 bg-slate-50">
              <Button
                variant="outline"
                onClick={() => setShowCameraModal(false)}
                className="text-slate-600 border-slate-300 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveCamera}
                className="bg-[#2563eb] hover:bg-blue-700 text-white"
              >
                <i className="fas fa-save mr-2" />
                Save Camera
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Upload Evidence Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="backdrop-blur-xl bg-white/95 border-white/30 shadow-2xl max-w-2xl w-full">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200">
              <CardTitle className="text-xl">Upload Evidence</CardTitle>
              <Button
                variant="outline"
                onClick={() => setShowUploadModal(false)}
                className="text-slate-600 hover:text-slate-800"
              >
                <i className="fas fa-times"></i>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Title *</label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({...uploadForm, title: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Pool Area Incident"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Camera ID *</label>
                <input
                  type="text"
                  value={uploadForm.camera}
                  onChange={(e) => setUploadForm({...uploadForm, camera: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., CAM-001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={uploadForm.tags}
                  onChange={(e) => setUploadForm({...uploadForm, tags: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., incident, pool-area, priority"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Incident ID (optional)</label>
                <input
                  type="text"
                  value={uploadForm.incidentId}
                  onChange={(e) => setUploadForm({...uploadForm, incidentId: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., INC-2024-001"
                />
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Note:</strong> In production, this would include file upload functionality with drag-and-drop support.
                </p>
              </div>
            </CardContent>
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-slate-200 bg-slate-50">
              <Button
                variant="outline"
                onClick={() => setShowUploadModal(false)}
                className="text-slate-600 border-slate-300 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEvidence}
                className="bg-[#2563eb] hover:bg-blue-700 text-white"
              >
                <i className="fas fa-upload mr-2" />
                Upload Evidence
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Evidence Details Modal */}
      {showEvidenceModal && selectedEvidence && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="backdrop-blur-xl bg-white/95 border-white/30 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200">
              <CardTitle className="text-xl">Evidence Details</CardTitle>
              <Button
                variant="outline"
                onClick={() => setShowEvidenceModal(false)}
                className="text-slate-600 hover:text-slate-800"
              >
                <i className="fas fa-times"></i>
              </Button>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="h-64 bg-slate-200 rounded-xl overflow-hidden mb-4 flex items-center justify-center">
                    <i className="fas fa-video text-slate-400 text-6xl" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">{selectedEvidence.title}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Camera:</span>
                      <span className="font-medium">{selectedEvidence.camera}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Date:</span>
                      <span className="font-medium">{selectedEvidence.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Time:</span>
                      <span className="font-medium">{selectedEvidence.time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Size:</span>
                      <span className="font-medium">{selectedEvidence.size}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Status:</span>
                      <Badge variant={selectedEvidence.status === 'pending' ? 'warning' : 'default'} className={cn(
                        selectedEvidence.status === 'reviewed' && 'bg-green-100 text-green-800'
                      )}>
                        {selectedEvidence.status}
                      </Badge>
                    </div>
                    {selectedEvidence.incidentId && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Linked Incident:</span>
                        <span className="font-medium">{selectedEvidence.incidentId}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">Tags</h4>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {selectedEvidence.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">{tag}</Badge>
                    ))}
                  </div>

                  <h4 className="font-semibold text-slate-900 mb-3">Chain of Custody</h4>
                  <div className="space-y-3">
                    {selectedEvidence.chainOfCustody.map((entry, index) => (
                      <div key={index} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
                            <i className="fas fa-user text-slate-600 text-xs" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">{entry.action}</p>
                            <p className="text-xs text-slate-600">By: {entry.handler}</p>
                            <p className="text-xs text-slate-500">{entry.timestamp}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-slate-200 bg-slate-50">
              <Button
                variant="outline"
                onClick={() => handleDownloadEvidence(selectedEvidence.id)}
                className="text-slate-600 border-slate-300 hover:bg-slate-50"
              >
                <i className="fas fa-download mr-2" />
                Download
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowEvidenceModal(false);
                  handleChainOfCustody(selectedEvidence);
                }}
                className="text-slate-600 border-slate-300 hover:bg-slate-50"
              >
                <i className="fas fa-shield-alt mr-2" />
                Update Custody
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Chain of Custody Modal */}
      {showCustodyModal && selectedEvidence && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="backdrop-blur-xl bg-white/95 border-white/30 shadow-2xl max-w-2xl w-full">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200">
              <CardTitle className="text-xl">Chain of Custody - {selectedEvidence.title}</CardTitle>
              <Button
                variant="outline"
                onClick={() => setShowCustodyModal(false)}
                className="text-slate-600 hover:text-slate-800"
              >
                <i className="fas fa-times"></i>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-4">
                {selectedEvidence.chainOfCustody.map((entry, index) => (
                  <div key={index} className="flex items-start space-x-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-slate-700 font-semibold text-sm">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{entry.action}</p>
                      <p className="text-sm text-slate-600">Handler: {entry.handler}</p>
                      <p className="text-xs text-slate-500 mt-1">{entry.timestamp}</p>
                    </div>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <i className="fas fa-check mr-1" />
                      Verified
                    </Badge>
                  </div>
                ))}
              </div>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mt-6">
                <p className="text-sm text-blue-900">
                  <strong>Chain of Custody:</strong> Complete audit trail showing all handlers and actions taken with this evidence.
                </p>
              </div>
            </CardContent>
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-slate-200 bg-slate-50">
              <Button
                variant="outline"
                onClick={() => setShowCustodyModal(false)}
                className="text-slate-600 border-slate-300 hover:bg-slate-50"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  showSuccess('Custody log exported');
                  setShowCustodyModal(false);
                }}
                className="bg-[#2563eb] hover:bg-blue-700 text-white"
              >
                <i className="fas fa-download mr-2" />
                Export Log
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Live Camera Viewer Modal - Multi-Camera Expandable View */}
      {showLiveViewer && expandedCameras.length > 0 && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full h-full max-w-[95vw] max-h-[95vh] flex flex-col">
            {/* Viewer Header */}
            <div className="flex items-center justify-between mb-4 bg-slate-800/50 backdrop-blur-sm p-4 rounded-lg border border-slate-700">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-[#2563eb] rounded-lg flex items-center justify-center">
                  <i className="fas fa-video text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Live Camera Viewer</h3>
                  <p className="text-slate-300 text-sm">{expandedCameras.length} camera{expandedCameras.length > 1 ? 's' : ''} active</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {/* Available cameras dropdown */}
                <select 
                  className="bg-slate-700 text-white border border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => {
                    const cameraId = parseInt(e.target.value);
                    if (cameraId) {
                      const camera = cameras.find(c => c.id === cameraId);
                      if (camera) {
                        handleAddToViewer(camera);
                      }
                    }
                    e.target.value = '';
                  }}
                  value=""
                >
                  <option value="">+ Add Camera to View</option>
                  {cameras.filter(c => c.status === 'online' && !expandedCameras.find(ec => ec.id === c.id)).map(cam => (
                    <option key={cam.id} value={cam.id}>{cam.name}</option>
                  ))}
                </select>

                <Button
                  onClick={() => {
                    setShowLiveViewer(false);
                    setExpandedCameras([]);
                  }}
                  className="bg-[#2563eb] hover:bg-blue-700 text-white"
                >
                  <i className="fas fa-times mr-2" />
                  Close Viewer
                </Button>
              </div>
            </div>

            {/* Camera Grid - Dynamic Layout */}
            <div className={cn(
              "grid gap-4 flex-1 overflow-auto",
              expandedCameras.length === 1 && "grid-cols-1",
              expandedCameras.length === 2 && "grid-cols-2",
              expandedCameras.length === 3 && "grid-cols-2",
              expandedCameras.length === 4 && "grid-cols-2 grid-rows-2",
              expandedCameras.length >= 5 && expandedCameras.length <= 6 && "grid-cols-3 grid-rows-2",
              expandedCameras.length >= 7 && "grid-cols-3"
            )}>
              {expandedCameras.map((cam) => (
                <div 
                  key={cam.id}
                  className="relative group bg-slate-900 rounded-xl overflow-hidden border-2 border-slate-700 hover:border-blue-500 transition-all shadow-2xl"
                >
                  {/* Camera Feed Area */}
                  <div className="aspect-video bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center relative">
                    {/* Simulated Live Feed */}
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
                    
                    <div className="relative z-10 text-center">
                      <i className="fas fa-video text-slate-500 text-6xl mb-4"></i>
                      <p className="text-slate-400 text-sm">Live Feed Simulation</p>
                      <p className="text-slate-500 text-xs mt-1">Production: Hardware Integration Required</p>
                    </div>

                    {/* Recording Indicator */}
                    {cam.recording && (
                      <div className="absolute top-4 left-4 z-20">
                        <div className="flex items-center space-x-2 bg-red-600/90 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                          <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                          <span className="text-white text-xs font-semibold">RECORDING</span>
                        </div>
                      </div>
                    )}

                    {/* Motion Detection Indicator */}
                    {cam.motionDetection && (
                      <div className="absolute top-4 right-4 z-20">
                        <div className="bg-blue-600/90 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                          <i className="fas fa-eye text-white text-xs mr-1"></i>
                          <span className="text-white text-xs font-semibold">MOTION</span>
                        </div>
                      </div>
                    )}

                    {/* Timestamp Overlay */}
                    <div className="absolute bottom-4 left-4 z-20">
                      <div className="bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                        <span className="text-white text-xs font-mono">
                          {new Date().toLocaleString('en-US', { 
                            month: '2-digit', 
                            day: '2-digit', 
                            year: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit', 
                            second: '2-digit' 
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Camera Info Overlay */}
                    <div className="absolute bottom-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                        <div className="text-white text-xs space-y-0.5">
                          <div><span className="text-slate-400">FPS:</span> {cam.fps || '30'}</div>
                          <div><span className="text-slate-400">Res:</span> {cam.resolution}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Camera Controls Overlay */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="text-white font-semibold">{cam.name}</h4>
                        <p className="text-slate-300 text-xs">{cam.location}</p>
                      </div>
                      <Badge variant="default" className="bg-green-500 text-white">
                        <i className="fas fa-circle text-xs mr-1 animate-pulse"></i>
                        LIVE
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => toggleRecording(cam.id)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                            cam.recording 
                              ? "bg-red-600 text-white hover:bg-red-700" 
                              : "bg-slate-700 text-white hover:bg-slate-600"
                          )}
                        >
                          <i className={cn("fas mr-1", cam.recording ? "fa-stop" : "fa-circle")}></i>
                          {cam.recording ? 'Stop' : 'Record'}
                        </button>
                        
                        <button 
                          onClick={() => toggleMotionDetection(cam.id)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                            cam.motionDetection 
                              ? "bg-blue-600 text-white hover:bg-blue-700" 
                              : "bg-slate-700 text-white hover:bg-slate-600"
                          )}
                        >
                          <i className={cn("fas mr-1", cam.motionDetection ? "fa-eye" : "fa-eye-slash")}></i>
                          Motion
                        </button>

                        <button 
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700 text-white hover:bg-slate-600 transition-colors"
                          onClick={() => showSuccess('Snapshot captured')}
                        >
                          <i className="fas fa-camera mr-1"></i>
                          Snapshot
                        </button>
                      </div>

                      <button
                        onClick={() => handleRemoveFromViewer(cam.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600/80 text-white hover:bg-red-700 transition-colors"
                      >
                        <i className="fas fa-times mr-1"></i>
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Viewer Footer */}
            <div className="mt-4 bg-slate-800/50 backdrop-blur-sm p-3 rounded-lg border border-slate-700">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center space-x-6">
                  <div><span className="text-slate-400">Total Cameras:</span> <span className="text-white font-semibold">{expandedCameras.length}</span></div>
                  <div><span className="text-slate-400">Recording:</span> <span className="text-white font-semibold">{expandedCameras.filter(c => c.recording).length}</span></div>
                  <div><span className="text-slate-400">Motion Detection:</span> <span className="text-white font-semibold">{expandedCameras.filter(c => c.motionDetection).length}</span></div>
                </div>
                <div className="text-slate-400">
                  <i className="fas fa-info-circle mr-1"></i>
                  Click camera to expand controls • Add up to 9 cameras simultaneously
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="backdrop-blur-xl bg-white/95 border-white/30 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200 sticky top-0 bg-white z-10">
              <CardTitle className="text-xl">Camera System Settings</CardTitle>
              <Button
                variant="outline"
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-600 hover:text-slate-800"
              >
                <i className="fas fa-times"></i>
              </Button>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Recording Settings */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Recording Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Default Recording Quality</label>
                    <select
                      value={settingsForm.recordingQuality}
                      onChange={(e) => setSettingsForm({...settingsForm, recordingQuality: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option>720p</option>
                      <option>1080p</option>
                      <option>4K</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Recording Duration (hours)</label>
                    <select
                      value={settingsForm.recordingDuration}
                      onChange={(e) => setSettingsForm({...settingsForm, recordingDuration: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option>12</option>
                      <option>24</option>
                      <option>48</option>
                      <option>72</option>
                    </select>
                  </div>

                  <label className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <span className="text-slate-700">Auto-delete old recordings</span>
                    <input
                      type="checkbox"
                      checked={settingsForm.autoDelete}
                      onChange={(e) => setSettingsForm({...settingsForm, autoDelete: e.target.checked})}
                      className="w-5 h-5 text-blue-600 focus:ring-blue-500 rounded"
                    />
                  </label>
                </div>
              </div>

              {/* Motion Detection */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Motion Detection</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Motion Sensitivity (%)</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settingsForm.motionSensitivity}
                      onChange={(e) => setSettingsForm({...settingsForm, motionSensitivity: e.target.value})}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>Low (0%)</span>
                      <span className="font-medium text-slate-900">{settingsForm.motionSensitivity}%</span>
                      <span>High (100%)</span>
                    </div>
                  </div>

                  <label className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <span className="text-slate-700">Notify on motion detection</span>
                    <input
                      type="checkbox"
                      checked={settingsForm.notifyOnMotion}
                      onChange={(e) => setSettingsForm({...settingsForm, notifyOnMotion: e.target.checked})}
                      className="w-5 h-5 text-blue-600 focus:ring-blue-500 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <span className="text-slate-700">Auto night vision</span>
                    <input
                      type="checkbox"
                      checked={settingsForm.nightVisionAuto}
                      onChange={(e) => setSettingsForm({...settingsForm, nightVisionAuto: e.target.checked})}
                      className="w-5 h-5 text-blue-600 focus:ring-blue-500 rounded"
                    />
                  </label>
                </div>
              </div>

              {/* Storage */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Storage Management</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Retention Period (days)</label>
                    <select
                      value={settingsForm.storageRetention}
                      onChange={(e) => setSettingsForm({...settingsForm, storageRetention: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option>7</option>
                      <option>14</option>
                      <option>30</option>
                      <option>60</option>
                      <option>90</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Notifications</h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <span className="text-slate-700">Notify when camera goes offline</span>
                    <input
                      type="checkbox"
                      checked={settingsForm.notifyOnOffline}
                      onChange={(e) => setSettingsForm({...settingsForm, notifyOnOffline: e.target.checked})}
                      className="w-5 h-5 text-blue-600 focus:ring-blue-500 rounded"
                    />
                  </label>
                </div>
              </div>
            </CardContent>
            <div className="flex items-center justify-between p-6 border-t border-slate-200 bg-slate-50">
              <Button
                variant="outline"
                onClick={handleResetSettings}
                className="text-slate-600 border-slate-300 hover:bg-slate-50"
              >
                Reset to Defaults
              </Button>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowSettingsModal(false)}
                  className="text-slate-600 border-slate-300 hover:bg-slate-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveSettings}
                  className="bg-[#2563eb] hover:bg-blue-700 text-white"
                >
                  <i className="fas fa-save mr-2" />
                  Save Settings
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

    </div>
  );
};

export default SecurityOperationsCenter;
