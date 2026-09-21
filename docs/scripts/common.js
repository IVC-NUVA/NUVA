const idRoot = "Valence"
const voidContext = {
	'selectedValences': [], 'filter': [], 'selectedAbstract': null, 
    'currentVaccine': null, 'currentValence': null, 'currentCode': null}

var vaccines
var valences
var extvaccines = {}
var extvalences = {}
var abstractVaccines = {}
var context = voidContext
var loglines = []
var logTimer = null


function today() {
    return (new Date().toISOString().substring(0, 10))
}

/* Keep context in local storage*/
function loadFromSession(key, value) {
	storage = (window.location.protocol == 'file:'?sessionStorage:localStorage)
    json = storage.getItem(key)
	if (json == null) {
		json = JSON.stringify(value)
		storage.setItem(key, json)
	}
	return JSON.parse(json)
}

function saveToSession(key, value) {
	storage = (window.location.protocol == 'file:'?sessionStorage:localStorage)	
	if (value) {
		json = JSON.stringify(value)
		storage.setItem(key, json)
	}
	else storage.removeItem(key)
}

// Alert box
function showAlert(message) {
    document.getElementById("alertmsg").innerHTML = message
	document.getElementById("alertbox").style.display = 'block'
}

function ackAlert() {
    document.getElementById("alertbox").style.display = 'none'
}

// Log window
function refreshLog() {
    if (loglines.length == 0) return
	logView = document.getElementById("log")
	line = loglines.shift()
	logView.innerHTML += line + "<br/>"
	logView.scrollTop = logView.scrollHeight
}

function doLog(text) {
    loglines.push(text)
}

function initLog() {
    logTimer = setInterval(refreshLog, 10)
}

/* Valence Tag
The valence tag appears in the list of vaccines and the selected valences.
When clicked, it toggles its presence in the selected valences.
 */
function valenceTag(idval,prefix = 'T') {
    valtag = document.createElement("span")
	valtag.className = "valence"
	valtag.id = prefix+idval
	valtag.onclick = function () {
		toggleSelection(this.id.substring(1))
		refresh()
    }
    valtag.title = valences[idval]['label']
	valtag.innerHTML = valences[idval]['shorthand']
	return valtag
}

function vaccineTag(idvac,prefix='T') {
	vactag = document.createElement("span")
	vactag.className = (vaccines[idvac].abstract?"abstract":"vaccine")
	vactag.innerHTML = idvac
	vactag.id = prefix+idvac
	vactag.title = vaccines[idvac].label
	vactag.onclick = editVaccine
	if (vaccines[idvac].status == 'deprecated') {
		vactag.style.fontStyle = "italic"
		vactag.style.backgroundColor=(vaccines[idvac].abstract?'lightgreen':'lightblue')
		}
	return vactag
}
function codeTag(idcode, prefix='T') {
	codetag = document.createElement("span")
	codetag.className = 'code'
	codetag.innerHTML = idcode
	codetag.id = prefix+idcode
	codetag.title = CSData.code2nuva[idcode].label
	return codetag
}

function setContext(key,value) {
	context[key] = value
	saveToSession('context',context)
	showSidebar()
}

/* Selected Valences 
- toggleSelection is triggered either from a valence tag (vaccines view)
  or a valence checkbox (valences view).
  It inserts or remove the valence in the selected valences.
  When a valence is inserted, both its parents and children are removed.
- unselectChildren is a recursive function for toggleSelection
- showSelected displays the selection in the sidebar and saves it to the session context
- clearSelected empties the selected valences

 */
function toggleSelection (idval) {
	if (context.selectedValences.includes(idval)) {
		context.selectedValences = context.selectedValences.filter(item=>item != idval)
	} else {
		context.selectedValences.push(idval)
		parent = valences[idval].parent
		while (parent != idRoot) {
				context.selectedValences = context.selectedValences.filter(item=>item != parent)
				parent = valences[parent].parent
			}		
		unselectChildren(idval)
	}
	setContext("selectedValences",context.selectedValences)
	showSelected()
}

