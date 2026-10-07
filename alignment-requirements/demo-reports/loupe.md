# Demo report: Loupe

| | |
|---|---|
| Codename | `loupe` |
| Direction | A - single screen, no tab-switching |
| Branch / folder | `prototype-loupe`, now merged into `prototypes` / `docs/prototype-loupe/` |
| Pull request | Draft PR #2 (opened 2026-10-07, not for merging) |
| Try it | `python -m http.server 8000` in `docs/`, then `http://localhost:8000/prototype-loupe/`; or Tomcat at `http://localhost:8080/NUVA/prototype-loupe/` |
| Built | 2026-10-06 |

## What it focused on

Whether aligning a code gets easier when everything needed for the decision is on one screen at once, instead of moving between the editor's Code Systems, Vaccines and Valences tabs and comparing descriptions through hover tooltips.

The layout has three columns:
- **Left:** the list of codes, filterable by decision (Undecided / Aligned / #MISS / #NA / Changed / Needs attention).
- **Centre:** the code's own description, the candidate NUVA vaccine and that vaccine's valences, shown side by side as full text. Below them are one row of decision buttons (Align / #MISS / #NA / Back to imported / Skip) and the list of candidate vaccines.
- **Right:** the valence tree. Each line shows a short "how this differs from its parent" description, auto-derived from the labels (Nathan's differential-description idea).

**Personality:** a jeweler's loupe - one code held up close and examined against its candidates. In practice it came out tidy and restrained: the closest of any demo to a standard corporate tool look (navy header, white panels, lists). That makes it the look for the next demos to move *away* from.

Ticking valences in the tree lists the vaccines carrying that combination, exact match first. An exact match lands in the comparison automatically. Keyboard shortcuts move through the codes and make decisions, and the view moves to the next code after each decision.

It deliberately left out process (statuses, confidence, tracked requests), automatic matching, and vaccine/valence editing.

## Reviewer reaction (Nathan, 2026-10-07)

**What worked**
- The alignment process is very clear. He worked through it himself.
- He loved the slimmed-down valence list (the short "differs from parent" descriptions).
- It was easy to take codes, find matching vaccines, and then categorize them.
- Overall: loved the idea.

**What didn't**
- It's a **big-screen activity**. Everything has to be laid out at once on a large monitor, and there's a lot to look at simultaneously.
- He asked for other directions to be explored besides a three-column layout.

## Builder's notes

What's worth reusing, as mechanics rather than layout:
- **Short valence descriptions.** These are the clearest win. The derivation is in `differential()` in `loupe.js`: strip the parent label's `, `-separated phrases from the child label, falling back to the full label (about 49 of 386 valences fall back).
- **Candidate ranking from ticked valences** (`candidatesFromSelection()`): exact combination first, then vaccines with extra, more specific or less specific valences, each labeled with how it differs.
- **Moving to the next code after each decision, plus undo.** This made working through a list fast.
- **Naming both codes on the Align button**, and resetting the comparison whenever the code changes. This avoids the "Map to current vaccine" bug by design.
- **The "Needs attention" view.** It found three real published mappings pointing at deprecated vaccines: SNOMED-CT-1061000221102 → VAC0810, ATC-J07AH02 → VAC0809 and ATC-J07AH05 → VAC0810.

Other observations:
- The three descriptions only fit side by side because the screen is wide. Below about 1100px the layout stacks, but that's a fallback rather than a design.
- The candidate list and the product (instance) lists can get long; MMR alone has 25 products. That adds to the "lot to look at" feeling.
- In the real data, "MEASLES AND RUBELLA VACCINE ZYDUS" (VAC1381) is listed as a product of the measles-mumps abstract vaccine (VAC0623). That looks like a possible data error. It's noted here only, not reported anywhere.

## Open challenge for the next demos

Loupe showed that the *content* of the decision works: the code description, the candidate, its valences, and short valence descriptions. It didn't show that all of it has to be visible at once. A different demo could try, for example:
- **One thing at a time:** a guided sequence (read the code, then narrow the valences, then confirm), each step filling a modest screen.
- **Progressive disclosure:** start from a compact code list and expand only the decision in hand.
- **Laptop-sized by design:** a layout built for a 13" screen from the start, not stacked as a fallback.

Beyond layout, give the next demo a personality of its own (see "The spirit" in `prototype-plan.md`). It should feel nothing like Loupe the moment it opens.

These are prompts, not requirements. A demo that keeps three columns but makes a convincing case for them is also fine, as long as it argues it rather than defaulting to it.
