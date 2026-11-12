const ICONS = {
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>',
  tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20 12l-8 8-9-9V3h8z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.5 3-5.5 7-5.5s7 2 7 5.5"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14c3 0 5 1.5 5 4.5"/></svg>',
};

const SETTINGS_NAV_ITEMS = [
  { key: 'profile', label: 'Profile', href: 'settings/profile/', icon: 'user' },
  { key: 'tags', label: 'Tags', href: 'settings/tags/', icon: 'tag' },
  { key: 'members', label: 'Members', href: 'settings/members/', icon: 'users' },
];

function siteRoot() {
  return document.body.dataset.root || './';
}

function renderSidebarNav() {
  const active = document.body.dataset.page;
  const nav = document.getElementById('nav');
  nav.innerHTML = SETTINGS_NAV_ITEMS.map(
    (item) =>
      `<li><a href="${siteRoot()}${item.href}" class="${item.key === active ? 'active' : ''}" data-nav="${item.key}">${ICONS[item.icon]}<span>${item.label}</span></a></li>`,
  ).join('');
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

function readList(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeList(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable; the page still works for the session.
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

renderSidebarNav();
