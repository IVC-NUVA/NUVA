---
title: To be done
layout: default
parent: Internal
---
# To be done #
Apart of the work on writing the documentation pages.

## SYADEM scientific team
- Review comments for all vaccines, remove the ones that are just restating the description of the abstract vaccine (reduces drastically the number of translations)
## SYADEM technical team
- Rework the proprietary editor to use the Unit files
## François
- Propose a workflow for translations, configure Weblate accordingly.
- Define the code systems unit files and RDF resources

## IVCI
- Define a structured description for layers (owner, description, references and links, revision date, etc.)
- Organize the scientific committee.
- Mandate owners for alignment files

## Open questions
- Vaccine status: currently `active` and `deprecated`. Should we add `historical` ? (would be useful, but mixes informations about the code and about the vaccine itself).
- Should we reintroduce the target disease concept ? How (inherited from a top level valence)?
- Default data is currently always fetched at the latest version. Should it rather be cached in the local storage, with an explicit action to reload it ?
