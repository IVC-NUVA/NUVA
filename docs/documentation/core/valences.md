---
title: Valences
layout: default
parent: NUVA core
nav_order: 20
status: Draft
assignee: FK
---
# Valences
The valence is the minimal functional unit to characterize a vaccine. The most explicit ones represent a combination of antigens for a same target disease and a dose. For example, for pertussis, you will have the valences:

- aP: acellular pertussis, standard dose
- ap: acellular pertussis, low dose
- wP: whole cell pertussis

The granularity of valences is adapted to the real-world production of vaccines. There is no need to create individual valences for antigens aiming at variants of a same disease that are always associated. 

Beyond the valences for known vaccines there are abstract valences, that correspond to vaccination records with a degraded information. For example, we add to the three valences above the abstract valences:

- Per: Pertussis valence, unspecified
- Acel: Acellular pertussis vaccine, dose unspecified

Abstract valences are presented as parents of the real valences that they could represent.

```mermaid
treeView-beta
Valence    ## Common root for all valences
	Diph   ## Any diphtheria valence
	Per    ## Any pertussis valence
		Acel     ## Acellular pertussis
			ap   ## Acellular pertussis, low dose
			aP   ## Acellular pertussis, standard dose
		wP  ## Whole pertussis
	T    ## Tetanus valence
	...
	Yp   ## Yersinia pestis (Plague) valence
```


Concept codes for valences are formed as VALxxx, where xxx is a three digits number.

Immunoglobins against vaccine preventable diseases are considered as valences since their delivery impacts the vaccination strategy.