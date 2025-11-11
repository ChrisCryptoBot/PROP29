import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageCircle, Send, Paperclip, Mic, MicOff, Camera, MapPin, 
  AlertTriangle, Users, Settings, Search, Phone, Video, Shield,
  Clock, CheckCircle, Circle, Upload, Download, Eye, EyeOff,
  Zap, Bell, BellOff, Hash, Lock, Radio, Headphones, Image,
  FileText, Archive, Star, MoreVertical, UserCheck, Volume2, X,
  Edit, Trash2, Copy
} from 'lucide-react';
import { showSuccess, showLoading, dismissLoadingAndShowSuccess, dismissLoadingAndShowError } from '../../utils/toast';

// Type definitions
interface Message {
  id: number;
  sender: string;
  content: string;
  timestamp: Date;
  type: string;
  priority: string;
  reactions?: { emoji: string; users: string[]; count: number }[];
  encrypted: boolean;
  location?: { area: string; coords: number[] };
  incident?: string;
  file?: any;
  action?: string;
}

interface Channel {
  id: string;
  name: string;
  type: string;
  unread: number;
  priority: string;
  description: string;
  members: number;
  encrypted: boolean;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  status: string;
  location: string | null;
  avatar: any;
  lastSeen: string;
  isOnline: boolean;
}

interface QuickAction {
  id: string;
  label: string;
  icon: any;
  color: string;
}

interface MessagesState {
  [key: string]: Message[];
}

