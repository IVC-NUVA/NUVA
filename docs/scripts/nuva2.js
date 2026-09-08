/* Display utilities, common to Vaccines and Valences
- showAlert shows the alert box when an error message is needed.
- ackAlert removes the alert box when it is clicked.
- lockVCode and unlockVCode serve both the Vaccine and Valence boxes.
- refresh is a common refresh function for Vaccines and Valences
 */
function showAlert(message) {
    document.getElementById("alertmsg").innerHTML = message
	document.getElementById("alertbox").style.display = 'block'
}

function ackAlert() {
    document.getElementById("alertbox").style.display = 'none'
}

function lockVCode() {
    elem = document.getElementById("vcode")
	elem.readOnly = true
	elem.style.backgroundColor = "#D0D0D0"
}
function unlockVCode() {
    elem = document.getElementById("vcode")
	elem.readOnly = false
	elem.style.backgroundColor = ""
}

function refresh() {
	if (document.page == "Vaccines") showVaccines()   
    if (document.page == "Valences") showValences()   
}

/* Valence Tag
The valence tag appears in the list of vaccines and the selected valences.
When clicked, it toggles its presence in the selected valences.
 */
function valenceTag(idval) {
    valtag = document.createElement("span")
	valtag.className = "valence"
	valtag.id = idval
	valtag.onclick = function () {
		toggleSelection(this.id)
		refresh()
    }
    valtag.title = valences[idval]['label']
	valtag.innerHTML = valences[idval]['shorthand']
	return valtag
}

function abstractTag(idvac) {
	vactag = document.createElement("span")
	vactag.className = "abstract"
	vactag.innerHTML = idvac
	vactag.id = 'T'+idvac
	vactag.title = vaccines[idvac].label
	vactag.onclick = editVaccine
	return vactag
}

function vaccineTag(idvac) {
	vactag = document.createElement("span")
	vactag.className = "vaccine"
	vactag.innerHTML = idvac
	vactag.id = 'T'+idvac
	vactag.title = vaccines[idvac].label
	vactag.onclick = editVaccine
	return vactag
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
	if (selected_valences.has(idval)) {
		selected_valences.delete(idval)
	} else {
		selected_valences.add(idval)
		parent = valences[idval].parent 
		while (parent != idRoot) {
				selected_valences.delete(parent)
				parent = valences[parent].parent
			}
		unselectChildren(idval)
	}
	showSelected()
}

function unselectChildren(idval) {
    for (child of extvalences[idval].children) {
        selected_valences.delete(child)
        unselectChildren(child)
    }
}
	
function showSelected() {
    selplace = document.getElementById("selected")
	selplace.innerHTML = ""
	for (doubled of selected_valences.entries()) {
		idval = doubled[0]
		item = document.createElement('li')
		item.appendChild(valenceTag(idval))
		selplace.appendChild(item)
	}
	saveToSession('selected', Array.from(selected_valences))
}

function showSelectedAbstract() {
	selplace = document.getElementById("selClass")
	selplace.innerHTML = ""
	selplace.appendChild(abstractTag(selectedAbstract))
}
function clearSelected() {
    selected_valences.clear()
	selectedAbstract = null
    showSelected()
    refresh()
}

/* Filter
- setFilter is the button action that copies the selected valences to the filter
- clearFilter is the button action that empties the filter list
- showFilter presents the filter content in the sidebar and saves it to the session context
- clearBoth clears silently the filter and the selected valences. 
  It is needed when a valence is deleted.

 */
function setFilter() {
    filter = Array.from(selected_valences)
	showFilter()
	refresh()
}

function clearFilter() {
    filter = []
    showFilter()
    refresh()
}

function showFilter() {
    filplace = document.getElementById("filter")
	filplace.innerHTML = ""
	for (idval of filter) {
		item = document.createElement('li')
		item.innerHTML = valences[idval]['shorthand']
		filplace.appendChild(item)
	}
	saveToSession('filter', filter)
}

function clearBoth() {
	// Needed when a valence is deleted
	selected_valences.clear()
	selectedAbstract = null
	filter = []
	showSelected()
	showFilter()
}

/* Vaccines edition 
- editVaccine and addVaccine invoke viewEditVaccine, with the code field locked or unlocked.
- viewEditVaccine presents the vaccine edition box
- closeEditVaccine hides the vaccine edition box
- setVaccineValues checks and sets the values entered in the form
- setVaccineValences assign to the vaccines the valences in the selection.
  Implicit valences are recomputed with rebuildImplicit.
- resetVaccine restores the value from the defaultVaccines if they existed,
  or delete the vaccine if it was a new one. In the first case the implicit
  valences are recomputed with rebuildImplicit.
*/
const reVac = new RegExp("VAC\\d{4}")
var extvaccines = {}

