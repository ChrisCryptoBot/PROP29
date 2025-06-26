import React from 'react';
import { 
  Users, 
  Shield, 
  Building, 
  Settings, 
  Lock, 
  FileText,
  Activity
} from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const tabs: Tab[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Activity,
    description: 'System overview and metrics'
  },
  {
    id: 'users',
    label: 'Users',
    icon: Users,
    description: 'User management and roles'
  },
  {
    id: 'roles',
    label: 'Roles',
    icon: Shield,
    description: 'Role and permission management'
  },
  {
    id: 'properties',
    label: 'Properties',
    icon: Building,
    description: 'Property management and settings'
  },
  {
    id: 'system',
    label: 'System',
    icon: Settings,
    description: 'System configuration and settings'
  },
  {
    id: 'security',
    label: 'Security',
    icon: Lock,
    description: 'Security settings and compliance'
  },
  {
    id: 'audit',
    label: 'Audit Log',
    icon: FileText,
    description: 'System audit trail and logs'
  }
];

interface AdminTabsProps {
  current: string;
  onTabChange: (tab: string) => void;
  className?: string;
}

export default function AdminTabs({ current, onTabChange, className = '' }: AdminTabsProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Administration</h2>
        <p className="text-sm text-gray-600 mt-1">Manage users, roles, properties, and system settings</p>
      </div>
      
      <nav className="flex space-x-1 px-6 py-2" aria-label="Admin navigation">
        {tabs.map((tab) => {
          const isActive = current === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex items-center space-x-2 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200
                ${isActive 
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-transparent'
                }
              `}
              title={tab.description}
              aria-current={isActive ? 'page' : undefined}
            >
              <tab.icon className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
} 