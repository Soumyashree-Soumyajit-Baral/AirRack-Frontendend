import api from './axiosInstance';

export const loginApi = (credentials) => api.post('/auth/login', credentials);
export const getMeApi = () => api.get('/auth/me');
export const logoutApi = () => api.post('/auth/logout');
export const changePasswordApi = (data) => api.patch('/auth/change-password', data);
