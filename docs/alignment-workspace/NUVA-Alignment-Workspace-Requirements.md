# NUVA Alignment Workspace Requirements

## 1. Purpose

The NUVA Alignment Workspace will support creation and ongoing maintenance of alignments between an external vaccine code system and NUVA.

The existing NUVA code-system tools analyze a completed direct mapping. The Alignment Workspace will support the earlier work required to produce and maintain that mapping: importing source codes, determining their valences, identifying the corresponding NUVA vaccine concept, documenting unresolved questions, and tracking requests for additions to NUVA.

The feature must operate entirely in the browser. It will not require a server-side application, database, user account, or authentication system.

## 2. Core model

NUVA alignment is a valence-first process.

For each external code, the user determines which NUVA valences represent its meaning. The application then looks for an active NUVA vaccine concept containing exactly that combination of valences.

The possible outcomes are:

1. All required valences exist and an exact vaccine combination exists. The alignment can be completed.
2. A required valence does not exist. The alignment waits for creation of a new NUVA valence.
3. All required valences exist, but NUVA does not contain a vaccine concept for that exact combination. The alignment waits for creation of a new NUVA vaccine code.
4. Available source information is insufficient to determine the valences.
5. The source concept is outside the scope of NUVA.

The final direct map associates an external code with a NUVA vaccine code. The selected valences and review history explain how that association was reached.

## 3. Design principles

### 3.1 Separation from NUVA core maintenance

The Alignment Workspace must treat NUVA vaccines and valences as read-only reference data. It must not edit NUVA core resources.

When alignment work identifies a missing valence or vaccine combination, the workspace records a request that can be communicated to NUVA maintainers. The alignment can be resumed after a later NUVA version supplies the required concept.

### 3.2 One active alignment

The application will work with one external code-system alignment at a time.

Users may save the active workspace to a local JSON file, close it, work on another alignment, and later reopen the saved workspace. The application does not need to manage a library of multiple alignments internally.

### 3.3 Portable work product

The complete alignment workspace must be exportable as a self-contained JSON bundle. That bundle is the portable work product used to resume work, transfer it to another computer, or share it with another reviewer.

### 3.4 Independent NUVA upgrades

The workspace must not embed or modify a complete copy of NUVA. It records the NUVA version used for review and references NUVA concepts by identifier.

A saved alignment must be reopenable against a newer NUVA version. The application will reconcile saved work with the current NUVA data and identify items requiring attention.

### 3.5 Compatibility with the existing application

The feature should look and behave like the existing NUVA editor, reuse its established terminology and interaction patterns, and avoid unnecessary new dependencies.

The contribution should remain logically separate from the existing core editing functions so it can be reviewed and integrated as a focused feature.

## 4. Primary use cases

### UC-1: Create a new alignment workspace

A user creates a workspace for an external code system and supplies:

- code-system identifier;
- display name;
- version or publication date, when known;
- owning organization, when known;
- jurisdiction or country, when relevant;
- source URL, when available; and
- general notes.

The code-system identifier and display name are required. Other metadata may be added later.

### UC-2: Import a new source code list

A user imports a CSV file containing external codes.

The supported source fields are:

| Field | Requirement |
|---|---|
| Code | Required |
| Label | Required |
| Description | Optional |
| Notes | Optional |

The import process should allow the user to associate input columns with these fields. Additional source columns should be preserved when practical so that importing and exporting the workspace does not discard potentially useful source information.

The application must identify missing required values and duplicate source codes before completing the import.

### UC-3: Start from an existing alignment

A user may initialize a workspace from an existing direct mapping such as `CVX2nuva.csv`.

For each imported mapping, the application will:

- create or match the external code record;
- retain the previously assigned NUVA vaccine code;
- derive the associated valence combination from the NUVA vaccine;
- identify the mapping as imported rather than newly reviewed; and
- retain available source labels and other supplied fields.

An imported alignment becomes the baseline for continuing maintenance. Importing it must not imply that every mapping has been reviewed against the current source-system and NUVA versions.

### UC-4: Review a source code

The user selects one external code from the work queue and reviews its code, label, description, source notes, and any additional imported fields.

The user can then:

- select the NUVA valences represented by the source concept;
- search or browse the NUVA valence hierarchy;
- view the NUVA vaccine concept, if any, matching the exact valence combination;
- record mapping notes and supporting rationale;
- record confidence in a completed mapping;
- identify unanswered questions; and
- assign the appropriate workflow status.

### UC-5: Complete an alignment

When all selected valences exist and an active NUVA vaccine has exactly the same valence combination, the application presents that vaccine as the alignment candidate.

