---
title: Publication path
layout: default
parent: Internal
status: Submitted
assignee: NB
---
# Publication path #
### Earlier publication path

```mermaid
flowchart TD
  subgraph SYADEM
    SYA1["SYADEM proprietary editor"]
	SYA2(["JSON format for SYADEM tools"])
	SYA3(["French agency RDF format"])
  end
  subgraph IVC Server
    IVC1["IVCI server retrieval and URI rebasing"]
    IVC2(["Published NUVA graph"])	
    IVC3["Mail notification to subscribers"]	
  end
  subgraph GitHub
    GH1(["Unit files"])
	GH2["Triggered actions"]
    GH3(["RDF and CSV files"])	
  end
  subgraph Exports
    ANS
	SCT
  end
  
	SYA1 -->|publication| SYA2
    SYA1 -->|publication| SYA3
	SYA3 -->|monthly| ANS["French agency terminology server"]
    SYA3 -->|hourly| IVC1
    IVC1 -->|if change| IVC2
	IVC1 -->|if change| IVC3
	IVC2 -->|yearly| SCT["SNOMED Extension publication"]
    IVC2 -->|manually triggered conversion| GH1
    GH1 -->|auto| GH2
    GH2 --> GH3
```

This path made SYADEM’s internal resource management system the practical source of changes. Unit files were downstream products reconstructed from RDF.

### Current publication path
  - Data is fetched from SYADEM using its internal publication format, and merged with the Unit files that contain new notions (such as the valence types).
  - Exports (French eHealth agency and SNOMED) and notifications not impacted yet.

```mermaid
---
config:
  layout: dagre
---
flowchart TD
  subgraph SYADEM
    SYA1["SYADEM proprietary editor"]
	SYA2(["JSON format for SYADEM tools"])
	SYA3(["French agency RDF format"])
  end
  subgraph GitHub
    GH1(["Unit files"])
	GH2["Triggered actions"]
	GH3(["JSON reference for editors"])
    GH5(["RDF and CSV files"])		
  end
  subgraph Local
    LOC1["Local browser editor"]
	LOC2(["changed YAML files"])
	LOC3(["Local worfiles"])
  end
  subgraph IVC Server
    IVC1["IVCI server retrieval and URI rebasing"]
    IVC2(["Published NUVA graph"])	
    IVC3["Mail notification to subscribers"]	
  end
  subgraph Exports
    ANS["French agency terminology server"]
	SCT["SNOMED Extension publication"]
  end 
	SYA1 -->|publication| SYA2
    SYA1 -->|publication| SYA3
	SYA3 -->|monthly| ANS["French agency terminology server"]
    SYA3 -->|automated| IVC1
    SYA2 -->|manually triggered merge| GH1
    GH1 -->|auto| GH2
	GH2 --> GH5
	GH2 --> GH3
    GH3 -->|user| LOC1
    LOC1 -->|user| LOC2
	LOC1 -->|user| LOC3
    LOC2 -->|request| GH4["Submission process"]
    GH4 -->|push| GH1
    IVC1 -->|if change| IVC2
	IVC1 -->|if change| IVC3
	IVC2 -->|yearly| SCT
```


### Target publication path
  - Unit files become authoritative for all users, including SYADEM.
  - The IVC server is removed from the publication path.
  - Exports and notifications are done from the GitHub publications.

```mermaid
flowchart TD
  subgraph SYADEM
    SYA1["SYADEM proprietary editor"]
	SYA3(["JSON format for SYADEM tools"])
  end
  subgraph GitHub
    GH1(["Unit files"])
	GH2["Triggered actions"]
	GH3(["JSON reference for editors"])
    GH5(["RDF and CSV files"])
	GH6["Mail notification to subscribers"]	
  end
  subgraph Local
    LOC1["Local browser editor"]
	LOC2(["changed YAML files"])
	LOC3(["Local worfiles"])
  end
  subgraph Exports
    ANS["French agency terminology server"]
	SCT["SNOMED Extension publication"]
  end   
	SYA1 -->|publication| GH1
	SYA1 --> SYA3
	GH5 -->|monthly| ANS
	GH1 -->|if change| GH6
	GH5 -->|monthly| SCT
    GH1 -->|auto| GH2
	GH2 --> GH5
	GH2 --> GH3
	GH3 -->|import| SYA1
    GH3 -->|user| LOC1
    LOC1 -->|user| LOC2
	LOC1 -->|user| LOC3
    LOC2 -->|request| GH4["Submission process"]
    GH4 -->|push| GH1
```
