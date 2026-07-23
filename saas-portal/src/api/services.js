import API from './axiosConfig';

export const authService = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  verifyOtp: (data) => API.post('/auth/verify-otp', data),
  googleLogin: (data) => API.post('/auth/google-login', data),
  forgotPassword: (data) => API.post('/auth/forgot-password', data),
  resetPassword: (data) => API.post('/auth/reset-password', data),
  resendOtp: (data) => API.post('/auth/resend-otp', data),
  getProfile: () => API.get('/auth/me'),
  refreshToken: (refreshToken) => API.post('/auth/refresh-token', { refreshToken }),
  logout: () => API.post('/auth/logout'),
};

export const instanceService = {
  getInstances: () => API.get('/instances/list'),
  createInstance: (data) => API.post('/instances/create', data),
  initiateSession: (instanceKey) => API.post('/instances/initiate', { instanceKey }),
  getStatus: (instanceKey) => API.get(`/instances/status?instanceKey=${instanceKey}`),
  deleteInstance: (instanceKey) => API.delete(`/instances/${instanceKey}`),
  getGroups: (instanceKey) => API.get(`/instances/${instanceKey}/groups`),
  checkNumbers: (instanceKey, numbers) => API.post('/whatsapp/check-numbers', { instanceKey, numbers }),
};

export const tokenService = {
  getTokens: () => API.get('/tokens'),
  createToken: () => API.post('/tokens/generate'),
  deleteToken: (tokenId) => API.delete(`/tokens/${tokenId}`),
};

export const messageService = {
  sendMessage: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      formData.append(key, data[key]);
    });
    return API.post('/messages/send', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  sendBulk: (data) => {
    if (data.file) {
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        if (key === 'messages') {
          formData.append(key, JSON.stringify(data[key]));
        } else {
          formData.append(key, data[key]);
        }
      });
      return API.post('/messages/bulk', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
    return API.post('/messages/bulk', data);
  },
  getLogs: () => API.get('/messages/logs'),
  getReports: () => API.get('/messages/reports'),
};

export const templateService = {
  getTemplates: () => API.get('/templates'),
  createTemplate: (data) => API.post('/templates', data),
  deleteTemplate: (id) => API.delete(`/templates/${id}`),
};

export const scheduleService = {
  getSchedules: () => API.get('/schedules'),
  createSchedule: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'recipients') {
        formData.append(key, JSON.stringify(data[key]));
      } else {
        formData.append(key, data[key]);
      }
    });
    return API.post('/schedules', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  deleteSchedule: (id) => API.delete(`/schedules/${id}`),
};

export const cycleService = {
  getCycles: () => API.get('/cycles'),
  createCycle: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'recipients' || key === 'frequencyConfig') {
        formData.append(key, JSON.stringify(data[key]));
      } else {
        formData.append(key, data[key]);
      }
    });
    return API.post('/cycles', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  deleteCycle: (id) => API.delete(`/cycles/${id}`),
};
