# Proposal for an Updated NUVA Usage Page

## Purpose of this document

This document proposes a new Usage page for the NUVA browser and editing environment after the Alignment Workspace has been added.

It explains:

- why the current Usage page needs to change;
- what a new user needs to understand before using the tools;
- how the page should organize the available tasks;
- what content should appear on the page;
- what supporting help should appear elsewhere in the application; and
- suggested complete copy for the revised page.

This is a content and user-support proposal rather than a detailed implementation specification. The page should follow the existing application’s visual design and remain suitable for static hosting.

## 1. Why the Usage page needs to change

The current Usage page describes the application screen by screen:

- Vaccines;
- Valences;
- Selection;
- Filtering;
- Files; and
- Code systems.

This is useful after a user understands NUVA and has chosen a task. It is less helpful as an introduction because it assumes the reader already understands:

- what a valence represents;
- the difference between an abstract vaccine and a real vaccine;
- how vaccines are defined from valences;
- the difference between editing NUVA and aligning another code system with NUVA;
- what a Unit file is;
- what a direct map represents;
- why a reverse map is generated; and
- what a transcription map can and cannot establish.

The addition of the Alignment Workspace makes the limitation more important. The application will support several related but distinct activities:

1. Exploring NUVA.
2. Creating or maintaining an external code-system alignment.
3. Editing NUVA core concepts.
4. Analyzing a completed mapping.
5. Saving, restoring, and exporting work.

A new user should first choose which of these activities they intend to perform. Documentation about individual controls should follow that choice.

## 2. Primary documentation goal

The Usage page should answer five questions in order:

1. What is this application?
2. What am I trying to accomplish?
3. What NUVA concepts do I need to understand?
4. What workflow should I follow?
5. Where is my work stored, and what files will I produce?

The page should orient users without attempting to contain every detailed instruction. Detailed control help should remain on or near the page where the user performs the action.

## 3. Intended audiences

### 3.1 NUVA explorer

This user wants to search or browse vaccines and valences without making changes.

They need to know:

- where vaccines and valences are displayed;
- how abstract and real vaccines relate;
- how valence selection and filters work; and
- that browsing does not require creating or saving a workspace.

### 3.2 Code-system alignment contributor

This user has an external list of vaccine codes or an existing alignment and wants to align or maintain it against NUVA.

They need to know:

- that alignment proceeds through valence analysis;
- how to create or load an Alignment Workspace;
- what happens when a valence or vaccine combination is missing;
- how work is saved and resumed;
- how NUVA upgrades affect saved alignment work; and
- which exports are produced.

This should become the most clearly supported user journey because it connects external experts with the NUVA contribution process without allowing them to alter NUVA directly.

### 3.3 NUVA core editor

This user has authority or responsibility to propose changes to NUVA vaccines or valences.

They need to know:

- that core editing is different from alignment work;
- that all browser edits remain local;
- how to create and edit vaccines or valences;
- how to generate changed Unit files; and
- that editorial review and repository submission occur outside the browser editor.

### 3.4 Mapping analyst

This user already has a completed direct map and wants to evaluate how well an external code system represents NUVA or create a transcription map.

They need to know:

- the required direct-map format;
- the distinction between direct, reverse, and transcription maps;
- the meaning of mapping metrics and output fields; and
- the limitations of inferred transcription between code systems.

## 4. Recommended information architecture

The default page should be named **Getting Started** rather than **Usage**. “Getting Started” better describes its purpose and distinguishes it from detailed reference material.

Recommended navigation after the Alignment Workspace is available:

- Getting Started
- Vaccines
- Valences
- Alignment Workspace
- Mapping Analysis
- Files and Recovery
- Concepts and Help

If the application should retain a smaller navigation, “Concepts and Help” may remain part of Getting Started initially. The important distinction is that Alignment Workspace and Mapping Analysis must be separate destinations.

The existing “Code Systems” page should be renamed **Mapping Analysis**. “Code Systems” is too broad once another page manages the actual creation and maintenance of a code-system alignment.

## 5. Core messages the page must communicate

### 5.1 The application has several purposes

