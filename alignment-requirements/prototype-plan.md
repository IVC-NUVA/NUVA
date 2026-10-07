# Prototype Plan

The brief for whoever (or whichever agent) actually builds the prototype explorations. Read this first, then the required reading below, before writing any code.

## Required reading, in order

1. `francois-requirements.md` - the broad-overview requirements, with his stated philosophy and open questions.
2. `francois-system-detailed-inventory.md` - the detailed, behavior-level reference. **Do not design from memory or assumption** - this document exists specifically so nothing current gets silently dropped.
3. `nathan-requirements.md` - what the system needs to do, independent of implementation.
4. `open-questions.md` - what's still genuinely unresolved.
5. `demo-reports/` - one report per demo already built: what it focused on, the reviewer's reaction, and an open challenge for the next ones. Read these before choosing a direction. Build on what worked, and don't repeat what the reviewer found didn't.

The inventory describes `main` at commit `02b1c87a`. `main` keeps moving (e.g. `a6d81645` "Minor bug fixes", touching `extcode.js` only), so diff `02b1c87a..origin/main -- docs/` before relying on code-level details.

Do not skip the detailed inventory to save time. It contains specifics (the exact data model, the valence-type hierarchy, the file formats) that are easy to get subtly wrong from memory.

## What this is

Several small, deliberately different prototype explorations of the NUVA alignment workflow - built to be reacted to, not a single proposal to agree or disagree with. See `francois-requirements.md` section 5 and `open-questions.md` for the underlying tension they're meant to test: François's stated "neutral tool, no embedded process" philosophy versus the more opinionated workflow (status, confidence, tracked requests, reconciliation) the original Alignment Workspace branch was reaching for. Build toward making that tension concrete and discussable, not toward resolving it in advance.

## The spirit: student projects, not corporate products

Treat each demo like a team's entry in a school project, where every team wants to stand out from the others. The reviewer should open a new demo and immediately feel it's **a different idea from the one before**, not a re-skin of it.

- **Give it flair and a personality.** A strong concept, a theme, a metaphor carried all the way through: its name, its look, its wording, how it moves. Memorable beats polished. A bit cheesy is fine, even welcome, if it makes the idea stick ("the one that felt like a card game", "the one with the detective's case board").
- **No cookie-cutter solutions.** Don't default to the tidy, neutral, corporate dashboard look (navy header, grey panels, a table, a toolbar). Loupe already sits closest to that, so it's the look to move away from.
- **Different in kind, not in degree.** Change the layout, the interaction, or the way of thinking about the task, not just the colors. Read `demo-reports/` and ask: "what would make the reviewer say *that's nothing like the last one*?"
- **The flair serves the idea.** The personality should make the demo's position on its axis easier to feel and remember. It isn't decoration on top of a standard layout.

What doesn't bend for flair: the hard constraints below, the real NUVA data, the file-format compatibility, and the core loop being genuinely usable for a few minutes of real clicking. A memorable demo that can't actually align a code has missed the point.

## Hard constraints (non-negotiable, apply to every prototype)

- **Static, serverless, browser-local.** No backend, no build step required to run it, no account system. Plain HTML/CSS/JS served as files - this reflects real infrastructure limits, not just a style preference.
- **Must coexist with, not fight, the existing local-editing/distributed-solution story.** Should work the same way the current editor does: open a page, data loads from a JSON file, edits live in browser storage until exported.
- **Interoperate with the existing file formats**, documented precisely in `francois-system-detailed-inventory.md` section 7 - the alignment CSV convention (`#NA`/`#MISS`, `CSID-` prefixing), the reverse/transcription map columns, the Unit file format. A prototype can look completely different; it should still be able to produce/consume the same files the rest of the NUVA tooling expects.
- **Do not modify any of François's existing files** (`docs/scripts/*.js`, `docs/*.html` at the repo root, `docs/documentation/`). Each prototype is fully self-contained in its own folder.
- **Do not fix the three bugs found during the detailed review**, or the earlier "Map to current vaccine" bug. They're not in scope here - noted in the inventory doc for later, separately.

## Choosing what each prototype explores

Don't default to re-skinning the current UI. Each prototype should take a genuinely different position on an axis that's actually in tension, not a cosmetic variant. Starting menu of candidate directions, derived from what's already been gathered - pick 2-3, or substitute a stronger idea if the reading surfaces one, but keep them genuinely divergent from each other:

