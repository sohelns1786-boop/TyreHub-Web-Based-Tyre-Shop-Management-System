import axios from 'axios';
import { API_BASE_URL } from './config';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tyrehub_token');
  console.log(`[AXIOS REQUEST] ${config.method?.toUpperCase()} ${config.url} - Token: ${token}`);
  if (token && token !== 'null' && token !== 'undefined' && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log(`[AXIOS RESPONSE] SUCCESS ${response.config.method?.toUpperCase()} ${response.config.url} - Status: ${response.status}`);
    return response;
  },
  (error) => {
    console.error(`[AXIOS RESPONSE] ERROR ${error.config?.method?.toUpperCase()} ${error.config?.url} - Status: ${error.response?.status} - Message:`, error.response?.data?.message);
    if (error.response?.status === 401) {
      localStorage.removeItem('tyrehub_token');
      localStorage.removeItem('tyrehub_user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
