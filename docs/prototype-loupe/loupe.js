/* Loupe - single-screen NUVA alignment prototype.
 *
 * Self-contained: reads the published NUVA data (../data/nuvadata.json),
 * imports/exports the standard alignment CSV, keeps work in localStorage
 * under its own "loupe." keys so it never touches the main editor's
 * vaccines/valences/CSData/context keys on the same origin.
 */
'use strict';

const DATA_URL = '../data/nuvadata.json';
const STORE_KEY = 'loupe.work.v1';
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

const VIEWS = [
  ['all', 'All'], ['undecided', 'Undecided'], ['aligned', 'Aligned'], ['miss', '#MISS'],
  ['na', '#NA'], ['changed', 'Changed'], ['attention', 'Needs attention']
];

const S = {
  version: null, vaccines: {}, valences: {},
  children: {}, lineage: {}, instances: {}, diff: {},
  work: null,          // { csid, fileName, importedAt, rows: [{code, label, imported, current}] }
  cur: null,           // code currently under the loupe
  selected: [],        // valences ticked in the tree
  candidate: null,     // VAC code shown in the comparison
  codeFilter: '', view: 'all', valFilter: '', vacSearch: '',
  open: new Set(), undo: null
};

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const today = () => new Date().toISOString().slice(0, 10);
const norm = s => String(s ?? '').replace(/\s+/g, ' ').trim();

/* ---------- Storage ---------- */

function store(key, value) {
  try { value == null ? localStorage.removeItem(key) : localStorage.setItem(key, JSON.stringify(value)) } catch (e) { /* storage unavailable: work stays in memory */ }
}
function load(key) {
  try { return JSON.parse(localStorage.getItem(key)) } catch (e) { return null }
}
function persist() {
  store(STORE_KEY, S.work ? { ...S.work, cur: S.cur, savedAt: new Date().toISOString() } : null);
}

/* ---------- NUVA data ---------- */

function buildIndexes(data) {
  S.version = data.version;
  S.vaccines = data.vaccines;
  S.valences = data.valences;
  for (const id in S.valences) {
    if (id === ROOT) continue;
    const p = S.valences[id].parent;
    (S.children[p] ||= []).push(id);
  }
  for (const k in S.children) S.children[k].sort((a, b) => S.valences[a].shorthand.localeCompare(S.valences[b].shorthand));
  for (const id in S.valences) {
    if (id === ROOT) continue;
    const line = [];
    let p = S.valences[id].parent;
    while (p && p !== ROOT && S.valences[p] && !line.includes(p)) { line.push(p); p = S.valences[p].parent }
    S.lineage[id] = line;
    S.diff[id] = differential(id);
  }
  for (const id in S.vaccines) {
    const v = S.vaccines[id];
    if (v.type !== 'abstract' && v.instanceOf) (S.instances[v.instanceOf] ||= []).push(id);
  }
}

// Short "how this differs from its parent" text, derived from the labels.
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
    if (t && t !== '0') return { label: `${t} ${VTYPES[t] || ''}`.trim(), from: k === id ? null : k };
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
    out.push({ code, label: norm(r[2]), imported: nuva, current: nuva });
  }
  return { csid, fileName, importedAt: new Date().toISOString(), rows: out, notes };
}

