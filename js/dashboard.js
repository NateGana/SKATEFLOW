/* dashboard.js — the home page. Every number here comes from the saved records. */

const LEVEL_FOCUS = {
  Beginner: ['Beginner'],
  Intermediate: ['Beginner', 'Intermediate'],
  Advanced: ['Intermediate', 'Advanced'],
  Expert: ['Advanced', 'Expert']
};

// Pick tricks to practice next, based on the skill level and what is not finished yet.
function recommendedTricks(limit = 4) {
  const level = Store.read('profile', {}).level || 'Beginner';
  const focus = LEVEL_FOCUS[level] || ['Beginner'];
  const open = Store.all('tricks').filter(t => t.status !== 'Landed' && t.status !== 'Mastered' && focus.includes(t.category));
  const inProgress = open.filter(t => t.status !== 'Not Started');
  const fresh = open.filter(t => t.status === 'Not Started').sort((a, b) => (a.category === level ? -1 : 1) - (b.category === level ? -1 : 1));
  return inProgress.concat(fresh).slice(0, limit);
}

function sessionRow(s) {
  const d = parseISO(s.date);
  return `<div class="item">
    <div class="date-block"><b>${d.getDate()}</b><span>${d.toLocaleDateString('en-US', { month: 'short' })}</span></div>
    <div class="body">
      <h4>${esc(s.title)}</h4>
      <div class="muted small">${esc(s.location || 'No location')} · ${fmtDuration(s.duration)}</div>
      <div class="chips" style="margin-top:6px"><span class="badge accent">${esc(s.type)}</span>${splitList(s.tricksPracticed).slice(0, 3).map(t => `<span class="badge">${esc(t)}</span>`).join('')}</div>
    </div></div>`;
}

Views.dashboard = function (root) {
  const profile = Store.read('profile', {});
  const sessions = Stats.sessions();
  const tricks = Store.all('tricks');
  const goals = Store.all('goals').filter(g => g.status === 'active');
  const quote = QUOTES[new Date().getDate() % QUOTES.length];
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const learning = tricks.filter(t => t.status === 'Learning' || t.status === 'Practicing');
  const next = recommendedTricks();

  const stat = (label, ic, value, note = '') => `<div class="card stat"><div class="label">${icon(ic)} ${label}</div><div class="value">${value}</div><div class="note">${note}</div></div>`;

  root.innerHTML = `
    <section class="hero">
      <h1>What's up, ${esc(profile.name || 'Skater')}?</h1>
      <p class="sub">Ready to hit the streets and improve your skills?</p>
      <div class="meta">${today}</div>
      <blockquote>${esc(quote)}</blockquote>
      <div class="hero-board">${boardSvg()}</div>
    </section>

    <div class="quick">
      <button class="btn primary" data-action="quick.session">${icon('plus')} Start New Session</button>
      <button class="btn" data-action="quick.trick">${icon('layers')} Add New Trick</button>
      <button class="btn" data-action="quick.goal">${icon('target')} Set a Goal</button>
      <button class="btn" data-action="quick.journal">${icon('notebook-pen')} Write Journal Entry</button>
    </div>

    <div class="grid g3" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,148px),1fr));margin-bottom:16px">
      ${stat('Skate Sessions', 'timer', sessions.length)}
      ${stat('Hours Skated', 'clock', fmtHours(Stats.totalMinutes()), 'h')}
      ${stat('Tricks Learned', 'check-circle', Stats.learned().length, `of ${tricks.length}`)}
      ${stat('Current Streak', 'flame', Stats.streak(), 'days')}
      ${stat('Personal Best', 'award', Stats.personalBest() ? fmtDuration(Stats.personalBest()) : '–', 'longest session')}
      ${stat('Overall Progress', 'gauge', Stats.overallProgress() + '<small>%</small>', 'across all tricks')}
    </div>

    <div class="split" style="margin-bottom:16px">
      <div class="card"><div class="card-head"><h3>Weekly Activity</h3><span class="muted small">hours, last 7 days</span></div>
        <div class="chart-box"><canvas id="weeklyChart"></canvas></div></div>
      <div class="card"><div class="card-head"><h3>Recommended Next Steps</h3></div>
        ${next.length ? `<div class="list">${next.map(t => `<div class="item"><div class="body"><h4>${esc(t.name)}</h4><div class="muted small">${t.category} · ${t.status}</div></div><button class="btn sm" data-action="tricks.open" data-id="${t.id}">View</button></div>`).join('')}</div>`
          : emptyState('Nothing left at this level', 'Update your skill level in My Progress to see new suggestions.')}
      </div>
    </div>

    <div class="grid g3">
      <div class="card"><div class="card-head"><h3>Recent Skate Sessions</h3><a class="btn sm ghost" href="#/sessions">All</a></div>
        ${sessions.length ? sessions.slice(0, 4).map(sessionRow).join('') : emptyState('No sessions yet', 'Log your first session to start your stats.', '<button class="btn primary" data-action="quick.session">Start New Session</button>')}
      </div>
      <div class="card"><div class="card-head"><h3>Trick Progress</h3><a class="btn sm ghost" href="#/tricks">Library</a></div>
        ${learning.length ? learning.slice(0, 5).map(t => { const p = Stats.trickProgress(t); return `<div style="margin-bottom:14px"><div class="progress-row"><strong>${esc(t.name)}</strong><span class="muted">${t.status} · ${p}%</span></div>${progressBar(p)}</div>`; }).join('')
          : emptyState('No tricks in progress', 'Open the Trick Library and set a trick to Learning.', '<a class="btn" href="#/tricks">Open Trick Library</a>')}
      </div>
      <div class="card"><div class="card-head"><h3>Current Goals</h3><a class="btn sm ghost" href="#/goals">All</a></div>
        ${goals.length ? goals.slice(0, 4).map(g => { const p = pct(g.current, g.target); return `<div style="margin-bottom:14px"><div class="progress-row"><strong>${esc(g.name)}</strong><span class="muted">${p}%</span></div>${progressBar(p)}</div>`; }).join('')
          : emptyState('No active goals', 'Set a goal to keep yourself motivated.', '<button class="btn primary" data-action="quick.goal">Set a Goal</button>')}
      </div>
    </div>`;

  const week = Stats.lastSevenDays();
  drawChart('weeklyChart', {
    type: 'bar',
    data: { labels: week.map(d => d.label), datasets: [{ label: 'Hours', data: week.map(d => d.hours), backgroundColor: ACCENT, borderRadius: 6 }] },
    options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
  });
};

// Quick actions: go to the right page, then open the form.
Actions['quick.session'] = () => { App.go('sessions'); Actions['sessions.add'](); };
Actions['quick.trick'] = () => { App.go('tricks'); Actions['tricks.add'](); };
Actions['quick.goal'] = () => { App.go('goals'); Actions['goals.add'](); };
Actions['quick.journal'] = () => { App.go('journal'); Actions['journal.add'](); };
