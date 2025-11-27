from rdflib import *
from urllib.request import urlopen,urlretrieve
import csv
import math

BaseURI="http://ivci.org/NUVA/"

def nuva_version():
    """
    Returns the current version of the NUVA graph available from https://ivci.org/nuva
    """
    url="https://ivci.org/nuva/version"
    response=urlopen(url)
    return (response.read().decode("utf-8"))

def nuva_core_graph():
    """
    Returns the core graph of NUVA as a RDFLib graph
    :return: the core graph
    """
    nuva_file = urlopen("https://ivci.org/nuva/nuva_core.ttl")
    g = Graph(store="Oxigraph")
    g.parse(nuva_file.read())
    return g

def nuva_add_codes_to_graph(g,codesystem,codes):
    """
    Adds the alignments for an external code system.

    g: The graph where the alignments are to be added
    codesystem: The code system of the aligments
    codes: an array of Dict objects, such as {'CVX':'CVX-219','NUVA':'VAC1188')}
    """
    codeParent = URIRef(BaseURI+codesystem)
    if ((codeParent,None,None) not in g):
        g.add((codeParent,RDFS.Class,OWL.Class))
        g.add((codeParent,RDFS.subClassOf,URIRef(BaseURI+'Code')))
        g.add((codeParent,RDFS.label,Literal(codesystem)))

    for row in codes:         
        nuvaURI=URIRef(BaseURI+row["NUVA"])
        if ((nuvaURI,None,None) not in g):
            raise Exception(f"Mapping to unknown NUVA code {row['NUVA']}")
 
        codeValue = row[codesystem][1+len(codesystem):]     
        g.add((nuvaURI,SKOS.notation,Literal(codeValue,datatype = codeParent)))

def nuva_add_lang(g,lang):
    """ 
    Adds a language graph to a base graph
    """
    lang_file = urlopen("https://ivci.org/nuva/nuva_lang_"+lang+".ttl")
    g.parse(lang_file.read())

def nuva_get_vaccines(g,lang,onlyAbstract= False):
    """
    Return a Dict of all NUVA vaccines and their properties
    """
    isAbstract=URIRef(BaseURI+"nuvs#isAbstract")
    vaccines = {}
    VaccinesParent=URIRef(BaseURI+"Vaccine")
        
    for vaccine in g.subjects(RDFS.subClassOf,VaccinesParent):
        for notation in g.objects(vaccine,SKOS.notation):
            if notation.datatype == XSD.string:
                code = str(notation)
        abstract = bool(g.value(vaccine,isAbstract))
        if (onlyAbstract and abstract == False):
            continue
        label = comment= ""
        for l in g.objects(vaccine,RDFS.label):           
            if l.language  in (None,lang):
                label = str(l)
                break
        for c in g.objects(vaccine,RDFS.comment):
            if (c.language == lang):
                comment = str(c)
                break
        vaccines[code] = {'label': label, 'comment': comment, 'abstract': abstract}       
    return vaccines

def nuva_translate(g,lang1,lang2):
    """
    Extracts from a graph the translation across 2 languages
    """
    trans={}
    for (s,p,o1) in g:
        if hasattr(o1,'language') and  o1.language == lang1:
            for o2 in g.objects(s,p):
                if o2.language == lang2:
                    trans[str(o1)] = str(o2)
    return trans

