# TODO - Requirements Extraction Process

## Done

- [x] Review François's Code Systems / Vaccines / Valences editor code (`extcode.js`, `common.js`, `vaccines.js`, `extcodes.html`, `vaccines.html`) on `main`.
- [x] Review François's documentation site (`docs/documentation/` on `main`) - structure, the 18 pages assigned to Nathan, the Organisation section, `internal/tbd.md`.
- [x] Review the email correspondence Sept 19 - Oct 1 (branch coordination doc has the full timeline).
- [x] Reproduce and root-cause one concrete bug ("Map to current vaccine" with no current vaccine set) - logged on the branch, not here, since it's a bug report not a requirement.
- [x] First-pass draft of `francois-requirements.md` from the above, with why/open-questions called out.
- [x] First-pass draft of `nathan-requirements.md`, reshaping the branch's `NUVA-Alignment-Workspace-Requirements.md` + the IVC vision doc into implementation-independent requirements.
- [x] First-pass `open-questions.md` consolidating both.

## Done (continued)

- [x] Requirements-gathering call with François (2026-10-06). He appreciated the original proposal (for provoking new thinking, not for being right); demonstrated his actual alignment process live; resolved the alignment-file-location question (keep in repo); clarified NUVA's two roles (official code/valence publisher, taking that role over from SYADEM, plus the alignment tool); confirmed he's receptive to the demo-prototypes plan.
- [x] Fold the call's findings into `francois-requirements.md` (section 8), `nathan-requirements.md` (sections 9-10, Nathan's own ideas raised live), and `open-questions.md` (one resolved, several new ones added).

## Done (continued, 2)

- [x] Systematic, behavior-level read-through of the actual running code (`common.js`, `vaccines.js`, `valences.js`, `extcode.js`, `nuvafiles.js`, all four HTML pages) and the relevant file-format documentation pages, cross-validated against each other. Written up in `francois-system-detailed-inventory.md`.
- [x] Live-verified three previously-unknown bugs surfaced by that review (beyond the one already on the branch): "Assign selected valences" is completely broken, "Use selected as Parent" throws when nothing's selected, "Create reverse map" silently drops abstract vaccines. All three share one root cause - an incomplete field/variable rename during the `type` and `context` refactors in September. Logged in the inventory doc's "Known defects" section, not yet ported to the branch's issue tracking or reported to François.

## Next

- [ ] Decide whether/when to add the three newly-found defects to the NUVA repo branch's `NUVA-Alignment-Workspace-Coordination.md` "Known issues" section (consistent with how the first one was handled) - currently sitting only in this private folder.
- [ ] Revisit `nathan-requirements.md` sections 6/8 (the IVC-process framing) in light of what François said about NUVA's two roles and the submission/gatekeeping model - does the framing still hold as stated, or need adjusting now that there's a confirmed real process (submit -> IVC/François gatekept build) rather than a hypothetical one?
- [ ] Chase the still-open questions in `open-questions.md` as they come up naturally (not necessarily another dedicated meeting) - the SYADEM handoff timeline and the valence-type-hierarchy role in matching are probably worth asking about soon rather than late.
- [x] Identify candidate axes and write up the full build plan - see `prototype-plan.md` (required reading order, hard constraints, three candidate divergent directions, branch/folder/PR mechanics).
- [ ] Build 2-3 prototypes per `prototype-plan.md`. Each: own codename, own folder (`docs/prototype-<codename>/`), on the shared `prototypes` branch.
  - [x] 1 of 3: `loupe` (direction A, single screen) - built and reviewed 2026-10-06, draft PR #2 opened 2026-10-07. Conventions it set are recorded in `prototype-plan.md` so the next ones match.
  - [x] 2 of 3: `passport` (Passport Control, direction C, guided with tracked status) - built and reviewed 2026-10-07, draft PR #3.
  - [x] 2026-10-07: changed the process. Created the `prototypes` branch (off `origin/main`, with `prototype-loupe` and `prototype-passport` merged in, plus a launcher page at `docs/prototypes/index.html`), and moved this folder into it as `alignment-requirements/`. Future prototypes are committed and pushed straight to `prototypes`, with no per-prototype branch or PR. `prototype-plan.md` and `agent-prompt.md` are updated to match.
  - [x] 2026-10-07: François's email reaction to Loupe and Passport, summarized into `francois-requirements.md` section 9, both demo reports, `open-questions.md` (five new items), and `prototype-plan.md` (his feedback in short, plus a new direction D, triage the whole code system, drawn from it).
  - [x] 3 of 3: `quilt` (direction D, triage the whole code system) - built and reviewed 2026-10-07, see `demo-reports/quilt.md`. Nathan's favourite so far; keep the disease tiers and "most common first". Its align panel is too cramped (a wider, possibly three-column align view is the suggested next step, not made yet). Also proposes a request-package file format (`nuva-content-request-package` v0.1).
  - [x] Send Quilt to François for his reaction, alongside Loupe and Passport.
  - [x] 2026-10-08: François's email reaction to Quilt, recorded in `francois-requirements.md` section 10, `demo-reports/quilt.md`, `open-questions.md` and `prototype-plan.md`. "Really brings something new"; the editing panel is too crowded (as Nathan found); classical combinations like MMR deserve their own blocks; proposes drilling down from abstract vaccines above a threshold of descendants.
  - [ ] Get François's reverse NUVA tree (he said he'd try to create and share it on 2026-10-08), and add it to the background docs.
- [x] 2026-10-07: closed draft PRs #2 and #3 unmerged, each with a comment that the work continues on `prototypes`, a branch not expected to ever be merged into `main`.
- [ ] Bring the prototypes back to François as things to react to, not a single proposal to agree or disagree with.

## Notes on process

- Keep "distilled from his code/docs" separate from "what he told us directly" in `francois-requirements.md` - code reveals requirements but code also has bugs and dead ends; what he says is a more direct signal, but conversations also get compressed/simplified. Both are useful, worth not conflating.
- This folder was a plain Dropbox-synced folder until 2026-10-07. It's now version-controlled on the `prototypes` branch.
