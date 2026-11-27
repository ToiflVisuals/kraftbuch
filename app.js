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
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 5-7 7 7 7"/></svg>',
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
  metric: ['all', 'weight', 'reps'].includes(lsGet(LS.metric, '')) ? lsGet(LS.metric, '') : 'all',
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
// Neue Einträge haben jeden Satz einzeln (list). Ältere kennen nur den ersten Satz.
const setsOf = (e) => e.list || [{ w: e.w ?? null, r: e.reps ?? null }];
const setText = (x) => `${x.w != null ? fmt(x.w) + ' kg × ' : ''}${x.r ?? '–'}${x.w != null ? '' : ' Wdh'}`;
const setsText = (e) => setsOf(e).map(setText).join(' · ');
const maxW = (e) => Math.max(0, ...setsOf(e).map((x) => x.w ?? 0));
const maxE = (e) => Math.max(0, ...setsOf(e).map((x) => e1rm(x.w, x.r)));
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
  S.session = { dayId: day.id, since: startOfDay(Date.now()), touched: Date.now(), later: [], pick: null, swaps: {} };
  saveSession();
  return S.session;
}
function trainState(day) {
  const ses = ensureSession(day);
  const ids = day.exIds.filter(exById);
  // Getauschte Übungen: der Plan bleibt gleich, eingetragen wird bei der heute gemachten Übung
  const eff = (id) => (ses.swaps?.[id] && exById(ses.swaps[id]) ? ses.swaps[id] : id);
  const entryOf = (id) => entriesFor(eff(id)).find((e) => e.date >= ses.since);
  const done = ids.filter(entryOf);
  const open = ids.filter((id) => !done.includes(id));
  let queue = [...open.filter((id) => !ses.later.includes(id)), ...ses.later.filter((id) => open.includes(id))];
  if (ses.pick && queue.includes(ses.pick)) queue = [ses.pick, ...queue.filter((id) => id !== ses.pick)];
  return { ids, done, queue, entryOf, eff };
}
const isTrain = () => S.train && S.tab === 'training' && !!S.day;

// Angefangene Eingaben überleben Umsortieren, Fotos und das Schließen der App
const draftFresh = (d) => !!d && Array.isArray(d.s) && Date.now() - d.at < SESSION_MAX;
const draftFor = (id) => (draftFresh(S.drafts[id]) ? S.drafts[id] : null);
const saveDrafts = () => lsSet(LS.drafts, S.drafts);
function editDraft(id) {
  const d = draftFor(id) || (S.drafts[id] = { s: [] });
  d.at = Date.now();
  return d;
}
// Sätze einer Übung für die Eingabe: Getipptes, Bestätigtes und die Werte vom letzten Mal
function setRows(exId) {
  const d = draftFor(exId);
  const h = entriesFor(exId);
  const usual = h.length ? Math.max(...h.slice(0, 3).map((e) => e.list?.length ?? e.sets ?? 1)) : 2;
  const n = Math.max(1, Math.min(8, d?.n ?? usual));
  const rows = [];
  for (let i = 0; i < n; i++) {
    const x = d?.s[i] || {};
    const prev = h.map((e) => setsOf(e)[i]).find((p) => p && p.r != null) || null;
    const pw = prev ? prev.w : rows[i - 1]?.ew ?? null;
    const w = x.w || '', r = x.r || '';
    rows.push({ w, r, ok: !!x.ok, prev, pw, pr: prev?.r ?? null, ew: w !== '' ? num(w) : pw, er: r !== '' ? num(r) : prev?.r ?? null });
  }
  return rows;
}
function makeEntry(exId, list, date) {
  return { id: uid(), exId, date, list, w: list[0].w, sets: list.length, reps: list[0].r };
}
// Bestätigte Sätze nie verlieren: aus liegen gebliebenen Entwürfen Einträge machen
function flushDrafts(want) {
  let saved = 0;
  for (const [id, d] of Object.entries(S.drafts)) {
    if (!want(id, d)) continue;
    const list = (Array.isArray(d.s) ? d.s : []).filter((x) => x?.ok).map((x) => ({ w: num(x.w), r: num(x.r) }));
    if (list.length && exById(id)) { S.entries.push(makeEntry(id, list, d.at)); saved++; }
    delete S.drafts[id];
  }
  saveDrafts();
  if (saved) saveEntries();
}

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
    countUp();
  } else if (isTrain()) {
    const day = dayById(S.day);
    setHeader('Training', day.name || 'Ohne Namen', true);
    v.innerHTML = viewTrain(day);
  } else if (S.day) {
    const day = dayById(S.day);
    setHeader('Trainingstag', day.name || 'Ohne Namen', true);
    v.innerHTML = viewDay(day);
  } else {
    setHeader(new Date().toLocaleDateString('de-AT', { weekday: 'long', day: 'numeric', month: 'long' }), 'Training');
    v.innerHTML = viewDays();
  }
}

