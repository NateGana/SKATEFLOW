/* challenges.js — join challenges, track progress, earn badges */

State.challenges = { tab: 'Available' };

// Challenges with a metric are counted from your own records since the day you joined.
function challengeProgress(c) {
  if (c.status === 'completed') return c.progress;
  if (c.status !== 'active') return 0;
  const since = c.startDate || '0000-00-00';
  switch (c.metric) {
    case 'sessions': return Store.all('sessions').filter(s => s.date >= since).length;
    case 'hours': return Math.round(Store.all('sessions').filter(s => s.date >= since).reduce((n, s) => n + (Number(s.duration) || 0), 0) / 6) / 10;
    case 'tricksLanded': return Store.all('tricks').filter(t => t.firstLanded && t.firstLanded >= since).length;
    case 'trick': return Store.all('tricks').some(t => t.name === c.metricArg && (t.status === 'Landed' || t.status === 'Mastered')) ? 1 : 0;
    case 'parks': return Store.all('skateparks').filter(p => p.visited && p.visitedDate && p.visitedDate >= since).length;
    case 'streak': return Stats.streak();
    default: return c.progress || 0;
  }
}

Actions['challenges.join'] = data => {
  const c = Store.find('challenges', data.id);
  const now = new Date();
  let start = toISO(now), end = toISO(addDays(now, c.durationDays || 7));
  // "This month" style challenge: run for the calendar month.
  if (c.metric === 'hours' && !c.custom) {
    start = toISO(new Date(now.getFullYear(), now.getMonth(), 1));
    end = toISO(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  }
  Store.update('challenges', c.id, { status: 'active', startDate: start, endDate: end, progress: 0 });
  State.challenges.tab = 'Active';
  toast('Challenge joined. Good luck!'); App.render();
};

Actions['challenges.leave'] = data => {
  confirmDialog('Your progress in this challenge will be reset.', () => {
    Store.update('challenges', data.id, { status: 'available', progress: 0, startDate: '', endDate: '' }); toast('Challenge left.', 'info'); App.render();
  }, 'Leave');
};

Actions['challenges.plus'] = data => {
  const c = Store.find('challenges', data.id);
  Store.update('challenges', c.id, { progress: Math.min(c.target, (c.progress || 0) + 1) }); App.render();
};

Actions['challenges.complete'] = data => {
  const c = Store.find('challenges', data.id);
  const value = Math.min(challengeProgress(c), c.target);
  Store.update('challenges', c.id, { status: 'completed', progress: value, completedDate: todayISO() });
  State.challenges.tab = 'Completed';
  toast(`Badge earned: ${c.name}`); App.render();
};

Actions['challenges.delete'] = data => {
  confirmDialog('This custom challenge will be deleted.', () => { Store.remove('challenges', data.id); toast('Challenge deleted.', 'info'); App.render(); });
};

Actions['challenges.tab'] = data => { State.challenges.tab = data.tab; App.render(); };

Actions['challenges.add'] = (data, el, event, preset = {}) => {
  formModal({
    title: 'Create custom challenge', values: preset, submitLabel: 'Create challenge',
    fields: [
      { name: 'name', label: 'Challenge name', required: true, full: true },
      { name: 'description', label: 'Description', type: 'textarea', rows: 3, full: true },
      { name: 'difficulty', label: 'Difficulty', type: 'select', options: LEVELS },
      { name: 'target', label: 'Target', type: 'number', min: 1, required: true },
      { name: 'unit', label: 'Unit', placeholder: 'days, tricks, sessions...' },
      { name: 'durationDays', label: 'Length (days)', type: 'number', min: 1, max: 365, default: 14 }
    ],
    onSave: v => {
      Store.add('challenges', { name: v.name, description: v.description, difficulty: v.difficulty, target: v.target, unit: v.unit || 'steps', metric: 'manual', durationDays: v.durationDays || 14, status: 'available', progress: 0, startDate: '', endDate: '', completedDate: '', custom: true });
      State.challenges.tab = 'Available';
      toast('Challenge created.'); App.render();
    }
  });
};

function challengeCard(c) {
  const value = challengeProgress(c);
  const p = pct(value, c.target);
  const ended = c.status === 'active' && c.endDate && c.endDate < todayISO();
  let buttons = '';
  if (c.status === 'available') buttons = `<button class="btn sm primary" data-action="challenges.join" data-id="${c.id}">Join challenge</button>`;
  if (c.status === 'active') {
    if (c.metric === 'manual') buttons += `<button class="btn sm" data-action="challenges.plus" data-id="${c.id}">+1 ${esc(c.unit)}</button>`;
    buttons += `<button class="btn sm ${value >= c.target ? 'primary' : ''}" data-action="challenges.complete" data-id="${c.id}">${value >= c.target ? 'Claim badge' : 'Mark complete'}</button>`;
    buttons += `<button class="btn sm" data-action="challenges.leave" data-id="${c.id}">Leave</button>`;
  }
  if (c.custom && c.status !== 'active') buttons += `<button class="btn sm danger" data-action="challenges.delete" data-id="${c.id}">Delete</button>`;
  return `<div class="card item-card">
    <div class="row spread"><h3>${esc(c.name)}</h3>${c.status === 'completed' ? icon('medal') : ''}</div>
    <div class="chips" style="margin-bottom:8px"><span class="badge accent">${c.difficulty}</span>${c.custom ? '<span class="badge yellow">Custom</span>' : ''}${ended ? '<span class="badge danger">Past end date</span>' : ''}${c.status === 'completed' ? `<span class="badge ok">Completed ${fmtDate(c.completedDate, { month: 'short', day: 'numeric' })}</span>` : ''}</div>
    <p class="desc">${esc(c.description)}</p>
    ${c.startDate ? `<p class="muted small">${fmtDate(c.startDate, { month: 'short', day: 'numeric' })} to ${fmtDate(c.endDate, { month: 'short', day: 'numeric' })}</p>` : `<p class="muted small">Target: ${c.target} ${esc(c.unit)}</p>`}
    <div class="foot">${c.status !== 'available' ? `<div><div class="progress-row"><span>${value} / ${c.target} ${esc(c.unit)}</span><span class="muted">${p}%</span></div>${progressBar(p, c.status === 'completed' ? 'ok' : '')}</div>` : ''}
      <div class="actions">${buttons}</div></div></div>`;
}

Views.challenges = function (root) {
  const all = Store.all('challenges');
  const tab = State.challenges.tab;
  const map = { Available: 'available', Active: 'active', Completed: 'completed' };
  const list = all.filter(c => c.status === map[tab]);
  const done = all.filter(c => c.status === 'completed');
  root.innerHTML = `
    ${pageHead('Challenges', 'Join a challenge, track your progress, and collect badges.', `<button class="btn primary" data-action="challenges.add">${icon('plus')} Custom challenge</button>`)}
    ${done.length ? `<div class="badge-shelf">${done.map(c => `<div class="medal">${icon('medal')} ${esc(c.name)}</div>`).join('')}</div>` : ''}
    <div class="chips" style="margin-bottom:18px">${Object.keys(map).map(t => `<button class="chip ${tab === t ? 'active' : ''}" data-action="challenges.tab" data-tab="${t}">${t} (${all.filter(c => c.status === map[t]).length})</button>`).join('')}</div>
    ${list.length ? `<div class="grid g3">${list.map(challengeCard).join('')}</div>` : emptyState(`No ${tab.toLowerCase()} challenges`, tab === 'Completed' ? 'Finish a challenge to earn your first badge.' : 'Join one from the Available tab or create your own.')}`;
};
