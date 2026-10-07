/* Passport Control - guided NUVA alignment prototype, with tracked status.
 *
 * Every code in an alignment file is a traveller asking to enter NUVA. The inspector
 * reads its papers, works out its antigens one level of the valence tree at a time,
 * then stamps it: admitted to a NUVA vaccine (the "visa class"), turned away (#NA),
 * or held while a petition for a new visa class goes to IVC (#MISS).
 *
 * Self-contained: reads the published NUVA data (../data/nuvadata.json), imports and
 * exports the standard alignment CSV unchanged, and keeps everything else (status,
 * confidence, notes, history, petitions) in localStorage under its own "passport."
 * key and in an optional logbook JSON. Never touches the main editor's
 * vaccines/valences/CSData/context keys on the same origin.
 */
'use strict';

const DATA_URL = '../data/nuvadata.json';
const STORE_KEY = 'passport.desk.v1';
const ROOT = 'Valence';
const ORPHANS = 'VAC0000';
const RE_VAC = /^VAC\d{4}$/;

// Copied from docs/scripts/valences.js (VTypeOptions) - the technology hierarchy.
const VTYPES = {
  '0': 'Implicit', '1': 'Antigens', '1.1': 'Live vaccines',
  '1.1.1': 'Live attenuated pathogen vaccines', '1.1.1.1': 'Live attenuated bacterial vaccines',
  '1.1.1.2': 'Live attenuated viral vaccines', '1.1.2': 'Live recombinant viral vector vaccines',
  '1.1.2.1': 'Replicating viral vector vaccines', '1.1.2.2': 'Non-replicating viral vector vaccines',
  '1.2': 'Non-live vaccines', '1.2.1': 'Whole inactivated pathogen vaccines',
  '1.2.1.1': 'Inactivated whole-cell bacterial vaccines', '1.2.1.2': 'Inactivated whole-virion viral vaccines',
  '1.2.2': 'Split or disrupted pathogen vaccines', '1.2.2.1': 'Split-virion viral vaccines',
  '1.2.2.2': 'Other disrupted pathogen vaccines', '1.2.3': 'Subunit vaccines',
  '1.2.3.1': 'Polysaccharide-based vaccines', '1.2.3.1.1': 'Unconjugated polysaccharide vaccines',
  '1.2.3.1.2': 'Conjugated polysaccharide vaccines', '1.2.3.2': 'Protein-based vaccines',
  '1.2.3.2.1': 'Toxoid vaccines', '1.2.3.2.2': 'Purified native protein vaccines',
  '1.2.3.2.3': 'Recombinant protein vaccines', '1.2.3.2.4': 'Virus-like particle (VLP) vaccines',
  '1.2.3.3': 'Membrane vesicle-based vaccines', '1.2.3.3.1': 'Outer membrane vesicle (OMV) vaccines',
  '1.2.4': 'Nucleic acid vaccines', '1.2.4.1': 'DNA vaccines', '1.2.4.2': 'RNA vaccines',
  '1.2.4.2.1': 'Conventional mRNA vaccines', '1.2.4.2.2': 'Self-amplifying RNA vaccines',
  '2': 'Antibodies'
};

// The tracked workflow status of each code ("lane" in the hall).
const LANES = [
  ['queue', 'Queue', 'No decision yet'],
  ['unchecked', 'Unchecked', 'Came with a decision in the file; not inspected here'],
  ['held', 'Held', 'Stamped, but held for a second look'],
  ['petition', 'Petitions', '#MISS - waiting on a new NUVA concept'],
  ['cleared', 'Cleared', 'Stamped with confidence'],
  ['expired', 'Expired visas', 'Stamped to a NUVA vaccine that is deprecated or gone'],
  ['all', 'All', 'Every code on this desk']
];
const CONFIDENCE = [['sure', 'Sure'], ['probably', 'Probably'], ['hunch', 'Hunch']];
const STEPS = [[1, 'Papers'], [2, 'Antigens'], [3, 'Verdict']];
const STOPWORDS = new Set(['and', 'the', 'for', 'with', 'vaccine', 'vaccines', 'virus', 'unspecified', 'formulation', 'code', 'retired', 'use', 'not']);

const S = {
  version: null, vaccines: {}, valences: {},
  children: {}, lineage: {}, instances: {}, diff: {}, usage: {}, descendants: {},
  desk: null,          // persisted: { csid, fileName, importedAt, inspector, rows, petitions, nextPetition, view, lane, cur }
  view: 'hall', lane: 'queue', hallFilter: '',
  cur: null, step: 1,
  picked: [], open: new Set(), valSearch: '', candidate: null, vacSearch: '', showAllCands: false,
  confidence: 'sure', note: '',
  undo: null, busy: false
};

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toISOString();
const norm = s => String(s ?? '').replace(/\s+/g, ' ').trim();
const clone = o => JSON.parse(JSON.stringify(o));

/* ---------- Storage ---------- */

function store(key, value) {
  try { value == null ? localStorage.removeItem(key) : localStorage.setItem(key, JSON.stringify(value)) } catch (e) { /* storage unavailable: work stays in memory */ }
}
function load(key) {
  try { return JSON.parse(localStorage.getItem(key)) } catch (e) { return null }
}
function persist() {
  if (S.desk) { S.desk.view = S.view; S.desk.lane = S.lane; S.desk.cur = S.cur }
  store(STORE_KEY, S.desk);
}

/* ---------- NUVA data ---------- */

function buildIndexes(data) {
  S.version = data.version;
  S.vaccines = data.vaccines;
  S.valences = data.valences;
  for (const id in S.valences) {
    if (id === ROOT) continue;
    (S.children[S.valences[id].parent] ||= []).push(id);
  }
  const lab = id => norm(S.valences[id].label).toLowerCase();
  for (const k in S.children) S.children[k].sort((a, b) => (a === 'VAL000') - (b === 'VAL000') || lab(a).localeCompare(lab(b)));
  for (const id in S.valences) {
    if (id === ROOT) continue;
    const line = [];
    let p = S.valences[id].parent;
    while (p && p !== ROOT && S.valences[p] && !line.includes(p)) { line.push(p); p = S.valences[p].parent }
    S.lineage[id] = line;
    S.diff[id] = differential(id);
  }
  const count = id => (S.children[id] || []).reduce((n, c) => n + 1 + count(c), 0);
  for (const id in S.valences) S.descendants[id] = count(id);
  for (const id in S.vaccines) {
    const v = S.vaccines[id];
    if (v.type !== 'abstract' && v.instanceOf) (S.instances[v.instanceOf] ||= []).push(id);
    // How many abstract vaccines carry this valence or something more specific under it.
    if (v.type === 'abstract' && id !== ORPHANS) {
      const seen = new Set();
      for (const val of v.valences || []) for (const k of [val, ...(S.lineage[val] || [])]) seen.add(k);
      for (const k of seen) S.usage[k] = (S.usage[k] || 0) + 1;
    }
  }
}

// Short "how this differs from its parent" text, derived from the labels (same approach as Loupe).
// A real system would author this as its own field; here it is computed so the idea can be tried.
function differential(id) {
  const v = S.valences[id];
  const p = S.valences[v.parent];
  if (!p || v.parent === ROOT) return { text: norm(v.label), derived: false };
  const seg = s => norm(s).split(/,\s+/).filter(Boolean);
  const parentSegs = new Set(seg(p.label).map(s => s.toLowerCase()));
  const rest = seg(v.label).filter(s => !parentSegs.has(s.toLowerCase()));
  const text = rest.join(', ');
  if (!text || text === norm(v.label)) return { text: norm(v.label), derived: false };
  return { text, derived: true };
}

function techType(id) {
  for (const k of [id, ...(S.lineage[id] || [])]) {
    const t = S.valences[k]?.vtype;
    // '1' (Antigens) is the generic top of the hierarchy and says nothing useful here.
    if (t && t !== '0' && t !== '1') return VTYPES[t] || t;
  }
  return null;
}

function abstractOf(vac) {
  const v = S.vaccines[vac];
  if (!v) return null;
  return v.type === 'abstract' ? vac : v.instanceOf || null;
}
function valencesOf(vac) {
  const a = abstractOf(vac);
  return (a && S.vaccines[a]?.valences) || [];
}

