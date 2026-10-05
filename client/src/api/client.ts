import axios from 'axios';

export const api = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_BASE_URL || '/api',
  timeout: 120000, // 2 minutes timeout for large file uploads & cloud sync
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach token and View As tenant headers if stored
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lab_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const viewAs = localStorage.getItem('lab_view_as');
  if (viewAs && viewAs !== 'ALL' && viewAs !== '') {
    config.headers['X-View-As-User'] = viewAs;
  }
  return config;
});

// Response error handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message || 'Terjadi kesalahan pada sistem.';
    return Promise.reject(new Error(message));
  }
);

export default api;
