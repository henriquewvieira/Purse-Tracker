const BASE = import.meta.env.VITE_API_BASE || '/api'

export async function apiRequest(method, path, body) {
  const token = localStorage.getItem('token')
  const headers = {}
  if (body) headers['Content-Type'] = 'application/json'
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401) {
    localStorage.removeItem('token')
    window.dispatchEvent(new Event('unauthorized'))
    throw new Error('Unauthorized')
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || `HTTP ${res.status}`)
  }

  if (res.status === 204) return null
  return res.json()
}
