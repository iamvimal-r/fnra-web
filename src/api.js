export const API = import.meta.env.VITE_API_URL || 'https://fnra.io/api/'

export function resolveUrl(url) {
  if (!url) return ''
  // Already an absolute URL (external image or old data) — use as-is
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  // Relative path from our server
  return `${API}${url}`
}

async function request(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(err.detail || 'Request failed')
  }
  return res.json()
}

export async function uploadImage(file, token) {
  const form = new FormData()
  form.append('file', file)
  const headers = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API}/cms/upload`, { method: 'POST', headers, body: form })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Upload failed' }))
    throw new Error(err.detail || 'Upload failed')
  }
  const data = await res.json()
  // Store only the relative path — not the full URL
  return data.url   // e.g. "/static/uploads/abc123.jpg"
}

export const get = (path, token) => request('GET', path, null, token)
export const post = (path, body, token) => request('POST', path, body, token)
export const put = (path, body, token) => request('PUT', path, body, token)
export const del = (path, token) => request('DELETE', path, null, token)
export const delWithBody = (path, body, token) => request('DELETE', path, body, token)

export const slidesApi = {
  list: () => get('/cms/slides'),
  create: (data, token) => post('/cms/slides', data, token),
  update: (id, data, token) => put(`/cms/slides/${id}`, data, token),
  delete: (id, token) => del(`/cms/slides/${id}`, token),
}
export const newsApi = {
  list: () => get('/cms/news'),
  create: (data, token) => post('/cms/news', data, token),
  update: (id, data, token) => put(`/cms/news/${id}`, data, token),
  delete: (id, token) => del(`/cms/news/${id}`, token),
}
export const galleryApi = {
  list: () => get('/cms/gallery'),
  create: (data, token) => post('/cms/gallery', data, token),
  update: (id, data, token) => put(`/cms/gallery/${id}`, data, token),
  delete: (id, token) => del(`/cms/gallery/${id}`, token),
  bulkDelete: (ids, token) => delWithBody('/cms/gallery/bulk-delete', { ids }, token),
}
export const publicContactsApi = {
  list: () => get('/contacts'),
  listBy: (category) => get(`/contacts?category=${category}`),
}
export const adminContactsApi = {
  list: (token) => get('/contacts', token),
  create: (data, token) => post('/contacts', data, token),
  update: (id, data, token) => put(`/contacts/${id}`, data, token),
  delete: (id, token) => del(`/contacts/${id}`, token),
}
export const committeeApi = {
  listPublic: () => get('/committee'),
  listAll: (token) => get('/committee/all', token),
  create: (data, token) => post('/committee', data, token),
  update: (id, data, token) => put(`/committee/${id}`, data, token),
  delete: (id, token) => del(`/committee/${id}`, token),
}
export const authApi = {
  login: (email, password) => post('/auth/login', { email, password }),
}

export const expensesApi = {
  list: (token) => get('/expenses', token),
  create: (data, token) => post('/expenses', data, token),
  update: (id, data, token) => put(`/expenses/${id}`, data, token),
  delete: (id, token) => del(`/expenses/${id}`, token),
  getSummary: (token) => get('/expenses/summary', token),
}

export const incomesApi = {
  list: (token) => get('/incomes', token),
  create: (data, token) => post('/incomes', data, token),
  update: (id, data, token) => put(`/incomes/${id}`, data, token),
  delete: (id, token) => del(`/incomes/${id}`, token),
  getSummary: (token) => get('/incomes/summary', token),
}

export const housesApi = {
  getMonthlyReport: (year, token) => get(`/houses/reports/monthly?year=${year}`, token),
}

