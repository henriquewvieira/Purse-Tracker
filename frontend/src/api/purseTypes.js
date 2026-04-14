import { apiRequest } from './client.js'
export const getPurseTypes = () => apiRequest('GET', '/purse-types')
export const createPurseType = (data) => apiRequest('POST', '/purse-types', data)
export const updatePurseType = (id, data) => apiRequest('PUT', `/purse-types/${id}`, data)
export const deletePurseType = (id) => apiRequest('DELETE', `/purse-types/${id}`)
