# Open Questions / Inconsistencies

Consolidated from `francois-requirements.md` and `nathan-requirements.md` so they're easy to scan and bring up repeatedly, rather than buried inline. Organized loosest-to-most-specific. Mark items resolved with a date and a one-line answer rather than deleting them - the history of what was asked and when is useful.

Nathan answered what he could on 2026-10-07. His answers are marked **Nathan, 2026-10-07**. Where he didn't know, the question stays open and is noted as one for François (or the Syadem visit, see 7). His positions are also folded into `nathan-requirements.md` section 11.

## Big picture

- [ ] Does François see governance/ownership/process (who's accountable for an alignment, how it's reviewed, how staleness is tracked) as IVC's job, deliberately kept separate from his tool - or has he just not gotten to it yet? His "neutral tool" email reads like a deliberate stance, but worth confirming directly rather than assuming.
  - **Nathan, 2026-10-07:** not sure yet how governance will be tooled. His preferred model: the tool helps people *prepare* for governance, and governance happens separately. The tool produces **artifacts that go to governance**. People can use the tool without divulging anything, and choose whether to take requests to IVC as a separate step, by saving a file and then uploading or emailing it into that process. That suits a distributed, community-based process. François's own view is still unconfirmed.
- [ ] What does he actually picture for the Organisation section of the documentation site (`end_user.md`, `ivc.md`, `tools_provider.md`, `alignment_contributor.md`)? It's the closest thing he's sketched to governance/roles, but it's still unwritten (status Void).
  - **Nathan, 2026-10-07:** doesn't know. Still one for François.
- [ ] **(2026-10-07, from his prototype feedback)** If "the file formats are the invariants" and tools can vary (`francois-requirements.md` section 9), what exactly is in the invariant set? The alignment CSV, the reverse/transcription maps, a structured NUVA code request, a published NUVA2NUVA map, structured alignment metadata? Who defines and versions each one?
  - **Nathan, 2026-10-07:** not defined yet. This prototyping process could redefine them and propose changes, since nothing is set in stone. The exception: the core NUVA resources (the published data, Unit files, existing alignment files) work operationally the way they are now, and changing those needs discussion first. So prototypes may propose new or richer files, but the current ones must keep working.

## Process / workflow

- [ ] Should there be a "historical" status for globally-obsolete vaccines, and does that belong in NUVA core or in each country's own layer? (His own open question.)
  - **Nathan, 2026-10-07:** questions the framing. Code systems call a code "historical" while thinking only of use *now*, but "now" includes recording historical records, where an old code is the correct value for its time. The better model records **when a concept was active** (an active period). A truly **deprecated** concept is a different thing: one that should no longer be used for any purpose, not even historical records. So it's two ideas, not one status: "active from/to" vs. "deprecated, never use". Where that lives (NUVA core or a country layer) is still open.
- [ ] What does "IVC approval" gatekeeping of a NUVA build actually look like in practice today - is it just François personally reviewing submissions, or is there any process around it?
  - **Nathan, 2026-10-07:** there is no IVC approval process today. Nathan is working on it in a visit to Syadem in about three months (around January 2027), with François and the Syadem team who currently maintain NUVA. The prototypes' request artifacts (see the structured-request question below) are a possible input to that visit.
- [ ] What's the actual status/timeline of NUVA's publishing authority moving from SYADEM to this project? Affects how much the "Unit files as source of truth" architecture can be relied on as complete today.
  - **Nathan, 2026-10-07:** moving to IVC over the next year or so (through about late 2027). In progress, not done.
- [ ] How does the valence technology-type hierarchy (separate from the valence parent/child hierarchy) actually factor into matching during an alignment - is it used as a cross-check, or mainly descriptive/informational?
  - **Nathan, 2026-10-07:** probably just descriptive for now. Might be useful for **filtering** in the future. Not sure.
- [ ] **(2026-10-07)** What would a structured request for a new NUVA code look like as a file, his "possibly" invariant? What fields, where it's submitted, and how it relates to `#MISS` in the alignment file?
  - **Nathan, 2026-10-07:** not sure, and **this is a good thing for the prototypes to work out.** One idea: different prototypes offer different ways of generating requests, and they all end up in one **formal package of requests**. We're free to design it. Passport's petitions are one sketch.
