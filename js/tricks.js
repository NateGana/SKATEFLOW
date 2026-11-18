/* tricks.js — the Trick Library. All attempts and landings are typed in by the user. */

State.tricks = { q: '', cat: 'All', status: '' };

function trickCard(t) {
  const p = Stats.trickProgress(t);
  return `<div class="card item-card link-card" data-action="tricks.open" data-id="${t.id}" tabindex="0">
    <div class="thumb ${t.category}">${boardSvg(t.category === 'Expert' ? '#E45B5B' : t.category === 'Beginner' ? '#55B879' : '#FF6B35')}</div>
    <h3>${esc(t.name)}</h3>
    <div class="chips" style="margin-bottom:8px"><span class="badge accent">${t.category}</span><span class="badge">${esc(t.difficulty)}</span>${t.custom ? '<span class="badge yellow">Custom</span>' : ''}</div>
    <p class="desc">${esc(t.description)}</p>
    <div class="foot">
      <div class="progress-row"><span class="badge ${t.status === 'Mastered' ? 'ok' : t.status === 'Not Started' ? '' : 'yellow'}">${t.status}</span><span class="muted">${p}%</span></div>
      ${progressBar(p, t.status === 'Mastered' ? 'ok' : '')}
    </div></div>`;
}

Lists.tricks = function () {
  const s = State.tricks;
  const q = s.q.toLowerCase();
  const list = Store.all('tricks').filter(t =>
    (s.cat === 'All' || t.category === s.cat) && (!s.status || t.status === s.status) &&
    (!q || (t.name + ' ' + t.description).toLowerCase().includes(q)));
  const box = $('#list');
  if (box) box.innerHTML = list.length ? `<div class="grid g3">${list.map(trickCard).join('')}</div>`
    : emptyState('No tricks match', 'Try a different search or filter, or add your own trick.', '<button class="btn primary" data-action="tricks.add">Add custom trick</button>');
  refreshIcons();
};

Views.tricks = function (root) {
  const s = State.tricks;
  root.innerHTML = `
    ${pageHead('Trick Library', 'Pick a trick, follow the checklist, and track every attempt.', `<button class="btn primary" data-action="tricks.add">${icon('plus')} Add custom trick</button>`)}
    <div class="toolbar">
      <input class="grow" type="search" placeholder="Search tricks" value="${esc(s.q)}" data-bind="tricks.q" aria-label="Search tricks">
      <select data-bind="tricks.status" aria-label="Filter by status">${optionList(TRICK_STATUSES, s.status, 'All statuses')}</select>
    </div>
    <div class="chips" style="margin-bottom:18px">${['All'].concat(LEVELS).map(c => `<button class="chip ${s.cat === c ? 'active' : ''}" data-action="tricks.cat" data-cat="${c}">${c}</button>`).join('')}</div>
    <div id="list"></div>`;
  Lists.tricks();
};

Actions['tricks.cat'] = data => { State.tricks.cat = data.cat; Views.tricks($('#view')); refreshIcons(); };

Actions['tricks.add'] = () => {
  formModal({
    title: 'Add custom trick',
    fields: [
      { name: 'name', label: 'Trick name', required: true, full: true },
      { name: 'category', label: 'Category', type: 'select', options: LEVELS },
      { name: 'description', label: 'Short description', type: 'textarea', rows: 3, full: true },
      { name: 'notes', label: 'Learning notes', type: 'textarea', rows: 3, full: true }
    ],
    onSave: v => {
      if (Store.all('tricks').some(t => t.name.toLowerCase() === v.name.toLowerCase())) return 'You already have a trick with that name.';
      Store.add('tricks', {
        name: v.name, category: v.category, difficulty: DIFFICULTY_LABEL[v.category], description: v.description || 'Custom trick.', notes: v.notes,
        status: 'Not Started', attempts: 0, landings: 0, firstLanded: '', personalNotes: '', custom: true,
        checklist: DEFAULT_CHECKLIST.map(text => ({ text, done: false }))
      });
      toast('Trick added.'); App.render();
    }
  });
};

