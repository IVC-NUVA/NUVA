# Requirements Distilled From François's Work

What his code, his documentation site, and his emails reveal he actually needs and believes, organized by area. Each item notes **what**, **why** (when stated or inferable), and flags an **open question / inconsistency** where one exists. Distilled 2026-10-06 from `main` at commit `02b1c87a`; see `README.md` for exact source locations.

A section at the bottom is reserved for what he says directly in the 2026-10-06 call - kept separate from what's inferred from code/docs, since those are different kinds of evidence.

## 1. Core architecture

**What:** Unit files (one YAML file per concept: vaccine, valence, target, code system) in the Git repository are the single authoritative source. Everything else - RDF graphs, CSV exports, translation source, the public JSON data the editor reads, alignment outputs - is a generated product, rebuilt by GitHub Actions whenever Unit files change.

**Why:** Explicit, longstanding goal - move off SYADEM's proprietary editor/resource-management system, make NUVA community-maintainable via ordinary Git workflow (review, history, pull requests).

**Open question:** how close is this transition actually to done? Some release-generation logic still reads external codes embedded in vaccine Unit files even though the stated direction is standalone alignment CSVs owned by code-system experts (noted in the original review doc, not yet re-verified against current `main`).

**Confirmed 2026-10-06 (see section 8 below):** this isn't just about tooling - NUVA vaccine codes are *currently officially published by SYADEM*, and that publishing authority is actively moving into this NUVA GitHub project. The Unit-files-as-source-of-truth architecture is the mechanism for that handoff, not a separate concern from it.

## 2. The editor itself

**What:** One static, dependency-free, browser-only application (`docs/*.html` + `docs/scripts/*.js`), served from GitHub Pages, covering four areas: Vaccines, Valences, Code Systems, Files. No install, no account, no server.

**Why:** Needs to be approachable for non-developer contributors; needs to work without anyone running infrastructure. Matches the broader resource reality - no budget/capacity for a server-backed tool.

**Confirmed requirement, not just a nice-to-have:** this appears non-negotiable given stated resource constraints - any future direction (including anything Nathan proposes) needs to preserve local/serverless editing.

### 2a. Shared cross-tab context (new as of late Sept/early Oct)

**What:** A single `context` object (current vaccine, current code, current valence, selected valences, filter) persisted to `localStorage` and shown in every tab's sidebar. Picking a vaccine in one tab carries it into another.

**Why:** Makes the natural workflow (pick a vaccine, then map a code to it, or vice versa) possible without re-navigating or re-selecting. Direct response to his own observation that the earlier workflow required "several tab switches" and felt "clumsy."

**Open question:** `context` persists indefinitely in `localStorage` with no expiry and no visible timestamp - a stale value from a previous, unrelated session can silently get reused (this is exactly how the "Map to current vaccine" bug manifested in testing - see the branch coordination doc for the confirmed repro). Worth asking whether this is a known tradeoff he's accepted, or something he hasn't hit yet.

## 3. Code Systems / alignment editing workflow

**What:** Import an alignment CSV -> editable table of all codes -> click a code -> choose an action (map to current vaccine / out of scope / vaccine concept missing / reset to initial value) -> export back to CSV at any point. Also: generate a reverse map (NUVA -> best external code) and a transcription map (one external system to another via NUVA as pivot).

**Why:** His own stated use case - round-trip a code system's alignment file, with the editor doing the lookup/bookkeeping work a spreadsheet can't (exact-match detection via the valence combination, reverse/transcription computation).

**Open question / inconsistency:** his Sept 20 email describes himself as "half satisfied" with this exact workflow and calls it "a bit clumsy" even after building it - worth understanding specifically *what* still feels clumsy to him, rather than assuming the shared-context addition (built the same day) fully resolved his own concern.

## 4. Alignment file format

**What:** Now formally specified (`tools/f_alignment.md`): 2-4 column CSV (code, NUVA code, optional code label, optional NUVA label); `#NA` for out-of-scope; `#MISS` for a NUVA concept that should exist but doesn't yet; codes prefixed `CSID-`; deprecated-in-source codes prefixed `#`; export filename pattern `ident2nuva_YYYY-MM-DD.csv`.

**Why:** Needs to be parseable by worksheet software (Excel/LibreOffice) for owners who prefer to edit the CSV directly rather than use the browser editor - he said as much ("for my own work, I would edit directly the CSV files").

**Open question:** `#MISS` covers "should be a NUVA concept but isn't yet" - but there's no equivalent formal status for "this *was* a valid mapping but NUVA deprecated the target," beyond what naturally shows up if the vaccine lookup fails. Relates to the "historical status" open question he's already logged himself in `internal/tbd.md`.

## 5. Explicit product philosophy

**What, in his own words (Sept 20 email):** "I consider this tool as a commodity to create files, neutral towards the processes, like a word processor or a spreadsheet. Each code system owner may have his own quality rules and processes, and I would not embed them here."

**Why:** Wants the tool to stay general-purpose and not take on the liability/complexity of enforcing one group's process on every code-system owner, who may have very different standards.

**This is the central tension with Nathan's own direction** - see `open-questions.md` and the branch's `NUVA-IVC-System-Vision.md` section 5 for the full framing. Not resolved; this document states his position as evidence, not as a conclusion either way.