const TeamChat = () => {
  const navigate = useNavigate();
  const [activeChannel, setActiveChannel] = useState('general');
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showChannels, setShowChannels] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [userStatus, setUserStatus] = useState('available');
  const [showSettings, setShowSettings] = useState(false);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock data - in production this would come from WebSocket/API
  const [channels, setChannels] = useState<Channel[]>([
    {
      id: 'general',
      name: 'General Security',
      type: 'public',
      unread: 0,
      priority: 'normal',
      description: 'Main security team communication',
      members: 12,
      encrypted: true
    },
    {
      id: 'incidents',
      name: 'Active Incidents',
      type: 'priority',
      unread: 3,
      priority: 'high',
      description: 'Real-time incident coordination',
      members: 8,
      encrypted: true
    },
    {
      id: 'patrol',
      name: 'Patrol Updates',
      type: 'location',
      unread: 1,
      priority: 'normal',
      description: 'Patrol routes and check-ins',
      members: 6,
      encrypted: true
    },
    {
      id: 'shift-handover',
      name: 'Shift Handover',
      type: 'archive',
      unread: 0,
      priority: 'normal',
      description: 'End-of-shift reports and handovers',
      members: 15,
      encrypted: true
    },
    {
      id: 'maintenance',
      name: 'Maintenance Alerts',
      type: 'notifications',
      unread: 2,
      priority: 'medium',
      description: 'Equipment and facility issues',
      members: 5,
      encrypted: false
    }
  ]);

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: 'johnson',
      name: 'Officer Johnson',
      role: 'Security Lead',
      status: 'on-duty',
      location: 'East Wing',
      avatar: null,
      lastSeen: 'now',
      isOnline: true
    },
    {
      id: 'davis',
      name: 'Officer Davis',
      role: 'Patrol Officer',
      status: 'patrol',
      location: 'Pool Area',
      avatar: null,
      lastSeen: '2 min ago',
      isOnline: true
    },
    {
      id: 'wilson',
      name: 'Sarah Wilson',
      role: 'Security Supervisor',
      status: 'available',
      location: 'Command Center',
      avatar: null,
      lastSeen: 'now',
      isOnline: true
    },
    {
      id: 'chen',
      name: 'Officer Chen',
      role: 'Night Security',
      status: 'off-duty',
      location: null,
      avatar: null,
      lastSeen: '1 hour ago',
      isOnline: false
    },
    {
      id: 'rodriguez',
      name: 'Maria Rodriguez',
      role: 'Cybersecurity',
      status: 'busy',
      location: 'Remote',
      avatar: null,
      lastSeen: 'now',
      isOnline: true
    }
  ]);

  const [messages, setMessages] = useState<MessagesState>({
    'general': [
      {
        id: 1,
        sender: 'johnson',
        content: 'Good evening team. Starting evening shift briefing.',
        timestamp: new Date(Date.now() - 300000),
        type: 'text',
        priority: 'normal',
        reactions: [{ emoji: '👍', users: ['davis', 'wilson'], count: 2 }],
        encrypted: true
      },
      {
        id: 2,
        sender: 'wilson',
        content: 'All systems operational. Pool area patrol scheduled for 19:30.',
        timestamp: new Date(Date.now() - 240000),
        type: 'text',
        priority: 'normal',
        encrypted: true
      },
      {
        id: 3,
        sender: 'davis',
        content: 'Copy that. Currently completing lobby rounds.',
        timestamp: new Date(Date.now() - 180000),
        type: 'text',
        priority: 'normal',
        location: { area: 'Lobby', coords: [150, 200] },
        encrypted: true
      }
    ],
    'incidents': [
      {
        id: 4,
        sender: 'wilson',
        content: 'ALERT: Unauthorized access attempt detected - East Wing Floor 3',
        timestamp: new Date(Date.now() - 120000),
        type: 'alert',
        priority: 'high',
        incident: 'INC-2025-001',
        encrypted: true
      },
      {
        id: 5,
        sender: 'johnson',
        content: 'Responding to East Wing. ETA 2 minutes.',
        timestamp: new Date(Date.now() - 90000),
        type: 'response',
        priority: 'high',
        encrypted: true
      },
      {
        id: 6,
        sender: 'johnson',
        content: 'False alarm confirmed. Door sensor malfunction. Maintenance notified.',
        timestamp: new Date(Date.now() - 30000),
        type: 'resolution',
        priority: 'normal',
        encrypted: true
      }
    ],
    'patrol': [
      {
        id: 7,
        sender: 'davis',
        content: 'Patrol checkpoint 1 completed - All clear',
        timestamp: new Date(Date.now() - 600000),
        type: 'checkpoint',
        priority: 'normal',
        location: { area: 'Main Lobby', coords: [100, 150] },
        encrypted: true
      }
    ],
    'shift-handover': [],
    'maintenance': [
      {
        id: 8,
        sender: 'system',
        content: 'HVAC alert: Temperature sensor offline in East Wing',
        timestamp: new Date(Date.now() - 900000),
        type: 'system',
        priority: 'medium',
        encrypted: false
      }
    ]
  });

  const [quickActions] = useState<QuickAction[]>([
    { id: 'emergency', label: 'Emergency Alert', icon: AlertTriangle, color: 'red' },
    { id: 'backup', label: 'Request Backup', icon: Users, color: 'orange' },
    { id: 'incident', label: 'Report Incident', icon: FileText, color: 'blue' },
    { id: 'patrol', label: 'Patrol Update', icon: MapPin, color: 'green' },
    { id: 'maintenance', label: 'Maintenance Request', icon: Settings, color: 'purple' },
    { id: 'medical', label: 'Medical Assistance', icon: Phone, color: 'pink' }
  ]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeChannel]);

  useEffect(() => {
    // Simulate real-time message updates
    const interval = setInterval(() => {
      if (Math.random() > 0.8) { // 20% chance every 5 seconds
        addSystemMessage();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addSystemMessage = () => {
    const systemMessages = [
      'AI patrol optimization updated - new routes suggested',
      'Security system scan completed - all zones secure',
      'Guest panic button test successful - Pool Area',
      'Biometric access log updated - 15 new entries'
    ];
    
    const randomMessage = systemMessages[Math.floor(Math.random() * systemMessages.length)];
    const newMessage = {
      id: Date.now(),
      sender: 'system',
      content: randomMessage,
      timestamp: new Date(),
      type: 'system',
      priority: 'low',
      encrypted: false
    };

    setMessages(prev => ({
      ...prev,
      [activeChannel]: [...(prev[activeChannel] || []), newMessage]
    }));
  };

  const sendMessage = useCallback(async () => {
    if (message.trim() === '' && !selectedFile) {
      showSuccess('Please type a message or attach a file');
      return;
    }

    let toastId: string | undefined;
    try {
      toastId = showLoading('Sending message...');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const newMessage = {
        id: Date.now(),
        sender: 'current-user',
        content: message,
        timestamp: new Date(),
        type: selectedFile ? 'file' : 'text',
        priority: 'normal',
        file: selectedFile,
        encrypted: channels.find(c => c.id === activeChannel)?.encrypted || false
      };

      setMessages(prev => ({
        ...prev,
        [activeChannel]: [...(prev[activeChannel] || []), newMessage]
      }));

      setMessage('');
      setSelectedFile(null);
      setError(null);

      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Message sent successfully');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setError('Failed to send message');
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to send message');
      }
    }
  }, [message, selectedFile, activeChannel, channels]);

  const sendQuickAction = useCallback(async (action: QuickAction) => {
    let toastId: string | undefined;
    try {
      toastId = showLoading(`Sending ${action.label}...`);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const quickMessage = {
        id: Date.now(),
        sender: 'current-user',
        content: `🚨 ${action.label} - Immediate attention required`,
        timestamp: new Date(),
        type: 'quick-action',
        priority: action.id === 'emergency' ? 'critical' : 'high',
        action: action.id,
        encrypted: true
      };

      setMessages(prev => ({
        ...prev,
        [activeChannel]: [...(prev[activeChannel] || []), quickMessage]
      }));

      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, `${action.label} sent to team`);
      }
    } catch (error) {
      console.error('Failed to send quick action:', error);
      if (toastId) {
        dismissLoadingAndShowError(toastId, `Failed to send ${action.label}`);
      }
    }
  }, [activeChannel]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return '#22c55e';
      case 'busy': return '#ef4444';
      case 'patrol': return '#3b82f6';
      case 'on-duty': return '#f59e0b';
      case 'off-duty': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'priority': return <AlertTriangle size={16} className="text-red-500" />;
      case 'location': return <MapPin size={16} className="text-blue-500" />;
      case 'archive': return <Archive size={16} className="text-purple-500" />;
      case 'notifications': return <Bell size={16} className="text-yellow-500" />;
      default: return <Hash size={16} className="text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-l-red-600 bg-red-50';
      case 'high': return 'border-l-orange-500 bg-orange-50';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50';
      case 'low': return 'border-l-blue-500 bg-blue-50';
      default: return 'border-l-gray-300 bg-white';
    }
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'alert': return <AlertTriangle size={16} className="text-red-500" />;
      case 'response': return <Radio size={16} className="text-blue-500" />;
      case 'resolution': return <CheckCircle size={16} className="text-green-500" />;
      case 'checkpoint': return <MapPin size={16} className="text-purple-500" />;
      case 'system': return <Settings size={16} className="text-gray-500" />;
      case 'file': return <FileText size={16} className="text-blue-500" />;
      case 'quick-action': return <Zap size={16} className="text-orange-500" />;
      default: return null;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) return 'now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return timestamp.toLocaleDateString();
  };

  const currentChannelMessages = messages[activeChannel] || [];
  const currentChannel = channels.find(c => c.id === activeChannel);

  // Button Handlers (declared after currentChannel to avoid reference errors)
  const handlePhoneCall = useCallback(() => {
    showSuccess(`Initiating voice call with ${currentChannel?.name}...`);
    // In production, this would initiate a VoIP call
  }, [currentChannel]);

  const handleVideoCall = useCallback(() => {
    showSuccess(`Initiating video call with ${currentChannel?.name}...`);
    // In production, this would initiate a video call
  }, [currentChannel]);

  const handleMoreOptions = useCallback(() => {
    showSuccess('Opening channel options...');
    // In production, this would open a channel settings modal
  }, []);

  const handleFileUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showSuccess('File too large. Maximum size is 10MB');
      return;
    }

    let toastId: string | undefined;
    try {
      toastId = showLoading('Uploading file...');
      
      // Simulate file upload
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSelectedFile({
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file)
      });

      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'File attached successfully');
      }
    } catch (error) {
      console.error('Failed to upload file:', error);
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to upload file');
      }
    }
  }, []);

  const handleCameraCapture = useCallback(() => {
    showSuccess('Opening camera...');
    // In production, this would open camera capture
  }, []);

  const handleFileDownload = useCallback((file: any) => {
    showSuccess(`Downloading ${file.name}...`);
    // In production, this would download the file
  }, []);

  const handleBackToDashboard = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  const handleToggleSettings = useCallback(() => {
    setShowSettings(prev => !prev);
  }, []);

  const handleNewMessage = useCallback(() => {
    setShowNewMessage(true);
    setSelectedRecipients([]);
  }, []);

  const handleToggleRecipient = useCallback((memberId: string) => {
    setSelectedRecipients(prev => 
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  }, []);

  const handleSendDirectMessage = useCallback(async () => {
    if (selectedRecipients.length === 0) {
      showSuccess('Please select at least one recipient');
      return;
    }

    let toastId: string | undefined;
    try {
      toastId = showLoading('Sending direct message...');
      await new Promise(resolve => setTimeout(resolve, 800));

      const recipientNames = selectedRecipients
        .map(id => teamMembers.find(m => m.id === id)?.name)
        .filter(Boolean)
        .join(', ');

      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, `Message sent to ${recipientNames}`);
      }
      
      setShowNewMessage(false);
      setSelectedRecipients([]);
    } catch (error) {
      console.error('Failed to send direct message:', error);
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to send message');
      }
    }
  }, [selectedRecipients, teamMembers]);

  // Filter messages based on search term
  const filteredMessages = searchTerm.trim() === '' 
    ? currentChannelMessages
    : currentChannelMessages.filter(msg => 
        msg.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (msg.sender !== 'system' && teamMembers.find(m => m.id === msg.sender)?.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`${showChannels ? 'w-80' : 'w-16'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageCircle className="text-blue-600" size={24} />
              </div>
              {showChannels && (
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">Security Comm</h1>
                  <p className="text-sm text-gray-500">Encrypted • {teamMembers.filter(m => m.isOnline).length} online</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowChannels(!showChannels)}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            >
              <Eye size={18} />
            </button>
          </div>
        </div>

        {showChannels && (
          <>
            {/* User Status */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    CU
                  </div>
                  <div 
                    className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white"
                    style={{ backgroundColor: getStatusColor(userStatus) }}
                  ></div>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Current User</p>
                  <select 
                    value={userStatus}
                    onChange={(e) => setUserStatus(e.target.value)}
                    className="text-sm text-gray-600 bg-transparent border-none focus:ring-0 p-0"
                  >
                    <option value="available">Available</option>
                    <option value="busy">Busy</option>
                    <option value="patrol">On Patrol</option>
                    <option value="on-duty">On Duty</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Search & New Message */}
            <div className="p-4 space-y-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                onClick={handleNewMessage}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <MessageCircle size={16} />
                <span className="font-medium">New Message</span>
              </button>
            </div>

            {/* Channels */}
            <div className="flex-1 overflow-y-auto px-4">
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Channels</h3>
                <div className="space-y-1">
                  {channels.map(channel => (
                    <button
                      key={channel.id}
                      onClick={() => setActiveChannel(channel.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                        activeChannel === channel.id 
                          ? 'bg-blue-100 text-blue-900' 
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        {getChannelIcon(channel.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium truncate">{channel.name}</span>
                            {channel.encrypted && <Lock size={12} className="text-green-500" />}
                          </div>
                          <p className="text-xs text-gray-500 truncate">{channel.description}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        {channel.unread > 0 && (
                          <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                            {channel.unread}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">{channel.members}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Team Members */}
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Team Members ({teamMembers.filter(m => m.isOnline).length} online)
                </h3>
                <div className="space-y-2">
                  {teamMembers.map(member => (
                    <div 
                      key={member.id} 
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedRecipients([member.id]);
                        setShowNewMessage(true);
                      }}
                      title={`Send message to ${member.name}`}
                    >
                      <div className="relative">
                        <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div 
                          className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white"
                          style={{ backgroundColor: getStatusColor(member.status) }}
                        ></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{member.name}</p>
                        <div className="flex items-center space-x-2">
                          <p className="text-xs text-gray-500 capitalize">{member.status}</p>
                          {member.location && (
                            <span className="text-xs text-blue-600">• {member.location}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getChannelIcon(currentChannel?.type || 'public')}
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{currentChannel?.name}</h2>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>{currentChannel?.members} members</span>
                  {currentChannel?.encrypted && (
                    <span className="flex items-center space-x-1 text-green-600">
                      <Lock size={12} />
                      <span>Encrypted</span>
                    </span>
                  )}
                  <span className="flex items-center space-x-1">
                    <Circle className="w-2 h-2 fill-green-500 text-green-500" />
                    <span>Live</span>
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={handlePhoneCall}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                title="Voice Call"
              >
                <Phone size={18} />
              </button>
              <button 
                onClick={handleVideoCall}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                title="Video Call"
              >
                <Video size={18} />
              </button>
              <button 
                onClick={handleToggleSettings}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                title="Settings"
              >
                <Settings size={18} />
              </button>
              <button 
                onClick={handleMoreOptions}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                title="More Options"
              >
                <MoreVertical size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {filteredMessages.length === 0 && searchTerm.trim() !== '' ? (
            <div className="text-center py-8">
              <Search size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-2">No messages found</p>
              <p className="text-sm text-gray-400">Try a different search term</p>
            </div>
          ) : currentChannelMessages.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-2">No messages in this channel yet</p>
              <p className="text-sm text-gray-400">Start the conversation with your security team</p>
            </div>
          ) : (
            filteredMessages.map(msg => (
              <div 
                key={msg.id} 
                className={`flex space-x-3 ${msg.sender === 'current-user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender !== 'current-user' && (
                  <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {msg.sender === 'system' ? 'SYS' : 
                     teamMembers.find(m => m.id === msg.sender)?.name.split(' ').map(n => n[0]).join('') || 'U'}
                  </div>
                )}
                
                <div className={`max-w-lg ${msg.sender === 'current-user' ? 'order-first' : ''}`}>
                  <div className={`p-3 rounded-lg border-l-4 ${getPriorityColor(msg.priority)} ${
                    msg.sender === 'current-user' 
                      ? 'bg-blue-600 text-white border-l-blue-800' 
                      : ''
                  }`}>
                    {msg.sender !== 'current-user' && (
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {msg.sender === 'system' ? 'System' : 
                           teamMembers.find(m => m.id === msg.sender)?.name || 'Unknown User'}
                        </span>
                        {getMessageTypeIcon(msg.type)}
                        {msg.encrypted && <Lock size={12} className="text-green-500" />}
                      </div>
                    )}
                    
                    <p className={`text-sm ${msg.sender === 'current-user' ? 'text-white' : 'text-gray-800'}`}>
                      {msg.content}
                    </p>
                    
                    {msg.location && (
                      <div className="mt-2 p-2 bg-blue-50 rounded border">
                        <div className="flex items-center space-x-1 text-xs text-blue-700">
                          <MapPin size={12} />
                          <span>Location: {msg.location.area}</span>
                        </div>
                      </div>
                    )}
                    
                    {msg.incident && (
                      <div className="mt-2 p-2 bg-red-50 rounded border">
                        <div className="flex items-center space-x-1 text-xs text-red-700">
                          <AlertTriangle size={12} />
                          <span>Incident: {msg.incident}</span>
                        </div>
                      </div>
                    )}
                    
                    {msg.file && (
                      <div className="mt-2 p-2 bg-gray-50 rounded border">
                        <div className="flex items-center space-x-2 text-xs text-gray-600">
                          <FileText size={12} />
                          <span>{msg.file.name}</span>
                          <button 
                            onClick={() => handleFileDownload(msg.file)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Download File"
                          >
                            <Download size={12} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500">{formatTimestamp(msg.timestamp)}</span>
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className="flex items-center space-x-1">
                        {msg.reactions.map((reaction, idx) => (
                          <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                            {reaction.emoji} {reaction.count}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {msg.sender === 'current-user' && (
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    CU
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex items-center space-x-2 mb-4 overflow-x-auto">
            {quickActions.map(action => (
              <button
                key={action.id}
                onClick={() => sendQuickAction(action)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
                  ${action.id === 'emergency' ? 'bg-red-600 hover:bg-red-700 text-white' :
                    'bg-[#2563eb] hover:bg-blue-700 text-white'}`}
              >
                <action.icon size={16} />
                <span>{action.label}</span>
              </button>
            ))}
          </div>
          
          {/* Message Input */}
          <div className="flex items-center space-x-3">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,application/pdf,.doc,.docx,.txt"
            />
            <div className="flex-1 flex items-center space-x-2 bg-gray-100 rounded-lg p-2">
              <button 
                onClick={handleFileUpload}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-200"
                title="Attach File"
              >
                <Paperclip size={18} />
              </button>
              <button 
                onClick={handleCameraCapture}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-200"
                title="Capture Photo"
              >
                <Camera size={18} />
              </button>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder={selectedFile ? `File attached: ${selectedFile.name}` : "Type your message..."}
                className="flex-1 bg-transparent border-none focus:ring-0 text-gray-900 placeholder-gray-500"
              />
              <button
                onClick={() => setIsRecording(!isRecording)}
                className={`p-2 rounded-lg transition-colors ${
                  isRecording 
                    ? 'bg-red-500 text-white' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                }`}
                title={isRecording ? 'Stop Recording' : 'Voice Message'}
              >
                {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
            </div>
            <button
              onClick={sendMessage}
              disabled={message.trim() === '' && !selectedFile}
              className="p-3 bg-[#2563eb] text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Send Message"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* New Message Modal */}
      {showNewMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <MessageCircle className="text-blue-600" size={24} />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">New Direct Message</h2>
                  <p className="text-sm text-gray-500">Select team members to message</p>
                </div>
              </div>
              <button
                onClick={() => setShowNewMessage(false)}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Selected Recipients */}
              {selectedRecipients.length > 0 && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 mb-2">
                    Selected Recipients ({selectedRecipients.length}):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedRecipients.map(id => {
                      const member = teamMembers.find(m => m.id === id);
                      return member ? (
                        <span
                          key={id}
                          className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded-full text-sm"
                        >
                          <span>{member.name}</span>
                          <button
                            onClick={() => handleToggleRecipient(id)}
                            className="hover:bg-blue-700 rounded-full p-0.5"
                          >
                            <X size={14} />
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Team Members List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">Select Recipients</h3>
                  <button
                    onClick={() => {
                      if (selectedRecipients.length === teamMembers.length) {
                        setSelectedRecipients([]);
                      } else {
                        setSelectedRecipients(teamMembers.map(m => m.id));
                      }
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {selectedRecipients.length === teamMembers.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                {teamMembers.map(member => (
                  <label
                    key={member.id}
                    className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedRecipients.includes(member.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedRecipients.includes(member.id)}
                      onChange={() => handleToggleRecipient(member.id)}
                      className="w-5 h-5 text-blue-600 focus:ring-blue-500 rounded"
                    />
                    <div className="relative">
                      <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center text-white font-semibold">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div
                        className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white"
                        style={{ backgroundColor: getStatusColor(member.status) }}
                      ></div>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{member.name}</p>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span className="capitalize">{member.status}</span>
                        {member.location && (
                          <>
                            <span>•</span>
                            <span className="text-blue-600">{member.location}</span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">{member.role}</p>
                    </div>
                    {!member.isOnline && (
                      <span className="text-xs text-gray-400">Offline</span>
                    )}
                  </label>
                ))}
              </div>

              {/* Message Input */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message (Optional)
                </label>
                <textarea
                  placeholder="Type your message here..."
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  defaultValue=""
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowNewMessage(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendDirectMessage}
                disabled={selectedRecipients.length === 0}
                className="px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span className="flex items-center space-x-2">
                  <Send size={16} />
                  <span>Send Message</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <Settings className="text-gray-700" size={24} />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Chat Settings</h2>
                  <p className="text-sm text-gray-500">Manage your communication preferences</p>
                </div>
              </div>
              <button
                onClick={handleToggleSettings}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Notifications Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <Bell size={20} className="text-gray-600" />
                  <span>Notifications</span>
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <span className="text-gray-700">Desktop Notifications</span>
                    <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600 focus:ring-blue-500 rounded" />
                  </label>
                  <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <span className="text-gray-700">Sound Alerts</span>
                    <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600 focus:ring-blue-500 rounded" />
                  </label>
                  <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <span className="text-gray-700">Emergency Alert Sound</span>
                    <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600 focus:ring-blue-500 rounded" />
                  </label>
                </div>
              </div>

              {/* Privacy Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <Lock size={20} className="text-gray-600" />
                  <span>Privacy & Security</span>
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <span className="text-gray-700">End-to-End Encryption</span>
                    <input type="checkbox" defaultChecked disabled className="w-5 h-5 text-green-600 focus:ring-green-500 rounded" />
                  </label>
                  <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <span className="text-gray-700">Show Online Status</span>
                    <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600 focus:ring-blue-500 rounded" />
                  </label>
                  <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <span className="text-gray-700">Share Location</span>
                    <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600 focus:ring-blue-500 rounded" />
                  </label>
                </div>
              </div>

              {/* Message Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <MessageCircle size={20} className="text-gray-600" />
                  <span>Message Settings</span>
                </h3>
                <div className="space-y-3">
                  <div className="p-3 border border-gray-200 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Message Auto-Delete</label>
                    <select className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
                      <option value="never">Never</option>
                      <option value="24h">24 Hours</option>
                      <option value="7d">7 Days</option>
                      <option value="30d">30 Days</option>
                    </select>
                  </div>
                  <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <span className="text-gray-700">Show Typing Indicators</span>
                    <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600 focus:ring-blue-500 rounded" />
                  </label>
                  <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <span className="text-gray-700">Read Receipts</span>
                    <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600 focus:ring-blue-500 rounded" />
                  </label>
                </div>
              </div>

              {/* Channel Management */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <Hash size={20} className="text-gray-600" />
                  <span>Channel Management</span>
                </h3>
                <div className="space-y-3">
                  <button 
                    onClick={() => showSuccess('Channel creation coming soon...')}
                    className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
                  >
                    + Create New Channel
                  </button>
                  <p className="text-sm text-gray-500 px-3">
                    Manage your communication channels and set channel-specific preferences
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={handleToggleSettings}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  showSuccess('Settings saved successfully');
                  handleToggleSettings();
                }}
                className="px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamChat; 