- [ ] **(2026-10-07)** For François's "start everything as `#MISS`, release the most common first" strategy: what defines "most common", and is progress weighted by importance?
  - **Nathan, 2026-10-07:** this is François's strategy, not his. Nathan's own main use case right now: **align local codes to NUVA, and tell the NUVA maintainers clearly what's missing from NUVA** to complete the alignment. What "most common" means is still one for François.
  - **François, 2026-10-08 (reacting to Quilt):** a partial answer. Present the abstract vaccines in NUVA that have more than a given threshold of descendants, and drill down progressively by selecting one, based on his reverse NUVA tree (`francois-requirements.md` section 10). Still open: what counts as a descendant, what the threshold is, and whether progress is weighted.
- [ ] **(2026-10-08, from his Quilt reaction)** How do his drill-down from abstract vaccines and Nathan's disease tiers fit together: tiers as the top level with the drill-down below, the threshold alone, or something else? And how should a whole-set view look for code systems with long identifiers, such as SNOMED-CT?

## Tool / implementation

- [ ] **(2026-10-07)** "Filtering that reduces the attention load", missing in both demos. Both already filter the code list by status and text. Does he mean filtering by disease or vaccine family, narrowing the valence tree to what's relevant to the current code, hiding already-settled codes, or something else?
  - **Nathan, 2026-10-07:** doesn't know. One for François. (Nathan suggests technology type as a possible future filter, above.)
  - **François, 2026-10-08:** not answered directly, but his Quilt reaction points at two kinds: hide the dashboard of all codes once one is selected, and narrow by drilling down from abstract vaccines (`francois-requirements.md` section 10).
- [ ] **(2026-10-07)** Publishing the intermediate NUVA2NUVA reverse map: in which format and where (alongside `nuvadata.json` in `docs/data/`, in `Release/`)? Should it be regenerated with every NUVA build? Fixing the abstract-vaccine reverse-map defect first would matter, since that defect sits exactly at this stage.
  - **Nathan, 2026-10-07:** not sure yet.
  - **François, 2026-10-08:** he'll try to create the "reverse NUVA tree" and share it, as the basis for drilling down from abstract vaccines. Format and location are still open.
- [ ] `context` (current vaccine/code) persists indefinitely in `localStorage` with no expiry or visible staleness indicator - is this a known, accepted tradeoff, or has he not hit the failure mode yet? (It's exactly how the "Map to current vaccine" bug surfaced in testing.)
  - **Nathan, 2026-10-07:** might be an issue, but not critical to answer yet.
- [ ] His Sept 20 email calls the Code Systems workflow "a bit clumsy" even describing the version he'd just finished building. What specifically still feels clumsy to him, after the shared-context addition (built the same day)?
  - **Nathan, 2026-10-07:** doesn't know. One for François. (His prototype feedback, `francois-requirements.md` section 9, may be a partial answer: stepping through codes one by one, and too much to look at without filtering.)
- [ ] `#MISS` (NUVA concept should exist but doesn't) has no formal counterpart for "this was valid but NUVA deprecated the target since" - relates to the historical-status question above.
  - **Nathan, 2026-10-07:** not sure. His active-period vs. deprecated distinction (above) probably shapes the answer: a target that was only active in the past isn't the same as one that's deprecated.
- [ ] How much of "edit the proprietary SYADEM tooling to use Unit files" (his own TBD item, SYADEM technical team) is actually done?
  - **Nathan, 2026-10-07:** not sure. Likely a topic for the Syadem visit.

## Resolved

- [x] **2026-10-06** - Should alignment files live in the GitHub repository, or only be referenced from each code-system owner's own publication? **Agreed: keep them in the NUVA repo.** Long-term model: local experts do their own alignment and submit it for inclusion in a future NUVA build; builds are gatekept by IVC approval (currently François personally).
- [x] **2026-10-07** - Is NUVA a program under a broader IVC, or are NUVA and IVC effectively the same thing? **IVC is the umbrella, and NUVA is managed by IVC** (Nathan).
- [x] **2026-10-07** - Who's accountable for defining the structured alignment metadata (owner, description, references, revision date) and mandating owners for alignment files? **That can be us (Nathan and this work).** It's all greenfield, so the prototypes can propose it.
- [x] **2026-10-07** - What was the third of "all three realizations" in François's email? **His own editor.** "Réalisation" means *implementation* in French: he meant the three implementations, his editor plus the two prototypes (Nathan's reading).
