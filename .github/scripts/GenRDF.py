from rdflib import *
import yaml,csv
import pathlib

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
full = Graph(store="Oxigraph")
langgraphs = {}

NUVS = Namespace("http://ivci.org/NUVA/nuvs#")
NUVA = Namespace("http://ivci.org/NUVA/") 
full.bind("nuvs",NUVS)
full.bind("nuva",NUVA)

def loadUnits(type):
    print (f'Loading {type} units')
    files = pathlib.Path(f'Units/{type}').rglob('*.yml')
    tempdir = {}

    for file in files:
        with open(file,encoding='utf-8') as data:
            tempdir[file.stem] = yaml.safe_load(data)
    return dict(sorted(tempdir.items()))

def loadLanguages():
    terms = {}
    files = pathlib.Path('Translations').rglob('nuva_*.yml')
    for file in files:
        with open(file, encoding='utf-8') as data:
            langterms = yaml.safe_load(data)
            lang=next(iter(langterms))
        for theme in ['valence','vaccine']:
            for key,term in langterms[lang][theme].items():
                if key not in terms:
                    terms[key] = {}
                terms[key][lang] = term
    return terms

def loadAlignments():
    alignments = {}
    files = pathlib.Path('Alignments').rglob('*2nuva.csv')
    for file in files:
        with open(file,encoding='utf-8') as data:
            reader =  csv.reader(data, delimiter=',')
            codeSystem = next(reader)[0]
            alignments[codeSystem] = []
            for row in reader:
                alignments[codeSystem].append(row)
    return alignments


def addLanguages(ref,predicate,key):
    if not key in Terms:
        return
    for lang in Terms[key]:
        triple = (ref,predicate,Literal(Terms[key][lang],lang=lang))
        full.add(triple)
        if lang not in langgraphs:
            langgraphs[lang]= Graph()
        langgraphs[lang].add(triple)

def addClass(ref,parent,label,comment,notation,created, modified, localized):
    core.add((ref,RDF.type, OWL.Class))
    core.add((ref,RDFS.subClassOf,parent))
    core.add((ref,DCTERMS.created,Literal(created,datatype = XSD.date)))
    core.add((ref,DCTERMS.modified,Literal(modified,datatype = XSD.date)))
    if localized: litLabel = Literal(label,lang='en')
    else:         litLabel = Literal(label)
    core.add((ref,RDFS.label,litLabel))
    if comment: core.add((ref,RDFS.comment,Literal(comment,lang = 'en')))
    if notation: core.add((ref,SKOS.notation,Literal(notation,datatype=XSD.string)))

DiseasesParent=URIRef(BaseURI+"/Disease")
VaccinesParent=URIRef(BaseURI+"/Vaccine")
ValencesParent=URIRef(BaseURI+"/Valence")
CodeSystemsParent=URIRef(BaseURI+"/CodeSystem")

isAbstract=URIRef(BaseURI+"/nuvs#isAbstract")
containsValence=URIRef(BaseURI+"/nuvs#containsValence")
prevents=URIRef(BaseURI+"/nuvs#prevents")

Codes = {}

Vaccines = loadUnits("Vaccines")
Valences = loadUnits("Valences")

Terms = loadLanguages()
alignments = loadAlignments()

version = "2000-01-01"

for codeSystem in alignments.keys():
    Codes[codeSystem] = {}
    uri = URIRef(f'{BaseURI}/{codeSystem}')
    full.add((uri,RDF.type, OWL.Class))
    full.add((uri,RDFS.subClassOf,CodeSystemsParent))
    full.add((uri,RDFS.label,Literal(codeSystem)))

for code,data in Vaccines.items():
    Vaccine=URIRef(f'{BaseURI}/{code}')
    if data['abstract']:
        Parent = VaccinesParent
    else:
        if data['instanceOf']:
            Parent = URIRef(f'{BaseURI}/{data['instanceOf']}')
        else:
            Parent = URIRef(f'{BaseURI}/VAC0000')

    addClass(Vaccine,Parent,data['label'],None,code,data['created'], data['modified'], data['abstract'])
    core.add((Vaccine,isAbstract,Literal(data['abstract'],datatype=XSD.boolean)))

    if data['abstract']:
        for valence in data['valences']:
            core.add((Vaccine,containsValence,URIRef(f'{BaseURI}/{valence}')))
    core.add((Vaccine,SKOS.notation,Literal(code[3:],datatype=URIRef(f'{BaseURI}/NUVACode'))))
    addLanguages(Vaccine,RDFS.label,f'{code}L')
    addLanguages(Vaccine, RDFS.comment, f'{code}C')

    if data['modified']>version: version = data['modified']

for code,data in Valences.items():
    Valence = URIRef(f'{BaseURI}/{code}')
    VParent = URIRef(f'{BaseURI}/{data["parent"]}')
    addClass(Valence,VParent,data['label'],data.get('comment',None),code,data['created'],data['modified'],True)
    core.add((Valence,SKOS.altLabel,Literal(data['shorthand'],lang='en')))
    addLanguages(Valence,RDFS.label,f'{code}L')
    addLanguages(Valence, SKOS.altLabel, f'{code}S')

    if data['modified']>version: version = data['modified']

for codeSystem,data in alignments.items():
    skip=len(codeSystem)+1
    for row in data:
        Vaccine = URIRef(f'{BaseURI}/{row[1]}')
        Code = row[0][skip:]
        full.add((Vaccine, SKOS.notation, Literal(Code, datatype=URIRef(f'{BaseURI}/{codeSystem}'))))

core.add((URIRef(BaseURI),OWL.versionInfo,Literal(version)))
full += core

print("Creating the RDF files")
core.serialize(destination="RDF/nuva_core.ttl")
full.serialize(destination="RDF/nuva_full.ttl")

print ('Creating the language RDF files')
for lang in langgraphs:
    langgraphs[lang].serialize(destination=f"RDF/nuva_{lang}.ttl")

print("Done")


