# NUVA concepts #
## Core concepts ##
The NUVA terminology consists of valences and vaccines, complemented with aligned code systems.
```
                 
     ┌─ Valence 
NUVA─┼─ Vaccine   
     └─ CodeSystem
```
### Valences ###
The valence is the minimal functional unit to characterize a vaccine. The most explicit ones represent a combination of antigens for a same target disease and a dose. For example, for pertussis, you will have the valences:

- aP: acellular pertussis, standard dose
- ap: acellular pertussis, low dose
- wP: whole cell pertussis

The granularity of valences is adapted to the real-world production of vaccines. There is no need to create individual valences for antigens aiming at variants of a same disease that are always associated. 

Beyond the valences for known vaccines there are abstract valences, that correspond to vaccination records with a degraded information. For example, we add to the three valences above the abstract valences:

- Per: Pertussis valence, unspecified
- Acel: Acellular pertussis vaccine, dose unspecified

Abstract valences are presented as parents of the real valences that they could represent.
```
                        ┌─ [ap]
        ┌─ Diph ┌─ Acel─┤
        ├─ Per ─┤       └ [aP]
Valence─┼─  T   └ wP
        :
        └ Yp-I
```

Concept codes for valences are formed as VALxxx, where xxx is a three digits number.

Immunoglobins against vaccine preventable diseases are considered as valences since their delivery impacts the vaccination strategy.
### Vaccines ###
Vaccine codes represent the vaccination trails at their best precision level:
- A fully qualified product (BOOSTRIXTETRA)
- A combination of valences (Tdap)
- A target disease (vaccine against rabies)

Contrary to valences, vaccines are not represented as a hierarchy, there are all immediate descendants of the Vaccine concept.

When a same product is commercialised in different territories under different brand names (such as BOOSTRIXTETRA, POLIO BOOSTRIX and BOOSTRIX-POLIO), since the production conditions may differ, one vaccine code is attributed for each brand name.

For a fully qualified product, the label is unique, not associated with a specific language, and matches the vaccine brand name.

For a combination of valences or a target disease, there is a label for each language.

Concept codes for vaccines are formed as VACxxxx, where xxxx is a 4 digits number.

## Bindings ##
### Target diseases ###
Target diseases represent the vaccine preventable diseases.

They are bound to top level valences by documenting them with the ICD-11 code for the prevented disease.
### External codes ###
External codes correspond to the representation of the vaccines in other code systems.

The aligned code systems are represented in NUVA as concepts. 
```
           ┌─ ATC 
CodeSystem─┼─ CVX
           :   
           └─ PZN
```
The codes themselves are represented as notations on the corresponding vaccine concept, with a datatype that is their code system.

A same vaccine may match several external codes from different code systems, such as pharmaceutical codes (CIS, CIP, PZN, CNK, etc.), logistical codes (GTIN), international vaccine codes (SNOMED-CT, ATC) or national vaccine codes (CVX, THL Rokotevalmisteet, etc.).

For a given external code there is one and only one vaccine code, corresponding to the same level of precision.

