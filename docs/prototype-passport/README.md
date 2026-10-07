# Passport Control - a guided alignment prototype with tracked status

**One of several deliberately different explorations of the NUVA alignment workflow. Not a recommendation, not a proposal to replace the Code Systems tab.** It exists to be clicked through and reacted to.

## The question it explores

*What does it feel like if the tool does carry a process: a status for every code, a confidence on every decision, and "NUVA is missing something" tracked as a first-class thing until it's resolved? And can the align-one-code task be done one step at a time on a laptop screen, instead of with everything visible at once?*

This is the opposite end from François's "neutral tool, like a spreadsheet" position, made concrete so it can be judged. The idea is themed as a border checkpoint. Every code in the alignment file is a traveller asking to enter NUVA:

- **The hall** shows a departure board with one counter per workflow status (*lane*): **Queue** (no decision), **Unchecked** (came with a decision in the file, not yet inspected here), **Held** (stamped, but held for a second look), **Petitions** (`#MISS`, waiting on new NUVA content), **Cleared**, and **Expired visas** (stamped to a NUVA vaccine that is now deprecated or gone). Pick a lane and call the next traveller.
- **The booth** handles one code in three steps, each filling a modest screen:
  1. **Papers:** the code and its declared description, its status, history ("visa pages") and any alerts. The words of the label are buttons: click the ones that matter to carry them into the antigen search.
  2. **Antigens:** work out the valences one level of the tree at a time. Each line shows a short "how this differs from its parent" form, the number of vaccines carrying it, and a button to go one level more specific. The exact matching NUVA vaccine, if there is one, appears as soon as the combination is complete.
  3. **Verdict:** the candidate vaccines (exact first, same ranking as Loupe), then the code's description, the chosen vaccine's description and its valences' full descriptions, stacked for reading top to bottom.
- **The stamp tray** stays at the bottom of the booth: a confidence (**Sure** clears the code, **Probably** or **Hunch** holds it for a second look), an optional note, and the stamps. Every stamp names both codes (`Stamp CVX-03 → VAC0130`). The stamp lands on the passport, then the next traveller in the same lane is called. Undo is in the toast, or press `Z`.
- **`#MISS` files a petition.** It says what NUVA is missing (pre-filled from the picked antigens), why, and which codes are waiting on it. The petitions office tracks each one through *open → sent to IVC → resolved / withdrawn*. Resolving one with the new NUVA code sends every waiting code back to **Held** with that code suggested, so nothing waiting on NUVA is lost.
- **Re-importing the same code system merges** instead of replacing. Codes never touched here take the file's new value. A code stamped here keeps its stamp, and if the file disagrees it is held as **disputed** for review.

Differential valence descriptions are derived automatically, as in Loupe (NUVA has no field for them): the parent label's comma-separated phrases are removed from the child label, falling back to the full label. They are shown in italics, and the full description is on hover and in the verdict step.

## What it deliberately is not

- **Not neutral.** It takes the "process in the tool" position on purpose. Statuses, confidence, holds, disputes and petitions are all opinions about how alignment *should* be done. It's for reacting to, not a claim that this is the right process.
- **Not a file-format proposal.** The tracking lives beside the alignment file, not inside it (see below). Changing the format is a different exploration.
- **Not multi-user or a governance system.** "Sent to IVC" is a label, not a submission. The inspector name is a free-text field, and nothing is shared except by passing the logbook file around.
- **No automated matching.** The word buttons only fill the search box. Candidates come from antigens the person picks or names they type.
- **Not a full editor.** No vaccine/valence editing, no Unit files, no reverse or transcription maps. The main editor still does all of those.
- **Not a fix for anything in the main editor**, whose files are untouched.

## Files it reads and writes

- **Reads** `../data/nuvadata.json`, the same published dataset the site serves.
- **Imports and exports** the standard alignment CSV (`docs/documentation/tools/f_alignment.md`) unchanged: header cell = code system ID, `CSID-` prefixed codes, `VACnnnn` / `#NA` / `#MISS` (`#MIS` is read as `#MISS`), UTF-8 with BOM, header `<CSID>,NUVA,<CSID> label, NUVA label`, exported as `<CSID>2nuva_YYYY-MM-DD.csv`. Every file in `Alignments/` was parsed, exported, and checked against the main editor's own `parseCSV` with no differences.
- A blank NUVA column on import means **undecided** (the Queue lane). The format has no "not decided yet" value, so undecided codes are **exported as `#MISS`**, and the exit gate says how many. Held codes go out with their current stamp, because the file can't say they're held.
- **Status, confidence, notes, history and petitions are not in the CSV.** They live in `localStorage` under `passport.desk.v1`, and can be saved to and restored from a **logbook** (`<CSID>-passport-logbook_YYYY-MM-DD.json`, format `nuva-passport-logbook` v1), so the work can move to another computer or person. This JSON file is new; nothing else in NUVA reads it. The prototype never reads or writes the main editor's `vaccines` / `valences` / `CSData` / `context` keys.

`samples/` holds `CVX2nuva.csv` (copied unchanged from `Alignments/`) and `CVX-unaligned.csv` (the same codes and labels with the NUVA column blanked, for the from-scratch flow). The same two samples are used by every prototype, and both are offered on the start screen.

## Running it

Static files, no build step. It must be served over HTTP, because browsers block the data fetch from a `file://` page.

- **Tomcat (as used for the main editor):** copy this folder to `webapps/NUVA/prototype-passport/` alongside the deployed `docs/` contents and open `http://localhost:8080/NUVA/prototype-passport/`.
- **Any static server** run from `docs/`, e.g. `python -m http.server` in `docs/`, then open `http://localhost:8000/prototype-passport/`.

Keys: in the hall, `N` calls the next traveller. In the booth, `1` `2` `3` switch steps, `Esc` goes back to the hall, and `Z` undoes the last stamp.
