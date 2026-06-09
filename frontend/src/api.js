const BASE = '/api';

function getToken() {
  return localStorage.getItem('riverflow_token');
}

async function request(url, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(BASE + url, { ...options, headers });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && !url.startsWith('/auth')) {
      localStorage.removeItem('riverflow_token');
      window.dispatchEvent(new Event('auth:logout'));
    }
    throw new Error(body.error || `请求失败 (${res.status})`);
  }
  return body;
}

export const api = {
  register(username, password) {
    return request('/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) });
  },
  login(username, password) {
    return request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
  },
  getMe() {
    return request('/auth/me');
  },

  createSession(data) {
    return request('/sessions', { method: 'POST', body: JSON.stringify(data) });
  },
  getStats(period = 'month') {
    return request(`/stats?period=${period}`);
  },
  getSessions(page = 1, limit = 20) {
    return request(`/sessions?page=${page}&limit=${limit}`);
  },
  deleteSession(id) {
    return request(`/sessions/${id}`, { method: 'DELETE' });
  },
  getGoals() {
    return request('/goals');
  },
  updateGoals(data) {
    return request('/goals', { method: 'PUT', body: JSON.stringify(data) });
  },
  getChart(days = 7) {
    return request(`/chart?days=${days}`);
  },
  getTags() {
    return request('/tags');
  },
  getHeatmap(days = 365) {
    return request(`/heatmap?days=${days}`);
  },
};