function showTrick(id) {
  const t = Store.find('tricks', id);
  if (!t) return;
  const p = Stats.trickProgress(t);
  const rate = t.attempts ? Math.round((t.landings / t.attempts) * 100) : 0;
  openModal({
    title: t.name, wide: true,
    body: `
      <div class="chips" style="margin-bottom:10px"><span class="badge accent">${t.category}</span><span class="badge">Difficulty: ${esc(t.difficulty)}</span><span class="badge yellow">${t.status}</span></div>
      <p>${esc(t.description)}</p>
      ${t.notes ? `<p class="muted"><strong>Learning notes:</strong> ${esc(t.notes)}</p>` : ''}
      <div class="progress-row"><span>Progress</span><span>${p}%</span></div>${progressBar(p)}
      <div class="kv"><div><b>${t.attempts}</b><span>Attempts</span></div><div><b>${t.landings}</b><span>Landings</span></div><div><b>${rate}%</b><span>Success rate</span></div></div>
      <div class="row" style="margin-bottom:16px">
        <button class="btn" data-action="tricks.attempt" data-id="${t.id}">+1 attempt (missed)</button>
        <button class="btn primary" data-action="tricks.land" data-id="${t.id}">+1 landed</button>
      </div>
      <label class="field" style="margin-bottom:16px"><span>Status</span>
        <select data-action="tricks.status" data-id="${t.id}" id="trickStatus">${optionList(TRICK_STATUSES, t.status)}</select></label>
      <div class="row" style="margin-bottom:16px">
        <button class="btn" data-action="tricks.mark" data-id="${t.id}" data-status="Landed">Mark as landed</button>
        <button class="btn" data-action="tricks.mark" data-id="${t.id}" data-status="Mastered">Mark as mastered</button>
      </div>
      <h4 style="margin-bottom:6px">Practice checklist</h4>
      ${t.checklist.map((c, i) => `<label class="check ${c.done ? 'done' : ''}"><input type="checkbox" ${c.done ? 'checked' : ''} data-action="tricks.check" data-id="${t.id}" data-index="${i}"><span>${esc(c.text)}</span></label>`).join('')}
      <div class="form-grid" style="margin-top:16px">
        <label class="field"><span>Date first landed</span><input type="date" id="trickFirst" value="${esc(t.firstLanded)}"></label>
        <label class="field full"><span>Personal notes</span><textarea id="trickNotes" rows="3">${esc(t.personalNotes)}</textarea></label>
        <div class="form-actions">
          ${t.custom ? `<button class="btn danger" data-action="tricks.delete" data-id="${t.id}">Delete trick</button>` : ''}
          <button class="btn primary" data-action="tricks.saveNotes" data-id="${t.id}">Save notes and date</button>
        </div>
      </div>`
  });
}

Actions['tricks.open'] = data => showTrick(data.id);

function refreshTrick(id) { showTrick(id); App.render(); }

Actions['tricks.attempt'] = data => {
  const t = Store.find('tricks', data.id);
  const patch = { attempts: t.attempts + 1 };
  if (t.status === 'Not Started') patch.status = 'Learning';
  Store.update('tricks', t.id, patch); refreshTrick(t.id);
};

Actions['tricks.land'] = data => {
  const t = Store.find('tricks', data.id);
  const patch = { attempts: t.attempts + 1, landings: t.landings + 1 };
  if (!t.firstLanded) patch.firstLanded = todayISO();
  if (t.status !== 'Landed' && t.status !== 'Mastered') patch.status = 'Landed';
  Store.update('tricks', t.id, patch);
  toast('Landing recorded.'); refreshTrick(t.id);
};

Actions['tricks.status'] = (data, el) => {
  // This select reports through the "change" event (see app.js).
  const t = Store.find('tricks', data.id);
  const patch = { status: el.value };
  if ((el.value === 'Landed' || el.value === 'Mastered') && !t.firstLanded) patch.firstLanded = todayISO();
  Store.update('tricks', t.id, patch); refreshTrick(t.id);
};

Actions['tricks.mark'] = data => {
  const t = Store.find('tricks', data.id);
  const patch = { status: data.status };
  if (!t.firstLanded) patch.firstLanded = todayISO();
  if (!t.landings) { patch.landings = 1; patch.attempts = Math.max(1, t.attempts); }
  Store.update('tricks', t.id, patch);
  toast(`${t.name} marked as ${data.status.toLowerCase()}.`); refreshTrick(t.id);
};

Actions['tricks.check'] = (data, el) => {
  const t = Store.find('tricks', data.id);
  t.checklist[Number(data.index)].done = el.checked;
  Store.update('tricks', t.id, { checklist: t.checklist }); refreshTrick(t.id);
};

Actions['tricks.saveNotes'] = data => {
  Store.update('tricks', data.id, { personalNotes: $('#trickNotes').value.trim(), firstLanded: $('#trickFirst').value });
  toast('Notes saved.'); App.render();
};

Actions['tricks.delete'] = data => {
  confirmDialog('This custom trick and its records will be deleted.', () => {
    Store.remove('tricks', data.id); closeModal(); toast('Trick deleted.', 'info'); App.render();
  });
};
