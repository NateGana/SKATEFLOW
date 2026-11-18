/* search.js — one search box for tricks, sessions, parks, equipment, journal and goals */

State.search = { q: '', kind: 'All', sort: 'relevance' };

const SEARCH_KINDS = {
  Tricks: { page: 'tricks', get: () => Store.all('tricks').map(t => ({ id: t.id, title: t.name, sub: `${t.category} · ${t.status}`, text: t.description })) },
  Sessions: { page: 'sessions', get: () => Store.all('sessions').map(s => ({ id: s.id, title: s.title, sub: `${fmtDate(s.date)} · ${s.location || 'No location'}`, text: [s.tricksPracticed, s.notes, s.type].join(' ') })) },
  Skateparks: { page: 'skateparks', get: () => Store.all('skateparks').map(p => ({ id: p.id, title: p.name, sub: `${p.parkType} · ${p.location}`, text: p.description })) },
  Equipment: { page: 'equipment', get: () => Store.all('equipment').map(e => ({ id: e.id, title: e.name, sub: `${e.category} · ${e.brand || 'No brand'}`, text: e.notes })) },
  Journal: { page: 'journal', get: () => Store.all('journal').map(j => ({ id: j.id, title: j.title, sub: fmtDate(j.date), text: j.description + ' ' + (j.tags || []).join(' ') })) },
  Goals: { page: 'goals', get: () => Store.all('goals').map(g => ({ id: g.id, title: g.name, sub: `${g.category} · ${g.status}`, text: g.description })) }
};

function runSearch() {
  const q = State.search.q.trim().toLowerCase();
  if (!q) return [];
  const results = [];
  Object.keys(SEARCH_KINDS).forEach(kind => {
    SEARCH_KINDS[kind].get().forEach(item => {
      const inTitle = item.title.toLowerCase().includes(q);
      const inText = (item.sub + ' ' + item.text).toLowerCase().includes(q);
      if (inTitle || inText) results.push(Object.assign({ kind, score: inTitle ? 2 : 1 }, item));
    });
  });
  return results;
}

Actions['search.kind'] = data => { State.search.kind = data.kind; Views.search($('#view')); };

Actions['search.open'] = data => {
  const page = SEARCH_KINDS[data.kind].page;
  App.go(page);
  if (data.kind === 'Tricks') showTrick(data.id);
  if (data.kind === 'Sessions') Actions['sessions.view']({ id: data.id });
};

Lists.search = function () {
  const s = State.search;
  const all = runSearch();
  let list = s.kind === 'All' ? all : all.filter(r => r.kind === s.kind);
  list = list.sort(s.sort === 'name' ? (a, b) => a.title.localeCompare(b.title) : (a, b) => b.score - a.score || a.title.localeCompare(b.title));
  const box = $('#list');
  if (!box) return;
  if (!s.q.trim()) { box.innerHTML = emptyState('Start typing', 'Use the search bar at the top to search everything you have saved.'); return; }
  box.innerHTML = list.length ? `<div class="card">${list.map(r => `<div class="item"><div class="body"><h4>${esc(r.title)}</h4><div class="muted small">${esc(r.sub)}</div></div>
      <span class="badge accent">${r.kind}</span><button class="btn sm" data-action="search.open" data-kind="${r.kind}" data-id="${r.id}">Open</button></div>`).join('')}</div>`
    : emptyState('No results', `Nothing matches "${s.q}". Try a shorter word.`);
};

Views.search = function (root) {
  const s = State.search;
  const all = runSearch();
  const count = kind => all.filter(r => r.kind === kind).length;
  root.innerHTML = `
    ${pageHead('Search', s.q ? `${all.length} result${all.length === 1 ? '' : 's'} for "${s.q}"` : 'Search across everything in SKATEFLOW.')}
    <div class="toolbar">
      <select data-bind="search.sort" aria-label="Sort results"><option value="relevance"${s.sort === 'relevance' ? ' selected' : ''}>Best match</option><option value="name"${s.sort === 'name' ? ' selected' : ''}>Name A to Z</option></select>
    </div>
    <div class="chips" style="margin-bottom:18px">
      <button class="chip ${s.kind === 'All' ? 'active' : ''}" data-action="search.kind" data-kind="All">All (${all.length})</button>
      ${Object.keys(SEARCH_KINDS).map(k => `<button class="chip ${s.kind === k ? 'active' : ''}" data-action="search.kind" data-kind="${k}">${k} (${count(k)})</button>`).join('')}
    </div>
    <div id="list"></div>`;
  Lists.search();
};
