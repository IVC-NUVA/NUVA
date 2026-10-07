# Quilt - a triage-the-whole-code-system alignment prototype

**One of several deliberately different explorations of the NUVA alignment workflow. Not a recommendation, not a proposal to replace the Code Systems tab.** It exists to be clicked through and reacted to.

## The question it explores

*What if the starting point is the whole code system at a glance, ordered so the most common diseases come first, instead of a list of codes to walk one by one?*

This is direction D in `alignment-requirements/prototype-plan.md`, drawn from François's reaction to Loupe and Passport Control: stepping through every code in order is discouraging. He'd rather start with everything as `#MISS`, release the most common vaccines and diseases first, leave the obscure long tail for later, and see a global figure for how much isn't aligned yet. It also answers the open challenge from both earlier demos: a layout that isn't three columns and isn't one step at a time.

The theme is a patchwork quilt. Every code is a patch, and every disease is a block:

- **The quilt** shows every code at once, one small patch per code, grouped into a block per disease. The blocks sit in three tiers: **Everyday** (roughly the WHO routine-for-everyone list), **Regional & risk** (travel, region, risk group) and **Long tail**, plus **Odds & ends** for codes with no disease recognised (immune globulins, "no vaccine administered" and the like). Combination vaccines get their own block at the top. Within a tier, blocks are ordered by how many NUVA vaccines carry that disease.
- **A patch's look is its status:** bare muslin (not decided), sewn in with the vaccine-type colour (aligned: green abstract, blue real, light blue deprecated), a dark hole (missing in NUVA, `#MISS`), or a cut-out stripe (out of scope, `#NA`). A red `!` flags a mapping to a deprecated or vanished vaccine; a gold dot marks a code changed since import.
- **The big figure** is the one François asked for: *% not aligned yet* (not decided + `#MISS`), with a bar, and a "% done" per tier so you can see the everyday part getting finished before the long tail.
- **Filters cut the attention load:** tier chips, status chips (Not decided, Not aligned yet, Missing in NUVA, Out of scope, Aligned, Needs attention, Changed), a search box, and "Hide finished blocks".
- **Click a block's name** to open it: every code's label as a wide swatch, plus settling all undecided codes in that block at once as `#MISS` or `#NA` (with undo). This suits blocks like *Odds & ends*.
- **Click a patch** and the **sewing table** slides in from the right, on top of the quilt, sized for a laptop. The quilt stays visible on wide screens. You can start from whatever you know: **Antigens** (the valence tree, narrowed by default to the families the code's label points at), **Vaccine name** (abstract NUVA vaccines) or **Brand / product** (real vaccines). The label's words are buttons that fill the search. Picking a candidate shows the code's description, the vaccine's description and its valences' full descriptions, stacked. Every decision button gives the plain term first and the quilt word second: **Align CVX-03 → VAC0130** *(sew it in)*, **Missing in NUVA `#MISS`** *(leave a hole)*, **Out of scope `#NA`** *(cut it out)*. After a decision, the next undecided code *in the same block* comes up. When the block is done, the table closes.
- **`#MISS` offers a request.** After marking a code missing, you can describe what NUVA would need: a new vaccine combining antigens NUVA already has, a new antigen, or "not sure". You can add a description, why, and references, either as a new request or onto an existing one. Or skip it. The **Requests for NUVA** sheet lists them all and can be edited.

### How codes find their block

NUVA has no disease concept, so the blocks are built here. A disease is one or more top-level families of the antigen (valence) tree. An aligned code goes in the block of its vaccine's valences. An undecided code is placed **from its label words** (English, French and scientific names, e.g. "Streptococcus pneumoniae") or, failing that, from a **brand name** that matches the first word of a NUVA product label (e.g. "Hiberix", "Dukoral"). A carrier protein ("diphtheria toxoid conjugate") is ignored. This only sorts codes into blocks; it never proposes an alignment. Checked against the published files, the label-only placement agrees with the real mapping's block for 256/261 CVX, 203/208 SNOMED-CT, 531/561 CTI-EXTEND, 280/281 CIS and 87/91 ATC codes.

The tiers and the disease list are this prototype's proposal (`DISEASES` and `TIERS` in `quilt.js`), not anything NUVA defines. What "most common" should mean is still an open question for François.

## What it deliberately is not

- **Not a workflow tracker.** There's no per-code status beyond the alignment file's own values, no confidence, no assignee, no "sent to IVC" state. Requests are something you *write* and can choose to export, not something the tool tracks to resolution.
- **Not a one-code-at-a-time tool.** You can still align a single code end to end, but the screen is built around the whole set.
- **No automated matching.** Placement in a block and the label-word buttons only narrow what you look at. Candidates come from antigens you pick or names you type.
- **Not a full editor.** No vaccine/valence editing, no Unit files, no reverse or transcription maps, no merge on re-import. The main editor still does all of those.
- **Not a fix for anything in the main editor**, whose files are untouched.

## Files it reads and writes

- **Reads** `../data/nuvadata.json`, the same published dataset the site serves.
- **Imports and exports** the standard alignment CSV (`docs/documentation/tools/f_alignment.md`) unchanged: header cell = code system ID, `CSID-` prefixed codes, `VACnnnn` / `#NA` / `#MISS` (`#MIS` is read as `#MISS`), UTF-8 with BOM, header `<CSID>,NUVA,<CSID> label, NUVA label`, labels quoted with embedded quotes doubled, exported as `<CSID>2nuva_YYYY-MM-DD.csv`. Every file in `Alignments/` was parsed, exported, and checked against the main editor's own `parseCSV` with no differences.
- A blank NUVA column on import means **not decided**. The format has no such value, so undecided codes are **exported as `#MISS`**, and the export sheet says how many.
- **Exports a new file, the request package** (`<CSID>-nuva-requests_YYYY-MM-DD.json`), proposed by this prototype as the "formal package of requests for new NUVA content" in Nathan's design targets. Nothing else in NUVA reads it yet. The same content can be shown as plain text for an email. Format `nuva-content-request-package`, version `0.1`:

  ```
  { format, formatVersion, createdAt, createdWith, nuvaVersion,
    codeSystem: { id, alignmentFile, codes },
    submitter: { name, organization, contact },          // optional, typed in the Requests sheet
    requests: [ { id: "CVX-REQ-001",
                  kind: "new-vaccine" | "new-valence" | "unsure",
                  title, missing, rationale, references: [url...],
                  existingValences: [ { id, shorthand, label } ],   // antigens NUVA already has that it would combine
                  codes: [ { code, label, inAlignmentFileAs } ],    // the codes waiting on it
                  createdAt } ],
    notYetDescribed: [ { code, label } ],   // every other #MISS code, so nothing missing from NUVA is left out silently
    undecided: n }                           // codes not looked at yet (written as #MISS in the CSV, but not claimed missing)
  ```

  It is self-contained, so IVC can read it without the alignment file. It's tied to the alignment file by name, and to the NUVA data version it was made against.
- Work in progress (rows and requests) is kept in `localStorage` under its own key, `quilt.work.v1`. It never reads or writes the main editor's `vaccines` / `valences` / `CSData` / `context` keys.

`samples/` holds `CVX2nuva.csv` (copied unchanged from `Alignments/`) and `CVX-unaligned.csv` (the same codes and labels with the NUVA column blanked, for the from-scratch flow). The same two samples are used by every prototype, and both are offered on the start screen.

## Running it

Static files, no build step. It must be served over HTTP, because browsers block the data fetch from a `file://` page.

- **Tomcat (as used for the main editor):** copy this folder to `webapps/NUVA/prototype-quilt/` alongside the deployed `docs/` contents and open `http://localhost:8080/NUVA/prototype-quilt/`.
- **Any static server** run from `docs/`, e.g. `python -m http.server 8000` in `docs/`, then open `http://localhost:8000/prototype-quilt/`.

Keys, with the sewing table open: `Enter` aligns to the picked candidate, `M` = `#MISS`, `X` = `#NA`, `←` / `→` move through the block, `Z` undoes, `Esc` closes the table (or a sheet, or a focused block).
