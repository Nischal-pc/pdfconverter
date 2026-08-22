import axios from 'axios';
import { getApiBase } from './apiBase';

const api = axios.create({
  timeout: 300000, // 5 minutes for large files
});

api.interceptors.request.use((config) => {
  config.baseURL = getApiBase();
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('pdf_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const uploadAndProcess = async (endpoint, formData, onUploadProgress) => {
  const response = await api.post(endpoint, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  });
  return response.data;
};

export const saveHistoryItem = async (payload) => {
  const response = await api.post('/api/history', payload);
  return response.data;
};

export const fetchServerHealth = async () => {
  const response = await api.get('/api/health');
  return response.data;
};

export default api;
