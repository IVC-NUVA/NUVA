# Alignment Requirements — Working Notes

## What this is

A private working space for compiling and reasoning about requirements for NUVA code-system alignment - distinct from the NUVA project repository. This is Nathan's own analysis instrument: distilled requirements gleaned from François's work, Nathan's own requirements independent of any one implementation, and the open questions/inconsistencies worth raising. Not committed to the NUVA repo, not an official project artifact - a place to think, before proposing anything.

Started 2026-10-06, ahead of and following a requirements-gathering call with François the same day.

Since 2026-10-07 this folder lives in the NUVA repo as `alignment-requirements/` on the **`prototypes`** branch, alongside the prototypes themselves (`docs/prototype-*/`, launcher at `docs/prototypes/index.html`), so the whole process can be picked up from any clone, including a remote session. It was first kept in Dropbox; this copy in the repo is now the one to edit.

## Files

- **[TODO.md](TODO.md)** - the process checklist for this work. Start here to see what's done and what's next.
- **[francois-requirements.md](francois-requirements.md)** - what François's code, documentation, and emails reveal about his requirements and vision for NUVA, organized by area, with "why" and open questions/inconsistencies called out rather than buried inline.
- **[francois-system-detailed-inventory.md](francois-system-detailed-inventory.md)** - the detailed, behavior-level companion to the above: the actual data model, every screen/action/edge case, and the file-format contracts, cross-validated against François's own tool documentation. Reference this to make sure a new design doesn't drop a capability, even if the structure changes.
- **[nathan-requirements.md](nathan-requirements.md)** - Nathan's own requirements, reshaped to be about what the *system* needs to do rather than a spec for one specific tool implementation.
- **[open-questions.md](open-questions.md)** - the consolidated, scannable list of open questions and inconsistencies from both of the above, meant to be brought back to François repeatedly rather than asked once and forgotten.
- **[prototype-plan.md](prototype-plan.md)** - the brief for building the divergent prototype explorations: required reading order, hard constraints, candidate directions to diverge on, and the branch/folder/PR mechanics for delivering each one into the NUVA repo. Starting point for whoever (or whichever agent) does that work.
- **[demo-reports/](demo-reports/README.md)** - one short report per prototype demo (what it focused on, reviewer reaction, what to reuse, open challenge for the next one), so each new demo can learn from the previous ones.
- **[agent-prompt.md](agent-prompt.md)** - the literal starting prompt to hand a fresh agent to build the first prototype, scoped to stop after one and report back before continuing.

## Where the source material lives

- NUVA repository: `https://github.com/IVC-NUVA/NUVA` (Nathan's local checkout: `C:\dev\nuva\NUVA`)
- The prototypes: `docs/prototype-<codename>/` on the `prototypes` branch - see `prototype-plan.md` and `demo-reports/`
- The `alignment-workspace` branch (Nathan's prototype + coordination notes, PR #1 against `main`, draft): `docs/alignment-workspace/` in that checkout - `NUVA-Alignment-Workspace-Requirements.md`, `NUVA-Francois-Editing-Environment-Review.md`, `NUVA-Alignment-Workspace-Coordination.md`, `NUVA-IVC-System-Vision.md`
- François's live documentation site: `https://nuva.ivci.org/documentation/`
- François's code on `main`: `docs/scripts/extcode.js`, `common.js`, `vaccines.js`, `docs/extcodes.html`, `vaccines.html`

## How this relates to the branch docs

The branch docs (`NUVA-Alignment-Workspace-Coordination.md`, `NUVA-IVC-System-Vision.md`) are status tracking and meeting prep, written to potentially be seen by François since they live on a shared branch. This folder is different in kind: it's meant to hold the more candid "why did he do it this way, here's an inconsistency" analysis that's useful to think with but isn't ready - or appropriate - to publish anywhere yet. Material may move from here into the branch docs (or elsewhere) once it's settled enough to share.
