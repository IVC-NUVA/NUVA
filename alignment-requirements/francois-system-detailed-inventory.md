# François's System — Detailed Inventory

A systematic, behavior-level walkthrough of the current editor (`main` at commit `02b1c87a`, 2026-10-06): every screen, every action, the actual data model, the file-format contracts, and what's actually true today versus merely intended. Companion to `francois-requirements.md` (the broad-overview/why/philosophy document) - this file is the detailed reference to consult so a new design doesn't accidentally drop a capability, and so the real edge cases are known going in rather than discovered late.

Cross-validated against François's own documentation pages (`docs/documentation/tools/ed_vaccines.md`, `ed_valences.md`, `ed_codes.md`, `ed_files.md`, `f_unitfile.md`, `f_workfile.md`, `f_alignment.md`, `f_rmap.md` - all assigned to Nathan, status Submitted). Where this document and his line up, that's confirmation his docs are accurate to intent. Where they diverge, it's because the running code doesn't actually do what's documented - see "Known defects" at the end.

## 1. The shared data model

Four top-level JS globals, all loaded fresh from `https://nuva.ivci.org/data/nuvadata.json` on every page load, then mirrored into `localStorage` (or `sessionStorage` if opened via `file://`) so edits survive a reload:

### `vaccines` (keyed by `VACnnnn`)
```
{ type: 'abstract' | 'real' | 'deprecated',
  label: string,
  comment: string (optional),
  created: 'YYYY-MM-DD', modified: 'YYYY-MM-DD',
  valences: [VALnnn, ...]        // only if type == 'abstract'
  instanceOf: VACnnnn            // only if type == 'real' or 'deprecated' (points to its abstract parent)
}
```
Note: the field used to be `abstract: true/false` plus a separate `status` field; it's now unified into a single `type` enum. This migration isn't complete everywhere in the code - see Known defects.

### `valences` (keyed by `VALnnn`)
```
{ label: string,                  // this IS the full description - there is no separate comment/long-description field
  shorthand: string,               // short notation, e.g. "ap" for "acellular pertussis, reduced dose"
  vtype: string,                   // dotted-path code into a second, separate hierarchy - see section 4
  parent: VALnnn | 'Valence',      // 'Valence' is the synthetic root
  created: 'YYYY-MM-DD', modified: 'YYYY-MM-DD'
}
```
**Relevant to Nathan's differential-description idea:** there's no existing "short description relative to parent" field to repurpose - it would be a genuinely new field, with `label` staying as the full/authoritative description.

### `CSData` (the loaded alignment/code-system working state - NOT part of the published NUVA data, lives only in browser storage)
```
{ CSID: string | null,                              // code system identifier, taken from the CSV's header row
  code2nuva: { [extCode]: { nuvaCode: string, label: string } },
  nuva2code: { [nuvaCode]: [extCode, ...] },         // only populated for codes NOT prefixed '#' (i.e. not #NA/#MISS)
  refcode2nuva: { [extCode]: string }                // the ORIGINAL nuvaCode from the imported file, used to detect changes and support "Reset to initial value"
}
```