The user confirms the mapping. The workspace records:

- selected valence identifiers;
- selected NUVA vaccine code;
- NUVA version used;
- confidence;
- review notes; and
- modification date.

The user must be able to revise a completed mapping later without losing the previous decision.

### UC-6: Record a missing valence

If the source concept requires a valence that does not exist in NUVA, the user can create a provisional valence request within the workspace.

The request should support:

- a workspace-local identifier;
- proposed label;
- description or definition;
- proposed parent valence, when known;
- rationale;
- affected source codes;
- request status;
- assigned NUVA valence code, once created; and
- notes or references needed for submission to NUVA maintainers.

The affected alignments remain incomplete while waiting for the official valence.

### UC-7: Record a missing NUVA vaccine combination

If all required valences exist but no active NUVA vaccine represents exactly that valence combination, the application records a provisional vaccine request.

The request should support:

- a workspace-local identifier;
- selected NUVA valences;
- proposed label, when known;
- rationale;
- affected source codes;
- request status;
- assigned NUVA vaccine code, once created; and
- notes or references needed for submission to NUVA maintainers.

### UC-8: Request help or additional information

The user can mark a record as needing help when the source definition is unclear or another reviewer is required.

The record must retain:

- the work already performed;
- selected or candidate valences;
- candidate NUVA concepts, if any;
- specific questions; and
- review notes.

### UC-9: Save and resume work

The application automatically preserves the active workspace in browser storage.

The user can also download the complete workspace as JSON and later reopen it. Loading a bundle replaces the active workspace only after the user has had an opportunity to save unsaved work.

The application should display the current save state and the NUVA version against which the workspace was last reviewed.

### UC-10: Reconcile with an updated source code system

A user can load a newer source-code file into an existing workspace.

The application identifies:

- newly added source codes;
- source codes missing from the new source file;
- changed labels;
- changed descriptions;
- changed source notes or additional fields; and
- duplicate or otherwise invalid source records.

Existing alignment decisions must not be silently discarded. Records affected by substantive source changes should be flagged for review.

### UC-11: Reconcile with an updated NUVA version

When a saved workspace is opened against newer NUVA data, the application identifies:

- selected valences that no longer exist;
- deprecated valences;
- mapped vaccine concepts that no longer exist or are deprecated;
- provisional valence requests that may now be resolvable;
- provisional vaccine requests whose exact valence combination now exists; and
- previously completed records whose NUVA references require review.

The application may suggest resolutions but must not silently change confirmed mappings.

### UC-12: Export completed direct mappings

The user can export completed alignments in the direct-map CSV format expected by the existing NUVA code-system analysis tools.

Only mappings eligible for publication should be included. Records that are unresolved, awaiting NUVA additions, out of scope, or marked for further review must be excluded unless the user deliberately selects a broader diagnostic export.

### UC-13: Export a review and NUVA-request report

The user can export a report containing:

- unmapped records;
- records needing information or help;
- low-confidence mappings;
- requested new valences;
- requested new NUVA vaccine combinations;
- records affected by source-system changes;
- records affected by NUVA changes; and
- progress totals.

The report should be suitable for discussion with NUVA maintainers and other code-system experts.

## 5. Functional requirements

### 5.1 Workspace management

- **FR-1:** The application shall create a new alignment workspace with code-system metadata.
- **FR-2:** The application shall maintain only one active workspace at a time.
- **FR-3:** The application shall indicate whether the active workspace has changes not yet exported to a JSON bundle.
- **FR-4:** The application shall allow the user to clear or replace the active workspace without affecting NUVA core data.

### 5.2 Source-data import

- **FR-5:** The application shall import CSV source data with required code and label fields.
- **FR-6:** The application shall support optional description and notes fields.
- **FR-7:** The application shall allow mapping source columns to supported fields.
- **FR-8:** The application shall detect duplicate codes and missing required values.
- **FR-9:** The application shall preserve additional imported fields when practical.
- **FR-10:** The application shall support initializing or updating a workspace from an existing external-code-to-NUVA direct map.

### 5.3 Work queue

- **FR-11:** The application shall display all source codes with their workflow status.
- **FR-12:** The application shall show progress totals by status.
- **FR-13:** The user shall be able to filter records by status, confidence, change indicator, and text search.
- **FR-14:** The user shall be able to move efficiently to the next unresolved record.

### 5.4 Valence-first analysis

