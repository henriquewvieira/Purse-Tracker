const BASE = import.meta.env.VITE_API_BASE || '/api'

export async function apiRequest(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401) {
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
