/* storage.js — saving, loading and calculating. All data lives in the browser's LocalStorage. */

const KEYS = {
  profile: 'skateflow_profile',
  sessions: 'skateflow_sessions',
  tricks: 'skateflow_tricks',
  skateparks: 'skateflow_skateparks',
  equipment: 'skateflow_equipment',
  challenges: 'skateflow_challenges',
  journal: 'skateflow_journal',
  goals: 'skateflow_goals',
  settings: 'skateflow_settings',
  posts: 'skateflow_posts'
};
const LIST_KEYS = ['sessions', 'tricks', 'skateparks', 'equipment', 'challenges', 'journal', 'goals', 'posts'];

const Store = {
  // Quick check so we can show a helpful message if the browser blocks storage.
  available() {
    try { localStorage.setItem('__skateflow_test', '1'); localStorage.removeItem('__skateflow_test'); return true; }
    catch (e) { return false; }
  },

  read(name, fallback) {
    try {
      const raw = localStorage.getItem(KEYS[name]);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  },

  write(name, value) {
    try {
      localStorage.setItem(KEYS[name], JSON.stringify(value));
      return true;
    } catch (e) {
      toast('Could not save. Browser storage is full or blocked. Try exporting your data and removing big images.', 'error');
      return false;
    }
  },

  all(name) { return this.read(name, []); },
  find(name, id) { return this.all(name).find(item => item.id === id); },

  add(name, item) {
    const list = this.all(name);
    item.id = item.id || uid(name.slice(0, 3));
    list.push(item);
    return this.write(name, list) ? item : null;
  },

  update(name, id, patch) {
    const list = this.all(name);
    const index = list.findIndex(item => item.id === id);
    if (index === -1) return null;
    list[index] = Object.assign({}, list[index], patch);
    return this.write(name, list) ? list[index] : null;
  },

  remove(name, id) {
    return this.write(name, this.all(name).filter(item => item.id !== id));
  },

  // Fill in first-run data without touching anything the user already saved.
  init() {
    if (!localStorage.getItem(KEYS.tricks)) this.write('tricks', buildDefaultTricks());
    if (!localStorage.getItem(KEYS.skateparks)) this.write('skateparks', buildDefaultSkateparks());
    if (!localStorage.getItem(KEYS.challenges)) this.write('challenges', buildDefaultChallenges());
    ['sessions', 'equipment', 'journal', 'goals', 'posts'].forEach(n => { if (!localStorage.getItem(KEYS[n])) this.write(n, []); });
    if (!localStorage.getItem(KEYS.profile)) {
      this.write('profile', { name: 'Skater', username: '', avatar: '', experience: '', level: 'Beginner', style: 'Street', homePark: '', bio: '', records: {}, levelHistory: [{ date: todayISO(), level: 'Beginner' }] });
    }
    if (!localStorage.getItem(KEYS.settings)) {
      this.write('settings', { theme: 'dark', currency: '$', sidebarCollapsed: false, favoriteTips: [], setup: {} });
    }
  },

  /* ----- Export / import ----- */
  exportAll() {
    const data = { app: 'SKATEFLOW', version: 1, exportedAt: new Date().toISOString() };
    Object.keys(KEYS).forEach(name => { data[name] = this.read(name, LIST_KEYS.includes(name) ? [] : {}); });
    return data;
  },

  // Check an imported file before it replaces anything. Returns an error message or ''.
  validateImport(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return 'This file is not a SKATEFLOW export.';
    if (data.app !== 'SKATEFLOW') return 'This file was not exported from SKATEFLOW.';
    for (const name of LIST_KEYS) {
      if (data[name] !== undefined && !Array.isArray(data[name])) return `The "${name}" data in this file is not valid.`;
      for (const item of (data[name] || [])) {
        if (!item || typeof item !== 'object' || !item.id) return `An item in "${name}" is missing an id.`;
      }
    }
    for (const name of ['profile', 'settings']) {
      if (data[name] !== undefined && (typeof data[name] !== 'object' || Array.isArray(data[name]))) return `The "${name}" data in this file is not valid.`;
    }
    return '';
  },

  importAll(data) {
    Object.keys(KEYS).forEach(name => { if (data[name] !== undefined) this.write(name, data[name]); });
    this.init(); // fill anything the file did not include
  },

  // Remove sessions, journal, goals, equipment and posts, and reset tricks/parks/challenges progress.
  clearPersonal() {
    ['sessions', 'equipment', 'journal', 'goals', 'posts'].forEach(n => this.write(n, []));
    this.write('tricks', buildDefaultTricks().concat(this.all('tricks').filter(t => t.custom).map(t => Object.assign(t, { status: 'Not Started', attempts: 0, landings: 0, firstLanded: '', personalNotes: '', checklist: t.checklist.map(c => ({ text: c.text, done: false })) }))));
    this.write('skateparks', this.all('skateparks').filter(p => !p.sample).map(p => Object.assign(p, { visited: false, visitedDate: '', favorite: false, bucket: false, rating: 0 })).concat(buildDefaultSkateparks()));
    this.write('challenges', buildDefaultChallenges().concat(this.all('challenges').filter(c => c.custom).map(c => Object.assign(c, { status: 'available', progress: 0, startDate: '', endDate: '', completedDate: '' }))));
    const profile = this.read('profile', {});
    profile.records = {};
    this.write('profile', profile);
    const settings = this.read('settings', {});
    settings.setup = {}; settings.favoriteTips = [];
    this.write('settings', settings);
  },

  // Put the built-in tricks, parks and challenges back to their starting state.
  resetSamples() {
    const customTricks = this.all('tricks').filter(t => t.custom);
    this.write('tricks', buildDefaultTricks().concat(customTricks));
    this.write('skateparks', this.all('skateparks').filter(p => !p.sample).concat(buildDefaultSkateparks()));
    this.write('challenges', buildDefaultChallenges().concat(this.all('challenges').filter(c => c.custom)));
  },

  loadDemo() {
    const demo = buildDemoData();
    ['sessions', 'journal', 'goals', 'equipment'].forEach(n => this.write(n, this.all(n).concat(demo[n])));
    const tricks = this.all('tricks').map(t => demo.trickUpdates[t.name] ? Object.assign(t, demo.trickUpdates[t.name]) : t);
    this.write('tricks', tricks);
  }
};

/* ---------- Statistics: everything is calculated from the saved records ---------- */
const Stats = {
  sessions() { return Store.all('sessions').slice().sort((a, b) => (b.date + (b.startTime || '')).localeCompare(a.date + (a.startTime || ''))); },
  totalMinutes() { return Store.all('sessions').reduce((sum, s) => sum + (Number(s.duration) || 0), 0); },
  totalDistance() { return Store.all('sessions').reduce((sum, s) => sum + (Number(s.distance) || 0), 0); },
  avgMinutes() { const n = Store.all('sessions').length; return n ? this.totalMinutes() / n : 0; },
  learned() { return Store.all('tricks').filter(t => t.status === 'Landed' || t.status === 'Mastered'); },
  practicing() { return Store.all('tricks').filter(t => t.status === 'Learning' || t.status === 'Practicing'); },
  personalBest() { return Math.max(0, ...Store.all('sessions').map(s => Number(s.duration) || 0)); },
  landedCount(session) { return splitList(session.tricksLanded).length; },

  trickProgress(trick) {
    const base = { 'Not Started': 0, 'Learning': 10, 'Practicing': 35, 'Landed': 80, 'Mastered': 100 }[trick.status] || 0;
    if (trick.status === 'Learning' || trick.status === 'Practicing') {
      const list = trick.checklist || [];
      const done = list.filter(c => c.done).length;
      return base + (list.length ? Math.round((done / list.length) * 20) : 0);
    }
    return base;
  },
  overallProgress() {
    const tricks = Store.all('tricks');
    if (!tricks.length) return 0;
    return Math.round(tricks.reduce((sum, t) => sum + this.trickProgress(t), 0) / tricks.length);
  },

  // Consecutive days with at least one session, ending today (or yesterday if nothing logged yet today).
  streak() {
    const days = new Set(Store.all('sessions').map(s => s.date));
    let cursor = new Date();
    if (!days.has(toISO(cursor))) cursor = addDays(cursor, -1);
    let count = 0;
    while (days.has(toISO(cursor))) { count++; cursor = addDays(cursor, -1); }
    return count;
  },

  minutesOnDay(iso) { return Store.all('sessions').filter(s => s.date === iso).reduce((n, s) => n + (Number(s.duration) || 0), 0); },
  lastSevenDays() {
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(new Date(), i - 6);
      return { label: d.toLocaleDateString('en-US', { weekday: 'short' }), hours: Math.round((this.minutesOnDay(toISO(d)) / 60) * 100) / 100 };
    });
  },
  // Per-week totals for the last N weeks (Monday start).
  weekly(weeks = 8) {
    const thisWeek = startOfWeek(new Date());
    return Array.from({ length: weeks }, (_, i) => {
      const start = addDays(thisWeek, (i - (weeks - 1)) * 7);
      const startIso = toISO(start), endIso = toISO(addDays(start, 6));
      const inWeek = Store.all('sessions').filter(s => s.date >= startIso && s.date <= endIso);
      const learned = this.learned().filter(t => t.firstLanded && t.firstLanded <= endIso).length;
      return {
        label: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        hours: Math.round((inWeek.reduce((n, s) => n + (Number(s.duration) || 0), 0) / 60) * 10) / 10,
        sessions: inWeek.length, learned
      };
    });
  },
  monthly(months = 6) {
    const now = new Date();
    return Array.from({ length: months }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
      const key = toISO(d).slice(0, 7);
      const minutes = Store.all('sessions').filter(s => (s.date || '').startsWith(key)).reduce((n, s) => n + (Number(s.duration) || 0), 0);
      return { label: d.toLocaleDateString('en-US', { month: 'short' }), key, hours: Math.round((minutes / 60) * 10) / 10 };
    });
  },
  thisMonthMinutes() {
    const key = todayISO().slice(0, 7);
    return Store.all('sessions').filter(s => (s.date || '').startsWith(key)).reduce((n, s) => n + (Number(s.duration) || 0), 0);
  },
  parksVisited() { return Store.all('skateparks').filter(p => p.visited); }
};

// "Ollie, Shuvit" -> ["Ollie", "Shuvit"]
function splitList(text) {
  return String(text || '').split(',').map(s => s.trim()).filter(Boolean);
}
