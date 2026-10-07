/* Quilt - triage-the-whole-code-system NUVA alignment prototype.
 *
 * The whole code system is laid out as a quilt: one block per disease, blocks ordered
 * most common first, one patch per code. Patches are "sewn in" (aligned), left as a
 * "hole" (#MISS, NUVA is missing something), "cut out" (#NA, out of scope), or still
 * "bare" (no decision yet). Holes can be written up as requests for new NUVA content,
 * exported as a request package file alongside the standard alignment CSV.
 *
 * Self-contained: reads the published NUVA data (../data/nuvadata.json), keeps work in
 * localStorage under its own "quilt." keys so it never touches the main editor's
 * vaccines/valences/CSData/context keys on the same origin.
 */
'use strict';

const DATA_URL = '../data/nuvadata.json';
const STORE_KEY = 'quilt.work.v1';
const ROOT = 'Valence';
const ORPHANS = 'VAC0000';
const RE_VAC = /^VAC\d{4}$/;
const PACKAGE_FORMAT = 'nuva-content-request-package';
const PACKAGE_VERSION = '0.1';

/* ---------- Diseases and priority tiers ----------
 * NUVA has no disease concept and no notion of "common", so both are proposed here.
 * A disease is one or more top-level valence families (the antigen tree's roots).
 * Tier 1 roughly follows the WHO routine-immunization recommendations for everyone;
 * tier 2 is regional or risk-group vaccination; everything else is the long tail.
 * Within a tier, blocks are ordered by how many NUVA vaccines carry that disease.
 * The `re` patterns only sort unaligned codes into blocks by their label words;
 * they never decide an alignment. */
const TIERS = {
  1: { name: 'Everyday', plain: 'routine for everyone' },
  2: { name: 'Regional & risk', plain: 'travel, region or risk group' },
  3: { name: 'Long tail', plain: 'rare or specialised' },
  4: { name: 'Odds & ends', plain: 'no disease recognised' }
};
const DISEASES = [
  ['diph', 'Diphtheria', 1, ['VAL414'], /diphther|diphtéri|corynebacterium|\bdt(a?p)?\b|\bdtp|\btdap\b|\btd\b/],
  ['tet', 'Tetanus', 1, ['VAL067', 'VAL110'], /tetanus|tétan|tetaniq|clostridium tetani|\bdt(a?p)?\b|\bdtp|\btdap\b|\btd\b|\btig\b/],
  ['pert', 'Pertussis', 1, ['VAL003'], /pertussis|coqueluch|bordetella|\bdta?p|\btdap\b/],
  ['polio', 'Polio', 1, ['VAL042'], /polio|\bipv\b|\bopv\b|\bbopv\b/],
  ['hib', 'Hib', 1, ['VAL177'], /haemophilus|\bhib\b/],
  ['hepb', 'Hepatitis B', 1, ['VAL068', 'VAL047'], /hépatite b|hepatitis b\b|\bhep ?b\b|\bhbig\b/],
  ['meas', 'Measles', 1, ['VAL182'], /measles|rougeole|morbillivirus|\bmmr/],
  ['mumps', 'Mumps', 1, ['VAL183'], /mumps|oreillons|\bmmr/],
  ['rub', 'Rubella', 1, ['VAL079'], /rubella|rubéole|\bmmr/],
  ['tb', 'Tuberculosis (BCG)', 1, ['VAL096'], /\bbcg\b|calmette|tubercul|mycobacterium bovis/],
  ['pneumo', 'Pneumococcal', 1, ['VAL105'], /pneumococ|pneumocoq|streptococcus pneumoniae|\bpcv\d*|\bppsv/],
  ['rota', 'Rotavirus', 1, ['VAL106'], /rota ?virus/],
  ['hpv', 'HPV', 1, ['VAL082'], /papilloma|\bhpv/],
  ['flu', 'Influenza', 1, ['VAL128', 'VAL386'], /\binfluenza\b|grippe|grippal|\bflu\b|\bh1n1|\bh5n1|\blaiv\b/],
  ['covid', 'COVID-19', 1, ['VAL157'], /covid|sars-cov|coronavirus 2/],
  ['var', 'Varicella', 1, ['VAL044', 'VAL088'], /varicella|varicelle|chickenpox|\bmmrv|\bvzig\b|alphaherpesvirus 3/],
  ['hepa', 'Hepatitis A', 2, ['VAL288'], /hépatite a|hepatitis a\b|\bhep ?a\b/],
  ['men', 'Meningococcal', 2, ['VAL234'], /mening|méning/],
  ['typh', 'Typhoid', 2, ['VAL014'], /typhoid|typho|typhi\b/],
  ['yf', 'Yellow fever', 2, ['VAL092'], /yellow fever|fièvre jaune|amaril/],
  ['je', 'Japanese encephalitis', 2, ['VAL249'], /japanese encephalitis|encephalitis, japanese|encéphalite japonaise/],
  ['rab', 'Rabies', 2, ['VAL080', 'VAL016'], /rabies|rabique|lyssavirus/],
  ['tbe', 'Tick-borne encephalitis', 2, ['VAL031'], /tick[- ]borne|tiques/],
  ['chol', 'Cholera', 2, ['VAL081'], /cholera/],
  ['zos', 'Shingles', 2, ['VAL160'], /zoster(?! immune)|shingles|\bzona\b/],
  ['rsv', 'RSV', 2, ['VAL338'], /respiratory syncytial|\brsv\b/],
  ['den', 'Dengue', 2, ['VAL150'], /dengue/],
  ['mal', 'Malaria', 2, ['VAL025'], /malaria|plasmodium/],
  ['ebola', 'Ebola', 2, ['VAL126'], /ebola/],
  ['pox', 'Smallpox & mpox', 2, ['VAL418'], /smallpox|variole|vaccinia|variola|mpox|monkeypox/],
  ['chik', 'Chikungunya', 2, ['VAL390'], /chikungunya/],
  // Long tail: only the families whose generated keyword (their label up to "valence") wouldn't match labels well.
  ['anthrax', 'Anthrax', 3, ['VAL340'], /anthrax|anthracis/],
  ['plague', 'Plague', 3, ['VAL422'], /plague|yersinia pestis/],
  ['lyme', 'Lyme disease', 3, ['VAL339'], /lyme|borrelia/],
  ['bot', 'Botulism', 3, ['VAL419'], /botul/],
  ['qfev', 'Q fever', 3, ['VAL172'], /q fever|coxiella/],
  ['hiv', 'HIV', 3, ['VAL333'], /immunodeficiency virus|\bhiv\b/],
  ['junin', 'Argentine hemorrhagic fever', 3, ['VAL421'], /argentin|junin/],
  ['cmv', 'CMV', 3, ['VAL331'], /cytomegalovirus|\bcmv\b/],
  ['adeno', 'Adenovirus', 3, ['VAL278'], /adenovirus/],
  ['leish', 'Leishmaniasis', 3, ['VAL175'], /leishmani/],
  ['hpiv', 'Parainfluenza', 3, ['VAL176'], /parainfluenza/],
  ['spyo', 'Strep A (rheumatic fever)', 3, ['VAL335'], /rheumatic|pyogenes|group a strep/],
  ['lepto', 'Leptospirosis', 3, ['VAL448'], /leptospir/]
];

const STATUS = {
  bare: { name: 'Not decided', theme: 'bare' },
  aligned: { name: 'Aligned', theme: 'sewn in' },
  miss: { name: 'Missing in NUVA', theme: 'hole', code: '#MISS' },
  na: { name: 'Out of scope', theme: 'cut out', code: '#NA' }
};
const VIEWS = [
  ['all', 'All codes'], ['bare', 'Not decided'], ['notaligned', 'Not aligned yet'], ['miss', 'Missing in NUVA #MISS'],
  ['na', 'Out of scope #NA'], ['aligned', 'Aligned'], ['attention', 'Needs attention'], ['changed', 'Changed']
];
const STOP = new Set('vaccine vaccines virus valent unspecified formulation with and for the from type types live dose doses injection intramuscular product products combined conjugate toxoid toxoids adsorbed preservative free suspension adult pediatric pediatrics only non-us code retired'.split(' '));