## 6. Documentation site

**What:** `nuva.ivci.org/documentation`, organized as Core / Layers / Organisation / Tools / Usage, plus a hidden Internal section. Each page tracked through a Draft -> Submitted -> Released workflow (frontmatter: `status`, `assignee`). ~60 pages exist; 18 assigned to Nathan (14 Submitted, 3 Void - not started), 19 to himself.

**Why:** Stated directly (Sept 22 email): NUVA has grown many facets spread across scattered contributions and needs one structured, navigable home. Proposed a mid-October meeting to finalize structure once everyone's contributed to the outline.

**Notable but not yet built:** the **Organisation** section (`end_user.md`, `ivc.md`, `tools_provider.md`, and contributor-role pages like `alignment_contributor.md`) is the closest thing he's sketched to an org/governance structure - still status Void, meaning he's thought about the shape but hasn't written the content. Worth asking directly what he has in mind here, since it's the natural seam between "his tool" and "IVC as an organization."

## 7. What he's already flagged as open himself (`internal/tbd.md`)

Not inferred - his own list, verbatim categories:
- **SYADEM medical team:** review vaccine comments, remove ones that just restate the abstract vaccine's description (reduces translation burden).
- **SYADEM technical team:** rework the proprietary editor to use Unit files (i.e. even SYADEM's own legacy tooling isn't fully migrated yet).
- **François (self-assigned):** propose a translation workflow and configure Weblate accordingly; build a Files-view report of differences between working and reference core concepts; find an RDF predicate for deprecated concepts.
- **Jean-Louis:** propose scientific committee membership (9 or 12 people, 1/3 EMEA, 1/3 Americas, 1/3 APAC) - first evidence of an actual named governance body being discussed.
- **IVCI (unowned):** define a structured description for alignments (owner, description, references/links, revision date); mandate owners for alignment files.
- **Open questions he's posed himself:** should there be a "historical" status for globally-obsolete vaccines, or does that belong to each country's own layer? Should the target-disease concept be reintroduced? Should alignment files live in this GitHub repo, or only be referenced from each code-system owner's own publication - or both, expressed via an alignment metadata file?

The unowned "IVCI" item and the alignment-location question line up closely with what Nathan's Alignment Workspace was trying to formalize (code-system metadata: owner, jurisdiction, source URL, version) - a natural thing to volunteer for directly rather than re-debate from scratch.

## 8. From the 2026-10-06 call

### Reaction to the original Alignment Workspace proposal

He appreciated it - not because he agreed with it, but because it made him think in new ways. Confirms the instinct from the pre-call strategy discussion: prototyping-to-provoke-reaction is the right register with him, not prototyping-to-persuade.

### How he actually performs an alignment (demonstrated live)

Walked through his process end to end: find the valence, associate it with the external code. Determining the right valence/vaccine is done by **reading and comparing three descriptions side by side** - the external code's description, the candidate NUVA vaccine's description, and the candidate valence's description - hovering over tags on screen to pop up each one (the existing tooltip pattern). Matching today is a manual, description-driven judgment call, not something the tool resolves automatically. Fast, easy access to full descriptions while comparing candidates is core to the actual workflow, not a secondary feature - any future UI needs to preserve or improve this, not streamline it away.

### Valence technology type - a second hierarchy

Valences carry a "type" describing the vaccine technology used (live vs. non-live, whole-pathogen vs. subunit vs. nucleic-acid, etc. - see `VTypeOptions` in `valences.js`, already present in the code as of mid-September), which has its own hierarchy separate from the valence parent/child (antigen) hierarchy. He described this as a newer addition to the valence structure. Open question: how/whether this second hierarchy factors into matching today, versus being mainly descriptive - see `open-questions.md`.

### Alignment file location - resolved

Discussed whether alignment files should live in this repo or just be referenced from locally-hosted values. Nathan advocated for supporting both. **Agreed: keep alignment files in the NUVA repo.** This resolves the open question from his own `internal/tbd.md` list and from section 7 above - see `open-questions.md` for the resolution entry.

### NUVA's scope, stated directly

The NUVA application's purpose is **only** to support alignment *to* NUVA - explicitly not to replace whatever process a local code-system owner already has for managing their own local code system. This is why the import format carries local code + local description + NUVA code side by side: a local export comes in, gets aligned, and that's the whole job. NUVA isn't trying to become the system of record for anyone's local code system.

**Long-term model, stated directly:** local experts do their own alignment, then submit it for inclusion in a future NUVA build. Builds are gatekept by IVC approval - currently François personally.

### NUVA project is actually two things - important clarification

1. It will centralize and become the **official publication location** for NUVA vaccine codes and valences themselves. This is a bigger deal than it first appears: **NUVA codes are currently officially published by SYADEM**, and that publishing authority is actively moving into this NUVA GitHub project. This is the real substance behind the "Unit files as source of truth" goal in section 1 above - not just a tooling preference, but a handoff of official publication authority away from a proprietary vendor to this open project.
2. It supports alignment via browser-side software - everything else this document has been analyzing.

### Where this leaves the demo-prototype plan

Told him about the plan to build a few demonstration prototypes for him to react to - he liked it. Confirmed path forward: finish documenting requirements, then build.
