import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('splityaar_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Auth ────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateMe: (data) => api.put('/auth/me', data),
};

// ─── Trips ───────────────────────────────────────────────────────────────────

export const tripApi = {
  create: (data) => api.post('/trips', data),
  get: (code) => api.get(`/trips/${code}`),
  addMember: (code, data) => api.post(`/trips/${code}/members`, data),
  updateMember: (code, id, data) => api.put(`/trips/${code}/members/${id}`, data),
  createExpense: (code, data) => api.post(`/trips/${code}/expenses`, data),
  getExpense: (code, id) => api.get(`/trips/${code}/expenses/${id}`),
  updateExpense: (code, id, data) => api.put(`/trips/${code}/expenses/${id}`, data),
  deleteExpense: (code, id) => api.delete(`/trips/${code}/expenses/${id}`),
  createSettlement: (code, data) => api.post(`/trips/${code}/settlements`, data),
  deleteSettlement: (code, id) => api.delete(`/trips/${code}/settlements/${id}`),
};

export default api;