/* ---------- Alignment CSV (format: docs/documentation/tools/f_alignment.md) ---------- */

function parseCSVRows(text) {
  const rows = []; let row = [], field = '', q = false;
  text = text.replace(/^﻿/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++ } else q = false }
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row) }
  return rows.filter(r => r.some(f => f.trim() !== ''));
}

function parseAlignment(text, fileName) {
  const rows = parseCSVRows(text);
  if (!rows.length) throw new Error('The file is empty.');
  const csid = norm(rows[0][0]);
  if (!csid) throw new Error('The first cell of the header row must be the code system identifier (e.g. CVX).');
  const out = [], seen = new Set();
  const notes = { prefixed: 0, coerced: 0, duplicates: 0, misSpelling: 0 };
  for (const r of rows.slice(1)) {
    let code = norm(r[0]);
    if (!code) continue;
    if (!code.startsWith(csid + '-')) { code = `${csid}-${code}`; notes.prefixed++ }
    if (seen.has(code)) { notes.duplicates++; continue }
    seen.add(code);
    let nuva = norm(r[1]).toUpperCase();
    if (nuva === '#MIS') { nuva = '#MISS'; notes.misSpelling++ }
    else if (nuva && !RE_VAC.test(nuva) && nuva !== '#NA' && nuva !== '#MISS') { nuva = '#MISS'; notes.coerced++ }
    out.push({ code, label: (r[2] || '').trim(), imported: nuva });
  }
  return { csid, fileName, rows: out, notes };
}

