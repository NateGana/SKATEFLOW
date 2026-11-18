/* goals.js — set goals, track progress, pause / complete them */

const GOAL_CATEGORIES = ['Tricks', 'Sessions', 'Hours', 'Skateparks', 'Consistency', 'Other'];
const GOAL_PRIORITIES = ['Low', 'Medium', 'High'];

State.goals = { tab: 'active' };

function goalFields() {
  return [
    { name: 'name', label: 'Goal name', required: true, full: true, placeholder: 'For example: Land a kickflip' },
    { name: 'description', label: 'Description', type: 'textarea', rows: 2, full: true },
    { name: 'category', label: 'Category', type: 'select', options: GOAL_CATEGORIES },
    { name: 'priority', label: 'Priority', type: 'select', options: GOAL_PRIORITIES, default: 'Medium' },
    { name: 'target', label: 'Target value', type: 'number', min: 1, required: true, step: 'any' },
    { name: 'current', label: 'Current value', type: 'number', min: 0, step: 'any', default: 0 },
    { name: 'startDate', label: 'Start date', type: 'date', default: todayISO() },
    { name: 'targetDate', label: 'Target date', type: 'date' }
  ];
}

function validateGoal(v) {
  if (v.targetDate && v.startDate && v.targetDate < v.startDate) return 'The target date must be after the start date.';
  v.current = v.current === '' ? 0 : v.current;
  return '';
}

Actions['goals.add'] = () => {
  formModal({
    title: 'Set a goal', fields: goalFields(), submitLabel: 'Save goal',
    onSave: v => { const e = validateGoal(v); if (e) return e; Store.add('goals', Object.assign(v, { status: 'active' })); State.goals.tab = 'active'; toast('Goal saved.'); App.render(); }
  });
};

Actions['goals.edit'] = data => {
  const g = Store.find('goals', data.id);
  formModal({
    title: 'Edit goal', fields: goalFields(), values: g, submitLabel: 'Save changes',
    onSave: v => { const e = validateGoal(v); if (e) return e; Store.update('goals', g.id, v); toast('Goal updated.'); App.render(); }
  });
};

Actions['goals.update'] = data => {
  const g = Store.find('goals', data.id);
  formModal({
    title: 'Update progress', values: { current: g.current },
    fields: [{ name: 'current', label: `Current value for "${g.name}" (target ${g.target})`, type: 'number', min: 0, step: 'any', required: true, full: true }],
    onSave: v => { Store.update('goals', g.id, { current: v.current }); toast('Progress updated.'); App.render(); }
  });
};

Actions['goals.plus'] = data => { const g = Store.find('goals', data.id); Store.update('goals', g.id, { current: g.current + 1 }); App.render(); };

// Fill in the current value from your own records, for goals that match something we track.
Actions['goals.sync'] = data => {
  const g = Store.find('goals', data.id);
  const since = g.startDate || '0000-00-00';
  const inRange = Store.all('sessions').filter(s => s.date >= since);
  const values = {
    Tricks: Store.all('tricks').filter(t => t.firstLanded && t.firstLanded >= since).length,
    Sessions: inRange.length,
    Hours: Math.round(inRange.reduce((n, s) => n + (Number(s.duration) || 0), 0) / 6) / 10,
    Skateparks: Store.all('skateparks').filter(p => p.visited && p.visitedDate >= since).length
  };
  Store.update('goals', g.id, { current: values[g.category] });
  toast(`Updated from your records: ${values[g.category]}.`); App.render();
};

Actions['goals.status'] = data => {
  const g = Store.find('goals', data.id);
  const patch = { status: data.status };
  if (data.status === 'completed') patch.current = Math.max(g.current, g.target);
  Store.update('goals', g.id, patch);
  toast(data.status === 'completed' ? 'Goal completed. Nice work!' : data.status === 'paused' ? 'Goal paused.' : 'Goal resumed.', 'info');
  App.render();
};

Actions['goals.delete'] = data => {
  confirmDialog('This goal will be deleted.', () => { Store.remove('goals', data.id); toast('Goal deleted.', 'info'); App.render(); });
};

Actions['goals.tab'] = data => { State.goals.tab = data.tab; App.render(); };

function goalCard(g) {
  const p = pct(g.current, g.target);
  const canSync = ['Tricks', 'Sessions', 'Hours', 'Skateparks'].includes(g.category);
  const late = g.status === 'active' && g.targetDate && g.targetDate < todayISO();
  return `<div class="card item-card">
    <div class="row spread"><h3>${esc(g.name)}</h3>${g.status === 'completed' ? icon('check-circle') : ''}</div>
    <div class="chips" style="margin-bottom:8px"><span class="badge accent">${esc(g.category)}</span><span class="badge ${g.priority === 'High' ? 'danger' : ''}">${g.priority} priority</span>${late ? '<span class="badge danger">Past target date</span>' : ''}</div>
    ${g.description ? `<p class="desc">${esc(g.description)}</p>` : ''}
    <p class="muted small">${g.targetDate ? 'Target date: ' + fmtDate(g.targetDate) : 'No target date'}</p>
    <div class="foot">
      <div><div class="progress-row"><span>${g.current} / ${g.target}</span><span class="muted">${p}%</span></div>${progressBar(p, g.status === 'completed' ? 'ok' : '')}</div>
      <div class="actions">
        ${g.status === 'active' ? `<button class="btn sm" data-action="goals.plus" data-id="${g.id}">+1</button><button class="btn sm" data-action="goals.update" data-id="${g.id}">Set value</button>` : ''}
        ${g.status === 'active' && canSync ? `<button class="btn sm" data-action="goals.sync" data-id="${g.id}">Sync from records</button>` : ''}
        ${g.status === 'active' ? `<button class="btn sm primary" data-action="goals.status" data-id="${g.id}" data-status="completed">Complete</button><button class="btn sm" data-action="goals.status" data-id="${g.id}" data-status="paused">Pause</button>` : ''}
        ${g.status === 'paused' ? `<button class="btn sm primary" data-action="goals.status" data-id="${g.id}" data-status="active">Resume</button>` : ''}
        <button class="btn sm" data-action="goals.edit" data-id="${g.id}">Edit</button>
        <button class="btn sm danger" data-action="goals.delete" data-id="${g.id}">Delete</button>
      </div></div></div>`;
}

Views.goals = function (root) {
  const all = Store.all('goals');
  const tab = State.goals.tab;
  const tabs = [['active', 'Active'], ['paused', 'Paused'], ['completed', 'Completed']];
  const list = all.filter(g => g.status === tab);
  root.innerHTML = `
    ${pageHead('Goals', 'Set a target, update your progress, and finish what you start.', `<button class="btn primary" data-action="goals.add">${icon('plus')} Set a goal</button>`)}
    <div class="chips" style="margin-bottom:18px">${tabs.map(([k, l]) => `<button class="chip ${tab === k ? 'active' : ''}" data-action="goals.tab" data-tab="${k}">${l} (${all.filter(g => g.status === k).length})</button>`).join('')}</div>
    ${list.length ? `<div class="grid g3">${list.map(goalCard).join('')}</div>` : emptyState(`No ${tab} goals`, tab === 'active' ? 'Set a goal such as "Land a kickflip" or "Skate 20 hours this month".' : 'Nothing here yet.', tab === 'active' ? '<button class="btn primary" data-action="goals.add">Set a goal</button>' : '')}`;
};
