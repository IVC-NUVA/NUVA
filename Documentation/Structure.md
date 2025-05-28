# Structure of resources #
This document exposes the structure of the RDF resources composing the NUVA.

## Vaccine resource ##
### Structure ###
| Predicate | Card. | Object | Object type |  Meaning |
| ---       | ---   | ---    | ---         | ---      |
|rdf:type | 1 | owl:Class | Resource | Structural |
|rdfs:subClassOf | 1 |nuva:Vaccine | Resource | Structural |
| dcterms:created | 1 | literal | xsd:date | Date of creation |
|dcterms:modified | 1 | literal | xsd:date | Date of last publication |
|rdfs:label |1..*|literal | xsd:string | Short description (localized) or Brand name|
|rdfs:comment |1..*| literal | xsd:string | Long description (localized)|
|nuvs:isAbstract |1 | literal | xsd:boolean | TRUE for abstract vaccines |
|nuvs:containsValence|1..* | nuva:VALxxx | Resource | Included valence |
|skos:notation | 1 | VACxxxx | xsd:string | Full code for the concept |
|skos:notation | 0..*| literal | nuva:CS_X | Equivalent code in code system CS_X | 

### Notes ###
- For a concrete vaccine, the long description is inherited from the abstract vaccine with exactly the same valence when building the RDF resources from the Unit files.
- There is at most one localized string for a given predicate and language. Brand names are not localized.
- CS_X stands for one of the CodeSystem resources, such as ATC or CVX.
- There can be many notations for a same vaccine, including several notations within a same code system.
- A same notation cannot be attributed to two different vaccines.
### Example ###
```
nuva:VAC0007 a owl:Class ;
    rdfs:subClassOf nuva:Vaccine ;
    dcterms:created "2021-07-19"^^xsd:date ;
    dcterms:modified "2024-09-09"^^xsd:date ;
    rdfs:label "GARDASIL" ;
    rdfs:comment "Human papillomavirus vaccine based on VLP (Virus Like Particles), quadrivalent (types 6, 11, 16 and 18), recombinant, adsorbed"@en ;
    nuvs:isAbstract false ;
    nuvs:containsValence nuva:VAL052,nuva:VAL238,nuva:VAL239,nuva:VAL240,nuva:VAL241 ;
    skos:notation "VAC0007","0007"^^nuva:NUVA","2415586"^^nuva:CNK"
```
## Valence resource ##
### Structure ###
| Predicate | Card. | Object | Object type |  Meaning |
| ---       | ---   | ---    | ---         | ---      |
|rdf:type | 1 | owl:Class | Resource | Structural |
| dcterms:created | 1 | literal | xsd:date | Date of creation |
|dcterms:modified | 1 | literal | xsd:date | Date of last publication |
|rdfs:label |1..* | literal | xsd:string | Short description (localized)|
|rdfs:comment |1..* | literal | xsd:string | Long description (localized)|
|skos:altLabel |1..*| literal |xsd:string |Short hand notation (localized) |
|rdfs:subClassOf |1 |nuva:VALxxx | Resource | Parent valence, or nuva:Valence for top-level valences |
|nuvs:prevents | 1..* | literal |xsd:string | ICD-11 for the target disease |
|skos:notation | VALxxx | xsd:string | Full code for the concept |

### Notes ###
- There is at most one localized string for a given predicate and language.
- The target disease is inherited from the top-level valence when building the RDF resources from the Unit files.

### Example ###
```
nuva:VAL017 a owl:Class ;
    dcterms:created "2021-07-19"^^xsd:date ;
    dcterms:modified "2025-04-29"^^xsd:date ;
    rdfs:label "Pertussis valence, acellular, reduced dose"@en ;
    rdfs:comment "Pertussis valence, acellular, reduced dose for pediatric use"@en ;
    skos:altLabel "ap"@en ;
    rdfs:subClassOf nuva:VAL117;
    nuvs:prevents 1C12.Z ;
    skos:notation "VAL017" .
```
## CodeSystem resource ##
### Structure ###
| Predicate | Card. | Object | Object type |  Meaning |
| ---       | ---   | ---    | ---         | ---      |
|rdf:type | 1 | owl:Class | Resource | Structural |
|rdfs:subClassOf | 1 |nuva:CodeSystem | Resource | Structural |
| dcterms:created | 1 | literal | xsd:date | Date of creation |
| dcterms:modified | 1 | literal | xsd:date | Date of last publication |
|rdfs:comment | 1..* | literal |xsd:string | Localized description of the code system |

### Notes ###
- The date of last publication is updated each time a RDF publication is done with changes in alignments for the given code system.

### Example ###
```
nuva:ATC a owl:Class ;
    rdfs:subClassOf nuva:CodeSystem;
    dcterms:created "2021-07-19"^^xsd:date ;
    dcterms:modified "2025-04-29"^^xsd:date ;
    rdfs:comment "The global Anatomical Therapeutic Chemical classification published by WHO"@en ;
```
### Notes ###
These resources are here only for assigning a type to the Vaccine notations representing an aligned code.

