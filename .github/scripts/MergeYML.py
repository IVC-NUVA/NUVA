from urllib.request import urlopen,urlretrieve
import yaml, json
import sys, os
from datetime import datetime

valences_byUUID = {}
vaccines = {'VAC0000': {
    'abstract': True, 'status': 'active', 'label': '#Orphans',
    'comment': 'Abstract for orphan vaccines', 'created': '2026-09-10', 'modified': '2026-09-10',
    'valences': ['VAL000']}}
vaccines_byVKey= {'VAL000': {'idvac': 'VAC0000', 'label': '#Orphans'}}

def getValences(vaccine):
    vacvalences = []
    for uuid in vaccine['valence_ids']:
        vacvalences.append(valences_byUUID[uuid])
    vacvalences.sort()
    return vacvalences

def getbaseVaccine(idvac):
    fname = f'Units/Vaccines/{idvac}.yml'
    if os.path.isfile(fname):
        with open(f'Units/Vaccines/{idvac}.yml', 'r', encoding='utf-8') as ymlfile:
            baseVaccine = yaml.safe_load(ymlfile)
    else:
        baseVaccine = {'label': 'new', 'status': 'active', 'comment':'', 'modified': '1900-01-01', 'valences':[]}
    return baseVaccine

def getbaseValence(idval):
    fname = f'Units/Valences/{idval}.yml'
    if os.path.isfile(fname):
        with open(f'Units/Valences/{idval}.yml', 'r', encoding='utf-8') as ymlfile:
            baseValence = yaml.safe_load(ymlfile)
    else:
        baseValence= {'label':'new', 'type': '0', 'modified': '1900-01-01'}
    return baseValence


version_file = urlopen("https://cdnnuva.mesvaccins.net/versions/last.json")
version = json.loads(version_file.read())

data_file = urlopen ("https://cdnnuva.mesvaccins.net/json/"+version['dump_hash']+".json")
data = json.loads(data_file.read())

today = datetime.today().strftime('%Y-%m-%d')

for valence in data['valences']:
    idval = f'VAL{valence['code']:03d}'
    valences_byUUID[valence['id']] = idval

for valence in data['valences']:
    idval = f'VAL{valence['code']:03d}'
    baseValence = getbaseValence(idval)
    vtype = baseValence['vtype'] if 'vtype' in baseValence else '0'
    if valence['parent_id']:
        parent = valences_byUUID[valence['parent_id']]
    else:
        parent ='Valence'
    record = {
        'label': valence['name']['en'],
        'created': valence['created_at'][0:10],
        'modified': baseValence['modified'],
        'shorthand': valence['translated_abbreviation']['en'],
        'vtype': vtype,
        'parent': parent
    }
    if (record['label'] != baseValence['label']) or \
        (record['shorthand'] != baseValence['shorthand']) or \
        (record['parent'] != baseValence['parent']):
        record['modified'] = today

        with open(f'Units/Valences/{idval}.yml', 'w', encoding='utf-8') as ymlfile:
            yaml.dump(record, ymlfile, allow_unicode=True, sort_keys=False)

for vaccine in data['vaccines']:
    if vaccine['generic']:
        idvac = f'VAC{vaccine['code']:04d}'
        baseVaccine = getbaseVaccine(idvac)
        vacvalences = getValences(vaccine)
        valkey = '-'.join(vacvalences)
        deprecated = (baseVaccine['status'] == 'deprecated')
        if valkey in vaccines_byVKey:
            if not deprecated:
                print (f"Duplicate abstract vaccines: {idvac} and {vaccines_byVKey[valkey]} ")
        else:
            if not deprecated:
                vaccines_byVKey[valkey] = { 'idvac': idvac, 'label': vaccine['name']['en'] }

        record = {
            'abstract': True,
            'status': baseVaccine['status'],
            'label' : vaccine['name']['en'],
            'comment': vaccine['description']['en'],
            'created': vaccine['created_at'][0:10],
            'modified': baseVaccine['modified'],
            'valences': vacvalences
        }
        if (record['label'] != baseVaccine ['label']) or  \
            (record['status'] != baseVaccine ['status']) or \
            (record['comment'] != baseVaccine ['comment']) or \
            (valkey != '-'.join(baseVaccine['valences'])):
            record['modified'] = today

            with open (f'Units/Vaccines/{idvac}.yml','w',encoding='utf-8') as ymlfile:
                yaml.dump(record,ymlfile,allow_unicode = True, sort_keys = False)

for vaccine in data['vaccines']:
    if not vaccine['generic']:
        idvac = f'VAC{vaccine['code']:04d}'
        baseVaccine = getbaseVaccine(idvac)
        vacvalences = getValences(vaccine)
        valkey = '-'.join(vacvalences)
        deprecated = (baseVaccine['status'] == 'deprecated')
        label = vaccine['name']['en'] if ('en' in vaccine['name']) else vaccine['name']['fr']
        # Orphan vaccines are bound to abstract VAC0000
        if not valkey in vaccines_byVKey:
            valkey = 'VAL000'

        record = {
            'abstract': False,
            'status': baseVaccine['status'],
            'label' : label,
            'comment': vaccine['description']['en'],
            'created': vaccine['created_at'][0:10],
            'modified': baseVaccine['modified'],
            'instanceOf': vaccines_byVKey[valkey]['idvac']
        }
        if (record['label'] != baseVaccine ['label']) or \
            (record['status'] != baseVaccine['status']) or \
            (record['comment'] != baseVaccine['comment']) or \
            (record['instanceOf'] != baseVaccine['instanceOf']):
            record['modified'] = today

            with open (f'Units/Vaccines/{idvac}.yml','w',encoding='utf-8') as ymlfile:
                yaml.dump(record,ymlfile,allow_unicode = True, sort_keys = False)
