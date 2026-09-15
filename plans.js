function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function renderPlansPage() {
  requireAuth();
  const content = mountShell('plans');

  content.innerHTML = `
    <div class="topbar">
      <h1>Plans</h1>
      <button onclick="openPlanModal(null)">+ New Plan</button>
    </div>
    <div class="card">
      <table>
        <thead>
          <tr>
            <th>Order</th><th>Name</th><th>Price</th><th>Type</th><th>Active</th><th></th>
          </tr>
        </thead>
        <tbody id="plans-tbody"></tbody>
      </table>
    </div>
    <div id="modal-root"></div>
  `;

  loadPlans();
}

async function loadPlans() {
  const plans = await api('/admin/plans');
  const tbody = document.getElementById('plans-tbody');
  tbody.innerHTML = plans.map(p => `
    <tr>
      <td style="width:70px;">${p.sort_order}</td>
      <td onclick="openPlanModal('${p.id}')" style="cursor:pointer;">${escapeHtml(p.name)}</td>
      <td>R${p.price_rand.toLocaleString()}</td>
      <td>${p.is_addon ? 'Add-on' : 'Plan'}</td>
      <td><span class="status-pill">${p.active ? 'active' : 'hidden'}</span></td>
      <td style="text-align:right;">
        <button class="secondary" onclick="openPlanModal('${p.id}')">Edit</button>
        <button class="secondary" onclick="confirmDeletePlan('${p.id}', '${escapeHtml(p.name).replace(/'/g, "\\'")}')">Delete</button>
      </td>
    </tr>
  `).join('') || `<tr><td colspan="6" style="color:var(--muted)">No plans yet.</td></tr>`;
}

function openPlanModal(id) {
  api('/admin/plans').then(all => {
    const p = id ? all.find(x => x.id === id) : null;
    document.getElementById('modal-root').innerHTML = `
      <div class="modal-backdrop" onclick="if(event.target===this)this.remove()">
        <div class="modal">
          <h2>${p ? 'Edit Plan' : 'New Plan'}</h2>

          <label>Name</label>
          <input id="plan-name" value="${p ? escapeHtml(p.name) : ''}" placeholder="e.g. Starter">

          <label>Price (ZAR, once-off)</label>
          <input id="plan-price" type="number" step="1" value="${p ? p.price_rand : ''}" placeholder="e.g. 2500">

          <label><input type="checkbox" id="plan-addon" ${p && p.is_addon ? 'checked' : ''}> This is an add-on, not a standalone plan</label>

          <label>Description (short tagline)</label>
          <input id="plan-description" value="${p ? escapeHtml(p.description || '') : ''}" placeholder="e.g. Up to 6 pages">

          <label>Features (one per line)</label>
          <textarea id="plan-features" rows="4" placeholder="Contact form + WhatsApp&#10;Unlimited pro email">${p ? escapeHtml((p.features || []).join('\n')) : ''}</textarea>

          <label>Sort order</label>
          <input id="plan-sort" type="number" step="1" value="${p ? p.sort_order : 0}">

          <label><input type="checkbox" id="plan-active" ${!p || p.active ? 'checked' : ''}> Active (visible on site &amp; order form)</label>

          <p id="plan-error" style="color:#c0392b; font-size:0.85rem; margin-top:8px;"></p>

          <button onclick="savePlan(${p ? `'${p.id}'` : 'null'})" style="width:100%; margin-top:16px; margin-bottom:8px;">Save</button>
          <button class="secondary" onclick="document.querySelector('.modal-backdrop').remove()" style="width:100%;">Cancel</button>
        </div>
      </div>
    `;
  });
}

async function savePlan(id) {
  const body = {
    name: document.getElementById('plan-name').value.trim(),
    price_rand: parseFloat(document.getElementById('plan-price').value) || 0,
    is_addon: document.getElementById('plan-addon').checked,
    description: document.getElementById('plan-description').value.trim(),
    features: document.getElementById('plan-features').value.split('\n').map(s => s.trim()).filter(Boolean),
    sort_order: parseInt(document.getElementById('plan-sort').value, 10) || 0,
    active: document.getElementById('plan-active').checked,
  };
  if (!body.name) {
    document.getElementById('plan-error').textContent = 'Name is required.';
    return;
  }
  try {
    if (id) {
      await api(`/admin/plans/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
    } else {
      await api('/admin/plans', { method: 'POST', body: JSON.stringify(body) });
    }
    document.querySelector('.modal-backdrop').remove();
    loadPlans();
  } catch (err) {
    document.getElementById('plan-error').textContent = err.message || 'Save failed';
  }
}

function confirmDeletePlan(id, name) {
  if (!confirm(`Delete "${name}"? This can't be undone.`)) return;
  api(`/admin/plans/${id}`, { method: 'DELETE' }).then(loadPlans);
}
