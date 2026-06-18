import api from './axiosInstance';

export const getAllRecordsApi = (warehouseId) =>
  api.get('/racks', { params: warehouseId ? { warehouseId } : {} });
export const createRecordApi = (data) => api.post('/racks', data);
export const bulkCreateRecordsApi = (data) => api.post('/racks/bulk', data);
export const updateRecordApi = (id, data) => api.put(`/racks/${id}`, data);
export const deleteRecordApi = (id) => api.delete(`/racks/${id}`);
