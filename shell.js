function renderShell(activePage) {
  return `
  <div class="app-shell">
    <aside class="sidebar">
      <div class="logo">
        <strong>LAUNCHPAD<span class="dot">.</span></strong>
        <span>SAMARITAN CONSOLE</span>
      </div>
      <a href="dashboard.html" class="nav-item ${activePage==='dashboard'?'active':''}">Orders</a>
      <a href="invoices.html" class="nav-item ${activePage==='invoices'?'active':''}">Invoices &amp; Quotes</a>
      <a href="activity.html" class="nav-item ${activePage==='activity'?'active':''}">Activity Feed</a>
      <a href="#" id="logout-link" class="nav-item">Logout</a>
    </aside>
    <main class="content" id="content"></main>
  </div>`;
}

function mountShell(activePage) {
  document.body.innerHTML = renderShell(activePage);
  document.getElementById('logout-link').addEventListener('click', (e) => { e.preventDefault(); logout(); });
  return document.getElementById('content');
}
