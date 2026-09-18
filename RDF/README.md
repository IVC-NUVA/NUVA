# RDF files

**nuva_core.ttl** is a minimal graph with vaccines and valences, only English labels.

**nuva_full.ttl** complements it with:
- alignments with code systems
- labels in other languages

Language files such as **nuva_fr.ttl** contains only the labels in a given language. They can be aggregated with nuva_core to obtain a translated version.

These files are generated from:
- The Unit files (YAML format) describing vaccines and valences.
- The translation files (YAML format) edited with Weblate.
- The alignment files (CSV) mapping codes from other systems with NUVA codes.
