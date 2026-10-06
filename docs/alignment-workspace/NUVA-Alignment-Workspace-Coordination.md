# Alignment Workspace Coordination Notes

## Purpose

Working notes to sort out where the Alignment Workspace branch stands and what François and Nathan are each doing, ahead of coordinating directly (meeting / email). This is a living document - add findings from email, meeting notes, and decisions as they happen. It is not a spec; see `NUVA-Alignment-Workspace-Requirements.md` for that.

## The central issue (read this first)

François has built his own, separate in-editor code-system alignment feature directly on `main` (already merged and live), independent of this `alignment-workspace` branch. See "François's parallel work on main" below. There are now two different answers to the same problem:

1. **Nathan's Alignment Workspace** (this branch, not merged): a separate tool with its own workflow - statuses, confidence, provisional valence/vaccine requests, reconciliation against source/NUVA changes, review queue, reports. Opinionated about process.
2. **François's Code Systems editing** (`main`, live): alignment editing folded directly into the existing Vaccines/Valences/Code Systems tabs of the core editor, reusing the existing tag/selection UI. Deliberately process-agnostic - see his Sept 20 email below.

His Sept 20 email says this directly: he sees the tool as "a commodity to create files, neutral towards the processes, like a word processor or a spreadsheet," and that Nathan "tried a different angle." That's the crux to resolve in the meeting: are these two complementary (Workspace handles the messier *earlier* research/triage work; his Code Systems view handles direct, lightweight editing once you basically know the mapping), or is one of them redundant?

## Branch state as of 2026-10-06

- Branch: `alignment-workspace`, PR #1 (draft) against `main`.
- HEAD: `550e7c79` ("Assignment in vaccine view (partial)"), in sync with `origin/alignment-workspace`.
- `main` has moved 58+ commits ahead of the point this branch forked from (`4a40a492`), including François's new Code Systems editing feature (see below) - this branch has not been rebased/merged with any of that yet.
- Nathan's commits (`b830b3af`, `c33137b3`, `371b9d67`): Phase 1 and Phase 2 of the Alignment Workspace tool under `docs/alignment-workspace/`, plus a sidebar nav fix.
- François's commits on this branch (`34e86aad`, `550e7c79`, pushed 2026-09-18): see below.

## What François changed on this branch

### Commit `34e86aad` - "Fetch the reference data online"

Changed `docs/alignment-workspace/import.html` and `index.html` to fetch NUVA reference data from `https://nuva.ivci.org/data/nuvadata.json` instead of the local relative `../data/nuvadata.json`. Stated reason: opening pages via `file://` throws a CORS error against a local file, and fetching from the live site guarantees the latest published NUVA version.

**Inconsistency found:** only 2 of the 5 Alignment Workspace pages were changed. `review.html`, `requests.html`, and `reports.html` still fetch the local relative file.

### Commit `550e7c79` - "Assignment in vaccine view (partial)"

An earlier, apparently **abandoned** attempt at bridging the Alignment Workspace into the Vaccines editor: select an external code in the Workspace, then assign a NUVA vaccine to it from `vaccines.html` via a new "External code" sidebar panel. Mechanism: mirrors the entire workspace object into `localStorage` under key `wsExtCodes`.

**Bug found:** `setExternalCode()` in `vaccines.js` writes the assignment only to the `localStorage` mirror - never to IndexedDB, the actual source of truth the Workspace's own pages read from. An assignment made this way would not appear back in Review. Likely exactly why he labeled the commit "(partial)" - and per his Sept 20 email ("changing the storage for the workspace had too many impacts across your code"), he dropped this approach two days later in favor of the `main`-branch work below. **Probably does not need fixing - likely superseded**, but worth confirming with him rather than assuming.

Smaller issues in this commit: a leftover `console.log(wsExtCodes)` debug line in `common.js`; `extCodeTag()`'s tooltip reads the whole record object instead of `.label`.

## François's parallel work on `main`