function animateIn() {
  const v = $('#view'); if (reduceMotion()) return;
  v.classList.remove('enter'); void v.offsetWidth; v.classList.add('enter');
  clearTimeout(animateIn.t); animateIn.t = setTimeout(() => v.classList.remove('enter'), 900);
}
// Prozentzahlen zählen hoch
function countUp() {
  document.querySelectorAll('[data-count]').forEach((el) => {
    const to = parseFloat(el.dataset.count); if (!Number.isFinite(to) || reduceMotion()) return;
    const t0 = performance.now(), dur = 750;
    const step = (t) => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = pct(to * e); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
}
function go(tab, day = null, train = false) {
  S.tab = tab; S.day = day; S.train = train;
  lsSet(LS.tab, tab); lsSet(LS.day, day); lsSet(LS.train, train);
  render();
  animateIn();
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
    const meta = running ? `${active.done.length} von ${active.ids.length} erledigt · weiter mit ${exById(active.eff(active.queue[0])).name}`
      : `${plural(day.exIds.length, 'Übung', 'Übungen')}${last ? ' · zuletzt ' + relDay(last) : ''}`;
    html += `<div class="day-card${running ? ' running' : ''}">
      <button class="dc-main" data-act="start-day" data-day="${day.id}">
        <span class="day-name">${esc(day.name || 'Ohne Namen')}</span>
        <span class="day-meta">${esc(meta)}</span>
      </button>
      <button class="dc-edit" data-act="open-day" data-day="${day.id}" aria-label="${esc(day.name)} bearbeiten">${ICON.pen}</button>
      <button class="dc-start" data-act="start-day" data-day="${day.id}" aria-label="${esc(day.name)} ${running ? 'fortsetzen' : 'starten'}">${running ? 'Weiter' : 'Starten'}${ICON.chev}</button>
    </div>`;
  }
  if (!S.state.days.length) html += `<div class="empty"><strong>Noch kein Trainingstag</strong>Leg unten deinen ersten Tag an, z. B. „Oberkörper“.</div>`;
  html += `<button class="btn-dashed" data-act="day-add">+ Trainingstag hinzufügen</button>${allExButton()}</div>`;
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
  const { ids, done, queue, entryOf, eff } = trainState(day);
  const swapNote = (id) => (eff(id) !== id ? `<small class="tr-swap">statt ${esc(exById(id).name)}</small>` : '');
  const doneRow = (id) => {
    const e = entryOf(id);
    return `<button class="tr-row done" data-act="entry" data-entry="${e.id}"><span class="tr-ic">${ICON.check}</span><span class="tr-name">${esc(exById(eff(id)).name)}${swapNote(id)}</span><span class="tr-val">${esc(setsText(e))}</span></button>`;
  };
  let html = `<div class="tr-bar" role="img" aria-label="${done.length} von ${ids.length} Übungen erledigt">${ids.map((id) => `<i class="${done.includes(id) ? 'on' : id === queue[0] ? 'now' : ''}"></i>`).join('')}</div>`;
  if (!queue.length) {
    html += `<div class="tr-finish"><div class="tr-check">${ICON.check}</div><h2>${esc(day.name)} geschafft</h2><p class="muted">${plural(ids.length, 'Übung', 'Übungen')} eingetragen.</p>
      <button class="btn btn-primary btn-block" data-act="train-end">Zur Übersicht</button>
      <button class="btn btn-ghost" data-act="train-again">Diesen Tag heute noch einmal trainieren</button></div>`;
  } else {
    html += `<div class="tr-now"><span class="section-title">Jetzt · Übung ${done.length + 1} von ${ids.length}</span>${queue.length > 1 ? '<button class="tr-later" data-act="train-later">Später machen</button>' : ''}</div>${exCard(exById(eff(queue[0])), queue[0])}`;
    if (queue.length > 1) html += `<div class="tr-sec"><h2 class="section-title">Danach</h2><div class="tr-list">${queue.slice(1).map((id, i) => {
      const x = eff(id), last = entriesFor(x)[0];
      return `<button class="tr-row" data-act="train-pick" data-id="${id}"><span class="tr-ic">${picHTML(exById(x)) || `<b>${done.length + i + 2}</b>`}</span><span class="tr-name">${esc(exById(x).name)}${swapNote(id)}</span><span class="tr-val">${((k) => (k ? `${k} ${k === 1 ? 'Satz' : 'Sätze'} notiert` : last ? esc(setText(setsOf(last)[0])) : ''))(setRows(x).filter((y) => y.ok).length)}</span></button>`;
    }).join('')}</div></div>`;
  }
  if (done.length) html += `<div class="tr-sec"><h2 class="section-title">Erledigt</h2><div class="tr-list">${done.map(doneRow).join('')}</div></div>`;
  return html;
}
function okLabel(exId) {
  const rows = setRows(exId); const i = rows.findIndex((x) => !x.ok);
  if (i < 0) return 'Speichern';
  const x = rows[i];
  if (x.w === '' && x.r === '' && x.er != null) return `Satz ${i + 1} wie letztes Mal: ${setText({ w: x.ew, r: x.er })}`;
  return `Satz ${i + 1} bestätigen${rows.filter((y) => !y.ok).length === 1 ? ' und weiter' : ''}`;
}
function refreshCard(card) {
  const rows = setRows(card.dataset.ex);
  rows.forEach((x, i) => { const el = card.querySelector(`.lt-in[data-f="w"][data-i="${i}"]`); if (el) el.placeholder = x.pw != null ? fmt(x.pw) : 'kg'; });
  const b = card.querySelector('.train-ok'); if (b) b.textContent = okLabel(card.dataset.ex);
}

const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
function redrawCard(card, justSet = -1) {
  const id = card.dataset.ex, plan = card.dataset.plan || id;
  $('#view').classList.remove('enter'); // sonst steigt die neu gezeichnete Karte noch einmal auf
  card.outerHTML = exCard(exById(id), plan);
  if (justSet >= 0) document.querySelector(`.ex-card[data-ex="${id}"]`)?.querySelectorAll('.set-r')[justSet]?.classList.add('just');
}

function exCard(ex, planId = ex.id) {
  const train = isTrain();
  const rows = setRows(ex.id);
  const cur = rows.findIndex((x) => !x.ok);
  const all = entriesFor(ex.id);
  const recent = all.slice(0, 3), archive = all.slice(3);
  const pic = picHTML(ex);
  const isOpen = S.open.has(ex.id);
  const row = (e) => `<button class="log-row" data-act="entry" data-entry="${e.id}">
      <span class="lr-date">${relDay(e.date) === 'heute' ? 'Heute' : relDay(e.date) === 'gestern' ? 'Gestern' : dShort(e.date)}</span>
      <span class="lr-sets">${setsOf(e).map((x) => `<span>${esc(setText(x))}</span>`).join('')}</span>
    </button>`;
  return `<section class="ex-card${train ? ' train' : ''}" data-ex="${ex.id}" data-plan="${planId}">
    <div class="ex-head">
      <button class="ex-photo${pic ? ' has' : ''}" data-act="photo" aria-label="${pic ? 'Foto vom Gerät ansehen' : 'Foto vom Gerät hinzufügen'}">
        ${pic || ICON.cam}
      </button>
      <div class="ex-head-text">
        <h3 class="ex-name">${esc(ex.name)}</h3>
        <div class="ex-sub">${esc(ex.group || '')}${ex.note ? ' · ' + esc(ex.note) : ''}</div>
        ${!train ? '' : planId !== ex.id
          ? `<div class="swap-info">Heute statt <b>${esc(exById(planId)?.name || '')}</b> <button class="swap-btn" data-act="train-unswap">Zurück zum Plan</button></div>`
          : '<button class="swap-btn" data-act="train-swap">⇄ Andere Übung</button>'}
      </div>
      <button class="more-btn" data-act="ex-menu" aria-label="Optionen für ${esc(ex.name)}">${ICON.more}</button>
      ${train ? '' : `<button class="drag-handle" aria-label="${esc(ex.name)} verschieben">${ICON.grip}</button>`}
    </div>
    <div class="log-table">
      <div class="set-h"><span></span><span>kg</span><span>Wdh</span><span></span></div>
      ${rows.map((x, i) => `<div class="set-r${x.ok ? ' done' : i === cur ? ' now' : ''}">
        <span class="set-n">Satz ${i + 1}</span>
        <input class="lt-in" id="w-${ex.id}-${i}" data-f="w" data-i="${i}" value="${esc(x.w)}" inputmode="decimal" autocomplete="off" placeholder="${x.pw != null ? esc(fmt(x.pw)) : x.ok ? '–' : 'kg'}" aria-label="Satz ${i + 1}, Gewicht in kg"${x.ok ? ' readonly' : ''}>
        <input class="lt-in" id="r-${ex.id}-${i}" data-f="r" data-i="${i}" value="${esc(x.r)}" inputmode="numeric" autocomplete="off" placeholder="${x.pr != null ? esc(x.pr) : '–'}" aria-label="Satz ${i + 1}, Wiederholungen"${x.ok ? ' readonly' : ''}>
        <button class="set-tick" data-act="set-tick" data-i="${i}" aria-pressed="${x.ok}" aria-label="Satz ${i + 1} ${x.ok ? 'wieder öffnen' : 'bestätigen'}">${ICON.check}</button>
      </div>`).join('')}
      <div class="set-tools"><button data-act="set-add">+ Satz</button>${rows.length > 1 && !rows[rows.length - 1].ok ? `<button data-act="set-drop">Satz ${rows.length} weglassen</button>` : ''}</div>
      ${train ? `<button class="btn btn-primary btn-block train-ok" data-act="save">${esc(okLabel(ex.id))}</button>` : ''}
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
const ratio = (a, b) => (a > 0 && b != null ? ((b - a) / a) * 100 : null);
const avgOf = (list) => { const l = list.filter((x) => x != null); return l.length ? l.reduce((a, b) => a + b, 0) / l.length : null; };
// Kennzahl eines Satzes. „Gesamt“ verbindet Gewicht und Wiederholungen (Epley), ohne Gewicht zählen die Wiederholungen.
const setVal = (x, m) => (!x ? null : m === 'weight' ? x.w || null : m === 'reps' ? x.r : x.w ? e1rm(x.w, x.r) : x.r);
// Vergleicht Satz 1 mit Satz 1, Satz 2 mit Satz 2 usw. und mittelt. So verfälscht ein neu dokumentierter Satz nichts.
function compare(pts, start = 0) {
  const n = Math.max(0, ...pts.map((e) => setsOf(e).length));
  const out = { all: [], weight: [], reps: [] };
  for (let i = 0; i < n; i++) {
    const have = pts.filter((e) => setsOf(e)[i]?.r != null || setsOf(e)[i]?.w != null);
    const A = have[0], B = have[have.length - 1];
    if (have.length < 2 || B.date < start) continue;
    const a = setsOf(A)[i], b = setsOf(B)[i];
    const w = a.w > 0 && b.w > 0 ? ratio(a.w, b.w) : null, r = ratio(a.r, b.r);
    out.weight.push(w); out.reps.push(r);
    out.all.push(a.w > 0 && b.w > 0 ? (a.r != null && b.r != null ? ratio(e1rm(a.w, a.r), e1rm(b.w, b.r)) : w) : r);
  }
  return { all: avgOf(out.all), weight: avgOf(out.weight), reps: avgOf(out.reps) };
}
// Verlauf im gewählten Zeitraum: letzter Eintrag davor als Ausgangswert, dann alle Einträge im Zeitraum
function series(exId, key = S.period) {
  const asc = entriesFor(exId).reverse();
  const start = Date.now() - PERIODS[key].days * DAY;
  const inside = asc.filter((x) => x.date >= start);
  const before = asc.filter((x) => x.date < start).pop();
  const pts = before ? [before, ...inside] : inside;
  return { pts, first: pts[0], last: pts[pts.length - 1], ...compare(pts, start) };
}
const points = (c) => `<div class="pts"><span><i class="${trend(c.weight)}"></i>Gewicht <b class="${trend(c.weight)}">${c.weight == null ? '–' : pct(c.weight)}</b></span><span><i class="${trend(c.reps)}"></i>Wiederholungen <b class="${trend(c.reps)}">${c.reps == null ? '–' : pct(c.reps)}</b></span></div>`;
const pct = (c) => `${c > 0 ? '+' : c < 0 ? '−' : '±'}${Math.abs(c).toLocaleString('de-AT', { maximumFractionDigits: 1, minimumFractionDigits: Math.abs(c) < 10 ? 1 : 0 })} %`;
const trend = (c) => (c == null ? 'flat' : c > 0.05 ? 'up' : c < -0.05 ? 'down' : 'flat');

let exQuery = '';
function viewProgress() {
  const p = PERIODS[S.period];
  const all = S.state.exercises.map((e) => series(e.id)).filter((s) => s.all != null);
  const avg = avgOf(all.map((s) => s.all));
  const ups = all.filter((s) => s.all > 0.05).length;
  const sum = { weight: avgOf(all.map((s) => s.weight)), reps: avgOf(all.map((s) => s.reps)) };
  return `
    <div class="period" role="group" aria-label="Zeitraum">
      ${Object.entries(PERIODS).map(([k, v]) => `<button data-act="period" data-p="${k}" aria-pressed="${k === S.period}">${v.short}</button>`).join('')}
    </div>
    <div class="summary">
      <div class="eyebrow">Steigerung in ${esc(p.label)}</div>
      ${avg == null
        ? `<div class="sum-val flat">–</div><p class="sum-sub">Noch zu wenig Einträge in diesem Zeitraum. Sobald eine Übung mindestens zwei Einträge hat, siehst du hier, wie stark du zulegst.</p>`
        : `<div class="sum-val ${trend(avg)}" data-count="${avg}">${pct(avg)}</div><p class="sum-sub">Durchschnitt über ${plural(all.length, 'Übung', 'Übungen')} · ${ups} davon gesteigert</p>${points(sum)}`}
    </div>
    <input type="search" class="search" id="exSearch" placeholder="Übung suchen" value="${esc(exQuery)}" autocomplete="off">
    <div id="exList"></div>
    <div class="section">${allExButton()}</div>`;
}
function renderExList() {
  const box = $('#exList'); if (!box) return;
  const q = exQuery.trim().toLowerCase();
  const list = S.state.exercises.filter((e) => !q || e.name.toLowerCase().includes(q) || (e.group || '').toLowerCase().includes(q));
  if (!list.length) { box.innerHTML = `<div class="section"><div class="empty"><strong>Nichts gefunden</strong>Übungen legst du direkt in einem Trainingstag an.</div></div>`; return; }
  const rows = list.map((e) => ({ e, s: series(e.id), n: entriesFor(e.id).length }));
  // Übungen mit Daten zuerst, stärkste Steigerung oben
  rows.sort((a, b) => (b.s.all ?? -1e9) - (a.s.all ?? -1e9) || b.n - a.n || a.e.name.localeCompare(b.e.name, 'de'));
  box.innerHTML = `<div class="prog-list">${rows.map(({ e, s, n }) => {
    const pic = picHTML(e);
    const t = trend(s.all);
    const sub = !n ? 'Noch kein Eintrag'
      : s.all == null ? `Im Zeitraum zu wenig Einträge · zuletzt ${setsText(entriesFor(e.id)[0])}`
      : `${setsText(s.first)} → ${setsText(s.last)}`;
    const vals = s.pts.map((x) => setVal(setsOf(x)[0], 'all')).filter((v) => v != null);
    return `<button class="prog-card" data-act="ex-open" data-ex="${e.id}">
      <div class="pc-top">
        <span class="thumb">${pic}</span>
        <div style="min-width:0"><div class="row-title">${esc(e.name)}${inPlan(e.id) ? '' : ' <span class="tag-arch">Archiv</span>'}</div><div class="row-sub">${esc(sub)}</div></div>
        ${s.all != null ? `<span class="chg ${t}">${pct(s.all)}</span>` : ''}
      </div>
      ${s.all != null ? points(s) : ''}
      ${vals.length >= 2 ? miniChart(vals, t) : ''}
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
    <polyline class="ln" pathLength="1" points="${line}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
  </svg>`;
}

// lines: je Satz eine Linie, Werte passend zu dates (null = in diesem Eintrag nicht notiert)
function chart(dates, lines, unit, color = 'var(--brass)') {
  const ys = lines.flat().filter((v) => v != null);
  if (!ys.length) return `<div class="chart-empty">Hier gibt es noch keine Werte.</div>`;
  const W = 340, H = 180, L = 40, R = 16, T = 18, B = 26;
  const dMin = Math.min(...ys), dMax = Math.max(...ys);
  let min = dMin, max = dMax;
  if (min === max) { min -= Math.max(1, min * 0.1); max += Math.max(1, max * 0.1); }
  const pad = (max - min) * 0.12; min -= pad; max += pad;
  const n = dates.length;
  const X = (i) => (n === 1 ? (L + W - R) / 2 : L + (i * (W - L - R)) / (n - 1));
  const Y = (v) => T + (1 - (v - min) / (max - min)) * (H - T - B);
  const lbl = (v) => (unit === 'kg' ? fmt(v, 1) : fmtInt(v));
  const t = (x, y, txt, a = 'start') => `<text x="${x}" y="${y}" text-anchor="${a}" font-size="11" fill="var(--muted)" font-family="Inter, system-ui">${txt}</text>`;
  const draw = (line, k) => {
    const p = line.map((v, i) => (v == null ? null : [X(i), Y(v)])).filter(Boolean);
    if (!p.length) return '';
    const c = k === 0 ? color : 'var(--muted)';
    const end = p[p.length - 1];
    return (p.length > 1 ? `<polyline points="${p.map((q) => q.map((v) => v.toFixed(1)).join(',')).join(' ')}" fill="none" stroke="${c}" stroke-width="${k ? 1.8 : 2.2}" stroke-linejoin="round" stroke-linecap="round"${k ? ' stroke-dasharray="5 4"' : ' class="ln" pathLength="1"'}/>` : '')
      + p.map((q) => `<circle cx="${q[0]}" cy="${q[1]}" r="2.6" fill="var(--bg)" stroke="${c}" stroke-width="1.6"/>`).join('')
      + (k ? '' : `<circle cx="${end[0]}" cy="${end[1]}" r="9" fill="${c}" opacity=".18"/><circle cx="${end[0]}" cy="${end[1]}" r="4.2" fill="${c}"/>`);
  };
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Verlauf über ${n} Einträge">
    <line x1="${L}" x2="${W - R}" y1="${Y(dMax)}" y2="${Y(dMax)}" stroke="var(--line)" stroke-dasharray="3 4"/>
    ${t(L - 6, Y(dMax) + 4, lbl(dMax), 'end')}
    ${dMin !== dMax ? `<line x1="${L}" x2="${W - R}" y1="${Y(dMin)}" y2="${Y(dMin)}" stroke="var(--line)" stroke-dasharray="3 4"/>${t(L - 6, Y(dMin) + 4, lbl(dMin), 'end')}` : ''}
    ${lines.map(draw).reverse().join('')}
    ${n > 1 ? t(L, H - 6, dFull(dates[0])) + t(W - R, H - 6, dFull(dates[n - 1]), 'end') : t(X(0), H - 6, dFull(dates[0]), 'middle')}
  </svg>${lines.length > 1 ? `<div class="legend"><span><i style="background:${color}"></i>Satz 1</span><span><i class="dash"></i>${lines.length > 2 ? 'weitere Sätze' : 'Satz 2'}</span></div>` : ''}`;
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

let pickQuery = '', pickOpts = {};
function pickExercise(day, opts = {}) {
  pickQuery = '';
  pickOpts = { title: 'Übung hinzufügen', eyebrow: day.name, exclude: day.exIds, group: '', ...opts };
  return new Promise((resolve) => {
    openSheet(`${sheetHead(pickOpts.title, pickOpts.eyebrow)}
      <button class="btn btn-secondary btn-block" id="newExBtn" data-act="pick-new-form">+ Neue Übung anlegen</button>
      <div class="new-ex" id="newExForm" hidden>
        <label class="lbl">Name der neuen Übung<input class="field" id="newExName" autocomplete="off" enterkeyhint="done" placeholder="z. B. Kurzhantel Curls"></label>
        <div class="lbl">Muskelgruppe<div class="chips" id="groupChips"></div></div>
        <p class="err" id="newExErr" hidden></p>
        <button class="btn btn-primary btn-block" data-act="pick-new-save">Anlegen und auswählen</button>
      </div>
      <input type="search" class="field" id="pickSearch" placeholder="Oder vorhandene Übung suchen" autocomplete="off">
      <div class="pick-list" id="pickList" data-day="${day.id}"></div>`, { onClose: (v) => resolve(typeof v === 'string' ? v : null) });
    renderPickList();
  });
}
function renderPickList() {
  const box = $('#pickList'); if (!box) return;
  const q = pickQuery.trim(), ql = q.toLowerCase();
  const grp = pickOpts.group && pickOpts.group !== 'Sonstige' ? pickOpts.group : '';
  const match = (e) => !ql || e.name.toLowerCase().includes(ql) || (e.group || '').toLowerCase().includes(ql);
  const pool = S.state.exercises.filter((e) => !pickOpts.exclude.includes(e.id) && match(e)).sort((a, b) => a.name.localeCompare(b.name, 'de'));
  const same = grp ? pool.filter((e) => e.group === grp) : [];
  const rest = pool.filter((e) => !same.includes(e));
  const archived = rest.filter((e) => !inPlan(e.id));
  const other = rest.filter((e) => inPlan(e.id));
  const exact = S.state.exercises.some((e) => e.name.toLowerCase() === ql);
  const item = (e, archivedItem) => {
    const h = entriesFor(e.id); const last = h[0];
    const info = last ? `${plural(h.length, 'Eintrag', 'Einträge')} · zuletzt ${setsText(last)}` : (e.group || '');
    const where = archivedItem ? '' : S.state.days.filter((d) => d.exIds.includes(e.id)).map((d) => d.name).join(', ');
    return `<button data-act="pick" data-ex="${e.id}"><span class="pk-main"><span>${esc(e.name)}</span><span class="g">${esc(info)}${where ? ' · in ' + esc(where) : ''}</span></span>${photos.get(e.id) ? `<span class="thumb sm"><img src="${photos.get(e.id)}" alt=""></span>` : ''}</button>`;
  };
  let html = q && !exact ? `<button data-act="pick-new"><span class="pick-new">+ „${esc(q)}“ als neue Übung anlegen</span></button>` : '';
  if (same.length) html += `<div class="pick-sec">Gleiche Muskelgruppe · ${esc(grp)}</div>` + same.map((e) => item(e, !inPlan(e.id))).join('');
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
  const s = series(id);
  const c = s[m], t = trend(c);
  const color = t === 'up' ? 'var(--ok)' : t === 'down' ? 'var(--danger)' : 'var(--brass)';
  const noWeight = h.every((x) => !maxW(x));
  const unit = m === 'reps' || (m === 'all' && noWeight) ? 'Wdh' : 'kg';
  const nSets = Math.max(0, ...s.pts.map((x) => setsOf(x).length));
  const lines = Array.from({ length: nSets }, (_, i) => s.pts.map((x) => setVal(setsOf(x)[i], m))).filter((l) => l.some((v) => v != null));
  const P = PERIODS[S.period];
  const best = Math.max(0, ...h.map(maxW));
  const bestE = Math.max(0, ...h.map(maxE));
  let runMax = 0;
  const pr = new Set();
  for (const x of asc) { if (runMax > 0 && maxW(x) > runMax) pr.add(x.id); runMax = Math.max(runMax, maxW(x)); }
  const pic = picHTML(e);
  openSheet(`${sheetHead(e.name, e.group || 'Übung')}
    ${pic ? `<button class="photo-big" data-act="photo" data-ex="${id}">${pic}</button>` : ''}
    <div class="metric-toggle" role="group" aria-label="Kennzahl">
      ${[['all', 'Gesamt'], ['weight', 'Gewicht'], ['reps', 'Wiederholungen']].map(([k, l]) => `<button data-act="metric" data-m="${k}" data-ex="${id}" aria-pressed="${m === k}">${l}</button>`).join('')}
    </div>
    <div class="period" role="group" aria-label="Zeitraum">
      ${Object.entries(PERIODS).map(([k, v]) => `<button data-act="period" data-p="${k}" data-ex="${id}" aria-pressed="${k === S.period}">${v.short}</button>`).join('')}
    </div>
    <div class="detail-chg">
      ${c == null
        ? `<span class="sum-val flat">–</span><span class="sum-sub">In ${esc(P.label)} zu wenig Einträge für einen Vergleich.</span>`
        : `<span class="sum-val ${t}" data-count="${c}">${pct(c)}</span><span class="sum-sub">${m === 'weight' ? 'Gewicht' : m === 'reps' ? 'Wiederholungen' : 'gesamt'} in ${esc(P.label)}</span>`}
    </div>
    ${points(s)}
    <div class="chart-box">${s.pts.length ? chart(s.pts.map((x) => x.date), lines, unit, color) : chart([], [], unit)}</div>
    <div class="kpis">
      <div class="kpi"><div class="kpi-val">${best ? fmt(best) : '–'}<small>${best ? 'kg' : ''}</small></div><div class="kpi-lbl">Bestwert</div></div>
      <div class="kpi"><div class="kpi-val">${bestE ? fmt(bestE, 1) : '–'}<small>${bestE ? 'kg' : ''}</small></div><div class="kpi-lbl">1RM geschätzt</div></div>
      <div class="kpi"><div class="kpi-val">${h.length}</div><div class="kpi-lbl">Einträge</div></div>
    </div>
    ${h.length ? `<div><h3 class="section-title" style="margin-bottom:8px">Alle Einträge</h3><div class="hist">${h.map((x) => `<div class="hist-row"><div class="hist-date">${dFull(x.date)}</div><div class="hist-sets">${esc(setsText(x))}${pr.has(x.id) ? ' <span class="pr">Neuer Bestwert</span>' : ''}</div></div>`).join('')}</div></div>` : ''}
    <div class="sheet-actions"><button class="btn btn-block btn-secondary" data-act="ex-edit" data-ex="${id}">Übung bearbeiten</button>${inPlan(id) ? '' : `<button class="btn btn-block btn-danger" data-act="ex-delete" data-ex="${id}">Endgültig löschen</button>`}</div>
    ${inPlan(id) ? '' : '<p class="small muted">Diese Übung ist archiviert. Über „Übung hinzufügen“ in einem Trainingstag holst du sie mit allen Einträgen zurück.</p>'}
    <p class="small muted">„Gesamt“ rechnet Gewicht und Wiederholungen zusammen (geschätztes 1RM nach Epley: Gewicht × (1 + Wiederholungen / 30)). Verglichen wird immer Satz 1 mit Satz 1 und Satz 2 mit Satz 2. Beim Gesamtwert sind die Zahlen in der Kurve dieses geschätzte 1RM.</p>`);
}

let editGroup = '';
/* ---------- Alle Übungen: Übung selbst bearbeiten, Fortschritt gleich dabei ---------- */
const allExButton = () => `<button class="all-ex" data-act="all-ex"><span class="all-ex-ic">${ICON.pen}</span><span><b>Alle Übungen</b><small>${plural(S.state.exercises.length, 'Übung', 'Übungen')} · Name, Muskelgruppe, Foto</small></span>${ICON.chev}</button>`;
let allQuery = '';
function openAllExercises() {
  openSheet(`${sheetHead('Alle Übungen', `${plural(S.state.exercises.length, 'Übung', 'Übungen')} gespeichert`)}
    <input type="search" class="field" id="allSearch" placeholder="Übung suchen" value="${esc(allQuery)}" autocomplete="off">
    <div id="allList"></div>`);
  renderAllList();
}
function renderAllList() {
  const box = $('#allList'); if (!box) return;
  const q = allQuery.trim().toLowerCase();
  const list = S.state.exercises.filter((e) => !q || e.name.toLowerCase().includes(q) || (e.group || '').toLowerCase().includes(q));
  if (!list.length) { box.innerHTML = `<div class="chart-empty">Keine Übung gefunden.</div>`; return; }
  const groups = {};
  for (const e of list) (groups[e.group || 'Sonstige'] ||= []).push(e);
  const order = [...GROUPS, ...Object.keys(groups).filter((g) => !GROUPS.includes(g))];
  box.innerHTML = order.filter((g) => groups[g]).map((g) => `<div class="all-group"><div class="pick-sec">${esc(g)}</div><div class="all-rows">${groups[g].sort((a, b) => a.name.localeCompare(b.name, 'de')).map((e) => {
    const days = S.state.days.filter((d) => d.exIds.includes(e.id)).map((d) => d.name);
    const n = entriesFor(e.id).length;
    return `<button class="all-row" data-act="ex-hub" data-ex="${e.id}"><span class="thumb sm">${picHTML(e)}</span><span class="pk-main"><span>${esc(e.name)}</span><span class="g">${days.length ? esc(days.join(', ')) : 'Archiv'} · ${plural(n, 'Eintrag', 'Einträge')}</span></span>${ICON.chev}</button>`;
  }).join('')}</div></div>`).join('');
}
function openExerciseHub(id) {
  const e = exById(id); if (!e) return openAllExercises();
  editGroup = e.group || 'Sonstige';
  const h = entriesFor(id), s = series(id), t = trend(s.all);
  const vals = s.pts.map((x) => setVal(setsOf(x)[0], 'all')).filter((v) => v != null);
  const days = S.state.days.filter((d) => d.exIds.includes(id)).map((d) => d.name);
  openSheet(`<button class="sheet-back" data-act="all-ex">${ICON.back}Alle Übungen</button>
    ${sheetHead(e.name, days.length ? 'In ' + days.join(', ') : 'Archiv · in keinem Trainingstag')}
    <div class="hub-photo">
      <button class="ex-photo${picHTML(e) ? ' has' : ''}" data-act="photo" data-ex="${id}" aria-label="Foto vom Gerät">${picHTML(e) || ICON.cam}</button>
      <button class="btn btn-secondary" data-act="photo" data-ex="${id}">${picHTML(e) ? 'Foto ändern' : 'Foto vom Gerät hinzufügen'}</button>
    </div>
    <div class="hub-prog">
      <div class="hub-prog-head"><h3 class="section-title">Mein Fortschritt</h3><span class="muted small">${esc(PERIODS[S.period].label)}</span></div>
      ${!h.length ? '<p class="muted small">Noch kein Eintrag. Sobald du die Übung trainierst, siehst du hier deine Entwicklung.</p>'
        : `${s.all != null ? `<div class="detail-chg"><span class="sum-val ${t}" data-count="${s.all}">${pct(s.all)}</span><span class="sum-sub">gesamt</span></div>${points(s)}` : '<p class="muted small">In diesem Zeitraum zu wenig Einträge für einen Vergleich.</p>'}
        ${vals.length >= 2 ? miniChart(vals, t) : ''}
        <div class="hist">${h.slice(0, 3).map((x) => `<div class="hist-row"><div class="hist-date">${dFull(x.date)}</div><div class="hist-sets">${esc(setsText(x))}</div></div>`).join('')}</div>`}
      ${h.length ? `<button class="btn btn-block btn-secondary" data-act="ex-open" data-ex="${id}">Ganzen Fortschritt ansehen</button>` : ''}
    </div>
    <div class="form hub-form" data-edit="${id}" data-return="hub">
      <h3 class="section-title">Übung bearbeiten</h3>
      <label class="lbl">Name<input class="field" id="exNameIn" value="${esc(e.name)}" autocomplete="off"></label>
      <div class="lbl">Muskelgruppe<div class="chips" id="groupChips">${GROUPS.map((g) => `<button data-act="group" data-g="${esc(g)}" aria-pressed="${g === editGroup}">${esc(g)}</button>`).join('')}</div></div>
      <label class="lbl">Notiz (optional)<input class="field" id="exNoteIn" value="${esc(e.note || '')}" placeholder="z. B. Sitz Stufe 4, enger Griff" autocomplete="off"></label>
      <p class="err" id="exErr" hidden></p>
      <button class="btn btn-block btn-primary" data-act="ex-save">Änderungen speichern</button>
    </div>
    <button class="btn btn-ghost hub-del" data-act="ex-delete" data-ex="${id}">Übung endgültig löschen</button>`);
  countUp();
}

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
    ${allExButton()}
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

function tickSet(card, i) {
  const exId = card.dataset.ex;
  const rows = setRows(exId), x = rows[i]; if (!x) return;
  if (x.ok) { // wieder öffnen
    editDraft(exId).s[i].ok = false; saveDrafts(); redrawCard(card); return;
  }
  if (x.er == null) { toast(`Trag bei Satz ${i + 1} die Wiederholungen ein`); card.querySelector(`.lt-in[data-f="r"][data-i="${i}"]`)?.focus(); return; }
  const d = editDraft(exId);
  d.n = rows.length;
  d.s[i] = { w: x.ew != null ? String(x.ew).replace('.', ',') : '', r: String(Math.round(x.er)), ok: true };
  saveDrafts();
  if (navigator.vibrate) try { navigator.vibrate(12); } catch {}
  if (rows.every((y, k) => k === i || y.ok)) return finishExercise(card);
  document.activeElement?.blur?.();
  redrawCard(card, i);
}
function finishExercise(card) {
  const exId = card.dataset.ex;
  const list = setRows(exId).filter((x) => x.ok).map((x) => ({ w: num(x.w), r: num(x.r) }));
  if (!list.length) return;
  const train = isTrain();
  const prev = entriesFor(exId)[0];
  const prevBest = Math.max(0, ...entriesFor(exId).map(maxW));
  const entry = makeEntry(exId, list, Date.now());
  S.entries.push(entry); saveEntries();
  if (S.state.example) { S.state.example = false; saveState(); }
  delete S.drafts[exId]; saveDrafts();
  const gain = prev ? compare([prev, entry]).all : null;
  const note = prevBest && maxW(entry) > prevBest ? `Neuer Bestwert: ${fmt(maxW(entry))} kg` : gain > 0.05 ? `Gesteigert: ${pct(gain)} zum letzten Mal` : '';
  document.activeElement?.blur?.();
  if (train) {
    const planId = card.dataset.plan || exId;
    S.session.pick = null; S.session.later = S.session.later.filter((x) => x !== planId); touchSession();
    const next = trainState(curDay()).queue[0];
    const show = () => { render(); window.scrollTo(0, 0); $('.ex-card.train')?.classList.add('arrive'); toast(note || (next ? `Gespeichert. Weiter: ${exById(next).name}` : 'Gespeichert')); };
    if (reduceMotion() || !card.isConnected) show(); else { card.classList.add('leave'); setTimeout(show, 240); }
  } else {
    redrawCard(card);
    toast(note || 'Gespeichert');
  }
}

// Eintrag nachträglich ergänzen oder korrigieren
const editRow = (i, x) => `<div class="set-r edit"><span class="set-n">Satz ${i + 1}</span><input class="field" data-ew="${i}" inputmode="decimal" autocomplete="off" placeholder="kg" value="${x?.w != null ? esc(fmt(x.w)) : ''}" aria-label="Satz ${i + 1}, Gewicht in kg"><input class="field" data-er="${i}" inputmode="numeric" autocomplete="off" placeholder="Wdh" value="${x?.r ?? ''}" aria-label="Satz ${i + 1}, Wiederholungen"></div>`;
function openEntry(e) {
  const list = setsOf(e);
  const n = Math.max(1, Math.min(8, Math.max(list.length, e.sets || 1)));
  openSheet(`${sheetHead(exById(e.exId)?.name || 'Eintrag', new Date(e.date).toLocaleDateString('de-AT', { weekday: 'long', day: 'numeric', month: 'long' }))}
    <div class="form" id="entryForm" data-entry="${e.id}">
      <div class="set-h edit"><span></span><span>kg</span><span>Wdh</span></div>
      <div id="entryRows">${Array.from({ length: n }, (_, i) => editRow(i, list[i])).join('')}</div>
      <button class="add-set" data-act="entry-row">+ Satz</button>
      <p class="err" id="entryErr" hidden></p>
      <div class="sheet-actions"><button class="btn btn-block btn-primary" data-act="entry-save">Speichern</button>
      <button class="btn btn-block btn-danger" data-act="entry-del" data-entry="${e.id}">Eintrag löschen</button></div>
    </div>`);
}
function saveEditedEntry() {
  const form = $('#entryForm'); const e = S.entries.find((x) => x.id === form.dataset.entry); if (!e) return closeSheet();
  const rows = [...form.querySelectorAll('[data-ew]')].map((el, i) => ({ w: num(el.value.trim()), r: num(form.querySelector(`[data-er="${i}"]`).value.trim()) }));
  while (rows.length && rows[rows.length - 1].w == null && rows[rows.length - 1].r == null) rows.pop();
  const bad = rows.findIndex((x) => x.r == null);
  const err = $('#entryErr');
  if (!rows.length || bad >= 0) { err.textContent = `Bei Satz ${bad < 0 ? 1 : bad + 1} fehlen die Wiederholungen.`; err.hidden = false; return; }
  const list = rows.map((x) => ({ w: x.w, r: Math.round(x.r) }));
  if (e.list || list.length > 1) { e.list = list; e.sets = list.length; } // sonst alter Eintrag: Anzahl der Sätze bleibt wie notiert
  e.w = list[0].w; e.reps = list[0].r;
  saveEntries(); closeSheet(); render(); toast('Eintrag gespeichert');
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
  'train-swap': async (el) => {
    const planId = el.closest('.ex-card').dataset.plan, day = curDay(), planned = exById(planId);
    const used = Object.values(S.session.swaps || {});
    const id = await pickExercise(day, { title: 'Andere Übung', eyebrow: `Heute statt ${planned.name}`, exclude: [...day.exIds, ...used], group: planned.group });
    if (!id) return;
    S.session.swaps = { ...(S.session.swaps || {}), [planId]: id };
    S.session.pick = planId; touchSession();
    render(); window.scrollTo(0, 0);
    toast(`Heute ${exById(id).name} statt ${planned.name}. Dein Plan bleibt gleich`);
  },
  'train-unswap': (el) => {
    const planId = el.closest('.ex-card').dataset.plan;
    delete S.session.swaps[planId]; touchSession();
    render(); window.scrollTo(0, 0);
  },
  'train-pick': (el) => { S.session.pick = el.dataset.id; touchSession(); render(); window.scrollTo(0, 0); },
  'train-again': () => { S.session = { dayId: S.day, since: Date.now(), touched: Date.now(), later: [], pick: null, swaps: {} }; saveSession(); render(); window.scrollTo(0, 0); },
  'train-end': () => { const ids = [...curDay().exIds, ...Object.values(S.session?.swaps || {})]; flushDrafts((id) => ids.includes(id)); S.session = null; saveSession(); closeSheet(); go('training'); },
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
      <p class="small muted">Alle bestätigten Sätze bleiben gespeichert. Startest du den Tag heute noch einmal, machst du bei der ersten offenen Übung weiter.</p>`);
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
    if (!pickQuery.trim()) return;
    actions['pick-new-form']();
  },
  'pick-new-form': () => {
    editGroup = pickOpts.group || 'Sonstige';
    $('#groupChips').innerHTML = GROUPS.map((g) => `<button data-act="group" data-g="${esc(g)}" aria-pressed="${g === editGroup}">${esc(g)}</button>`).join('');
    $('#newExForm').hidden = false; $('#newExBtn').hidden = true;
    const i = $('#newExName'); i.value = pickQuery.trim(); i.focus();
  },
  'pick-new-save': () => {
    const name = $('#newExName').value.trim().replace(/\s+/g, ' ');
    const err = $('#newExErr');
    if (!name) { err.textContent = 'Gib der Übung einen Namen.'; err.hidden = false; $('#newExName').focus(); return; }
    const same = S.state.exercises.find((e) => e.name.toLowerCase() === name.toLowerCase());
    if (same) {
      if (pickOpts.exclude.includes(same.id)) { err.textContent = `„${same.name}“ ist heute schon dran. Nimm einen anderen Namen.`; err.hidden = false; return; }
      toast(`„${same.name}“ gab es schon, sie ist jetzt ausgewählt`);
      return closeSheet(same.id);
    }
    const e = { id: uid(), name, group: editGroup || 'Sonstige', note: '' };
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
    const days = S.state.days.filter((d) => d.exIds.includes(id)).map((d) => d.name);
    const ok = await confirmSheet(`${ex.name} endgültig löschen?`, `Die Übung${n ? ` mit ${plural(n, 'Eintrag', 'Einträgen')}` : ''}${photos.has(id) ? ' und Foto' : ''} wird gelöscht${days.length ? ` und aus ${days.join(', ')} entfernt` : ''}. Das lässt sich nicht rückgängig machen. Willst du sie nur nicht mehr trainieren, entferne sie stattdessen aus dem Trainingstag, dann bleibt alles im Archiv.`, 'Endgültig löschen', true);
    if (!ok) return;
    S.state.days.forEach((d) => { d.exIds = d.exIds.filter((x) => x !== id); });
    S.state.exercises = S.state.exercises.filter((x) => x.id !== id);
    S.entries = S.entries.filter((x) => x.exId !== id); saveEntries(); saveState();
    await removePhoto(id); render(); toast('Übung gelöscht');
  },
  'ex-edit': (el) => openExerciseHub(exOf(el)),
  'all-ex': () => { allQuery = ''; openAllExercises(); },
  'ex-hub': (el) => openExerciseHub(el.dataset.ex),
  group: (el) => { editGroup = el.dataset.g; document.querySelectorAll('#groupChips button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.g === editGroup)); },
  'ex-save': (el) => {
    const id = el.closest('[data-edit]').dataset.edit;
    const name = $('#exNameIn').value.trim();
    const err = $('#exErr');
    if (!name) { err.textContent = 'Gib der Übung einen Namen.'; err.hidden = false; return; }
    if (S.state.exercises.some((e) => e.id !== id && e.name.toLowerCase() === name.toLowerCase())) { err.textContent = 'Eine Übung mit diesem Namen gibt es schon.'; err.hidden = false; return; }
    Object.assign(exById(id), { name, group: editGroup, note: $('#exNoteIn').value.trim() });
    saveState(); render(); toast('Gespeichert');
    if (el.closest('[data-return="hub"]')) openExerciseHub(id); else closeSheet();
  },
  'ex-open': (el) => { openProgress(el.dataset.ex); countUp(); },
  period: (el) => { S.period = el.dataset.p; lsSet(LS.period, S.period); render(); if (el.dataset.ex) openProgress(el.dataset.ex); countUp(); },
  metric: (el) => { S.metric = el.dataset.m; lsSet(LS.metric, S.metric); openProgress(el.dataset.ex); countUp(); },

  // Einträge
  save: (el) => { const card = el.closest('.ex-card'); const i = setRows(card.dataset.ex).findIndex((x) => !x.ok); i < 0 ? finishExercise(card) : tickSet(card, i); },
  'set-tick': (el) => tickSet(el.closest('.ex-card'), +el.dataset.i),
  'set-add': (el) => {
    const card = el.closest('.ex-card'), id = card.dataset.ex, n = setRows(id).length;
    if (n >= 8) return toast('Mehr als 8 Sätze gehen nicht');
    editDraft(id).n = n + 1; saveDrafts(); redrawCard(card);
  },
  'set-drop': (el) => {
    const card = el.closest('.ex-card'), id = card.dataset.ex, n = setRows(id).length;
    const d = editDraft(id); d.n = n - 1; d.s.length = Math.min(d.s.length, n - 1); saveDrafts();
    if (setRows(id).every((x) => x.ok)) return finishExercise(card);
    redrawCard(card);
  },
  archive: (el) => { const id = exOf(el); S.open.has(id) ? S.open.delete(id) : S.open.add(id); redrawCard(el.closest('.ex-card')); },
  entry: (el) => {
    const e = S.entries.find((x) => x.id === el.dataset.entry); if (!e) return;
    openEntry(e);
  },
  'entry-row': () => { const box = $('#entryRows'); const n = box.children.length; if (n < 8) box.insertAdjacentHTML('beforeend', editRow(n, null)); },
  'entry-save': () => saveEditedEntry(),
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
  else if (t.id === 'allSearch') { allQuery = t.value; renderAllList(); }
  else if (t.id === 'newExName') { const e = $('#newExErr'); if (e) e.hidden = true; }
  else if (t.classList.contains('lt-in')) {
    const clean = t.value.replace(t.dataset.f === 'w' ? /[^\d.,]/g : /[^\d]/g, '');
    if (clean !== t.value) t.value = clean;
    const card = t.closest('.ex-card'), id = card.dataset.ex;
    const d = editDraft(id), i = +t.dataset.i;
    d.s[i] = { ...(d.s[i] || {}), [t.dataset.f]: clean };
    saveDrafts(); refreshCard(card);
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
    const ins = [...card.querySelectorAll('.lt-in:not([readonly])')];
    const i = ins.indexOf(ev.target);
    if (i < ins.length - 1) ins[i + 1].focus(); else ev.target.blur();
  }
  if (ev.key === 'Enter' && ev.target.id === 'dayNameIn') actions['rename-save']();
  if (ev.key === 'Enter' && ev.target.id === 'newExName') { ev.preventDefault(); actions['pick-new-save'](); }
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
requestAnimationFrame(() => animateIn());
// Ein altes Training (länger als 6 Stunden her) nicht wieder öffnen
function leaveStale() { if (S.train && !sessionFresh()) { S.session = null; saveSession(); S.train = false; lsSet(LS.train, false); if (S.tab === 'training') { S.day = null; lsSet(LS.day, null); } return true; } return false; }
const flushOld = () => flushDrafts((id, d) => !draftFresh(d));
flushOld();
leaveStale();
document.addEventListener('visibilitychange', () => { if (document.hidden) return; const n = Object.keys(S.drafts).length; flushOld(); if (leaveStale() || Object.keys(S.drafts).length !== n) render(); });
render();
loadPhotos().then(() => { if (photos.size) render(); });
if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
