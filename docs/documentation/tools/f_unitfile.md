---
title: Unit files
layout: default
parent: File formats
nav_order: 10
status: Submitted
assignee: NB
---
# Unit files #
Unit files are the reference for the published version of NUVA.

There is one Unit file for each NUVA concept of vaccine or valence, allowing for individual tracking of their changes in the GitHub history of files.

All other representations of NUVA are derived from the [Unit files](f_unitfile.md) by the [GitHub automated processes](github_actions.md). When needed, they also fetch information from the  [language files](f_langfile.md) and [alignment files](f_alignment.md).

Unit files are using the YAML format, intended to be easily interpreted both by humans and by machines. THey are named *VACxxxx.yml* for Vaccine units or *VALxxx.yml* for Valence units.

## Vaccine units
Vaccine units exist with two structures, depending upon whether they correspond to abstract vaccines, that are described by enumerating their valences, or to real and deprecated vaccines, that are described as an instance of a given abstract vaccine.
### Abstract vaccines
Abstract vaccines are characterized by:
  - A `type` set to 'abstract'.
  - A `label` describing the concept.
  - An optional `comment` for further information.
  - A list `valences` of the identifiers of the included valences.
  - Dates when the concept was `created`or last `modfied`.

**Example**: `VAC0610.yml`
```
type: abstract
label: Tdap - Diphtheria-Tetanus-Pertussis vaccine, low dose, unspecified
comment: Diphtheria toxoid (low dose), tetanus toxoid and pertussis (multicomponent
  acellular, low dose) vaccine
created: '2021-07-19'
modified: '2025-05-20'
valences:
- VAL017
- VAL034
- VAL067
```
### Real and deprecated vaccines
Real vaccines are characterized by:
  - A `type` set to 'real' or 'deprecated'.
  - A `label` corresponding to the brand name.
  - An optional `comment` for further information.
  - An `instanceOf` attribute expressing to which abstract vaccine is associated this real one.
  - Dates when the concept was `created`or last `modfied`.

**Example**: `VAC0182.yml`
```
type: real
label: ADACEL
created: '2021-07-19'
modified: '2026-09-13'
instanceOf: VAC0610
```  
## Valence units
Valences are characterized by:
  - A `label` describing the valence
  - A `shorthand` notation corresponding to the usual representation of the valence, such as ap for "acellular pertussis, reduced dose".
  - A `vtype`string representing the [valence type](/documentation/core/Valence types.md).
  - The identifier of the `parent` valence.
  - Dates when the concept was `created`or last `modfied`.

*Example* : `VAL017.yml`
```
label: Pertussis valence, acellular, reduced dose
created: '2021-07-19'
modified: '2025-04-29'
shorthand: ap
vtype: '0'
parent: VAL117
```