function unselectChildren(idval) {
    for (child of extvalences[idval].children) {
        context.selectedValences = context.selectedValences.filter(item=>item != child)
        unselectChildren(child)
    }
}
	
function showSelected() {
    selplace = document.getElementById("selected")
	selplace.innerHTML = ""
	for (idval of context.selectedValences) {
		item = document.createElement('li')
		item.appendChild(valenceTag(idval,'S'))
		selplace.appendChild(item)
	}
}

function clearSelected() {
	setContext('selectedValences',[])
	setContext('selectedAbstract',null)
    showSelected()
    refresh()
}

function showSelectedAbstract() {
	selplace = document.getElementById("selClass")
	selplace.innerHTML = ""
	if (context.selectedAbstract) selplace.appendChild(vaccineTag(context.selectedAbstract,'S'))
}

/* Filter
- setFilter is the button action that copies the selected valences to the filter
- clearFilter is the button action that empties the filter list
- showFilter presents the filter content in the sidebar and saves it to the session context
- clearBoth clears silently the filter and the selected valences. 
  It is needed when a valence is deleted.

 */
function setFilter() {
	setContext('filter',[...context.selectedValences])
	showFilter()
	refresh()
}

function clearFilter() {
	setContext('filter',[])
    showFilter()
    refresh()
}

function showFilter() {
    filplace = document.getElementById("filter")
	filplace.innerHTML = ""
	for (idval of context.filter) {
		item = document.createElement('li')
		item.innerHTML = valences[idval]['shorthand']
		filplace.appendChild(item)
	}
}

function clearBoth() {
	// Needed when a valence is deleted
	setContext('selectedValences',[])
	setContext('selectedAbstract',null)
	setContext('filter',[])
	showSidebar()
}

function sortByValShortHand (a,b) {
	return valences[a].shorthand.localeCompare(valences[b].shorthand)
}

function valencesKey(vaccine) {
	return vaccine.valences.sort(sortByValShortHand).join("-")
}


function showCurrentVaccine()
{
  document.getElementById('idvac').innerHTML = ""
  if (context.currentVaccine) {
	document.getElementById("idvac").appendChild(vaccineTag(context.currentVaccine,'S'))
  }
}

function showCurrentCode()
{
	document.getElementById('idcode').innerHTML = ""
	if (context.currentCode) {
		document.getElementById("idcode").appendChild(codeTag(context.currentCode))
	}

}

/* Rebuilding of temporary data*/
function valenceChanged(idval) {
	valence = valences[idval]
	if (idval in defaultData['valences']) {
		ref = defaultData['valences'][idval]
	} else {
		return true
	}
	return (
		(valence.shorthand != ref.shorthand) ||
		(valence.label != ref.label) ||
		(valence.vtype != ref.vtype) ||
		(valence.parent != ref.parent)
	)
}

function abstractVaccineChanged(idvac) {
	vaccine = vaccines[idvac]
	if (idvac in defaultData['vaccines']) {
		ref = defaultData['vaccines'][idvac]
	} else return true
	return (
		(vaccine.label != ref.label) ||
		(vaccine.comment != ref.comment) ||
		(vaccine.status != ref.status) ||	
		(valencesKey(vaccine) != valencesKey(ref))
	)
}

function realVaccineChanged(idvac) {
	vaccine = vaccines[idvac]
	if (idvac in defaultData['vaccines']) {
		ref = defaultData['vaccines'][idvac]
	} else return true
	return (vaccine.label != ref.label) ||
		(vaccine.comment != ref.comment) ||	
		(vaccine.status != ref.status) ||		
		(vaccine.instanceOf != ref.instanceOf)
}

