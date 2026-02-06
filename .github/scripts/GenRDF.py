from rdflib import *
import yaml,csv
import sys, os, pathlib
from pathlib import Path
from datetime import datetime
from lib import nuva_utils as NU

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
valences_top="""
<!DOCTYPE html>
<html>
<head><meta http-equiv="content-type" content="text/html; charset=windows-1252"><title>Valences tree</title><style>
li {list-style-type: none;}ul li ul { display:none}
.unfolded:before {content: ""; border-color: blue transparent transparent transparent; border-style: solid;border-width: 0.6em 0.4em 0  0.4em;display: block;height: 0;width: 0;left: -2em;top: 0.9em;position: relative;}
.folded:before {content: ""; border-color: transparent transparent transparent blue; border-style: solid;border-width: 0.4em 0 0.4em 0.6em;display: block;height: 0;width: 0;left: -2em;top: 1em;position: relative;}	
.final:before {content: ""; background-color:green;display: block;height: 0.2em;width: 0.5em;left: -2em;top: 0.7em;margin-top: 0.5em;position: relative;}
.final {color:green}
</style></head>
<body>
<ul>
"""
valences_bottom = """
</ul>
<script>
var foldeder = document.querySelectorAll('.folded');
for (var i = 0; i < foldeder.length; ++i) 
{ foldeder[i].onclick=function() { 
var ul=this.parentElement.querySelectorAll('ul' )[0]; 
if (ul.offsetHeight> 0) 
  { ul.style.display='none' ;   
    this.className = 'folded';
   }
else { 
	ul.style.display='block' ; 
	this.className = 'unfolded'
	children=ul.getElementsByTagName('li');
	for (var j=0; j<children.length;j++)
	{
	  child = children[j];
	  link = child.querySelectorAll('a')[0]
	  if (link.className == 'unfolded')
	  {
		link.className = 'folded';
		ul2 = child.querySelectorAll('ul')[0]
		ul2.style.display = 'none'	   
	  }
	}   
} } }
</script></body></html>
"""
BaseURI="http://ivci.org/NUVA"

core = Graph()
core.parse(data = nuva_void)
full = Graph(store="Oxigraph")

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

indent = "  "

def valprint(f,offset, valence):
    if len(valence['children']) == 0:
        style = "final"
    else:
        style = "folded"

    print(offset*indent+f'<li><a class = "{style}">{valence['notation']}({valence['code']}) - {valence['label']}</a>', file = f)
    if style == "folded":
        print(offset*indent+'<ul>',file = f)
        for child in sorted(valence['children'],key = lambda d: d['notation']):
            valprint(f,1+offset,child)
        print(offset*indent+'</ul>',file = f)
    print (offset*indent+'</li>',file = f)

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
Targets = loadUnits("Targets")
CodeSystems = loadUnits("CodeSystems")

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
    for system,values in data['codes'].items():
        if system in CodeSystems.keys():
            for value in values:
                full.add((Vaccine,SKOS.notation,Literal(value,datatype=URIRef(f'{BaseURI}/{system}'))))
                Codes[system][value] = {system: f'{system}-{value}', "NUVA": code, "Label": data['label']}

for code,data in Valences.items():
    Valence = URIRef(f'{BaseURI}/{code}')
    VParent = URIRef(f'{BaseURI}/{data["parent"]}')
    addClass(Valence,VParent,data['label'],data.get('comment',None),code,data['created'],data['modified'],True)
    core.add((Valence,prevents,URIRef(f'{BaseURI}/{data["target"]}')))
    core.add((Valence,SKOS.altLabel,Literal(data['shorthand'],lang='en')))

if (len(sys.argv)>1):
    version = sys.argv[1]
else:
    version = "Unknown"

core.add((URIRef(BaseURI),OWL.versionInfo,Literal(version)))
full += core


print("Creating the valence tree")
vtree = NU.nuva_get_valences(core, 'en')

with open('Release/NUVA/valtree_en.html','w') as f:
    print(valences_top,file=f)
    for valence in sorted(vtree,key = lambda d: d['notation']):
        valprint(f,0,valence)
    print(valences_bottom,file=f)

exit(0)
print("Creating the RDF files")
core.serialize(destination="Release/NUVA/nuva_core.ttl")
full.serialize(destination="Release/NUVA/nuva_full.ttl")

print ("Creating the CSV core file")
with open('Release/NUVA/nuva_core.csv','w',encoding='utf-8-sig',newline ='') as csvfile:
    writer = csv.DictWriter(csvfile,fieldnames=['NUVA','label','comment','abstract'],delimiter=',')
    writer.writeheader()
    for code,data in Vaccines.items():
        writer.writerow({'NUVA':f"VAC{data['codes']['NUVACode']}",'label':data['label'],'comment':data['comment'],'abstract':data['abstract']})


print("Creating the alignment files")
for codeSystem in CodeSystems.keys():
    print (codeSystem)
    Path(f'Release/Alignments/{codeSystem}').mkdir(exist_ok=True)
    with open(f'Release/Alignments/{codeSystem}/{codeSystem}2nuva.csv','w',encoding='utf-8-sig',newline='') as csvfile:
        writer = csv.DictWriter(csvfile,fieldnames=[codeSystem, "NUVA", "Label"],delimiter=',')
        writer.writeheader()
        for code in Codes[codeSystem]:
            writer.writerow(Codes[codeSystem][code])
    eval_codes=NU.nuva_optimize(full,codeSystem, False)
    map =eval_codes['map']
    with open(f'Release/Alignments/{codeSystem}/nuva2{codeSystem}.csv','w',encoding='utf-8-sig',newline='') as mapfile:
        map_writer = csv.writer(mapfile, delimiter=',')
        map_writer.writerow(["NUVA","NUVA label","IsAbstract",codeSystem, f"{codeSystem} label", "Best", "Blur", "Equiv"])
        for nuva_code,nuva_data in sorted(map.items()):
            label =  nuva_data['label']
            isAbstract = nuva_data['isAbstract']
            if len(nuva_data["bestcodes"])==0 :
                map_writer.writerow([nuva_code,label, isAbstract,"", "", "", "",""])
            else:        
                for extcode in sorted( nuva_data["bestcodes"]):
                    map_writer.writerow([nuva_code, label, isAbstract,
                                         f"{codeSystem}-{extcode}",
                                          nuva_data["bestcodes"][extcode],
                                         True,
                                          nuva_data["blur"],
                                          nuva_data["nbequiv"]])
                for extcode in sorted( nuva_data["othercodes"]):
                    map_writer.writerow([nuva_code, label, isAbstract,
                                         f"{codeSystem}-{extcode}",
                                          nuva_data["othercodes"][extcode],
                                         False, "", ""])    
    metrics = eval_codes['metrics']                    
    with open(f'Release/Alignments/{codeSystem}/metrics_{codeSystem}.txt','w') as f:
        print (f"NUVA version :{version}", file = f)
        print (f"Number of NUVA concepts : {metrics['nuvacodes']}", file = f)
        print ("Completeness: {:.1%}".format(metrics['completeness']), file = f)
        print (f"Number of aligned codes: {metrics['extcodes']}", file = f)
        print ("Precision: {:.1%}".format(metrics['precision']), file = f)
        print ("Redundancy: {:.3}".format(metrics['redundancy']), file = f)
print("Done")


