from rdflib import *
import yaml,csv
import sys, os, pathlib
from datetime import datetime

nuva_void="""
@prefix dcterms: <http://purl.org/dc/terms/> .
@prefix nuva: <http://ivci.org/NUVA/> .
@prefix nuvs: <http://ivci.org/NUVA/nuvs#> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix skos: <http://www.w3.org/2004/02/skos/core#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

<http://ivci.org/NUVA> a owl:Ontology .

nuvs:containsValence a owl:ObjectProperty ;
    rdfs:domain nuva:Vaccine ;
	rdfs:range nuva:Valence .
	
nuvs:containedInVaccine a owl:ObjectProperty ;
    owl:inverseOf nuvs:containsValence .

nuvs:isAbstract a owl:DatatypeProperty ;
    rdfs:range xsd:boolean .

nuvs:prevents a owl:ObjectProperty ;
    rdfs:domain nuva:Valence ;
    rdfs:range nuva:Disease .

nuva:Valence a owl:Class ;
    rdfs:label "Valence"@en .

nuva:Vaccine a owl:Class ;
    rdfs:label "Vaccine"@en ;
    owl:disjointWith nuva:Valence .

nuva:Disease a owl:Class ;
    rdfs:label "Disease"@en ;
    owl:disjointWith nuva:Vaccine, nuva:Valence .

nuva:Code a owl:Class ;
    rdfs:label "Code"@en ;
    owl:disjointWith nuva:Disease,  nuva:Vaccine, nuva:Valence .
		
nuva:NUVACode a owl:Class ;
    rdfs:label "NUVA Code" ;
	rdfs:comment "The numeric value for a NUVA vaccine concept"@en ;
    rdfs:subClassOf nuva:Code .
"""
BaseURI="http://ivci.org/NUVA"

core = Graph()
core.parse(data = nuva_void)
full = Graph()

NUVS = Namespace("http://ivci.org/NUVA/nuvs#")
NUVA = Namespace("http://ivci.org/NUVA/") 
full.bind("nuvs",NUVS)
full.bind("nuva",NUVA)

def loadUnits(type,directory):
    print (f'Loading {type} units')
    files = pathlib.Path(f'Units/{type}').rglob('*.yml')

    for file in files:
        with open(file,encoding='utf-8') as data:
            directory[file.stem] = yaml.safe_load(data)
    
def addClass(ref,parent,label,comment,notation,created, modified, localized):
    core.add((ref,RDF.type, OWL.Class))
    core.add((ref,RDFS.subClassOf,parent))
    core.add((ref,DCTERMS.created,Literal(created,datatype = XSD.date)))
    core.add((ref,DCTERMS.modified,Literal(modified,datatype = XSD.date)))
    if localized: litLabel = Literal(label,lang='en')
    else:         litLabel = Literal(label)
    core.add((ref,RDFS.label,litLabel))
    if comment: core.add((ref,RDFS.comment,Literal(comment,lang = 'en')))
    if notation: core.add((ref,SKOS.notation,Literal(notation)))

DiseasesParent=URIRef(BaseURI+"/Disease")
VaccinesParent=URIRef(BaseURI+"/Vaccine")
ValencesParent=URIRef(BaseURI+"/Valence")
CodeSystemsParent=URIRef(BaseURI+"/CodeSystem")

isAbstract=URIRef(BaseURI+"/nuvs#isAbstract")
containsValence=URIRef(BaseURI+"/nuvs#containsValence")
prevents=URIRef(BaseURI+"/nuvs#prevents")

Vaccines={}
Valences={}
Targets={}
CodeSystems={}
Codes = {}

loadUnits("Vaccines",Vaccines)
loadUnits("Valences",Valences)
loadUnits("Targets",Targets)
loadUnits("CodeSystems",CodeSystems)

for code,data in Targets.items():
    Target = URIRef(f'{BaseURI}/{code}')
    addClass(Target,DiseasesParent,data['label'],None, None,data['created'],data['modified'], True)

for codeSystem in CodeSystems.keys():
    Codes[codeSystem] = {}
    uri = URIRef(f'{BaseURI}/{codeSystem}')
    full.add((uri,RDF.type, OWL.Class))
    full.add((uri,RDFS.subClassOf,CodeSystemsParent))
    full.add((uri,RDFS.label,Literal(codeSystem)))
    full.add((uri,RDFS.comment, Literal(CodeSystems[codeSystem]['description'],lang='en')))

for code,data in Vaccines.items():
    Vaccine=URIRef(f'{BaseURI}/{code}')
    addClass(Vaccine,VaccinesParent,data['label'],data.get('comment',None),code,data['created'], data['modified'], data['abstract'])
    core.add((Vaccine,isAbstract,Literal(data['abstract'],datatype=XSD.boolean)))
    for valence in data['valences']:
        core.add((Vaccine,containsValence,URIRef(f'{BaseURI}/{valence}')))
    NUVACode=data['codes']['NUVACode']
    core.add((Vaccine,SKOS.notation,Literal(NUVACode,datatype=URIRef(f'{BaseURI}/NUVACode'))))
    for system,value in data['codes'].items():
        if system in CodeSystems.keys():
            full.add((Vaccine,SKOS.notation,Literal(value,datatype=URIRef(f'{BaseURI}/{system}'))))
            Codes[system][value] = {system: f'{system}-{value}', "NUVA": code, "Label": data['label']}

for code,data in Valences.items():
    Valence = URIRef(f'{BaseURI}/{code}')
    VParent = URIRef(f'{BaseURI}/{data["parent"]}')
    addClass(Valence,VParent,data['label'],data.get('comment',None),code,data['created'],data['modified'],True)
    core.add((Valence,prevents,URIRef(f'{BaseURI}/{data["target"]}')))

if (len(sys.argv)>1):
    version = sys.argv[1]
else:
    version = "Unknown"

core.add((URIRef(BaseURI),OWL.versionInfo,Literal(version)))
full += core

print("Creating the RDF files")
core.serialize(destination="Release/NUVA/nuva_core.ttl")
full.serialize(destination="Release/NUVA/nuva_full.ttl")

print ("Creating the CSV core file")
with open('Release/NUVA/nuva_core.csv','w',encoding='utf-8-sig',newline ='') as csvfile:
    writer = csv.DictWriter(csvfile,fieldnames=['NUVA','label','comment','abstract'],delimiter=';')
    writer.writeheader()
    for code,data in Vaccines.items():
        writer.writerow({'NUVA':f"VAC{data['codes']['NUVACode']}",'label':data['label'],'comment':data['comment'],'abstract':data['abstract']})

print("Creating the alignment files")
for codeSystem in CodeSystems.keys():
    with open(f'Release/Alignments/{codeSystem}.csv','w',encoding='utf-8-sig',newline='') as csvfile:
        writer = csv.DictWriter(csvfile,fieldnames=[codeSystem, "NUVA", "Label"],delimiter=';')
        writer.writeheader()
        for code in Codes[codeSystem]:
            writer.writerow(Codes[codeSystem][code])

print("Done")


