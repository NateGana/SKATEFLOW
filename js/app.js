/* app.js — starts the app, handles navigation and shared events. Loaded last. */

const ROUTES = [
  { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
  { id: 'progress', label: 'My Progress', icon: 'trending-up' },
  { id: 'tricks', label: 'Trick Library', icon: 'layers' },
  { id: 'sessions', label: 'Skate Sessions', icon: 'timer' },
  { id: 'skateparks', label: 'Skatepark Finder', icon: 'map-pin' },
  { id: 'equipment', label: 'My Equipment', icon: 'wrench' },
  { id: 'challenges', label: 'Challenges', icon: 'trophy' },
  { id: 'journal', label: 'Skate Journal', icon: 'notebook-pen' },
  { id: 'goals', label: 'Goals', icon: 'target' },
  { id: 'community', label: 'Community', icon: 'users' },
  { id: 'settings', label: 'Settings', icon: 'settings' }
];

const App = {
  route: '',

  go(id) {
    if (location.hash === '#/' + id) App.render();
    else location.hash = '#/' + id;
  },

  routeFromHash() {
    const id = (location.hash || '').replace('#/', '');
    return ROUTES.some(r => r.id === id) || id === 'search' ? id : 'dashboard';
  },

  applyTheme() {
    const theme = Store.read('settings', {}).theme === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  },

  renderNav() {
    $('#nav').innerHTML = ROUTES.map(r => `<a href="#/${r.id}" data-route="${r.id}" aria-label="${r.label}" title="${r.label}">${icon(r.icon)}<span>${r.label}</span></a>`).join('');
  },

  renderProfile() {
    const p = Store.read('profile', {});
    $('#profileChip').innerHTML = `<span class="avatar">${p.avatar ? `<img src="${esc(p.avatar)}" alt="">` : esc((p.name || 'S')[0].toUpperCase())}</span>
      <span class="who"><strong>${esc(p.name || 'Skater')}</strong><span>${esc(p.level || 'Beginner')}</span></span>`;
  },

  render() {
    const route = App.routeFromHash();
    const changed = route !== App.route;
    App.route = route;
    destroyCharts();
    $$('#nav a').forEach(a => a.classList.toggle('active', a.dataset.route === route));
    $('#app').classList.remove('drawer-open');
    App.renderProfile();
    const root = $('#view');
    try {
      Views[route](root);
    } catch (error) {
      console.error(error);
      root.innerHTML = emptyState('Something went wrong', 'This page could not load. Try refreshing the page.');
    }
    refreshIcons();
    if (changed) window.scrollTo(0, 0);
  },

  init() {
    App.renderNav();
    if (!Store.available()) {
      $('#view').innerHTML = emptyState('Browser storage is blocked', 'SKATEFLOW saves your data in LocalStorage. Turn off private mode or allow site data, then refresh the page.');
      refreshIcons();
      return;
    }
    Store.init();
    App.applyTheme();
    if (Store.read('settings', {}).sidebarCollapsed) $('#app').classList.add('collapsed');
    window.addEventListener('hashchange', App.render);
    App.render();
  }
};

/* ---------- Shared events ---------- */
document.addEventListener('click', event => {
  const el = event.target.closest('[data-action]');
  if (!el) return;
  // Selects and checkboxes report through the "change" event instead.
  if (el.tagName === 'SELECT' || (el.tagName === 'INPUT' && el.type === 'checkbox')) return;
  const handler = Actions[el.dataset.action];
  if (handler) handler(el.dataset, el, event);
});

document.addEventListener('change', event => {
  const el = event.target;
  if (el.id === 'importFile') {
    if (el.files[0]) importFromFile(el.files[0]);
    el.value = '';
    return;
  }
  if (el.dataset.action && (el.tagName === 'SELECT' || el.type === 'checkbox')) {
    const handler = Actions[el.dataset.action];
    if (handler) handler(el.dataset, el, event);
  }
});

// Search boxes and filters: update the saved filter value, then redraw only the list.
function handleBind(event) {
  const el = event.target.closest('[data-bind]');
  if (!el) return;
  const [page, key] = el.dataset.bind.split('.');
  State[page][key] = el.value;
  if (page === 'search') Views.search($('#view'));
  else Lists[page]();
  refreshIcons();
}
document.addEventListener('input', handleBind);
document.addEventListener('change', handleBind);

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') { closeModal(); }
  if (event.key === 'Enter' && event.target.matches('.link-card[data-action]')) event.target.click();
});

// Sidebar: collapse on desktop, slide-in drawer on phones.
Actions['nav.toggle'] = () => {
  if (window.innerWidth <= 900) {
    $('#app').classList.toggle('drawer-open');
  } else {
    const collapsed = $('#app').classList.toggle('collapsed');
    const settings = Store.read('settings', {});
    settings.sidebarCollapsed = collapsed;
    Store.write('settings', settings);
  }
};
Actions['nav.close'] = () => $('#app').classList.remove('drawer-open');
Actions['nav.settings'] = () => App.go('settings');

Actions['theme.toggle'] = () => {
  const settings = Store.read('settings', {});
  settings.theme = settings.theme === 'light' ? 'dark' : 'light';
  Store.write('settings', settings);
  App.applyTheme();
  App.render();
};

// The top search bar jumps to the search page and keeps the results updated as you type.
document.addEventListener('DOMContentLoaded', () => {
  $('#globalSearch').addEventListener('input', event => {
    State.search.q = event.target.value;
    if (App.route !== 'search') App.go('search');
    else Views.search($('#view'));
  });
  App.init();
});
