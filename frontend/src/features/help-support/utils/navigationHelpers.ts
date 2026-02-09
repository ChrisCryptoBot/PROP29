/**
 * Cross-module navigation helpers for the IT chatbot.
 * Provides programmatic navigation to help users navigate between modules.
 */

import { useNavigate } from 'react-router-dom';

export interface ModuleNavigation {
  module: string;
  path: string;
  tab?: string;
  description: string;
}

/**
 * Module navigation map for cross-module navigation guidance
 */
export const MODULE_NAVIGATION_MAP: Record<string, ModuleNavigation> = {
  'incident log': {
    module: 'Incident Log',
    path: '/modules/event-log',
    description: 'Report and manage security incidents'
  },
  'patrol': {
    module: 'Patrol Command Center',
    path: '/modules/patrol',
    description: 'Manage patrols, routes, and officers'
  },
  'access control': {
    module: 'Access Control',
    path: '/modules/access-control',
    description: 'Manage doors, badges, and lockdown'
  },
  'soc': {
    module: 'Security Operations Center',
    path: '/modules/security-operations-center',
    description: 'View cameras and recordings'
  },
  'guest safety': {
    module: 'Guest Safety',
    path: '/modules/guest-safety',
    description: 'Manage guest-related incidents and evacuation'
  },
  'visitor security': {
    module: 'Visitor Security',
    path: '/modules/visitors',
    description: 'Register visitors and manage check-in/check-out'
  },
  'banned individuals': {
    module: 'Banned Individuals',
    path: '/modules/banned-individuals',
    description: 'Manage watchlist and detections'
  },
  'iot': {
    module: 'IoT Environmental',
    path: '/modules/iot-monitoring',
    description: 'Monitor environmental sensors and alerts'
  },
  'digital handover': {
    module: 'Digital Handover',
    path: '/modules/digital-handover',
    description: 'Manage shift handovers and checklists'
  },
  'property items': {
    module: 'Property Items',
    path: '/modules/property-items',
    description: 'Lost & found and packages'
  },
  'system admin': {
    module: 'System Administration',
    path: '/modules/admin',
    description: 'Manage users, roles, and system settings'
  },
  'help support': {
    module: 'Help & Support',
    path: '/help',
    description: 'Get help, submit tickets, and access resources'
  },
  'profile settings': {
    module: 'Profile Settings',
    path: '/profile',
    description: 'Manage your profile and account settings'
  },
  'smart lockers': {
    module: 'Smart Lockers',
    path: '/modules/smart-lockers',
    description: 'Manage locker assignments and releases'
  },
  'smart parking': {
    module: 'Smart Parking',
    path: '/modules/smart-parking',
    description: 'Manage parking spaces and occupancy'
  },
  'team chat': {
    module: 'Team Chat',
    path: '/modules/team-chat',
    description: 'Team communication and messaging'
  },
  'account settings': {
    module: 'Account Settings',
    path: '/settings',
    description: 'Team settings, integrations, and permissions'
  },
  'notifications': {
    module: 'Notifications',
    path: '/notifications',
    description: 'View and manage notifications'
  }
};

/**
 * Get navigation path for a module name
 */
export function getModulePath(moduleName: string): string | null {
  const normalized = moduleName.toLowerCase().trim();
  for (const [key, nav] of Object.entries(MODULE_NAVIGATION_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return nav.path;
    }
  }
  return null;
}

/**
 * Get module navigation info
 */
export function getModuleNavigation(moduleName: string): ModuleNavigation | null {
  const normalized = moduleName.toLowerCase().trim();
  for (const [key, nav] of Object.entries(MODULE_NAVIGATION_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return nav;
    }
  }
  return null;
}

/**
 * Hook to navigate to a module programmatically
 * Can be used by the chatbot to guide users to specific modules
 */
export function useModuleNavigation() {
  const navigate = useNavigate();

  const navigateToModule = (moduleName: string, tab?: string) => {
    const nav = getModuleNavigation(moduleName);
    if (nav) {
      let path = nav.path;
      if (tab) {
        // Add tab as query param or hash (depending on routing structure)
        path += `?tab=${tab}`;
      }
      navigate(path);
      return true;
    }
    return false;
  };

  return { navigateToModule, getModuleNavigation, getModulePath };
}

/**
 * Format navigation instruction for chatbot responses
 */
export function formatNavigationInstruction(moduleName: string, tab?: string): string {
  const nav = getModuleNavigation(moduleName);
  if (!nav) {
    return `Go to ${moduleName} from the sidebar menu.`;
  }
  
  let instruction = `Go to ${nav.module}`;
  if (tab) {
    instruction += ` → ${tab} tab`;
  }
  instruction += ` (${nav.description}).`;
  
  return instruction;
}
