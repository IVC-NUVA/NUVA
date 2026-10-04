---
title: Vaccines
layout: default
parent: NUVA core
nav_order: 10
status: Draft
assignee: FK
---
# Vaccines #
Vaccine codes represent the vaccination trails at their best precision level:
- A fully qualified product (BOOSTRIXTETRA)
- A combination of valences (Tdap)
- A target disease (vaccine against rabies)

Three types of vaccine codes are identified:
- `Abstract` vaccines codes correspond to classes of vaccines with a same set of valences. They are characterized by their valences.
- `Real` vaccines codes correspond to identified products. They are characterized by the abstract vaccine class to which they belong.
- `Deprecated` vaccine codes correspond to concepts that are no longer in use. They could have been originally abstract or real vaccines, but if they are encountered into a record they should be interpreted, and if possible replaced, by the abstract vaccine class to which they belong.

When a same product is commercialised in different territories under different brand names (such as BOOSTRIXTETRA, POLIO BOOSTRIX and BOOSTRIX-POLIO), since the production conditions may differ, one vaccine code is attributed for each brand name.

For a fully qualified product, the label is unique, not associated with a specific language, and matches the vaccine brand name.

For a combination of valences or a target disease, there is a label for each language.

Concept codes for vaccines are formed as VACxxxx, where xxxx is a 4 digits number.
