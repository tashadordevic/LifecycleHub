// API wrapper that works with both Electron IPC and HTTP
const isElectron = () => {
  return typeof window !== 'undefined' && window.electronAPI !== undefined;
};

class LocalAPI {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getToken() {
    return this.token || localStorage.getItem('token');
  }

  // Auth
  async post(endpoint, data) {
    const token = this.getToken();
    
    if (isElectron()) {
      const api = window.electronAPI;
      
      switch (endpoint) {
        case '/auth/register':
          return { data: await api.register(data) };
        case '/auth/login':
          return { data: await api.login(data) };
        case '/customers':
          return { data: await api.createCustomer({ token, data }) };
        case '/lifecycle-stages':
          return { data: await api.createStage({ token, data }) };
        case '/integrations':
          return { data: await api.createIntegration({ token, data }) };
        case '/signals':
          return { data: await api.createSignal({ token, data }) };
        case '/insights':
          return { data: await api.createInsight({ token, data }) };
        case '/seed-demo-data':
          return { data: await api.seedDemoData({ token }) };
        default:
          if (endpoint.includes('/integrations/') && endpoint.includes('/sync')) {
            const id = endpoint.split('/')[2];
            return { data: await api.syncIntegration({ token, id }) };
          }
          if (endpoint.includes('/integrations/') && endpoint.includes('/test')) {
            const id = endpoint.split('/')[2];
            return { data: await api.testIntegration({ token, id }) };
          }
          throw new Error(`Unknown POST endpoint: ${endpoint}`);
      }
    }
    
    // HTTP fallback (for development)
    const axios = (await import('axios')).default;
    const baseURL = process.env.REACT_APP_BACKEND_URL + '/api';
    return axios.post(baseURL + endpoint, data, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
  }

  async get(endpoint) {
    const token = this.getToken();
    
    if (isElectron()) {
      const api = window.electronAPI;
      
      if (endpoint === '/auth/me') {
        return { data: await api.getMe({ token }) };
      }
      if (endpoint === '/dashboard/stats') {
        return { data: await api.getDashboardStats({ token }) };
      }
      if (endpoint === '/dashboard/at-risk') {
        return { data: await api.getAtRiskCustomers({ token }) };
      }
      if (endpoint === '/dashboard/recent-activity') {
        return { data: await api.getRecentActivity({ token }) };
      }
      if (endpoint.startsWith('/customers/') && endpoint.includes('/signals')) {
        const id = endpoint.split('/')[2];
        return { data: await api.getCustomerSignals({ token, id }) };
      }
      if (endpoint.startsWith('/customers/') && endpoint.includes('/insights')) {
        const id = endpoint.split('/')[2];
        return { data: await api.getCustomerInsights({ token, id }) };
      }
      if (endpoint.startsWith('/customers/') && endpoint.includes('/recommendations')) {
        const id = endpoint.split('/')[2];
        return { data: await api.getCustomerRecommendations({ token, id }) };
      }
      if (endpoint.startsWith('/customers/') && endpoint.split('/').length === 3) {
        const id = endpoint.split('/')[2];
        return { data: await api.getCustomer({ token, id }) };
      }
      if (endpoint.startsWith('/customers')) {
        const params = new URLSearchParams(endpoint.split('?')[1] || '');
        return { data: await api.getCustomers({ 
          token, 
          search: params.get('search'),
          stage: params.get('stage'),
          segment: params.get('segment'),
          health_min: params.get('health_min') ? parseInt(params.get('health_min')) : undefined,
          health_max: params.get('health_max') ? parseInt(params.get('health_max')) : undefined
        }) };
      }
      if (endpoint === '/lifecycle-stages') {
        return { data: await api.getStages({ token }) };
      }
      if (endpoint === '/integrations') {
        return { data: await api.getIntegrations({ token }) };
      }
      if (endpoint.startsWith('/reports/summary')) {
        const params = new URLSearchParams(endpoint.split('?')[1] || '');
        return { data: await api.getReportSummary({ token, segment: params.get('segment') }) };
      }
      if (endpoint === '/team') {
        // Return local user as team
        const user = await api.getMe({ token });
        return { data: { team: { id: 'local', name: 'My Workspace', billing_plan: 'local' }, members: [user] } };
      }
      
      throw new Error(`Unknown GET endpoint: ${endpoint}`);
    }
    
    // HTTP fallback
    const axios = (await import('axios')).default;
    const baseURL = process.env.REACT_APP_BACKEND_URL + '/api';
    return axios.get(baseURL + endpoint, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
  }

  async put(endpoint, data) {
    const token = this.getToken();
    
    if (isElectron()) {
      const api = window.electronAPI;
      
      if (endpoint.startsWith('/customers/')) {
        const id = endpoint.split('/')[2];
        return { data: await api.updateCustomer({ token, id, data }) };
      }
      if (endpoint.startsWith('/lifecycle-stages/')) {
        const id = endpoint.split('/')[2];
        return { data: await api.updateStage({ token, id, data }) };
      }
      if (endpoint.includes('/recommendations/') && endpoint.includes('/status')) {
        const parts = endpoint.split('/');
        const id = parts[2];
        const status = endpoint.split('status=')[1];
        return { data: await api.updateRecommendationStatus({ token, id, status }) };
      }
      if (endpoint.includes('/integrations/') && endpoint.includes('/key')) {
        const id = endpoint.split('/')[2];
        return { data: await api.updateIntegrationKey({ token, id, api_key: data.api_key }) };
      }
      
      throw new Error(`Unknown PUT endpoint: ${endpoint}`);
    }
    
    // HTTP fallback
    const axios = (await import('axios')).default;
    const baseURL = process.env.REACT_APP_BACKEND_URL + '/api';
    return axios.put(baseURL + endpoint, data, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
  }

  async delete(endpoint) {
    const token = this.getToken();
    
    if (isElectron()) {
      const api = window.electronAPI;
      
      if (endpoint.startsWith('/customers/')) {
        const id = endpoint.split('/')[2];
        return { data: await api.deleteCustomer({ token, id }) };
      }
      if (endpoint.startsWith('/lifecycle-stages/')) {
        const id = endpoint.split('/')[2];
        return { data: await api.deleteStage({ token, id }) };
      }
      if (endpoint.startsWith('/integrations/')) {
        const id = endpoint.split('/')[2];
        return { data: await api.deleteIntegration({ token, id }) };
      }
      
      throw new Error(`Unknown DELETE endpoint: ${endpoint}`);
    }
    
    // HTTP fallback
    const axios = (await import('axios')).default;
    const baseURL = process.env.REACT_APP_BACKEND_URL + '/api';
    return axios.delete(baseURL + endpoint, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
  }
}

export const api = new LocalAPI();

// Set token from storage on load
const storedToken = localStorage.getItem('token');
if (storedToken) {
  api.setToken(storedToken);
}