Not on this branch at all - pushed straight to `main`, already merged/live. As of 2026-10-06, `main` is 58+ commits ahead of this branch's fork point (`4a40a492`); below is the part relevant to alignment work, reviewed commit-by-commit.

### The Code Systems tab is now a real editor

`extcodes.html` used to be upload-CSV-get-a-result-back. It's now persistent and stateful:

- **Import from CSV** loads an alignment file (e.g. `cvx2nuva.csv`) into an editable table of all codes (code, code label, NUVA code, NUVA label).
- Clicking a code row opens an edit bar at the bottom with one action dropdown: **Map to current vaccine**, **Out of scope** (`#NA`), **Vaccine concept missing** (`#MISS`), **Reset to initial value**, **Close**.
- **Save to CSV** re-exports the working table at any point.
- `Create reverse map` / `Create transcription map` work as before, reading from the live table.
- Filters added later: text filter and a "changed only" filter on both the codes table and the vaccines/valences views (commits `637b3520`, `811da100`, `c474c8e8`, 2026-09-24).

Key commits: `094f61ed` "Add edition of external code systems" (2026-09-20, same day as his "I reused the idea..." email - the real version of the idea he'd abandoned on this branch two days earlier), `5048545c`/`32474fb4`/`1b9bf1c9` cleanup and fixes (2026-09-21/22), `fdb5ea3b`/`18adf4f3` CSV parsing fixes (2026-09-23).

### New shared "context" object links Vaccines / Valences / Code Systems

The real architectural change: the old per-page globals (`selectedValences`, `filter`, `selectedAbstract`) were replaced with one shared `context` object (`currentVaccine`, `currentCode`, plus the old fields), persisted centrally and surfaced in the sidebar of all three core tabs as "Current vaccine" / "Current code" tags.

This is what makes the actual workflow possible: click a vaccine in **Vaccines** -> it becomes "Current vaccine" everywhere -> switch to **Code Systems**, click an unmapped code -> "Map to current vaccine." He debated adding the reverse direction (assign *from* the Vaccines side) in his Sept 20 email, worried about offering two ways to do the same thing, then did it anyway: `623d5898` "Add action 'Assign current code' in vaccine edition box" (2026-09-30), plus `d3dc00bc` "Add display of codes in vaccine edit box" (2026-09-30, shows a `*` marker on a vaccine tag if a code is already associated) and `ec8d8c4f` "Fix marker of vaccines with code" (2026-09-30).

No separate storage, no status/confidence/request tracking, no reconciliation against source or NUVA changes - edits the working table directly. Consistent with his stated "neutral tool" philosophy (see timeline below).

### Alignment file format is now formally documented

`f_alignment.md` (see Documentation site below) specifies the format precisely: 2-4 columns (code, NUVA code, optional code label, optional NUVA label), `#NA` for out-of-scope, `#MISS` for a missing NUVA concept, codes prefixed `CSID-`, deprecated-in-source codes prefixed `#`, export filename pattern `ident2nuva_YYYY-MM-DD.csv`. Useful reference regardless of which tool ends up producing these files.

### Other related main-line changes since the fork point

- `de0ac520` "Add SNOMED-CT alignment file" (2026-09-23) - new `Alignments/SNOMED-CT2nuva.csv`.
- `46685e83` "Add display of versions" (2026-09-24) - shows NUVA version info in the sidebar footer (visible in the deployed Code Systems screenshot: "Version:2026-10-04/WORK / Default:2026-10-04").
- `1cb02de0` "Add some abstract vaccines" (2026-09-24) - ordinary NUVA content growth, unrelated to tooling.
- `dc7d80ad`/`e824bc11` "Deprecated vaccines as a type" (2026-10-04) - data-model change to how deprecation is represented; worth checking whether this affects the Alignment Workspace's own `status == 'deprecated'` checks if that code is ever revived.

This duplicates a meaningful slice of what the Alignment Workspace was designed to do (UC-4/UC-5 in the requirements doc - valence-first review and exact-match detection), but with no separate storage, no status/confidence/request tracking, and no reconciliation - consistent with his stated "neutral tool" philosophy.

## Documentation site (`docs/documentation/` on `main`)

Much further along than the emails alone suggested. ~60 pages across `core/`, `layers/`, `organisation/`, `tools/`, `usage/`, and a hidden `internal/` section, published via GitHub Pages, each page tracked through a frontmatter workflow: `Void -> Draft -> Submitted -> Released` (or back to `Draft` on a "Review -").

**18 pages are already assigned to Nathan (`assignee: NB`)**, most at status **Submitted** (i.e. waiting on his review/transition) - including `tools/ed_codes.md`, `tools/f_alignment.md`, `tools/editor.md`, `layers/alignment_layers.md`, `tools/f_rmap.md`, `tools/f_unitfile.md`, `tools/f_workfile.md`, `tools/f_rdffile.md`, `tools/github.md`, `tools/ed_vaccines.md`, `tools/ed_valences.md`, `tools/ed_files.md`, `internal/publication.md`, `layers/layers.md`, `layers/language_layers.md`, `organisation/end_user.md`, `organisation/ivc.md`, `organisation/tools_provider.md`. 19 pages are assigned `FK` to himself. Current status counts: 15 Submitted, 7 Draft, 15 Void (not started), 1 Released.

`usage/aligning.md` (his own page, status Draft) documents the alignment workflow as he currently sees it: *local browser editor -> align and save -> alignment file -> publish to GitHub*. No separate workspace tool in that diagram - the clearest written evidence of his direction, tying back to "The central issue" above.

`internal/tbd.md` is a live, informally-owned TBD list, organized by person/team (SYADEM medical team, SYADEM technical team, François, Jean-Louis, IVCI). Relevant open items with no current owner, under "IVCI": *"Define a structured description for alignments (owner, description, references and links, revision date, etc.)"* and *"Mandate owners for alignment files"*; also an open question: *"Should we keep the alignment files in the GitHub repository or only reference them from the publications of the code systems owners? Or have both, expressing it in an alignment metadata file?"* These line up closely with the Alignment Workspace requirements doc's code-system metadata model (owner, jurisdiction, source URL, version).

## Timeline from email correspondence

- **Sept 19** - François reviewed the Alignment Workspace branch ("impressive"). Raised questions on his own choices and Nathan's workflow direction. Proposed a call the following week.
- **Sept 20 (Nathan)** - Traveling (HL7, then NIST, DC area) through that week; proposed meeting the following week instead. Flagged that what he'd pushed was "still a rough idea" needing discussion.
- **Sept 20 (François)** - Explained he abandoned the `localStorage` bridge on this branch ("too many impacts across your code") and instead rebuilt the idea directly in the Code Systems tab on `main` (commit `094f61ed`, same day). Walked through the resulting workflow and called it "half satisfied... a bit clumsy" (several tab switches to complete one mapping). Debated adding a symmetric "Assign current code" button on the Vaccines side but worried about offering two ways to do the same thing - noted the Code Systems-side action is still needed regardless, since one real vaccine can have several codes in a given code system. Said for his own work he'd just edit the CSV directly and round-trip it through import/export for NUVA labels, but acknowledged that's not approachable for most users. **Key philosophical point:** considers the tool "a commodity to create files, neutral towards the processes, like a word processor or a spreadsheet" - each code-system owner may have their own quality rules, and he wouldn't want to embed them. Explicitly contrasted this with Nathan's "different angle," to be discussed.
- **Sept 22** - Responding to a gap Nathan had flagged in `NUVA-Usage-Page-Documentation-Proposal.md` (the Usage page isn't oriented enough toward new users), François broadened the point: NUVA is becoming a system with many facets spread across scattered contributions, and needs a common structured documentation site. Plans to publish it via GitHub Pages from markdown (example referenced: `plans.euvabeco.eu`). Started an outline in an online Word doc, "NUVA documentation structure.docx." Proposed everyone keep adding to that list for now, with a meeting mid-October to finalize structure.
- **Sept 25** - Target shape for the final documentation site: `https://nuva.ivci.org/documentation`. Said not to feel constrained by the first pass - easy to restructure later.
- **Sept 29** - Populated some technical pages (tools/formats) and started a hidden internal section. Included an extended version of the publication-flow diagrams Nathan had originally started, now covering initial/current/intended flows: `https://nuva.ivci.org/documentation/internal/publication.html`.
- **Oct 1** - Continuing to populate documentation pages. Pages ready for review are listed at `https://nuva.ivci.org/documentation/internal/status.html`.

## Open questions for François

- **The big one:** how do the Alignment Workspace (this branch) and the new Code Systems editing feature (`main`) relate going forward? Complementary stages of one pipeline, or does one replace the other? His "neutral tool, no embedded process" philosophy vs. the Workspace's opinionated workflow (statuses, confidence, provisional requests, reconciliation, reports) needs a direct answer.
- Is the online-fetch change (`34e86aad`) meant to apply to all 5 Alignment Workspace pages for consistency, or should a local/offline-capable mode be preserved somewhere?
- Confirm the `550e7c79` "(partial)" commit on this branch is abandoned/superseded by the `main` work, so it can be cleaned up rather than finished.
- Is he planning to keep pushing to this same `alignment-workspace` branch, or should work split into separate coordinated branches/PRs from here?
- Any other in-progress or planned changes not yet pushed, on either `main` or this branch?
- Documentation structure: confirm the 18 `assignee: NB` pages are in fact assigned to Nathan (vs. a placeholder), and what "Submitted -> Released" review should look like in practice.
- The unowned `internal/tbd.md` item under "IVCI" (structured alignment metadata, mandated owners for alignment files) looks like a natural fit for Nathan given his terminology/interop background - worth proposing to own it directly.

## Notes from François's emails

(see Timeline above - folded in directly rather than kept separate)

## How Nathan might organize his side of this

Not a decision yet, just a working starting point for the meeting - see Decisions below for what's actually agreed.

- **Treat this branch as a reference, not a competing deliverable going forward.** The requirements doc, the review doc, and the 2 phases of code here captured real ideas (valence-first matching, confidence, provisional NUVA requests, reconciliation, metadata-per-code-system) - but François has made an architecture call (one shared editor, no separate storage/process layer) that this branch doesn't follow. Pushing to merge this PR as-is would mean arguing against a decision he's already acted on twice (the abandoned bridge, then the real `main` implementation).
- **The example fixtures from this branch's working session are worth keeping** (`docs/alignment-workspace/examples/monteluz/...`, `.../us-ndc/...`) - a small fictional country/program alignment scenario and a US-NDC example workspace export. They were never committed; committing them now (even though the tool they were built against may end up superseded) preserves realistic test material that can validate whatever the Code Systems tab becomes next.
- **The 18 assigned documentation pages are already concrete, scoped work** - probably the most direct way to "add value to his vision" today: review them, and where the Alignment Workspace requirements doc has more precise language (e.g. the alignment-file format rules, the exact-match semantics), fold that into his pages rather than maintaining a separate spec.
- **The unowned alignment-governance TBD item** (structured metadata/ownership for alignment files) is squarely in Nathan's domain background and currently has no owner - a good concrete thing to volunteer for in the meeting, and it reuses the code-system metadata model already designed in `NUVA-Alignment-Workspace-Requirements.md` section 7.2.
- **Mine, don't rebuild:** where this branch's workflow ideas (statuses, confidence, missing-valence/vaccine requests) still seem valuable, propose them as scoped additions to the Code Systems tab rather than resurrecting the Workspace wholesale - e.g. "should mapped-but-uncertain codes get a confidence marker" is a much smaller ask than "should we run a second tool with its own database."

## Decisions / next steps

<!-- Fill in after the meeting -->