const S = {
  version: null, vaccines: {}, valences: {},
  children: {}, lineage: {}, diff: {}, usage: {}, descendants: {}, instances: {},
  diseases: {}, famDisease: {}, diseaseVacCount: {}, brands: {},
  work: null,          // { csid, fileName, importedAt, rows: [{code, label, imported, current}], requests: [], nextReq }
  search: '', view: 'all', tiers: new Set([1, 2, 3, 4]), hideDone: false, focus: null,
  cur: null, mode: 'antigens', picked: [], candidate: null, valSearch: '', vacSearch: '',
  open: new Set(), allFamilies: false, missForm: false,
  undo: null
};

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const today = () => new Date().toISOString().slice(0, 10);
const norm = s => String(s ?? '').replace(/\s+/g, ' ').trim();
// Rounded down, so the figure only reads 0% or 100% when it really is.
const pct = (n, total) => !total ? 0 : n && n < total ? Math.min(99, Math.max(1, Math.floor(100 * n / total))) : Math.round(100 * n / total);
const byCode = (a, b) => a.code.localeCompare(b.code, 'en', { numeric: true });

/* ---------- Storage ---------- */

function store(key, value) {
  try { value == null ? localStorage.removeItem(key) : localStorage.setItem(key, JSON.stringify(value)) } catch (e) { /* storage unavailable: work stays in memory */ }
}
function load(key) {
  try { return JSON.parse(localStorage.getItem(key)) } catch (e) { return null }
}
function persist() {
  store(STORE_KEY, S.work ? { ...S.work, savedAt: new Date().toISOString() } : null);
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
  for (const k in S.children) S.children[k].sort((a, b) => S.valences[a].shorthand.localeCompare(S.valences[b].shorthand));
  S.children[ROOT].sort((a, b) => familyName(a).localeCompare(familyName(b)));
  for (const id in S.valences) {
    if (id === ROOT) continue;
    const line = [];
    let p = S.valences[id].parent;
    while (p && p !== ROOT && S.valences[p] && !line.includes(p)) { line.push(p); p = S.valences[p].parent }
    S.lineage[id] = line;
    S.diff[id] = differential(id);
    for (const a of line) S.descendants[a] = (S.descendants[a] || 0) + 1;
  }
  for (const id in S.vaccines) {
    const v = S.vaccines[id];
    if (v.type !== 'abstract' && v.instanceOf) (S.instances[v.instanceOf] ||= []).push(id);
    if (v.type === 'abstract' && id !== ORPHANS) {
      const seen = new Set();
      for (const val of v.valences || []) for (const a of [val, ...(S.lineage[val] || [])]) seen.add(a);
      for (const a of seen) S.usage[a] = (S.usage[a] || 0) + 1;
    }
  }
  buildDiseases();
}

function familyName(fam) {
  return norm(S.valences[fam]?.label).replace(/\s+valence\b.*$/i, '');
}
function familyOf(val) {
  const line = S.lineage[val];
  return line && line.length ? line[line.length - 1] : val;
}

function buildDiseases() {
  for (const [key, name, tier, families, re] of DISEASES) {
    S.diseases[key] = { key, name, tier, families, re };
    for (const f of families) S.famDisease[f] = key;
  }
  // Every other valence family becomes its own long-tail disease, recognised by its own name.
  for (const fam of S.children[ROOT] || []) {
    if (S.famDisease[fam] || fam === 'VAL000') continue;
    const name = familyName(fam);
    const word = name.split(' (')[0].toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    S.diseases[fam] = { key: fam, name, tier: 3, families: [fam], re: new RegExp(word) };
    S.famDisease[fam] = fam;
  }
  // How many NUVA vaccines (abstract and products) carry each disease: the "most common first" order within a tier.
  for (const id in S.vaccines) for (const d of diseasesOfVaccine(id)) S.diseaseVacCount[d] = (S.diseaseVacCount[d] || 0) + 1;
  buildBrandIndex();
}

// Short "how this differs from its parent" text, derived from the labels (as in Loupe).
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

function abstractOf(vac) {
  const v = S.vaccines[vac];
  if (!v) return null;
  return v.type === 'abstract' ? vac : v.instanceOf || null;
}
function valencesOf(vac) {
  const a = abstractOf(vac);
  return (a && S.vaccines[a]?.valences) || [];
}
function diseasesOfVaccine(vac) {
  const out = new Set();
  for (const v of valencesOf(vac)) { const d = S.famDisease[familyOf(v)]; if (d) out.add(d) }
  return out;
}
// A carrier protein ("diphtheria toxoid conjugate", "CRM197") is not a disease the vaccine protects against.
const CARRIER = /\b(diphtheria|tetanus)( toxoid)?( protein)? (conjugate|carrier)|\bcrm[- ]?197\b/g;
const brandWord = s => (norm(s).toLowerCase().replace(/^(vaccin|vaccine)s? /, '').match(/^[a-zà-ÿ][a-zà-ÿ0-9-]{3,}/) || [])[0];

// Brand names (first word of NUVA product labels, e.g. "Hiberix", "Dukoral") -> the diseases most of those products cover.
function buildBrandIndex() {
  const tally = {};
  for (const id in S.vaccines) {
    const v = S.vaccines[id];
    if (v.type === 'abstract') continue;
    const w = brandWord(v.label);
    const ds = [...diseasesOfVaccine(id)].sort().join('+');
    if (!w || !ds || STOP.has(w)) continue;
    (tally[w] ||= {})[ds] = (tally[w][ds] || 0) + 1;
  }
  S.brands = {};
  for (const w in tally) S.brands[w] = Object.entries(tally[w]).sort((a, b) => b[1] - a[1])[0][0].split('+');
}

function guessDiseases(label) {
  const l = norm(label).toLowerCase().replace(CARRIER, ' ');
  const out = new Set();
  if (!l) return out;
  for (const k in S.diseases) if (S.diseases[k].re.test(l)) out.add(k);
  if (!out.size) for (const d of S.brands[brandWord(l)] || []) out.add(d);
  return out;
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
    // Labels are only trimmed, never re-spaced, so they round-trip exactly.
    out.push({ code, label: (r[2] || '').trim(), imported: nuva, current: nuva });
  }
  return { csid, fileName, importedAt: new Date().toISOString(), rows: out, requests: [], nextReq: 1, notes };
}

