const API = 'https:/ingest.launchpad-studio.co.za/admin/login'; // point at your deployed Worker

function authHeaders() {
  const token = localStorage.getItem('lp_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

function requireAuth() {
  if (!localStorage.getItem('lp_token')) window.location.href = 'index.html';
}

function logout() {
  localStorage.removeItem('lp_token');
  localStorage.removeItem('lp_role');
  localStorage.removeItem('lp_username');
  window.location.href = 'index.html';
}

async function api(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...authHeaders(), ...(opts.headers || {}) },
  });
  if (res.status === 401) { logout(); throw new Error('Session expired'); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}