### `context` (cross-tab UI state, persisted as a single `localStorage` key, no expiry)
```
{ version: string,              // local working version label, e.g. "2026-10-04/WORK"
  selectedValences: [VALnnn, ...],
  filter: [VALnnn, ...],
  changedOnly: boolean,
  selectedAbstract: VACnnnn | null,
  currentVaccine: VACnnnn | null,
  currentValence: VALnnn | null,
  currentCode: string | null
}
```
This is the mechanism behind "pick a vaccine in one tab, it's still picked when you switch tabs." **It has no timestamp and never expires** - a value set days ago in an unrelated session will silently be reused. This is exactly how the previously-confirmed "Map to current vaccine" bug manifested (see the branch's `NUVA-Alignment-Workspace-Coordination.md`).

## 2. Vaccines tab

**Main view:** every abstract vaccine as a row, its valences, and its real/deprecated instances. Abstract vaccine tags are green, real are blue, deprecated are light blue. A vaccine already linked to a code in the currently-loaded code system gets a trailing `*` on its tag.

**Filtering:** free-text (matches code or label), "changed only" (differs from the published reference), and a valence filter (only vaccines carrying *every* valence currently in the filter list are shown).

**Actions:**
| Action | What it does | Notes / edge cases |
|---|---|---|
| Add an abstract vaccine | Opens a blank edit form, type locked to `abstract` | Code is freeform until saved |
| Click an existing vaccine tag | Opens it for edit, sets it as `currentVaccine` | If abstract, also sets `selectedAbstract` |
| Save values | Validates code matches `VAC####`, must be unused if new | |
| Assign selected valences | **Intended** to replace the abstract vaccine's valence list with whatever's in the sidebar's Selected Valences | **Confirmed broken** - throws `ReferenceError: selectedValences is not defined`, does nothing. See Known defects #1. |
| Create new instance | Opens a blank real-vaccine form pre-linked to the current abstract vaccine | |
| Assign current code | Only shown if a `currentCode` is set (from the Code Systems tab); links that code to the current vaccine in `CSData` | Reciprocal of the Code Systems tab's "Map to current vaccine" |
| Assign to selected abstract (real vaccines only) | Reassigns a real vaccine's `instanceOf` to whatever abstract vaccine is currently selected | |
| Deprecate | Sets `type: 'deprecated'`; if it was abstract, also strips its `valences` array entirely and sets `instanceOf: 'VAC0000'` | One-way in the UI (no "undeprecate" button, though editing `type` directly would work) |
| Reset to default | Reverts to the published reference version, or deletes it entirely if it was newly created and never published | |

**A real duplicate-detection check that does work:** `setVaccineValences()` checks whether the proposed valence combination already belongs to another abstract vaccine and blocks with an alert if so - this logic is intact, just unreachable because of the bug above.

## 3. Valences tab

**Main view:** the full valence tree, foldable, each line showing shorthand + code + label, with a checkbox for selection. Clicking the text opens the edit box (and auto-unfolds); clicking the checkbox adds it to `selectedValences` (which automatically removes any already-selected ancestor or descendant, since a selection should represent one coherent point in the hierarchy).

**Filtering:** same free-text / changed-only / valence-filter pattern as Vaccines. A valence matches if it or any ancestor/descendant matches.

**Actions:**
| Action | What it does | Notes / edge cases |
|---|---|---|
| Add a valence | Blank form, code editable until saved | |
| Save values | Validates `VAL###` format and uniqueness | |
| Use selected as Parent | **Intended**: takes the first entry in `selectedValences` as the new parent (or the root if nothing's selected), with a compatibility check against the valence-type hierarchy | **Confirmed broken when nothing is selected** - `context.selectedValences.size` is checked (arrays don't have `.size`, only `.length`), so the empty-selection branch never triggers; instead it tries to read `extvalences[undefined].minVType` and throws a `TypeError`. Works fine when something *is* selected. See Known defects #2. |
| Reset to default | Same pattern as vaccines: revert or delete | |

## 4. The valence type hierarchy (vtype) - a second, separate classification

Distinct from the valence parent/child (antigen) tree. `VTypeOptions` in `valences.js` is a fixed, hardcoded dotted-path hierarchy describing vaccine *technology*: Antigens -> Live vs. Non-live -> (live attenuated pathogen / recombinant viral vector) or (whole inactivated / split / subunit / nucleic acid) -> further subdivisions down to things like "Conventional mRNA vaccines" and "Self-amplifying RNA vaccines." Antibodies are a separate top-level branch.

When editing a valence, the type dropdown is **dynamically restricted** to options compatible with its position in the antigen tree: it can't be more specific than its nearest-typed ancestor (`minVType`) or broader than the narrowest common type among its descendants (`maxVType`). Reparenting a valence (`setParent`) re-checks this compatibility and resets the type to Implicit if the move would violate it.

**Open question already logged:** how this hierarchy is actually used during matching (beyond constraining valid values) wasn't confirmed in the call - worth asking directly.

## 5. Code Systems tab

**Main view:** once a CSV is imported, every code in it as a row (code, code label, NUVA code, NUVA label), sorted by code. A row is bold if its current NUVA mapping differs from what was in the originally-imported file.

**Filtering:** free-text across all four columns, and "changed only."

**Actions:**
| Action | What it does | Notes / edge cases |
|---|---|---|
| Import from CSV | Parses the file (see section 7 for format), replaces `CSData` entirely | Any unsaved in-progress mapping work is lost without warning |
| Click a code row | Opens the edit bar, sets `currentCode` | |
| Map to current vaccine | Assigns the code to whatever vaccine is in `currentVaccine` | **No guard if `currentVaccine` is unset** - confirmed to silently write an unrelated, essentially-arbitrary NUVA code instead of failing safely (already reported in the branch coordination doc as the first confirmed bug) |
| Out of scope | Sets the code's mapping to `#NA` | |
| Vaccine concept missing | Sets the code's mapping to `#MISS` | No further tracking of *what's* missing - purely a marker |
| Reset to initial value | Restores the code's mapping to what was in the original import (`refcode2nuva`) | |
| Save to CSV | Exports the current working table, regenerating NUVA labels from the live data | |
| Create reverse map | Computes, for every NUVA vaccine, the best available code(s) in the loaded system | **Confirmed broken for abstract vaccines** - still checks the old `vaccine.abstract` field (always `undefined` now), so abstract vaccines are silently skipped and never resolved by their own code in the output. Real vaccines are unaffected since their `instanceOf` resolution happens to work regardless. See Known defects #3. |
| Create transcription map | Only enabled after a reverse map has been created; maps a second code system through NUVA to the first | |

**Matching, as actually performed by a human (confirmed live in the 2026-10-06 call):** there's no automated suggestion - the user reads and compares the external code's description, the candidate NUVA vaccine's description, and the candidate valence's description (via hover tooltips on every tag) to decide. This is the core workflow any redesign needs to support well, not streamline away.

## 6. Files tab

Three unrelated functions grouped together:
- **Save/Restore** - downloads or re-uploads the entire working state (`vaccines` + `valences` + version label) as a dated JSON "work file." This is the only durable, portable backup mechanism - `localStorage` alone isn't considered sufficient.
- **Reset to default** - discards all local changes, reverts to the published reference. Destructive, no confirmation dialog.
- **Download Unit files** - generates one `.yml` download per *changed* vaccine or valence, in the format the actual NUVA repository expects for submission (see section 7). This is the only path from "edits made in the browser" to "something that could become an official NUVA update."

## 7. File formats

### Unit files (`VACnnnn.yml` / `VALnnn.yml`)
One file per concept, hand-readable YAML, this is the authoritative source for published NUVA. Exact field sets match the `vaccines`/`valences` JS objects in section 1 (`type`/`label`/`comment`/`valences` or `instanceOf`/dates for vaccines; `label`/`shorthand`/`vtype`/`parent`/dates for valences).

### Work files (the JSON backup/restore format, and the published `nuvadata.json` the editor fetches on load)
`{ version, vaccines: {...}, valences: {...} }` - a flattened bundle of every Unit file's content. The published reference version is dated by the most recent Unit-file modification; local working copies are labeled `<reference version>/WORK` and, if downloaded, filenamed `nuvadataYYYY-MM-DD-HHMM.json`.

### Alignment files (the CSV a code-system owner imports/exports)
Header row's first cell is the code-system identifier itself (not a generic column name); rows are `code,nuvaCode,"code label","nuva label"`. Codes are prefixed `CSID-`; `nuvaCode` is either a real `VACnnnn`, `#NA` (out of scope), or `#MISS` (should exist in NUVA, doesn't yet). Export filename: `CSID2nuva_YYYY-MM-DD.csv`.

