import { apiRequest } from './client.js'
export const getMaterials = () => apiRequest('GET', '/materials')
export const createMaterial = (data) => apiRequest('POST', '/materials', data)
export const updateMaterial = (id, data) => apiRequest('PUT', `/materials/${id}`, data)
export const deleteMaterial = (id) => apiRequest('DELETE', `/materials/${id}`)
