# Open Questions / Inconsistencies

Consolidated from `francois-requirements.md` and `nathan-requirements.md` so they're easy to scan and bring up repeatedly, rather than buried inline. Organized loosest-to-most-specific. Mark items resolved with a date and a one-line answer rather than deleting them - the history of what was asked and when is useful.

## Big picture

- [ ] Does François see governance/ownership/process (who's accountable for an alignment, how it's reviewed, how staleness is tracked) as IVC's job, deliberately kept separate from his tool - or has he just not gotten to it yet? His "neutral tool" email reads like a deliberate stance, but worth confirming directly rather than assuming.
- [ ] What does he actually picture for the Organisation section of the documentation site (`end_user.md`, `ivc.md`, `tools_provider.md`, `alignment_contributor.md`)? It's the closest thing he's sketched to governance/roles, but it's still unwritten (status Void).
- [ ] Is NUVA-as-a-program-under-a-broader-IVC-web-presence a direction he'd be receptive to, or does he see NUVA and IVC as effectively the same thing right now?

## Process / workflow

- [ ] Who's actually accountable for defining the structured alignment metadata (owner, description, references, revision date) and mandating owners for alignment files? Currently an unowned item under "IVCI" in his TBD list - natural thing for Nathan to volunteer for directly, now that the repo question (below) is settled.
- [ ] Should there be a "historical" status for globally-obsolete vaccines, and does that belong in NUVA core or in each country's own layer? (His own open question.)
- [ ] What does "IVC approval" gatekeeping of a NUVA build actually look like in practice today - is it just François personally reviewing submissions, or is there any process around it? Relevant now that the long-term submission model (local experts align, submit, gatekept build) is confirmed.
- [ ] What's the actual status/timeline of NUVA's publishing authority moving from SYADEM to this project? Affects how much the "Unit files as source of truth" architecture can be relied on as complete today.
- [ ] How does the valence technology-type hierarchy (separate from the valence parent/child hierarchy) actually factor into matching during an alignment - is it used as a cross-check, or mainly descriptive/informational?

## Tool / implementation

- [ ] `context` (current vaccine/code) persists indefinitely in `localStorage` with no expiry or visible staleness indicator - is this a known, accepted tradeoff, or has he not hit the failure mode yet? (It's exactly how the "Map to current vaccine" bug surfaced in testing.)
- [ ] His Sept 20 email calls the Code Systems workflow "a bit clumsy" even describing the version he'd just finished building. What specifically still feels clumsy to him, after the shared-context addition (built the same day)? Don't assume that change fully addressed his own concern.
- [ ] `#MISS` (NUVA concept should exist but doesn't) has no formal counterpart for "this was valid but NUVA deprecated the target since" - relates to the historical-status open question above.
- [ ] How much of "edit the proprietary SYADEM tooling to use Unit files" (his own TBD item, SYADEM technical team) is actually done? Affects how much the stated Unit-files-as-source-of-truth transition can be trusted as complete today.

## Resolved

- [x] **2026-10-06** - Should alignment files live in the GitHub repository, or only be referenced from each code-system owner's own publication? **Agreed: keep them in the NUVA repo.** Long-term model: local experts do their own alignment and submit it for inclusion in a future NUVA build; builds are gatekept by IVC approval (currently François personally).
