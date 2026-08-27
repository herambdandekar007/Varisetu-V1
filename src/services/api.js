import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://api.varisetu.example/v1',
  timeout: 8000,
});

export const crowdApi = { getForecast: () => api.get('/crowd/forecast'), getZones: () => api.get('/crowd/zones') };
export const resourceApi = { getInventory: () => api.get('/resources'), getAlerts: () => api.get('/resources/alerts') };
export const emergencyApi = { getIncidents: () => api.get('/emergencies'), createSos: (payload) => api.post('/emergencies/sos', payload) };
