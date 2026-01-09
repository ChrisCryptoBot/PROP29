// modalConfig.js - Central Modal Configuration - FIXED VERSION
export const MODAL_TYPES = {
  // Event & Security Modals
  ACTIVE_INCIDENTS: 'ACTIVE_INCIDENTS',
  GUEST_SAFETY_ALERTS: 'GUEST_SAFETY_ALERTS',
  
  // Patrol Modals (INTEGRATED)
  PATROL_COMMAND_CENTER: 'PATROL_COMMAND_CENTER',
  
  // Module Modals
  ACCESS_CONTROL: 'ACCESS_CONTROL',
  EVENT_LOG: 'EVENT_LOG',
  LOST_FOUND: 'LOST_FOUND',
  PACKAGES: 'PACKAGES',
  ANALYTICS: 'ANALYTICS',
  
  // Configuration Modals
  SYSTEM_SETTINGS: 'SYSTEM_SETTINGS',
  
  // Metrics Modals - FIXED AND ADDED MISSING ONES
  GUARDS_ON_DUTY: 'GUARDS_ON_DUTY',
  AI_OPTIMIZED_PATROLS: 'AI_OPTIMIZED_PATROLS',
  PATROL_EFFICIENCY: 'PATROL_EFFICIENCY',
  THREATS_BLOCKED: 'THREATS_BLOCKED',
  ACCESS_GRANTED: 'ACCESS_GRANTED'
};

export const modalConfig = {
  [MODAL_TYPES.ACTIVE_INCIDENTS]: {
    title: 'Active Security Incidents',
    component: 'ActiveIncidentsModal',
    size: 'extra-large',
    tabs: ['Current Incidents', 'Response Teams', 'Timeline'],
    dataEndpoint: '/api/incidents/active'
  },
  
  [MODAL_TYPES.PATROL_COMMAND_CENTER]: {
    title: 'Patrol Command Center',
    component: 'PatrolCommandCenterModal',
    size: 'extra-large',
    tabs: ['Management', 'Live Tracking', 'AI Optimization', 'Analytics'],
    dataEndpoint: '/api/patrols/command-center'
  },

  // NEW MODAL CONFIGURATIONS FOR MISSING METRICS
  [MODAL_TYPES.GUARDS_ON_DUTY]: {
    title: 'Guards on Duty Management',
    component: 'GuardsOnDutyModal',
    size: 'extra-large',
    tabs: ['Active Guards', 'Schedules', 'Deployment', 'Performance'],
    dataEndpoint: '/api/guards/on-duty'
  },

  [MODAL_TYPES.AI_OPTIMIZED_PATROLS]: {
    title: 'AI-Optimized Patrol Analytics',
    component: 'AIOptimizedPatrolsModal',
    size: 'extra-large',
    tabs: ['Optimization Overview', 'Route Analysis', 'Performance Metrics', 'AI Insights'],
    dataEndpoint: '/api/patrols/ai-optimization'
  },

  [MODAL_TYPES.PATROL_EFFICIENCY]: {
    title: 'Patrol Efficiency Dashboard',
    component: 'PatrolEfficiencyModal',
    size: 'extra-large',
    tabs: ['Efficiency Metrics', 'Performance Analysis', 'Improvement Areas', 'Historical Trends'],
    dataEndpoint: '/api/patrols/efficiency'
  },


  [MODAL_TYPES.ACCESS_GRANTED]: {
    title: 'Access Control Events',
    component: 'AccessGrantedModal',
    size: 'large',
    tabs: ['Recent Access', 'User Activity', 'Security Events'],
    dataEndpoint: '/api/access-control/events'
  },
  
  [MODAL_TYPES.SYSTEM_SETTINGS]: {
    title: 'System Settings',
    component: 'SystemSettingsModal',
    size: 'extra-large',
    tabs: ['General', 'Security', 'Advanced'],
    dataEndpoint: '/api/system/settings'
  }
}; 