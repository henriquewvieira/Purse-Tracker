import { apiRequest } from './client.js'
export const getProductionRecords = () => apiRequest('GET', '/production-records')
export const getProductionRecord = (id) => apiRequest('GET', `/production-records/${id}`)
export const createProductionRecord = (data) => apiRequest('POST', '/production-records', data)
