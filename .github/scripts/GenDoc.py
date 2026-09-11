import yaml,csv,json
import sys, os, pathlib
from pathlib import Path
from datetime import datetime
def loadUnits(type):
    print (f'Loading {type} units')
    files = pathlib.Path(f'Units/{type}').rglob('*.yml')
    tempdir = {}

    for file in files:
        with open(file,encoding='utf-8') as data:
            tempdir[file.stem] = yaml.safe_load(data)
    return dict(sorted(tempdir.items()))

def loadLanguages():
    files = pathlib.Path(f'Translations').rglob('nuva_*.yml')
    for file in files:
        with open(file, encoding='utf-8') as data:
            langterms = yaml.safe_load(data)
            lang=next(iter(langterms))
        for theme in ['disease','valence','vaccine']:
            for key,term in langterms[lang][theme].items():
                if key not in Terms:
                    Terms[key] = {}
                Terms[key][lang] = term

Codes = {}
Terms = {}

Vaccines = loadUnits("Vaccines")
Valences = loadUnits("Valences")
Targets = loadUnits("Targets")
CodeSystems = loadUnits("CodeSystems")

loadLanguages()

if (len(sys.argv)>1):
    version = sys.argv[1]
else:
    version = "Unknown"

print("Creating the JSON datafile")
jsonData = {'version': version,
            "vaccines": {},
            "valences": {'Valence': {'shorthand': 'VAL', 'label': 'Valence', 'parent': 'Valence'}}
            }

for code,data in Vaccines.items():
    if data['abstract']:
        jsonData['vaccines'][code] = {
            'abstract' : True,
            'status': data['status'],
            'label': data['label'],
            'created': data['created'],
            'modified': data['modified'],
            'comment': data['comment'],
            'valences': data['valences'].copy()
        }
    else:
        jsonData['vaccines'][code] = {
            'abstract' : False,
            'status': data['status'],
            'label': data['label'],
            'created': data['created'],
            'modified': data['modified'],
            'comment': "",
            'instanceOf': data['instanceOf'] or "VAC0000",
        }

for code,data in Valences.items():
    jsonData['valences'][code]={
        'created': data['created'],
        'modified': data['modified'],
        'shorthand': data['shorthand'],
        'label': data['label'],
        'vtype': '0',
        'parent': data['parent']}

with open('docs/data/nuvadata.json','w',encoding='utf-8-sig') as f:
    f.write(json.dumps(jsonData,ensure_ascii=False, indent = 1))

print("Done")


