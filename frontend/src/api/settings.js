import { apiRequest } from './client.js'
export const getSettings = () => apiRequest('GET', '/settings')
export const updateSettings = (data) => apiRequest('PUT', '/settings', data)
