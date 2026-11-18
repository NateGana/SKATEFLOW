/* utils.js — small helpers shared by every page */

// Every page registers itself in these objects (see the other js files).
const Views = {};    // Views.sessions = function(root) { ... }
const Actions = {};  // click handlers, matched by data-action="name"
const Lists = {};    // functions that redraw only the list part of a page
const State = {};    // current search / filter values for each page

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

// Escape text before putting it in HTML, so user input can never break the page.
function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function uid(prefix = 'id') {
  return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function icon(name) { return `<i data-lucide="${name}"></i>`; }
function refreshIcons() { if (window.lucide) window.lucide.createIcons(); }

/* ---------- Dates ---------- */
function toISO(date) {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}
function todayISO() { return toISO(new Date()); }
function parseISO(iso) {
  const [y, m, d] = String(iso).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}
function addDays(date, n) { const d = new Date(date); d.setDate(d.getDate() + n); return d; }
function startOfWeek(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - day);
  return d;
}
function fmtDate(iso, opts = { month: 'short', day: 'numeric', year: 'numeric' }) {
  if (!iso) return '';
  return parseISO(iso).toLocaleDateString('en-US', opts);
}
function fmtDuration(minutes) {
  const m = Math.round(Number(minutes) || 0);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60), rest = m % 60;
  return rest ? `${h}h ${rest}m` : `${h}h`;
}
function fmtHours(minutes) { return (Math.round((Number(minutes) || 0) / 6) / 10).toString(); }
function money(value) {
  const symbol = (Store.read('settings', {}).currency) || '$';
  return symbol + (Number(value) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function pct(value, target) {
  if (!target || target <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((Number(value) / Number(target)) * 100)));
}
function progressBar(percent, cls = '') {
  return `<div class="progress ${cls}" role="progressbar" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100"><i style="width:${percent}%"></i></div>`;
}
function emptyState(title, text, buttonHtml = '') {
  return `<div class="empty"><strong>${esc(title)}</strong>${esc(text)}<br>${buttonHtml}</div>`;
}
function pageHead(title, subtitle, buttons = '') {
  return `<div class="page-head"><div><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div><div class="row">${buttons}</div></div>`;
}
function optionList(list, selected, allLabel) {
  const first = allLabel ? `<option value="">${esc(allLabel)}</option>` : '';
  return first + list.map(o => `<option value="${esc(o)}"${o === selected ? ' selected' : ''}>${esc(o)}</option>`).join('');
}

/* ---------- Toasts and dialogs ---------- */
function toast(message, type = 'ok') {
  const root = $('#toastRoot');
  if (!root) return;
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = message;
  root.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

function openModal({ title, body, wide = false }) {
  const root = $('#modalRoot');
  root.innerHTML = `
    <div class="modal-backdrop" data-action="modal.backdrop">
      <div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
        <header><h2>${esc(title)}</h2><button class="icon-btn" data-action="modal.close" aria-label="Close">${icon('x')}</button></header>
        <div class="modal-body">${body}</div>
      </div>
    </div>`;
  refreshIcons();
  const firstField = $('#modalRoot input:not([type=hidden]), #modalRoot select, #modalRoot textarea');
  if (firstField && !wide) firstField.focus();
}
function closeModal() { $('#modalRoot').innerHTML = ''; }
Actions['modal.close'] = closeModal;
Actions['modal.backdrop'] = (data, el, event) => { if (event.target === el) closeModal(); };

// Custom confirmation dialog instead of window.confirm.
function confirmDialog(message, onYes, yesLabel = 'Delete') {
  const root = $('#confirmRoot');
  root.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal" role="alertdialog" aria-modal="true" style="width:min(420px,100%)">
        <div class="modal-body">
          <h2 style="font-size:20px;margin-bottom:8px">Are you sure?</h2>
          <p class="muted">${esc(message)}</p>
          <div class="form-actions" style="margin-top:18px">
            <button class="btn" id="confirmNo">Cancel</button>
            <button class="btn danger" id="confirmYes">${esc(yesLabel)}</button>
          </div>
        </div>
      </div>
    </div>`;
  $('#confirmNo').onclick = () => { root.innerHTML = ''; };
  $('#confirmYes').onclick = () => { root.innerHTML = ''; onYes(); };
  $('#confirmNo').focus();
}

/* ---------- Form builder ----------
   fields: [{ name, label, type, options, required, min, max, step, full, hint, rows, default }]
   Types: text, number, date, time, month, select, textarea, image, url */
function fieldHtml(f, value) {
  const v = value ?? f.default ?? '';
  const attrs = `name="${f.name}"` + (f.min !== undefined ? ` min="${f.min}"` : '') + (f.max !== undefined ? ` max="${f.max}"` : '') +
    (f.step ? ` step="${f.step}"` : '') + (f.placeholder ? ` placeholder="${esc(f.placeholder)}"` : '');
  let input;
  if (f.type === 'select') {
    input = `<select ${attrs}>` + f.options.map(o => {
      const val = typeof o === 'object' ? o.value : o, label = typeof o === 'object' ? o.label : o;
      return `<option value="${esc(val)}"${String(val) === String(v) ? ' selected' : ''}>${esc(label)}</option>`;
    }).join('') + '</select>';
  } else if (f.type === 'textarea') {
    input = `<textarea ${attrs} rows="${f.rows || 4}">${esc(v)}</textarea>`;
  } else if (f.type === 'image') {
    input = `<input type="file" name="${f.name}" accept="image/*">` + (v ? `<img class="form-preview" src="${esc(v)}" alt="Current image">` : '');
  } else {
    input = `<input type="${f.type || 'text'}" ${attrs} value="${esc(v)}">`;
  }
  return `<label class="field ${f.full ? 'full' : ''}"><span>${esc(f.label)}${f.required ? ' *' : ''}</span>${input}${f.hint ? `<small>${esc(f.hint)}</small>` : ''}</label>`;
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read the image file.'));
    reader.readAsDataURL(file);
  });
}

// Reads the form, validates it, then calls onSave(values). onSave can return an error string.
function formModal({ title, fields, values = {}, submitLabel = 'Save', onSave, onInput, wide = false }) {
  const body = `<form id="modalForm" class="form-grid" novalidate>
      ${fields.map(f => fieldHtml(f, values[f.name])).join('')}
      <div class="form-error" id="formError" role="alert"></div>
      <div class="form-actions">
        <button type="button" class="btn" data-action="modal.close">Cancel</button>
        <button type="submit" class="btn primary">${esc(submitLabel)}</button>
      </div>
    </form>`;
  openModal({ title, body, wide });
  const form = $('#modalForm');
  const showError = msg => { $('#formError').textContent = msg; };

  if (onInput) form.addEventListener('input', e => onInput(e.target.name, form));

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const out = {};
    for (const f of fields) {
      const el = form.elements[f.name];
      if (f.type === 'image') {
        const file = el.files[0];
        if (file) {
          if (file.size > 600 * 1024) return showError('Image is too large. Please choose one under 600 KB.');
          try { out[f.name] = await readFileAsDataURL(file); } catch (e) { return showError(e.message); }
        } else {
          out[f.name] = values[f.name] || '';
        }
        continue;
      }
      let value = el.value.trim();
      if (f.required && value === '') return showError(`${f.label} is required.`);
      if (f.type === 'number') {
        if (value === '') { out[f.name] = ''; continue; }
        value = Number(value);
        if (Number.isNaN(value)) return showError(`${f.label} must be a number.`);
        if (f.min !== undefined && value < f.min) return showError(`${f.label} must be at least ${f.min}.`);
        if (f.max !== undefined && value > f.max) return showError(`${f.label} must be ${f.max} or less.`);
      }
      out[f.name] = value;
    }
    const result = onSave(out);
    if (typeof result === 'string' && result) return showError(result);
    closeModal();
  });
}

/* ---------- Charts ---------- */
const Charts = {};
function destroyCharts() {
  Object.keys(Charts).forEach(id => { try { Charts[id].destroy(); } catch (e) { /* canvas already gone */ } delete Charts[id]; });
}
function drawChart(id, config) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  if (typeof Chart === 'undefined') {
    canvas.parentElement.innerHTML = '<p class="muted small">Charts need the Chart.js CDN. Connect to the internet and refresh the page.</p>';
    return;
  }
  const css = getComputedStyle(document.documentElement);
  Chart.defaults.color = css.getPropertyValue('--muted').trim();
  Chart.defaults.borderColor = css.getPropertyValue('--border').trim();
  Chart.defaults.font.family = 'Inter, sans-serif';
  config.options = Object.assign({ responsive: true, maintainAspectRatio: false }, config.options || {});
  Charts[id] = new Chart(canvas, config);
}
const ACCENT = '#FF6B35', YELLOW = '#F4C95D';

/* A simple skateboard drawing used on trick cards and the dashboard hero. */
function boardSvg(color = '#FF6B35') {
  return `<svg class="board" viewBox="0 0 220 90" aria-hidden="true"><g transform="rotate(-12 110 40)">
    <rect x="8" y="26" width="204" height="26" rx="13" fill="${color}"/>
    <rect x="22" y="32" width="176" height="3" rx="1.5" fill="rgba(0,0,0,.25)"/>
    <circle cx="52" cy="66" r="10" fill="#F4C95D"/><circle cx="168" cy="66" r="10" fill="#F4C95D"/>
    <rect x="40" y="52" width="24" height="6" fill="#888"/><rect x="156" y="52" width="24" height="6" fill="#888"/></g></svg>`;
}