function valencesKey(vaccine) {
	return vaccine.valences.sort(sortByValShortHand).join("-")
}

function abstractVaccineChanged(idvac) {
	vaccine = vaccines[idvac]
	if (idvac in defaultData['vaccines']) {
		ref = defaultData['vaccines'][idvac]
	} else {
		return true
	}
	
	return (
		(vaccine.label != ref.label) ||
		(vaccine.comment != ref.comment) ||
		(valencesKey(vaccine) != valencesKey(ref))
	)
}

function realVaccineChanged(idvac) {
	vaccine = vaccines[idvac]
	if (idvac in defaultData['vaccines']) {
		ref = defaultData['vaccines'][idvac]
	} else {
		return true
	}
	return (
		(vaccine.label != ref.label) ||
		(vaccine.comment != ref.comment) ||
		(vaccine.instanceOf != ref.instanceOf)
	)
}

function showVaccines() {
	rebuildAll()

	table = document.getElementById("tvac")
	table.innerHTML = ""
	br = document.createElement('br')
	
	loopvac:for (idvac of abstract) {	
		hidden = false		
		if (filter.length != 0)
		{
			for (filval of filter) {
				if (!(extvaccines[idvac].implicit.includes(filval))) continue loopvac
			}
		}
		vaccine = vaccines[idvac]
		extvaccine = extvaccines[idvac]
		row = table.insertRow(-1)
		classCell = row.insertCell(-1)
		classCell.appendChild(abstractTag(idvac))
		classLabel = document.createElement('span')	
		classLabel.innerHTML = vaccine.label
		classCell.appendChild(classLabel)			
		classCell.id = "C" + idvac
		classCell.onclick = editVaccine
		if (extvaccine.changed) classLabel.style.fontWeight = 'bold'

		valCell = row.insertCell(-1)
		valCell.id = "V"+idvac
		for (idval of vaccine.valences.sort(sortByValShortHand)) {
			val = document.createElement('div')
			val.appendChild(valenceTag(idval))
			valCell.appendChild(val)
		}

		instancesCell = row.insertCell(-1)		
		for (idchild of extvaccines[idvac].instances.sort(sortByVacLabel)) {
			vdesc = document.createElement('div')	
			vdesc.appendChild(vaccineTag(idchild))
			childLabel = document.createElement('span')
			childLabel.innerHTML = vaccines[idchild].label
			if (extvaccines[idchild].changed)
				childLabel.style.fontWeight = 'bold'
			vdesc.appendChild(childLabel)
			instancesCell.appendChild(vdesc)			
		}
			
	}	
}

function editVaccine() {
    lockVCode()	
    viewEditVaccine(this.id.substring(1),false)
}

function addAbstractVaccine() {
    unlockVCode()
    viewEditVaccine("VACxxxx", true)
}

function addRealVaccine() {
    unlockVCode()
	idvac = document.getElementById('vcode').value
    viewEditVaccine("VACxxxx", false, idvac)
}

voidAbstract = {
	"abstract": true,
	"label": "To be completed",
	"comment": "To be completed",
	"valences": []
}
voidReal = {
	"abstract": false,
	"label" : "To be completed",
	"Comment": "To be completed",
	"instanceOf": null	
}

function viewEditVaccine(idvac,isAbstract, vclass) {
    if (idvac in vaccines) {
        vaccine = vaccines[idvac]
		isAbstract = vaccine.abstract	
		if (isAbstract) {
			selectedAbstract = idvac
			showSelectedAbstract()
		}
		else {
			vclass = vaccine.instanceOf
		}
    } else {
		vaccine = (isAbstract? voidAbstract: voidReal)		
		}
   
    document.getElementById("vabstract").checked = isAbstract
    document.getElementById("vcode").value = idvac
	document.getElementById("vlabel").value = vaccine['label']
	document.getElementById("vcomment").value = vaccine['comment']
	
	assignButton = document.getElementById("assign")
	if (isAbstract) {

		vtext = ""
		for (idval of vaccine['valences']) {
			vtext += valences[idval]['shorthand'] + " "
		}
		document.getElementById("vvalences").innerHTML = vtext
		document.getElementById("classLabel").innerHTML = ""
		assignButton.innerHTML = "Assign selected valences"
		assignButton.onclick = setVaccineValences
	} else {
		document.getElementById("edit").backgroundColor="blue"		
		vaccine.instanceOf = vclass
		document.getElementById("vvalences").innerHTML = ""
		document.getElementById("vclass").value = vclass
		document.getElementById("classLabel").innerHTML = vaccines[vclass].label
		document.getElementById("assign").innerHTML = "Assign to selected class"
		assignButton.onclick = setVaccineClass
	}
	document.getElementById("edit").style = "display:block"
	if (isAbstract)
		document.getElementById("edit").style.backgroundColor= "lightgreen"
	else
		document.getElementById("edit").style.backgroundColor= "lightblue"		
}

