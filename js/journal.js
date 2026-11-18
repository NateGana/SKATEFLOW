/* journal.js — a private skating diary. Entries stay in this browser only. */

State.journal = { q: '', tag: '' };

function journalFields() {
  const sessions = Stats.sessions().map(s => ({ value: s.id, label: `${fmtDate(s.date, { month: 'short', day: 'numeric' })} · ${s.title}` }));
  return [
    { name: 'title', label: 'Title', required: true, full: true },
    { name: 'date', label: 'Date', type: 'date', required: true, default: todayISO() },
    { name: 'mood', label: 'Mood', type: 'select', options: SESSION_MOODS },
    { name: 'description', label: 'What happened?', type: 'textarea', rows: 7, required: true, full: true },
    { name: 'sessionId', label: 'Related skate session (optional)', type: 'select', options: [{ value: '', label: 'None' }].concat(sessions) },
    { name: 'tags', label: 'Tags', placeholder: 'first-trick, skatepark' },
    { name: 'image', label: 'Image (optional)', type: 'image', full: true, hint: 'Under 600 KB.' }
  ];
}

function cleanEntry(v) {
  v.tags = splitList(v.tags).map(t => t.replace(/^#/, '').toLowerCase());
  return v;
}

Actions['journal.add'] = () => {
  formModal({
    title: 'New journal entry', wide: true, fields: journalFields(), submitLabel: 'Save entry',
    onSave: v => { if (v.date > todayISO()) return 'The date cannot be in the future.'; Store.add('journal', cleanEntry(v)); toast('Entry saved.'); App.render(); }
  });
};

Actions['journal.edit'] = data => {
  const e = Store.find('journal', data.id);
  formModal({
    title: 'Edit journal entry', wide: true, fields: journalFields(), values: Object.assign({}, e, { tags: (e.tags || []).join(', ') }), submitLabel: 'Save changes',
    onSave: v => { Store.update('journal', e.id, cleanEntry(v)); toast('Entry updated.'); App.render(); }
  });
};

Actions['journal.delete'] = data => {
  confirmDialog('This journal entry will be permanently deleted.', () => { Store.remove('journal', data.id); toast('Entry deleted.', 'info'); App.render(); });
};

function journalEntry(e) {
  const d = parseISO(e.date);
  const session = e.sessionId ? Store.find('sessions', e.sessionId) : null;
  return `<article class="entry">
    <div class="when"><b>${d.getDate()}</b>${d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}<br><span class="muted small">${esc(e.mood)}</span></div>
    <div>
      <h2>${esc(e.title)}</h2>
      ${e.image ? `<img src="${esc(e.image)}" alt="" onerror="this.remove()">` : ''}
      <div class="text">${esc(e.description)}</div>
      <div class="row" style="margin-top:12px">
        ${session ? `<span class="badge">Session: ${esc(session.title)}</span>` : ''}
        ${(e.tags || []).map(t => `<span class="tag">#${esc(t)}</span>`).join(' ')}
      </div>
      <div class="actions" style="margin-top:12px">
        <button class="btn sm" data-action="journal.edit" data-id="${e.id}">Edit</button>
        <button class="btn sm danger" data-action="journal.delete" data-id="${e.id}">Delete</button>
      </div>
    </div></article>`;
}

Lists.journal = function () {
  const s = State.journal, q = s.q.toLowerCase();
  const list = Store.all('journal').filter(e => (!s.tag || (e.tags || []).includes(s.tag)) &&
    (!q || [e.title, e.description, (e.tags || []).join(' ')].join(' ').toLowerCase().includes(q))).sort((a, b) => b.date.localeCompare(a.date));
  const box = $('#list');
  if (!box) return;
  box.innerHTML = list.length ? list.map(journalEntry).join('')
    : emptyState(Store.all('journal').length ? 'No entries match' : 'Your journal is empty', Store.all('journal').length ? 'Try a different search or tag.' : 'Write about your first trick, a great session, or what you want to learn next.', '<button class="btn primary" data-action="journal.add">Write an entry</button>');
};

Views.journal = function (root) {
  const tags = Array.from(new Set(Store.all('journal').flatMap(e => e.tags || []))).sort();
  root.innerHTML = `
    ${pageHead('Skate Journal', 'A private diary of your skating journey. Entries stay on this device.', `<button class="btn primary" data-action="journal.add">${icon('plus')} New entry</button>`)}
    <div class="toolbar">
      <input class="grow" type="search" placeholder="Search entries" value="${esc(State.journal.q)}" data-bind="journal.q" aria-label="Search journal">
      <select data-bind="journal.tag" aria-label="Filter by tag">${optionList(tags, State.journal.tag, 'All tags')}</select>
    </div>
    <div id="list"></div>`;
  Lists.journal();
};
