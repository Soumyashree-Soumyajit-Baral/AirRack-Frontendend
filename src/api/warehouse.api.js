import api from './axiosInstance';

export const getAllWarehousesApi = () => api.get('/warehouses');
export const createWarehouseApi  = (data) => api.post('/warehouses', data);
export const updateWarehouseApi  = (id, data) => api.put(`/warehouses/${id}`, data);
export const deleteWarehouseApi  = (id) => api.delete(`/warehouses/${id}`);
