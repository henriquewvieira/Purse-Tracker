import { apiRequest } from './client.js'

export const login = async (password) => {
  const data = await apiRequest('POST', '/auth/login', { password })
  localStorage.setItem('token', data.token)
  return data
}

export const logout = () => {
  localStorage.removeItem('token')
  return apiRequest('POST', '/auth/logout')
}

export const getMe = () => apiRequest('GET', '/auth/me')
