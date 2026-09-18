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

Vaccines = loadUnits("Vaccines")
Valences = loadUnits("Valences")

with open('CSV/nuva_vaccines.csv','w',encoding='utf-8-sig',newline ='') as csvfile:
    writer = csv.DictWriter(csvfile,fieldnames=['NUVA','label','comment','abstract','instanceOf'],delimiter=',')
    writer.writeheader()
    for code,data in Vaccines.items():
        writer.writerow({'NUVA':code,'label':data['label'],'comment':data['comment'],'abstract':data['abstract'],
                         'instanceOf': data.get('instanceOf',None)})

with open('CSV/nuva_valences.csv','w',encoding='utf-8-sig',newline ='') as csvfile:
    writer = csv.DictWriter(csvfile,fieldnames=['NUVA','label','comment','shorthand', 'parent'],delimiter=',')
    writer.writeheader()
    for code,data in Valences.items():
        writer.writerow({'NUVA':code,'label':data['label'],'shorthand':data['shorthand'],'parent': data['parent']})


print("Done")


