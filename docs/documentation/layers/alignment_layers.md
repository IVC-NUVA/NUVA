---
title: Alignment layers
layout: default
parent: Layers
nav-order: 20
status: Submitted
assignee: NB
---

# Alignment layers
[NUVA vaccines](../core/vaccines.md) is an aggregate of all vaccine concepts found in lists of products and in many code systems, either global or local.

For any code system, the [alignment process](../usage/aligning.md) consists in identifying the NUVA vaccine code that matches exactly each code in the code system.

This is performed by delivering an [alignment file](../tools/f_alignment.md). The [NUVA editor](../tools/editor.md) can be used to help in the constitution of such a file.

Such a file can be ingested by the [NUVA editor](../tools/editor.md) to generate a [reverse map](../tools/f_rmap.md) that identify the possible representations of any vaccine concept in NUVA in the original code system; or a [transcription map](../tools/f_rmap.md) from another code system to that one.

Declared alignments for all code systems are also incorporated into the [full RDF graph](../tools/f_rdffile.md) as attributes of the NUVA concept.




