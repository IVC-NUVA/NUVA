---
title: The NUVA editor
layout: default
parent: Tools
nav_order: 20
status: Void
assignee: FK
---
# The NUVA editor #
The NUVA editor is a tool proposed to the core maintener and the contributors to:
  - [browse](../usage/browsing.md) or [update](./usage/updating.md) the NUVA core content.
  - [align](../usage/aligning.md) another code system with NUVA
  - [reverse or transcribe](../usage/aligning.md) another code system.
  
It is available as an [online tool](/), but can also be replicated to another server or to the local file systems simply by copying the files from the [GitHub repository](github.md) folder `docs`.

The editor has:
  - a landing tab Usage, referencing this documentation.
  - an [editing tab for Vaccines](ed_vaccines.md)
  - an [editing tab for Valences](ed_valences.md)
  - an [editing tab for Code Systems](ed_codes.md)
  - a [files management tab](ed_files.md)
  
All editing tabs have:
  - A sidebar with, from top to bottom:
    - The menu to navigate across the tabs
	- A **Filter zone** to control the filtering of the main view
	- A **Context zone**, with context information that persists across tabs and in the browser storage.
	- The versions of the current and reference [workfiles](f_workfile.md).
  - A **main view** with the list of editable resources
  - A bottom **edit zone** where the currently selected resource can be modified.

The filter and context zone are specific to each editing zone and detailed in their documentatation pages.	

In the main view, the resources that were edited and differ from their reference data are presented in bold.