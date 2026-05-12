import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle unauthorized errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  register: (data) => api.post('/auth/register', data),
  verifyOtp: (data) => api.post('/auth/verify-otp', data),
  login: (data) => api.post('/auth/login', data),
  googleLogin: (idToken) => api.post('/auth/google-login', { idToken }),
};

export const whatsappService = {
  getStatus: () => api.get('/whatsapp/status'),
  startSession: () => api.post('/whatsapp/start'),
  logout: () => api.post('/whatsapp/logout'),
};

export const messageService = {
  sendMessage: (formData) => api.post('/messages/send', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  sendBulk: (data) => api.post('/messages/bulk', data),
};

export default api;
