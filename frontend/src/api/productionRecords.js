import { apiRequest } from './client.js'
export const getProductionRecords = () => apiRequest('GET', '/production-records')
export const getProductionRecord = (id) => apiRequest('GET', `/production-records/${id}`)
export const createProductionRecord = (data) => apiRequest('POST', '/production-records', data)
export const updateProductionRecord = (id, data) => apiRequest('PUT', `/production-records/${id}`, data)
export const deleteProductionRecord = (id) => apiRequest('DELETE', `/production-records/${id}`)
