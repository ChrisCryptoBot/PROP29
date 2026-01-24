export interface Message {
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
    file?: {
        name: string;
        size: number;
        type: string;
        url: string;
    };
    action?: string;
}

export interface Channel {
    id: string;
    name: string;
    type: string;
    unread: number;
    priority: string;
    description: string;
    members: number;
    encrypted: boolean;
}

export interface TeamMember {
    id: string;
    name: string;
    role: string;
    status: string;
    location: string | null;
    avatar: string | null;
    lastSeen: string;
    isOnline: boolean;
}

export interface QuickAction {
    id: string;
    label: string;
    iconClass: string;
    color: string;
}

export interface MessagesState {
    [key: string]: Message[];
}

export type UserStatus = 'available' | 'busy' | 'patrol' | 'on-duty' | 'off-duty';
export type MessageType = 'text' | 'alert' | 'response' | 'resolution' | 'checkpoint' | 'system' | 'file' | 'quick-action';
export type PriorityType = 'critical' | 'high' | 'medium' | 'low' | 'normal';
export type ChannelType = 'public' | 'priority' | 'location' | 'archive' | 'notifications';
