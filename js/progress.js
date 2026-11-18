/* progress.js — stats, charts, skill level and personal records */

// Personal records: use the number the user typed if there is one, otherwise calculate it from sessions.
function personalRecords() {
  const manual = Store.read('profile', {}).records || {};
  const sessions = Store.all('sessions');
  const calc = {
    longestSession: Stats.personalBest(),
    mostTricks: Math.max(0, ...sessions.map(s => Stats.landedCount(s))),
    longestDistance: Math.max(0, ...sessions.map(s => Number(s.distance) || 0))
  };
  return {
    longestSession: manual.longestSession !== undefined && manual.longestSession !== '' ? Number(manual.longestSession) : calc.longestSession,
    mostTricks: manual.mostTricks !== undefined && manual.mostTricks !== '' ? Number(manual.mostTricks) : calc.mostTricks,
    longestDistance: manual.longestDistance !== undefined && manual.longestDistance !== '' ? Number(manual.longestDistance) : calc.longestDistance,
    best: manual.best || ''
  };
}

Views.progress = function (root) {
  const profile = Store.read('profile', {});
  const sessions = Store.all('sessions');
  const records = personalRecords();
  const stat = (label, value, note = '') => `<div class="card stat"><div class="label">${label}</div><div class="value">${value}</div><div class="note">${note}</div></div>`;

  root.innerHTML = `
    ${pageHead('My Progress', 'See how much you have improved over time.')}
    <div class="card" style="margin-bottom:16px">
      <div class="card-head"><h3>Skill level</h3><span class="muted small">Update it as you improve</span></div>
      <div class="chips">${LEVELS.map(l => `<button class="chip ${profile.level === l ? 'active' : ''}" data-action="progress.level" data-level="${l}">${l}</button>`).join('')}</div>
    </div>

    <div class="grid g4" style="margin-bottom:16px">
      ${stat('Total sessions', sessions.length)}
      ${stat('Total hours', fmtHours(Stats.totalMinutes()) + '<small> h</small>')}
      ${stat('Total distance', (Math.round(Stats.totalDistance() * 10) / 10) + '<small> km</small>', 'only counts distance you entered')}
      ${stat('Average session', sessions.length ? fmtDuration(Stats.avgMinutes()) : '–')}
      ${stat('Tricks learned', Stats.learned().length)}
      ${stat('Practicing now', Stats.practicing().length)}
      ${stat('Hours this week', Stats.weekly(1)[0].hours + '<small> h</small>')}
      ${stat('Hours this month', fmtHours(Stats.thisMonthMinutes()) + '<small> h</small>')}
    </div>

    <div class="grid g2" style="margin-bottom:16px">
      <div class="card"><h3>Skating hours over time</h3><div class="chart-box"><canvas id="hoursChart"></canvas></div></div>
      <div class="card"><h3>Sessions per week</h3><div class="chart-box"><canvas id="sessionsChart"></canvas></div></div>
      <div class="card"><h3>Tricks learned over time</h3><div class="chart-box"><canvas id="learnedChart"></canvas></div></div>
      <div class="card"><h3>Skill progression</h3><div class="chart-box"><canvas id="levelChart"></canvas></div></div>
      <div class="card"><h3>Monthly activity</h3><div class="chart-box"><canvas id="monthChart"></canvas></div></div>
    </div>

    <div class="card">
      <div class="card-head"><h3>Personal records</h3><button class="btn sm" data-action="progress.records">${icon('pencil')} Edit</button></div>
      <div class="grid g4">
        <div class="stat"><div class="label">Longest session</div><div class="value">${records.longestSession ? fmtDuration(records.longestSession) : '–'}</div></div>
        <div class="stat"><div class="label">Most tricks in one session</div><div class="value">${records.mostTricks || '–'}</div></div>
        <div class="stat"><div class="label">Longest distance</div><div class="value">${records.longestDistance ? records.longestDistance + '<small> km</small>' : '–'}</div></div>
        <div class="stat"><div class="label">Best achievement</div><div style="margin-top:8px">${esc(records.best) || '<span class="muted">Add yours with Edit.</span>'}</div></div>
      </div>
      <p class="muted small" style="margin:12px 0 0">Records are calculated from your sessions unless you type your own numbers.</p>
    </div>`;

  const weeks = Stats.weekly(8), months = Stats.monthly(6);
  const labels = weeks.map(w => w.label);
  drawChart('hoursChart', { type: 'line', data: { labels, datasets: [{ label: 'Hours', data: weeks.map(w => w.hours), borderColor: ACCENT, backgroundColor: 'rgba(255,107,53,.2)', fill: true, tension: .3 }] }, options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } } });
  drawChart('sessionsChart', { type: 'bar', data: { labels, datasets: [{ label: 'Sessions', data: weeks.map(w => w.sessions), backgroundColor: YELLOW, borderRadius: 6 }] }, options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } } });
  drawChart('learnedChart', { type: 'line', data: { labels, datasets: [{ label: 'Tricks learned (total)', data: weeks.map(w => w.learned), borderColor: '#55B879', stepped: true }] }, options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } } });
  drawChart('monthChart', { type: 'bar', data: { labels: months.map(m => m.label), datasets: [{ label: 'Hours', data: months.map(m => m.hours), backgroundColor: ACCENT, borderRadius: 6 }] }, options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } } });

  const history = profile.levelHistory && profile.levelHistory.length ? profile.levelHistory : [{ date: todayISO(), level: profile.level || 'Beginner' }];
  drawChart('levelChart', {
    type: 'line',
    data: { labels: history.map(h => fmtDate(h.date, { month: 'short', day: 'numeric' })), datasets: [{ label: 'Level', data: history.map(h => LEVELS.indexOf(h.level) + 1), borderColor: YELLOW, stepped: true, pointRadius: 5 }] },
    options: { plugins: { legend: { display: false } }, scales: { y: { min: 0.5, max: 4.5, ticks: { stepSize: 1, callback: v => LEVELS[v - 1] || '' } } } }
  });
};

Actions['progress.level'] = data => {
  const profile = Store.read('profile', {});
  if (profile.level === data.level) return;
  profile.level = data.level;
  profile.levelHistory = (profile.levelHistory || []).concat([{ date: todayISO(), level: data.level }]);
  Store.write('profile', profile);
  toast(`Skill level set to ${data.level}.`);
  App.render();
};

Actions['progress.records'] = () => {
  const profile = Store.read('profile', {});
  const r = profile.records || {};
  formModal({
    title: 'Personal records',
    values: r,
    fields: [
      { name: 'longestSession', label: 'Longest session (minutes)', type: 'number', min: 0, hint: 'Leave empty to calculate it from your sessions.' },
      { name: 'mostTricks', label: 'Most tricks landed in one session', type: 'number', min: 0 },
      { name: 'longestDistance', label: 'Longest distance (km)', type: 'number', min: 0, step: 'any' },
      { name: 'best', label: 'Best personal achievement', type: 'text', full: true, placeholder: 'For example: first clean kickflip' }
    ],
    onSave: values => { profile.records = values; Store.write('profile', profile); toast('Records saved.'); App.render(); }
  });
};