function closeVaccineEdit() {
    document.getElementById("vcode").value = ""
	document.getElementById("edit").style = "display:none"
}

function setVaccineValues() {
    e_vcode = document.getElementById("vcode")
	idvac = e_vcode.value
	isAbstract = document.getElementById('vabstract').checked
	
	if (e_vcode.readOnly == false) {
		// Vaccine creation mode
		if (!reVac.exec(idvac)) {
			showAlert("Vaccine code should be VAC followed by 4 digits")
			return
		}
		if (idvac in vaccines) {
			showAlert("Vaccine code already used")
			return
		}
		vaccines[idvac] = (isAbstract?voidAbstract:voidReal)
		lockVCode()
	}
	vaccine = vaccines[idvac]
	vaccine['abstract'] = isAbstract
	vaccine.label = document.getElementById('vlabel').value
	vaccine.comment = document.getElementById('vcomment').value
	if (!isAbstract) {
		vaccine.instanceOf = document.getElementById('vclass').value
	}
	saveToSession("vaccines", vaccines)
	showVaccines()
}

function setVaccineValences() {
    idvac = document.getElementById("vcode").value
	if (!(idvac in vaccines)) {
		showAlert("Save vaccine before assigning valences.")
		return
	}
	vaccine = vaccines[idvac]
	vaccine.valences = Array.from(selected_valences)
// Ajouter un contrôle - N'existe pas déjà avec les mêmes valences.
	vaccine.changed = true
	//rebuildImplicit(idvac)
	viewEditVaccine(idvac)
	saveToSession("vaccines", vaccines)
	showVaccines()
}

function setVaccineClass () {
	idvac = document.getElementById("vcode").value
	if (!(idvac in vaccines)) {
		showAlert("Save vaccine before assigning valences.")
		return
	}
	if (!selectedAbstract) {
		showAlert("No abstract vaccine selected")
		return
	}	
	vaccine=vaccines[idvac]
	vaccine.instanceOf = selectedAbstract
	vaccine.changed = true
	saveToSession("vaccines",vaccines)
	showVaccines()
}

function resetVaccine() {
    idvac = document.getElementById("vcode").value
	if (!(idvac in defaultData['vaccines'])) {
		if (vaccines[idvac].abstract) {
			for (instance of extvaccines[idvac].instances)
			{
				delete vaccines[instance]
				delete extvaccines[instance]
			}
			if (selectedAbstract == idvac) {
				selectedAbstract = null
			}
		}
		delete vaccines[idvac]
		delete extvaccines[idvac]
		closeVaccineEdit()
	} else {
		vaccine = vaccines[idvac]
		Object.assign(vaccine, defaultData['vaccines'][idvac])
		vaccine.changed = false
		if (vaccine.abstract) rebuildAll()
		viewEditVaccine(idvac)
	}
	saveToSession("vaccines", vaccines)
	showVaccines()
}

/* Valences page
- Visualisation
- Selection
- Edition
- Propagation
 */

/* Valences visualisation
- showValences presents the whole valences tree, then invokes updateTicks.
- showChildren is the recursive function used by showValences.
Valences that are not compatible with the filter are hidden.

- toggleFold toggles the folded/unfolded lists when a valence line is clicked
 */
 var extvalences={}

function sortByValShortHand (a,b) {
	return valences[a].shorthand.localeCompare(valences[b].shorthand)
}
	
function showValences() {
	rebuildAll()
    lpos = document.getElementById('lval')
	lpos.innerHTML = ""
	list = showChildren(idRoot)
	lval.appendChild(list)
	updateTicks()
}

