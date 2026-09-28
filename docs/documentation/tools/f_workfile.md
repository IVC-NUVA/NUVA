---
title: Work files
layout: default
parent: File formats
nav_order: 20
---
# Work files #
Workfiles gather in a single file all the information from the Unit files. They are used as an intermediate format by the [editor](editor) to :
  - retrieve the reference version of NUVA exposed from the [GitHub pages](github.md)
  - download or upload local copies of the state of work when modifying the NUVA core concepts.

They can be used to exchange a work version between contributors. Yet all submissions for a next version of NUVA must take the form of [Unit files](f_unitfile.md).

The workfile is a JSON file with the following structure.

```mermaid
treeView-beta
	version ## see below
	vaccines *
		abstract ## true|false
		status ## active|deprecated
		label ## text
		comment ## text
		valences ## Only if abstract
			- VALxxx: ##valence identifier
		instanceOf ## Only if real, vaccine identifier
		created ## date in format YYYY-MM-DD
		modified ## date in format YYYY-MM-DD
	valences *
		label ## text
		shorthand ## text
		vtype: ## text
		parent: ## valence identifier
		created: ## date in format YYYY-MM-DD
		modified: ## date in format YYYY-MM-DD
```
The fields have the same definition as in the [Unit files](f_unitfile.md).

## Versioning ##
The reference version produced by the [GitHub automated processus](github_actions.md) is versioned with the date of the most recent modification of a Unit file.

The local copies are versioned with the version of the reference version used to produce them, followed by /WORK. If several local copies are kept, they can be differentiated by their filenames , that have the form *nuvadataYYYY-MM-DD-HHMM.json*. 