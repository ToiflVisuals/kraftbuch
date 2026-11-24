/* ================= Hilfsfunktionen ================= */
const $ = (s, r = document) => r.querySelector(s);
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-5);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = (v) => {
  if (v === '' || v == null) return null;
  const n = parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};
const fmt = (n, d = 2) => (n == null ? '–' : (Math.round(n * 10 ** d) / 10 ** d).toLocaleString('de-AT'));
const fmtInt = (n) => Math.round(n).toLocaleString('de-AT');
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const DAY = 86400000;
const startOfDay = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
const relDay = (t) => {
  const diff = Math.round((startOfDay(Date.now()) - startOfDay(t)) / DAY);
  if (diff === 0) return 'heute';
  if (diff === 1) return 'gestern';
  if (diff < 7) return `vor ${diff} Tagen`;
  return new Date(t).toLocaleDateString('de-AT', { day: 'numeric', month: 'short' });
};
const dShort = (t) => new Date(t).toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit' });
const dFull = (t) => new Date(t).toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit', year: '2-digit' });
const e1rm = (w, r) => (!w ? 0 : !r || r <= 1 ? w : w * (1 + r / 30));

const ICON = {
  more: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
  chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 5 7 7-7 7"/></svg>',
  down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  grip: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.7"/><circle cx="15" cy="6" r="1.7"/><circle cx="9" cy="12" r="1.7"/><circle cx="15" cy="12" r="1.7"/><circle cx="9" cy="18" r="1.7"/><circle cx="15" cy="18" r="1.7"/></svg>',
  pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20l1-4.5L16.2 4.3a1.8 1.8 0 0 1 2.5 0l1 1a1.8 1.8 0 0 1 0 2.5L8.5 19z"/><path d="m14.5 6 3.5 3.5"/></svg>',
  cam: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.5-2h6l1.5 2h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z"/><circle cx="12" cy="12.8" r="3.3"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.4M12 18.8v2.4M4.2 7.5l2.1 1.2M17.7 15.3l2.1 1.2M4.2 16.5l2.1-1.2M17.7 8.7l2.1-1.2"/></svg>',
};

/* ================= Speicher ================= */
const LS = { state: 'kb2.state', entries: 'kb2.entries', tab: 'kb2.tab', day: 'kb2.day', metric: 'kb2.metric', period: 'kb2.period', backup: 'kb2.lastBackup', session: 'kb2.session', train: 'kb2.train', drafts: 'kb2.drafts' };
const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const lsSet = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch {} };