The application is not only a NUVA viewer and not only a NUVA editor. It supports exploration, alignment work, core editing, and mapping analysis.

### 5.2 NUVA alignment is valence-first

For each external code, the contributor first determines which NUVA valences represent its meaning. The application then identifies whether NUVA contains a vaccine concept with exactly that valence combination.

If a required valence is missing, a new valence must be requested. If the valences exist but their combination has no NUVA vaccine concept, a new NUVA vaccine code must be requested. The alignment remains pending until NUVA publishes the needed concept.

### 5.3 Alignment does not edit NUVA

The Alignment Workspace uses NUVA as read-only reference data. It records findings and requests but does not create or modify official NUVA concepts.

### 5.4 Core editing is a separate workflow

The Vaccines and Valences pages can create or modify local working copies of NUVA concepts. Those changes remain local until the user downloads Unit files and submits them through the NUVA editorial process.

### 5.5 All working data remains client-side

The application has no user accounts or central working database. Browser storage provides convenience, but exported files provide portability and recovery.

Users must understand that:

- no browser action automatically submits work;
- clearing browser data may remove automatically stored work;
- JSON workspace files allow work to be resumed or transferred; and
- exported Unit files or mapping files must be submitted separately when appropriate.

### 5.6 Alignments are maintained over time

An alignment is not necessarily completed once. External code systems and NUVA both change. A saved Alignment Workspace can be reopened against later source data and later NUVA releases to identify additions, changes, deprecations, and previously blocked mappings that may now be completed.

## 6. Concepts that require concise definitions

The Usage page should define the following terms without requiring the reader to consult external documentation.

### Valence

A functional component used by NUVA to describe what a vaccine represents. Valences form a hierarchy from broad or unspecified meanings to more precise meanings.

### Abstract vaccine

A NUVA vaccine concept defined by an exact combination of valences. An abstract vaccine may describe a generic vaccine type rather than a specific commercial product.

### Real vaccine

A specific vaccine product or brand represented in NUVA and associated with an abstract vaccine.

### External code system

A national, regional, product, clinical, or local code system used to identify administered vaccines.

### Alignment

The maintained relationship between an external code and the exactly equivalent NUVA vaccine concept.

### Direct map

A file that records external-code-to-NUVA relationships.

```text
External code -> NUVA vaccine
```

### Reverse map

A generated view showing the best available external-code representation for NUVA concepts.

```text
NUVA vaccine -> external code
```

### Transcription map

A generated map between two external code systems using their NUVA alignments as the common semantic reference.

### Unit file

An individual YAML source file used to maintain a NUVA core concept in the repository.

### Alignment Workspace bundle

A JSON file containing the complete local state of one external code-system alignment, including source data, valence analysis, mapping decisions, unresolved questions, and requests for NUVA additions.

## 7. Workflows that should appear on the page

### 7.1 Explore NUVA

1. Open Vaccines to browse abstract and real vaccine concepts.
2. Open Valences to explore the valence hierarchy.
3. Select valences to see related concepts.
4. Apply filters to narrow the displayed vaccines or valences.

### 7.2 Create a new alignment

1. Create an Alignment Workspace and identify the external code system.
2. Import a source file containing at least code and label.
3. Review one source code at a time.
4. Select the valences represented by the code.
5. Confirm the NUVA vaccine with the exact valence combination.
6. Record missing valences or missing vaccine combinations when necessary.
7. Save the workspace as JSON.
8. Export confirmed mappings and unresolved-work reports.

### 7.3 Maintain an existing alignment

1. Create or open an Alignment Workspace.
2. Import the existing direct map.
3. Import updated source-system data when available.
4. Review added, changed, inactive, or unresolved codes.
5. Reconcile the workspace after NUVA changes.
6. Export the revised direct map and change report.

### 7.4 Edit NUVA core resources

1. Use Vaccines or Valences to make local changes.
2. Use selection and filtering to inspect related concepts.
3. Save a work backup when needed.
4. Generate Unit files for changed concepts.
5. Review and submit those files through the NUVA editorial process.

### 7.5 Analyze a completed mapping