function rebuildValences() {
	var idval
	extvalences = {}
	for (idval in valences) {
		extvalences[idval] = {
			'changed': valenceChanged(idval),
			'lineage': [], 
			'children': [], 
			'minVType': '0', 
			'maxVType': '0'}
	}
    for (idval in valences) {
        valence = valences[idval]		
		extvalence = extvalences[idval]
		curval = valence.parent
		if (!(curval in valences)) {
			// Parent was deleted, reassign to root valence
			valence.parent = idRoot
			valence.vtype = '0'
			curval = idRoot
			saveToSession("valences",valences)
		}
		while (curval != idRoot) {
			extvalences[idval].lineage.push(curval)
			// MinVType = nearest parent valence type
			if (extvalence.minVType == '0') {
				extvalence.minVType = valences[curval].vtype
			}
			// Find nearest common ancestor
			maxVType = extvalences[curval].maxVType
			if (maxVType == '0') {			
				maxVType = valence.vtype
			} else {
				if (valence.vtype != '0') {
				for (i = valence.vtype.length; i>0; i--) {
					if (valence.vtype.substring(0,i) == maxVType.substring(0,i)) {					
						maxVType = maxVType.substring(0,i-1)
						break
					}
				}
				if (maxVType == "") maxVType = "0"
				}
			}
			extvalences[curval].maxVType = maxVType
			curval = valences[curval].parent
		}
		if (idval != idRoot) {
			valence = valences[idval]
			extvalences[valence.parent].children.push(idval)
		}
    }		
}

function rebuildVaccines() {
	abstractVaccines = {}
	extvaccines = {'VAC0000': {'changed': false}}
	
	for (idvac in vaccines) {
		vaccine = vaccines[idvac]		
		if (vaccine.abstract) {
			vkey = valencesKey(vaccine)
			if ((vkey in abstractVaccines) && (vaccine.status != 'deprecated')) {
				doLog(`Duplicate abstract vaccine : ${abstractVaccines[vkey]} and ${idvac}`) 
				
			} else {
				if (vaccine.status != 'deprecated')
					abstractVaccines[vkey] = idvac
			}
			extvaccines[idvac]={
				'changed': abstractVaccineChanged(idvac), 
				'implicit': [],
				'instances': []}
			for (index in vaccine.valences) {
				idval = vaccine.valences[index]
				if (!(idval in valences)) {
					// Valence was deleted
					vaccine.valences.splice(index, 1)
					saveToSession('vaccines',vaccines)
					continue
				}
				extvaccines[idvac].implicit.push(idval)
				
				curval = valences[idval].parent
				while (curval != idRoot){				
					extvaccines[idvac].implicit.push(curval)
					curval = valences[curval].parent
				}				
			}
		}
		else {
			extvaccines[idvac] = {'changed': realVaccineChanged(idvac), implicit:[]}
		}	
	}
	for (idvac in vaccines) {
		vaccine = vaccines[idvac]
		if (vaccine.abstract) {
			if (vaccine.status == 'deprecated') {
				vkey = valencesKey(vaccine)
				if (vkey in abstractVaccines) {
					extvaccines[abstractVaccines[vkey]].instances.push(idvac)
				} else {
					extvaccines['VAC0000'].instances.push(idvac)
				}
			}
		}
		else  // Real vaccine
		{	
			instanceOf = (vaccine.instanceOf?vaccine.instanceOf:'VAC0000')
			if (vaccines[instanceOf].status == 'deprecated') {
				instanceOf = 'VAC0000'
			}
			extvaccines[instanceOf].instances.push(idvac)			
		}
	}		
}

function rebuildAll()
{
	rebuildValences()
	rebuildVaccines()
}

 function initContext() {
	fetch ('https://nuva.ivci.org/data/nuvadata.json').then(response => response.json()).then (
	 function(data){
		defaultData = data
		vaccines = loadFromSession('vaccines', defaultData['vaccines'])
		valences = loadFromSession('valences', defaultData['valences'])
		CSData = loadFromSession('CSData',{'CSID':null,'code2nuva':{}, 'nuva2code':{}})
		context = loadFromSession('context', voidContext)
		refresh()
	})
	if (logTimer) {
		clearInterval(logTimer)
	}		
}