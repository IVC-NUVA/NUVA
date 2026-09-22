import yaml,csv
import pathlib

def loadUnits(type):
    print (f'Loading {type} units')
    files = pathlib.Path(f'Units/{type}').rglob('*.yml')
    tempdir = {}

    for file in files:
        with open(file,encoding='utf-8') as data:
            tempdir[file.stem] = yaml.safe_load(data)
    return dict(sorted(tempdir.items()))

def listLanguages():
    langs = []
    files = pathlib.Path('Translations').rglob('nuva_*.yml')
    for file in files:
        with open(file, encoding='utf-8') as data:
            langterms = yaml.safe_load(data)
            lang=next(iter(langterms))
            langs.append(lang)
    return langs

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

def getTerm(key,lang,default):
    if (key in Terms) and (lang in Terms[key]):
        return Terms[key][lang]
    else:
        return default

Vaccines = loadUnits("Vaccines")
Valences = loadUnits("Valences")
Langs = listLanguages()
Terms = loadLanguages()

for lang in Langs:
    with open(f'CSV/nuva_vaccines_{lang}.csv','w',encoding='utf-8-sig',newline ='') as csvfile:
        writer = csv.DictWriter(csvfile,fieldnames=['NUVA','label','comment','abstract','instanceOf'],delimiter=',')
        writer.writeheader()
        for code,data in Vaccines.items():
            label = getTerm(f'{code}L',lang,data['label'])
            comment = getTerm (f'{code}C',lang,data['comment'])
            writer.writerow({'NUVA':code,'label': label,'comment': comment,'abstract':data['abstract'],
                             'instanceOf': data.get('instanceOf',None)})

    with open(f'CSV/nuva_valences_{lang}.csv','w',encoding='utf-8-sig',newline ='') as csvfile:
        writer = csv.DictWriter(csvfile,fieldnames=['NUVA','label','comment','shorthand', 'parent'],delimiter=',')
        writer.writeheader()
        for code,data in Valences.items():
            label = getTerm(f'{code}L',lang,data['label'])
            shorthand = getTerm (f'{code}S',lang,data['shorthand'])
            writer.writerow({'NUVA':code,'label':label,'shorthand': shorthand,'parent': data['parent']})


print("Done")


