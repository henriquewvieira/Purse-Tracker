import { apiRequest } from './client.js'
export const login = (password) => apiRequest('POST', '/auth/login', { password })
export const logout = () => apiRequest('POST', '/auth/logout')
export const getMe = () => apiRequest('GET', '/auth/me')