1. Open Mapping Analysis.
2. Upload a completed direct map.
3. Download the generated reverse map.
4. Review coverage and precision information.
5. Optionally load a second direct map to generate a transcription map.

## 8. Data safety content

The revised page should include a prominent but concise data-safety section.

It should state:

- Work is performed locally in the browser.
- The application does not automatically submit or publish changes.
- Automatic browser storage is convenient but should not be the only copy of important work.
- Export an Alignment Workspace JSON bundle to resume alignment work or move it to another computer.
- Export a core-editing backup before clearing browser data or resetting changes.
- Reset actions affect the local working state, not the published NUVA repository.
- The current code system and NUVA version should be checked before exporting an alignment.

The documentation must accurately describe any differences between browser storage used for the hosted site and storage used when pages are opened directly from the local filesystem.

## 9. Mapping-analysis content

The Getting Started page should introduce mapping analysis but should not carry the full technical reference. The Mapping Analysis page should explain these concepts in detail.

### Best

Indicates that a code is the best available representation in the external code system for the NUVA concept. “Best” does not necessarily mean exact.

### Blur

Indicates how many NUVA concepts are represented by the same broader external code. Higher blur means more NUVA distinctions are lost.

### Equivalence

Indicates that multiple external codes may have the same NUVA meaning.

### Completeness

Describes how much of NUVA the external code system can represent at some level.

### Precision

Describes how specifically the external system represents NUVA concepts rather than collapsing several meanings into broader codes.

### Redundancy

Describes the presence of multiple external codes representing the same NUVA meaning.

The exact formulas used by the application should be documented on the Mapping Analysis page or in a linked reference. The Usage page should avoid claiming more than the tool calculates.

## 10. Supporting contextual help

The revised Getting Started page cannot replace page-specific guidance. Each functional page should include concise contextual help.

### Vaccines page

Explain:

- abstract versus real vaccines;
- how instances are grouped;
- how valence tags work;
- how brand-name filtering works;
- what bold text means;
- how selected valences affect assignment and filtering; and
- that editing changes only the local working copy.

### Valences page

Explain:

- parent and child valences;
- precise versus aggregated valences;
- checkbox behavior;
- grey inherited selections;
- valence types;
- how parent assignment works; and
- the effect of changing a valence used by vaccines.

### Alignment Workspace

Explain:

- required and optional source fields;
- imported versus reviewed mappings;
- workflow statuses;
- selected valences as the basis for the NUVA match;
- missing-valence and missing-vaccine requests;
- save status;
- NUVA version reconciliation; and
- why some records cannot be included in the direct-map export.

### Mapping Analysis

Explain:

- the input CSV structure;
- required code prefixes;
- exact versus broader representation;
- output columns and metrics;
- ignored or invalid rows;
- reverse-map generation; and
- the limitations of transcription maps.

### Files and Recovery

Explain:

- the difference between a core-editing backup and an Alignment Workspace bundle;
- which downloads are complete backups and which are submission artifacts;
- how restore behaves;
- what Reset affects; and
- how to avoid losing work.

## 11. Example files and tutorials

The documentation should link to a small set of example files:

- a blank source-code import template;
- a small fictional source code system;
- a completed direct map;
- an Alignment Workspace JSON bundle;
- a review and NUVA-request report;
- a reverse map; and
- a transcription map.

A fictional example with five or six codes is preferable for teaching because it can deliberately demonstrate:

- an exact alignment;
- a code needing more information;
- a missing valence;
- an existing valence combination lacking a vaccine code;
- an inactive historical code; and
- an out-of-scope concept.

## 12. Frequently asked questions

The help content should answer at least these questions:

### Why can I not find an exact NUVA vaccine?

The source code may require a valence that NUVA does not yet contain, or the necessary valences may exist without a vaccine concept for their exact combination. The Alignment Workspace should record the appropriate request rather than force an approximate mapping.

### Can two external codes map to the same NUVA vaccine?

Yes. A source code system may contain several codes with the same NUVA meaning for reasons outside NUVA’s scope.

### Can one external code map to several NUVA vaccines?

The published direct map should identify the single NUVA concept with exactly the same meaning. If the source code is broader than available NUVA concepts, additional NUVA modeling or review may be needed rather than publishing several exact mappings.

