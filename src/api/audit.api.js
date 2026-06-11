import api from './axiosInstance';

export const getRecordTimelineApi = (id) => api.get(`/audit/timeline/${id}`);
export const getDeletedLogsApi = () => api.get('/audit/deleted');
