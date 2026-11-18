/* settings.js — profile, theme and data management */

const STYLES = ['Street', 'Park', 'Freestyle', 'Cruising', 'Transition', 'Other'];
const CURRENCIES = ['$', '₱', '€', '£', '¥'];

Actions['settings.profile'] = () => {
  const profile = Store.read('profile', {});
  formModal({
    title: 'Edit profile', values: profile, submitLabel: 'Save profile',
    fields: [
      { name: 'name', label: 'Display name', required: true },
      { name: 'username', label: 'Username', placeholder: 'your_name' },
      { name: 'experience', label: 'Skating experience', placeholder: 'For example: 2 years' },
      { name: 'level', label: 'Skill level', type: 'select', options: LEVELS },
      { name: 'style', label: 'Favorite skating style', type: 'select', options: STYLES },
      { name: 'homePark', label: 'Home skatepark' },
      { name: 'avatar', label: 'Profile picture', type: 'image', full: true, hint: 'Under 600 KB.' },
      { name: 'bio', label: 'About me', type: 'textarea', rows: 3, full: true }
    ],
    onSave: v => {
      const next = Object.assign({}, profile, v);
      if (v.level !== profile.level) next.levelHistory = (profile.levelHistory || []).concat([{ date: todayISO(), level: v.level }]);
      Store.write('profile', next); toast('Profile saved.'); App.render();
    }
  });
};

Actions['settings.theme'] = (data, el) => {
  const settings = Store.read('settings', {});
  settings.theme = el.value; Store.write('settings', settings); App.applyTheme(); App.render();
};
Actions['settings.currency'] = (data, el) => {
  const settings = Store.read('settings', {});
  settings.currency = el.value; Store.write('settings', settings); toast('Currency updated.'); App.render();
};

Actions['settings.export'] = () => {
  const json = JSON.stringify(Store.exportAll(), null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `skateflow-backup-${todayISO()}.json`;
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  toast('Backup downloaded.');
};

Actions['settings.import'] = () => $('#importFile').click();

// Called from app.js when a file is picked.
function importFromFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    let data;
    try { data = JSON.parse(reader.result); } catch (e) { return toast('That file is not valid JSON.', 'error'); }
    const error = Store.validateImport(data);
    if (error) return toast(error, 'error');
    confirmDialog('Importing replaces your current data with the data in this file.', () => {
      Store.importAll(data); App.applyTheme(); toast('Data imported.'); App.render();
    }, 'Replace my data');
  };
  reader.onerror = () => toast('Could not read the file.', 'error');
  reader.readAsText(file);
}

Actions['settings.demo'] = () => {
  confirmDialog('This adds sample sessions, journal entries, goals and gear so you can see the charts. You can remove them with "Clear personal records".', () => {
    Store.loadDemo(); toast('Demo data loaded.'); App.render();
  }, 'Load demo data');
};
Actions['settings.reset'] = () => {
  confirmDialog('Built-in tricks, sample parks and challenges go back to their starting state. Your custom tricks, parks and challenges stay.', () => {
    Store.resetSamples(); toast('Sample data reset.', 'info'); App.render();
  }, 'Reset');
};
Actions['settings.clear'] = () => {
  confirmDialog('This deletes your sessions, journal, goals, gear and posts, and resets trick, park and challenge progress. Export a backup first if you might need it.', () => {
    Store.clearPersonal(); toast('Personal records cleared.', 'info'); App.render();
  }, 'Clear everything');
};

Views.settings = function (root) {
  const p = Store.read('profile', {});
  const s = Store.read('settings', {});
  root.innerHTML = `
    ${pageHead('Settings', 'Your profile, appearance and data.')}
    <div class="grid g2">
      <div class="card">
        <div class="card-head"><h3>Profile</h3><button class="btn sm" data-action="settings.profile">${icon('pencil')} Edit</button></div>
        <div class="row" style="align-items:flex-start;gap:16px">
          <div class="avatar big">${p.avatar ? `<img src="${esc(p.avatar)}" alt="">` : esc((p.name || 'S')[0].toUpperCase())}</div>
          <div><h2 style="font-size:22px">${esc(p.name)}</h2><div class="muted">${p.username ? '@' + esc(p.username) : 'No username yet'}</div>
            <div class="chips" style="margin-top:8px"><span class="badge accent">${esc(p.level)}</span><span class="badge">${esc(p.style)}</span>${p.experience ? `<span class="badge">${esc(p.experience)}</span>` : ''}</div></div>
        </div>
        <p style="margin-top:14px">${esc(p.bio) || '<span class="muted">Add a short description about yourself.</span>'}</p>
        ${p.homePark ? `<p class="muted small">Home park: ${esc(p.homePark)}</p>` : ''}
      </div>

      <div class="card">
        <h3>Appearance and units</h3>
        <label class="field" style="margin-bottom:12px"><span>Theme</span>
          <select data-action="settings.theme">${[['dark', 'Dark (default)'], ['light', 'Light']].map(([v, l]) => `<option value="${v}"${s.theme === v ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
        <label class="field"><span>Currency symbol for equipment costs</span>
          <select data-action="settings.currency">${optionList(CURRENCIES, s.currency)}</select></label>
      </div>

      <div class="card" style="grid-column:1/-1">
        <h3>Data management</h3>
        <p class="muted">Your data is saved in this browser only. It does not sync to other devices. Export a backup to move it or keep it safe.</p>
        <div class="row">
          <button class="btn primary" data-action="settings.export">${icon('download')} Export data (JSON)</button>
          <button class="btn" data-action="settings.import">${icon('upload')} Import data</button>
          <input type="file" id="importFile" accept="application/json,.json" hidden>
          <button class="btn" data-action="settings.demo">${icon('flask-conical')} Load demo data</button>
          <button class="btn" data-action="settings.reset">${icon('rotate-ccw')} Reset sample data</button>
          <button class="btn danger" data-action="settings.clear">${icon('trash-2')} Clear personal records</button>
        </div>
      </div>
    </div>`;
};
