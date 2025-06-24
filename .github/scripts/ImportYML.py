from rdflib import *
from urllib.request import urlopen,urlretrieve
import yaml
import sys, os
from time import gmtime,strftime

def ref(URIRef):
    return URIRef.split('/')[-1]

def en_txt(s,p):
    for l in g.objects(s,p):
        if l.language in (None,'en'):
            return str(l)
    return(None)

BaseURI="http://ivci.org/NUVA"
DiseasesParent=URIRef(BaseURI+"/Disease")
VaccinesParent=URIRef(BaseURI+"/Vaccine")
ValencesParent=URIRef(BaseURI+"/Valence")

isAbstract=URIRef(BaseURI+"/nuvs#isAbstract")
containsValence=URIRef(BaseURI+"/nuvs#containsValence")


nuva_file = urlopen("https://ivci.org/nuva/nuva_core.ttl")
g = Graph()
g.parse(nuva_file.read())

labels = {'en' : {'disease':{}, 'vaccine':{}, 'valence':{}}}

for disease in g.subjects(RDFS.subClassOf,DiseasesParent):
    # Update labels
    label = en_txt(disease,RDFS.label)
    notation = g.value(disease,SKOS.notation)
    labels['en']['disease'][f'{notation}L'] = label

for vaccine in g.subjects(RDFS.subClassOf,VaccinesParent):
    # Notation and external codes
    codes = {}
    for n in g.objects(vaccine,SKOS.notation):
        if n.datatype in (None,XSD.string):
            id = str(n)
        else:
            codesystem = ref(n.datatype)
            codes[codesystem] = str(n)
    
    created = str(g.value(vaccine,DCTERMS.created))
    abstract = bool(g.value(vaccine,isAbstract))
    label = en_txt(vaccine,RDFS.label)
    comment = en_txt(vaccine,RDFS.comment)
    # Valences
    valences = []
    for val in g.objects(vaccine,containsValence):
        valences.append(ref(val))

    # Build and save
    record = {'abstract': abstract, 'label': label, 'comment': comment, 'created': created, 'codes': codes, 'valences': valences}
    with open (f'Units/Vaccines/{id}.yml','w',encoding='utf-8') as ymlfile:
        yaml.dump(record,ymlfile,allow_unicode = True, sort_keys = False)
    # Update labels
    labels['en']['vaccine'][f'{id}L'] = label
    if comment and abstract:
        labels['en']['vaccine'][f'{id}C'] = comment


for valence in g.subjects(RDFS.subClassOf,ValencesParent):
    id = str(g.value(valence,SKOS.notation))
    created = str(g.value(valence,DCTERMS.created))
    label = en_txt(valence,RDFS.label)
    shorthand = en_txt(valence,SKOS.altLabel)

    parent = "None"
    for vsup in g.objects(valence,RDFS.subClassOf):
        if vsup != ValencesParent:
            parent = ref(vsup)

    record = {'label': label, 'created': created, 'shorthand': shorthand, 'parent': parent}
    with open (f'Units/Valences/{id}.yml','w',encoding='utf-8') as ymlfile:
        yaml.dump(record,ymlfile,allow_unicode = True, sort_keys = False)
    # Update labels
    labels['en']['valence'][f'{id}L'] = label
    labels['en']['valence'][f'{id}S'] = shorthand

with open ('Units/import.txt','w',encoding='utf-8') as importfile:
    version = g.value(URIRef(BaseURI),OWL.versionInfo)
    now = strftime("%Y-%m-%d %H:%M", gmtime())
    print(f'Imported version {version} at {now} GMT',file=importfile)

with open ('Translations/nuva_en.yml','w',encoding = 'utf-8') as labels_file:
    yaml.dump(labels,labels_file, allow_unicode = True)