def nuva_optimize(g,codesystem,onlyAbstract):
    """
    Determines the optimal mapping of a code system to NUVA, either full or limited to abstract vaccines.
    Returns a dictionary with three items:
    - bestcodes, a dictionary of all NUVA concepts
    - revcodes, a dictionary of all codes in the code system
    - metrics, the computed metrics of the code system

    For each NUVA concept, bestcodes is formed by:
    - label: the English label of the concept
    - isAbstract: whether the concept is abstract
    - nbequiv: the number of codes that match exactly the NUVA concept
    - blur: the number of concepts covered by the narrowest codes for the NUVA concept. If nbequiv is not 0, blur should be 1
    - codes: the list of codes with the given blur

    For each code in the code system, revcodes is formed by:
    - label: the English label of the corresponding NUVA concept
    - cardinality: the number of NUVA concepts covered by the given code
    - may: the list of these NUVA concepts
    - blur: the number of NUVA concepts for which the given code is the best possible one
    - best: the list of these NUVA concepts, that is a subset of "may"

    The metrics is formed by:
    - completeness: the share of NUVA concepts that can be represented by a code, even roughly
    - precision: the inverse of the average blur over all the codes in the code system, when using the most optimal one for each concept.
    - redundancy: for the NUVA concepts that have exact alignments in the code system, the average number of such alignments.
    """
    max_blur=10000
    
    vaccines = nuva_get_vaccines(g,'en',onlyAbstract)
    
    bestcodes = {}
    revcodes = {}

    for code,properties in vaccines.items():
        bestcodes[code] = {'label':str(properties['label']),'blur':max_blur,'isAbstract':properties['abstract'], 'bestcodes':{}, 'othercodes':{}, 'nbequiv': 0}
        
    nbnuva = len(vaccines)

    q2="""
    SELECT ?extnot ?rlabel ?rnot ?abstract WHERE {
    ?rvac rdfs:subClassOf nuva:Vaccine . 
    ?rvac rdfs:label ?rlabel FILTER(lang(?rlabel)in ('en','')).
    ?rvac skos:notation ?rnot FILTER(DATATYPE(?rnot)=xsd:string).
    ?rvac skos:notation ?extnot FILTER(DATATYPE(?extnot)=nuva:""" + codesystem+""").
    ?rvac nuvs:isAbstract ?abstract ."""
    if onlyAbstract:
       q2+= "?rvac nuvs:isAbstract true }"
    else:
        q2+= "}"
     
    res2 = g.query(q2)
    for row in res2:
        extnot = str(row.extnot)
        nuva_code = str(row.rnot)
        label = str(row.rlabel)
        bestcodes[nuva_code]['nbequiv'] += 1
        bestcodes[nuva_code]['blur'] = 1
        bestcodes[nuva_code]['bestcodes'][extnot] = label
        # For a concrete code, the match can only be perfect
        if bool(row.abstract) == False:
            revcodes[extnot]= {"label" : label, "cardinality" : 1, "may": [nuva_code], "blur":1, "best": [nuva_code]}
    
    # rvac is an abstract concept matching exactly the external code ?extcode noted with ?extnot
    # nvac is the total number of NUVA concepts that can be represented with rvac (have the same valences)
    # lvac is the list of these NUVA concepts
    q3="""
   SELECT ?extnot ?rlabel (count(?vacnot) as ?nvac) (GROUP_CONCAT(?vacnot) as ?lvac) WHERE { 
   ?rvac rdfs:subClassOf nuva:Vaccine .    
   ?rvac skos:notation ?rnot FILTER(DATATYPE(?rnot)=xsd:string).
   ?rvac skos:notation ?extnot FILTER(DATATYPE(?extnot)=nuva:""" + codesystem+""").
   ?rvac rdfs:label ?rlabel FILTER(lang(?rlabel)='en').
   ?rvac nuvs:isAbstract true .
   ?vac rdfs:subClassOf nuva:Vaccine .
   """
    if onlyAbstract:
       q3+= """?vac nuvs:isAbstract true .
       """
    q3+= """
   ?vac skos:notation ?vacnot FILTER(DATATYPE(?vacnot)=xsd:string)
    FILTER NOT EXISTS {
    # The reference vaccine ?rvac for the external code does not have any valence not within the ?vac candidate
    # Considering all valences within ?rvac
   # Keep the ones that do not have a child in the candidate ?vac
   # If the list is not empty, the candidate is discarded
        ?rvac nuvs:containsValence ?rval .
        FILTER NOT EXISTS {
            ?vac nuvs:containsValence ?val .
            ?val rdfs:subClassOf* ?rval
        }
    } .
 FILTER NOT EXISTS {
 # The ?vac candidate does not have any valence not present in the reference vaccine ?rvac
 # Considering all valences of the candidate ?vac
 # We keep the ones that do not have a parent in the reference ?rvac
 # If the list is not empty, the candidate is discarded
       ?vac nuvs:containsValence ?val .
        FILTER  NOT EXISTS {
            ?rvac nuvs:containsValence ?rval .
            ?val rdfs:subClassOf* ?rval
        }
    }
 } GROUP BY ?extnot ?rlabel
   """
    res3=g.query(q3)

    for row in res3:
        extnot = str(row.extnot)
        label = str(row.rlabel)
        nuva_codes=row.lvac.split()
         
        rcard = len(nuva_codes)                  
        # Cardinality is the total number of NUVA concepts that can be represented by extcode
        # May is the list of those NUVA concepts
        # Blur is the number of NUVA concepts for which extnot is the best possible option
        # Best is the list of those NUVA concepts
        revcodes[extnot]= {"label" : label, "cardinality" : rcard, "may": [], "blur":0, "best": []}

        for nuva_code in nuva_codes:
            if nuva_code not in revcodes[extnot]['may']:
                revcodes[extnot]['may'].append(nuva_code)

            if (bestcodes[nuva_code]['blur'] == rcard):
                bestcodes[nuva_code]['bestcodes'][extnot] = label
                continue
            if (bestcodes[nuva_code]['blur'] > rcard):
                bestcodes[nuva_code]['blur'] = rcard
                bestcodes[nuva_code]['bestcodes']={extnot:label}

    # Now reconsider the best code for each NUVA code
    # To determine what is the best level of blur that we can reach
    # Also count for statistics
    total_equiv = nuva_equiv = unmapped = 0

    for nuva_code in vaccines:
        if bestcodes[nuva_code]['nbequiv'] != 0:
            nuva_equiv += 1
            total_equiv += bestcodes[nuva_code]['nbequiv']
        if bestcodes[nuva_code]['blur'] == max_blur:
            unmapped += 1
        for extnot in bestcodes[nuva_code]['bestcodes']:
            if nuva_code not in revcodes[extnot]['best']:
                revcodes[extnot]['best'].append(nuva_code)
            revcodes[extnot]['blur'] = len( revcodes[extnot]['best'])

    # Finally determine the metrics
    total_blur = 0
    for extnot in revcodes:
        total_blur += revcodes[extnot]['blur']
        for nuva_code in revcodes[extnot]['may']:
            if extnot in bestcodes[nuva_code]['bestcodes']:
                bestcodes[nuva_code]['blur'] = len(revcodes[extnot]['best'])
            else:
                bestcodes[nuva_code]['othercodes'][extnot]=revcodes[extnot]['label']
    
    nbcodes = len(revcodes)
    completeness = (nbnuva-unmapped)/nbnuva
    precision = 0
    if total_blur != 0:
        precision = nbcodes/total_blur
    redundancy = total_equiv/nuva_equiv

    metrics = {"nuvacodes": nbnuva, "extcodes": nbcodes, "completeness": completeness, "precision": precision, "redundancy": redundancy }
    return ({"map": bestcodes,"metrics": metrics})