- **FR-15:** The user shall be able to browse, search, and select NUVA valences for a source code.
- **FR-16:** The application shall preserve selected valences with the source-code record.
- **FR-17:** The application shall determine whether an active NUVA vaccine has exactly the selected valence combination.
- **FR-18:** The application shall distinguish an exact combination from broader, narrower, or otherwise non-equivalent candidates.
- **FR-19:** The application shall not treat a merely similar NUVA concept as a completed exact alignment.
- **FR-20:** The application shall derive valences from an imported NUVA vaccine mapping when possible.

### 5.5 Missing NUVA content

- **FR-21:** The user shall be able to record a provisional request for a missing valence.
- **FR-22:** The user shall be able to record a provisional request for a missing NUVA vaccine combination.
- **FR-23:** The application shall associate each request with all affected source codes.
- **FR-24:** The application shall retain requests across save and restore operations.
- **FR-25:** The application shall allow a provisional request to be resolved to an official NUVA identifier later.

### 5.6 Review and maintenance

- **FR-26:** The application shall distinguish imported mappings from mappings reviewed in the workspace.
- **FR-27:** The user shall be able to record confidence, rationale, questions, and review notes.
- **FR-28:** The application shall retain the previous decision when a mapping changes.
- **FR-29:** The application shall identify differences when source data is refreshed.
- **FR-30:** The application shall identify relevant changes when the NUVA catalog is upgraded.
- **FR-31:** The application shall not silently replace selected valences or confirmed NUVA mappings during reconciliation.

### 5.7 Persistence and export

- **FR-32:** The application shall automatically store the active workspace in the browser.
- **FR-33:** The user shall be able to export the complete workspace as JSON.
- **FR-34:** The user shall be able to restore a workspace from an exported JSON bundle.
- **FR-35:** The JSON format shall include a schema version.
- **FR-36:** The application shall validate a bundle before replacing the active workspace.
- **FR-37:** The user shall be able to export publication-eligible mappings in the existing direct-map CSV format.
- **FR-38:** The user shall be able to export an unresolved-work and NUVA-request report.
- **FR-39:** Exporting and reimporting a workspace without edits shall not lose alignment information.

## 6. Workflow statuses

Each source-code record shall have one primary alignment workflow status:

| Status | Meaning |
|---|---|
| `unreviewed` | No alignment analysis has been performed |
| `imported` | A mapping was loaded from an existing alignment but not reviewed in this workspace |
| `in_progress` | Analysis has started but no final outcome has been reached |
| `needs_information` | Source information is insufficient |
| `awaiting_new_valence` | A required NUVA valence does not exist |
| `awaiting_new_vaccine` | Valences exist but their exact combination lacks a NUVA vaccine code |
| `needs_review` | Another reviewer or decision is required |
| `aligned` | An exact NUVA alignment has been confirmed |
| `out_of_scope` | The source concept is outside NUVA’s scope |

Confidence is separate from workflow status and applies primarily to proposed or completed mappings. Initial values may be `high`, `medium`, and `low`.

Source-code lifecycle is also separate from workflow status. Initial values may be `active`, `inactive`, and `unknown`.

The application may calculate additional change indicators rather than storing them as the primary status. Examples include new source code, changed definition, missing from current source, deprecated NUVA reference, and newly resolvable request.

## 7. Conceptual data model

### 7.1 Alignment workspace

The workspace contains:

- schema version;
- workspace identifier;
- code-system metadata;
- baseline alignment metadata, when applicable;
- source-system version;
- NUVA version last reviewed;
- creation and modification dates;
- source-code records;
- provisional NUVA requests; and
- workspace-level notes.

### 7.2 Code-system metadata

The code-system metadata contains:

- identifier;
- name;
- version or publication date;
- owner;
- jurisdiction;
- source URL; and
- notes.

### 7.3 Source-code record

Each source-code record contains:

- source code;
- label;
- description;
- source notes;
- additional imported fields;
- source lifecycle status;
- selected NUVA valence identifiers;
- provisional valence references;
- imported or selected NUVA vaccine code;
- workflow status;
- confidence;
- review rationale;
- review notes;
- unanswered questions;
- NUVA version used for the latest decision;
- change indicators;
- creation and modification dates; and
- decision history.

### 7.4 Provisional valence request

A provisional valence request contains:

- workspace-local identifier;
- proposed label and description;
- proposed parent, when known;
- rationale;
- affected source-code identifiers;
- request status;
- official NUVA valence identifier, once assigned;
- notes and references; and
- creation and modification dates.

### 7.5 Provisional vaccine request

A provisional vaccine request contains:

- workspace-local identifier;
- exact valence set;
- proposed label, when known;
- rationale;
- affected source-code identifiers;
- request status;
- official NUVA vaccine identifier, once assigned;
- notes and references; and
- creation and modification dates.

### 7.6 Decision history

