---
title: Alignment files
layout: default
parent: File formats
nav_order: 30
status: Submitted
assignee: NB
---
# Alignment files #
Alignment files are elaborated by code system owners. They are simple CSV file, with commas as column separators.

They can be edited with a worksheet editor. In regions where Excel uses the semicolon as the CSV separator, OpenOffice can be used as an alternative.

## Columns
The alignment file has 2 to 4 columns:
  - Column 1 is the code in the code system
  - Column 2 is its direct equivalent in NUVA
  - Optional column 3 is the textual description of the code in its code system
  - Optional column 4 is the textual description of the NUVA code
  
Only columns 1 and 2 are required when importing an alignment table into the editor.

If column 3 is present, it will be reused in the [code system reverse map](f_rmap.md).

Column 4 is automatically filled by the editor when exporting an alignment table.

## Headers
THe first row in the table contains titles. The title in the first column is used as the code system identifier.

## Conventions
  - To avoid unwanted conversions by worksheet editors from strings to numbers, all codes in column 1 are prefixed with the code system identifier and a dash. \
  For example, `CVX-56` is used for the CVX 56 code, "Dengue fever, tetravalent".
  - Code values that should no longer be used are prefixed with a #. This allows to interpret them if they are found into legacy records, but to exclude them from further transcriptions.\
  For example, `CVX-#15` is a former code for Influenza vaccines.
  - NUVA codes in column 2 are expected to be either:
    - a correctly formed vaccine code `VACxxxx` (VAC followed by 4 digits).
	- `#NA` if the concept in the original code system does not belong to the NUVA domain (e.g. `CVX-98` is a tuberculin skin test, that is not a vaccine nor an antibody).
	- `#MIS` if the concept should belong to NUVA, but is missing for now.
  - When exported from [the editor](editor.md), the alignment file is named *ident2nuva_YYYY-MM-DD.csv*, where *ident* stands for the code system identifier found in the header and *YYYY-MM-DD* is the day of the export.
	
## Example
This is an excerpt of the *cvx2nuva.csv* alignment file.
```
CVX,NUVA,CVX label, NUVA label
CVX-19,VAC0134,"Bacillus Calmette-Guerin vaccine","BCG vaccine, unspecified"
CVX-27,VAC0909,"botulinum antitoxin","Botulinum antitoxin"
CVX-95,#NA,"tuberculin skin test; old tuberculin, multipuncture device",
CVX-194,#MISS,"influenza, Southern Hemisphere, unspecified formulation",
```