function csvQuote(s) { return '"' + String(s ?? '').replace(/"/g, '""') + '"' }

// The standard alignment file and nothing else. Undecided codes go out as #MISS.
function buildCSV(work) {
  let undecided = 0;
  let out = '﻿' + `${work.csid},NUVA,${work.csid} label, NUVA label\n`;
  for (const r of work.rows) {
    let nuva = r.current;
    if (!nuva) { nuva = '#MISS'; undecided++ }
    const nl = S.vaccines[nuva] ? csvQuote(S.vaccines[nuva].label) : '';
    out += `${r.code},${nuva},${csvQuote(r.label)},${nl}\n`;
  }
  return { text: out, undecided, name: `${work.csid}2nuva_${today()}.csv` };
}

/* ---------- Request package (a new file, proposed by this prototype) ---------- */

function buildPackage(work) {
  const rowMap = new Map(work.rows.map(r => [r.code, r]));
  const inRequest = new Set(work.requests.flatMap(q => q.codes));
  return {
    format: PACKAGE_FORMAT,
    formatVersion: PACKAGE_VERSION,
    createdAt: new Date().toISOString(),
    createdWith: 'NUVA alignment prototype "Quilt"',
    nuvaVersion: S.version,
    codeSystem: { id: work.csid, alignmentFile: buildCSV(work).name, codes: work.rows.length },
    submitter: { ...(work.submitter || { name: '', organization: '', contact: '' }) },
    requests: work.requests.map(q => ({
      id: q.id,
      kind: q.kind,
      title: q.title,
      existingValences: q.valences.map(v => ({ id: v, shorthand: S.valences[v]?.shorthand || '', label: norm(S.valences[v]?.label) })),
      missing: q.missing,
      rationale: q.why,
      references: q.refs.split(/\n+/).map(norm).filter(Boolean),
      codes: q.codes.map(c => ({ code: c, label: rowMap.get(c)?.label || '', inAlignmentFileAs: rowMap.get(c)?.current || '#MISS' })),
      createdAt: q.createdAt
    })),
    // Every #MISS code not covered by a request, so nothing missing from NUVA is silently left out.
    notYetDescribed: work.rows.filter(r => r.current === '#MISS' && !inRequest.has(r.code)).map(r => ({ code: r.code, label: r.label })),
    // Codes with no decision yet: written as #MISS in the alignment file, but not claimed to be missing from NUVA.
    undecided: work.rows.filter(r => !r.current).length
  };
}

const KIND = {
  'new-vaccine': 'A vaccine that combines antigens NUVA already has',
  'new-valence': 'An antigen (valence) NUVA does not have',
  'unsure': 'Not sure yet'
};

function packageText(pkg) {
  const L = [];
  L.push(`Requests for new NUVA content - ${pkg.codeSystem.id}`, `NUVA data version ${pkg.nuvaVersion}, prepared ${pkg.createdAt.slice(0, 10)}`);
  const s = pkg.submitter;
  if (s.name || s.organization || s.contact) L.push(`From: ${[s.name, s.organization, s.contact].filter(Boolean).join(', ')}`);
  L.push('');
  for (const q of pkg.requests) {
    L.push(`${q.id}. ${q.title}`, `   Kind: ${KIND[q.kind] || q.kind}`);
    if (q.existingValences.length) L.push(`   Uses existing valences: ${q.existingValences.map(v => `${v.id} ${v.shorthand}`).join(', ')}`);
    if (q.missing) L.push(`   What's missing: ${q.missing}`);
    if (q.rationale) L.push(`   Why: ${q.rationale}`);
    for (const r of q.references) L.push(`   Ref: ${r}`);
    L.push(`   Codes waiting on it (${q.codes.length}):`);
    for (const c of q.codes) L.push(`     ${c.code}  ${c.label}`);
    L.push('');
  }
  if (pkg.notYetDescribed.length) {
    L.push(`Also marked missing in NUVA (#MISS), with no request yet (${pkg.notYetDescribed.length}):`);
    for (const c of pkg.notYetDescribed) L.push(`   ${c.code}  ${c.label}`);
  }
  if (pkg.undecided) L.push('', `${pkg.undecided} code(s) not looked at yet.`);
  return L.join('\n');
}

/* ---------- Rows, statuses, blocks ---------- */

function status(r) {
  const n = r.current;
  if (!n) return 'bare';
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
const rowOf = code => S.work?.rows.find(r => r.code === code);

function inView(r, view) {
  switch (view) {
    case 'all': return true;
    case 'notaligned': return !r.current || r.current === '#MISS';
    case 'changed': return changed(r);
    case 'attention': return !!attention(r);
    default: return status(r) === view;
  }
}
function matchesSearch(r) {
  const words = S.search.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const hay = `${r.code} ${r.label} ${r.current} ${S.vaccines[r.current]?.label || ''}`.toLowerCase();
  return words.every(w => hay.includes(w));
}

// Where a code sits in the quilt: by its mapping's valences when it has one, otherwise by its label words.
function placement(r) {
  let keys = null, how = 'label';
  if (S.vaccines[r.current] && valencesOf(r.current).length) { keys = diseasesOfVaccine(r.current); how = 'mapping' }
  if (!keys || !keys.size) { keys = guessDiseases(r.label); how = 'label' }
  const list = [...keys];
  const block = !list.length ? 'unsorted' : list.length === 1 ? list[0] : 'combo';
  return { block, diseases: list, how };
}

function blockMeta(key) {
  if (key === 'combo') return { key, name: 'Combinations', tier: 1, note: 'codes covering more than one disease' };
  if (key === 'unsorted') return { key, name: 'Odds & ends', tier: 4, note: 'no disease recognised in the label' };
  const d = S.diseases[key];
  return { key, name: d.name, tier: d.tier, note: '' };
}

function blocks() {
  const map = new Map();
  for (const r of S.work.rows) {
    const p = placement(r);
    if (!map.has(p.block)) map.set(p.block, { ...blockMeta(p.block), rows: [] });
    map.get(p.block).rows.push({ r, p });
  }
  const list = [...map.values()];
  for (const b of list) {
    b.rows.sort((x, y) => b.key === 'combo'
      ? x.p.diseases.join().localeCompare(y.p.diseases.join()) || byCode(x.r, y.r)
      : byCode(x.r, y.r));
    b.count = { bare: 0, aligned: 0, miss: 0, na: 0 };
    for (const { r } of b.rows) b.count[status(r)]++;
    b.done = !b.count.bare;
    b.weight = b.key === 'combo' ? Infinity : (S.diseaseVacCount[b.key] || 0);
  }
  list.sort((a, b) => (a.tier - b.tier) || (b.weight - a.weight) || a.name.localeCompare(b.name));
  return list;
}

function blockOfCode(code) {
  const r = rowOf(code);
  return r ? placement(r).block : null;
}

/* ---------- Candidates ---------- */

function relation(sel, v) {
  if (sel === v) return 'same';
  if ((S.lineage[v] || []).includes(sel)) return 'narrower';
  if ((S.lineage[sel] || []).includes(v)) return 'broader';
  return null;
}

// Same ranking as Loupe: exact combination first, then extra, more specific or less specific valences.
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

function vaccineSearch(products) {
  const words = S.vacSearch.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const hits = [];
  for (const id in S.vaccines) {
    const v = S.vaccines[id];
    if (id === ORPHANS || (products ? v.type === 'abstract' : v.type !== 'abstract')) continue;
    const hay = `${id} ${v.label} ${v.comment || ''}`.toLowerCase();
    if (words.every(w => hay.includes(w))) hits.push(id);
  }
  hits.sort((a, b) => ((S.vaccines[a].type === 'deprecated') - (S.vaccines[b].type === 'deprecated')) ||
    (valencesOf(a).length - valencesOf(b).length) || S.vaccines[a].label.localeCompare(S.vaccines[b].label));
  return hits;
}

function valenceSearch() {
  const words = S.valSearch.toLowerCase().split(/\s+/).filter(Boolean);
  const out = [];
  for (const id in S.lineage) {
    const v = S.valences[id];
    const hay = `${id} ${v.shorthand} ${v.label}`.toLowerCase();
    if (words.every(w => hay.includes(w))) out.push(id);
  }
  return out;
}

/* ---------- Actions ---------- */

function snapshot(msg, codes) {
  S.undo = {
    msg, rows: codes.map(c => [c, rowOf(c).current]),
    requests: JSON.stringify(S.work.requests), nextReq: S.work.nextReq
  };
}

function doUndo() {
  const u = S.undo;
  if (!u) return;
  for (const [c, prev] of u.rows) { const r = rowOf(c); if (r) r.current = prev }
  S.work.requests = JSON.parse(u.requests);
  S.work.nextReq = u.nextReq;
  S.undo = null;
  S.missForm = false;
  persist();
  hideToast();
  if (u.rows.length === 1) openCode(u.rows[0][0]); else render();
}

// Writing a value never carries a vaccine over from an earlier code: the candidate is reset in openCode().
function setValue(code, value) {
  const r = rowOf(code);
  r.current = value;
  if (value !== '#MISS') for (const q of S.work.requests) q.codes = q.codes.filter(c => c !== code);
}

function decide(value) {
  const r = rowOf(S.cur);
  if (!r) return;
  const block = blockOfCode(r.code);
  snapshot(`${r.code}`, [r.code]);
  setValue(r.code, value);
  persist();
  pop(r.code);
  if (value === '#MISS') {
    // Offer to describe what's missing before moving on; skipping is fine.
    S.missForm = true;
    toast(`${r.code} → #MISS (missing in NUVA)`, true);
    render();
    return;
  }
  toast(`${r.code} → ${value || 'not decided'}`, true);
  advance(r.code, block);
}

function advance(fromCode, block) {
  S.missForm = false;
  const b = blocks().find(x => x.key === block);
  const rows = b ? b.rows.map(x => x.r) : [];
  const i = rows.findIndex(r => r.code === fromCode);
  const order = [...rows.slice(i + 1), ...rows.slice(0, Math.max(i, 0))].filter(r => r.code !== fromCode);
  const next = order.find(r => !r.current);
  if (next) { openCode(next.code); return }
  closeTable();
  toast(b ? `Block “${b.name}” has no undecided codes left.` : 'Done.', true);
}

function stepInBlock(delta) {
  const b = blocks().find(x => x.key === blockOfCode(S.cur));
  if (!b) return;
  const rows = b.rows.map(x => x.r);
  const i = rows.findIndex(r => r.code === S.cur);
  const n = rows[(i + delta + rows.length) % rows.length];
  if (n) openCode(n.code);
}

function openCode(code) {
  const r = rowOf(code);
  if (!r) return;
  S.cur = code;
  S.missForm = false;
  // The comparison is rebuilt from this code alone.
  S.candidate = S.vaccines[r.current] ? r.current : null;
  S.picked = S.candidate ? [...valencesOf(S.candidate)] : [];
  S.valSearch = ''; S.vacSearch = ''; S.allFamilies = false;
  S.open = new Set();
  for (const v of S.picked) for (const a of S.lineage[v] || []) S.open.add(a);
  render();
  document.querySelector(`.patch[data-code="${CSS.escape(code)}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  $('table').querySelector('.t-scroll')?.scrollTo(0, 0);
}

function closeTable() {
  S.cur = null; S.missForm = false;
  render();
}

function pick(id) {
  if (S.picked.includes(id)) S.picked = S.picked.filter(x => x !== id);
  else {
    // One coherent point per branch: picking a valence drops its ancestors and descendants.
    S.picked = S.picked.filter(x => !(S.lineage[id] || []).includes(x) && !(S.lineage[x] || []).includes(id));
    S.picked.push(id);
    for (const a of S.lineage[id] || []) S.open.add(a);
  }
  const c = candidatesFromPicked();
  S.candidate = c.length && c[0].exact ? c[0].id : (S.candidate && c.some(x => x.id === abstractOf(S.candidate)) ? S.candidate : null);
  renderTable();
}

async function batch(blockKey, value) {
  const b = blocks().find(x => x.key === blockKey);
  const bare = b.rows.map(x => x.r).filter(r => !r.current);
  if (!bare.length) return;
  const what = value === '#NA' ? 'Out of scope (#NA)' : 'Missing in NUVA (#MISS)';
  if (!await ask(`Mark the ${bare.length} undecided code(s) in “${b.name}” as ${what}? You can undo this.`)) return;
  snapshot(`${bare.length} codes`, bare.map(r => r.code));
  for (const r of bare) setValue(r.code, value);
  persist();
  render();
  toast(`${bare.length} code(s) in “${b.name}” → ${value}`, true);
}

function saveRequest() {
  const r = rowOf(S.cur);
  const target = document.querySelector('input[name="reqTarget"]:checked')?.value || 'new';
  const val = id => norm(document.getElementById(id)?.value);
  if (target !== 'new') {
    const q = S.work.requests.find(x => x.id === target);
    if (q && !q.codes.includes(r.code)) q.codes.push(r.code);
    persist();
    toast(`${r.code} added to request ${q.id}`, true);
  } else {
    const q = {
      id: `${S.work.csid}-REQ-${String(S.work.nextReq++).padStart(3, '0')}`,
      kind: document.querySelector('input[name="reqKind"]:checked')?.value || 'unsure',
      title: val('reqTitle') || r.label || r.code,
      valences: [...S.picked],
      missing: val('reqMissing'), why: val('reqWhy'),
      refs: (document.getElementById('reqRefs')?.value || '').trim(),
      codes: [r.code], createdAt: new Date().toISOString()
    };
    S.work.requests.push(q);
    persist();
    toast(`Request ${q.id} written for ${r.code}`, true);
  }
  advance(r.code, blockOfCode(r.code));
}

/* ---------- Rendering ---------- */

function render() {
  const w = S.work;
  $('btnExport').disabled = !w;
  $('btnRequests').disabled = !w;
  $('reqCount').textContent = w && w.requests.length ? `(${w.requests.length})` : '';
  $('progress').hidden = $('toolbar').hidden = !w;
  document.body.classList.toggle('table-open', !!(w && S.cur));
  if (!w) { $('quilt').innerHTML = welcome(); $('table').hidden = true; return }
  renderProgress();
  renderChips();
  renderQuilt();
  renderTable();
}

function renderProgress() {
  const rows = S.work.rows;
  const total = rows.length;
  const c = { bare: 0, aligned: 0, miss: 0, na: 0 };
  for (const r of rows) c[status(r)]++;
  const notAligned = c.bare + c.miss;
  const tierStats = [1, 2, 3, 4].map(t => {
    const bs = blocks().filter(b => b.tier === t);
    const n = bs.reduce((s, b) => s + b.rows.length, 0);
    const a = bs.reduce((s, b) => s + b.count.aligned + b.count.na, 0);
    return n ? `<span class="tier-stat t${t}"><b>${esc(TIERS[t].name)}</b> ${pct(a, n)}% done <small>(${a}/${n})</small></span>` : '';
  }).join('');
  const seg = (k, n) => n ? `<span class="seg s-${k}" style="flex:${n}" title="${n} ${STATUS[k].name}"></span>` : '';
  $('progress').innerHTML = `
    <div class="big">
      <div class="big-num">${pct(notAligned, total)}<small>%</small></div>
      <div class="big-txt"><b>not aligned yet</b><br>${notAligned} of ${total} ${esc(S.work.csid)} codes</div>
    </div>
    <div class="bar-wrap">
      <div class="bar">${seg('aligned', c.aligned)}${seg('na', c.na)}${seg('miss', c.miss)}${seg('bare', c.bare)}</div>
      <div class="legend">
        <span><i class="sw s-aligned"></i>${c.aligned} aligned <em>sewn in</em></span>
        <span><i class="sw s-na"></i>${c.na} out of scope <code>#NA</code> <em>cut out</em></span>
        <span><i class="sw s-miss"></i>${c.miss} missing in NUVA <code>#MISS</code> <em>holes</em></span>
        <span><i class="sw s-bare"></i>${c.bare} not decided <em>bare</em></span>
      </div>
      <div class="tiers">${tierStats}</div>
    </div>`;
}

function renderChips() {
  const rows = S.work.rows;
  $('tierChips').innerHTML = [1, 2, 3, 4].map(t =>
    `<button type="button" class="chip-btn ${S.tiers.has(t) ? 'on' : ''}" data-tier="${t}" title="${esc(TIERS[t].plain)}">${esc(TIERS[t].name)}</button>`).join('');
  $('statusChips').innerHTML = VIEWS.map(([k, label]) => {
    const n = rows.filter(r => inView(r, k)).length;
    if (!n && k !== 'all' && k !== S.view) return '';
    return `<button type="button" class="chip-btn ${S.view === k ? 'on' : ''}" data-view="${k}">${esc(label)} <b>${n}</b></button>`;
  }).join('');
}

function patchHTML(r, p, wide) {
  const st = status(r);
  const warn = attention(r);
  const v = S.vaccines[r.current];
  const vt = st === 'aligned' ? (v ? v.type : 'missing') : '';
  const short = r.code.slice(S.work.csid.length + 1);
  const tip = `${r.code} - ${r.label || 'no label'}\n${STATUS[st].name}${r.current ? ` (${r.current}${v ? ': ' + v.label : ''})` : ''}${warn ? '\n⚠ ' + warn : ''}${p.how === 'label' && p.diseases.length ? '\nPlaced here from its label words' : ''}`;
  const cls = ['patch', `p-${st}`, vt && `vt-${vt}`, warn && 'warn', changed(r) && 'changed', retired(r) && 'retired', r.code === S.cur && 'cur', wide && 'wide'].filter(Boolean).join(' ');
  return `<button type="button" class="${cls}" data-code="${esc(r.code)}" title="${esc(tip)}">
      <span class="pc">${esc(short)}</span>${wide ? `<span class="pl">${esc(r.label) || '<i>no label</i>'}</span><span class="pv">${esc(r.current || '—')}</span>` : ''}
    </button>`;
}

function renderQuilt() {
  const all = blocks();
  const focus = S.focus && all.find(b => b.key === S.focus);
  if (S.focus && !focus) S.focus = null;
  let html = '';
  if (focus) {
    const rows = focus.rows.filter(({ r }) => inView(r, S.view) && matchesSearch(r));
    html = `<div class="focus">
      <div class="focus-head">
        <button type="button" class="ghost" data-act="unfocus">&larr; Whole quilt</button>
        <h2>${esc(focus.name)} <span class="tier-tag t${focus.tier}">${esc(TIERS[focus.tier].name)}</span></h2>
        <span class="sub">${focus.rows.length} codes &middot; ${focus.count.aligned} aligned &middot; ${focus.count.na} out of scope &middot; ${focus.count.miss} missing in NUVA &middot; ${focus.count.bare} not decided</span>
      </div>
      ${focus.count.bare ? `<div class="batch">
        <span>${focus.count.bare} undecided here. Settle them all at once:</span>
        <button type="button" data-batch="#MISS" data-block="${esc(focus.key)}">All missing in NUVA <code>#MISS</code></button>
        <button type="button" data-batch="#NA" data-block="${esc(focus.key)}">All out of scope <code>#NA</code></button>
        <button type="button" class="primary" data-act="first-bare" data-block="${esc(focus.key)}">Align them one by one &rarr;</button>
      </div>` : ''}
      <div class="swatches">${rows.map(({ r, p }) => patchHTML(r, p, true)).join('') || '<p class="empty">No codes in this block match the filters.</p>'}</div>
    </div>`;
  } else {
    const shown = all.filter(b => S.tiers.has(b.tier) && !(S.hideDone && b.done));
    let lastTier = 0;
    for (const b of shown) {
      const rows = b.rows.filter(({ r }) => inView(r, S.view) && matchesSearch(r));
      if (!rows.length) continue;
      if (b.tier !== lastTier) {
        html += `<h2 class="tier-head t${b.tier}">${esc(TIERS[b.tier].name)} <span>${esc(TIERS[b.tier].plain)}</span></h2>`;
        lastTier = b.tier;
      }
      const n = b.rows.length;
      html += `<section class="block t${b.tier} ${b.done ? 'done' : ''}">
        <header data-focus="${esc(b.key)}" title="Open this block: see every label, settle many codes at once">
          <span class="bname">${esc(b.name)}</span>
          <span class="bcount">${b.count.aligned + b.count.na}/${n}</span>
        </header>
        <div class="minibar"><span class="s-aligned" style="flex:${b.count.aligned}"></span><span class="s-na" style="flex:${b.count.na}"></span><span class="s-miss" style="flex:${b.count.miss}"></span><span class="s-bare" style="flex:${b.count.bare}"></span></div>
        <div class="patches">${rows.map(({ r, p }) => patchHTML(r, p, false)).join('')}</div>
        ${b.note ? `<div class="bnote">${esc(b.note)}</div>` : ''}
      </section>`;
    }
    if (!html) html = '<p class="empty big">Nothing matches these filters.</p>';
    html = `<div class="blocks">${html}</div>`;
  }
  $('quilt').innerHTML = html;
}

function vacTag(id) {
  const v = S.vaccines[id];
  return `<span class="vtag vt-${v ? v.type : 'missing'}" title="${esc(v ? `${v.type}: ${v.label}` : 'Not in NUVA')}">${esc(id)}</span>`;
}

function renderTable() {
  const t = $('table');
  const r = S.cur && rowOf(S.cur);
  if (!r) { t.hidden = true; return }
  t.hidden = false;
  const p = placement(r);
  const b = blocks().find(x => x.key === p.block);
  const idx = b ? b.rows.findIndex(x => x.r === r) : -1;
  const warn = attention(r);
  const st = status(r);
  const words = [...new Set(norm(r.label).toLowerCase().split(/[^a-z0-9-]+/).filter(w => w.length > 2 && !STOP.has(w) && !/^\d+$/.test(w)))].slice(0, 10);

  const head = `<div class="t-head">
      <button type="button" class="ghost" data-act="prev" title="Previous code in this block (←)">&lsaquo;</button>
      <div class="t-where">${esc(b?.name || '')} <span class="sub">${idx + 1} of ${b?.rows.length || 0}</span></div>
      <button type="button" class="ghost" data-act="next" title="Next code in this block (→)">&rsaquo;</button>
      <button type="button" class="ghost close" data-act="close" title="Close (Esc)">&times;</button>
    </div>`;

  const card = `<div class="code-card p-${st}">
      <div class="cc-code">${esc(r.code)}${retired(r) ? ' <span class="tag-retired" title="Prefixed # in the source: no longer to be used">retired in source</span>' : ''}</div>
      <p class="cc-label">${esc(r.label) || '<i>No label in the file</i>'}</p>
      <dl class="facts">
        <dt>Now</dt><dd>${st === 'aligned' ? vacTag(r.current) + ' ' + esc(S.vaccines[r.current]?.label || '') : `<b>${esc(STATUS[st].name)}</b>${STATUS[st].code ? ` <code>${STATUS[st].code}</code>` : ''}`}</dd>
        <dt>In the file</dt><dd>${r.imported ? esc(r.imported) : '<i>blank</i>'}${changed(r) ? ' <span class="chg">changed here</span>' : ''}</dd>
        <dt>Block</dt><dd>${esc(b?.name)} <span class="sub">${p.how === 'mapping' ? '(from its NUVA valences)' : p.diseases.length ? '(guessed from its label words)' : ''}</span></dd>
      </dl>
      ${warn ? `<p class="warn">&#9888; ${esc(warn)}</p>` : ''}
    </div>`;

  const body = S.missForm ? requestForm(r) : finder(r, p, words);
  const cand = S.candidate && S.vaccines[S.candidate] ? S.candidate : null;
  const canAlign = !!cand && S.vaccines[cand].type !== 'deprecated';
  const actions = S.missForm ? '' : `<div class="t-actions">
      <button type="button" class="primary big-btn" data-act="align" ${canAlign ? '' : 'disabled'} title="Enter">
        ${cand ? `Align ${esc(r.code)} &rarr; ${esc(cand)}` : 'Align (find a NUVA vaccine first)'}<small>sew it in</small></button>
      <button type="button" data-act="miss" title="M">Missing in NUVA <code>#MISS</code><small>leave a hole</small></button>
      <button type="button" data-act="na" title="X">Out of scope <code>#NA</code><small>cut it out</small></button>
      <button type="button" class="ghost" data-act="reset" ${changed(r) ? '' : 'disabled'} title="Back to the value in the imported file">Back to file value</button>
    </div>`;

  t.innerHTML = `${head}<div class="t-scroll">${card}${body}</div>${actions}`;
}

function finder(r, p, words) {
  const tabs = [['antigens', 'Antigens', 'valence tree'], ['vaccine', 'Vaccine name', 'NUVA vaccines'], ['brand', 'Brand / product', 'commercial products']];
  const seeds = words.length ? `<div class="seeds"><span class="sub">Label words:</span> ${words.map(w => `<button type="button" class="seed" data-seed="${esc(w)}">${esc(w)}</button>`).join('')}</div>` : '';
  let pane = '';
  if (S.mode === 'antigens') pane = antigensPane(p);
  else pane = vaccinesPane(S.mode === 'brand');
  return `<div class="finder">
      <div class="f-title">Find the NUVA match &mdash; start from whatever you know:</div>
      <div class="tabs">${tabs.map(([k, l, s]) => `<button type="button" class="tab ${S.mode === k ? 'on' : ''}" data-mode="${k}">${l}<small>${s}</small></button>`).join('')}</div>
      ${seeds}
      ${pane}
    </div>
    ${comparison(r)}`;
}

function antigensPane(p) {
  const chips = S.picked.map(v => `<span class="chip" title="${esc(norm(S.valences[v]?.label))}">${esc(S.valences[v]?.shorthand || v)}<button type="button" data-pick="${esc(v)}" aria-label="Unpick">&times;</button></span>`).join('');
  const cands = candidatesFromPicked();
  const LIMIT = 25;
  const relText = c => c.exact ? '<span class="rel exact">exact match</span>' : [
    c.extra.length ? `<span class="rel">+ ${c.extra.map(x => esc(S.valences[x]?.shorthand)).join(', ')}</span>` : '',
    c.narrower ? `<span class="rel">${c.narrower} more specific</span>` : '',
    c.broader ? `<span class="rel">${c.broader} less specific</span>` : ''].join(' ');
  return `<div class="picked">Picked: ${chips || '<span class="sub">none yet &mdash; pick one antigen per pathogen</span>'}</div>
    ${S.picked.length ? `<div class="cands">
      <div class="cands-head">Vaccines with these antigens <b>${cands.length}</b></div>
      ${cands.slice(0, LIMIT).map(c => candRow(c.id, relText(c))).join('') || '<p class="sub">No NUVA vaccine has this combination. If it should exist, that\'s <b>Missing in NUVA</b> (<code>#MISS</code>).</p>'}
      ${cands.length > LIMIT ? `<p class="sub">Showing ${LIMIT} of ${cands.length}. Pick more specific antigens to narrow.</p>` : ''}
    </div>` : ''}
    <input id="valSearch" type="search" placeholder="Search antigens: words, shorthand or VAL code" value="${esc(S.valSearch)}">
    ${antigenTree(p)}`;
}

// The antigen tree, narrowed by default to the families the code's label (or mapping) points at.
function antigenTree(p) {
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
  const node = (id, depth, forced) => {
    if (show && !forced && !show.has(id)) return '';
    const v = S.valences[id];
    const d = S.diff[id];
    const kids = S.children[id] || [];
    const isOpen = S.open.has(id);
    const shown = (isOpen ? kids.map(k => node(k, depth + 1, true))
      : show ? kids.filter(k => show.has(k)).map(k => node(k, depth + 1, false)) : []).filter(Boolean);
    const isPicked = S.picked.includes(id);
    const cls = [depth === 0 && 'family', isPicked && 'picked', hits?.has(id) && 'hit', show && !hits.has(id) && !forced && 'ctx', candVals.has(id) && 'incand'].filter(Boolean).join(' ');
    return `<li><div class="vnode ${cls}">
        ${kids.length ? `<button type="button" class="fold" data-fold="${id}" title="${isOpen ? 'Fold' : `Show all ${S.descendants[id]} more specific`}">${isOpen || shown.length ? '&#9662;' : '&#9656;'}</button>` : '<span class="fold leaf">&middot;</span>'}
        <button type="button" class="vpick" data-pick="${id}" title="${isPicked ? 'Unpick' : 'Pick this antigen'}">${isPicked ? '&#10003;' : '+'}</button>
        <span class="vtext" title="${esc(id)} - ${esc(norm(v.label))}"><span class="sh">${mark(v.shorthand)}</span> <span class="dd ${d.derived ? 'derived' : ''}">${mark(d.text)}</span></span>
        <span class="used" title="NUVA vaccines carrying this antigen or a more specific one">${S.usage[id] || ''}</span>
      </div>${shown.length ? `<ul>${shown.join('')}</ul>` : ''}</li>`;
  };
  const roots = S.children[ROOT] || [];
  const suggested = [...new Set(p.diseases.flatMap(d => S.diseases[d]?.families || []))].filter(f => S.valences[f]);
  for (const v of S.picked) { const f = familyOf(v); if (!suggested.includes(f)) suggested.push(f) }
  let list = roots, head;
  if (words.length) head = `${hits.size} antigen(s) match, shown in their branches`;
  else if (suggested.length && !S.allFamilies) {
    list = suggested;
    head = `${suggested.length} of ${roots.length} pathogen families, from this code's ${p.how === 'mapping' ? 'valences' : 'label words'}. <button type="button" class="linkish" data-act="all-families">Show all ${roots.length}</button>`;
  } else head = `${roots.length} pathogen families${suggested.length ? ` <button type="button" class="linkish" data-act="few-families">Only the suggested ${suggested.length}</button>` : ''}`;
  const html = list.map(id => node(id, 0, false)).join('');
  return `<div class="tree-head sub">${head}</div>
    <p class="sub tree-legend">Each antigen says only how it differs from its parent (auto-derived from the labels; hover for the full text). Number = NUVA vaccines carrying it.</p>
    <ul class="vtree">${html || '<li class="empty">No antigen matches. Try fewer words.</li>'}</ul>`;
}

function vaccinesPane(products) {
  const hits = vaccineSearch(products);
  const LIMIT = 30;
  return `<input id="vacSearch" type="search" placeholder="${products ? 'Brand or product name, e.g. Priorix' : 'Vaccine name or words, e.g. measles rubella'}" value="${esc(S.vacSearch)}">
    ${S.vacSearch ? `<div class="cands">
      <div class="cands-head">${products ? 'Products' : 'NUVA vaccines'} matching <b>${hits.length}</b></div>
      ${hits.slice(0, LIMIT).map(id => candRow(id, products ? `<span class="rel">of ${esc(abstractOf(id) || '?')}</span>` : '')).join('') || '<p class="sub">Nothing matches.</p>'}
      ${hits.length > LIMIT ? `<p class="sub">Showing ${LIMIT} of ${hits.length}; add a word.</p>` : ''}
    </div>` : `<p class="sub">${products ? 'Search the real, commercial vaccines (blue). Picking one shows the abstract vaccine it belongs to.' : 'Search the abstract NUVA vaccines (green) by name or description.'} The label words above fill this box.</p>`}`;
}

function candRow(id, rel) {
  const v = S.vaccines[id];
  return `<div class="cand ${id === S.candidate ? 'on' : ''}" data-cand="${id}">
      ${vacTag(id)} <span class="cand-label">${esc(v.label)}</span> ${rel || ''}
      ${v.comment ? `<div class="sub">${esc(v.comment)}</div>` : ''}
    </div>`;
}

function comparison(r) {
  const cand = S.candidate && S.vaccines[S.candidate] ? S.candidate : null;
  if (!cand) return '';
  const v = S.vaccines[cand];
  const abs = abstractOf(cand);
  const others = S.work.rows.filter(x => x.current === cand && x.code !== r.code);
  const inst = v.type === 'abstract' ? (S.instances[cand] || []) : [];
  return `<div class="compare">
      <div class="cmp-title">Compare before you sew</div>
      <div class="cmp src"><div class="cmp-k">${esc(r.code)} says</div><p>${esc(r.label) || '<i>no label</i>'}</p></div>
      <div class="cmp vac"><div class="cmp-k">${vacTag(cand)} ${esc(v.type)} vaccine says</div><p>${esc(v.label)}</p>
        ${v.comment ? `<p class="sub">${esc(v.comment)}</p>` : ''}
        ${v.type !== 'abstract' && abs ? `<p class="sub">Product of <a href="#" data-cand="${abs}">${esc(abs)}</a> ${esc(S.vaccines[abs]?.label)}</p>` : ''}
        ${v.type === 'deprecated' ? '<p class="warn">Deprecated in NUVA: never use. Pick its replacement or another vaccine.</p>' : ''}
        ${inst.length ? `<details><summary>${inst.length} product(s)</summary>${inst.map(i => `<a href="#" class="inst" data-cand="${i}">${esc(S.vaccines[i].label)} <span class="vid">${i}</span></a>`).join('')}</details>` : ''}
        ${others.length ? `<p class="sub">Also aligned to it in this file: ${others.map(o => `<a href="#" data-goto="${esc(o.code)}">${esc(o.code)}</a>`).join(', ')}</p>` : ''}
      </div>
      <div class="cmp vals"><div class="cmp-k">Its valences</div>
        ${valencesOf(cand).map(x => `<div class="vcard"><span class="sh">${esc(S.valences[x]?.shorthand)}</span> <span class="vid">${esc(x)}</span><div>${esc(norm(S.valences[x]?.label))}</div></div>`).join('') || '<p class="sub">None recorded.</p>'}
      </div>
    </div>`;
}

function requestForm(r) {
  const reqs = S.work.requests;
  const chips = S.picked.map(v => `<span class="chip">${esc(S.valences[v]?.shorthand)} <span class="vid">${esc(v)}</span></span>`).join('');
  const guessKind = S.picked.length >= 2 ? 'new-vaccine' : S.picked.length ? 'unsure' : 'new-valence';
  return `<div class="reqform">
      <h3>Tell the NUVA maintainers what's missing</h3>
      <p class="sub"><b>${esc(r.code)}</b> is now <code>#MISS</code>. Optionally, describe what NUVA would need, so it goes into the <b>request package</b> you can export and send to IVC. Nothing is sent anywhere from here.</p>
      <div class="reqtarget">
        <label><input type="radio" name="reqTarget" value="new" checked> New request</label>
        ${reqs.map(q => `<label><input type="radio" name="reqTarget" value="${esc(q.id)}"> Add to <b>${esc(q.id)}</b> ${esc(q.title)} <span class="sub">(${q.codes.length} code(s))</span></label>`).join('')}
      </div>
      <div class="reqnew">
        <label>Title <input id="reqTitle" type="text" value="${esc(r.label)}"></label>
        <fieldset><legend>What's missing</legend>
          ${Object.entries(KIND).map(([k, l]) => `<label><input type="radio" name="reqKind" value="${k}" ${k === guessKind ? 'checked' : ''}> ${esc(l)}</label>`).join('')}
        </fieldset>
        <div class="sub">Existing antigens it involves (from your picks): ${chips || '<i>none picked</i>'}</div>
        <label>Describe it <textarea id="reqMissing" rows="2" placeholder="e.g. Rho(D) immune globulin has no valence in NUVA"></textarea></label>
        <label>Why / evidence <textarea id="reqWhy" rows="2" placeholder="e.g. used in our registry, n doses a year"></textarea></label>
        <label>References, one per line <textarea id="reqRefs" rows="2" placeholder="https://..."></textarea></label>
      </div>
      <p class="row-end">
        <button type="button" class="ghost" data-act="skip-request">Skip, keep it as #MISS &rarr;</button>
        <button type="button" class="primary" data-act="save-request">Save request &amp; next &rarr;</button>
      </p>
    </div>`;
}

function welcome() {
  return `<div class="welcome">
    <h2>Lay out a whole code system</h2>
    <p>Quilt shows every code at once, one patch per code, grouped into a block per disease, with the <b>most common diseases first</b>.
      Settle the everyday vaccines, leave the long tail for later, and watch the <b>not aligned yet</b> figure go down.</p>
    <p>It reads the same alignment CSV as the NUVA editor: <code>CSID-code, NUVA code, "code label", "NUVA label"</code>, header row starting with the code system identifier.
      Leave column 2 blank to start from scratch.</p>
    <p><button type="button" class="primary" data-act="import">Import alignment CSV…</button></p>
    <p class="sub">Or try a sample:</p>
    <p>
      <button type="button" data-sample="samples/CVX-unaligned.csv">CVX - NUVA column blanked (align from scratch)</button>
      <button type="button" data-sample="samples/CVX2nuva.csv">CVX - as published (review)</button>
    </p>
    <div class="legend-demo">
      <span class="patch p-bare"><span class="pc">01</span></span> not decided (bare)
      <span class="patch p-aligned vt-abstract"><span class="pc">03</span></span> aligned (sewn in)
      <span class="patch p-miss"><span class="pc">87</span></span> missing in NUVA <code>#MISS</code> (hole)
      <span class="patch p-na"><span class="pc">99</span></span> out of scope <code>#NA</code> (cut out)
    </div>
    <p class="sub">Your work stays in this browser until you export it. Nothing is sent anywhere.</p>
  </div>`;
}

/* ---------- Sheets: requests and export ---------- */

function requestsSheet() {
  const w = S.work;
  const inReq = new Set(w.requests.flatMap(q => q.codes));
  const holes = w.rows.filter(r => r.current === '#MISS' && !inReq.has(r.code));
  const sub = w.submitter || { name: '', organization: '', contact: '' };
  sheet(`<div class="sheet-head"><h2>Requests for new NUVA content <small>the fabric order</small></h2><button type="button" class="ghost close" data-act="close-sheet">&times;</button></div>
    <p class="sub">Each request describes something NUVA is missing and lists the ${esc(w.csid)} codes waiting on it. Export them as a <b>request package</b> to email or upload to IVC, if and when you choose. Edits save as you type.</p>
    <div class="submitter">
      <label>Your name <input data-sub="name" value="${esc(sub.name)}"></label>
      <label>Organization <input data-sub="organization" value="${esc(sub.organization)}"></label>
      <label>Contact <input data-sub="contact" value="${esc(sub.contact)}"></label>
    </div>
    ${w.requests.map(q => `<div class="req">
      <div class="req-top"><b>${esc(q.id)}</b> <input data-req="${esc(q.id)}" data-f="title" value="${esc(q.title)}" aria-label="Title">
        <button type="button" class="ghost small" data-delreq="${esc(q.id)}" title="Delete this request (its codes stay #MISS)">Delete</button></div>
      <div class="req-grid">
        <label>Kind <select data-req="${esc(q.id)}" data-f="kind">${Object.entries(KIND).map(([k, l]) => `<option value="${k}" ${q.kind === k ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>
        <div class="sub">Existing antigens: ${q.valences.map(v => `<span class="chip">${esc(S.valences[v]?.shorthand)} <span class="vid">${esc(v)}</span></span>`).join('') || '<i>none</i>'}</div>
        <label>What's missing <textarea data-req="${esc(q.id)}" data-f="missing" rows="2">${esc(q.missing)}</textarea></label>
        <label>Why / evidence <textarea data-req="${esc(q.id)}" data-f="why" rows="2">${esc(q.why)}</textarea></label>
        <label>References <textarea data-req="${esc(q.id)}" data-f="refs" rows="2">${esc(q.refs)}</textarea></label>
      </div>
      <div class="req-codes">Waiting on it: ${q.codes.map(c => `<span class="chip"><a href="#" data-goto="${esc(c)}">${esc(c)}</a> <button type="button" data-unreq="${esc(q.id)}|${esc(c)}" aria-label="Remove">&times;</button></span>`).join('') || '<i>no codes</i>'}</div>
    </div>`).join('') || '<p class="empty">No requests yet. Mark a code <b>Missing in NUVA</b> (<code>#MISS</code>) and describe what\'s missing.</p>'}
    ${holes.length ? `<h3>Holes with no request yet <small>${holes.length}</small></h3><p class="sub">These are <code>#MISS</code> but say nothing about what's missing. They're listed in the package anyway, under "not yet described".</p>
      <div class="hole-list">${holes.map(r => `<a href="#" data-goto="${esc(r.code)}" title="${esc(r.label)}">${esc(r.code)}</a>`).join(' ')}</div>` : ''}
    <p class="row-end"><button type="button" data-act="show-text">Show as text for an email</button> <button type="button" class="primary" data-act="dl-package">Download request package (.json)</button></p>
    <pre id="pkgText" class="preview" hidden></pre>`);
}

function exportSheet() {
  const w = S.work;
  const csv = buildCSV(w);
  const pkg = buildPackage(w);
  const lines = csv.text.replace(/^﻿/, '').split('\n');
  sheet(`<div class="sheet-head"><h2>Export files <small>take it off the frame</small></h2><button type="button" class="ghost close" data-act="close-sheet">&times;</button></div>
    <div class="exp">
      <h3>1. Alignment file &mdash; <code>${esc(csv.name)}</code></h3>
      <p>The standard alignment CSV, loadable in the NUVA editor. ${w.rows.length} codes.
        ${csv.undecided ? `<br><b>${csv.undecided} undecided code(s) are written as <code>#MISS</code></b>, because the format has no "not decided yet" value.` : ''}</p>
      <pre class="preview">${esc(lines.slice(0, 8).join('\n'))}\n…</pre>
      <p><button type="button" class="primary" data-act="dl-csv">Download alignment CSV</button></p>
    </div>
    <div class="exp">
      <h3>2. Request package &mdash; <code>${esc(w.csid)}-nuva-requests_${today()}.json</code></h3>
      <p>New file proposed by this prototype: ${pkg.requests.length} request(s) for new NUVA content, covering ${pkg.requests.reduce((s, q) => s + q.codes.length, 0)} code(s), plus ${pkg.notYetDescribed.length} other #MISS code(s) with no request yet.
        Optional: send it to IVC only if you want to.</p>
      <p><button type="button" data-act="open-requests">Review requests</button> <button type="button" class="primary" data-act="dl-package">Download request package</button></p>
    </div>`);
}

function download(name, text, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/* ---------- Toast, sheet & dialog (in-page, never native dialogs) ---------- */

let toastTimer = null;
function toast(msg, withUndo) {
  const t = $('toast');
  t.innerHTML = esc(msg) + (withUndo && S.undo ? ' <button type="button" data-act="undo">Undo</button>' : '');
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, 7000);
}
function hideToast() { $('toast').hidden = true }

function pop(code) {
  requestAnimationFrame(() => document.querySelector(`.patch[data-code="${CSS.escape(code)}"]`)?.classList.add('pop'));
}

let sheetKind = null;
function sheet(html) { $('sheetBody').innerHTML = html; $('sheet').hidden = false }
function closeSheet() { $('sheet').hidden = true; sheetKind = null; render() }

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
    const ok = await ask(`Replace the ${S.work.csid} quilt with ${w.csid} (${w.rows.length} codes)?` +
      (n || S.work.requests.length ? ` Its ${n} change(s) and ${S.work.requests.length} request(s) will be lost unless you have exported them.` : ''));
    if (!ok) return;
  }
  const notes = w.notes; delete w.notes;
  S.work = w; S.cur = null; S.focus = null; S.view = 'all'; S.search = ''; $('search').value = ''; S.undo = null;
  persist();
  render();
  const extra = [
    notes.prefixed && `${notes.prefixed} code(s) given the ${w.csid}- prefix`,
    notes.coerced && `${notes.coerced} unrecognized NUVA value(s) read as #MISS`,
    notes.misSpelling && `${notes.misSpelling} "#MIS" read as #MISS`,
    notes.duplicates && `${notes.duplicates} duplicate code(s) skipped`].filter(Boolean);
  toast(`Laid out ${w.rows.length} ${w.csid} codes` + (extra.length ? ' - ' + extra.join('; ') : ''));
}

/* ---------- Events ---------- */

function wire() {
  $('btnImport').onclick = () => $('fileInput').click();
  $('btnExport').onclick = () => { sheetKind = 'export'; exportSheet() };
  $('btnRequests').onclick = () => { sheetKind = 'requests'; requestsSheet() };
  $('fileInput').onchange = e => {
    const f = e.target.files[0];
    if (!f) return;
    f.text().then(t => importText(t, f.name));
    e.target.value = '';
  };
  $('search').oninput = e => { S.search = e.target.value; renderChips(); renderQuilt() };
  $('hideDone').onchange = e => { S.hideDone = e.target.checked; renderQuilt() };
  $('sheet').addEventListener('click', e => { if (e.target === $('sheet')) closeSheet() });

  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act],[data-code],[data-tier],[data-view],[data-focus],[data-batch],[data-mode],[data-seed],[data-pick],[data-fold],[data-cand],[data-goto],[data-sample],[data-delreq],[data-unreq]');
    if (!el) return;
    const d = el.dataset;
    if (el.tagName === 'A') e.preventDefault();
    if (d.sample) { fetch(d.sample).then(r => r.text()).then(t => importText(t, d.sample.split('/').pop())); return }
    if (d.code) { openCode(d.code); return }
    if (d.goto) { if (!$('sheet').hidden) closeSheet(); openCode(d.goto); return }
    if (d.tier) { const t = +d.tier; S.tiers.has(t) ? S.tiers.delete(t) : S.tiers.add(t); renderChips(); renderQuilt(); return }
    if (d.view) { S.view = d.view; renderChips(); renderQuilt(); return }
    if (d.focus) { S.focus = d.focus; renderQuilt(); window.scrollTo(0, 0); return }
    if (d.batch) { batch(d.block, d.batch); return }
    if (d.mode) { S.mode = d.mode; S.vacSearch = ''; renderTable(); return }
    if (d.seed) {
      if (S.mode === 'antigens') S.valSearch = (S.valSearch.trim() + ' ' + d.seed).trim();
      else S.vacSearch = (S.vacSearch.trim() + ' ' + d.seed).trim();
      renderTable(); return;
    }
    if (d.pick) { pick(d.pick); return }
    if (d.fold) { S.open.has(d.fold) ? S.open.delete(d.fold) : S.open.add(d.fold); renderTable(); return }
    if (d.cand) {
      S.candidate = d.cand;
      for (const v of valencesOf(d.cand)) for (const a of S.lineage[v] || []) S.open.add(a);
      renderTable();
      $('table').querySelector('.compare')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      return;
    }
    if (d.delreq) {
      S.work.requests = S.work.requests.filter(q => q.id !== d.delreq);
      persist(); requestsSheet(); return;
    }
    if (d.unreq) {
      const [id, code] = d.unreq.split('|');
      const q = S.work.requests.find(x => x.id === id);
      if (q) q.codes = q.codes.filter(c => c !== code);
      persist(); requestsSheet(); return;
    }
    if (d.act) act(d.act, el);
  });

  // Search boxes inside the sewing table re-render the table, so keep the caret where it was.
  document.addEventListener('input', e => {
    const id = e.target.id;
    if (id === 'valSearch' || id === 'vacSearch') {
      if (id === 'valSearch') S.valSearch = e.target.value; else S.vacSearch = e.target.value;
      const pos = e.target.selectionStart;
      renderTable();
      const s = $(id); s.focus(); s.setSelectionRange(pos, pos);
      return;
    }
    const el = e.target;
    if (el.dataset.req) {
      const q = S.work.requests.find(x => x.id === el.dataset.req);
      if (q) { q[el.dataset.f] = el.value; persist() }
    } else if (el.dataset.sub) {
      S.work.submitter ||= { name: '', organization: '', contact: '' };
      S.work.submitter[el.dataset.sub] = el.value;
      persist();
    }
  });

  document.addEventListener('keydown', e => {
    if (dialogDone) { if (e.key === 'Escape') dialogDone(false); return }
    if (e.key === 'Escape') {
      if (!$('sheet').hidden) closeSheet();
      else if (S.cur) closeTable();
      else if (S.focus) { S.focus = null; renderQuilt() }
      return;
    }
    if (e.target.matches('input, textarea, select') || e.ctrlKey || e.metaKey || e.altKey) return;
    if (!$('sheet').hidden || !S.cur || S.missForm) { if (e.key === 'z' && S.undo) doUndo(); return }
    const k = e.key;
    if (k === 'Enter' && !e.target.matches('button, a')) act('align');
    else if (k === 'm' || k === 'M') act('miss');
    else if (k === 'x' || k === 'X') act('na');
    else if (k === 'ArrowRight') stepInBlock(1);
    else if (k === 'ArrowLeft') stepInBlock(-1);
    else if (k === 'z' && S.undo) doUndo();
  });
}

