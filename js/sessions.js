/* sessions.js — log, edit, search and filter skate sessions */

const SESSION_TYPES = ['Street Skating', 'Skatepark', 'Freestyle', 'Cruising', 'Training', 'Competition', 'Casual Session', 'Other'];
const SESSION_MOODS = ['Stoked', 'Good', 'Okay', 'Tired', 'Frustrated'];
const SESSION_DIFFICULTY = ['Easy', 'Medium', 'Hard'];
const WEATHER = ['', 'Sunny', 'Cloudy', 'Rainy', 'Windy', 'Hot', 'Cold', 'Indoor'];

State.sessions = { q: '', type: '', date: '', sort: 'newest' };

// Minutes between two "HH:MM" times. If the end is earlier, we assume the session went past midnight.
function calcDuration(start, end) {
  if (!start || !end) return null;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let minutes = (eh * 60 + em) - (sh * 60 + sm);
  if (minutes < 0) minutes += 24 * 60;
  return minutes;
}

function sessionFields() {
  return [
    { name: 'title', label: 'Session title', required: true, full: true, placeholder: 'For example: Evening kickflip practice' },
    { name: 'date', label: 'Date', type: 'date', required: true, default: todayISO() },
    { name: 'location', label: 'Location', placeholder: 'Park, street, or spot' },
    { name: 'startTime', label: 'Start time', type: 'time' },
    { name: 'endTime', label: 'End time', type: 'time' },
    { name: 'duration', label: 'Duration (minutes)', type: 'number', min: 1, max: 1440, hint: 'Filled in automatically when you enter start and end times.' },
    { name: 'distance', label: 'Distance (km, optional)', type: 'number', min: 0, step: 'any' },
    { name: 'type', label: 'Session type', type: 'select', options: SESSION_TYPES },
    { name: 'weather', label: 'Weather (optional)', type: 'select', options: WEATHER },
    { name: 'tricksPracticed', label: 'Tricks practiced', full: true, placeholder: 'Separate with commas: Ollie, Kickflip' },
    { name: 'tricksLanded', label: 'Tricks landed', full: true, placeholder: 'Separate with commas' },
    { name: 'difficulty', label: 'Difficulty', type: 'select', options: SESSION_DIFFICULTY },
    { name: 'mood', label: 'Mood', type: 'select', options: SESSION_MOODS },
    { name: 'notes', label: 'Notes', type: 'textarea', full: true }
  ];
}

// Keep the duration box in sync when the user changes the times.
function syncDuration(name, form) {
  if (name !== 'startTime' && name !== 'endTime') return;
  const minutes = calcDuration(form.elements.startTime.value, form.elements.endTime.value);
  if (minutes !== null) form.elements.duration.value = minutes;
}

function validateSession(v) {
  const calculated = calcDuration(v.startTime, v.endTime);
  if ((v.startTime && !v.endTime) || (!v.startTime && v.endTime)) return 'Enter both a start time and an end time, or leave both empty.';
  if (calculated !== null) {
    if (calculated === 0) return 'Start and end time are the same. The session needs a duration.';
    v.duration = calculated;
  }
  if (!v.duration || v.duration < 1) return 'Enter a duration, or a start and end time.';
  if (v.duration > 1440) return 'A session cannot be longer than 24 hours.';
  if (v.date > todayISO()) return 'The date cannot be in the future.';
  return '';
}

Actions['sessions.add'] = () => {
  formModal({
    title: 'New skate session', wide: true, fields: sessionFields(), onInput: syncDuration, submitLabel: 'Save session',
    onSave: v => {
      const error = validateSession(v);
      if (error) return error;
      Store.add('sessions', v);
      toast('Session saved.'); App.render();
    }
  });
};

Actions['sessions.edit'] = data => {
  const s = Store.find('sessions', data.id);
  formModal({
    title: 'Edit session', wide: true, fields: sessionFields(), values: s, onInput: syncDuration, submitLabel: 'Save changes',
    onSave: v => {
      const error = validateSession(v);
      if (error) return error;
      Store.update('sessions', s.id, v);
      toast('Session updated.'); App.render();
    }
  });
};

Actions['sessions.delete'] = data => {
  confirmDialog('This session will be removed from your history and stats.', () => {
    Store.remove('sessions', data.id); closeModal(); toast('Session deleted.', 'info'); App.render();
  });
};

