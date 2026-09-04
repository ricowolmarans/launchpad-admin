const API = 'https://ingest.launchpad-studio.co.za'; // point at your deployed Worker

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

// Some browsers treat Backspace as "navigate back" when focus isn't inside an
// editable field. If focus briefly slips off an input while typing quickly
// (e.g. a re-render mid-keystroke), that Backspace can silently navigate the
// whole app away — which looks like "the modal just closed". This blocks that
// fallback everywhere except real text inputs/textareas/contenteditable, so
// legitimate deleting inside a field is never affected.
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Backspace') return;
  const el = document.activeElement;
  const isEditable = el && (
    el.tagName === 'INPUT' ||
    el.tagName === 'TEXTAREA' ||
    el.isContentEditable
  );
  if (!isEditable) e.preventDefault();
});
