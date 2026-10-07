# Nathan's Own Requirements

What the *system* needs to do, independent of any one tool's implementation - reshaped from the Alignment Workspace prototype's requirements doc and the IVC system-vision draft, stripped of implementation detail (status enums, button labels, IndexedDB) so it can be compared fairly against what François's approach does and doesn't cover.

This is a first pass. Expect it to change after the 2026-10-06 call and as the prototype-comparison work progresses.

## 1. The problem before the file exists

A code system doesn't arrive pre-aligned. Someone has to go from a raw list of codes to a finished mapping, and that process is where the real work and the real risk of error live - not in editing an already-mostly-correct file. The system needs to support that earlier, messier stage: understanding what each code means (valence-first, the same mental model François's tool already uses), finding the matching NUVA concept, and - critically - knowing what to do when no match exists yet.

## 2. Nothing should get silently lost

Three different flavors of this, all load-bearing:
- A decision someone already made (a confirmed mapping) should never be silently overwritten by re-importing a file, upgrading NUVA, or any other update - it should be flagged for review, not replaced.
- Work that's genuinely stuck (missing NUVA content, insufficient source information, needs another reviewer) needs to stay visible and trackable, not disappear into a spreadsheet nobody revisits.
- When NUVA itself changes under an existing alignment - a valence or vaccine gets deprecated or removed - that needs to surface as something requiring attention, not fail silently or require someone to notice by accident.

## 3. Missing NUVA content is a first-class, trackable thing

When an alignment reveals NUVA genuinely needs a new valence or vaccine combination, that shouldn't be a side note in a comment field. It needs: a record of what's being proposed and why, which source codes are waiting on it, a status, and a way to mark it resolved once the real NUVA code exists - so it's not lost between the moment it's noticed and the moment NUVA actually gets updated.

## 4. The work product needs to be portable and durable

Whatever holds the in-progress state of an alignment needs to survive: closing the browser, switching computers, handing the work to someone else, and NUVA publishing a new version in the meantime. It can't only exist in one browser's local storage.

## 5. Visibility across more than one alignment at a time

Not just "is this one file done" - across all the code systems IVC cares about: which ones have an alignment at all, who owns each one, how stale each one is relative to the current NUVA version and the current source system version. This is squarely an IVC-level need, not a single-file editing need - see the IVC-process framing below.

## 6. The alignment process is an IVC business process, not just an editor feature

Reframed from the vision doc: a country or program brings a code system; someone owns aligning it; the alignment gets produced; it gets reviewed and published with real provenance (owner, date, references); and over time, as either side changes, it needs to be revisited rather than left to quietly rot. Only the "produced" step is really an editor feature. The rest - ownership, review, publication, staying current - is organizational infrastructure that IVC needs regardless of which tool does the editing.

## 7. Hard constraints shared with François's direction (not up for debate)

- Static, serverless, browser-local. No backend to run, no account system. This isn't a preference - it reflects real resource limits and is also what makes the tool usable by contributors without any technical setup.
- Needs to interoperate with the existing alignment file format and the existing reverse-map/transcription-map tooling, not replace it wholesale.

## 8. Genuinely open, not yet resolved even in Nathan's own thinking

- Does the tracking in sections 2-5 need to live *inside* whatever editor is used, or can/should it live in separate IVC-side infrastructure that references the same alignment files? The vision doc raises this; it's not answered here.
- How much of this is actually needed for the *first* country/code-system IVC handles under a more formal process, versus something that only starts to matter once there are many alignments to track at once?

## 9. New idea raised in the 2026-10-06 call: differential valence descriptions

The valence tree is hard to read today because every valence's full description restates the same boilerplate as its parent, differing only slightly. Idea: keep the full description (needed for the description-driven matching workflow - see `francois-requirements.md` section 8), but add a second, short description that states only how this valence differs from or modifies its parent. A tree view could show the short form by default, making it far more scannable, while the full description stays available on hover (matching the existing tooltip pattern) for the actual matching decision.

Not yet tested or prototyped. Candidate thing to include in one of the demo explorations.

## 10. Alignment file storage: raised a different position than where the group landed

Advocated for supporting both a central, documented, easily-accessible location for alignment files *and* the ability to point to repositories that code-system authors might keep themselves. François's long-term model (local experts align, then submit for inclusion in a NUVA build, gatekept by IVC) resolves this differently - alignment files live in the NUVA repo once submitted, not referenced externally. Logging the original position here because the underlying need (supporting owners who maintain their own repos, rather than only accepting submissions) might still matter even though the agreed model doesn't directly address it - worth revisiting if it comes up again rather than treating it as fully closed.

## 11. Positions stated 2026-10-07 (answering `open-questions.md`)

These are Nathan's working positions, in answer to the open questions. Several are explicitly "not sure yet". The full list is in `open-questions.md`.

- **The main use case right now:** align local codes to NUVA, and **tell the NUVA maintainers clearly what's missing from NUVA** to complete the alignment. Sections 1 and 3 above are the core; the rest can wait.
- **The tool prepares for governance, and governance happens separately.** The tool produces **artifacts** (files) that can go to governance. Someone can use it privately without divulging anything, then choose whether to take requests to IVC as a separate step, by saving a file and uploading or emailing it into that process. That's the right model for a distributed, community-based process. It partly answers the first bullet of section 8: tracking can stay out of any central system, as long as the tool can produce the artifact.
- **Requests for new NUVA content should become a formal package.** Its shape isn't designed yet, and working it out is a good outcome for the prototypes. Different tools could offer different ways to create requests, all ending up in one formal request package.
- **File formats aren't fixed.** This work can propose new formats or changes, including structured alignment metadata, which Nathan is willing to own (it's greenfield). But the core NUVA resources work operationally the way they are now, and changing those needs discussion first.
- **"Historical" vs. "deprecated" are two different things.** Code systems call a code "historical" while thinking only of use now, but recording historical records is also use now, and an old code is the correct value for its time. So a concept should carry **when it was active**. **Deprecated** should mean "never use for any purpose, including historical records". Not settled as a design, but any status model should keep the two apart.
- **IVC is the umbrella.** NUVA is managed by IVC. There's no IVC approval process for NUVA builds yet. Nathan plans to work on one with François and the Syadem team during a visit to Syadem in about three months (around January 2027). Publishing authority moves from Syadem to IVC over roughly the next year.
- **Valence technology type** is probably just descriptive for now; it might become a useful filter later.
