// Shared rendering logic for the Enquiries and Emails admin pages — same table/modal,
// just filtered to a fixed category. Category is baked in via renderEnquiriesPage().

function renderEnquiriesPage(category, pageTitle, activeNavKey) {
  requireAuth();
  const content = mountShell(activeNavKey);

  content.innerHTML = `
    <div class="topbar">
      <h1>${pageTitle}</h1>
      <select id="status-filter" style="width:180px; margin:0;">
        <option value="">All statuses</option>
        <option value="new">New</option>
        <option value="read">Read</option>
        <option value="replied">Replied</option>
        <option value="archived">Archived</option>
      </select>
    </div>
    <div class="card">
      <table>
        <thead><tr><th>Name</th><th>Email</th><th>Message</th><th>Status</th><th>Received</th></tr></thead>
        <tbody id="enq-tbody"></tbody>
      </table>
    </div>
    <div id="modal-root"></div>
  `;

  document.getElementById('status-filter').addEventListener('change', () => loadEnquiries(category));
  loadEnquiries(category);
}

async function loadEnquiries(category) {
  const status = document.getElementById('status-filter').value;
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (category) params.set('category', category);
  const enquiries = await api(`/enquiries${params.toString() ? `?${params}` : ''}`);
  const tbody = document.getElementById('enq-tbody');
  tbody.innerHTML = enquiries.map(e => `
    <tr onclick="openEnquiry('${e.id}', '${category}')">
      <td>${escapeHtml(e.name || '—')}</td>
      <td>${escapeHtml(e.email || '—')}</td>
      <td style="max-width:320px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(e.message)}</td>
      <td><span class="status-pill">${e.status}</span></td>
      <td>${new Date(e.created_at*1000).toLocaleString()}</td>
    </tr>
  `).join('') || `<tr><td colspan="5" style="color:var(--muted)">No ${category === 'email' ? 'emails' : 'enquiries'} yet.</td></tr>`;
}

function openEnquiry(id, category) {
  api('/enquiries').then(all => {
    const e = all.find(x => x.id === id);
    if (!e) return;
    document.getElementById('modal-root').innerHTML = `
      <div class="modal-backdrop" onclick="if(event.target===this)this.remove()">
        <div class="modal">
          <h2>${escapeHtml(e.name || 'Unknown')}</h2>
          <p style="color:var(--muted); font-size:0.8rem; margin-bottom:16px;">${escapeHtml(e.email || 'no email')} · ${new Date(e.created_at*1000).toLocaleString()}</p>
          <div style="border:1px solid var(--border); padding:12px; margin-bottom:16px; font-size:0.9rem; white-space:pre-wrap;">${escapeHtml(e.message)}</div>
          <label>Status</label>
          <select id="status-select">
            ${['new','read','replied','archived'].map(s => `<option value="${s}" ${s===e.status?'selected':''}>${s}</option>`).join('')}
          </select>
          <label>Category</label>
          <select id="category-select">
            <option value="enquiry" ${e.category==='enquiry'?'selected':''}>Enquiry (business lead)</option>
            <option value="email" ${e.category==='email'?'selected':''}>Email (other)</option>
          </select>
          <p style="color:var(--muted); font-size:0.75rem; margin-top:4px; margin-bottom:12px;">Set automatically by Groq on arrival — override here if it got it wrong.</p>
          <button onclick="setStatus('${id}', '${category}')" style="width:100%; margin-bottom:20px;">Save</button>
          ${e.email ? `
            <label>Reply to ${escapeHtml(e.email)}</label>
            <textarea id="reply-input" rows="4" placeholder="Type your reply..."></textarea>
            <button id="reply-btn" onclick="sendReply('${id}', '${category}')" style="width:100%; margin-bottom:8px;">Send Reply</button>
            <p id="reply-status" style="font-size:0.8rem; margin-bottom:16px;"></p>
          ` : '<p style="color:var(--muted); font-size:0.85rem; margin-bottom:16px;">No email address on this enquiry — can\'t reply.</p>'}
          <button class="secondary" onclick="document.querySelector('.modal-backdrop').remove()" style="width:100%;">Close</button>
        </div>
      </div>
    `;
  });
}

let replyBusy = false;
async function sendReply(id, category) {
  if (replyBusy) return;
  const message = document.getElementById('reply-input').value.trim();
  if (!message) return;
  const btn = document.getElementById('reply-btn');
  const statusEl = document.getElementById('reply-status');
  replyBusy = true;
  btn.disabled = true;
  btn.textContent = 'Sending...';
  statusEl.textContent = '';
  try {
    await api(`/enquiries/${id}/reply`, { method: 'POST', body: JSON.stringify({ message }) });
    statusEl.textContent = 'Reply sent.';
    statusEl.style.color = '#1a8a3a';
    document.getElementById('reply-input').value = '';
    loadEnquiries(category);
  } catch (err) {
    statusEl.textContent = `Failed: ${err.message}`;
    statusEl.style.color = 'var(--red)';
  } finally {
    replyBusy = false;
    btn.disabled = false;
    btn.textContent = 'Send Reply';
  }
}

async function setStatus(id, category) {
  const status = document.getElementById('status-select').value;
  const newCategory = document.getElementById('category-select').value;
  await api(`/enquiries/${id}`, { method: 'PATCH', body: JSON.stringify({ status, category: newCategory }) });
  document.querySelector('.modal-backdrop').remove();
  loadEnquiries(category);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}