function showChildren(idval) {
    var list = document.createElement("ul")
	var children = extvalences[idval].children

	children.sort(sortByValShortHand)

	for (child of children) {
		var vchild = valences[child]
		var hidden = false
		if (filter.length != 0) {
			hidden = true
			for (filterval of filter) {
				if ((filterval == child) ||
					(extvalences[filterval].lineage.includes(child)) ||
					(extvalences[child].lineage.includes(filterval))) {
					hidden = false
				}
			}
		}
		var item = document.createElement("li")
		var s1 = document.createElement("span")
		s1.id = child
		s1.innerHTML = `${vchild.shorthand} (${child})-${vchild.label}`
		if (vchild.changed) {
			s1.style.fontWeight = 'bold'
		}
		item.appendChild(s1)
		var select = document.createElement('input')
		select.type = 'checkbox'
		select.id = "tick" + child
		select.onclick = tickValence
		var s2 = document.createElement("span")
		s2.appendChild(select)
		item.appendChild(s2)
		if (extvalences[idval].children.length == 0) {
			s1.className = 'final'
			s1.onclick = editValence
		} else {
			s1.className = 'folded'
			s1.onclick = toggleFold
			item.appendChild(showChildren(child))
		}
		list.appendChild(item)
		if (hidden) {
			item.style.display = 'none'
		} else {
			item.style.display = 'block'
		}
	}
	return list
}

function toggleFold() {
    var ul = this.parentElement.querySelectorAll('ul')[0]
	
    if (ul.style.display == 'block') {
        ul.style.display = 'none';
        this.className = 'folded';
    } else {
        ul.style.display = 'block';
        this.className = 'unfolded'
		var children = ul.querySelectorAll('li');
        for (child of children) {
            item = child.querySelectorAll('span')[0]
			if (item.className == 'unfolded') {
				item.className = 'folded';
				ul2 = child.querySelectorAll('ul')[0]
				ul2.style.display = 'none'
			}
        }
    }
    var ul = this.parentElement.querySelectorAll('ul')[0];
    // Not only unfold, but also open the edit window.
	lockVCode()
	viewEditValence(this.id)	
}

expand = true
function toggleAll()
{
	if (expand)
	{
		foldedList = [...document.getElementsByClassName('folded')]
		for (folded of foldedList) {
			folded.className = 'unfolded'
			ul = folded.parentElement.querySelectorAll('ul')[0]
			ul.style.display = 'block'
		}		
	expand = false
	} else {
		unfoldedList = [...document.getElementsByClassName('unfolded')]
		for (unfolded of unfoldedList) {
			unfolded.className = 'folded'
			ul = unfolded.parentElement.querySelectorAll('ul')[0]
			ul.style.display = 'none'
		}	
		expand = true
	}
}

/* Valences selection
- tickValence is the function called when a valence checkbox is clicked.
When a valence is added to the selection, its parents and children are removed.
- updateTicks set the valence checkboxes according the current selected_valences.
It is used on a new tick and each time the valences page is refreshed.
The parents for a selected valence are also ticked, but greyed out.
 */

function tickValence() {
	toggleSelection(this.id.substring(4))
    updateTicks()
}

function updateTicks() {
    for (idval in valences) {
        if (idval == 'Valence') continue
		tickbox = document.getElementById('tick' + idval)
		tickbox.checked = false
		tickbox.style = 'accent-color:blue'
    }

    for (doubled of selected_valences.entries()) {
        idval = doubled[0]
		tickbox = document.getElementById('tick' + idval)
		tickbox.checked = true
		tickbox.style = 'accent-color:blue'
		for (idparent of extvalences[idval].lineage) {
			tickbox = document.getElementById('tick' + idparent)
			tickbox.checked = true
			tickbox.style = 'accent-color:grey'
		}
    }
}

/* Valences edition
- editValence and addValence invoke viewEditValence, with the valence code locked or open.
- closeValenceEdit hides the edition window
- setValenceValues checks and sets the values entered in the form
- setParent assigns the first valence in selected_valences as the parent
- resetValence resumes to the default value, or totally deletes the valence if it was newly created.

setParent and resetValence require to rebuild the valence tree and vaccines implicit valences.

 */

const reVal = new RegExp("VAL\\d{3}")

function editValence() {
    lockVCode()
    viewEditValence(this.id)
}
function addValence() {
    unlockVCode()
    viewEditValence("VALxxx")
}

function viewEditValence(idval) {
    if (!(idval in valences)) {
        valence = {
            'shorthand': 'to be completed',
            'label': 'to be completed',
            'parent': 'Valence'
        }
    } else {
        valence = valences[idval]
    }
    document.getElementById("vcode").value = idval
	document.getElementById("vshorthand").value = valence['shorthand']
	document.getElementById("vlabel").value = valence['label']
	document.getElementById("vclass").value = valence.vclass
	document.getElementById("vparent").innerHTML = valences[valence['parent']]['shorthand']
	document.getElementById("edit").style = "display:block"
}

