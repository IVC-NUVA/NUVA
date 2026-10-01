---
title: RDF graphs
layout: default
parent: File formats
nav_order: 70
status: Submitted
assignee: NB
---

# RDF graphs #
RDF graphs are a representation of knowledge by triples of the form (subject, predicate, object). They are widely used in representation of knowledge and can be queried with the the SPARQL query language.

Several format exist for encoding a RDF graph. The format used here is Turtle, a compact and readable representation.

These files are generated from the [unit files](f_unitfile.md), [alignment files](f_alignment.md) and [language files](f_langfile.md) by the [GitHub automated processes](github_actions.md).

  - **nuva_core.ttl** is a minimal graph with vaccines and valences, only English labels.
  - **nuva_full.ttl** complements it with:
    - alignments with code systems
    - labels in other languages
  - Language files such as **nuva_fr.ttl** contains only the labels in a given language. They can be aggregated with **nuva_core.ttl** to obtain a translated version.

## Vaccine resource ##
### Structure ###

| Predicate | Card. | Object | Object type |  Meaning |
| ---       | ---   | ---    | ---         | ---      |
|rdf:type | 1 | owl:Class | Resource | Structural |
|rdfs:subClassOf | 1 |nuva:Vaccine\|nuva:VACxxxx | Resource | Structural |
| dcterms:created | 1 | literal | xsd:date | Date of creation |
|dcterms:modified | 1 | literal | xsd:date | Date of last publication |
|rdfs:label |1..*|literal | xsd:string | Short description (localized) or Brand name|
|rdfs:comment |1..*| literal | xsd:string | Long description (localized)|
|nuvs:containsValence|0..* | nuva:VALxxx | Resource | Included valence |
|skos:notation | 1 | VACxxxx | xsd:string | Full code for the concept |
|skos:notation | 0..*| literal | nuva:CS_X | Equivalent code in code system CS_X | 

### Notes ###
- Abstract vaccines are subclasses of nuva:Vaccine
- Real vaccines are subclasses their abstract vaccine
- Real vaccines do not have nuvs:containsValence attributes
- There is at most one localized string for a given predicate and language. Brand names are not localized.
- CS_X stands for one of the CodeSystem resources, such as ATC or CVX.
- There can be many notations for a same vaccine, including several notations within a same code system.
- A same notation cannot be attributed to two different vaccines.
### Examples from nuva_full.ttl ###
**Abstract vaccine**
```
nuva:VAC0859 a owl:Class ;
    rdfs:label "Vierwertiger HPV-Impfstoff, nicht näher bezeichnet"@de,
        "Εμβόλιο HPV τετραδύναμο, απροσδιόριστο"@el,
        "HPV vaccine quadrivalent, unspecified"@en,
        "Vaccin HPV quadrivalent, sans précision"@fr
    nuvs:containsValence nuva:VAL052,
        nuva:VAL238,
        nuva:VAL239,
        nuva:VAL240,
        nuva:VAL241 ;
    dcterms:created "2022-03-09"^^xsd:date ;
    dcterms:modified "2024-07-05"^^xsd:date ;
    rdfs:comment "Vierwertiger rekombinanter humaner Papillomavirus-Impfstoff, Typen 6, 11, 16 und 18"@de,
        "Τετραδύναμο ανασυνδυασμένο εμβόλιο του ιού των ανθρώπινων θηλωμάτων, τύποι 6, 11, 16 και 18"@el,
        "Human Papillomavirus vaccine, quadrivalent (types 6, 11, 16, and 18), recombinant"@en,
        "Vaccin contre les papillomavirus humains à base de VLP (Virus Like Particles ou pseudo particules virales), quadrivalent (types 6, 11, 16 et 18), recombinant, adsorbé"@fr,
    rdfs:subClassOf nuva:Vaccine ;
    skos:notation "J07BM01"^^nuva:ATC,
        "90649"^^nuva:CPT,
        "7801000087108"^^nuva:CVC,
        "62"^^nuva:CVX,
        "XM1821"^^nuva:ICD11,
        "0859"^^nuva:NUVACode,
        "10271002000108"^^nuva:SCT_NUVA,
        "2001000221108"^^nuva:SNOMED-CT,
        "VAC0859"^^xsd:string .
```
**Real vaccine**
```
nuva:VAC0007 a owl:Class ;
    rdfs:label "GARDASIL"^^xsd:string ;
    dcterms:created "2021-07-19"^^xsd:date ;
    dcterms:modified "2026-09-18"^^xsd:date ;
    rdfs:subClassOf nuva:VAC0859 ;
    skos:notation "037311"^^nuva:AIC,
        "68005349"^^nuva:CIS,
        "69604608"^^nuva:CIS,
        "2415586"^^nuva:CNK,
        "7351000087103"^^nuva:CVC,
        "02283190"^^nuva:DIN,
        "3514171"^^nuva:ELGA,
        "EU-1-06-357-001"^^nuva:EU-NUMBER,
        "5039243"^^nuva:INFARMED,
        "0007"^^nuva:NUVACode,
        "231002000102"^^nuva:SCT_NUVA,
        "57735"^^nuva:SWISSMEDIC,
        "18"^^nuva:THL,
        "VAC0007"^^xsd:string .
```

## Valence resource ##
### Structure ###

| Predicate | Card. | Object | Object type |  Meaning |
| ---       | ---   | ---    | ---         | ---      |
|rdf:type | 1 | owl:Class | Resource | Structural |
| dcterms:created | 1 | literal | xsd:date | Date of creation |
|dcterms:modified | 1 | literal | xsd:date | Date of last publication |
|rdfs:label |1..* | literal | xsd:string | Short description (localized)|
|skos:altLabel |1..*| literal |xsd:string |Short hand notation (localized) |
|rdfs:subClassOf |1 |nuva:VALxxx | Resource | Parent valence, or nuva:Valence for top-level valences |
|skos:notation | VALxxx | xsd:string | Full code for the concept |


### Example ###
```
nuva:VAL017 a owl:Class ;
    rdfs:label "Azelluläre Pertussis-Valenz, reduzierte Dosis"@de,
        "Ακυτταρική βακτηριακή βαλεντία κοκκύτη, μειωμένη δόση"@el,
        "Pertussis valence, acellular, reduced dose"@en,
        "Valence coqueluche, acellulaire, dose réduite"@fr,
        "Bezšūnu garā klepus valence, samazināta deva"@lv,
        "Wartość bezkomórkowej krztuścowej, zmniejszona dawka"@pl,
        "Valência acelular contra a coqueluche, dose reduzida"@pt ;
    dcterms:created "2021-07-19"^^xsd:date ;
    dcterms:modified "2025-04-29"^^xsd:date ;
    rdfs:subClassOf nuva:VAL117 ;
    skos:altLabel "ap"@de,
        "ap"@el,
        "ap"@en,
        "ca"@fr,
        "ap"@lv,
        "ap"@pl,
        "ap"@pt ;
    skos:notation "VAL017"^^xsd:string .
```