function csvQuote(s) { return '"' + String(s ?? '').replace(/"/g, '""') + '"' }

function exportAlignment() {
  const w = S.work;
  let undecided = 0;
  let out = '﻿' + `${w.csid},NUVA,${w.csid} label, NUVA label\n`;
  for (const r of w.rows) {
    let nuva = r.current;
    if (!nuva) { nuva = '#MISS'; undecided++ }
    const nl = S.vaccines[nuva] ? csvQuote(S.vaccines[nuva].label) : '';
    out += `${r.code},${nuva},${csvQuote(r.label)},${nl}\n`;
  }
  const name = `${w.csid}2nuva_${today()}.csv`;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([out], { type: 'text/csv;charset=utf-8' }));
  a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast(`Exported ${name}` + (undecided ? ` - ${undecided} undecided code(s) written as #MISS (the format has no "not yet decided" value)` : ''));
}

/* ---------- Row status ---------- */

function status(r) {
  const n = r.current;
  if (!n) return 'undecided';
  if (n === '#NA') return 'na';
  if (n === '#MISS') return 'miss';
  return 'aligned';
}
function attention(r) {
  const n = r.current;
  if (!n || n.startsWith('#')) return null;
  const v = S.vaccines[n];
  if (!v) return `${n} does not exist in NUVA ${S.version}`;
  if (v.type === 'deprecated') return `${n} is deprecated in NUVA`;
  return null;
}
const changed = r => r.current !== r.imported;
const retired = r => r.code.startsWith(S.work.csid + '-#');

function inView(r, view) {
  switch (view) {
    case 'all': return true;
    case 'changed': return changed(r);
    case 'attention': return !!attention(r);
    default: return status(r) === view;
  }
}

function visibleRows() {
  if (!S.work) return [];
  const f = S.codeFilter.toUpperCase();
  return S.work.rows.filter(r => inView(r, S.view) && (!f ||
    r.code.toUpperCase().includes(f) || r.label.toUpperCase().includes(f) ||
    r.current.toUpperCase().includes(f) ||
    (S.vaccines[r.current]?.label || '').toUpperCase().includes(f)));
}
const rowOf = code => S.work?.rows.find(r => r.code === code);

/* ---------- Candidates ---------- */

// How a selected valence relates to one of an abstract vaccine's valences.
function relation(sel, v) {
  if (sel === v) return 'same';
  if ((S.lineage[v] || []).includes(sel)) return 'narrower';   // vaccine is more specific
  if ((S.lineage[sel] || []).includes(v)) return 'broader';    // vaccine is less specific
  return null;
}

function candidatesFromSelection() {
  if (!S.selected.length) return [];
  const rank = { same: 0, narrower: 1, broader: 2 };
  const out = [];
  for (const id in S.vaccines) {
    const vac = S.vaccines[id];
    if (vac.type !== 'abstract' || id === ORPHANS) continue;
    const vals = vac.valences || [];
    let ok = true, narrower = 0, broader = 0;
    const used = new Set();
    for (const s of S.selected) {
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
    const extra = vals.filter(v => !used.has(v) && !S.selected.some(s => relation(s, v)));
    const exact = !narrower && !broader && !extra.length && vals.length === S.selected.length;
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
  // Abstract before real, then simpler (fewer valences) before combinations.
  hits.sort((a, b) => (order[S.vaccines[a].type] - order[S.vaccines[b].type]) ||
    (valencesOf(a).length - valencesOf(b).length) || S.vaccines[a].label.localeCompare(S.vaccines[b].label));
  return hits;
}

/* ---------- Actions ---------- */

function selectCode(code) {
  S.cur = code;
  const r = rowOf(code);
  // Everything about the comparison is reset from the code itself - nothing carried over from the previous code.
  S.candidate = r && S.vaccines[r.current] ? r.current : null;
  S.selected = S.candidate ? [...valencesOf(S.candidate)] : [];
  S.vacSearch = '';
  revealSelected();
  persist();
  render();
  document.querySelector(`.code-row[data-code="${CSS.escape(code)}"]`)?.scrollIntoView({ block: 'nearest' });
}

function decide(value, how) {
  const r = rowOf(S.cur);
  if (!r) return;
  const prev = r.current;
  r.current = value;
  S.undo = { code: r.code, prev };
  persist();
  const shown = value || 'undecided';
  toast(`${r.code} ${how} ${shown}`, true);
  advance(r.code);
}

function advance(fromCode) {
  const rows = visibleRows();
  const all = S.work.rows;
  // Next row after the one just decided, in the current view; fall back to the full list
  // (the decided row may have just left the view, e.g. when working through "Undecided").
  let i = all.findIndex(r => r.code === fromCode);
  let next = null;
  for (let j = i + 1; j < all.length && !next; j++) if (rows.includes(all[j])) next = all[j];
  if (!next) next = rows.find(r => r.code !== fromCode) || null;
  if (next) selectCode(next.code); else { render() }
}

function doUndo() {
  if (!S.undo) return;
  const r = rowOf(S.undo.code);
  if (r) r.current = S.undo.prev;
  const code = S.undo.code;
  S.undo = null;
  hideToast();
  selectCode(code);
}

function toggleValence(id) {
  if (S.selected.includes(id)) S.selected = S.selected.filter(x => x !== id);
  else {
    // Same rule as the main editor: a selection is one coherent point per branch,
    // so ticking a valence drops its ancestors and descendants.
    S.selected = S.selected.filter(x => !(S.lineage[id] || []).includes(x) && !(S.lineage[x] || []).includes(id));
    S.selected.push(id);
  }
  const c = candidatesFromSelection();
  S.candidate = c.length && c[0].exact ? c[0].id : (S.candidate && c.some(x => x.id === abstractOf(S.candidate)) ? S.candidate : null);
  render();
}

// Picking a candidate leaves the ticked valences alone (so the list being explored stays put);
// the tree highlights the candidate's own valences instead.
function setCandidate(id) {
  S.candidate = id;
  for (const v of valencesOf(id)) for (const a of S.lineage[v] || []) S.open.add(a);
  render();
}

function revealSelected() {
  for (const s of S.selected) for (const a of S.lineage[s] || []) S.open.add(a);
}

/* ---------- Rendering ---------- */

function render() {
  renderSummary();
  renderViews();
  renderCodes();
  renderBench();
  renderTree();
}

function renderSummary() {
  const w = S.work;
  $('btnExport').disabled = !w;
  if (!w) { $('summary').innerHTML = ''; return }
  const c = { aligned: 0, na: 0, miss: 0, undecided: 0 };
  let ch = 0;
  for (const r of w.rows) { c[status(r)]++; if (changed(r)) ch++ }
  const total = w.rows.length;
  const done = total - c.undecided;
  $('summary').innerHTML = `
    <span class="csid">${esc(w.csid)}</span>
    <span class="meter" title="${done} of ${total} codes have a decision"><span style="width:${total ? 100 * done / total : 0}%"></span></span>
    <span>${total} codes</span>
    <span class="s-aligned">${c.aligned} aligned</span>
    <span class="s-miss">${c.miss} #MISS</span>
    <span class="s-na">${c.na} #NA</span>
    ${c.undecided ? `<span class="s-undecided">${c.undecided} undecided</span>` : ''}
    <span class="s-changed">${ch} changed since import</span>`;
}

function renderViews() {
  const w = S.work;
  $('codeViews').innerHTML = !w ? '' : VIEWS.map(([k, label]) => {
    const n = w.rows.filter(r => inView(r, k)).length;
    if (!n && k !== 'all' && k !== S.view) return '';
    return `<button type="button" class="view ${S.view === k ? 'on' : ''}" data-view="${k}">${label} <b>${n}</b></button>`;
  }).join('');
}

function badge(r) {
  const st = status(r);
  const warn = attention(r);
  const txt = st === 'undecided' ? '—' : r.current;
  return `<span class="badge b-${st}${warn ? ' b-warn' : ''}" title="${esc(warn || (S.vaccines[r.current]?.label ?? ''))}">${esc(txt)}${warn ? ' !' : ''}</span>`;
}

function renderCodes() {
  const list = $('codeList');
  if (!S.work) { list.innerHTML = '<p class="empty">No code system loaded.</p>'; return }
  const rows = visibleRows();
  list.innerHTML = rows.map(r => `
    <div class="code-row ${r.code === S.cur ? 'cur' : ''} ${changed(r) ? 'changed' : ''}" data-code="${esc(r.code)}">
      <div class="cr-main">
        <span class="cr-code">${esc(r.code)}${retired(r) ? ' <span class="tag-retired" title="Prefixed # in the source: no longer to be used">retired</span>' : ''}</span>
        <span class="cr-label">${esc(r.label) || '<i>no label</i>'}</span>
      </div>
      <div class="cr-side">${badge(r)}${changed(r) ? '<span class="dot" title="Changed since import"></span>' : ''}</div>
    </div>`).join('') || '<p class="empty">No codes in this view.</p>';
}

function vacTag(id) {
  const v = S.vaccines[id];
  const cls = !v ? 'missing' : v.type;
  return `<span class="vtag vt-${cls}" title="${esc(v ? v.label : 'Not in NUVA')}">${esc(id)}</span>`;
}

function renderBench() {
  const b = $('bench');
  if (!S.work) { b.innerHTML = emptyState(); return }
  const r = rowOf(S.cur);
  if (!r) { b.innerHTML = '<p class="empty big">Pick a code on the left to put it under the loupe.</p>'; return }

  const cand = S.candidate && S.vaccines[S.candidate] ? S.candidate : null;
  const cv = cand ? S.vaccines[cand] : null;
  const abs = cand ? abstractOf(cand) : null;
  const vals = cand ? valencesOf(cand) : [];
  const others = cand ? S.work.rows.filter(x => x.current === cand && x.code !== r.code) : [];
  const warn = attention(r);

  const source = `
    <div class="col col-src">
      <div class="col-head">${esc(S.work.csid)} code</div>
      <div class="big-code">${esc(r.code)}${retired(r) ? ' <span class="tag-retired">retired in source</span>' : ''}</div>
      <p class="desc">${esc(r.label) || '<i>No label in the file</i>'}</p>
      <dl class="facts">
        <dt>Now</dt><dd>${badge(r)} ${esc(S.vaccines[r.current]?.label ?? labelFor(r.current))}</dd>
        <dt>Imported</dt><dd>${r.imported ? esc(r.imported) : '<i>blank</i>'}${changed(r) ? ' <span class="chg">changed</span>' : ''}</dd>
      </dl>
      ${warn ? `<p class="warn">&#9888; ${esc(warn)}</p>` : ''}
    </div>`;

  const vaccineCol = cv ? `
    <div class="col col-vac">
      <div class="col-head">Candidate NUVA vaccine</div>
      <div class="big-code">${vacTag(cand)} <span class="vtype">${esc(cv.type)}</span></div>
      <p class="desc">${esc(cv.label)}</p>
      ${cv.comment ? `<p class="desc sub">${esc(cv.comment)}</p>` : ''}
      <dl class="facts">
        ${cv.type !== 'abstract' && abs ? `<dt>Instance of</dt><dd><a href="#" data-cand="${abs}">${esc(abs)}</a> ${esc(S.vaccines[abs]?.label)}</dd>` : ''}
        ${cv.type === 'abstract' ? `<dt>Products</dt><dd>${(S.instances[cand] || []).length} real vaccine(s)</dd>` : ''}
        <dt>Also used by</dt><dd>${others.length ? others.map(o => `<a href="#" data-code-link="${esc(o.code)}">${esc(o.code)}</a>`).join(', ') : '<i>no other code in this file</i>'}</dd>
      </dl>
    </div>` : `
    <div class="col col-vac placeholder">
      <div class="col-head">Candidate NUVA vaccine</div>
      <p>Nothing to compare yet.</p>
      <p class="sub">Tick valences in the tree on the right, or search vaccines by name below. The candidate you click lands here, next to the code's own description.</p>
    </div>`;

  const valCol = `
    <div class="col col-val">
      <div class="col-head">Its valences${abs && abs !== cand ? ` <span class="sub">(via ${esc(abs)})</span>` : ''}</div>
      ${vals.length ? vals.map(v => valCard(v)).join('') : `<p class="sub">${cv ? 'This vaccine has no valences recorded.' : '—'}</p>`}
    </div>`;

  const canAlign = !!cand && cv.type !== 'deprecated';
  const actions = `
    <div class="actions">
      <button type="button" class="primary" data-act="align" ${canAlign ? '' : 'disabled'} title="Enter">
        ${cand ? `Align ${esc(r.code)} &rarr; ${esc(cand)}` : 'Align (pick a candidate first)'}</button>
      <button type="button" data-act="miss" title="M">NUVA concept missing <code>#MISS</code></button>
      <button type="button" data-act="na" title="X">Out of scope <code>#NA</code></button>
      <button type="button" data-act="reset" ${changed(r) ? '' : 'disabled'} title="R">Back to imported</button>
      <button type="button" data-act="skip" class="ghost" title="&darr; / J">Skip &rarr;</button>
      <span class="keys">Enter align &middot; M missing &middot; X out of scope &middot; R reset &middot; &uarr;&darr; move</span>
    </div>`;

  b.innerHTML = `<div class="triptych">${source}${vaccineCol}${valCol}</div>${actions}${candidateList()}`;
}

function labelFor(n) { return n === '#NA' ? 'out of NUVA scope' : n === '#MISS' ? 'NUVA concept missing' : !n ? 'no decision yet' : '' }

function valCard(v) {
  const val = S.valences[v];
  if (!val) return `<div class="vcard"><b>${esc(v)}</b> <i>unknown valence</i></div>`;
  const tt = techType(v);
  const chain = [...(S.lineage[v] || [])].reverse().map(a => S.valences[a].shorthand).join(' › ');
  const inSel = S.selected.includes(v);
  return `<div class="vcard ${inSel ? 'insel' : ''}">
      <div><span class="sh">${esc(val.shorthand)}</span> <span class="vid">${esc(v)}</span></div>
      <div class="desc">${esc(norm(val.label))}</div>
      <div class="sub">${chain ? `under ${esc(chain)}` : 'top-level'}${tt ? ` &middot; ${esc(tt.label)}${tt.from ? ` (from ${esc(S.valences[tt.from].shorthand)})` : ''}` : ''}</div>
    </div>`;
}

function candidateList() {
  const sel = S.selected.map(v => `<span class="chip" title="${esc(norm(S.valences[v]?.label))}">${esc(S.valences[v]?.shorthand || v)}<button type="button" data-unsel="${esc(v)}" aria-label="Remove">&times;</button></span>`).join('');
  const fromSel = candidatesFromSelection();
  const fromText = vaccineSearch();
  const LIMIT = 40;

  const relText = c => c.exact ? '<span class="rel exact">exact valence combination</span>' : [
    c.extra.length ? `<span class="rel">+ ${c.extra.map(x => esc(S.valences[x]?.shorthand)).join(', ')}</span>` : '',
    c.narrower ? `<span class="rel">${c.narrower} more specific</span>` : '',
    c.broader ? `<span class="rel">${c.broader} less specific</span>` : ''
  ].join(' ');

  const candRow = (id, rel) => {
    const v = S.vaccines[id];
    const inst = S.instances[id] || [];
    return `<div class="cand ${id === S.candidate ? 'on' : ''}" data-cand="${id}">
        <div>${vacTag(id)} <span class="cand-label">${esc(v.label)}</span> ${rel || ''}</div>
        ${v.comment ? `<div class="sub">${esc(v.comment)}</div>` : ''}
        ${inst.length && id === abstractOf(S.candidate) ? `<div class="instances">${inst.map(i => `<a href="#" data-cand="${i}" class="${i === S.candidate ? 'on' : ''}" title="${esc(S.vaccines[i].comment || '')}">${esc(S.vaccines[i].label)} <span class="vid">${i}</span></a>`).join('')}</div>`
          : inst.length ? `<div class="sub">${inst.length} product(s) - click to show</div>` : ''}
      </div>`;
  };

  return `<div class="cands">
    <div class="cands-head">
      <div class="selrow"><span class="lbl">Ticked valences</span> ${sel || '<span class="sub">none - tick valences in the tree &rarr;</span>'} ${sel ? '<button type="button" class="ghost small" data-act="clearsel">clear</button>' : ''}</div>
      <input id="vacSearch" type="search" placeholder="…or search vaccines by name or description" value="${esc(S.vacSearch)}">
    </div>
    ${S.vacSearch ? `<div class="cands-sec">Vaccines matching “${esc(S.vacSearch)}” <b>${fromText.length}</b></div>
      ${fromText.slice(0, LIMIT).map(id => candRow(id, `<span class="rel">${esc(S.vaccines[id].type)}</span>`)).join('') || '<p class="sub">No vaccine matches.</p>'}
      ${fromText.length > LIMIT ? `<p class="sub">Showing ${LIMIT} of ${fromText.length}; refine the search.</p>` : ''}` : ''}
    ${S.selected.length ? `<div class="cands-sec">Vaccines carrying the ticked valences <b>${fromSel.length}</b></div>
      ${fromSel.slice(0, LIMIT).map(c => candRow(c.id, relText(c))).join('') || '<p class="sub">No abstract vaccine carries this combination. If it should exist, that is a <code>#MISS</code>.</p>'}
      ${fromSel.length > LIMIT ? `<p class="sub">Showing ${LIMIT} of ${fromSel.length}; tick more specific valences to narrow.</p>` : ''}` : ''}
  </div>`;
}

function renderTree() {
  const t = $('tree');
  if (!Object.keys(S.valences).length) { t.innerHTML = ''; return }
  const f = S.valFilter.toLowerCase().split(/\s+/).filter(Boolean);
  const matches = id => {
    const v = S.valences[id];
    const hay = `${id} ${v.shorthand} ${v.label}`.toLowerCase();
    return f.every(w => hay.includes(w));
  };
  // With a filter, show matches plus their ancestors (unfolded), like the main editor.
  let show = null;
  if (f.length) {
    show = new Set();
    for (const id in S.lineage) if (matches(id)) { show.add(id); for (const a of S.lineage[id]) show.add(a) }
  }
  const sel = new Set(S.selected);
  const candVals = new Set(S.candidate ? valencesOf(S.candidate) : []);
  const node = id => {
    if (show && !show.has(id)) return '';
    const v = S.valences[id];
    const kids = S.children[id] || [];
    const open = show ? true : S.open.has(id);
    const d = S.diff[id];
    const hasSelBelow = !open && kids.length && S.selected.some(s => (S.lineage[s] || []).includes(id));
    return `<li class="${id === 'VAL000' ? 'dim' : ''}">
      <div class="tn ${sel.has(id) ? 'sel' : ''} ${candVals.has(id) ? 'incand' : ''} ${show && matches(id) ? 'hit' : ''}" data-val="${id}"
           title="${esc(id)} - ${esc(norm(v.label))}${techType(id) ? '\nType: ' + esc(techType(id).label) : ''}">
        <span class="tw">${kids.length ? `<button type="button" class="fold" data-fold="${id}" aria-label="${open ? 'Fold' : 'Unfold'}">${open ? '▾' : '▸'}</button>` : ''}</span>
        <input type="checkbox" data-tick="${id}" ${sel.has(id) ? 'checked' : ''} aria-label="Tick ${esc(v.shorthand)}">
        <span class="sh">${esc(v.shorthand)}</span>
        <span class="dd ${d.derived ? 'derived' : ''}">${esc(d.text)}</span>
        ${hasSelBelow ? '<span class="below" title="A ticked valence is folded inside">●</span>' : ''}
      </div>
      ${kids.length && open ? `<ul>${kids.map(node).join('')}</ul>` : ''}
    </li>`;
  };
  const html = (S.children[ROOT] || []).map(node).join('');
  t.innerHTML = html ? `<ul>${html}</ul>` : '<p class="empty">No valence matches.</p>';
}

function emptyState() {
  return `<div class="welcome">
    <h2>Bring in a code system</h2>
    <p>Import an alignment CSV - an existing one to review, or a raw list of codes (column 2 left blank) to align from scratch.
       The same file format as the main editor: <code>CSID-code, NUVA code, "code label", "NUVA label"</code>, header row starting with the code system identifier.</p>
    <p><button type="button" class="primary" data-act="import">Import alignment CSV…</button></p>
    <p class="sub">Or try it with a sample:</p>
    <p>
      <button type="button" data-sample="samples/CVX2nuva.csv">CVX - as published (review)</button>
      <button type="button" data-sample="samples/CVX-unaligned.csv">CVX - NUVA column blanked (align from scratch)</button>
    </p>
    <p class="sub">Your work stays in this browser until you export it. Nothing is sent anywhere.</p>
  </div>`;
}

/* ---------- Toast & dialog ---------- */

let toastTimer = null;
function toast(msg, withUndo) {
  const t = $('toast');
  t.innerHTML = esc(msg) + (withUndo && S.undo ? ' <button type="button" data-act="undo">Undo</button>' : '');
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, withUndo ? 6000 : 8000);
}
function hideToast() { $('toast').hidden = true }

let dialogDone = null;
function ask(msg) {
  return new Promise(resolve => {
    const d = $('dialog');
    $('dialogMsg').textContent = msg;
    dialogDone = ok => { d.hidden = true; d.onclick = null; dialogDone = null; resolve(ok) };
    d.onclick = e => {
      const b = e.target.closest('button');
      if (b) dialogDone(b.value === 'ok'); else if (e.target === d) dialogDone(false);
    };
    d.hidden = false;
    $('dialogOk').focus();
  });
}

/* ---------- Import ---------- */

async function importText(text, fileName) {
  let w;
  try { w = parseAlignment(text, fileName) } catch (e) { toast('Import failed: ' + e.message); return }
  if (S.work) {
    const n = S.work.rows.filter(changed).length;
    const ok = await ask(`Replace the ${S.work.csid} work in progress with ${w.csid} (${w.rows.length} codes)?` +
      (n ? ` Its ${n} change(s) since import will be lost unless you have exported them.` : ''));
    if (!ok) return;
  }
  const notes = w.notes; delete w.notes;
  S.work = w; S.view = 'all'; S.codeFilter = ''; $('codeFilter').value = ''; S.undo = null;
  const first = w.rows.find(r => !r.current) || w.rows[0];
  if (first) selectCode(first.code); else { persist(); render() }
  const extra = [
    notes.prefixed && `${notes.prefixed} code(s) given the ${w.csid}- prefix`,
    notes.coerced && `${notes.coerced} unrecognized NUVA value(s) read as #MISS`,
    notes.misSpelling && `${notes.misSpelling} "#MIS" read as #MISS`,
    notes.duplicates && `${notes.duplicates} duplicate code(s) skipped`].filter(Boolean);
  toast(`Imported ${w.rows.length} ${w.csid} codes` + (extra.length ? ' - ' + extra.join('; ') : ''));
}

/* ---------- Events ---------- */

function wire() {
  $('btnImport').onclick = () => $('fileInput').click();
  $('btnExport').onclick = exportAlignment;
  $('fileInput').onchange = e => {
    const f = e.target.files[0];
    if (!f) return;
    f.text().then(t => importText(t, f.name));
    e.target.value = '';
  };
  $('codeFilter').oninput = e => { S.codeFilter = e.target.value; renderCodes() };
  $('valFilter').oninput = e => { S.valFilter = e.target.value; renderTree() };

  document.addEventListener('click', e => {
    const el = e.target.closest('[data-view],[data-code],[data-act],[data-cand],[data-code-link],[data-unsel],[data-fold],[data-tick],[data-val],[data-sample]');
    if (!el) return;
    const d = el.dataset;
    if (d.view) { S.view = d.view; render(); return }
    if (d.sample) { fetch(d.sample).then(r => r.text()).then(t => importText(t, d.sample)); return }
    if (d.codeLink) { e.preventDefault(); selectCode(d.codeLink); return }
    if (d.code) { selectCode(d.code); return }
    if (d.unsel) { toggleValence(d.unsel); return }
    if (d.fold) { S.open.has(d.fold) ? S.open.delete(d.fold) : S.open.add(d.fold); renderTree(); return }
    if (d.tick) { toggleValence(d.tick); return }
    if (d.cand) { e.preventDefault(); setCandidate(d.cand); return }
    if (d.val) {
      // Clicking the text of a line folds/unfolds it, or ticks a leaf.
      const kids = S.children[d.val];
      if (kids && kids.length && !S.valFilter) { S.open.has(d.val) ? S.open.delete(d.val) : S.open.add(d.val); renderTree() }
      else toggleValence(d.val);
      return;
    }
    if (d.act) act(d.act);
  });

  document.addEventListener('input', e => {
    if (e.target.id === 'vacSearch') {
      S.vacSearch = e.target.value;
      const pos = e.target.selectionStart;
      renderBench();
      const s = $('vacSearch'); s.focus(); s.setSelectionRange(pos, pos);
    }
  });

  document.addEventListener('keydown', e => {
    if (dialogDone) { if (e.key === 'Escape') dialogDone(false); return }
    if (e.target.matches('input, textarea, select')) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key;
    if (k === 'ArrowDown' || k === 'j') { move(1); e.preventDefault() }
    else if (k === 'ArrowUp' || k === 'k') { move(-1); e.preventDefault() }
    else if (k === 'Enter' && !e.target.matches('button, a')) act('align');
    else if (k === 'm' || k === 'M') act('miss');
    else if (k === 'x' || k === 'X') act('na');
    else if (k === 'r' || k === 'R') act('reset');
    else if (k === 'z' && S.undo) doUndo();
  });
}

function move(delta) {
  const rows = visibleRows();
  if (!rows.length) return;
  const i = rows.findIndex(r => r.code === S.cur);
  const n = rows[Math.max(0, Math.min(rows.length - 1, i + delta))];
  if (n && n.code !== S.cur) selectCode(n.code);
}

function act(a) {
  const r = rowOf(S.cur);
  switch (a) {
    case 'import': $('fileInput').click(); return;
    case 'undo': doUndo(); return;
    case 'clearsel': S.selected = []; render(); return;
  }
  if (!r) return;
  switch (a) {
    case 'align': {
      const v = S.vaccines[S.candidate];
      if (!v || v.type === 'deprecated') return;
      decide(S.candidate, '→'); return;
    }
    case 'miss': decide('#MISS', '→'); return;
    case 'na': decide('#NA', '→'); return;
    case 'reset': if (changed(r)) decide(r.imported, 'back to'); return;
    case 'skip': move(1); return;
  }
}

/* ---------- Start ---------- */

function start() {
  wire();
  $('bench').innerHTML = '<p class="empty big">Loading NUVA data…</p>';
  fetch(DATA_URL)
    .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
    .then(data => {
      buildIndexes(data);
      $('dataVersion').textContent = `NUVA data ${S.version}`;
      const saved = load(STORE_KEY);
      if (saved && saved.rows) {
        S.cur = saved.cur; delete saved.cur; delete saved.savedAt;
        S.work = saved;
        if (rowOf(S.cur)) { selectCode(S.cur); return }
      }
      render();
    })
    .catch(err => {
      $('bench').innerHTML = `<div class="welcome"><h2>Could not load the NUVA data</h2>
        <p>${esc(err.message)}</p>
        <p>Loupe reads <code>${DATA_URL}</code>. Browsers block that when the page is opened as a <code>file://</code> URL -
        serve the <code>docs/</code> folder over HTTP instead (see README.md).</p></div>`;
    });
}

start();