### Does selecting valences change NUVA?

No. Selection is local working context. Alignment work never changes NUVA core resources.

### Has my work been submitted?

No. Browser edits and downloaded files remain local until the user separately submits them through an agreed review process.

### How do I resume work on another computer?

Download the Alignment Workspace JSON bundle and open it on the other computer. Browser storage does not automatically follow the user between devices.

### What happens when NUVA is updated?

Open the saved workspace against the current NUVA data. The application should identify deprecated references and requests that may now be resolvable. It should not silently replace confirmed mappings.

### What happens when the external code system changes?

Import the new source version into the existing workspace. The application should identify new, removed, and changed records while retaining prior alignment decisions for review.

### Why must external codes contain a code-system prefix?

The prefix preserves the code as text, distinguishes it from codes belonging to other systems, and helps prevent spreadsheet applications from altering numeric-looking values.

## 13. Proposed complete page copy

The following text can serve as the starting content for the revised Getting Started page. Link names and exact storage descriptions should be adjusted to match the completed application.

---

# NUVA browser and editing environment

This application supports exploring NUVA, creating and maintaining alignments with external vaccine code systems, editing NUVA core concepts, and analyzing completed mappings.

All working changes remain in your browser until you download a file. The application does not automatically submit changes or publish them to NUVA.

## Choose your task

### Explore NUVA

Use **Vaccines** to browse abstract and real vaccine concepts. Use **Valences** to explore the valence hierarchy and see how vaccines are characterized.

### Create or maintain an alignment

Use the **Alignment Workspace** when you have a list of codes from another vaccine code system or an existing mapping that needs continued maintenance.

The workspace allows you to import source codes, determine their valences, identify the corresponding NUVA vaccine, record unresolved questions, and save the complete alignment as a portable JSON bundle.

### Edit NUVA core concepts

Use **Vaccines** and **Valences** to create or modify a local working copy of NUVA concepts. Use **Files and Recovery** to save a backup and generate changed Unit files for editorial review.

Core editing is separate from alignment work. An Alignment Workspace cannot modify NUVA.

### Analyze a completed mapping

Use **Mapping Analysis** to upload a completed direct map, generate the reverse NUVA-to-external map, examine mapping coverage and precision, or create a transcription map between two aligned code systems.

## Core NUVA concepts

### Valences

A valence is a functional component used by NUVA to describe what a vaccine represents. Valences form a hierarchy from broad or unspecified meanings to more precise meanings.

### Abstract vaccines

An abstract vaccine is defined by an exact combination of valences. It may represent a generic vaccine type rather than a particular commercial product.

### Real vaccines

A real vaccine represents a specific vaccine product or brand and is associated with an abstract vaccine.

## How alignment works

NUVA alignment starts with valences.

For each external code:

1. Review its label, description, and available documentation.
2. Identify the NUVA valences represented by the code.
3. Determine whether NUVA contains a vaccine with exactly that valence combination.
4. Confirm the external-code-to-NUVA mapping.

If a required valence does not exist, record a request for a new valence. If all required valences exist but their exact combination has no NUVA vaccine code, record a request for a new vaccine concept. The alignment remains pending until NUVA publishes the required concept.

Do not use a merely similar NUVA vaccine as an exact alignment.

## Starting a new alignment

1. Open **Alignment Workspace** and create a workspace for the external code system.
2. Import a CSV file containing at least a code and label for each source concept.
3. Review the source codes and assign their NUVA valences.
4. Confirm exact NUVA vaccine matches.
5. Record codes needing additional information or new NUVA concepts.
6. Download the workspace JSON regularly.
7. Export completed mappings and unresolved-work reports.

## Maintaining an existing alignment

1. Open **Alignment Workspace** and import the existing direct map.
2. Import updated source-system information when available.
3. Review new, changed, inactive, and unresolved source codes.
4. Reconcile the workspace after a NUVA update.
5. Export the revised direct map and change report.

Imported mappings are starting decisions. They are not automatically considered reviewed against the current versions of the source system and NUVA.

## Selecting and filtering valences

