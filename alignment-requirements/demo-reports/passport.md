# Demo report: Passport Control

| | |
|---|---|
| Codename | `passport` |
| Direction | C - guided, with tracked status |
| Branch / folder | `prototype-passport`, now merged into `prototypes` / `docs/prototype-passport/` |
| Pull request | Draft PR #3 (opened 2026-10-07, not for merging) |
| Try it | `python -m http.server 8000` in `docs/`, then `http://localhost:8000/prototype-passport/`; or Tomcat at `http://localhost:8080/NUVA/prototype-passport/` |
| Built | 2026-10-07 |

## What it focused on

Two questions at once. First, the process one: what does it feel like if the tool *does* carry a process, with a status for every code, a confidence on every decision, and missing NUVA content tracked until it's resolved? This is the opposite pole from François's "neutral tool" position, and from Loupe, which left process out. Second, the layout one, answering Loupe's open challenge: can the align-one-code task be done **one thing at a time on a laptop-width screen** instead of everything visible at once?

**Personality:** a border checkpoint. Every code is a traveller asking to enter NUVA. The look is deliberately nothing like Loupe: passport-burgundy and gold header, cream security-paper passport card with a machine-readable zone, an airport split-flap departure board, and rubber stamps that thump onto the passport (ADMITTED, HELD, TURNED AWAY, PETITION FILED).

How it works:
- **The hall** has a departure board with one counter per workflow status (lane): Queue (no decision), Unchecked (came with a decision in the file), Held (stamped but held for a second look), Petitions (`#MISS`), Cleared, and Expired visas (stamped to a deprecated or missing vaccine). Pick a lane, call the next traveller.
- **The booth** handles one code in three steps, each in a single 820px column:
  1. *Papers:* the code's description, status, history ("visa pages"), alerts. The label's words are buttons that seed the antigen search.
  2. *Antigens:* pick valences in a tree (see the rework below).
  3. *Verdict:* candidate vaccines (exact first), then the code's description, the vaccine's description and its valences' full descriptions, stacked top to bottom.
- **The stamp tray** at the bottom carries confidence (Sure clears the code; Probably or Hunch holds it), a note, and the stamps. Each stamp names both codes. After a stamp, the next traveller in the same lane comes up, with undo.
- **`#MISS` files a petition:** what NUVA is missing (pre-filled from the picked antigens), why, which codes are waiting. Petitions go open → sent to IVC → resolved/withdrawn. Resolving one with the new VAC code sends every waiting code back to Held with that code suggested.
- **Re-importing the same code system merges** instead of replacing. A code stamped here keeps its stamp, and if the file disagrees it is held as "disputed".
- The CSV stays the standard format. Status, confidence, notes, history and petitions live in `localStorage` and an optional **logbook** JSON that can move the work to another computer or person.

**Reworked after first review.** The first version of step 2 drilled down one tree level at a time, and its search returned a flat list with "under X › Y" path text. Nathan found that hard to navigate (see below). It was rebuilt as a real tree: the pathogen families fold open in place, each antigen indented under its parent with guide lines. A search shows each match inside its own branch, with its ancestors dimmed and the search words highlighted. Picked antigens keep their branch open.

Deliberately left out: automatic matching, multi-user or real submission ("sent to IVC" is just a label), vaccine/valence editing, reverse and transcription maps, and any change to the CSV format.

## Reviewer reaction (Nathan, 2026-10-07)

**What worked**
- Loves the idea. It's a new and different idea with a different feel to it.
- It demonstrates a new process: walking through the alignment one antigen at a time. He believes it has merit as a different approach to this problem.
- He likes the **Petitions** idea: "a clear indication that the alignment needs to be escalated."
- After the tree rework: "Oh that's way better. It now make sense to me." He went through MMR and a couple of others: "These are easy to do. Major improvement."
- It "stacks up very good next to the other demo as a very different way to solve the problem. It gives the user one thing to work on at a time, love it."

**What didn't**
- The first version of the antigen step: "The antigens are really hard for me to navigate. I love the search, it's very good, but I find the listing of each to be very difficult to sort out." Many items are in a tree, "but they are all jumbled together and the relationship between them is not clear." He asked for it to be reworked before shipping (it was; see above).
- Before he saw the rework, he wasn't sure he liked the antigen selection better than Loupe's tree, and wanted to keep both for comparison.

## Builder's notes

What's worth reusing, as mechanics:
- **The antigen tree with search-in-context** (`antigenTree()` in `passport.js`). Matches are rendered inside their branches, ancestors are dimmed, and any node can be force-opened (`S.open`) to show all its children even during a search. This is what made the antigen step make sense. Combined with Loupe's auto-derived short descriptions, it reads well, because the parent is always right above the short text.
- **Petitions** (`openPetitionSheet()`, `filePetition()`, `setPetition()`). `#MISS` as a tracked record linked to its waiting codes, and resolution re-queuing them with the new code suggested.
- **Merge on re-import** (`mergeInto()`). Untouched codes take the file's value; a disagreement with a local stamp becomes "disputed" and held instead of overwritten.
- **Lanes and "call next traveller"** (`laneRows()`, `nextTraveller()`). Working through one status at a time, advancing within the lane.
- **Label words as search seeds** (`stepPapers()`). It isn't automatic matching, but it saves typing.
- **Undo snapshots the row and the petitions** (`stamp()`, `doUndo()`), so undoing a `#MISS` also removes a petition it just created.

What was weak, or still a judgment call:
- The statuses and the three confidence levels were the builder's choice; the plan named the concepts but didn't define them.
- The tracking can't go in the CSV, so a held code exports with its stamp and an undecided code exports as `#MISS`. The logbook is a new file nothing else reads.
- The page wasn't visually checked at phone width; the browser window wouldn't shrink that far.
- A browser cache served the old script after redeploying, so `index.html` now links `passport.js?v=2` and `passport.css?v=2`. Later demos redeploying to Tomcat may hit the same thing.

Noticed in the real data and code:
- **François's `parseCSV` drops labels when column 2 is blank.** Its field regex skips empty fields, so the label slides into the NUVA slot, becomes `#MISS`, and is lost. Importing a raw, unaligned code list into the main editor would lose every label. The round-trip test compares only NUVA codes for the unaligned sample because of this.
- **Loupe's round trip misses one file.** Loupe collapses repeated spaces in labels (`norm()`), which changes `CTI-EXTEND-276841-02` ("Junior  susp." has a double space). Its PR checked four files, not including `CTI-EXTEND2nuva.csv`. Passport only trims labels and passes all five. Noted here only; Loupe is unchanged.
- `docs/data/nuvadata.json` starts with a UTF-8 BOM. Browsers' `fetch().json()` strip it, but Node's `JSON.parse` doesn't, which matters for any test harness.
- The published CVX file maps CVX-04 (measles and rubella) to VAC0550, which showed up as a "disputed" value during the merge test.

## Open challenge for the next demos

Passport showed that one-thing-at-a-time works on a laptop screen, and that a tree with search-in-context makes antigen selection clear. It did not settle:
- **Process in the tool or beside it?** Passport keeps all tracking out of the alignment file, in a logbook. Direction B (process-free, file-first) could test the opposite: put owner, date, references, and perhaps status, in a richer file format and keep the UI neutral.
- **Escalation beyond one browser.** Petitions are the part Nathan singled out, but here they live in one person's logbook. What would it look like for a petition to actually reach IVC or François, still with no backend? A file, a GitHub issue template, a pull request?
- **Many alignments at once.** Both demos handle one code system. Nathan's requirement for visibility across all alignments (owners, staleness against NUVA versions) is untouched.

These are prompts, not requirements.