Actions['sessions.view'] = data => {
  const s = Store.find('sessions', data.id);
  if (!s) return;
  const row = (label, value) => value ? `<div><span class="muted small">${label}</span><div>${esc(value)}</div></div>` : '';
  openModal({
    title: s.title,
    body: `<div class="chips" style="margin-bottom:14px"><span class="badge accent">${esc(s.type)}</span><span class="badge">${esc(s.mood)}</span><span class="badge">${esc(s.difficulty)}</span></div>
      <div class="form-grid" style="gap:12px">
        ${row('Date', fmtDate(s.date))}${row('Time', s.startTime ? `${s.startTime} to ${s.endTime}` : '')}${row('Duration', fmtDuration(s.duration))}
        ${row('Location', s.location)}${row('Weather', s.weather)}${row('Distance', s.distance ? s.distance + ' km' : '')}
        ${row('Tricks practiced', s.tricksPracticed)}${row('Tricks landed', s.tricksLanded)}
        ${s.notes ? `<div class="full"><span class="muted small">Notes</span><div style="white-space:pre-wrap">${esc(s.notes)}</div></div>` : ''}
      </div>
      <div class="form-actions" style="margin-top:18px">
        <button class="btn danger" data-action="sessions.delete" data-id="${s.id}">Delete</button>
        <button class="btn primary" data-action="sessions.edit" data-id="${s.id}">Edit</button>
      </div>`
  });
};

function sessionCard(s) {
  const d = parseISO(s.date);
  return `<div class="card"><div class="item" style="padding:0;border:0">
    <div class="date-block"><b>${d.getDate()}</b><span>${d.toLocaleDateString('en-US', { month: 'short' })} ${d.getFullYear()}</span></div>
    <div class="body">
      <h4>${esc(s.title)}</h4>
      <div class="muted small">${esc(s.location || 'No location')} · ${fmtDuration(s.duration)}${s.startTime ? ` · ${s.startTime}–${s.endTime}` : ''}</div>
      <div class="chips" style="margin:8px 0"><span class="badge accent">${esc(s.type)}</span><span class="badge">${esc(s.mood)}</span>${splitList(s.tricksPracticed).map(t => `<span class="badge">${esc(t)}</span>`).join('')}</div>
      <div class="actions">
        <button class="btn sm" data-action="sessions.view" data-id="${s.id}">Details</button>
        <button class="btn sm" data-action="sessions.edit" data-id="${s.id}">Edit</button>
        <button class="btn sm danger" data-action="sessions.delete" data-id="${s.id}">Delete</button>
      </div>
    </div></div></div>`;
}

Lists.sessions = function () {
  const s = State.sessions, q = s.q.toLowerCase();
  let list = Store.all('sessions').filter(x =>
    (!s.type || x.type === s.type) && (!s.date || x.date === s.date) &&
    (!q || [x.title, x.location, x.tricksPracticed, x.notes].join(' ').toLowerCase().includes(q)));
  const sorters = {
    newest: (a, b) => b.date.localeCompare(a.date), oldest: (a, b) => a.date.localeCompare(b.date),
    longest: (a, b) => b.duration - a.duration, shortest: (a, b) => a.duration - b.duration
  };
  list = list.sort(sorters[s.sort] || sorters.newest);
  const box = $('#list');
  if (!box) return;
  box.innerHTML = list.length ? `<div class="stack">${list.map(sessionCard).join('')}</div>`
    : emptyState(Store.all('sessions').length ? 'No sessions match' : 'No sessions yet', Store.all('sessions').length ? 'Try clearing your filters.' : 'Log your first session to start building your history.', '<button class="btn primary" data-action="sessions.add">New session</button>');
  refreshIcons();
};

Views.sessions = function (root) {
  const s = State.sessions;
  root.innerHTML = `
    ${pageHead('Skate Sessions', `${Store.all('sessions').length} sessions · ${fmtHours(Stats.totalMinutes())} hours skated`, `<button class="btn primary" data-action="sessions.add">${icon('plus')} New session</button>`)}
    <div class="toolbar">
      <input class="grow" type="search" placeholder="Search sessions" value="${esc(s.q)}" data-bind="sessions.q" aria-label="Search sessions">
      <select data-bind="sessions.type" aria-label="Filter by type">${optionList(SESSION_TYPES, s.type, 'All types')}</select>
      <input type="date" value="${esc(s.date)}" data-bind="sessions.date" aria-label="Filter by date">
      <select data-bind="sessions.sort" aria-label="Sort sessions">
        ${[['newest', 'Newest first'], ['oldest', 'Oldest first'], ['longest', 'Longest first'], ['shortest', 'Shortest first']].map(([v, l]) => `<option value="${v}"${s.sort === v ? ' selected' : ''}>${l}</option>`).join('')}
      </select>
    </div>
    <div id="list"></div>`;
  Lists.sessions();
};
