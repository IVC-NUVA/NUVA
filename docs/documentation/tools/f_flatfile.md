---
title: Flat files
layout: default
parent: File formats
nav_order: 60
status: Void
assignee: FK
---
# Flat files #
Flat files are simple CSV file, with comma as a delimitor.

For each language `xx`, two files are generated:
  * `nuva_vaccines_xx.csv` for vaccine concepts
  * `nuva_valences_xx.csv` for valence concepts
  
## Columns for vaccines file
The vaccines file has 6 columns:

| Column     | Description |
|-----       |------------------ |
| NUVA       | NUVA code `VACxxxx`|
| label      | Label of the concept, localized or not (for brand names).|
| comment    | Localized comment of the concept.|
| type       | `abstract`, `real` or `deprecated` |
| instanceOf | For real or deprecated vaccines, corresponding abstract vaccine. |
| valences   | For abstract vaccines, list of valences shorthand notations, space delimited.|

## Columns for valences file
The valences file has 5 columns.

| Column     | Description |
|-----       |------------------ |
| NUVA       | NUVA code `VALxxx`|
| label      | Localized label of the concept.|
| comment    | Localized comment of the concept.|
| shorthand  | Global shorthand notation. |
| parent     | Parent valence. |