Decision history retains material changes such as:

- previous valence selection;
- previous NUVA mapping;
- previous workflow status;
- modification date; and
- reason or review note.

Because the application has no authentication, this history is an editorial aid rather than a tamper-proof audit log. A reviewer name may be recorded as optional user-entered metadata.

## 8. Technology requirements

- **TR-1:** The feature shall operate as a static browser application.
- **TR-2:** All source-code data, alignment decisions, notes, and provisional requests shall remain client-side unless the user explicitly exports a file.
- **TR-3:** The feature shall not require a backend service, server-side database, authentication provider, or user account.
- **TR-4:** The feature shall use standard browser technologies compatible with the existing application: HTML, CSS, and JavaScript.
- **TR-5:** The feature should avoid external runtime dependencies unless repository analysis demonstrates a compelling need.
- **TR-6:** Persistent automatic storage should use a browser-supported client-side data store suitable for structured alignment data. IndexedDB is preferred over relying exclusively on `localStorage`.
- **TR-7:** JSON workspace export and import shall remain available regardless of automatic browser storage.
- **TR-8:** NUVA core data shall be loaded separately from alignment workspace data and treated as read-only.
- **TR-9:** The application shall continue to function through static hosting such as GitHub Pages.
- **TR-10:** The feature shall not require direct local-file write access. User-initiated browser downloads and uploads are sufficient.

## 9. Validation requirements

The application shall validate at least the following:

- required workspace metadata;
- required source code and label;
- unique source code within a workspace;
- supported workspace schema version;
- existence of referenced NUVA valences and vaccines;
- use of active versus deprecated NUVA concepts;
- exact correspondence between the selected valence set and a completed abstract vaccine alignment;
- unresolved provisional references;
- eligibility of records included in the publication-ready export; and
- preservation of all required data during JSON round trips.

Warnings should preserve the user’s work whenever possible. Validation failures should not silently delete, replace, or normalize source information.

## 10. Usability requirements

- The user must be able to understand overall progress without opening every record.
- Source information, alignment reasoning, and NUVA reference data must remain visually distinguishable.
- Records blocked on NUVA changes must be easy to find.
- Existing valence-selection behavior should be reused or followed closely where practical.
- The user should be able to complete repeated review actions without excessive navigation.
- Potentially destructive actions, such as replacing the active workspace, must provide an opportunity to preserve current work.
- The interface must clearly identify the active code system and NUVA version.

## 11. Required outputs

The feature shall support these outputs:

1. **Workspace JSON bundle:** Complete portable state needed to resume the alignment.
2. **Direct-map CSV:** Publication-eligible external-code-to-NUVA mappings compatible with existing analysis tools.
3. **Review report:** Unresolved records, low-confidence decisions, and source or NUVA changes requiring attention.
4. **NUVA request report:** Proposed new valences and vaccine combinations, including affected external codes and supporting rationale.
5. **Change report:** Differences from the imported baseline or previous source-system version.

The review, NUVA-request, and change information may be combined into one report initially if all required information remains clear.

## 12. Out of scope for the initial feature

The initial feature does not need to provide:

- authentication or authorization;
- simultaneous multiuser editing;
- a server-side data store;
- automatic submission to the NUVA repository;
- automatic creation or modification of NUVA Unit files;
- automatic approval of mappings;
- AI-generated mapping decisions;
- management of multiple active workspaces inside the browser;
- conflict resolution between separately edited workspace bundles; or
- a cryptographically reliable audit trail.

The design should not unnecessarily prevent these capabilities later, but they are not requirements for the initial pull request.

## 13. Initial acceptance criteria

The initial feature is successful when a user can:

1. Create a workspace for a new code system or initialize one from an existing direct map such as CVX.
2. Import records containing code and label, with optional description and notes.
3. Review one code at a time and assign NUVA valences.
4. Have the application find an exact NUVA vaccine for the selected valence combination.
5. Record that a required valence or vaccine combination is missing.
6. Track progress and filter unresolved work.
7. Save the complete workspace to JSON and restore it without losing information.
8. Reopen saved work against updated NUVA data and receive reconciliation warnings or suggestions.
9. Export confirmed mappings in the existing direct-map format.
10. Export unresolved work and proposed NUVA additions for review.

## 14. Guidance for repository integration

Before implementing the feature, review the existing NUVA editor’s data structures, valence selection behavior, navigation, visual styling, generated NUVA data, and direct-map format.

The implementation should integrate naturally with those conventions while keeping alignment workspace state separate from NUVA core editing state. Changes to existing files should be limited to integration needs and should avoid unrelated refactoring.