function act(a, el) {
  switch (a) {
    case 'import': $('fileInput').click(); return;
    case 'undo': doUndo(); return;
    case 'unfocus': S.focus = null; renderQuilt(); return;
    case 'first-bare': {
      const b = blocks().find(x => x.key === el.dataset.block);
      const r = b?.rows.map(x => x.r).find(r => !r.current);
      if (r) openCode(r.code);
      return;
    }
    case 'close': closeTable(); return;
    case 'close-sheet': closeSheet(); return;
    case 'prev': stepInBlock(-1); return;
    case 'next': stepInBlock(1); return;
    case 'all-families': S.allFamilies = true; renderTable(); return;
    case 'few-families': S.allFamilies = false; renderTable(); return;
    case 'open-requests': sheetKind = 'requests'; requestsSheet(); return;
    case 'show-text': { const p = $('pkgText'); p.textContent = packageText(buildPackage(S.work)); p.hidden = false; return }
    case 'dl-csv': {
      const c = buildCSV(S.work);
      download(c.name, c.text, 'text/csv;charset=utf-8');
      toast(`Exported ${c.name}` + (c.undecided ? ` - ${c.undecided} undecided code(s) written as #MISS` : ''));
      return;
    }
    case 'dl-package':
      download(`${S.work.csid}-nuva-requests_${today()}.json`, JSON.stringify(buildPackage(S.work), null, 2), 'application/json');
      toast('Request package downloaded. Send it to IVC if and when you choose.');
      return;
  }
  const r = rowOf(S.cur);
  if (!r) return;
  switch (a) {
    case 'align': {
      const v = S.vaccines[S.candidate];
      if (!v || v.type === 'deprecated') return;
      decide(S.candidate); return;
    }
    case 'miss': decide('#MISS'); return;
    case 'na': decide('#NA'); return;
    case 'reset': if (changed(r)) decide(r.imported); return;
    case 'save-request': saveRequest(); return;
    case 'skip-request': advance(r.code, blockOfCode(r.code)); return;
  }
}

/* ---------- Start ---------- */

function start() {
  wire();
  $('quilt').innerHTML = '<p class="empty big">Loading NUVA data…</p>';
  fetch(DATA_URL)
    .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
    .then(data => {
      buildIndexes(data);
      $('dataVersion').textContent = `NUVA data ${S.version}`;
      const saved = load(STORE_KEY);
      if (saved && Array.isArray(saved.rows)) {
        delete saved.savedAt;
        saved.requests ||= []; saved.nextReq ||= 1;
        S.work = saved;
      }
      render();
    })
    .catch(err => {
      $('quilt').innerHTML = `<div class="welcome"><h2>Could not load the NUVA data</h2>
        <p>${esc(err.message)}</p>
        <p>Quilt reads <code>${DATA_URL}</code>. Browsers block that when the page is opened as a <code>file://</code> URL -
        serve the <code>docs/</code> folder over HTTP instead (see README.md).</p></div>`;
    });
}

if (typeof document !== 'undefined') start();
// Lets the round-trip test run the CSV functions in Node; does nothing in the browser.
if (typeof module !== 'undefined') module.exports = { S, buildIndexes, parseAlignment, buildCSV, buildPackage, placement, blocks };
