# Alignments
This folder contains one subfolder for each code system aligned with NUVA concepts.

The content of each subfolder is generated from the Unit files, and consists of:
- a direct map of codes in the codesystem to their NUVA equivalent
- a reverse map of all NUVA concepts to possible corresponding codes in the code system
- a text file with NUVA based metrics about the code system.

The present codes are:
## AIC (Italy)
This is the 9 digits marketing authorization code in Italy, attributed by the Italian Medicines Agency (AIFA).

It can be extracted from the comprehensive list of authorized medicines available at https://drive.aifa.gov.it/farmaci/confezioni.csv, filtering on ATC codes J07.

The first 6 digits represent the product, the last 3 being for the presentation.

## ATC (Global)
The Anatomical Therapeutic Chemical Classification (ATC) from WHO is the global reference for the purpose of active substances. Vaccines are classified under J07.

The codes are available from many sources, such as https://atcddd.fhi.no/atc_ddd_index/?code=J07

## CIP (France)
This is the code for packaged products in France, edited by the "Club Inter Pharmaceutique". The legacy 7 digits version (CIP7) has been replaced since 2009 with a 13 digits version CIP13 that is aligned here. The first 4 digits are always 3400.

The full database of presentations can be downloaded from https://base-donnees-publique.medicaments.gouv.fr/download/file/CIS_CIP_bdpm.txt. 

## CIS (France)
This is the 8 digits speciality code in France, independently of their packaging.

The full database of specialities can be downloaded from:
https://base-donnees-publique.medicaments.gouv.fr/download/file/CIS_bdpm.txt

## CNK (Belgium)
The CNK is a code for packaged products distributed in Belgium, attributed by the Belgian Pharmaceutical Association (APB).

The full database of packaged products can be downloaded from:
https://basededonneesdesmedicaments.be/download/human/packs

Rows without a CNK correspond to products that are not distributed in Belgium, but are identified with a CTI Extended code.

## CODE_NATIONAL_SPAIN (Spain)
This is the national pharmaceutical code for products authorized in Spain,managed by the Spanish Agency for Medications and Health Products (AEMPS). 

The full database can be downloaded from:
https://listadomedicamentos.aemps.gob.es/Presentaciones.xls.

The relevant column is "Cod.Nacional".

## CP-NROATIDENT (LUX)
This is the reimbursment code for the national health insurance in Luxembourg.

The current database can be downloaded from:
https://cns.public.lu/fr/professionnels-sante/publications/legislations/textes-coordonnes/liste-positive-csv.html

It does not contain historical data.

## CPT (USA)
The Current Procedural Terminology (CPT) code is a medical code set maintained by the American Medical Association.

A cross reference table of CPT to CVX is exposed by the US CDC at:
https://www2.cdc.gov/vaccines/iis/iisstandards/vaccines.asp?rpt=cpt

## CTI-EXTEND (Belgium)
THe CTI Extended is a code for packaged products used in Belgium, including products that are not distributed there.

The full database of packaged products can be downloaded from:
https://basededonneesdesmedicaments.be/download/human/packs

## CVC (Canada)
The National Vaccine Catalog of Canada, formerly Canada Vaccine Catalog (CVC) is curated by the Public Health Agency of Canada. It is part of the national SNOMED-CT extension.

The database, with both abstract vaccines and tradenames, can be downloaded from:
https://cvn-test.canada.ca/en/historical-download

## CVX (USA)
The CVX codes are functional vaccine codes curated by the US CDC.

They can be downloaded from:
https://www2a.cdc.gov/vaccines/iis/iisstandards/vaccines.asp?rpt=cvx

## DCID (EU)
The Data Carrier Identifier is found in the Datamatrix code used in Europe to implement the Falsified Medicines Directive. Depending upon the country, it may be a standard GTIN attributed by GS1 or derived from a national identifier such as CIP13 (France) or PPN (Germany).

There is no known public source for the GTIN.

## DIN (Canada)
The Drug Identfication Number (DIN) is the general pharmaceutical code in Canada.

The DIN codes for vaccines are found in the same document as the CVC codes.
https://cvn-test.canada.ca/en/historical-download

## ELGA (Austria)
ELGA is the Austrian Electronic Health Records service.

Its codeset for vaccines is documented at:
https://termgit.elga.gv.at/ValueSet-eimpf-impfstoffe.download.html

## EU_NUMBER (EU)
This is the identification number for centrally approved products.

It can be retrieved from the European Commission Portal at:
- https://ec.europa.eu/health/documents/community-register/html/reg_hum_act.htm?sort=n for the currently active products
- https://ec.europa.eu/health/documents/community-register/html/reg_hum_nact.htm?sort=n for the historical products.
## ICD11 (Global)
The International Classification of Diseases, revision 11 (ICD11) curated by WHO, includes codes for vaccines.

They can be viewed in a browser from https://icd.who.int/browse/2025-01/mms/en#164949870

## INFARMED (Portugal)
## NDC (USA)
National Drug Codes (NDC) are US codes for packaged products, assigned by the FDA.

https://www.accessdata.fda.gov/cder/ndcxls.zip

## NTIN (Various)

## PZN (Germany)
## SCT_NUVA (Global)
## SNOMED-CT (Global)
## UPC (Global)
This one is a duplicate for GTIN, that should be merged too under DCID.