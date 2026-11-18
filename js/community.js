/* community.js — a local demo of community features. There is no backend, so nothing here is live or online. */

Actions['community.post'] = () => {
  formModal({
    title: 'New personal post', submitLabel: 'Post',
    fields: [{ name: 'text', label: 'What is on your mind?', type: 'textarea', rows: 4, required: true, full: true, hint: 'Posts are saved on this device only.' }],
    onSave: v => { Store.add('posts', { text: v.text, date: todayISO() }); toast('Post saved.'); App.render(); }
  });
};

Actions['community.deletePost'] = data => {
  confirmDialog('This post will be deleted.', () => { Store.remove('posts', data.id); toast('Post deleted.', 'info'); App.render(); });
};

Actions['community.favTip'] = data => {
  const settings = Store.read('settings', {});
  const favs = settings.favoriteTips || [];
  settings.favoriteTips = favs.includes(data.id) ? favs.filter(id => id !== data.id) : favs.concat([data.id]);
  Store.write('settings', settings); App.render();
};

Actions['community.idea'] = data => {
  const idea = COMMUNITY_DEMO.ideas[Number(data.index)];
  Store.add('challenges', { name: idea.name, description: idea.description, difficulty: idea.difficulty, target: idea.target, unit: idea.unit, metric: 'manual', durationDays: 30, status: 'available', progress: 0, startDate: '', endDate: '', completedDate: '', custom: true });
  toast('Added to your Challenges page.'); App.render();
};

Actions['community.spotlight'] = data => {
  const trick = Store.all('tricks').find(t => t.name === data.trick);
  if (trick) showTrick(trick.id); else toast('That trick is not in your library.', 'info');
};

Views.community = function (root) {
  const favs = Store.read('settings', {}).favoriteTips || [];
  const posts = Store.all('posts').slice().reverse();
  const mine = [
    [Stats.learned().length, 'tricks landed'], [Store.all('sessions').length, 'sessions logged'],
    [Stats.streak(), 'day streak'], [Store.all('challenges').filter(c => c.status === 'completed').length, 'challenges done']
  ];

  root.innerHTML = `
    ${pageHead('Community', 'Tips, inspiration and a place for your own notes.', `<button class="btn primary" data-action="community.post">${icon('plus')} New post</button>`)}
    <div class="demo-note">This page is a local demo. Skater profiles, tips and spotlights are sample content. SKATEFLOW has no accounts, no live feed and no other online users.</div>

    <div class="card" style="margin-bottom:16px"><h3>Your community achievements</h3>
      <div class="grid g4">${mine.map(([n, l]) => `<div class="stat"><div class="value">${n}</div><div class="note">${l}</div></div>`).join('')}</div></div>

    <h3 style="margin:22px 0 10px">Featured skaters <span class="badge sample yellow">Demo profiles</span></h3>
    <div class="grid g4">${COMMUNITY_DEMO.skaters.map(s => `<div class="card"><div class="avatar" style="margin-bottom:10px">${esc(s.name[0])}</div><strong>${esc(s.name)}</strong>
      <div class="chips" style="margin:6px 0"><span class="badge accent">${s.style}</span><span class="badge">${s.level}</span></div><p class="muted small">${esc(s.blurb)}</p></div>`).join('')}</div>

    <div class="grid g2" style="margin-top:22px">
      <div class="card"><h3>Skating tips <span class="badge sample yellow">Sample</span></h3>
        ${COMMUNITY_DEMO.tips.map(t => `<div class="item"><div class="body">${esc(t.text)}</div><button class="btn sm ${favs.includes(t.id) ? 'primary' : ''}" data-action="community.favTip" data-id="${t.id}" aria-pressed="${favs.includes(t.id)}">${favs.includes(t.id) ? 'Saved' : 'Save'}</button></div>`).join('')}</div>
      <div class="stack">
        <div class="card"><h3>Trick spotlights <span class="badge sample yellow">Sample</span></h3>
          ${COMMUNITY_DEMO.spotlights.map(s => `<div class="item"><div class="body"><strong>${esc(s.trick)}</strong><div class="muted small">${esc(s.text)}</div></div><button class="btn sm" data-action="community.spotlight" data-trick="${esc(s.trick)}">Open</button></div>`).join('')}</div>
        <div class="card"><h3>Challenge ideas <span class="badge sample yellow">Sample</span></h3>
          ${COMMUNITY_DEMO.ideas.map((c, i) => `<div class="item"><div class="body"><strong>${esc(c.name)}</strong><div class="muted small">${esc(c.description)}</div></div><button class="btn sm" data-action="community.idea" data-index="${i}">Add</button></div>`).join('')}</div>
      </div>
    </div>

    <div class="card" style="margin-top:16px"><h3>My posts <span class="badge">Private, saved on this device</span></h3>
      ${posts.length ? posts.map(p => `<div class="item"><div class="body"><div style="white-space:pre-wrap">${esc(p.text)}</div><div class="muted small">${fmtDate(p.date)}</div></div><button class="btn sm danger" data-action="community.deletePost" data-id="${p.id}">Delete</button></div>`).join('')
        : emptyState('No posts yet', 'Write a quick note about your skating today.', '<button class="btn primary" data-action="community.post">New post</button>')}</div>`;
};