**A. Single-screen, no tab-switching.** *(Built 2026-10-06 as `loupe` - draft PR #2; see `demo-reports/loupe.md`. Review verdict: the matching flow and short valence descriptions worked well, but the three-column layout needs a big screen and shows a lot at once. The next demos should explore a different layout as well as a different position.)* François described his own current workflow as "a bit clumsy" even after adding the shared-context object - it still requires moving between Vaccines, Valences, and Code Systems tabs to complete one mapping. Explore collapsing the whole align-one-code task (see description, browse/search valences, see candidate match, confirm) into a single focused screen. Worth incorporating Nathan's differential-valence-description idea here (full description preserved, plus a short "how this differs from its parent" form for fast tree scanning) - see `nathan-requirements.md` section 9.

**B. Minimal, process-free, file-first.** Lean as close as possible into François's own stated philosophy - no status field, no confidence, nothing that looks like embedded process - but pair it with a genuinely well-designed, metadata-rich alignment file format (owner, date, references - see the unowned "structured alignment metadata" item in `open-questions.md`). Tests whether "neutral tool + a better file format" can satisfy the governance need without putting process in the UI at all.

**C. Guided, with tracked status.** *(Built 2026-10-07 as `passport` (Passport Control) - draft PR #3; see `demo-reports/passport.md`. Review verdict: one thing at a time on a laptop-width screen worked, and so did petitions as a sign that an alignment needs escalating; the antigen step only made sense after it was rebuilt as a real tree with search-in-context.)* The other end of the spectrum, done properly this time: per-code workflow status, confidence, and missing-NUVA-content tracked as a first-class thing - the capability the original Alignment Workspace branch was reaching for - but redesigned using everything since learned (valence-first matching with fast description access, the differential-description tree idea, the real data model). This is not a resurrection of the old branch's code - build it fresh, informed by the inventory, not by copying `docs/alignment-workspace/`.

Each prototype's own README (see below) should state plainly which axis it's taking a position on and what it's deliberately not trying to be.

## Mechanics - how each prototype gets delivered

All prototypes live together on one long-lived branch, **`prototypes`**, in the NUVA repo (`https://github.com/IVC-NUVA/NUVA`). It started from `origin/main` with `prototype-loupe` and `prototype-passport` merged in, so every demo runs side by side from one checkout. This folder (`alignment-requirements/`) is on that branch too, so the whole process can be picked up from any machine or a remote session with nothing but a clone. (Loupe and Passport were first built on their own branches with separate draft PRs, #2 and #3. That's history now: new demos don't get their own branch or PR.)

For **each** new prototype:

1. `git fetch`, then work on **`prototypes`**, up to date with `origin/prototypes` (`git checkout prototypes && git pull`). Don't branch off `main` or `alignment-workspace`.
2. Pick a short, memorable, evocative one-word codename - not a literal description (e.g. `loupe`, not `single-screen-no-tabs`). Easy to say in conversation and clearly distinct from the others. Codenames used so far: **`loupe`** (prototype A, single screen), **`passport`** (prototype C, guided with tracked status).
3. All files live under `docs/prototype-<codename>/` - fully self-contained (its own HTML/CSS/JS), deliberately named differently from `docs/alignment-workspace/` so the two are never confused.
4. Include a short `README.md` inside that folder: what question this prototype is exploring, what it's deliberately not trying to be, and how to run it (static files, no build step). See "Conventions" below for the section layout.
5. Add it to the starting page, `docs/prototypes/index.html`: one entry at the end of the `PROTOTYPES` list in its script (name, folder, storage key prefix, report file, direction, date built, the question it explores, a one-sentence summary).
6. Commit to `prototypes` and run it (see "Testing and deployment"). Don't push yet.
7. **Stop and ask Nathan for his reaction.** Tell him how to open it and what to try, then ask what worked and what didn't. Wait for his answer - don't guess it and don't skip this step.
8. **Write the demo's report** in `alignment-requirements/demo-reports/<codename>.md`, following `demo-reports/README.md`, with his reaction in it (in his words, nothing added), and add it to that README's table. Update `TODO.md` and the direction's entry above. **The report with his reaction is the deliverable** - it's what the next demo learns from.
9. Commit the report and push `prototypes` to `origin`.

Then, and only then, move on to the next demo.

## Conventions established by the first prototype (`loupe`)

The first prototype (`docs/prototype-loupe/` on branch `prototype-loupe`, draft PR #2) set these. Follow them so the demos stay comparable. Use Loupe as the reference for **mechanics only, not design** - each prototype should still look and behave differently.

**Data and storage**
- Fetch the NUVA data from `../data/nuvadata.json` (relative to the prototype folder). Don't copy the 440 KB dataset into the prototype; this path works both on the local Tomcat deployment and on GitHub Pages. (The existing editor fetches from `https://nuva.ivci.org/data/nuvadata.json` instead - don't copy that.)
- Keep work in `localStorage` under keys prefixed with the codename (e.g. `loupe.work.v1`). **Never read or write the main editor's keys** (`vaccines`, `valences`, `CSData`, `context`) - every prototype shares one origin with the deployed editor and with each other. Wrap storage access in try/catch.
- On a `file://` load the fetch fails; show a message saying to serve over HTTP rather than a blank page.

**Sample alignment files**
- On `main`, alignment CSVs live in the **repo-root `Alignments/`** folder, which the website doesn't serve. (`docs/alignments/` only exists on the `alignment-workspace` branch - don't use it.)
- Put the same two samples in `docs/prototype-<codename>/samples/` so every demo can be tried on identical input: `CVX2nuva.csv` (copied unchanged from `Alignments/` on `origin/main`) and `CVX-unaligned.csv` (the same codes and labels with columns 2 and 4 blanked, for the "align from scratch" flow). Offer both from the empty/start state.

**Alignment CSV format** - decisions already made where François's spec (`f_alignment.md`) and code disagree:
- Write `#MISS` (code and data use it; the doc says `#MIS`). Read both.
- Export filename `<CSID>2nuva_YYYY-MM-DD.csv` with an underscore (per the doc; his code uses a hyphen).
- UTF-8 with BOM; header exactly `<CSID>,NUVA,<CSID> label, NUVA label` (including the space, as his export writes it); labels quoted, embedded quotes doubled.
- Blank column 2 on import = "not decided yet". The format has no such value, so **undecided codes export as `#MISS`** (what François's importer turns them into anyway), and the UI says how many. Prototype B is the exception if its axis is the file format itself - it may introduce new values or metadata, but its README must say so and the output must still load in François's editor.
- **Round-trip test:** before committing, parse every file in `Alignments/` with the prototype, export it, and feed the result to François's own `parseCSV` (from `docs/scripts/extcode.js`, run in Node). It must report zero differences from parsing the original.

**UI behavior**
- Every action that writes a mapping must name both codes on the control itself (e.g. `Align CVX-03 → VAC0130`), and selecting a new code must reset the candidate. Never carry a vaccine over from an earlier selection - that's how the "Map to current vaccine" bug happens in the existing editor.
- Keep the existing editor's colors for vaccine types (abstract green, real blue, deprecated light blue) so tags read the same across tools.
- Flag alignments whose target vaccine is deprecated or missing in the current data. This is cheap and catches real cases: one SNOMED-CT and two ATC mappings on `main` point at deprecated vaccines.
- Don't use native `alert()`, `confirm()`, or a modal `<dialog>`. They block or don't respond to the browser-automation testing; use a plain in-page overlay.
- Differential valence descriptions (Nathan's idea) are derived automatically, since NUVA has no field for them. If a prototype shows them, reuse Loupe's approach (strip the parent label's `, `-separated phrases from the child label, falling back to the full label) and label them as auto-derived.

**Testing and deployment**
- Simplest, and works anywhere including a remote session: run `python -m http.server 8000` in `docs/`, then open `http://localhost:8000/prototypes/` (the launcher) or `http://localhost:8000/prototype-<codename>/`.
- On Nathan's machine you can also deploy to Tomcat: copy the folder to `C:\Program Files\Apache Software Foundation\Tomcat 10.1\webapps\NUVA\prototype-<codename>\` (and `docs/prototypes/` to `...\NUVA\prototypes\`), then open `http://localhost:8080/NUVA/prototypes/`.
- Click through the whole loop in a real browser: import a sample, find a candidate, align, `#MISS`, `#NA`, undo/reset, reload (work persists), export. Check export contents in the page instead of triggering real downloads.
- Don't commit files that were already untracked in the checkout before you started.

**README sections** (same order in each prototype): title line naming the codename; a bold opening sentence that it's one of several explorations, not a recommendation; "The question it explores"; "What it deliberately is not"; "Files it reads and writes" (data source, CSV conventions, undecided-code handling, storage key, samples); "Running it" (Tomcat path and a `python -m http.server` alternative, plus keyboard shortcuts if any).

**Commits**
- One commit (or a few) for the prototype, touching only `docs/prototype-<codename>/` and the launcher page. Then a separate commit for the report and the doc updates in `alignment-requirements/`. End commit messages with the agent's co-author trailer.
- No pull requests. `prototypes` is a workspace for demonstrations and is not expected to ever be merged into `main`.
- Push only after Nathan has given his reaction and the report is written (steps 7-9 above).

## What "done" looks like for one prototype

Small and honest, not a full rebuild of the editor:
- Covers the core align-one-code loop end to end (import or receive codes, pick/search valences, see a candidate match or lack of one, confirm or flag it, export something usable).
- Doesn't need to cover every corner of the current tool (reverse maps, transcription maps, vaccine/valence creation) unless that's central to the axis being tested.
- Should be genuinely usable for a few minutes of real clicking, not a static mockup - the point is to react to something working, per how François himself validated the original proposal.
- Keep it disposable. If it takes more than a few days, it's grown beyond what this exercise needs.