You can select a valence by clicking its tag in the Vaccines view or selecting it in the Valences view.

Selected valences can be used to:

- investigate a source code in the Alignment Workspace;
- assign valences to an abstract vaccine during core editing;
- filter vaccines to those containing all selected valences or more precise descendants; and
- filter the valence hierarchy to related parent and child concepts.

Grey selections in the valence hierarchy indicate inherited parent valences rather than independently selected valences.

## Working with NUVA core concepts

The Vaccines and Valences pages allow local creation and editing of NUVA core concepts. Modified concepts are visually distinguished from the loaded NUVA version.

These changes do not alter the published NUVA. Download changed Unit files from **Files and Recovery** and submit them through the established NUVA editorial process.

## Mapping analysis

A direct map records the exact NUVA meaning of each external code:

```text
External code -> NUVA vaccine
```

Mapping Analysis can reverse that relationship to show the best available external code for each NUVA concept:

```text
NUVA vaccine -> external code
```

The best available external code may be broader than the NUVA concept. The generated output indicates when detail is lost. Loading a second direct map can produce a transcription map between two external code systems through NUVA.

## Saving and protecting your work

The application stores working data only in your browser and in files you download.

- Download an Alignment Workspace JSON bundle to preserve or transfer alignment work.
- Download a core-editing backup before clearing browser data or resetting changes.
- Browser storage may be removed by browser settings, privacy tools, or device changes.
- Reset actions affect only your local working data.
- No work is submitted or published automatically.

Before exporting an alignment, verify the active code-system version and the NUVA version used for review.

## Getting help

If an external code cannot be aligned, record the unresolved question in the Alignment Workspace. Distinguish between insufficient source information, a missing valence, and a missing NUVA vaccine combination.

Use the repository issue process or the agreed NUVA contribution channel to request review, propose a new NUVA concept, or report a problem with the application.

---

## 14. Content implementation guidance

### Preserve the current application’s tone

The current application uses direct, functional language. The revised page should remain concise and technical rather than becoming promotional.

### Prefer task language over screen descriptions

Start sections with what the user is trying to accomplish. Introduce controls only after their purpose is clear.

### Use stable terminology

Use the same labels in navigation, headings, status values, exports, and documentation. In particular:

- Alignment Workspace;
- Mapping Analysis;
- abstract vaccine;
- real vaccine;
- valence;
- direct map;
- reverse map;
- transcription map;
- Unit file; and
- workspace bundle.

### Avoid overstating system behavior

Documentation must match the implemented storage, reconciliation, validation, and metric calculations. If behavior differs between hosted and local-file operation, explain both accurately.

### Link rather than duplicate detailed reference material

The Getting Started page should link to page-specific instructions, examples, metric definitions, contribution rules, and troubleshooting. This keeps the landing page useful without making it the only documentation source.

## 15. Recommended delivery sequence

### Initial documentation update

Implement with or immediately after the Alignment Workspace:

1. Rename Usage to Getting Started.
2. Add task selection.
3. Add concise NUVA concept definitions.
4. Explain valence-first alignment.
5. Separate alignment work from core editing.
6. Add new and existing alignment workflows.
7. Explain local storage and file recovery.
8. Rename Code Systems to Mapping Analysis.

### Next documentation increment

1. Add sample import and workspace files.
2. Add page-specific contextual help.
3. Document mapping metrics and output fields.
4. Add troubleshooting and frequently asked questions.
5. Link the editorial and repository contribution processes.

### Later improvements

1. Add a short guided example covering the complete alignment lifecycle.
2. Provide language-specific documentation if the contributor community requires it.
3. Add versioned documentation when workflows or workspace schemas change.

## 16. Success criteria

The revised documentation is successful when a first-time user can determine, without prior explanation:

- whether they should use Alignment Workspace, core editing, or Mapping Analysis;
- how valences lead to a NUVA vaccine alignment;
- what to do when NUVA lacks a required valence or vaccine combination;
- where their work is stored;
- which file preserves their complete work;
- which output can be submitted as a direct map;
- whether any browser action has changed published NUVA; and
- where to go for additional review or support.

