import { apiRequest } from './client.js'

export const getMonthlyReport = (year, month) =>
  apiRequest('GET', `/reports/monthly?year=${year}&month=${month}`)

export const exportCSV = (year, month) => {
  const base = import.meta.env.VITE_API_BASE || '/api'
  window.location.href = `${base}/export/csv?year=${year}&month=${month}`
}
