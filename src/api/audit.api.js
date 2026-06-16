import api from './axiosInstance';

export const getRecordTimelineApi = (id) => api.get(`/audit/timeline/${id}`);
export const getDeletedLogsApi = () => api.get('/audit/deleted');
export const restoreRecordApi = (id) => api.post(`/audit/restore/${id}`);
export const permanentDeleteLogApi = (id) => api.delete(`/audit/permanent/${id}`);