### Reverse maps / transcription maps (generated, read-only output)
Reverse map columns: `NUVA, NUVA label, Type, <CSID>, <CSID> label, Best, Blur, Equiv`. "Best" means this code has the lowest `Blur` (fewest distinct NUVA concepts it could represent) among candidates; "Equiv" counts other codes in the same system that would tie for that same concept. Transcription maps have the same columns with two extra leading columns for the transcribed system's own code/label. Filenames: `nuva2CSID_YYYY-MM-DD.csv` and `TRANSCSID2CSID_YYYY-MM-DD.csv`.

## 8. Known defects observed during this review

Not yet reported to François. Three new ones beyond the "Map to current vaccine" bug already logged on the NUVA repo branch - all share the same root cause pattern: leftover references to pre-refactor field/variable names that were renamed during the `type`-field and `context`-object migrations (mid-to-late September), and never fully propagated everywhere they were used.

1. **"Assign selected valences" (Vaccines tab) is completely broken.** `vaccines.js` still reads a bare `selectedValences` variable that no longer exists (replaced by `context.selectedValences`). Throws immediately, assigns nothing. Confirmed live.
2. **"Use selected as Parent" (Valences tab) throws when nothing is selected**, instead of falling back to the root valence as the code clearly intends. `context.selectedValences.size` is checked where `.length` was meant (arrays don't have `.size`). Confirmed live. Works correctly when something *is* selected.
3. **"Create reverse map" silently drops abstract vaccines.** `reverseCodeSystem()` still checks `vaccines[idvac].abstract`, a field that no longer exists (replaced by `vaccines[idvac].type == 'abstract'`). Confirmed by inspecting the live data file - the field is simply absent from every vaccine record now.

Given the pattern (three separate spots, same migration left incomplete), it's worth a quick full-text search across the other scripts for any other bare references to `selectedValences`, `.abstract`, or `.status` before assuming the migration is otherwise complete elsewhere.

**Suggested next step:** add these three to the branch's `NUVA-Alignment-Workspace-Coordination.md` "Known issues" section (on `main`, clearly labeled, same pattern as the existing one) so they're not lost, even though nothing is being reported or fixed yet per the current "big picture first" approach.
