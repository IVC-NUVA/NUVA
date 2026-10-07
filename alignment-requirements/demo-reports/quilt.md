# Demo report: Quilt

| | |
|---|---|
| Codename | `quilt` |
| Direction | D - triage the whole code system |
| Branch / folder | `prototypes` / `docs/prototype-quilt/` |
| Pull request | None (built directly on `prototypes`) |
| Try it | `python -m http.server 8000` in `docs/`, then `http://localhost:8000/prototype-quilt/`; or Tomcat at `http://localhost:8080/NUVA/prototype-quilt/` |
| Built | 2026-10-07 |

## What it focused on

François's reaction to Loupe and Passport: walking through codes one by one is discouraging. He'd rather release the most common vaccines and diseases first, leave the long tail for later, and see a global figure for how much isn't aligned yet. The question: what if the starting point is **the whole code system at a glance, ordered most common first**? It also answered the layout challenge both earlier demos left: neither three columns nor one step at a time. And it took one idea from direction B: a **formal package of requests for new NUVA content**, as a file the user can choose to send.

**Personality:** a patchwork quilt. Every code is a patch, every disease is a block. Gingham header, linen background, stitched edges. A patch's look is its status: bare muslin (not decided), sewn in with the editor's vaccine-type colours (aligned), a dark hole (`#MISS`), a cut-out stripe (`#NA`). Every themed control gives the plain term first and the quilt word second (**Out of scope `#NA`** *(cut it out)*), because Passport's theme hid `#NA` from François.

How it works:
- **Disease blocks in tiers.** Blocks sit in **Everyday** (roughly the WHO routine-for-everyone list), **Regional & risk**, **Long tail**, and **Odds & ends** (no disease recognised: immune globulins, "no vaccine administered"). Combination vaccines get their own block. Within a tier, blocks are ordered by how many NUVA vaccines carry the disease, as a proxy for "common". NUVA has no disease concept, so a disease here is one or more top-level valence families, and the tier list is the builder's proposal.
- **Placement without matching.** An aligned code sits in the block of its vaccine's valences. An undecided one is placed from its label words (English, French, scientific names), or from a brand name matched against the first word of NUVA product labels. On the published files, label-only placement agrees with the mapping's block for 256/261 CVX, 203/208 SNOMED-CT, 531/561 CTI-EXTEND, 280/281 CIS and 87/91 ATC codes. It only sorts codes; it never proposes an alignment.
- **The big figure:** "% not aligned yet" (undecided + `#MISS`), a bar, and "% done" per tier. Filters: tier chips, status chips, search, "Hide finished blocks".
- **A focused block** shows every label as a wide swatch and can settle all undecided codes in it at once as `#MISS` or `#NA`, with undo.
- **The sewing table** slides in from the right (460px) when a patch is clicked. It lets the user start from **Antigens** (the valence tree, narrowed by default to the families the label points at), **Vaccine name** or **Brand / product**, then compares the code, the vaccine and its valences' descriptions, stacked. After a decision, the next undecided code in the same block comes up.
- **`#MISS` offers a request:** new vaccine from existing antigens / new antigen / not sure, with a description, reasons and references, new or added to an existing request. Requests export as `<CSID>-nuva-requests_YYYY-MM-DD.json` (`nuva-content-request-package` v0.1, documented in the prototype's README), or as plain text for an email.

Deliberately left out: confidence and per-code workflow status (Passport explored those), tracking a request to resolution, merge on re-import, reverse and transcription maps, vaccine/valence editing, automatic matching.

## Reviewer reaction (Nathan, 2026-10-07)

**What worked**
- "I love the layout of the different concepts, this is so much easier to navigate and see where we I am at."
- He did some aligning and "found it very easy to find the information I needed."
- "This is the one I like the best so far."
- "I like the concept of disease tiers, that seems to be an innovative idea we should not lose."
- "Also the idea of most common, a good one too."

**What didn't**
- "The right column becomes very cramped. There is a lot of information there and not enough space for it."
- His suggested improvement (explicitly not to be made now): the align panel "takes much more of the screen real-estate and itself becomes more of a three column process."

## Builder's notes

What's worth reusing, as mechanics:
- **Disease blocks and tiers** (`DISEASES`, `TIERS`, `buildDiseases()`, `placement()`, `blocks()` in `quilt.js`). A disease is a set of top-level valence families; anything not listed becomes its own long-tail disease from its family label. This is the idea Nathan singled out.
- **Placement from label words and brand names** (`guessDiseases()`, `buildBrandIndex()`), with carrier proteins ignored (`CARRIER`). Cheap and accurate enough to sort an unaligned file, without pretending to match.
- **Narrowing the antigen tree to the suggested families** (`antigenTree()`, "Show all 65"). It's the per-code version of "reduce the attention load".
- **Batch decisions per block** (`batch()`), with one undo snapshot for the whole batch (`snapshot()`, `doUndo()`).
- **The request package** (`buildPackage()`, `packageText()`): self-contained, tied to the alignment file by name and to the NUVA data version. Other `#MISS` codes with no request are listed separately (`notYetDescribed`), and undecided codes are only counted, so the package never claims an untouched code is missing from NUVA.

What was weak, or still a judgment call:
- **The sewing table is too narrow** for what it carries (Nathan's critique). The finder, the candidates, the tree and the comparison all compete for 460px of height and width. Loupe's three columns showed the same content working when it has room, so one possible fix is Nathan's: a wide align view, possibly three columns, opened from the quilt.
- The tiers and the "common" ordering (NUVA vaccine count per disease) are the builder's proposal. What "most common" should mean is still François's question.
- A block counts as finished when no code is undecided, so a block with `#MISS` holes gets a tick and is hidden by "Hide finished blocks".
- Asset links carry `?v=3` to get past browser caching, as in Passport.
- The page wasn't checked at phone width.

Noticed in the real data:
- **The RSV antibody valences sit under the urinary-tract-infections family.** VAL317 (*RSV valence, antibody*) and everything below it, including nirsevimab (VAL321), has *Proteus mirabilis* (VAL447) as its parent, under VAL345 (*Urinary tract infections*). So the quilt puts CVX-93, 306, 307, 315 and 332 in a "Urinary tract infections" block. This looks like a data error in NUVA. It's noted here only, not reported anywhere.
- Brand-name placement works well for the French files (CIS, CTI-EXTEND), whose labels are mostly product names.

## Open challenge for the next demos

Quilt showed that seeing the whole code system at once, grouped by disease and ordered by importance, makes it easy to see where you are. It did not settle:
- **Room for the decision.** Can the whole-set view and the per-code decision each get the space they need? For example, the quilt as a home screen with a full-width align view, or Loupe's columns opened from a patch.
- **What "most common" means.** A fixed tier list, NUVA vaccine counts, real dose volumes from a registry, or the user's own choice? Should the tiers and diseases become a shared, published file, like the other invariants?
- **The request package as a standard.** Quilt's format is a first sketch. Does it fit Passport's petitions, and what would IVC need from it to act?

These are prompts, not requirements.
