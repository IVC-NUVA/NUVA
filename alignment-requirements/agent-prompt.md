You are building a prototype web application exploring a redesign of part of the NUVA vaccine terminology editor - a tool used by the Immunization Vocabularies Collaborative (IVC) and its lead maintainer, a developer named François, to align external vaccine code systems (e.g. CVX, SNOMED-CT) with the NUVA core terminology. This is one of several deliberately different prototype explorations meant to be reacted to, not a finished proposal.

Everything happens on the **`prototypes`** branch of the NUVA repository (`https://github.com/IVC-NUVA/NUVA`). Check it out and pull it first (`git fetch && git checkout prototypes && git pull`). All the requirements and context you need are compiled in its `alignment-requirements/` folder - read it first, don't start from assumptions. That folder is reference material and process notes; your prototype's code goes under `docs/`, not there.

Read, in this order:
1. `alignment-requirements/README.md` - orients you to the rest of the folder.
2. `alignment-requirements/prototype-plan.md` - this is your actual build brief: required reading order, hard constraints, candidate directions to build from, and exactly how to deliver the result (folder naming, codenames, the launcher page, commits). Follow it precisely.
3. The documents `prototype-plan.md` itself tells you to read in turn (`francois-requirements.md`, `francois-system-detailed-inventory.md`, `nathan-requirements.md`, `open-questions.md`, `demo-reports/`).

A few things `prototype-plan.md` can't tell you because it doesn't know your environment:

- **Where the actual code goes:** in the same checkout. `docs/scripts/*.js`, `docs/*.html`, and `docs/data/nuvadata.json` (the real, current published vaccine/valence dataset) are all there - read the real source files as the detailed inventory instructs. Your prototype's own files belong in a new folder `docs/prototype-<codename>/`, next to the existing ones.
- **"Local data" means the real NUVA dataset**, not fabricated sample data: fetch it from `../data/nuvadata.json` relative to your prototype folder - don't copy it (see "Conventions" in `prototype-plan.md`). No external API calls, no backend.
- **Testing in a browser:** fetching a local JSON file over `file://` fails with a CORS error - a real, already-confirmed issue in the existing codebase (see the detailed inventory). Serve over plain HTTP: `python -m http.server 8000` in `docs/`, then open `http://localhost:8000/prototypes/`. On Nathan's own machine, the Tomcat deployment described in the plan also works.

## Scope for this session

Build only **one** prototype - the next one - then stop.

Two prototypes are done and live in the same branch, and François has reacted to both (summary in `francois-requirements.md` section 9 and the demo reports): `loupe` (direction A, single screen, `docs/prototype-loupe/`) and `passport` (Passport Control, direction C, guided with tracked status, `docs/prototype-passport/`). Read both reports in `alignment-requirements/demo-reports/` first: what each tried, what Nathan and François liked and what they didn't, and the open challenge each leaves for the next demo. Then read their code and READMEs as the reference for mechanics. `prototype-plan.md` has a "Conventions established by the first prototype" section listing what to keep consistent (data path, storage keys, sample files, CSV decisions, round-trip test, README layout). Follow it. Don't copy either design: the point is a genuinely different position.

In `prototype-plan.md`, also read the two short summaries right after the candidate directions: François's feedback on the first two demos, and Nathan's answers to the open questions. Those answers are the design targets for every new demo: the main use case (align local codes, and make what's missing from NUVA clear to its maintainers), output artifacts a user can choose to send to IVC rather than built-in workflow, and a formal package of requests for new NUVA content whose format is still open for you to propose.

Also read "The spirit: student projects, not corporate products" in `prototype-plan.md`. Each demo is like a rival team's school project: it needs flair and a personality of its own, memorable even if a bit cheesy, and should feel nothing like the existing demos the moment it opens.

- Pick direction B or D from `prototype-plan.md`, or propose your own if the reading surfaces a better one - explain your choice. It must differ clearly from Loupe and Passport Control, in its layout as well as its position: answer the "open challenge" in the reports.
- Build it to the "done" bar the plan describes: small, genuinely clickable, covers the core align-one-code loop end to end.
- Follow the plan's mechanics: evocative one-word codename, folder `docs/prototype-<codename>/` with a short README, and an entry in the `PROTOTYPES` list on the starting page `docs/prototypes/index.html`.
- Run the round-trip test against François's `parseCSV` described in the conventions.
- Commit your work to `prototypes` and run it so it can actually be opened and clicked through in a browser. **Don't push yet.**
- **Then stop and ask Nathan for his reaction** (see what to report below). Wait for his answer.
- Once he's replied, write the demo's report in `alignment-requirements/demo-reports/<codename>.md` per `demo-reports/README.md`, with his reaction in it, and update `TODO.md` and `prototype-plan.md`. That report is the deliverable.
- Then commit and push `prototypes`. Don't open a pull request.

When the demo is built and running, report back, and end by asking for his reaction:
- Which direction you built and why, and the personality/flair you gave it.
- What you deliberately left out and why.
- How to open it.
- The folder name and codename you used.
- Anywhere you departed from the conventions in `prototype-plan.md`, and why.
- Anything in the required reading that was ambiguous or that you had to make a judgment call on.
