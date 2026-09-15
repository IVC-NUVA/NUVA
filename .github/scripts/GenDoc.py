import yaml,json
import sys,pathlib

def loadUnits(type):
    print (f'Loading {type} units')
    files = pathlib.Path(f'Units/{type}').rglob('*.yml')
    tempdir = {}

    for file in files:
        with open(file,encoding='utf-8') as data:
            tempdir[file.stem] = yaml.safe_load(data)
    return dict(sorted(tempdir.items()))

Codes = {}
Terms = {'en': {'vaccine':{},'valence': {}}}

Vaccines = loadUnits("Vaccines")
Valences = loadUnits("Valences")

version = "2000-01-01"

print("Creating the JSON datafile")
jsonData = {'version': None,
            "vaccines": {},
            "valences": {'Valence': {'shorthand': 'VAL', 'label': 'Valence', 'parent': 'Valence'}}
            }

for code,data in Vaccines.items():
    version = data['modified'] if data['modified']>version else version

    if data['abstract']:
        comment = "" if data['comment']==data['label'] else data['comment']
        jsonData['vaccines'][code] = {
            'abstract' : True,
            'status': data['status'],
            'label': data['label'],
            'created': data['created'],
            'modified': data['modified'],
            'comment': comment,
            'valences': data['valences'].copy()
        }
        Terms['en']['vaccine'][code+'L'] = data['label']
        if comment != '':
            Terms['en']['vaccine'][code+'C'] = comment

    else:
        instanceOf = data['instanceOf'] if data['instanceOf'] else 'VAC0000'
        comment = "" if data['comment']== Vaccines[instanceOf]['label'] else data['comment']
        jsonData['vaccines'][code] = {
            'abstract' : False,
            'status': data['status'],
            'label': data['label'],
            'created': data['created'],
            'modified': data['modified'],
            'comment': comment,
            'instanceOf': instanceOf
        }
        if comment != '':
            Terms['en']['vaccine'][code+'C'] = comment

for code,data in Valences.items():
    jsonData['valences'][code]={
        'created': data['created'],
        'modified': data['modified'],
        'shorthand': data['shorthand'],
        'label': data['label'],
        'vtype': data['vtype'],
        'parent': data['parent']}
    Terms['en']['valence'][code+'S'] = data['shorthand']
    Terms['en']['valence'][code+'L'] = data['label']

jsonData['version'] = version

with open('docs/data/nuvadata.json','w',encoding='utf-8-sig') as f:
    f.write(json.dumps(jsonData,ensure_ascii=False))

with open('Translations/nuva_en.yml','w',encoding='utf-8-sig') as f:
    yaml.dump(Terms,f)

print("Done")


