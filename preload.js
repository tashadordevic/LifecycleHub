const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Auth
  register: (data) => ipcRenderer.invoke('auth:register', data),
  login: (data) => ipcRenderer.invoke('auth:login', data),
  getMe: (data) => ipcRenderer.invoke('auth:me', data),
  
  // Dashboard
  getDashboardStats: (data) => ipcRenderer.invoke('dashboard:stats', data),
  getAtRiskCustomers: (data) => ipcRenderer.invoke('dashboard:at-risk', data),
  getRecentActivity: (data) => ipcRenderer.invoke('dashboard:recent-activity', data),
  
  // Customers
  getCustomers: (data) => ipcRenderer.invoke('customers:list', data),
  getCustomer: (data) => ipcRenderer.invoke('customers:get', data),
  createCustomer: (data) => ipcRenderer.invoke('customers:create', data),
  updateCustomer: (data) => ipcRenderer.invoke('customers:update', data),
  deleteCustomer: (data) => ipcRenderer.invoke('customers:delete', data),
  getCustomerSignals: (data) => ipcRenderer.invoke('customers:signals', data),
  getCustomerInsights: (data) => ipcRenderer.invoke('customers:insights', data),
  getCustomerRecommendations: (data) => ipcRenderer.invoke('customers:recommendations', data),
  
  // Lifecycle Stages
  getStages: (data) => ipcRenderer.invoke('stages:list', data),
  createStage: (data) => ipcRenderer.invoke('stages:create', data),
  updateStage: (data) => ipcRenderer.invoke('stages:update', data),
  deleteStage: (data) => ipcRenderer.invoke('stages:delete', data),
  
  // Integrations
  getIntegrations: (data) => ipcRenderer.invoke('integrations:list', data),
  createIntegration: (data) => ipcRenderer.invoke('integrations:create', data),
  updateIntegrationKey: (data) => ipcRenderer.invoke('integrations:update-key', data),
  deleteIntegration: (data) => ipcRenderer.invoke('integrations:delete', data),
  syncIntegration: (data) => ipcRenderer.invoke('integrations:sync', data),
  testIntegration: (data) => ipcRenderer.invoke('integrations:test', data),
  
  // Signals
  createSignal: (data) => ipcRenderer.invoke('signals:create', data),
  
  // Insights
  createInsight: (data) => ipcRenderer.invoke('insights:create', data),
  
  // Recommendations
  updateRecommendationStatus: (data) => ipcRenderer.invoke('recommendations:update-status', data),
  
  // Reports
  getReportSummary: (data) => ipcRenderer.invoke('reports:summary', data),
  
  // Seed data
  seedDemoData: (data) => ipcRenderer.invoke('seed-demo-data', data),
  
  // Database
  backupDatabase: () => ipcRenderer.invoke('database:backup'),
  restoreDatabase: () => ipcRenderer.invoke('database:restore'),

  // Settings
  getSetting: (data) => ipcRenderer.invoke('settings:get', data),
  setSetting: (data) => ipcRenderer.invoke('settings:set', data),
});
