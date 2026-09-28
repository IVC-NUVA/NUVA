---
title: Reverse maps
layout: default
parent: File formats
nav_order: 40
---
# Reverse maps #
Once an [alignment file](f_alignment.md) for a code system has been imported, the [editor](editor.md) allows to create a reverse map for the same code system.

A reverse map expresses, for each vaccine concept in NUVA, what are the possible options in the code system for representing it.

A code is considered as adapted to represent a vaccine concept if its NUVA equivalent:
  - has all the valences of the given vaccine, or more general versions of these valences.
  - does not have any valence that do not belong to the given vaccine.

## Transcription maps ##
After a reverse map has been created for a given code system, the [editor](editor.md) also allows to create a reverse map restricted to the concepts aligned with another code system. This is a helper to code systems owners, that often need to create transcriptions across code systems (from product codes to abstract codes, from national codes to international ones, etc.) .

## Columns for the reverse map ##
### NUVA
There is at least one row for each existing code in NUVA.
### NUVA label ###
This is the label for NUVA concept.
### IsAbstract ###
This boolean allows to filter the reverse map in the case of only the completion of the code system towards abstract vaccines is of interest.
### Code in code system ###
This is a candidate code that is adapted to represent the given NUVA concept.

In the case where the NUVA code is part of the alignment map, there is only one row for the NUVA code, with the value of the explicit alignment.

Int the case where no code in the code system is suitable for the NUVA concept, this column is empty, as well as all the next ones.
### Label in code system ###
This is the optional label that was provided in the [alignment file](f_alignment.md).
### Best ###
This boolean is True if the given code is among the best possible options (the ones with the least blur value) for the NUVA vaccine concept.
### Blur ###
This is the number of different NUVA vaccine concepts that can be represented with the given code.
### Equiv ###
Because NUVA is blind to some aspects that can be discriminant for other code systems, such as the packaging, it is possible to have several codes in the code system matching the same NUVA concept.

This column indicate the number of such codes. By construction, all these codes will match the given NUVA vaccine concept with the same blur value.
## Columns for the transcription maps ##
The transcription map has exactly the same columns as the reverse maps, plus two leading columns:
  - The transcribed code
  - The label for the transcribed code, fetched from its alignment file.
  
Only the rows that correspond to codes in the transcribed code system are presented.

## Conventions ##
The reverse map file is named *nuva2ident_YYYY-MM-DD.csv*, where ident is the identifier for the reversed code system and YYYY-MM-DD the date of reversion.

The transcription file is named *transcribed2ident_YYYY-MM-DD.csv*, where trans is the identifier of the transcribed code systemn ident  the identifier of the target code system and YYYY-MM-DD the date of reversion.

## Limitations ##
The information that is not relevant for NUVA is lost in the alignment process. The transcription maps can thus propose transcriptions that are not valid, because the transcribed and the target code system use a notion that is lost in the alignment process. The transcription outputs are helpers for code system owners, but using them in automated process must be considered with care.
## Examples ##
### CVX reverse map ###
```
NUVA,NUVA label, IsAbstract,CVX, CVX label, Best, Blur, Equiv
VAC0002,"AGRIPPAL",false,CVX-168,"Influenza, adjuvanted, inactivated, trivalent, injectable, preservative free",true,51,2
VAC0002,"AGRIPPAL",false,CVX-331,"Influenza, seasonal, Southern Hemisphere, trivalent, 0.5 mL dose, preservative free",true,51,2
VAC0002,"AGRIPPAL",false,CVX-#15,"influenza virus vaccine, split virus (incl. purified surface antigen)-retired CODE",false,102,1
VAC0002,"AGRIPPAL",false,CVX-88,"influenza virus vaccine, unspecified formulation",false,132,1
```
### CIS to CVX transcription map ###
```
CIS,CISlabel, NUVA, NUVA label, isAbstract, CVX, CVX label, Best, Blur, Equiv
CIS-61921204,"AGRIPPAL, suspension injectable en seringue préremplie. Vaccin grippal inactivé (antigènes de surface)",VAC0002,"AGRIPPAL",false,CVX-168,"Influenza, adjuvanted, inactivated, trivalent, injectable, preservative free",true,51,2
CIS-61921204,"AGRIPPAL, suspension injectable en seringue préremplie. Vaccin grippal inactivé (antigènes de surface)",VAC0002,"AGRIPPAL",false,CVX-331,"Influenza, seasonal, Southern Hemisphere, trivalent, 0.5 mL dose, preservative free",true,51,2
CIS-61921204,"AGRIPPAL, suspension injectable en seringue préremplie. Vaccin grippal inactivé (antigènes de surface)",VAC0002,"AGRIPPAL",false,CVX-#15,"influenza virus vaccine, split virus (incl. purified surface antigen)-retired CODE",false,102,1
CIS-61921204,"AGRIPPAL, suspension injectable en seringue préremplie. Vaccin grippal inactivé (antigènes de surface)",VAC0002,"AGRIPPAL",false,CVX-88,"influenza virus vaccine, unspecified formulation",false,132,1
```
