/* equipment.js — gear list, spending, replacement reminders and board setup */

const EQUIPMENT_CATEGORIES = ['Skateboard Deck', 'Trucks', 'Wheels', 'Bearings', 'Grip Tape', 'Skate Shoes', 'Helmet', 'Protective Gear', 'Clothing', 'Accessories'];
const CONDITIONS = ['New', 'Good', 'Fair', 'Needs Replacement'];

State.equipment = { category: '' };

function equipmentFields() {
  return [
    { name: 'name', label: 'Item name', required: true },
    { name: 'brand', label: 'Brand' },
    { name: 'category', label: 'Category', type: 'select', options: EQUIPMENT_CATEGORIES },
    { name: 'condition', label: 'Condition', type: 'select', options: CONDITIONS },
    { name: 'purchaseDate', label: 'Purchase date', type: 'date' },
    { name: 'price', label: 'Purchase price', type: 'number', min: 0, step: 'any' },
    { name: 'reminderDate', label: 'Replacement reminder date', type: 'date', hint: 'Optional. You will see a flag when it is due.' },
    { name: 'image', label: 'Image (optional)', type: 'image', hint: 'Under 600 KB.' },
    { name: 'notes', label: 'Notes', type: 'textarea', rows: 3, full: true }
  ];
}

Actions['equipment.add'] = () => {
  formModal({
    title: 'Add equipment', fields: equipmentFields(), values: { condition: 'New', purchaseDate: todayISO() }, submitLabel: 'Add item',
    onSave: v => { Store.add('equipment', Object.assign(v, { price: Number(v.price) || 0 })); toast('Equipment added.'); App.render(); }
  });
};

Actions['equipment.edit'] = data => {
  const item = Store.find('equipment', data.id);
  formModal({
    title: 'Edit equipment', fields: equipmentFields(), values: item, submitLabel: 'Save changes',
    onSave: v => { Store.update('equipment', item.id, Object.assign(v, { price: Number(v.price) || 0 })); toast('Equipment updated.'); App.render(); }
  });
};

Actions['equipment.delete'] = data => {
  confirmDialog('This item will be removed from your gear list.', () => { Store.remove('equipment', data.id); toast('Item deleted.', 'info'); App.render(); });
};

Actions['equipment.setup'] = () => {
  const settings = Store.read('settings', {});
  formModal({
    title: 'Current skateboard setup', values: settings.setup || {},
    fields: [
      { name: 'deckSize', label: 'Deck size', placeholder: 'For example: 8.0"' },
      { name: 'truckSize', label: 'Truck size', placeholder: 'For example: 139' },
      { name: 'wheelSize', label: 'Wheel size', placeholder: 'For example: 52mm' },
      { name: 'wheelHardness', label: 'Wheel hardness', placeholder: 'For example: 99A' },
      { name: 'bearings', label: 'Bearings', full: true, placeholder: 'Brand or rating' }
    ],
    onSave: v => { settings.setup = v; Store.write('settings', settings); toast('Setup saved.'); App.render(); }
  });
};

function reminderDue(item) {
  return item.condition === 'Needs Replacement' || (item.reminderDate && item.reminderDate <= todayISO());
}

function equipmentCard(item) {
  const cls = { New: 'ok', Good: 'ok', Fair: 'yellow', 'Needs Replacement': 'danger' }[item.condition] || '';
  return `<div class="card item-card">
    <div class="thumb park">${item.image ? `<img src="${esc(item.image)}" alt="" onerror="this.remove()">` : ''}${icon('package')}</div>
    <h3>${esc(item.name)}</h3>
    <div class="muted small">${esc(item.brand || 'No brand')} · ${esc(item.category)}</div>
    <div class="chips" style="margin:8px 0"><span class="badge ${cls}">${item.condition}</span>
      ${reminderDue(item) ? '<span class="badge danger">Replace soon</span>' : item.reminderDate ? `<span class="badge">Remind ${fmtDate(item.reminderDate, { month: 'short', day: 'numeric' })}</span>` : ''}</div>
    <p class="desc">${money(item.price)}${item.purchaseDate ? ' · bought ' + fmtDate(item.purchaseDate) : ''}${item.notes ? '<br>' + esc(item.notes) : ''}</p>
    <div class="foot"><div class="actions">
      <button class="btn sm" data-action="equipment.edit" data-id="${item.id}">Edit</button>
      <button class="btn sm danger" data-action="equipment.delete" data-id="${item.id}">Delete</button></div></div></div>`;
}

Lists.equipment = function () {
  const list = Store.all('equipment').filter(i => !State.equipment.category || i.category === State.equipment.category);
  const box = $('#list');
  if (!box) return;
  box.innerHTML = list.length ? `<div class="grid g3">${list.map(equipmentCard).join('')}</div>`
    : emptyState('No gear here yet', 'Add your deck, wheels, helmet, and more to track their condition and cost.', '<button class="btn primary" data-action="equipment.add">Add equipment</button>');
  refreshIcons();
};

Views.equipment = function (root) {
  const items = Store.all('equipment');
  const setup = Store.read('settings', {}).setup || {};
  const due = items.filter(reminderDue);
  const spent = items.reduce((n, i) => n + (Number(i.price) || 0), 0);
  const setupItem = (label, key) => `<div><span>${label}</span><strong>${esc(setup[key] || '–')}</strong></div>`;

  root.innerHTML = `
    ${pageHead('My Equipment', 'Keep track of your gear, what it cost, and when to replace it.', `<button class="btn primary" data-action="equipment.add">${icon('plus')} Add equipment</button>`)}
    <div class="grid g3" style="margin-bottom:16px">
      <div class="card stat"><div class="label">Total spending</div><div class="value">${money(spent)}</div></div>
      <div class="card stat"><div class="label">Items</div><div class="value">${items.length}</div></div>
      <div class="card stat"><div class="label">Need replacement soon</div><div class="value">${due.length}</div><div class="note">${due.map(i => esc(i.name)).join(', ') || 'Nothing due'}</div></div>
    </div>
    <div class="card" style="margin-bottom:16px">
      <div class="card-head"><h3>Current skateboard setup</h3><button class="btn sm" data-action="equipment.setup">${icon('pencil')} Edit setup</button></div>
      <div class="setup-grid">${setupItem('Deck size', 'deckSize')}${setupItem('Truck size', 'truckSize')}${setupItem('Wheel size', 'wheelSize')}${setupItem('Wheel hardness', 'wheelHardness')}${setupItem('Bearings', 'bearings')}</div>
    </div>
    <div class="toolbar"><select data-bind="equipment.category" aria-label="Filter by category">${optionList(EQUIPMENT_CATEGORIES, State.equipment.category, 'All categories')}</select></div>
    <div id="list"></div>`;
  Lists.equipment();
};