// Fotos liegen in IndexedDB (zu groß für localStorage)
const IDB = {
  open() {
    return (this.p ||= new Promise((res, rej) => {
      const r = indexedDB.open('kraftbuch', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('photos');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    }));
  },
  async tx(mode, fn) {
    const db = await this.open();
    return new Promise((res, rej) => {
      const t = db.transaction('photos', mode);
      const out = fn(t.objectStore('photos'));
      t.oncomplete = () => res(out?.result);
      t.onerror = () => rej(t.error);
    });
  },
  get: (k) => IDB.tx('readonly', (s) => s.get(k)),
  set: (k, v) => IDB.tx('readwrite', (s) => s.put(v, k)),
  del: (k) => IDB.tx('readwrite', (s) => s.delete(k)),
  keys: () => IDB.tx('readonly', (s) => s.getAllKeys()),
  clear: () => IDB.tx('readwrite', (s) => s.clear()),
};
const photos = new Map(); // exId -> objectURL

const GROUPS = ['Brust', 'Rücken', 'Schultern', 'Beine', 'Po', 'Bizeps', 'Trizeps', 'Bauch', 'Ganzkörper', 'Cardio', 'Sonstige'];

function seed() {
  const ex = (name, group) => ({ id: uid(), name, group, note: '' });
  const E = {
    bank: ex('Bankdrücken', 'Brust'), schraeg: ex('Schrägbankdrücken Kurzhantel', 'Brust'), ohp: ex('Schulterdrücken', 'Schultern'),
    seit: ex('Seitheben', 'Schultern'), tri: ex('Trizepsdrücken am Kabel', 'Trizeps'),
    klimm: ex('Klimmzüge', 'Rücken'), rud: ex('Langhantelrudern', 'Rücken'), lat: ex('Latziehen', 'Rücken'), curl: ex('Bizepscurls', 'Bizeps'),
    knie: ex('Kniebeugen', 'Beine'), presse: ex('Beinpresse', 'Beine'), beuger: ex('Beinbeuger', 'Beine'), wade: ex('Wadenheben', 'Beine'),
  };
  return {
    version: 2,
    example: true,
    exercises: Object.values(E),
    days: [
      { id: uid(), name: 'Push', exIds: [E.bank.id, E.schraeg.id, E.ohp.id, E.seit.id, E.tri.id] },
      { id: uid(), name: 'Pull', exIds: [E.klimm.id, E.rud.id, E.lat.id, E.curl.id] },
      { id: uid(), name: 'Beine', exIds: [E.knie.id, E.presse.id, E.beuger.id, E.wade.id] },
    ],
  };
}

const S = {
  state: lsGet(LS.state, null) || seed(),
  entries: lsGet(LS.entries, []),
  tab: lsGet(LS.tab, 'training'),
  day: lsGet(LS.day, null),
  metric: lsGet(LS.metric, 'weight'),
  period: lsGet(LS.period, 'm'),
  open: new Set(), // Übungen mit aufgeklapptem Archiv
  train: lsGet(LS.train, false), // geführtes Training statt Übungsliste
  session: lsGet(LS.session, null), // { dayId, since, touched, later, pick }
  drafts: lsGet(LS.drafts, {}), // angefangene, noch nicht bestätigte Eingaben von heute
  ret: null,
};
if (S.day && !S.state.days.some((d) => d.id === S.day)) S.day = null;
if (!S.day) S.train = false;
lsSet(LS.state, S.state);

const saveState = () => lsSet(LS.state, S.state);
const saveEntries = () => lsSet(LS.entries, S.entries);

/* ================= Abfragen ================= */
const exById = (id) => S.state.exercises.find((e) => e.id === id);
const dayById = (id) => S.state.days.find((d) => d.id === id);
const entriesFor = (exId) => S.entries.filter((e) => e.exId === exId).sort((a, b) => b.date - a.date);
const vol = (e) => (e.w ?? 0) * (e.sets ?? 1) * (e.reps ?? 0);
const inPlan = (id) => S.state.days.some((d) => d.exIds.includes(id));
const lastActivity = (day) => Math.max(0, ...S.entries.filter((e) => day.exIds.includes(e.exId)).map((e) => e.date));

/* ================= Geführtes Training ================= */
// Erledigt ist eine Übung, sobald sie seit Beginn (normal: seit heute früh) einen Eintrag hat.
// Dadurch merkt sich die App den Stand auch, wenn sie zwischendurch geschlossen wird.
const SESSION_MAX = 6 * 3600000;
const saveSession = () => lsSet(LS.session, S.session);
const sessionFresh = () => !!S.session && Date.now() - S.session.touched < SESSION_MAX;
function touchSession() { if (S.session) { S.session.touched = Date.now(); saveSession(); } }
function ensureSession(day) {
  if (S.session?.dayId === day.id && sessionFresh()) return S.session;
  S.session = { dayId: day.id, since: startOfDay(Date.now()), touched: Date.now(), later: [], pick: null };
  saveSession();
  return S.session;
}
function trainState(day) {
  const ses = ensureSession(day);
  const ids = day.exIds.filter(exById);
  const entryOf = (id) => entriesFor(id).find((e) => e.date >= ses.since);
  const done = ids.filter(entryOf);
  const open = ids.filter((id) => !done.includes(id));
  let queue = [...open.filter((id) => !ses.later.includes(id)), ...ses.later.filter((id) => open.includes(id))];
  if (ses.pick && queue.includes(ses.pick)) queue = [ses.pick, ...queue.filter((id) => id !== ses.pick)];
  return { ids, done, queue, entryOf };
}
const isTrain = () => S.train && S.tab === 'training' && !!S.day;

// Angefangene Eingaben überleben Umsortieren, Fotos und das Schließen der App
const draftFor = (id) => { const d = S.drafts[id]; return d && d.day === startOfDay(Date.now()) ? d : {}; };
const saveDrafts = () => lsSet(LS.drafts, S.drafts);

/* ================= Rendering ================= */
function setHeader(eyebrow, title, back = false) {
  $('#viewEyebrow').textContent = eyebrow;
  $('#viewTitle').textContent = title;
  $('#backBtn').hidden = !back;
  const hb = $('#headBtn');
  if (back) { hb.dataset.act = 'day-menu'; hb.setAttribute('aria-label', 'Optionen für diesen Tag'); hb.innerHTML = ICON.more; }
  else { hb.dataset.act = 'settings'; hb.setAttribute('aria-label', 'Einstellungen und Sicherung'); hb.innerHTML = ICON.gear; }
}

function render() {
  document.querySelectorAll('.tab').forEach((t) => (t.dataset.tab === S.tab ? t.setAttribute('aria-current', 'page') : t.removeAttribute('aria-current')));
  const v = $('#view');
  if (S.tab === 'fortschritt') {
    setHeader('Alle Übungen', 'Fortschritt');
    v.innerHTML = viewProgress();
    renderExList();
  } else if (isTrain()) {
    const day = dayById(S.day);
    setHeader('Training', day.name || 'Ohne Namen', true);
    v.innerHTML = viewTrain(day);
  } else if (S.day) {
    const day = dayById(S.day);
    setHeader('Trainingstag', day.name || 'Ohne Namen', true);
    v.innerHTML = viewDay(day);
  } else {
    setHeader('Kraftbuch', 'Training');
    v.innerHTML = viewDays();
  }
}

function go(tab, day = null, train = false) {
  S.tab = tab; S.day = day; S.train = train;
  lsSet(LS.tab, tab); lsSet(LS.day, day); lsSet(LS.train, train);
  render();
  window.scrollTo(0, 0);
}

/* ---------- Trainingstage ---------- */
function viewDays() {
  let html = '';
  const lastBackup = lsGet(LS.backup, null);
  if (S.entries.length >= 10 && (!lastBackup || Date.now() - lastBackup > 14 * DAY)) {
    html += `<div class="banner"><p><b>Zeit für eine Sicherung.</b> ${lastBackup ? `Die letzte ist ${esc(relDay(lastBackup))} entstanden.` : 'Du hast noch keine.'} Sie landet in iCloud Drive, falls du das iPhone wechselst.</p>
      <button class="btn btn-secondary" data-act="export">Jetzt sichern</button></div>`;
  }
  if (S.state.example) {
    html += `<div class="banner"><p>Das ist ein <b>Beispielplan</b>. Tippe bei einem Tag auf den Stift, um ihn umzubenennen und Übungen hinzuzufügen oder zu entfernen.</p>
      <button class="btn btn-secondary" data-act="example-ok">Verstanden</button></div>`;
  }
  html += `<div class="section">`;
  for (const day of S.state.days) {
    const last = lastActivity(day);
    const active = S.session?.dayId === day.id && sessionFresh() ? trainState(day) : null;
    const running = active && active.done.length > 0 && active.queue.length > 0;
    const meta = running ? `${active.done.length} von ${active.ids.length} erledigt · weiter mit ${exById(active.queue[0]).name}`
      : `${plural(day.exIds.length, 'Übung', 'Übungen')}${last ? ' · zuletzt ' + relDay(last) : ''}`;
    html += `<div class="day-card${running ? ' running' : ''}">
      <button class="dc-main" data-act="start-day" data-day="${day.id}">
        <span class="day-name">${esc(day.name || 'Ohne Namen')}</span>
        <span class="day-meta">${esc(meta)}</span>
      </button>
      <button class="dc-edit" data-act="open-day" data-day="${day.id}" aria-label="${esc(day.name)} bearbeiten">${ICON.pen}</button>
      <button class="dc-start" data-act="start-day" data-day="${day.id}" aria-label="${esc(day.name)} ${running ? 'fortsetzen' : 'starten'}">${running ? 'Weiter' : 'Starten'}</button>
    </div>`;
  }
  if (!S.state.days.length) html += `<div class="empty"><strong>Noch kein Trainingstag</strong>Leg unten deinen ersten Tag an, z. B. „Oberkörper“.</div>`;
  html += `<button class="btn-dashed" data-act="day-add">+ Trainingstag hinzufügen</button></div>`;
  return html;
}

/* ---------- Ein Trainingstag ---------- */
function viewDay(day) {
  let html = `<div class="section">`;
  if (!day.exIds.length) html += `<div class="empty"><strong>Noch keine Übung</strong>Füge unten deine erste Übung hinzu.</div>`;
  else html += `<button class="btn btn-primary btn-block" data-act="start-day" data-day="${day.id}">Training starten</button>`;
  for (const exId of day.exIds) {
    const ex = exById(exId); if (!ex) continue;
    html += exCard(ex);
  }
  html += `<button class="btn-dashed" data-act="ex-add">+ Übung hinzufügen</button></div>`;
  return html;
}

/* ---------- Training: immer die aktuelle Übung oben ---------- */
function viewTrain(day) {
  const { ids, done, queue, entryOf } = trainState(day);
  const doneRow = (id) => {
    const e = entryOf(id);
    return `<button class="tr-row done" data-act="entry" data-entry="${e.id}"><span class="tr-ic">${ICON.check}</span><span class="tr-name">${esc(exById(id).name)}</span><span class="tr-val">${e.w != null ? fmt(e.w) + ' kg · ' : ''}${e.sets ?? '–'} × ${e.reps ?? '–'}</span></button>`;
  };
  let html = `<div class="tr-bar" role="img" aria-label="${done.length} von ${ids.length} Übungen erledigt">${ids.map((id) => `<i class="${done.includes(id) ? 'on' : id === queue[0] ? 'now' : ''}"></i>`).join('')}</div>`;
  if (!queue.length) {
    html += `<div class="tr-finish"><div class="tr-check">${ICON.check}</div><h2>${esc(day.name)} geschafft</h2><p class="muted">${plural(ids.length, 'Übung', 'Übungen')} eingetragen.</p>
      <button class="btn btn-primary btn-block" data-act="train-end">Zur Übersicht</button>
      <button class="btn btn-ghost" data-act="train-again">Diesen Tag heute noch einmal trainieren</button></div>`;
  } else {
    html += `<div class="tr-now"><span class="section-title">Jetzt · Übung ${done.length + 1} von ${ids.length}</span>${queue.length > 1 ? '<button class="tr-later" data-act="train-later">Später machen</button>' : ''}</div>${exCard(exById(queue[0]))}`;
    if (queue.length > 1) html += `<div class="tr-sec"><h2 class="section-title">Danach</h2><div class="tr-list">${queue.slice(1).map((id, i) => {
      const last = entriesFor(id)[0];
      return `<button class="tr-row" data-act="train-pick" data-id="${id}"><span class="tr-ic">${picHTML(exById(id)) || `<b>${done.length + i + 2}</b>`}</span><span class="tr-name">${esc(exById(id).name)}</span><span class="tr-val">${last ? (last.w != null ? fmt(last.w) + ' kg' : (last.reps ?? '–') + ' Wdh') : ''}</span></button>`;
    }).join('')}</div></div>`;
  }
  if (done.length) html += `<div class="tr-sec"><h2 class="section-title">Erledigt</h2><div class="tr-list">${done.map(doneRow).join('')}</div></div>`;
  return html;
}
function okLabel(last, typed, isLast) {
  if (!typed && last && last.reps != null) return `Wie letztes Mal: ${last.w != null ? fmt(last.w) + ' kg · ' : ''}${last.sets ?? '–'} × ${last.reps}`;
  return isLast ? 'Bestätigen und fertig' : 'Bestätigen und weiter';
}
function updateOk(card) {
  const b = card?.querySelector('.train-ok'); if (!b) return;
  const typed = [...card.querySelectorAll('.lt-in')].some((i) => i.value.trim() !== '');
  b.textContent = okLabel(entriesFor(card.dataset.ex)[0], typed, b.dataset.last === '1');
}

function exCard(ex) {
  const train = isTrain();
  const dr = draftFor(ex.id);
  const isLast = train && trainState(dayById(S.day)).queue.length === 1;
  const all = entriesFor(ex.id);
  const recent = all.slice(0, 3), archive = all.slice(3);
  const last = all[0];
  const pic = picHTML(ex);
  const isOpen = S.open.has(ex.id);
  const row = (e) => `<button class="log-row" data-act="entry" data-entry="${e.id}">
      <span class="lr-date">${relDay(e.date) === 'heute' ? 'Heute' : relDay(e.date) === 'gestern' ? 'Gestern' : dShort(e.date)}</span>
      <span class="lr-v">${e.w != null ? fmt(e.w) : '–'}</span>
      <span class="lr-v">${e.sets ?? '–'}</span>
      <span class="lr-v">${e.reps ?? '–'}</span>
      <span></span>
    </button>`;
  return `<section class="ex-card${train ? ' train' : ''}" data-ex="${ex.id}">
    <div class="ex-head">
      <button class="ex-photo${pic ? ' has' : ''}" data-act="photo" aria-label="${pic ? 'Foto vom Gerät ansehen' : 'Foto vom Gerät hinzufügen'}">
        ${pic || ICON.cam}
      </button>
      <div class="ex-head-text">
        <h3 class="ex-name">${esc(ex.name)}</h3>
        <div class="ex-sub">${esc(ex.group || '')}${ex.note ? ' · ' + esc(ex.note) : ''}</div>
      </div>
      <button class="more-btn" data-act="ex-menu" aria-label="Optionen für ${esc(ex.name)}">${ICON.more}</button>
      ${train ? '' : `<button class="drag-handle" aria-label="${esc(ex.name)} verschieben">${ICON.grip}</button>`}
    </div>
    <div class="log-table">
      <div class="lt-head"><span></span><span>kg</span><span>Sätze</span><span>Wdh</span><span></span></div>
      <div class="lt-new">
        <span class="lr-date new">Neu</span>
        <input class="lt-in" id="w-${ex.id}" data-f="w" value="${esc(dr.w || '')}" inputmode="decimal" autocomplete="off" placeholder="${last?.w != null ? esc(fmt(last.w)) : 'kg'}" aria-label="Gewicht in kg">
        <input class="lt-in" id="s-${ex.id}" data-f="sets" value="${esc(dr.sets || '')}" inputmode="numeric" autocomplete="off" placeholder="${last?.sets != null ? esc(last.sets) : '–'}" aria-label="Sätze">
        <input class="lt-in" id="r-${ex.id}" data-f="reps" value="${esc(dr.reps || '')}" inputmode="numeric" autocomplete="off" placeholder="${last?.reps != null ? esc(last.reps) : '–'}" aria-label="Wiederholungen">
        ${train ? '' : `<button class="lt-save" data-act="save" aria-label="Eintrag speichern">${ICON.check}</button>`}
      </div>
      ${train ? `<button class="btn btn-primary btn-block train-ok" data-act="save" data-last="${isLast ? 1 : 0}">${esc(okLabel(last, !!(dr.w || dr.sets || dr.reps), isLast))}</button>` : ''}
      ${recent.map(row).join('')}
      ${!all.length ? `<p class="lt-empty">Noch kein Eintrag. Trag oben ein, was du heute geschafft hast.</p>` : ''}
    </div>
    ${archive.length ? `
      <button class="archive-btn" data-act="archive" aria-expanded="${isOpen}">
        <span>Archiv · ${plural(archive.length, 'älterer Eintrag', 'ältere Einträge')}</span>${ICON.down}
      </button>
      ${isOpen ? `<div class="log-table archive">${archive.map(row).join('')}</div>` : ''}` : ''}
  </section>`;
}

/* ---------- Fortschritt ---------- */
const PERIODS = { w: { days: 7, label: '1 Woche', short: '1 W' }, m: { days: 30, label: '1 Monat', short: '1 M' }, h: { days: 182, label: '6 Monate', short: '6 M' }, y: { days: 365, label: '1 Jahr', short: '1 J' } };
const valOf = (x) => x.w || x.reps || 0;
const unitOf = (h) => (h.length && h.every((x) => !x.w) ? 'Wdh' : 'kg');

// Verlauf im gewählten Zeitraum: letzter Eintrag davor als Ausgangswert, dann alle Einträge im Zeitraum
function series(exId, key = S.period) {
  const asc = entriesFor(exId).reverse();
  const start = Date.now() - PERIODS[key].days * DAY;
  const inside = asc.filter((x) => x.date >= start);
  const before = asc.filter((x) => x.date < start).pop();
  const pts = before ? [before, ...inside] : inside;
  const first = pts[0], last = pts[pts.length - 1];
  const change = pts.length >= 2 && valOf(first) > 0 && inside.length ? ((valOf(last) - valOf(first)) / valOf(first)) * 100 : null;
  return { pts, inside, first, last, change, unit: unitOf(asc) };
}
const pct = (c) => `${c > 0 ? '+' : c < 0 ? '−' : '±'}${Math.abs(c).toLocaleString('de-AT', { maximumFractionDigits: 1, minimumFractionDigits: Math.abs(c) < 10 ? 1 : 0 })} %`;
const trend = (c) => (c == null ? 'flat' : c > 0.05 ? 'up' : c < -0.05 ? 'down' : 'flat');

let exQuery = '';
function viewProgress() {
  const p = PERIODS[S.period];
  const all = S.state.exercises.map((e) => series(e.id)).filter((s) => s.change != null);
  const avg = all.length ? all.reduce((a, s) => a + s.change, 0) / all.length : null;
  const ups = all.filter((s) => s.change > 0.05).length;
  return `
    <div class="period" role="group" aria-label="Zeitraum">
      ${Object.entries(PERIODS).map(([k, v]) => `<button data-act="period" data-p="${k}" aria-pressed="${k === S.period}">${v.short}</button>`).join('')}
    </div>
    <div class="summary">
      <div class="eyebrow">Steigerung in ${esc(p.label)}</div>
      ${avg == null
        ? `<div class="sum-val flat">–</div><p class="sum-sub">Noch zu wenig Einträge in diesem Zeitraum. Sobald eine Übung mindestens zwei Einträge hat, siehst du hier, wie stark du zulegst.</p>`
        : `<div class="sum-val ${trend(avg)}">${pct(avg)}</div><p class="sum-sub">Durchschnitt über ${plural(all.length, 'Übung', 'Übungen')} · ${ups} davon stärker geworden</p>`}
    </div>
    <input type="search" class="search" id="exSearch" placeholder="Übung suchen" value="${esc(exQuery)}" autocomplete="off">
    <div id="exList"></div>`;
}
function renderExList() {
  const box = $('#exList'); if (!box) return;
  const q = exQuery.trim().toLowerCase();
  const list = S.state.exercises.filter((e) => !q || e.name.toLowerCase().includes(q) || (e.group || '').toLowerCase().includes(q));
  if (!list.length) { box.innerHTML = `<div class="section"><div class="empty"><strong>Nichts gefunden</strong>Übungen legst du direkt in einem Trainingstag an.</div></div>`; return; }
  const rows = list.map((e) => ({ e, s: series(e.id), n: entriesFor(e.id).length }));
  // Übungen mit Daten zuerst, stärkste Steigerung oben
  rows.sort((a, b) => (b.s.change ?? -1e9) - (a.s.change ?? -1e9) || b.n - a.n || a.e.name.localeCompare(b.e.name, 'de'));
  box.innerHTML = `<div class="prog-list">${rows.map(({ e, s, n }) => {
    const pic = picHTML(e);
    const t = trend(s.change);
    const sub = !n ? 'Noch kein Eintrag'
      : s.change == null ? `Im Zeitraum zu wenig Einträge · zuletzt ${fmt(valOf(entriesFor(e.id)[0]))} ${s.unit}`
      : `${fmt(valOf(s.first))} → ${fmt(valOf(s.last))} ${s.unit}`;
    return `<button class="prog-card" data-act="ex-open" data-ex="${e.id}">
      <div class="pc-top">
        <span class="thumb">${pic}</span>
        <div style="min-width:0"><div class="row-title">${esc(e.name)}${inPlan(e.id) ? '' : ' <span class="tag-arch">Archiv</span>'}</div><div class="row-sub">${sub}</div></div>
        ${s.change != null ? `<span class="chg ${t}">${pct(s.change)}</span>` : ''}
      </div>
      ${s.pts.length >= 2 ? miniChart(s.pts.map(valOf), t) : ''}
    </button>`;
  }).join('')}</div>`;
}

let gradN = 0;
function miniChart(vals, t) {
  const W = 300, H = 54, P = 4;
  let min = Math.min(...vals), max = Math.max(...vals);
  if (min === max) { min -= 1; max += 1; }
  const pts = vals.map((v, i) => [P + (i * (W - 2 * P)) / (vals.length - 1), P + (1 - (v - min) / (max - min)) * (H - 2 * P)]);
  const color = t === 'up' ? 'var(--ok)' : t === 'down' ? 'var(--danger)' : 'var(--brass)';
  const id = 'm' + ++gradN;
  const line = pts.map((q) => q.map((n) => n.toFixed(1)).join(',')).join(' ');
  const last = pts[pts.length - 1];
  return `<svg class="mini" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".25"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
    <path d="M${pts[0][0]},${H} L${line.split(' ').join(' L')} L${last[0]},${H} Z" fill="url(#${id})"/>
    <polyline points="${line}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
  </svg>`;
}

function chart(points, unit, color = 'var(--brass)') {
  if (!points.length) return `<div class="chart-empty">Sobald du Einträge hast, siehst du hier deine Entwicklung.</div>`;
  const W = 340, H = 180, L = 40, R = 16, T = 18, B = 26;
  const ys = points.map((p) => p.y);
  const dMin = Math.min(...ys), dMax = Math.max(...ys);
  let min = dMin, max = dMax;
  if (min === max) { min -= Math.max(1, min * 0.1); max += Math.max(1, max * 0.1); }
  const pad = (max - min) * 0.12; min -= pad; max += pad;
  const X = (i) => (points.length === 1 ? (L + W - R) / 2 : L + (i * (W - L - R)) / (points.length - 1));
  const Y = (v) => T + (1 - (v - min) / (max - min)) * (H - T - B);
  const id = 'g' + ++gradN;
  const line = points.map((p, i) => `${X(i).toFixed(1)},${Y(p.y).toFixed(1)}`).join(' ');
  const area = `M${X(0)},${H - B} L${line.split(' ').join(' L')} L${X(points.length - 1)},${H - B} Z`;
  const lbl = (v) => (unit === 'kg' ? fmt(v, 1) : fmtInt(v));
  const last = points[points.length - 1];
  const lx = X(points.length - 1), ly = Y(last.y);
  const t = (x, y, s, a = 'start') => `<text x="${x}" y="${y}" text-anchor="${a}" font-size="11" fill="var(--muted)" font-family="Inter, system-ui">${s}</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Verlauf über ${points.length} Einträge, zuletzt ${lbl(last.y)} ${unit}">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".28"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
    <line x1="${L}" x2="${W - R}" y1="${Y(dMax)}" y2="${Y(dMax)}" stroke="var(--line)" stroke-dasharray="3 4"/>
    ${dMin !== dMax ? `<line x1="${L}" x2="${W - R}" y1="${Y(dMin)}" y2="${Y(dMin)}" stroke="var(--line)" stroke-dasharray="3 4"/>` : ''}
    ${t(L - 6, Y(dMax) + 4, lbl(dMax), 'end')}
    ${dMin !== dMax ? t(L - 6, Y(dMin) + 4, lbl(dMin), 'end') : ''}
    ${points.length > 1 ? `<path d="${area}" fill="url(#${id})"/><polyline points="${line}" fill="none" stroke="${color}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>` : ''}
    ${points.map((p, i) => `<circle cx="${X(i)}" cy="${Y(p.y)}" r="2.6" fill="var(--bg)" stroke="${color}" stroke-width="1.6"/>`).join('')}
    <circle cx="${lx}" cy="${ly}" r="9" fill="${color}" opacity=".18"/>
    <circle cx="${lx}" cy="${ly}" r="4.2" fill="${color}"/>
    ${t(L, H - 6, dFull(points[0].date))}
    ${points.length > 1 ? t(W - R, H - 6, dFull(last.date), 'end') : ''}
  </svg>`;
}

/* ================= Sheets ================= */
let sheetResolve = null;
function openSheet(inner, { onClose } = {}) {
  closeSheet();
  $('#sheetRoot').innerHTML = `<div class="sheet-backdrop" data-act="sheet-close"></div>
    <div class="sheet" role="dialog" aria-modal="true"><div class="wrap sheet-inner"><div class="sheet-grip"></div>${inner}</div></div>`;
  sheetResolve = onClose || null;
  document.body.style.overflow = 'hidden';
}
function closeSheet(value) {
  const r = sheetResolve; sheetResolve = null;
  $('#sheetRoot').innerHTML = '';
  document.body.style.overflow = '';
  if (r) r(value);
}
const sheetHead = (title, eyebrow = '') => `<div class="sheet-head"><div style="min-width:0">${eyebrow ? `<div class="eyebrow">${esc(eyebrow)}</div>` : ''}<h2 class="sheet-title">${esc(title)}</h2></div><button class="sheet-close" data-act="sheet-close" aria-label="Schließen">${ICON.x}</button></div>`;

function confirmSheet(title, text, ok, danger = false) {
  return new Promise((resolve) => {
    openSheet(`${sheetHead(title)}<p class="muted">${esc(text)}</p>
      <div class="sheet-actions"><button class="btn btn-block ${danger ? 'btn-danger' : 'btn-primary'}" data-act="confirm-yes">${esc(ok)}</button>
      <button class="btn btn-block btn-secondary" data-act="sheet-close">Abbrechen</button></div>`, { onClose: (v) => resolve(v === true) });
  });
}

let pickQuery = '';
function pickExercise(day) {
  pickQuery = '';
  return new Promise((resolve) => {
    openSheet(`${sheetHead('Übung hinzufügen', day.name)}
      <input type="search" class="field" id="pickSearch" placeholder="Name eintippen, z. B. Butterfly" autocomplete="off">
      <div class="pick-list" id="pickList" data-day="${day.id}"></div>`, { onClose: (v) => resolve(typeof v === 'string' ? v : null) });
    renderPickList();
    setTimeout(() => $('#pickSearch')?.focus(), 250);
  });
}
function renderPickList() {
  const box = $('#pickList'); if (!box) return;
  const day = dayById(box.dataset.day);
  const q = pickQuery.trim(), ql = q.toLowerCase();
  const match = (e) => !ql || e.name.toLowerCase().includes(ql) || (e.group || '').toLowerCase().includes(ql);
  const pool = S.state.exercises.filter((e) => !day.exIds.includes(e.id) && match(e)).sort((a, b) => a.name.localeCompare(b.name, 'de'));
  const archived = pool.filter((e) => !inPlan(e.id));
  const other = pool.filter((e) => inPlan(e.id));
  const exact = S.state.exercises.some((e) => e.name.toLowerCase() === ql);
  const item = (e, archivedItem) => {
    const h = entriesFor(e.id); const last = h[0];
    const info = last ? `${plural(h.length, 'Eintrag', 'Einträge')} · zuletzt ${last.w != null ? fmt(last.w) + ' kg' : (last.reps ?? '–') + ' Wdh'}` : (e.group || '');
    const where = archivedItem ? '' : S.state.days.filter((d) => d.exIds.includes(e.id)).map((d) => d.name).join(', ');
    return `<button data-act="pick" data-ex="${e.id}"><span class="pk-main"><span>${esc(e.name)}</span><span class="g">${esc(info)}${where ? ' · in ' + esc(where) : ''}</span></span>${photos.get(e.id) ? `<span class="thumb sm"><img src="${photos.get(e.id)}" alt=""></span>` : ''}</button>`;
  };
  let html = q && !exact ? `<button data-act="pick-new"><span class="pick-new">+ „${esc(q)}“ als neue Übung anlegen</span></button>` : '';
  if (archived.length) html += `<div class="pick-sec">Archiv · deine Daten sind noch da</div>` + archived.map((e) => item(e, true)).join('');
  if (other.length) html += `<div class="pick-sec">Aus anderen Trainingstagen</div>` + other.map((e) => item(e, false)).join('');
  if (!html) html = `<div class="chart-empty">Tippe oben den Namen deiner Übung ein.</div>`;
  box.innerHTML = html;
}

function openProgress(id) {
  const e = exById(id); if (!e) return;
  const h = entriesFor(id);
  const asc = [...h].reverse();
  const m = S.metric;
  const usesReps = h.length && h.every((x) => !x.w);
  const metricVal = (x) => (m === 'e1rm' ? e1rm(x.w, x.reps) : m === 'volume' ? vol(x) : x.w || x.reps || 0);
  const s = series(id);
  const pts = s.pts.map((x) => ({ date: x.date, y: metricVal(x) }));
  const c = pts.length >= 2 && pts[0].y > 0 && s.inside.length ? ((pts[pts.length - 1].y - pts[0].y) / pts[0].y) * 100 : null;
  const t = trend(c);
  const color = t === 'up' ? 'var(--ok)' : t === 'down' ? 'var(--danger)' : 'var(--brass)';
  const unit = m === 'weight' && usesReps ? 'Wdh' : 'kg';
  const P = PERIODS[S.period];
  const best = Math.max(0, ...h.map((x) => x.w ?? 0));
  const bestE = Math.max(0, ...h.map((x) => e1rm(x.w, x.reps)));
  let runMax = 0;
  const pr = new Set();
  for (const x of asc) { if (runMax > 0 && (x.w ?? 0) > runMax) pr.add(x.id); runMax = Math.max(runMax, x.w ?? 0); }
  const pic = picHTML(e);
  openSheet(`${sheetHead(e.name, e.group || 'Übung')}
    ${pic ? `<button class="photo-big" data-act="photo" data-ex="${id}">${pic}</button>` : ''}
    <div class="metric-toggle" role="group" aria-label="Kennzahl">
      <button data-act="metric" data-m="weight" data-ex="${id}" aria-pressed="${m === 'weight'}">${usesReps ? 'Wiederholungen' : 'Gewicht'}</button>
      <button data-act="metric" data-m="e1rm" data-ex="${id}" aria-pressed="${m === 'e1rm'}">1RM geschätzt</button>
      <button data-act="metric" data-m="volume" data-ex="${id}" aria-pressed="${m === 'volume'}">Volumen</button>
    </div>
    <div class="period" role="group" aria-label="Zeitraum">
      ${Object.entries(PERIODS).map(([k, v]) => `<button data-act="period" data-p="${k}" data-ex="${id}" aria-pressed="${k === S.period}">${v.short}</button>`).join('')}
    </div>
    <div class="detail-chg">
      ${c == null
        ? `<span class="sum-val flat">–</span><span class="sum-sub">In ${esc(P.label)} zu wenig Einträge für einen Vergleich.</span>`
        : `<span class="sum-val ${t}">${pct(c)}</span><span class="sum-sub">in ${esc(P.label)} · ${fmt(pts[0].y, 1)} → ${fmt(pts[pts.length - 1].y, 1)} ${unit}</span>`}
    </div>
    <div class="chart-box">${chart(pts, unit, color)}</div>
    <div class="kpis">
      <div class="kpi"><div class="kpi-val">${best ? fmt(best) : '–'}<small>${best ? 'kg' : ''}</small></div><div class="kpi-lbl">Bestwert</div></div>
      <div class="kpi"><div class="kpi-val">${bestE ? fmt(bestE, 1) : '–'}<small>${bestE ? 'kg' : ''}</small></div><div class="kpi-lbl">1RM geschätzt</div></div>
      <div class="kpi"><div class="kpi-val">${h.length}</div><div class="kpi-lbl">Einträge</div></div>
    </div>
    ${h.length ? `<div><h3 class="section-title" style="margin-bottom:8px">Alle Einträge</h3><div class="hist">${h.map((x) => `<div class="hist-row"><div class="hist-date">${dFull(x.date)}</div><div class="hist-sets">${x.w != null ? fmt(x.w) + ' kg' : '–'} · ${x.sets ?? '–'} × ${x.reps ?? '–'}${pr.has(x.id) ? ' <span class="pr">Neuer Bestwert</span>' : ''}</div></div>`).join('')}</div></div>` : ''}
    <div class="sheet-actions"><button class="btn btn-block btn-secondary" data-act="ex-edit" data-ex="${id}">Übung bearbeiten</button>${inPlan(id) ? '' : `<button class="btn btn-block btn-danger" data-act="ex-delete" data-ex="${id}">Endgültig löschen</button>`}</div>
    ${inPlan(id) ? '' : '<p class="small muted">Diese Übung ist archiviert. Über „Übung hinzufügen“ in einem Trainingstag holst du sie mit allen Einträgen zurück.</p>'}
    <p class="small muted">1RM geschätzt nach Epley: Gewicht × (1 + Wiederholungen / 30). Volumen: Gewicht × Sätze × Wiederholungen.</p>`);
}

let editGroup = '';
function editExercise(id) {
  const e = exById(id);
  editGroup = e.group || 'Sonstige';
  openSheet(`${sheetHead('Bearbeiten', 'Übung')}
    <div class="form" data-edit="${id}">
      <label class="lbl">Name<input class="field" id="exNameIn" value="${esc(e.name)}" autocomplete="off"></label>
      <div class="lbl">Muskelgruppe<div class="chips" id="groupChips">${GROUPS.map((g) => `<button data-act="group" data-g="${esc(g)}" aria-pressed="${g === editGroup}">${esc(g)}</button>`).join('')}</div></div>
      <label class="lbl">Notiz (optional)<input class="field" id="exNoteIn" value="${esc(e.note || '')}" placeholder="z. B. Sitz Stufe 4, enger Griff" autocomplete="off"></label>
      <p class="err" id="exErr" hidden></p>
      <div class="sheet-actions"><button class="btn btn-block btn-primary" data-act="ex-save">Speichern</button></div>
    </div>`);
}

function openSettings() {
  const last = lsGet(LS.backup, null);
  openSheet(`${sheetHead('Einstellungen')}
    <div><h3 class="section-title" style="margin-bottom:10px">Speicher</h3>
      <div class="note-box"><b style="color:var(--text)">Alles liegt auf diesem iPhone.</b><br>Die App braucht kein Konto und kein Internet. Damit nichts verloren geht, falls du das iPhone wechselst oder die App löschst, sicher deine Daten ab und zu in iCloud Drive. Die Fotos sind in der Sicherung enthalten.</div>
    </div>
    <div><h3 class="section-title" style="margin-bottom:10px">Sicherung</h3>
      <p class="small muted" style="margin-bottom:10px">Letzte Sicherung: <b style="color:var(--text)">${last ? esc(relDay(last)) : 'noch nie'}</b>. Tippe auf „Jetzt sichern“ und wähle dann „In Dateien sichern“ → iCloud Drive.</p>
      <div class="sheet-actions">
        <button class="btn btn-block btn-primary" data-act="export">Jetzt sichern</button>
        <button class="btn btn-block btn-secondary" data-act="import">Sicherung wiederherstellen</button>
      </div>
    </div>
    <p class="small muted">${plural(S.state.exercises.length, 'Übung', 'Übungen')} · ${plural(S.state.days.length, 'Trainingstag', 'Trainingstage')} · ${plural(S.entries.length, 'Eintrag', 'Einträge')} · ${plural(photos.size, 'Foto', 'Fotos')}</p>`);
}

/* ================= Fotos ================= */
let photoTarget = null;
function shrink(file, max = 1200) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement('canvas');
      c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      c.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob'))), 'image/jpeg', 0.82);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('img')); };
    img.src = url;
  });
}
async function setPhoto(exId, blob) {
  await IDB.set(exId, blob);
  if (photos.has(exId)) URL.revokeObjectURL(photos.get(exId));
  photos.set(exId, URL.createObjectURL(blob));
}
async function removePhoto(exId) {
  await IDB.del(exId).catch(() => {});
  if (photos.has(exId)) URL.revokeObjectURL(photos.get(exId));
  photos.delete(exId);
}
async function loadPhotos() {
  try {
    const keys = await IDB.keys();
    for (const k of keys) {
      const b = await IDB.get(k);
      if (b) photos.set(k, URL.createObjectURL(b));
    }
  } catch (e) { console.warn('Fotos', e); }
}
function choosePhoto(exId, camera) { photoTarget = exId; $(camera ? '#cameraFile' : '#photoFile').click(); }
function picHTML(ex) {
  const own = ex && photos.get(ex.id);
  return own ? `<img src="${own}" alt="">` : '';
}
function openPhoto(exId) {
  const ex = exById(exId);
  const own = photos.get(exId);
  openSheet(`${sheetHead(own ? 'Foto vom Gerät' : 'Foto hinzufügen', ex.name)}
    ${own ? `<div class="photo-full"><img src="${own}" alt="Dein Foto vom Gerät"></div>` : '<p class="muted">Mach ein Foto vom Gerät, damit du beim nächsten Mal gleich weißt, an welcher Maschine du die Übung gemacht hast.</p>'}
    <div class="sheet-actions">
      <button class="btn btn-block btn-primary" data-act="photo-cam" data-ex="${exId}">${ICON.cam} ${own ? 'Neues Foto aufnehmen' : 'Foto aufnehmen'}</button>
      <button class="btn btn-block btn-secondary" data-act="photo-lib" data-ex="${exId}">Aus der Mediathek wählen</button>
      ${own ? `<button class="btn btn-block btn-danger" data-act="photo-remove" data-ex="${exId}">Foto entfernen</button>` : ''}
    </div>`);
}

/* ================= Aktionen ================= */
const exOf = (el) => el.closest('[data-ex]')?.dataset.ex;
const curDay = () => dayById(S.day);
function touchPlan() { if (S.state.example) S.state.example = false; saveState(); }

function saveEntry(card) {
  const exId = card.dataset.ex;
  const get = (f) => card.querySelector(`[data-f="${f}"]`);
  const val = (f, isInt) => {
    const el = get(f);
    const v = el.value.trim() !== '' ? el.value : el.placeholder;
    const n = num(v);
    return n == null ? null : isInt ? Math.round(n) : n;
  };
  const typed = ['w', 'sets', 'reps'].some((f) => get(f).value.trim() !== '');
  const train = isTrain();
  const prev = entriesFor(exId)[0];
  if (!typed && !(train && prev && prev.reps != null)) { toast('Trag zuerst ein, was du heute gemacht hast'); get('w').focus(); return; }
  const entry = { id: uid(), exId, date: Date.now(), w: val('w'), sets: val('sets', true), reps: val('reps', true) };
  if (train && entry.reps == null) { toast('Trag noch die Wiederholungen ein'); get('reps').focus(); return; }
  const prevBest = Math.max(0, ...entriesFor(exId).map((e) => e.w ?? 0));
  S.entries.push(entry); saveEntries();
  if (S.state.example) { S.state.example = false; saveState(); }
  delete S.drafts[exId]; saveDrafts();
  if (navigator.vibrate) try { navigator.vibrate(12); } catch {}
  const best = prevBest && entry.w > prevBest ? `Neuer Bestwert: ${fmt(entry.w)} kg` : '';
  if (train) {
    document.activeElement?.blur?.();
    S.session.pick = null; S.session.later = S.session.later.filter((x) => x !== exId); touchSession();
    const next = trainState(curDay()).queue[0];
    render(); window.scrollTo(0, 0);
    toast(best || (next ? `Gespeichert. Weiter: ${exById(next).name}` : 'Gespeichert'));
  } else {
    card.outerHTML = exCard(exById(exId));
    toast(best || 'Gespeichert');
  }
}

const actions = {
  tab: (el) => {
    const t = el.dataset.tab;
    if (t === 'fortschritt') { if (S.tab !== t) S.ret = S.day ? [S.day, S.train] : null; return go(t); }
    const r = S.tab === 'fortschritt' && S.ret && dayById(S.ret[0]) ? S.ret : null;
    S.ret = null; r ? go('training', ...r) : go('training');
  },
  back: () => go('training'),
  settings: () => openSettings(),
  'sheet-close': () => closeSheet(),
  'confirm-yes': () => closeSheet(true),
  'example-ok': () => { touchPlan(); render(); },

  // Tage
  'open-day': (el) => go('training', el.dataset.day),
  'start-day': (el) => {
    const day = dayById(el.dataset.day);
    if (!day.exIds.some(exById)) return go('training', day.id);
    ensureSession(day); touchSession(); go('training', day.id, true);
  },
  'train-later': () => {
    const id = trainState(curDay()).queue[0];
    S.session.pick = null; S.session.later = [...S.session.later.filter((x) => x !== id), id]; touchSession();
    render(); window.scrollTo(0, 0);
  },
  'train-pick': (el) => { S.session.pick = el.dataset.id; touchSession(); render(); window.scrollTo(0, 0); },
  'train-again': () => { S.session = { dayId: S.day, since: Date.now(), touched: Date.now(), later: [], pick: null }; saveSession(); render(); window.scrollTo(0, 0); },
  'train-end': () => { S.session = null; saveSession(); closeSheet(); go('training'); },
  'train-plan': () => { closeSheet(); go('training', S.day); },
  'day-add': () => {
    const day = { id: uid(), name: `Tag ${S.state.days.length + 1}`, exIds: [] };
    S.state.days.push(day); touchPlan(); go('training', day.id);
    setTimeout(() => renameDay(), 50);
  },
  'day-menu': () => {
    const day = curDay();
    if (isTrain()) return openSheet(`${sheetHead(day.name, 'Training')}<div class="menu-list">
      <button data-act="train-plan">Alle Übungen anzeigen und bearbeiten</button>
      <button data-act="ex-add">Übung hinzufügen</button>
      <button data-act="train-end">Training beenden</button></div>
      <p class="small muted">Alles, was du schon bestätigt hast, ist gespeichert. Startest du den Tag heute noch einmal, machst du bei der ersten offenen Übung weiter.</p>`);
    openSheet(`${sheetHead(day.name, 'Trainingstag')}<div class="menu-list">
      <button data-act="day-rename">Umbenennen</button>
      <button data-act="day-move" data-dir="-1">In der Liste nach oben</button>
      <button data-act="day-move" data-dir="1">In der Liste nach unten</button>
      <button class="danger" data-act="day-del">Trainingstag löschen</button></div>`);
  },
  'day-rename': () => renameDay(),
  'rename-save': () => {
    const v = $('#dayNameIn').value.trim();
    if (v) { curDay().name = v; touchPlan(); }
    closeSheet(); render();
  },
  'day-move': (el) => { const a = S.state.days; const i = a.indexOf(curDay()), j = i + +el.dataset.dir; if (j >= 0 && j < a.length) [a[i], a[j]] = [a[j], a[i]]; touchPlan(); closeSheet(); toast('Reihenfolge geändert'); },
  'day-del': async () => {
    const day = curDay();
    if (await confirmSheet(`${day.name} löschen?`, 'Der Tag verschwindet aus deiner Liste. Die Einträge deiner Übungen bleiben unter „Fortschritt“ erhalten.', 'Löschen', true)) {
      S.state.days = S.state.days.filter((d) => d !== day); touchPlan(); go('training');
    }
  },

  // Übungen im Tag
  'ex-add': async () => {
    const day = curDay();
    const id = await pickExercise(day);
    if (!id) return;
    day.exIds.push(id); touchPlan(); render();
    setTimeout(() => { const c = document.querySelector(`.ex-card[data-ex="${id}"]`); c?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 30);
  },
  pick: (el) => closeSheet(el.dataset.ex),
  'pick-new': () => {
    const name = pickQuery.trim(); if (!name) return;
    const e = { id: uid(), name, group: 'Sonstige', note: '' };
    S.state.exercises.push(e); saveState(); closeSheet(e.id);
  },
  'ex-menu': (el) => {
    const id = exOf(el); const ex = exById(id);
    openSheet(`${sheetHead(ex.name, 'Übung')}<div class="menu-list" data-ex="${id}">
      <button data-act="photo">${picHTML(ex) ? 'Foto vom Gerät ändern' : 'Foto vom Gerät hinzufügen'}</button>
      <button data-act="ex-edit">Name, Muskelgruppe, Notiz</button>
      <button data-act="ex-move" data-dir="-1">Nach oben</button>
      <button data-act="ex-move" data-dir="1">Nach unten</button>
      <button class="danger" data-act="ex-remove">Aus dem Plan entfernen</button></div>`);
  },
  'ex-move': (el) => { const id = exOf(el); const a = curDay().exIds; const i = a.indexOf(id), j = i + +el.dataset.dir; if (j >= 0 && j < a.length) [a[i], a[j]] = [a[j], a[i]]; touchPlan(); closeSheet(); render(); },
  'ex-remove': (el) => {
    const id = exOf(el); const day = curDay();
    day.exIds = day.exIds.filter((x) => x !== id);
    touchPlan(); closeSheet(); render();
    toast(inPlan(id) ? `Aus ${day.name} entfernt` : 'Ins Archiv verschoben. Alle Einträge bleiben erhalten');
  },
  'ex-delete': async (el) => {
    const id = el.dataset.ex; const ex = exById(id); const n = entriesFor(id).length;
    const ok = await confirmSheet(`${ex.name} endgültig löschen?`, `Die Übung${n ? ` mit ${plural(n, 'Eintrag', 'Einträgen')}` : ''}${photos.has(id) ? ' und Foto' : ''} wird gelöscht. Das lässt sich nicht rückgängig machen.`, 'Endgültig löschen', true);
    if (!ok) return;
    S.state.exercises = S.state.exercises.filter((x) => x.id !== id);
    S.entries = S.entries.filter((x) => x.exId !== id); saveEntries(); saveState();
    await removePhoto(id); render(); toast('Übung gelöscht');
  },
  'ex-edit': (el) => editExercise(exOf(el)),
  group: (el) => { editGroup = el.dataset.g; document.querySelectorAll('#groupChips button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.g === editGroup)); },
  'ex-save': (el) => {
    const id = el.closest('[data-edit]').dataset.edit;
    const name = $('#exNameIn').value.trim();
    const err = $('#exErr');
    if (!name) { err.textContent = 'Gib der Übung einen Namen.'; err.hidden = false; return; }
    if (S.state.exercises.some((e) => e.id !== id && e.name.toLowerCase() === name.toLowerCase())) { err.textContent = 'Eine Übung mit diesem Namen gibt es schon.'; err.hidden = false; return; }
    Object.assign(exById(id), { name, group: editGroup, note: $('#exNoteIn').value.trim() });
    saveState(); closeSheet(); render(); toast('Gespeichert');
  },
  'ex-open': (el) => openProgress(el.dataset.ex),
  period: (el) => { S.period = el.dataset.p; lsSet(LS.period, S.period); render(); if (el.dataset.ex) openProgress(el.dataset.ex); },
  metric: (el) => { S.metric = el.dataset.m; lsSet(LS.metric, S.metric); openProgress(el.dataset.ex); },

  // Einträge
  save: (el) => saveEntry(el.closest('.ex-card')),
  archive: (el) => { const id = exOf(el); S.open.has(id) ? S.open.delete(id) : S.open.add(id); const c = el.closest('.ex-card'); c.outerHTML = exCard(exById(id)); },
  entry: (el) => {
    const e = S.entries.find((x) => x.id === el.dataset.entry); if (!e) return;
    openSheet(`${sheetHead(`${e.w != null ? fmt(e.w) + ' kg' : '–'} · ${e.sets ?? '–'} × ${e.reps ?? '–'}`, `${exById(e.exId)?.name || ''} · ${dFull(e.date)}`)}
      <div class="sheet-actions"><button class="btn btn-block btn-danger" data-act="entry-del" data-entry="${e.id}">Eintrag löschen</button>
      <button class="btn btn-block btn-secondary" data-act="sheet-close">Abbrechen</button></div>`);
  },
  'entry-del': (el) => { S.entries = S.entries.filter((x) => x.id !== el.dataset.entry); saveEntries(); closeSheet(); render(); toast('Eintrag gelöscht'); },

  // Fotos
  photo: (el) => { const id = exOf(el) || el.dataset.ex; closeSheet(); openPhoto(id); },
  'photo-cam': (el) => { closeSheet(); choosePhoto(el.dataset.ex, true); },
  'photo-lib': (el) => { closeSheet(); choosePhoto(el.dataset.ex, false); },
  'photo-remove': async (el) => { await removePhoto(el.dataset.ex); closeSheet(); render(); toast('Foto entfernt'); },

  // Sicherung
  export: () => exportData(),
  import: () => $('#importFile').click(),
};

function renameDay() {
  const day = curDay();
  openSheet(`${sheetHead('Umbenennen', 'Trainingstag')}
    <input class="field" id="dayNameIn" value="${esc(day.name)}" autocomplete="off" enterkeyhint="done">
    <div class="sheet-actions"><button class="btn btn-block btn-primary" data-act="rename-save">Speichern</button></div>`);
  setTimeout(() => { const i = $('#dayNameIn'); i?.focus(); i?.select(); }, 250);
}

document.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const fn = actions[el.dataset.act];
  if (fn) { ev.preventDefault(); fn(el); }
});

document.addEventListener('input', (ev) => {
  const t = ev.target;
  if (t.id === 'exSearch') { exQuery = t.value; renderExList(); }
  else if (t.id === 'pickSearch') { pickQuery = t.value; renderPickList(); }
  else if (t.classList.contains('lt-in')) {
    const clean = t.value.replace(t.dataset.f === 'w' ? /[^\d.,]/g : /[^\d]/g, '');
    if (clean !== t.value) t.value = clean;
    const card = t.closest('.ex-card'), id = card.dataset.ex;
    S.drafts[id] = { ...draftFor(id), day: startOfDay(Date.now()), [t.dataset.f]: clean };
    saveDrafts(); updateOk(card);
  }
});

document.addEventListener('change', async (ev) => {
  const t = ev.target;
  if (t.id === 'importFile') { importData(t.files[0]); t.value = ''; }
  if (t.id === 'photoFile' || t.id === 'cameraFile') {
    const file = t.files[0]; t.value = '';
    if (!file || !photoTarget) return;
    try { await setPhoto(photoTarget, await shrink(file)); render(); toast('Foto gespeichert'); }
    catch { toast('Das Foto konnte nicht geladen werden'); }
  }
});

/* ================= Übungen verschieben (Drag-and-Drop) ================= */
// Am Griff festhalten und ziehen. Während des Ziehens klappen alle Karten zu,
// damit man die Reihenfolge auf einen Blick sieht.
let drag = null;
function dragPlace(y) {
  const { card } = drag;
  const others = [...document.querySelectorAll('#view .ex-card')].filter((c) => c !== card);
  card.style.transform = '';
  // Mitte der gezogenen Karte entscheidet, wo sie landet
  const mid = y - drag.dy + card.offsetHeight / 2;
  const before = others.find((c) => { const r = c.getBoundingClientRect(); return mid < r.top + r.height / 2; });
  if (before) { if (card.nextElementSibling !== before) before.before(card); }
  else if (others.length && others[others.length - 1].nextElementSibling !== card) others[others.length - 1].after(card);
  const r = card.getBoundingClientRect();
  card.style.transform = `translateY(${y - drag.dy - r.top}px)`;
}
function dragScroll() {
  if (!drag) return;
  const y = drag.y, edge = 90, h = window.innerHeight;
  const v = y < edge ? -Math.ceil((edge - y) / 6) : y > h - edge - 70 ? Math.ceil((y - (h - edge - 70)) / 6) : 0;
  if (v) { window.scrollBy(0, v); dragPlace(y); }
  drag.raf = requestAnimationFrame(dragScroll);
}
document.addEventListener('pointerdown', (ev) => {
  const handle = ev.target.closest('.drag-handle');
  if (!handle || drag) return;
  ev.preventDefault();
  const card = handle.closest('.ex-card');
  const before = card.getBoundingClientRect().top;
  document.body.classList.add('reordering');
  // Karte nach dem Zuklappen wieder unter den Finger holen
  window.scrollBy(0, card.getBoundingClientRect().top - before);
  const r = card.getBoundingClientRect();
  drag = { card, dy: ev.clientY - r.top, y: ev.clientY, start: [...document.querySelectorAll('#view .ex-card')].map((c) => c.dataset.ex).join() };
  card.classList.add('dragging');
  try { handle.setPointerCapture(ev.pointerId); } catch {}
  if (navigator.vibrate) try { navigator.vibrate(10); } catch {}
  dragPlace(ev.clientY);
  drag.raf = requestAnimationFrame(dragScroll);
});
document.addEventListener('pointermove', (ev) => {
  if (!drag) return;
  ev.preventDefault();
  drag.y = ev.clientY;
  dragPlace(ev.clientY);
}, { passive: false });
function dragEnd() {
  if (!drag) return;
  cancelAnimationFrame(drag.raf);
  const ids = [...document.querySelectorAll('#view .ex-card')].map((c) => c.dataset.ex);
  const changed = ids.join() !== drag.start;
  drag.card.classList.remove('dragging');
  drag.card.style.transform = '';
  document.body.classList.remove('reordering');
  drag = null;
  const day = curDay();
  if (changed && day) {
    day.exIds = [...ids, ...day.exIds.filter((id) => !ids.includes(id))];
    touchPlan();
    toast('Reihenfolge gespeichert');
  }
  render();
}
document.addEventListener('pointerup', dragEnd);
document.addEventListener('pointercancel', dragEnd);
document.addEventListener('touchmove', (ev) => { if (drag) ev.preventDefault(); }, { passive: false });

document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape' && $('#sheetRoot').innerHTML) closeSheet();
  if (ev.key === 'Enter' && ev.target.classList.contains('lt-in')) {
    ev.preventDefault();
    const card = ev.target.closest('.ex-card');
    const ins = [...card.querySelectorAll('.lt-in')];
    const i = ins.indexOf(ev.target);
    if (i < ins.length - 1) ins[i + 1].focus(); else { ev.target.blur(); saveEntry(card); }
  }
  if (ev.key === 'Enter' && ev.target.id === 'dayNameIn') actions['rename-save']();
  if (ev.key === 'Enter' && ev.target.id === 'pickSearch') $('#pickList button')?.click();
});

/* ================= Toast ================= */
let toastT;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.hidden = false;
  t.style.animation = 'none'; void t.offsetWidth; t.style.animation = '';
  clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), 2600);
}

/* ================= Sicherung ================= */
const blobToData = (b) => new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(b); });
async function exportData() {
  const pics = {};
  for (const k of photos.keys()) { const b = await IDB.get(k).catch(() => null); if (b) pics[k] = await blobToData(b); }
  const data = { app: 'kraftbuch', version: 2, exportedAt: new Date().toISOString(), state: S.state, entries: S.entries, photos: pics };
  const name = `kraftbuch-${new Date().toISOString().slice(0, 10)}.json`;
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  try {
    const file = new File([blob], name, { type: 'application/json' });
    if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: 'Kraftbuch Sicherung' }); return backedUp(); }
  } catch (e) { if (e?.name === 'AbortError') return; }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  backedUp();
}
function backedUp() { lsSet(LS.backup, Date.now()); closeSheet(); render(); toast('Sicherung erstellt'); }

async function importData(file) {
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (!data?.state?.exercises || !Array.isArray(data.state.days) || !Array.isArray(data.entries)) throw new Error();
    const ok = await confirmSheet('Sicherung wiederherstellen?', `Deine Übungen, Einträge und Fotos auf diesem iPhone werden durch die Sicherung ersetzt (${plural(data.entries.length, 'Eintrag', 'Einträge')}).`, 'Ersetzen', true);
    if (!ok) return;
    S.state = data.state; S.entries = data.entries;
    saveState(); saveEntries();
    S.session = null; S.drafts = {}; saveSession(); saveDrafts();
    await IDB.clear().catch(() => {});
    photos.forEach((u) => URL.revokeObjectURL(u)); photos.clear();
    for (const [k, d] of Object.entries(data.photos || {})) await setPhoto(k, await (await fetch(d)).blob());
    go('training'); toast('Sicherung wiederhergestellt');
  } catch { toast('Die Datei ist keine Kraftbuch-Sicherung'); }
}

/* ================= Start ================= */
// Ein altes Training (länger als 6 Stunden her) nicht wieder öffnen
function leaveStale() { if (S.train && !sessionFresh()) { S.session = null; saveSession(); S.train = false; lsSet(LS.train, false); if (S.tab === 'training') { S.day = null; lsSet(LS.day, null); } return true; } return false; }
for (const k of Object.keys(S.drafts)) if (S.drafts[k].day !== startOfDay(Date.now())) delete S.drafts[k];
saveDrafts();
leaveStale();
document.addEventListener('visibilitychange', () => { if (!document.hidden && leaveStale()) render(); });
render();
loadPhotos().then(() => { if (photos.size) render(); });
if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
