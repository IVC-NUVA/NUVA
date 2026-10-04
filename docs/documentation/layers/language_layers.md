---
title: Language layers
layout: default
parent: Layers
nav-order: 10
status: Submitted
assignee: NB
---
# Language layers #

The [NUVA core](../core/core.md) concepts have text attributes that are expressed in English.
- labels of [abstract vaccines](../core/vaccines.md)
- comments of [vaccines](../core/vaccines.md)
- labels of [valences](../core/valences.md)
- shorthand notation for [valences](../core/valences.md)

Language layers consist of the translations of these attributes to a given language.

Their production is done using the [Weblate](../tools/weblate.md) to provide localized equivalent to the original English language file. It means that localized labels will be missing in the interval between the publication of a version of the core and the [translation process](../usage/translating.md). It is recommended that the systems using the NUVA use systematically the English text present in the NUVA core distribution as a fallback in case a localized text would be missing.

The source format for a language layer is a [structured file](../tools/f_langfile.md) binding a key for the text and the corresponding translation.

For simpler use by consuming systems, language layers are also:
  - exported in [flat files](../tools/f_flatfile.md) of vaccines and valences.
  - included into the [full RDF graph](../tools/f_rdffile.md).