function csvQuote(s) { return '"' + String(s ?? '').replace(/"/g, '""') + '"' }

// The exported CSV is the standard alignment file and nothing else: status, confidence,
// notes and petitions stay in the logbook. Undecided codes go out as #MISS.
function buildCSV(desk) {
  let undecided = 0;
  let out = '﻿' + `${desk.csid},NUVA,${desk.csid} label, NUVA label\n`;
  for (const r of desk.rows) {
    let nuva = r.current;
    if (!nuva) { nuva = '#MISS'; undecided++ }
    const nl = S.vaccines[nuva] ? csvQuote(S.vaccines[nuva].label) : '';
    out += `${r.code},${nuva},${csvQuote(r.label)},${nl}\n`;
  }
  return { text: out, undecided, name: `${desk.csid}2nuva_${today()}.csv` };
}

function newRow(p) {
  return {
    code: p.code, label: p.label, imported: p.imported, current: p.imported,
    status: p.imported ? 'unchecked' : 'queue',
    confidence: null, note: '', petition: null, suggest: null, dispute: null, gone: false,
    history: []
  };
}

function newDesk(parsed) {
  return {
    csid: parsed.csid, fileName: parsed.fileName, importedAt: now(), inspector: S.desk?.inspector || '',
    rows: parsed.rows.map(newRow), petitions: [], nextPetition: 1
  };
}

// Re-importing the same code system never overwrites a stamp made here: disagreements are held for review.
function mergeInto(desk, parsed) {
  const res = { added: 0, updated: 0, disputed: 0, gone: 0 };
  const incoming = new Map(parsed.rows.map(p => [p.code, p]));
  for (const r of desk.rows) {
    const p = incoming.get(r.code);
    if (!p) { if (!r.gone) { r.gone = true; res.gone++ } continue }
    r.gone = false;
    if (p.label) r.label = p.label;
    if (p.imported === r.imported) continue;
    const touched = r.history.some(h => h.kind !== 'reimport');
    if (!touched) {
      r.imported = r.current = p.imported;
      r.status = p.imported ? 'unchecked' : 'queue';
      res.updated++;
    } else {
      if (p.imported !== r.current) {
        r.dispute = `The re-imported file says ${p.imported || 'blank'}; the stamp here is ${r.current || 'none'}.`;
        r.status = 'held';
        res.disputed++;
      }
      r.imported = p.imported;
    }
    r.history.push({ at: now(), by: desk.inspector, kind: 'reimport', value: p.imported, note: 'Value in re-imported file' });
  }
  for (const p of parsed.rows) if (!desk.rows.some(r => r.code === p.code)) {
    const r = newRow(p);
    r.history.push({ at: now(), by: desk.inspector, kind: 'reimport', value: p.imported, note: 'New in re-imported file' });
    desk.rows.push(r);
    res.added++;
  }
  desk.fileName = parsed.fileName;
  return res;
}

/* ---------- Status ---------- */

function attention(r) {
  const n = r.current;
  if (!n || n.startsWith('#')) return null;
  const v = S.vaccines[n];
  if (!v) return `${n} does not exist in NUVA ${S.version}`;
  if (v.type === 'deprecated') return `${n} is deprecated in NUVA`;
  return null;
}
const changed = r => r.current !== r.imported;
const retired = r => r.code.startsWith(S.desk.csid + '-#');

function inLane(r, lane) {
  if (lane === 'all') return true;
  if (lane === 'expired') return !!attention(r);
  return r.status === lane;
}

function laneRows(lane = S.lane) {
  if (!S.desk) return [];
  const f = S.hallFilter.toUpperCase();
  return S.desk.rows.filter(r => inLane(r, lane) && (!f ||
    r.code.toUpperCase().includes(f) || r.label.toUpperCase().includes(f) ||
    (r.current || '').toUpperCase().includes(f) ||
    (S.vaccines[r.current]?.label || '').toUpperCase().includes(f)));
}
const rowOf = code => S.desk?.rows.find(r => r.code === code);
const petitionOf = id => S.desk?.petitions.find(p => p.id === id);

/* ---------- Candidates (same ranking as Loupe's candidatesFromSelection) ---------- */

function relation(sel, v) {
  if (sel === v) return 'same';
  if ((S.lineage[v] || []).includes(sel)) return 'narrower';   // vaccine is more specific
  if ((S.lineage[sel] || []).includes(v)) return 'broader';    // vaccine is less specific
  return null;
}

function candidatesFromPicked() {
  if (!S.picked.length) return [];
  const rank = { same: 0, narrower: 1, broader: 2 };
  const out = [];
  for (const id in S.vaccines) {
    const vac = S.vaccines[id];
    if (vac.type !== 'abstract' || id === ORPHANS) continue;
    const vals = vac.valences || [];
    let ok = true, narrower = 0, broader = 0;
    const used = new Set();
    for (const s of S.picked) {
      let best = null;
      for (const v of vals) {
        const rel = relation(s, v);
        if (rel && (!best || rank[rel] < rank[best.rel])) best = { v, rel };
      }
      if (!best) { ok = false; break }
      used.add(best.v);
      if (best.rel === 'narrower') narrower++;
      if (best.rel === 'broader') broader++;
    }
    if (!ok) continue;
    const extra = vals.filter(v => !used.has(v) && !S.picked.some(s => relation(s, v)));
    const exact = !narrower && !broader && !extra.length && vals.length === S.picked.length;
    out.push({ id, exact, narrower, broader, extra });
  }
  out.sort((a, b) => (b.exact - a.exact) || (a.extra.length - b.extra.length) ||
    ((a.narrower + a.broader) - (b.narrower + b.broader)) ||
    S.vaccines[a.id].label.localeCompare(S.vaccines[b.id].label));
  return out;
}

function vaccineSearch() {
  const words = S.vacSearch.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const hits = [];
  for (const id in S.vaccines) {
    const v = S.vaccines[id];
    const hay = `${id} ${v.label} ${v.comment || ''}`.toLowerCase();
    if (words.every(w => hay.includes(w))) hits.push(id);
  }
  const order = { abstract: 0, real: 1, deprecated: 2 };
  hits.sort((a, b) => (order[S.vaccines[a].type] - order[S.vaccines[b].type]) ||
    (valencesOf(a).length - valencesOf(b).length) || S.vaccines[a].label.localeCompare(S.vaccines[b].label));
  return hits;
}

function valenceSearch() {
  const words = S.valSearch.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const hits = [];
  for (const id in S.lineage) {
    const v = S.valences[id];
    const hay = `${id} ${v.shorthand} ${v.label}`.toLowerCase();
    if (words.every(w => hay.includes(w))) hits.push(id);
  }
  // Broad before specific, so the search reads like the tree.
  hits.sort((a, b) => (S.lineage[a].length - S.lineage[b].length) || norm(S.valences[a].label).localeCompare(norm(S.valences[b].label)));
  return hits;
}

/* ---------- Actions ---------- */

function go(view) {
  S.view = view;
  persist();
  render();
  window.scrollTo(0, 0);
}

function openCode(code, step = 1) {
  const r = rowOf(code);
  if (!r) return;
  S.cur = code;
  S.view = 'booth';
  S.step = step;
  // Everything in the booth is rebuilt from this code alone - nothing carried over from the last one.
  S.candidate = S.vaccines[r.current] ? r.current : null;
  S.picked = S.candidate ? [...valencesOf(S.candidate)] : [];
  S.open = new Set(); revealPicked(); S.valSearch = ''; S.vacSearch = ''; S.showAllCands = false;
  S.confidence = r.confidence || 'sure';
  S.note = '';
  persist();
  render();
  window.scrollTo(0, 0);
}

function setStep(n) {
  S.step = n;
  render();
  window.scrollTo(0, 0);
}

function statusFor(value, confidence) {
  if (value === '#MISS') return 'petition';
  return confidence === 'sure' ? 'cleared' : 'held';
}

function stamp(value, extra = {}) {
  const r = rowOf(S.cur);
  if (!r || S.busy) return;
  S.undo = { code: r.code, row: clone(r), petitions: clone(S.desk.petitions), next: S.desk.nextPetition };
  r.current = value;
  r.confidence = value === '#MISS' ? null : S.confidence;
  r.status = statusFor(value, S.confidence);
  r.note = S.note || r.note;
  r.petition = extra.petition || null;
  r.suggest = null;
  r.dispute = null;
  r.history.push({ at: now(), by: S.desk.inspector, kind: 'stamp', value, confidence: r.confidence, note: S.note, petition: r.petition });
  persist();
  const word = value === '#NA' ? 'TURNED AWAY' : value === '#MISS' ? 'PETITION FILED' : r.status === 'held' ? 'HELD' : 'ADMITTED';
  const cls = value === '#NA' ? 'ink-na' : value === '#MISS' ? 'ink-miss' : r.status === 'held' ? 'ink-held' : 'ink-ok';
  thump(word, value, cls, () => {
    toast(`${r.code} → ${value}` + (r.status === 'held' ? ' (held for a second look)' : ''), true);
    nextTraveller(r.code);
  });
}

function backToImported() {
  const r = rowOf(S.cur);
  if (!r || !changed(r)) return;
  S.undo = { code: r.code, row: clone(r), petitions: clone(S.desk.petitions), next: S.desk.nextPetition };
  r.current = r.imported;
  r.status = r.imported ? 'unchecked' : 'queue';
  r.confidence = null; r.petition = null; r.suggest = null; r.dispute = null;
  r.history.push({ at: now(), by: S.desk.inspector, kind: 'reset', value: r.imported, note: 'Back to the imported value' });
  persist();
  toast(`${r.code} back to ${r.imported || 'undecided'}`, true);
  openCode(r.code);
}

// The stamp lands on the passport, then the next traveller is called from the same lane.
function thump(word, value, cls, done) {
  const card = document.querySelector('.passport');
  if (!card) { done(); return }
  S.busy = true;
  const el = document.createElement('div');
  el.className = `big-stamp ${cls}`;
  el.innerHTML = `<b>${esc(word)}</b><span>${esc(value)} &middot; ${esc(today())}</span>`;
  card.appendChild(el);
  setTimeout(() => { S.busy = false; done() }, 850);
}

function nextTraveller(fromCode) {
  const lane = S.lane;
  const rows = laneRows(lane);
  const all = S.desk.rows;
  let i = all.findIndex(r => r.code === fromCode);
  let next = null;
  for (let j = i + 1; j < all.length && !next; j++) if (rows.includes(all[j])) next = all[j];
  if (!next) next = rows.find(r => r.code !== fromCode) || null;
  if (next) openCode(next.code);
  else { S.view = 'hall'; persist(); render(); toast(`The ${laneName(lane)} lane is empty.`) }
}

function doUndo() {
  if (!S.undo) return;
  const u = S.undo;
  const i = S.desk.rows.findIndex(r => r.code === u.code);
  if (i >= 0) S.desk.rows[i] = u.row;
  S.desk.petitions = u.petitions;
  S.desk.nextPetition = u.next;
  S.undo = null;
  hideToast();
  persist();
  openCode(u.code);
}

function pick(id) {
  if (S.picked.includes(id)) S.picked = S.picked.filter(x => x !== id);
  else {
    // Same rule as the main editor: one coherent point per branch, so picking drops ancestors and descendants.
    S.picked = S.picked.filter(x => !(S.lineage[id] || []).includes(x) && !(S.lineage[x] || []).includes(id));
    S.picked.push(id);
    for (const a of S.lineage[id] || []) S.open.add(a);
  }
  const c = candidatesFromPicked();
  S.candidate = c.length && c[0].exact ? c[0].id : (S.candidate && c.some(x => x.id === abstractOf(S.candidate)) ? S.candidate : null);
  S.showAllCands = false;
  render();
}

const laneName = k => (LANES.find(l => l[0] === k) || [k, k])[1];

/* ---------- Petitions (#MISS as a tracked thing) ---------- */

function petitionTitle() {
  if (S.picked.length) return 'No vaccine with: ' + S.picked.map(v => S.valences[v]?.shorthand || v).join(' + ');
  const r = rowOf(S.cur);
  return r ? `Nothing in NUVA for "${r.label || r.code}"` : 'New NUVA concept';
}

function openPetitionSheet() {
  const r = rowOf(S.cur);
  if (!r) return;
  const open = S.desk.petitions.filter(p => p.status !== 'resolved' && p.status !== 'withdrawn');
  sheet(`
    <h3>Petition for a new visa class</h3>
    <p class="sub">Stamping <b>${esc(r.code)} → #MISS</b> says NUVA should have a concept for this code but doesn't yet.
      Here that is tracked as a petition, so the code isn't forgotten once NUVA catches up.</p>
    ${open.length ? `<fieldset class="choose">
      <legend>Join an open petition</legend>
      ${open.map(p => `<label><input type="radio" name="pet" value="${esc(p.id)}"> <b>${esc(p.id)}</b> ${esc(p.title)} <span class="sub">(${waitingFor(p.id).length} waiting)</span></label>`).join('')}
      <label><input type="radio" name="pet" value="new" checked> <b>New petition</b></label>
    </fieldset>` : ''}
    <div class="newpet">
      <label>What NUVA is missing<input id="petTitle" type="text" value="${esc(petitionTitle())}"></label>
      ${S.picked.length ? `<p class="sub">Proposed antigens: ${S.picked.map(v => `<span class="chip" title="${esc(norm(S.valences[v]?.label))}">${esc(S.valences[v]?.shorthand)}</span>`).join(' ')}</p>` : '<p class="sub">No antigens picked. Pick some in step 2 to attach them to the petition.</p>'}
      <label>Why (evidence, references)<textarea id="petWhy" rows="3">${esc(r.label ? `${r.code}: ${r.label}` : '')}</textarea></label>
    </div>
    <div class="sheet-actions">
      <button type="button" data-sheet="cancel">Cancel</button>
      <button type="button" class="ink-btn ink-miss" data-sheet="petition">Stamp ${esc(r.code)} → #MISS</button>
    </div>`);
}

function filePetition() {
  const choice = document.querySelector('input[name="pet"]:checked')?.value || 'new';
  let id = choice;
  if (choice === 'new') {
    id = `P-${S.desk.nextPetition}`;
    const undoPetitions = clone(S.desk.petitions), undoNext = S.desk.nextPetition;
    S.desk.nextPetition++;
    S.desk.petitions.push({
      id, title: norm($('petTitle').value) || petitionTitle(), valences: [...S.picked],
      why: $('petWhy').value.trim(), status: 'open', created: now(), by: S.desk.inspector, resolvedAs: null, log: []
    });
    closeSheet();
    stamp('#MISS', { petition: id });
    // The undo snapshot must predate the new petition.
    if (S.undo) { S.undo.petitions = undoPetitions; S.undo.next = undoNext }
    return;
  }
  closeSheet();
  stamp('#MISS', { petition: id });
}

const waitingFor = id => S.desk.rows.filter(r => r.petition === id && r.current === '#MISS');

function setPetition(id, status, resolvedAs) {
  const p = petitionOf(id);
  if (!p) return;
  p.status = status;
  p.log.push({ at: now(), by: S.desk.inspector, status, resolvedAs: resolvedAs || null });
  if (status === 'resolved') {
    p.resolvedAs = resolvedAs;
    // Nothing gets lost: every code waiting on the petition comes back for a second look, with the new concept suggested.
    for (const r of waitingFor(id)) {
      r.status = 'held';
      r.suggest = resolvedAs;
      r.history.push({ at: now(), by: S.desk.inspector, kind: 'petition', value: resolvedAs, note: `${id} resolved as ${resolvedAs}` });
    }
  }
  if (status === 'withdrawn') {
    for (const r of waitingFor(id)) {
      r.status = 'held';
      r.history.push({ at: now(), by: S.desk.inspector, kind: 'petition', value: r.current, note: `${id} withdrawn` });
    }
  }
  persist();
  render();
}

function resolvePetition(id) {
  const input = document.querySelector(`input[data-resolve-input="${CSS.escape(id)}"]`);
  const vac = norm(input?.value).toUpperCase();
  const v = S.vaccines[vac];
  if (!RE_VAC.test(vac) || !v) { toast(`${vac || 'That'} is not a vaccine in NUVA ${S.version}.`); return }
  if (v.type === 'deprecated') { toast(`${vac} is deprecated; pick a current vaccine.`); return }
  const n = waitingFor(id).length;
  setPetition(id, 'resolved', vac);
  toast(`${id} resolved as ${vac}. ${n} code(s) moved to Held for a second look.`);
}

/* ---------- Import / export ---------- */

async function importText(text, fileName) {
  if (/\.json$/i.test(fileName) || /^\s*\{/.test(text)) return importLogbook(text);
  let parsed;
  try { parsed = parseAlignment(text, fileName) } catch (e) { toast('Import failed: ' + e.message); return }
  const notes = parsed.notes;
  const noteText = [
    notes.prefixed && `${notes.prefixed} code(s) given the ${parsed.csid}- prefix`,
    notes.coerced && `${notes.coerced} unrecognized NUVA value(s) read as #MISS`,
    notes.misSpelling && `${notes.misSpelling} "#MIS" read as #MISS`,
    notes.duplicates && `${notes.duplicates} duplicate code(s) skipped`].filter(Boolean).join('; ');

  if (S.desk) {
    const same = S.desk.csid === parsed.csid;
    const stamped = S.desk.rows.filter(r => r.history.some(h => h.kind === 'stamp')).length;
    const choice = await ask(
      same ? `<h3>A ${esc(parsed.csid)} desk is already open</h3>
        <p>Merge keeps every stamp made here (${stamped} so far). Codes whose value differs from a stamp are <b>held for review</b> instead of being overwritten; new codes join the queue.</p>`
           : `<h3>Close the ${esc(S.desk.csid)} desk?</h3><p>It has ${stamped} stamp(s). Export the CSV or the logbook first if you want to keep them.</p>`,
      same ? [['cancel', 'Cancel'], ['fresh', 'Start a fresh desk'], ['merge', 'Merge into this desk', 'primary']]
           : [['cancel', 'Cancel'], ['fresh', `Open a ${esc(parsed.csid)} desk`, 'primary']]);
    if (choice === 'merge') {
      const res = mergeInto(S.desk, parsed);
      persist();
      S.lane = res.disputed ? 'held' : S.lane;
      go('hall');
      toast(`Merged ${parsed.fileName}: ${res.added} new, ${res.updated} updated, ${res.disputed} held as disputed, ${res.gone} no longer in the file.`);
      return;
    }
    if (choice !== 'fresh') return;
  }
  S.desk = newDesk(parsed);
  S.undo = null; S.hallFilter = '';
  S.lane = S.desk.rows.some(r => r.status === 'queue') ? 'queue' : 'unchecked';
  go('hall');
  toast(`Desk opened: ${S.desk.rows.length} ${S.desk.csid} travellers` + (noteText ? ` - ${noteText}` : ''));
}

function logbook() {
  return { format: 'nuva-passport-logbook', formatVersion: 1, nuvaVersion: S.version, exportedAt: now(), desk: S.desk };
}

async function importLogbook(text) {
  let lb;
  try { lb = JSON.parse(text) } catch (e) { toast('That JSON file could not be read.'); return }
  if (lb?.format !== 'nuva-passport-logbook' || !lb.desk?.rows) { toast('That is not a Passport Control logbook.'); return }
  if (S.desk) {
    const c = await ask(`<h3>Replace this desk with the logbook?</h3><p>The logbook holds a ${esc(lb.desk.csid)} desk with ${lb.desk.rows.length} codes and ${lb.desk.petitions.length} petition(s), exported ${esc((lb.exportedAt || '').slice(0, 10))}.</p>`,
      [['cancel', 'Cancel'], ['ok', 'Replace', 'primary']]);
    if (c !== 'ok') return;
  }
  S.desk = lb.desk; S.undo = null;
  go('hall');
  toast(`Logbook restored: ${S.desk.csid}, ${S.desk.rows.length} codes` + (lb.nuvaVersion !== S.version ? ` (written against NUVA ${lb.nuvaVersion}; now ${S.version})` : ''));
}

function download(name, text, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/* ---------- Rendering ---------- */

function render() {
  renderNav();
  const m = $('main');
  if (!S.desk) { m.className = 'hall'; m.innerHTML = welcome(); $('tray').hidden = true; return }
  if (S.view === 'booth' && !rowOf(S.cur)) S.view = 'hall';
  m.className = S.view;
  if (S.view === 'booth') { m.innerHTML = booth(); $('tray').hidden = false; $('tray').innerHTML = tray() }
  else {
    $('tray').hidden = true;
    m.innerHTML = S.view === 'petitions' ? petitionsOffice() : S.view === 'exit' ? exitGate() : hall();
  }
}

function renderNav() {
  $('postMeta').innerHTML = `NUVA ${esc(S.version || '…')}` + (S.desk ? ` &middot; desk <b>${esc(S.desk.csid)}</b>` : '');
  const open = S.desk ? S.desk.petitions.filter(p => p.status === 'open' || p.status === 'sent').length : 0;
  $('nav').innerHTML = S.desk ? [
    ['hall', 'Hall'], ['petitions', `Petitions${open ? ` <b class="pill">${open}</b>` : ''}`], ['exit', 'Exit gate']
  ].map(([k, l]) => `<button type="button" data-go="${k}" class="${S.view === k ? 'on' : ''}">${l}</button>`).join('') +
    '<button type="button" data-act="import" class="ghost">Import…</button>' : '';
}

function vacTag(id) {
  const v = S.vaccines[id];
  const cls = !v ? 'missing' : v.type;
  return `<span class="vtag vt-${cls}" title="${esc(v ? `${v.type}: ${v.label}` : 'Not in NUVA')}">${esc(id)}</span>`;
}

const inkOf = v => v === '#NA' ? 'ink-na' : v === '#MISS' ? 'ink-miss' : 'ink-ok';

function miniStamp(r) {
  const warn = attention(r);
  if (!r.current) return '<span class="mini none">—</span>';
  const cls = warn ? 'ink-exp' : r.current === '#NA' ? 'ink-na' : r.current === '#MISS' ? 'ink-miss' : r.status === 'held' ? 'ink-held' : r.status === 'unchecked' ? 'ink-unchecked' : 'ink-ok';
  return `<span class="mini ${cls}" title="${esc(warn || S.vaccines[r.current]?.label || '')}">${esc(r.current)}</span>`;
}

function welcome() {
  return `<section class="welcome">
    <div class="closed-sign">BORDER CLOSED<small>no desk open</small></div>
    <h1>Open a desk</h1>
    <p>Every code in an alignment file is a traveller asking to enter NUVA. You inspect its papers, work out its antigens,
      and stamp it: <span class="mini ink-ok">admitted</span> to a NUVA vaccine, <span class="mini ink-na">#NA</span> turned away,
      or <span class="mini ink-miss">#MISS</span> held on a petition for a NUVA concept that doesn't exist yet.</p>
    <div class="welcome-actions">
      <button type="button" class="big" data-sample="samples/CVX-unaligned.csv"><b>CVX, no decisions yet</b><span>align from scratch</span></button>
      <button type="button" class="big" data-sample="samples/CVX2nuva.csv"><b>CVX as published</b><span>inspect existing stamps</span></button>
    </div>
    <p><button type="button" data-act="import">Import an alignment CSV or a logbook…</button></p>
    <p class="sub">The CSV is the standard NUVA alignment file. Everything else, including status, confidence, notes and petitions,
      stays in this browser and in an optional logbook file. Nothing is sent anywhere.</p>
  </section>`;
}

function hall() {
  const d = S.desk;
  const tiles = LANES.map(([k, label, hint]) => {
    const n = d.rows.filter(r => inLane(r, k)).length;
    return `<button type="button" class="flap ${S.lane === k ? 'on' : ''} lane-${k}" data-lane="${k}" title="${esc(hint)}">
      <span class="flap-n">${String(n).padStart(3, '0')}</span><span class="flap-l">${esc(label)}</span></button>`;
  }).join('');
  const rows = laneRows();
  const first = rows[0];
  const hint = LANES.find(l => l[0] === S.lane)[2];
  return `<section class="board">
      <div class="board-title"><span>${esc(d.csid)} &middot; ${d.rows.length} travellers</span><span class="sub">${esc(d.fileName || '')}</span></div>
      <div class="flaps">${tiles}</div>
    </section>
    <section class="manifest">
      <div class="manifest-head">
        <div><h2>${esc(laneName(S.lane))}</h2><p class="sub">${esc(hint)}</p></div>
        <button type="button" class="call" data-act="call" ${first ? '' : 'disabled'}>Call next traveller &#9656;</button>
      </div>
      <input id="hallFilter" type="search" placeholder="Find a code, a label, a NUVA code…" value="${esc(S.hallFilter)}">
      <ol class="rows">
        ${rows.map(r => `<li data-code="${esc(r.code)}" class="${r.code === S.cur ? 'last' : ''}">
          <span class="r-code">${esc(r.code)}${retired(r) ? ' <span class="tag">retired</span>' : ''}${r.gone ? ' <span class="tag">not in latest file</span>' : ''}</span>
          <span class="r-label">${esc(r.label) || '<i>no label</i>'}</span>
          <span class="r-flags">${r.dispute ? '<span class="tag warn" title="Re-imported file disagrees">disputed</span>' : ''}${r.suggest ? `<span class="tag ok" title="Petition resolved">try ${esc(r.suggest)}</span>` : ''}${r.confidence && r.confidence !== 'sure' ? `<span class="tag">${esc(r.confidence)}</span>` : ''}</span>
          ${miniStamp(r)}
        </li>`).join('') || '<li class="empty">Nobody in this lane.</li>'}
      </ol>
    </section>`;
}

function mrz(r) {
  const clean = s => String(s).toUpperCase().replace(/[^A-Z0-9]+/g, '<');
  const a = `P<${clean(S.desk.csid)}<<${clean(r.code.slice(S.desk.csid.length + 1))}<<<${clean(r.label)}`.padEnd(44, '<').slice(0, 44);
  const b = `${clean(r.current || 'UNDECIDED')}<<${clean(r.status)}<<NUVA${clean(S.version || '')}`.padEnd(44, '<').slice(0, 44);
  return `${a}\n${b}`;
}

function booth() {
  const r = rowOf(S.cur);
  const rows = laneRows();
  const pos = rows.findIndex(x => x.code === r.code);
  const steps = STEPS.map(([n, l]) => `<button type="button" data-step="${n}" class="${S.step === n ? 'on' : ''} ${S.step > n ? 'done' : ''}"><i>${n}</i> ${l}</button>`).join('');
  const body = S.step === 1 ? stepPapers(r) : S.step === 2 ? stepAntigens(r) : stepVerdict(r);
  return `<div class="booth-bar">
      <button type="button" data-go="hall" class="ghost">&#9666; Hall</button>
      <span class="sub">${esc(laneName(S.lane))} ${pos >= 0 ? `&middot; ${pos + 1} of ${rows.length}` : ''}</span>
      <nav class="steps">${steps}</nav>
      <button type="button" data-act="skip" class="ghost" title="Next in this lane">Skip &#9656;</button>
    </div>
    <article class="passport">
      <div class="pp-top">
        <div class="photo" aria-hidden="true">${esc(S.desk.csid)}</div>
        <div class="pp-id">
          <div class="pp-k">Code</div>
          <div class="pp-code">${esc(r.code)}${retired(r) ? ' <span class="tag">retired in source</span>' : ''}</div>
          <div class="pp-k">Declared description</div>
          <div class="pp-label">${esc(r.label) || '<i>No label in the file</i>'}</div>
        </div>
        <div class="pp-current">${r.current ? `<span class="stamp-impr ${miniStamp(r).match(/ink-\w+/)?.[0] || ''}">${esc(r.current)}</span>` : '<span class="sub">not yet stamped</span>'}</div>
      </div>
      <div class="pp-body">${body}</div>
      <pre class="mrz" aria-hidden="true">${esc(mrz(r))}</pre>
    </article>`;
}

function stepPapers(r) {
  const warn = attention(r);
  const pet = r.petition ? petitionOf(r.petition) : null;
  const words = [...new Set(norm(r.label).split(/[^A-Za-z0-9-]+/).filter(w => w.length > 2 && !STOPWORDS.has(w.toLowerCase())))];
  const visas = r.history.filter(h => h.kind !== 'reimport' || h.value !== r.imported).slice(-6);
  const cur = S.vaccines[r.current];
  return `
    ${r.dispute ? `<p class="alert warn">&#9888; Disputed: ${esc(r.dispute)}</p>` : ''}
    ${r.suggest ? `<p class="alert ok">Petition ${esc(r.petition || '')} was resolved: NUVA now has ${vacTag(r.suggest)} ${esc(S.vaccines[r.suggest]?.label)}.
        <button type="button" class="ink-btn ink-ok small" data-act="try-suggest">Compare it &#9656;</button></p>` : ''}
    ${warn ? `<p class="alert warn">&#9888; Expired visa: ${esc(warn)}.</p>` : ''}
    <dl class="facts">
      <dt>Status</dt><dd><b>${esc(laneName(r.status))}</b>${r.confidence ? ` &middot; confidence: ${esc(r.confidence)}` : ''}</dd>
      <dt>Stamp now</dt><dd>${r.current ? `${cur ? vacTag(r.current) + ' ' + esc(cur.label) : esc(r.current)}` : '<i>none</i>'}</dd>
      <dt>In the file</dt><dd>${r.imported ? esc(r.imported) : '<i>blank</i>'}${changed(r) ? ' <span class="tag">changed here</span>' : ''}</dd>
      ${pet ? `<dt>Petition</dt><dd><a href="#" data-go="petitions">${esc(pet.id)}</a> ${esc(pet.title)} <span class="tag">${esc(pet.status)}</span></dd>` : ''}
      ${r.note ? `<dt>Note</dt><dd>${esc(r.note)}</dd>` : ''}
    </dl>
    ${words.length ? `<div class="words"><div class="pp-k">Which words matter? Pick them to search the antigens</div>
      ${words.map(w => `<button type="button" class="word" data-word="${esc(w)}">${esc(w)}</button>`).join('')}</div>` : ''}
    ${visas.length ? `<div class="visas"><div class="pp-k">Visa pages</div>${visas.map(h => `<span class="visa ${h.kind} ${h.kind === 'stamp' ? inkOf(h.value) : ''}" title="${esc(h.note || '')}">
        <b>${esc(h.kind === 'stamp' ? h.value : h.kind === 'reset' ? 'RESET' : h.kind === 'petition' ? 'PETITION' : 'FILE')}</b>
        <small>${esc((h.at || '').slice(0, 10))}${h.by ? ' ' + esc(h.by) : ''}${h.confidence ? ' · ' + esc(h.confidence) : ''}</small></span>`).join('')}</div>` : ''}
    <div class="step-next">
      ${cur ? `<button type="button" data-act="verify">Inspect the current stamp ${esc(r.current)} &#9656;</button>` : ''}
      <button type="button" class="primary" data-step="2">Next: work out the antigens &#9656;</button>
    </div>`;
}

// The antigen tree is always drawn as a tree - indented under its parent, with guide lines - never as a flat list.
// Browsing: the pathogen families, each folding open in place. Searching: every match is shown inside its own
// branch, with its ancestors as muted context, and can itself be folded open to see what is more specific.
function antigenTree() {
  const words = S.valSearch.toLowerCase().split(/\s+/).filter(Boolean);
  let hits = null, show = null;
  if (words.length) {
    hits = new Set(valenceSearch());
    show = new Set();
    for (const id of hits) { show.add(id); for (const a of S.lineage[id]) show.add(a) }
  }
  const re = words.length ? new RegExp(`(${words.map(w => esc(w).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi') : null;
  const mark = s => re ? esc(s).replace(re, '<mark>$1</mark>') : esc(s);
  const candVals = new Set(S.candidate ? valencesOf(S.candidate) : []);

  // forced: the parent was opened by hand, so every child shows even when it doesn't match the search.
  const node = (id, depth, forced) => {
    if (show && !forced && !show.has(id)) return '';
    const v = S.valences[id];
    const d = S.diff[id];
    const kids = S.children[id] || [];
    const isOpen = S.open.has(id);
    const shown = (isOpen ? kids.map(k => node(k, depth + 1, true))
      : show ? kids.filter(k => show.has(k)).map(k => node(k, depth + 1, false)) : []).filter(Boolean);
    const isPicked = S.picked.includes(id);
    const cls = [depth === 0 ? 'family' : '', isPicked ? 'picked' : '', hits?.has(id) ? 'hit' : '',
      show && !hits.has(id) && !forced ? 'ctx' : '', candVals.has(id) ? 'incand' : '', id === 'VAL000' ? 'dim' : ''].join(' ');
    const caret = kids.length
      ? `<button type="button" class="fold" data-fold="${id}" aria-expanded="${isOpen}" title="${isOpen ? 'Fold' : `Show all ${S.descendants[id]} more specific`}">${isOpen || shown.length ? '&#9662;' : '&#9656;'}</button>`
      : '<span class="fold leaf">&middot;</span>';
    return `<li>
      <div class="vnode ${cls}">
        ${caret}
        <button type="button" class="vpick" data-pick="${id}" aria-pressed="${isPicked}" title="${isPicked ? 'Unpick' : 'Pick this antigen'}">${isPicked ? '&#10003;' : '+'}</button>
        <div class="vtext" title="${esc(id)} - ${esc(norm(v.label))}${techType(id) ? '\nTechnology: ' + esc(techType(id)) : ''}">
          <span class="sh">${mark(v.shorthand)}</span> <span class="dd ${d.derived ? 'derived' : ''}">${mark(d.text)}</span>
          ${kids.length && !isOpen && !shown.length ? `<button type="button" class="more" data-fold="${id}">${S.descendants[id]} more specific</button>` : ''}
        </div>
        <span class="used" title="Abstract vaccines carrying this antigen or a more specific one">${S.usage[id] || ''}</span>
      </div>
      ${shown.length ? `<ul>${shown.join('')}</ul>` : ''}
    </li>`;
  };
  const html = (S.children[ROOT] || []).map(id => node(id, 0, false)).join('');
  const head = hits
    ? `${hits.size} antigen(s) match “${esc(S.valSearch)}”, shown in their branches`
    : `${(S.children[ROOT] || []).length} pathogen families - open one to see its branch`;
  return `<div class="tree-head"><span class="sub">${head}</span>${S.open.size ? '<button type="button" class="ghost small" data-act="fold-all">Fold all</button>' : ''}</div>
    <ul class="vtree">${html || '<li class="empty">No antigen matches. Try fewer words.</li>'}</ul>`;
}

// Keep every picked antigen's branch open, so it's visible where it sits.
function revealPicked() {
  for (const v of S.picked) for (const a of S.lineage[v] || []) S.open.add(a);
}

function stepAntigens(r) {
  const chips = S.picked.map(v => `<span class="chip" title="${esc(norm(S.valences[v]?.label))}">${esc(S.valences[v]?.shorthand || v)}
      <button type="button" data-pick="${esc(v)}" aria-label="Unpick">&times;</button></span>`).join('');
  const c = candidatesFromPicked();
  const exact = c.filter(x => x.exact);
  return `
    <div class="picked-row"><span class="pp-k">Picked antigens</span> ${chips || '<span class="sub">none yet - pick one antigen per pathogen</span>'}</div>
    <div class="step-next sum-top">
      <span>${!S.picked.length ? 'Pick antigens to narrow the visa classes.' : exact.length ? `Exact visa class: ${vacTag(exact[0].id)} ${esc(S.vaccines[exact[0].id].label)}` : `${c.length} close visa class(es), no exact one.`}</span>
      <button type="button" class="primary" data-step="3">Next: verdict &#9656;</button>
    </div>
    <input id="valSearch" type="search" placeholder="Search antigens: words, shorthand or VAL code" value="${esc(S.valSearch)}">
    <p class="sub legend">Each antigen sits under its parent, and its text says only how it differs from that parent (auto-derived from the labels; hover for the full description). The number on the right = vaccines carrying it.</p>
    ${antigenTree()}`;
}

function stepVerdict(r) {
  const fromPick = candidatesFromPicked();
  const fromText = vaccineSearch();
  const LIMIT = S.showAllCands ? 60 : 6;
  const relText = c => c.exact ? '<span class="rel exact">exact</span>' : [
    c.extra.length ? `<span class="rel">+ ${c.extra.map(x => esc(S.valences[x]?.shorthand)).join(', ')}</span>` : '',
    c.narrower ? `<span class="rel">${c.narrower} more specific</span>` : '',
    c.broader ? `<span class="rel">${c.broader} less specific</span>` : ''].join(' ');
  const cand = (id, rel) => `<li class="cand ${abstractOf(S.candidate) === id || S.candidate === id ? 'on' : ''}" data-cand="${id}">
      ${vacTag(id)} <span>${esc(S.vaccines[id].label)}</span> ${rel}</li>`;
  const list = S.vacSearch.trim()
    ? fromText.slice(0, LIMIT).map(id => cand(id, `<span class="rel">${esc(S.vaccines[id].type)}</span>`)).join('')
    : fromPick.slice(0, LIMIT).map(c => cand(c.id, relText(c))).join('');
  const total = S.vacSearch.trim() ? fromText.length : fromPick.length;

  const cv = S.vaccines[S.candidate];
  const abs = cv ? abstractOf(S.candidate) : null;
  const inst = abs ? S.instances[abs] || [] : [];
  const others = cv ? S.desk.rows.filter(x => x.current === S.candidate && x.code !== r.code) : [];
  const compare = cv ? `<div class="compare">
      <div class="cmp"><div class="pp-k">The papers say</div><p>${esc(r.label) || '<i>no label</i>'}</p></div>
      <div class="cmp"><div class="pp-k">Visa class ${vacTag(S.candidate)} <span class="sub">${esc(cv.type)}</span></div>
        <p>${esc(cv.label)}</p>${cv.comment ? `<p class="sub">${esc(cv.comment)}</p>` : ''}
        ${cv.type !== 'abstract' && abs ? `<p class="sub">Product of <a href="#" data-cand="${abs}">${esc(abs)}</a> ${esc(S.vaccines[abs]?.label)}</p>` : ''}
        ${others.length ? `<p class="sub">Also stamped here for: ${others.map(o => esc(o.code)).join(', ')}</p>` : ''}</div>
      <div class="cmp"><div class="pp-k">Its antigens</div>
        ${valencesOf(S.candidate).map(v => `<p class="vfull"><span class="sh">${esc(S.valences[v]?.shorthand)}</span> ${esc(norm(S.valences[v]?.label))}
          ${techType(v) ? `<span class="sub">· ${esc(techType(v))}</span>` : ''}</p>`).join('') || '<p class="sub">No antigens recorded.</p>'}</div>
      ${inst.length ? `<details class="products"><summary>${inst.length} specific product(s) - stamp a product instead of the class</summary>
        ${inst.map(i => `<a href="#" data-cand="${i}" class="${i === S.candidate ? 'on' : ''}">${vacTag(i)} ${esc(S.vaccines[i].label)}</a>`).join('')}</details>` : ''}
      ${cv.type === 'deprecated' ? '<p class="alert warn">This vaccine is deprecated and can\'t be stamped.</p>' : ''}
    </div>` : `<p class="sub nocand">No visa class chosen. Pick antigens in step 2, or search by name above.</p>`;

  return `
    <input id="vacSearch" type="search" placeholder="…or search visa classes by name" value="${esc(S.vacSearch)}">
    <div class="cands-head sub">${S.vacSearch.trim() ? `${total} matching “${esc(S.vacSearch)}”` : S.picked.length ? `${total} visa class(es) carrying ${S.picked.map(v => esc(S.valences[v]?.shorthand)).join(' + ')}` : 'Nothing picked yet'}</div>
    <ul class="cands">${list || (S.picked.length || S.vacSearch ? '<li class="empty">Nothing carries this. If NUVA should, that is a petition (#MISS).</li>' : '')}</ul>
    ${total > LIMIT ? `<button type="button" class="ghost small" data-act="more">Show ${S.showAllCands ? 'fewer' : `all ${Math.min(total, 60)}`}</button>` : ''}
    ${compare}`;
}

function tray() {
  const r = rowOf(S.cur);
  const cv = S.vaccines[S.candidate];
  const canAdmit = !!cv && cv.type !== 'deprecated' && S.step === 3;
  // A one-click confirm only for an existing VAC/#NA stamp; #MISS always goes through a petition.
  const confirmable = r.current && r.current !== '#MISS' && !r.suggest && r.status !== 'cleared' && !attention(r) && S.step === 1;
  return `<div class="tray-in">
    <div class="conf" role="group" aria-label="Confidence">
      ${CONFIDENCE.map(([k, l]) => `<button type="button" data-conf="${k}" class="${S.confidence === k ? 'on' : ''}">${l}</button>`).join('')}
      <span class="sub">${S.confidence === 'sure' ? 'clears the code' : 'holds it for a second look'}</span>
    </div>
    <input id="note" type="text" placeholder="Note for the logbook (optional)" value="${esc(S.note)}">
    <div class="stamps">
      ${confirmable ? `<button type="button" class="ink-btn ink-ok" data-act="confirm">Stamp ${esc(r.code)} → ${esc(r.current)}</button>` : ''}
      ${!confirmable ? `<button type="button" class="ink-btn ink-ok" data-act="admit" ${canAdmit ? '' : 'disabled'} title="${S.step < 3 ? 'Choose a visa class in step 3' : ''}">
        ${canAdmit ? `Stamp ${esc(r.code)} → ${esc(S.candidate)}` : 'Admit (choose a visa class in step 3)'}</button>` : ''}
      <button type="button" class="ink-btn ink-na" data-act="na">Stamp ${esc(r.code)} → #NA</button>
      <button type="button" class="ink-btn ink-miss" data-act="miss">Stamp ${esc(r.code)} → #MISS&hellip;</button>
      ${changed(r) ? '<button type="button" class="ghost small" data-act="reset">Back to the file\'s value</button>' : ''}
    </div>
  </div>`;
}

function petitionsOffice() {
  const ps = S.desk.petitions;
  const order = { open: 0, sent: 1, resolved: 2, withdrawn: 3 };
  const sorted = [...ps].sort((a, b) => order[a.status] - order[b.status] || a.id.localeCompare(b.id, undefined, { numeric: true }));
  const orphanMiss = S.desk.rows.filter(r => r.current === '#MISS' && !r.petition);
  return `<section class="office">
    <h1>Petitions office</h1>
    <p class="sub">Each <b>#MISS</b> stamped here files or joins a petition: what NUVA is missing, why, and which codes are waiting on it.
      Resolve a petition with the new NUVA code once it exists, and every waiting code comes back to <b>Held</b> with it suggested.</p>
    ${sorted.map(p => {
      const waiting = waitingFor(p.id);
      return `<article class="petition st-${p.status}">
        <header><span class="pet-id">${esc(p.id)}</span> <h2>${esc(p.title)}</h2> <span class="pet-st">${esc(p.status)}</span></header>
        ${p.valences.length ? `<p>${p.valences.map(v => `<span class="chip" title="${esc(norm(S.valences[v]?.label))}">${esc(S.valences[v]?.shorthand || v)}</span> <span class="sub">${esc(norm(S.valences[v]?.label))}</span>`).join('<br>')}</p>` : ''}
        ${p.why ? `<p class="why">${esc(p.why)}</p>` : ''}
        <p class="sub">Filed ${esc(p.created.slice(0, 10))}${p.by ? ` by ${esc(p.by)}` : ''}${p.resolvedAs ? ` &middot; resolved as ${vacTag(p.resolvedAs)}` : ''}</p>
        <p>${waiting.length ? `${p.status === 'resolved' ? 'Sent back for a second look' : 'Waiting'}: ${waiting.map(r => `<a href="#" data-code-link="${esc(r.code)}">${esc(r.code)}</a>`).join(', ')}` : '<span class="sub">No codes waiting.</span>'}</p>
        ${p.status === 'open' || p.status === 'sent' ? `<div class="pet-actions">
          ${p.status === 'open' ? `<button type="button" data-pet="${esc(p.id)}" data-pet-st="sent">Mark sent to IVC</button>` : ''}
          <input type="text" data-resolve-input="${esc(p.id)}" placeholder="New VAC code, e.g. VAC1234" size="18">
          <button type="button" class="ink-btn ink-ok small" data-resolve="${esc(p.id)}">Resolve</button>
          <button type="button" class="ghost small" data-pet="${esc(p.id)}" data-pet-st="withdrawn">Withdraw</button>
        </div>` : ''}
      </article>`;
    }).join('') || '<p class="empty">No petitions yet. Stamp a code #MISS to file one.</p>'}
    ${orphanMiss.length ? `<p class="sub">${orphanMiss.length} code(s) are #MISS without a petition (they came that way in the file):
      ${orphanMiss.slice(0, 12).map(r => `<a href="#" data-code-link="${esc(r.code)}">${esc(r.code)}</a>`).join(', ')}${orphanMiss.length > 12 ? '…' : ''}</p>` : ''}
  </section>`;
}

function exitGate() {
  const d = S.desk;
  const csv = buildCSV(d);
  const lines = csv.text.replace(/^﻿/, '').split('\n');
  const held = d.rows.filter(r => r.status === 'held').length;
  const lbName = `${d.csid}-passport-logbook_${today()}.json`;
  return `<section class="exit">
    <h1>Exit gate</h1>
    <div class="exit-cards">
      <div class="exit-card">
        <h2>The alignment file</h2>
        <p>The standard NUVA alignment CSV: loads in the main editor and the rest of the tooling unchanged.
          Status, confidence and petitions are <b>not</b> in it.</p>
        <ul class="sub">
          ${csv.undecided ? `<li><b>${csv.undecided}</b> code(s) still in the queue are written as <code>#MISS</code> (the format has no "not decided yet" value).</li>` : ''}
          ${held ? `<li><b>${held}</b> held code(s) go out with their current stamp; the file can't say they're held.</li>` : ''}
        </ul>
        <button type="button" class="primary" data-act="export-csv">Download ${esc(csv.name)}</button>
      </div>
      <div class="exit-card">
        <h2>The logbook</h2>
        <p>Everything this desk knows: each code's status, confidence, notes and visa pages, plus the petitions.
          Import it on another computer (or hand it to a colleague) to carry on where you left off.</p>
        <button type="button" data-act="export-log">Download ${esc(lbName)}</button>
        <p class="sub">Inspector name stamped on the visa pages:
          <input id="inspector" type="text" size="14" value="${esc(d.inspector)}" placeholder="initials"></p>
      </div>
    </div>
    <h2 class="preview-h">Preview: ${esc(csv.name)} <span class="sub">(${lines.length - 2} codes)</span></h2>
    <pre class="preview">${esc(lines.slice(0, 16).join('\n'))}${lines.length > 17 ? '\n…' : ''}</pre>
    <p><button type="button" class="ghost small" data-act="close-desk">Close this desk…</button></p>
  </section>`;
}

/* ---------- Toast & sheet ---------- */

let toastTimer = null;
function toast(msg, withUndo) {
  const t = $('toast');
  t.innerHTML = esc(msg) + (withUndo && S.undo ? ' <button type="button" data-act="undo">Undo</button>' : '');
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, withUndo ? 6000 : 8000);
}
function hideToast() { $('toast').hidden = true }

let sheetDone = null;
function sheet(html) {
  $('sheet').innerHTML = html;
  $('overlay').hidden = false;
  $('sheet').querySelector('input[type=text], button.primary, button.ink-btn')?.focus();
}
function closeSheet() {
  $('overlay').hidden = true;
  $('sheet').innerHTML = '';
  if (sheetDone) { const d = sheetDone; sheetDone = null; d('cancel') }
}
// In-page replacement for confirm(): resolves with the chosen button's value.
function ask(html, buttons) {
  return new Promise(resolve => {
    sheet(`${html}<div class="sheet-actions">${buttons.map(([v, l, c]) =>
      `<button type="button" data-ask="${v}" class="${c || ''}">${l}</button>`).join('')}</div>`);
    sheetDone = resolve;
    $('sheet').querySelector('button.primary')?.focus();
  });
}

/* ---------- Events ---------- */

function wire() {
  $('fileInput').onchange = e => {
    const f = e.target.files[0];
    if (!f) return;
    f.text().then(t => importText(t, f.name));
    e.target.value = '';
  };

  document.addEventListener('click', e => {
    const el = e.target.closest('[data-go],[data-lane],[data-code],[data-code-link],[data-step],[data-pick],[data-fold],[data-word],[data-cand],[data-conf],[data-sample],[data-sheet],[data-ask],[data-pet],[data-resolve],[data-act]');
    if (!el) { if (e.target === $('overlay')) closeSheet(); return }
    const d = el.dataset;
    if (el.tagName === 'A') e.preventDefault();
    if (d.ask) { const done = sheetDone; sheetDone = null; closeSheet(); done?.(d.ask); return }
    if (d.sheet) { d.sheet === 'petition' ? filePetition() : closeSheet(); return }
    if (d.go) { go(d.go); return }
    if (d.lane) { S.lane = d.lane; persist(); render(); return }
    if (d.codeLink) { openCode(d.codeLink); return }
    if (d.code) { openCode(d.code); return }
    if (d.step) { setStep(+d.step); return }
    if (d.pick) { pick(d.pick); return }
    if (d.fold) { S.open.has(d.fold) ? S.open.delete(d.fold) : S.open.add(d.fold); render(); return }
    if (d.word) { S.valSearch = (S.valSearch.split(/\s+/).includes(d.word) ? S.valSearch : `${S.valSearch} ${d.word}`).trim(); setStep(2); return }
    if (d.cand) { S.candidate = d.cand; render(); return }
    if (d.conf) { S.confidence = d.conf; render(); return }
    if (d.sample) { fetch(d.sample).then(r => r.text()).then(t => importText(t, d.sample.split('/').pop())); return }
    if (d.pet) { setPetition(d.pet, d.petSt); return }
    if (d.resolve) { resolvePetition(d.resolve); return }
    if (d.act) act(d.act);
  });

  document.addEventListener('input', e => {
    const id = e.target.id;
    if (id === 'note') { S.note = e.target.value; return }
    if (id === 'inspector') { S.desk.inspector = norm(e.target.value); persist(); return }
    const keep = fn => { const pos = e.target.selectionStart; fn(); render(); const s = $(id); s.focus(); s.setSelectionRange(pos, pos) };
    if (id === 'hallFilter') keep(() => { S.hallFilter = e.target.value });
    if (id === 'valSearch') keep(() => { S.valSearch = e.target.value });
    if (id === 'vacSearch') keep(() => { S.vacSearch = e.target.value; S.showAllCands = false });
  });

  document.addEventListener('keydown', e => {
    if (!$('overlay').hidden) { if (e.key === 'Escape') closeSheet(); return }
    if (e.target.matches('input, textarea, select')) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key;
    if (k === 'Escape' && S.view !== 'hall' && S.desk) go('hall');
    else if (k === 'n' && S.view === 'hall') act('call');
    else if (S.view === 'booth' && ['1', '2', '3'].includes(k)) setStep(+k);
    else if (k === 'z' && S.undo) doUndo();
  });
}

async function act(a) {
  const r = rowOf(S.cur);
  switch (a) {
    case 'import': $('fileInput').click(); return;
    case 'undo': doUndo(); return;
    case 'fold-all': S.open = new Set(); render(); return;
    case 'call': { const n = laneRows()[0]; if (n) openCode(n.code); return }
    case 'export-csv': { const c = buildCSV(S.desk); download(c.name, c.text, 'text/csv;charset=utf-8'); toast(`Downloaded ${c.name}`); return }
    case 'export-log': download(`${S.desk.csid}-passport-logbook_${today()}.json`, JSON.stringify(logbook(), null, 1), 'application/json'); return;
    case 'close-desk': {
      const c = await ask(`<h3>Close the ${esc(S.desk.csid)} desk?</h3><p>Its stamps, petitions and history are removed from this browser. Download the CSV and the logbook first if you need them.</p>`,
        [['cancel', 'Cancel'], ['ok', 'Close the desk', 'primary']]);
      if (c === 'ok') { S.desk = null; S.cur = null; S.undo = null; persist(); go('hall') }
      return;
    }
  }
  if (!r) return;
  switch (a) {
    case 'skip': {
      const rows = laneRows(); const i = rows.findIndex(x => x.code === r.code);
      const n = rows[i + 1] || rows[0];
      if (n && n.code !== r.code) openCode(n.code);
      return;
    }
    case 'verify': S.candidate = r.current; S.picked = [...valencesOf(r.current)]; revealPicked(); setStep(3); return;
    case 'try-suggest': S.candidate = r.suggest; S.picked = [...valencesOf(r.suggest)]; revealPicked(); setStep(3); return;
    case 'more': S.showAllCands = !S.showAllCands; render(); return;
    case 'confirm': stamp(r.current); return;
    case 'admit': { const v = S.vaccines[S.candidate]; if (v && v.type !== 'deprecated' && S.step === 3) stamp(S.candidate); return }
    case 'na': stamp('#NA'); return;
    case 'miss': openPetitionSheet(); return;
    case 'reset': backToImported(); return;
  }
}

/* ---------- Start ---------- */

function start() {
  wire();
  $('main').innerHTML = '<p class="loading">Opening the border post…</p>';
  fetch(DATA_URL)
    .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
    .then(data => {
      buildIndexes(data);
      const saved = load(STORE_KEY);
      if (saved && saved.rows) {
        S.desk = saved;
        S.lane = saved.lane || 'queue';
        if (saved.view === 'booth' && rowOf(saved.cur)) { openCode(saved.cur); return }
        S.view = saved.view === 'petitions' || saved.view === 'exit' ? saved.view : 'hall';
        S.cur = saved.cur;
      }
      render();
    })
    .catch(err => {
      $('main').innerHTML = `<section class="welcome"><div class="closed-sign">BORDER CLOSED<small>no NUVA data</small></div>
        <h1>Could not load the NUVA data</h1><p>${esc(err.message)}</p>
        <p>Passport Control reads <code>${DATA_URL}</code>. Browsers block that when the page is opened as a <code>file://</code> URL -
        serve the <code>docs/</code> folder over HTTP instead (see README.md).</p></section>`;
    });
}

if (typeof document !== 'undefined') start();
// Lets the round-trip test run the CSV functions in Node; does nothing in the browser.
if (typeof module !== 'undefined') module.exports = { S, buildIndexes, parseAlignment, newDesk, buildCSV, mergeInto };
