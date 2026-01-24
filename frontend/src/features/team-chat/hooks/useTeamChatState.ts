import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { showSuccess, showError, showLoading, dismissLoadingAndShowSuccess, dismissLoadingAndShowError } from '../../../utils/toast';
import { logger } from '../../../services/logger';
import {
    Message,
    Channel,
    TeamMember,
    QuickAction,
    MessagesState,
    UserStatus,
} from '../types/team-chat.types';

export function useTeamChatState() {
    const navigate = useNavigate();
    const [activeChannel, setActiveChannel] = useState('general');
    const [message, setMessage] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [showChannels, setShowChannels] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFile, setSelectedFile] = useState<any>(null);
    const [userStatus, setUserStatus] = useState<UserStatus>('available');
    const [showSettings, setShowSettings] = useState(false);
    const [showNewMessage, setShowNewMessage] = useState(false);
    const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // State initialization (Empty for Production)
    const [channels] = useState<Channel[]>([
        { id: 'general', name: 'General Security', type: 'public', unread: 0, priority: 'normal', description: 'Main security team communication', members: 0, encrypted: true }
    ]);

    const [teamMembers] = useState<TeamMember[]>([]);

    const [messages, setMessages] = useState<MessagesState>({
        'general': [
            { id: 0, sender: 'system', content: 'SECURE COMMUNICATION CHANNEL ESTABLISHED.', timestamp: new Date(), type: 'system', priority: 'low', encrypted: true }
        ]
    });

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    const sendMessage = useCallback(async () => {
        if (message.trim() === '' && !selectedFile) {
            showSuccess('Please type a message or attach a file');
            return;
        }

        let toastId: string | undefined;
        try {
            toastId = showLoading('Sending message...');
            await new Promise(resolve => setTimeout(resolve, 500));

            const newMessage: Message = {
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
        } catch (err) {
            logger.error('Failed to send message', err instanceof Error ? err : new Error(String(err)), { module: 'TeamChat', action: 'sendMessage' });
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
            await new Promise(resolve => setTimeout(resolve, 500));

            const quickMessage: Message = {
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
        } catch (err) {
            logger.error('Failed to send quick action', err instanceof Error ? err : new Error(String(err)), { module: 'TeamChat', action: 'sendQuickAction', actionType: action.id });
            if (toastId) {
                dismissLoadingAndShowError(toastId, `Failed to send ${action.label}`);
            }
        }
    }, [activeChannel]);

    const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            showSuccess('File too large. Maximum size is 10MB');
            return;
        }

        let toastId: string | undefined;
        try {
            toastId = showLoading('Uploading file...');
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
        } catch (err) {
            logger.error('Failed to upload file', err instanceof Error ? err : new Error(String(err)), { module: 'TeamChat', action: 'handleFileSelect' });
            if (toastId) {
                dismissLoadingAndShowError(toastId, 'Failed to upload file');
            }
        }
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
        } catch (err) {
            logger.error('Failed to send direct message', err instanceof Error ? err : new Error(String(err)), { module: 'TeamChat', action: 'handleSendDirectMessage' });
            if (toastId) {
                dismissLoadingAndShowError(toastId, 'Failed to send message');
            }
        }
    }, [selectedRecipients, teamMembers]);

    // UI Helpers
    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'critical': return 'border-l-red-600 bg-red-50';
            case 'high': return 'border-l-orange-500 bg-orange-50';
            case 'medium': return 'border-l-yellow-500 bg-yellow-50';
            case 'low': return 'border-l-blue-500 bg-blue-50';
            default: return 'border-l-gray-300 bg-white';
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

    const handlePhoneCall = () => showSuccess('Initiating voice call...');
    const handleVideoCall = () => showSuccess('Initiating video call...');
    const handleToggleSettings = () => setShowSettings(prev => !prev);
    const handleMoreOptions = () => showSuccess('Opening options...');
    const handleFileUpload = () => fileInputRef.current?.click();
    const handleFileDownload = (file: any) => showSuccess(`Downloading ${file.name}...`);
    const handleCameraCapture = () => showSuccess('Opening camera...');

    const currentChannel = channels.find(c => c.id === activeChannel);
    const currentChannelMessages = messages[activeChannel] || [];

    // Filter messages based on search term
    const filteredMessages = searchTerm.trim() === ''
        ? currentChannelMessages
        : currentChannelMessages.filter(msg =>
            msg.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (msg.sender !== 'system' && teamMembers.find(m => m.id === msg.sender)?.name.toLowerCase().includes(searchTerm.toLowerCase()))
        );

    return {
        activeChannel,
        setActiveChannel,
        message,
        setMessage,
        isRecording,
        setIsRecording,
        showChannels,
        setShowChannels,
        searchTerm,
        setSearchTerm,
        selectedFile,
        setSelectedFile,
        userStatus,
        setUserStatus,
        showSettings,
        setShowSettings,
        showNewMessage,
        setShowNewMessage,
        selectedRecipients,
        setSelectedRecipients,
        messages,
        channels,
        teamMembers,
        messagesEndRef,
        fileInputRef,
        sendMessage,
        sendQuickAction,
        handleFileSelect,
        handleToggleRecipient,
        handleSendDirectMessage,
        scrollToBottom,
        getPriorityColor,
        formatTimestamp,
        handlePhoneCall,
        handleVideoCall,
        handleToggleSettings,
        handleMoreOptions,
        handleFileUpload,
        handleFileDownload,
        handleCameraCapture,
        currentChannel,
        currentChannelMessages,
        filteredMessages
    };
}
