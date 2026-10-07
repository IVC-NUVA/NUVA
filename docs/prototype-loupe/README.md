# Loupe - a single-screen alignment prototype

**One of several deliberately different explorations of the NUVA alignment workflow. Not a recommendation, not a proposal to replace the Code Systems tab.** It exists to be clicked through and reacted to.

## The question it explores

*Does the align-one-code task get easier if everything needed for the decision is on one screen at once?*

Today, aligning one code takes moves between the Code Systems, Vaccines and Valences tabs. The shared `context` object carries the current vaccine and code from tab to tab, and the actual decision is made by hovering over tags to compare three descriptions: the external code's, the candidate vaccine's, and its valences'. Loupe puts the code under a loupe instead:

- **Left:** the codes being aligned, with filters (Undecided / Aligned / #MISS / #NA / Changed / Needs attention).
- **Centre:** the code's own description, the candidate NUVA vaccine and that vaccine's valences, laid out **side by side as full text, with no tooltips needed**. Below them: one row of decisions, then the list of candidate vaccines.
- **Right:** the valence tree. Ticking valences lists the abstract vaccines that carry that combination: the exact match first, then those with extra, more specific or less specific valences. An exact match drops straight into the comparison.

The **Align** button always names both codes (`Align CVX-03 → VAC0130`), and selecting a code rebuilds the comparison from that code alone. No vaccine is ever carried over from an earlier selection.

### Also trying out: differential valence descriptions

Each line in the tree shows a short **"how this differs from its parent"** form (e.g. `CHOL-LA-O ↳ oral` under *Cholera valence, live attenuated, unspecified*). The full description is still available on hover and is always shown in full in the comparison panel. NUVA has no such field yet, so for this prototype the short form is **derived automatically** by removing the parent label's comma-separated phrases from the child's. That works for most valences; about 49 of 386 fall back to the full label. A real version would be an authored field.

## What it deliberately is not

- **Not opinionated about process.** There are no workflow statuses, confidence levels, assignees or tracked "missing content" records. Its decisions are exactly the alignment file's own: a `VACnnnn` code, `#NA` or `#MISS`. The process question is left to the other prototypes.
- **No automated matching.** It doesn't guess candidates from the code's text. Candidates come only from valences the user ticks or words the user types, keeping the person's description-driven judgment at the centre.
- **Not a full editor.** No vaccine/valence editing, no Unit files, no reverse or transcription maps, no work-file backup and restore. The main editor still does all of those.
- **Not a fix for anything in the main editor**, whose files are untouched.

## Files it reads and writes

- **Reads** `../data/nuvadata.json`, the same published dataset the site serves.
- **Imports and exports** the standard alignment CSV (`docs/documentation/tools/f_alignment.md`): header cell = code system ID, `CSID-` prefixed codes, `VACnnnn` / `#NA` / `#MISS`, UTF-8 with BOM, exported as `CSID2nuva_YYYY-MM-DD.csv`. Every file in `Alignments/` was checked to round-trip through the main editor's `parseCSV` with no differences.
- A blank NUVA column on import means **undecided**, so a raw list of codes can be aligned from scratch. The format has no "not decided yet" value, so undecided codes are **exported as `#MISS`** (the same thing the main editor's importer turns them into), and the export message says how many.
- Work in progress is kept in `localStorage` under its own key (`loupe.work.v1`). It never reads or writes the main editor's `vaccines` / `valences` / `CSData` / `context` keys, even though both run on the same origin.

`samples/` holds `CVX2nuva.csv` (copied from `Alignments/` at the time of writing) and `CVX-unaligned.csv` (the same codes and labels with the NUVA column blanked, for trying the from-scratch flow).

## Running it

Static files, no build step. It must be served over HTTP, because browsers block the data fetch from a `file://` page.

- **Tomcat (as used for the main editor):** copy this folder to `webapps/NUVA/prototype-loupe/` alongside the deployed `docs/` contents and open `http://localhost:8080/NUVA/prototype-loupe/`.
- **Any static server** run from `docs/`, e.g. `python -m http.server` in `docs/`, then open `http://localhost:8000/prototype-loupe/`.

Keys: `↑`/`↓` (or `j`/`k`) move between codes, `Enter` aligns to the candidate, `M` = `#MISS`, `X` = `#NA`, `R` = back to the imported value, `Z` = undo the last decision.
