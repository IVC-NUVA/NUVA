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

Not on this branch at all - pushed straight to `main`, already merged/live:

- **`094f61ed` "Add edition of external code systems"** (2026-09-20, same day as his "I reused the idea..." email) - the real version of the idea he abandoned on this branch. Large change: `extcode.js`, `common.js`, `vaccines.js`, `valences.js`, `extcodes.html`, `vaccines.html`, `valences.html`, `styles.css`. Builds a full workflow directly into the existing Code Systems/Vaccines/Valences tabs:
  - Import a direct map (e.g. `cvx2nuva.csv`) into the Code Systems tab.
  - Selecting an unmapped code shows it as a tag in the sidebar (hover for description, same pattern as valence/vaccine tags).
  - Switch to Valences, select valences, assign to filter.
  - Switch to Vaccines, find the matching abstract vaccine; clicking it also assigns it to "Current vaccine" in the sidebar.
  - Back in Code Systems, an "Map to current vaccine" action in the Edit box completes the mapping.
- **`623d5898` "Add action 'Assign current code' in vaccine edition box"** (2026-09-30) - he went ahead with the symmetric button he was unsure about in the Sept 20 email.

This duplicates a meaningful slice of what the Alignment Workspace was designed to do (UC-4/UC-5 in the requirements doc - valence-first review and exact-match detection), but with no separate storage, no status/confidence/request tracking, and no reconciliation - consistent with his stated "neutral tool" philosophy.

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
- Documentation structure: what does he want from Nathan for the "NUVA documentation structure.docx" outline before the mid-October meeting, and is there anything in the Alignment Workspace requirements/review docs that should feed into it?

## Notes from François's emails

(see Timeline above - folded in directly rather than kept separate)

## Decisions / next steps

<!-- Fill in after the meeting -->