function closeValenceEdit() {
    document.getElementById("vcode").value = ""
	document.getElementById("edit").style = "display:none"
}
function setValenceValues() {
    e_vcode = document.getElementById("vcode")
	idval = e_vcode.value
	if (e_vcode.readOnly == false) {
		// Valence creation mode
		if (!reVal.exec(idval)) {
			showAlert("Valence code must be VAL followed by 3 digits")
			return
		}
		if (idval in valences) {
			showAlert("Valence code already used")
			return
		}
		lockVCode()
		valences[idval] = {"parent": [idRoot]}
		rebuildValences()
	}
	valence = valences[idval]
	valence.shorthand = document.getElementById("vshorthand").value
	valence.label = document.getElementById("vlabel").value
	valence.vclass = document.getElementById("vclass").value
	valence.changed = true
	viewEditValence(idval)
	saveToSession("valences", valences)
	showValences()
}

function setParent() {
    idval = document.getElementById("vcode").value
	if (!(idval in valences)) {
		alert("Save valence before assigning parent.")
		return
	}
	valence = valences[idval]
	if (selected_valences.size == 0) {
		valence.parent = idRoot
	} else {
		valence.parent = Array.from(selected_valences)[0]
	}
	valence.changed = true
	viewEditValence(idval)
	rebuildValences()
	saveToSession("valences", valences)
	showValences()
}
function resetValence() {
    idval = document.getElementById("vcode").value
	if (!(idval in defaultData.valences)) {
		delete valences[idval]
		closeValenceEdit()
		clearBoth()
	} else {
		Object.assign(valences[idval], defaultData.valences[idval])
		valences[idval].changed = false
		viewEditValence(idval)
	}
	rebuildValences()
	saveToSession("valences", valences)
	showValences()
}

/* Rebuilding of temporary data*/

function rebuildAll() {
    for (idval in valences) {
        valence = valences[idval]
		extvalences[idval] = {'changed': false, 'lineage': [], 'children': []}
		curval = valence.parent
		if (!(curval in valences)) {
			// Parent was deleted, reassign to root valence
			valence.parent = idRoot
			valence.changed = true
			curval = idRoot
		}
		while (curval != idRoot) {
			extvalences[idval].lineage.push(curval)
			curval = valences[curval].parent
		}
    }
    for (idval in valences) {
        if (idval == 'Valence') continue
		valence = valences[idval]
		extvalences[valence.parent].children.push(idval)
    }
    saveToSession("valences", valences)

	abstract = []
	for (idvac in vaccines) {
		vaccine = vaccines[idvac]		
		if (vaccine.abstract) {
			abstract.push(idvac)
			extvaccines[idvac]={
				'changed': abstractVaccineChanged(idvac), 
				'implicit': [],
				'instances': []}
			for (index in vaccine.valences) {
				idval = vaccine.valences[index]
				if (!(idval in valences)) {
					// Valence was deleted
					vaccine.valences.splice(index, 1)
					continue
				}
				extvaccines[idvac].implicit.push(idval)
				for (parent of extvalences[idval].lineage) {
					extvaccines[idvac].implicit.push(parent)
				}				
			}
		}
		else {
			extvaccines[idvac] = {'changed': realVaccineChanged(idvac), implicit:[]}
		}
		abstract.sort(sortByVacLabel)			
	}

	for (idvac in vaccines) {
		vaccine = vaccines[idvac]
		
		if ((!vaccine.abstract) && (vaccine.instanceOf)){
			extvaccines[vaccine.instanceOf].instances.push(idvac)
		}
		
	}		
    saveToSession("vaccines", vaccines)
}

function sortByVacLabel(a,b) {
	return (vaccines[a].label > vaccines[b].label)
}
/*
function toggleFoldFamily() {
    var ul = this.parentElement.querySelectorAll('ul')[0]
	var sublist = ul.querySelectorAll('ul')[0]
	
    if (ul.style.display == 'block') {
        ul.style.display = 'none';
        this.className = 'folded';
    } else {
        ul.style.display = 'block';
        this.className = 'unfolded'
		viewEditVaccine(this.id.substring(1), true)
    }
}
*/
selectedAbstract = null
/*
function tickFamily()
{
	idvac = this.id.substring(4)
	selectedAbstract = idvac
	selected_valences = new Set([...vaccines[idvac].valences])
	document.getElementById('assign').disabled = false
	showSelected()	
}
*/
