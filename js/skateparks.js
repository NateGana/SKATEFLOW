/* skateparks.js — a personal list of parks. No map: just a clean list you control. */

const PARK_TYPES = ['Street Skatepark', 'Concrete Skatepark', 'Indoor Skatepark', 'Outdoor Skatepark', 'DIY Skatepark'];

State.parks = { q: '', type: '', tab: 'All' };

function parkFields() {
  return [
    { name: 'name', label: 'Park name', required: true, full: true },
    { name: 'location', label: 'Location', full: true, placeholder: 'City, neighborhood, or your own note' },
    { name: 'parkType', label: 'Park type', type: 'select', options: PARK_TYPES },
    { name: 'difficulty', label: 'Difficulty', type: 'select', options: LEVELS },
    { name: 'description', label: 'Description', type: 'textarea', rows: 3, full: true },
    { name: 'facilities', label: 'Facilities', full: true, placeholder: 'Only what you have seen yourself' },
    { name: 'rating', label: 'Personal rating (0 to 5)', type: 'number', min: 0, max: 5 },
    { name: 'image', label: 'Image (optional)', type: 'image', hint: 'Under 600 KB.' },
    { name: 'notes', label: 'Notes / personal review', type: 'textarea', rows: 3, full: true }
  ];
}

Actions['parks.add'] = () => {
  formModal({
    title: 'Add skatepark', fields: parkFields(), submitLabel: 'Add park',
    onSave: v => {
      Store.add('skateparks', Object.assign(v, { rating: Number(v.rating) || 0, visited: false, visitedDate: '', favorite: false, bucket: false, sample: false }));
      toast('Skatepark added.'); App.render();
    }
  });
};

Actions['parks.edit'] = data => {
  const p = Store.find('skateparks', data.id);
  formModal({
    title: 'Edit skatepark', fields: parkFields(), values: p, submitLabel: 'Save changes',
    onSave: v => {
      // Once you edit a sample park with real information, it is no longer a sample.
      Store.update('skateparks', p.id, Object.assign(v, { rating: Number(v.rating) || 0, sample: false }));
      toast('Skatepark updated.'); App.render();
    }
  });
};

Actions['parks.delete'] = data => {
  confirmDialog('This skatepark will be removed from your list.', () => { Store.remove('skateparks', data.id); toast('Skatepark deleted.', 'info'); App.render(); });
};

Actions['parks.favorite'] = data => { const p = Store.find('skateparks', data.id); Store.update('skateparks', p.id, { favorite: !p.favorite }); App.render(); };
Actions['parks.bucket'] = data => {
  const p = Store.find('skateparks', data.id);
  Store.update('skateparks', p.id, { bucket: !p.bucket });
  toast(p.bucket ? 'Removed from bucket list.' : 'Added to bucket list.', 'info'); App.render();
};
Actions['parks.visited'] = data => {
  const p = Store.find('skateparks', data.id);
  Store.update('skateparks', p.id, { visited: !p.visited, visitedDate: p.visited ? '' : todayISO(), bucket: p.visited ? p.bucket : false });
  toast(p.visited ? 'Marked as not visited.' : 'Marked as visited.'); App.render();
};
Actions['parks.rate'] = data => { Store.update('skateparks', data.id, { rating: Number(data.rating) }); App.render(); };

function parkCard(p) {
  const stars = [1, 2, 3, 4, 5].map(n => `<button class="star-btn ${n <= p.rating ? 'on' : ''}" data-action="parks.rate" data-id="${p.id}" data-rating="${n === p.rating ? 0 : n}" aria-label="Rate ${n} stars">★</button>`).join('');
  return `<div class="card item-card">
    <div class="thumb park">${p.image ? `<img src="${esc(p.image)}" alt="" onerror="this.remove()">` : ''}${icon('map-pin')}</div>
    <div class="row spread"><h3>${esc(p.name)}</h3><button class="icon-btn" data-action="parks.favorite" data-id="${p.id}" aria-label="Toggle favorite" style="${p.favorite ? 'color:var(--accent2);border-color:var(--accent2)' : ''}">${p.favorite ? '★' : '☆'}</button></div>
    <div class="muted small" style="margin-bottom:8px">${esc(p.location)}</div>
    <div class="chips" style="margin-bottom:8px"><span class="badge accent">${esc(p.parkType)}</span><span class="badge">${esc(p.difficulty)}</span>
      ${p.sample ? '<span class="badge sample yellow">Sample info</span>' : ''}${p.visited ? `<span class="badge ok">Visited${p.visitedDate ? ' ' + fmtDate(p.visitedDate, { month: 'short', day: 'numeric' }) : ''}</span>` : ''}${p.bucket ? '<span class="badge yellow">Bucket list</span>' : ''}</div>
    <p class="desc">${esc(p.description)}</p>
    ${p.facilities ? `<p class="muted small">${esc(p.facilities)}</p>` : ''}
    ${p.notes ? `<p class="small"><strong>My notes:</strong> ${esc(p.notes)}</p>` : ''}
    <div class="foot"><div>${stars}</div>
      <div class="actions">
        <button class="btn sm" data-action="parks.visited" data-id="${p.id}">${p.visited ? 'Unmark visited' : 'Mark visited'}</button>
        <button class="btn sm" data-action="parks.bucket" data-id="${p.id}">${p.bucket ? 'Remove from bucket list' : 'Bucket list'}</button>
        <button class="btn sm" data-action="parks.edit" data-id="${p.id}">Edit</button>
        <button class="btn sm danger" data-action="parks.delete" data-id="${p.id}">Delete</button>
      </div></div></div>`;
}

Lists.parks = function () {
  const s = State.parks, q = s.q.toLowerCase();
  const tabs = { All: () => true, Favorites: p => p.favorite, Visited: p => p.visited, 'Bucket list': p => p.bucket };
  const list = Store.all('skateparks').filter(p => (!s.type || p.parkType === s.type) && tabs[s.tab](p) &&
    (!q || [p.name, p.location, p.description, p.notes].join(' ').toLowerCase().includes(q)));
  const box = $('#list');
  if (!box) return;
  box.innerHTML = list.length ? `<div class="grid g3">${list.map(parkCard).join('')}</div>`
    : emptyState('No skateparks here', 'Add a park you want to visit or change your filters.', '<button class="btn primary" data-action="parks.add">Add skatepark</button>');
  refreshIcons();
};

Actions['parks.tab'] = data => { State.parks.tab = data.tab; Views.skateparks($('#view')); refreshIcons(); };

Views.skateparks = function (root) {
  const s = State.parks;
  root.innerHTML = `
    ${pageHead('Skatepark Finder', 'Save parks you want to ride, rate the ones you have visited.', `<button class="btn primary" data-action="parks.add">${icon('plus')} Add skatepark</button>`)}
    <div class="demo-note">Parks marked "Sample info" are made-up examples. Edit them or add your own real spots.</div>
    <div class="toolbar">
      <input class="grow" type="search" placeholder="Search skateparks" value="${esc(s.q)}" data-bind="parks.q" aria-label="Search skateparks">
      <select data-bind="parks.type" aria-label="Filter by type">${optionList(PARK_TYPES, s.type, 'All types')}</select>
    </div>
    <div class="chips" style="margin-bottom:18px">${['All', 'Favorites', 'Visited', 'Bucket list'].map(t => `<button class="chip ${s.tab === t ? 'active' : ''}" data-action="parks.tab" data-tab="${t}">${t}</button>`).join('')}</div>
    <div id="list"></div>`;
  Lists.parks();
};
