import API from './axiosConfig';

export const authService = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  verifyOtp: (data) => API.post('/auth/verify-otp', data),
  googleLogin: (data) => API.post('/auth/google-login', data),
  forgotPassword: (data) => API.post('/auth/forgot-password', data),
  resetPassword: (data) => API.post('/auth/reset-password', data),
};

export const instanceService = {
  getInstances: () => API.get('/instances/list'),
  createInstance: (data) => API.post('/instances/create', data),
  initiateSession: (instanceKey) => API.post('/instances/initiate', { instanceKey }),
  getStatus: (instanceKey) => API.get(`/instances/status?instanceKey=${instanceKey}`),
  deleteInstance: (instanceKey) => API.delete(`/instances/${instanceKey}`),
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
  sendBulk: (data) => API.post('/messages/bulk', data),
  getLogs: () => API.get('/messages/logs'),
  getReports: () => API.get('/messages/reports'),
};
