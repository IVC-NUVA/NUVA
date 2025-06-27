from rdflib import *
from urllib.request import urlopen,urlretrieve
import yaml
import sys, os
from time import gmtime,strftime

lang='en'

def ref(URIRef):
    return URIRef.split('/')[-1]

def lang_txt(s,p):
    for l in g.objects(s,p):
        if l.language in (None,lang):
            return str(l)
    return(None)

BaseURI="http://ivci.org/NUVA"
DiseasesParent=URIRef(BaseURI+"/Disease")
VaccinesParent=URIRef(BaseURI+"/Vaccine")
ValencesParent=URIRef(BaseURI+"/Valence")
CodesParent=URIRef(BaseURI+"/Code")

isAbstract=URIRef(BaseURI+"/nuvs#isAbstract")
containsValence=URIRef(BaseURI+"/nuvs#containsValence")
prevents = URIRef(BaseURI+"/nuvs#prevents")


nuva_file = urlopen("https://ivci.org/nuva/nuva_full.ttl")
g = Graph()
g.parse(nuva_file.read())

labels = {lang : {'disease':{}, 'vaccine':{}, 'valence':{}}}

for disease in g.subjects(RDFS.subClassOf,DiseasesParent):
    # Update labels
    label = lang_txt(disease,RDFS.label)
    id = str(g.value(disease,SKOS.notation))
    created = str(g.value(disease,DCTERMS.created))
    modified = str(g.value(disease,DCTERMS.modified))
    labels[lang]['disease'][f'{id}L'] = label
    # Build and save
    record = {'label': label, 'created': created, 'modified': modified}
    with open (f'Units/Targets/{id}.yml','w',encoding='utf-8') as ymlfile:
        yaml.dump(record,ymlfile,allow_unicode = True, sort_keys = False)
    

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
    modified = str(g.value(vaccine,DCTERMS.modified))
    abstract = bool(g.value(vaccine,isAbstract))
    label = lang_txt(vaccine,RDFS.label)
    comment = lang_txt(vaccine,RDFS.comment)
    # Valences
    valences = []
    for val in g.objects(vaccine,containsValence):
        valences.append(ref(val))

    record = {'abstract': abstract, 'label': label, 'comment': comment, 'created': created, 'modified': modified,'codes': codes, 'valences': valences}
    with open (f'Units/Vaccines/{id}.yml','w',encoding='utf-8') as ymlfile:
        yaml.dump(record,ymlfile,allow_unicode = True, sort_keys = False)
    # Update labels for translations
    if abstract:
        labels[lang]['vaccine'][f'{id}L'] = label
        if comment:
            labels[lang]['vaccine'][f'{id}C'] = comment


for valence in g.subjects(RDFS.subClassOf,ValencesParent):
    id = str(g.value(valence,SKOS.notation))
    created = str(g.value(valence,DCTERMS.created))
    modified = str(g.value(valence,DCTERMS.modified))
    label = lang_txt(valence,RDFS.label)
    shorthand = lang_txt(valence,SKOS.altLabel)
    target = str(g.value(g.value(valence,prevents),SKOS.notation))

    parent = ref(g.value(valence,RDFS.subClassOf))

    record = {'label': label, 'created': created, 'modified': modified, 'shorthand': shorthand, 'parent': parent, 'target': target}
    with open (f'Units/Valences/{id}.yml','w',encoding='utf-8') as ymlfile:
        yaml.dump(record,ymlfile,allow_unicode = True, sort_keys = False)
    # Update labels
    labels[lang]['valence'][f'{id}L'] = label
    labels[lang]['valence'][f'{id}S'] = shorthand

for codeSystem in g.subjects(RDFS.subClassOf, CodesParent):
    label = g.value(codeSystem,RDFS.label)
    if label:
      record = {'description': f'To be completed for code system {label}'}
      with open (f'Units/CodeSystems/{label}.yml','w',encoding='utf-8') as ymlfile:
        yaml.dump(record,ymlfile,allow_unicode = True, sort_keys = False)

with open ('Units/import.txt','w',encoding='utf-8') as importfile:
    version = g.value(URIRef(BaseURI),OWL.versionInfo)
    now = strftime("%Y-%m-%d %H:%M", gmtime())
    print(f'Imported version {version} at {now} GMT',file=importfile)

with open (f'Translations/nuva_{lang}.yml','w',encoding = 'utf-8') as labels_file:
    yaml.dump(labels,labels_file, allow_unicode = True)
