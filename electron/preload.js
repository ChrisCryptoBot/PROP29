const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Backend communication
  getBackendStatus: () => ipcRenderer.invoke('get-backend-status'),
  startBackend: () => ipcRenderer.invoke('start-backend'),
  
  // Menu events
  onMenuNewIncident: (callback) => ipcRenderer.on('menu-new-incident', callback),
  onMenuNewPatrol: (callback) => ipcRenderer.on('menu-new-patrol', callback),
  onMenuSettings: (callback) => ipcRenderer.on('menu-settings', callback),
  onMenuEmergencyAlert: (callback) => ipcRenderer.on('menu-emergency-alert', callback),
  onMenuLockdown: (callback) => ipcRenderer.on('menu-lockdown', callback),
  onMenuSecurityDashboard: (callback) => ipcRenderer.on('menu-security-dashboard', callback),
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
  
  // System info
  getPlatform: () => process.platform,
  getVersion: () => process.versions.electron
}); 