const VTypeOptions = {
"0": "0-Implicit",
"1": "1-Antigens",
"1.1": "1.1-Live vaccines",
"1.1.1": "1.1.1. Live attenuated pathogen vaccines",
"1.1.1.1": "1.1.1.1. Live attenuated bacterial vaccines",
"1.1.1.2": "1.1.1.2. Live attenuated viral vaccines",
"1.1.2": "1.1.2. Live recombinant viral vector vaccines",
"1.1.2.1": "1.1.2.1. Replicating viral vector vaccines",
"1.1.2.2": "1.1.2.2. Non-replicating viral vector vaccines",
"1.2": "1.2 Non-live vaccines",	
"1.2.1": "1.2.1. Whole inactivated pathogen vaccines",
"1.2.1.1": "1.2.1.1. Inactivated whole-cell bacterial vaccines",
"1.2.1.2": "1.2.1.2. Inactivated whole-virion viral vaccines",
"1.2.2": "1.2.2. Split or disrupted pathogen vaccines",
"1.2.2.1": "1.2.2.1. Split-virion viral vaccines",
"1.2.2.2": "1.2.2.2. Other disrupted pathogen vaccines",
"1.2.3": "1.2.3. Subunit vaccines",
"1.2.3.1": "1.2.3.1. Polysaccharide-based vaccines",
"1.2.3.1.1": "1.2.3.1.1. Unconjugated polysaccharide vaccines",
"1.2.3.1.2": "1.2.3.1.2. Conjugated polysaccharide vaccines",
"1.2.3.2": "1.2.3.2. Protein-based vaccines",
"1.2.3.2.1": "1.2.3.2.1. Toxoid vaccines",
"1.2.3.2.2": "1.2.3.2.2. Purified native protein vaccines",
"1.2.3.2.3": "1.2.3.2.3. Recombinant protein vaccines",
"1.2.3.2.4": "1.2.3.2.4. Virus-like particle (VLP) vaccines",
"1.2.3.3": "1.2.3.3. Membrane vesicle-based vaccines",
"1.2.3.3.1": "1.2.3.3.1. Outer membrane vesicle (OMV) vaccines",
"1.2.4": "1.2.4. Nucleic acid vaccines",
"1.2.4.1": "1.2.4.1. DNA vaccines",
"1.2.4.2": "1.2.4.2. RNA vaccines",
"1.2.4.2.1": "1.2.4.2.1. Conventional mRNA vaccines",
"1.2.4.2.2": "1.2.4.2.2. Self-amplifying RNA vaccines",
"2": "2-Antibodies",		
}

var vaccines
var valences
var extvaccines = {}
var extvalences = {}
var abstractVaccines = {}

var selectedValences
var selectedAbstract = null

function showAlert(message) {
    document.getElementById("alertmsg").innerHTML = message
	document.getElementById("alertbox").style.display = 'block'
}

function ackAlert() {
    document.getElementById("alertbox").style.display = 'none'
}

function refresh() {
	if (document.page == "Vaccines") { 
		showVaccines()
		showSelected()
		showFilter()
	}
    else if (document.page == "Valences") {
		showValences()   
		showSelected()
		showFilter()
	}
    else if (document.page == "ExtCodes") {
		rebuildAll()
		structureAbstract()
	}
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
	if (selectedValences.has(idval)) {
		selectedValences.delete(idval)
	} else {
		selectedValences.add(idval)
		parent = valences[idval].parent 
		while (parent != idRoot) {
				selectedValences.delete(parent)
				parent = valences[parent].parent
			}
		unselectChildren(idval)
	}
	showSelected()
}

function unselectChildren(idval) {
    for (child of extvalences[idval].children) {
        selectedValences.delete(child)
        unselectChildren(child)
    }
}
	
function showSelected() {
    selplace = document.getElementById("selected")
	selplace.innerHTML = ""
	for (doubled of selectedValences.entries()) {
		idval = doubled[0]
		item = document.createElement('li')
		item.appendChild(valenceTag(idval,'S'))
		selplace.appendChild(item)
	}
	saveToSession('selected', Array.from(selectedValences))
}

function clearSelected() {
    selectedValences.clear()
	selectedAbstract = null
    showSelected()
    refresh()
}

function showSelectedAbstract() {
	selplace = document.getElementById("selClass")
	selplace.innerHTML = ""
	selplace.appendChild(vaccineTag(selectedAbstract,'S'))
}

/* Filter
- setFilter is the button action that copies the selected valences to the filter
- clearFilter is the button action that empties the filter list
- showFilter presents the filter content in the sidebar and saves it to the session context
- clearBoth clears silently the filter and the selected valences. 
  It is needed when a valence is deleted.

 */
function setFilter() {
    filter = Array.from(selectedValences)
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
	selectedValences.clear()
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


function sortByVacLabel(a,b) {
	return (vaccines[a].label > vaccines[b].label)
}

function vacFocus() {
	idvac = document.getElementById('vcode').value
	if ((!idvac) || (!reVac.exec(idvac)) )return
	target = document.getElementById('T'+idvac).parentElement.parentElement
	topView = document.documentElement.scrollTop
	windowHeight = window.innerHeight
	editHeight = document.getElementById('edit').offsetHeight
	bottomView = topView+windowHeight-editHeight
	if ((target.offsetTop<= topView) || (target.offsetTop >= bottomView)) {
		target.scrollIntoView()					
	}
}

function showVaccines() {
	rebuildAll()

	table = document.getElementById("tvac")
	table.innerHTML = ""
	br = document.createElement('br')
	
	classes = Object.values(abstractVaccines).sort(sortByVacLabel)
	
	loopvac:for (idvac of classes) {	
		hidden = false
		if (filter.length != 0)
		{
			for (filval of filter) {
				if (!(extvaccines[idvac].implicit.includes(filval))) hidden = true
			}
		}
		vaccine = vaccines[idvac]
		extvaccine = extvaccines[idvac]
		row = table.insertRow(-1)
		classCell = row.insertCell(-1)
		classCell.appendChild(vaccineTag(idvac))
		classLabel = document.createElement('span')	
		classLabel.innerHTML = vaccine.label
		classCell.appendChild(classLabel)			
		classCell.id = "C" + idvac
		// classCell.onclick = editVaccine
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
			row.style.display = (hidden?'none':'table-row')
	
	}
	vacFocus()
}

function editVaccine() {
    viewEditVaccine(this.id.substring(1),false)
}

function addAbstractVaccine() {
    viewEditVaccine("VACxxxx", true)
}

function addRealVaccine() {
	idvac = document.getElementById('vcode').value
    viewEditVaccine("VACxxxx", false, idvac)
}

function toggleVacDeprecated() {
	idvac = document.getElementById('vcode').value
	if (vaccines[idvac].status == 'deprecated') {
		vaccines[idvac].status = 'active'
	} else {
		vaccines[idvac].status = 'deprecated'
	}
	showVaccines()  // A revoir, on veut seulement évaluer changed
	viewEditVaccine(idvac)
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
	"comment": "To be completed",
	"instanceOf": null	
}

function viewEditVaccine(idvac,isAbstract, vclass) {
	editWindow = document.getElementById("edit")
	assignButton = document.getElementById("assign")
	instanceButton = document.getElementById("addInstance")
	resetButton = document.getElementById("resetVac")
	deprecateButton = document.getElementById("deprecate")
	codeField = document.getElementById("vcode")
    
	if (idvac in vaccines) {
		codeField.readOnly = true
		codeField.style.backgroundColor = "#D0D0D0"		
        vaccine = vaccines[idvac]
		isAbstract = vaccine.abstract	
		if (isAbstract) {
			selectedAbstract = idvac
			showSelectedAbstract()
			instanceButton.style.display = "inline"
		}
		else {
			vclass = (vaccine.instanceOf?vaccine.instanceOf:"VAC0000")	
		}
		assignButton.style.display = "inline"
		resetButton.style.display = (extvaccines[idvac].changed?'inline':'none')
		deprecateButton.style.display = "inline"
    } else {          // New vaccine
		codeField.readOnly = false
		codeField.style.backgroundColor = ""		
		vaccine = (isAbstract? voidAbstract: voidReal)
		assignButton.style.display = 'none'
		instanceButton.style.display = 'none'
		resetButton.style.display = 'none'
	}
	
	deprecateButton.innerHTML = (vaccine.status == 'deprecated'?'Restore':'Deprecate')
   
    document.getElementById("vabstract").checked = isAbstract
    document.getElementById("vcode").value = idvac
	document.getElementById("vlabel").value = vaccine['label']
	document.getElementById("vcomment").value = vaccine['comment']

	editWindow.style = "display:block"
	
	if (isAbstract) {
		editWindow.style.backgroundColor="lightgreen"
		document.getElementById("rowValences").style.display = "table-row"
		document.getElementById("rowInstanceOf").style.display = "none"				
		vtext = ""
		for (idval of vaccine['valences']) {
			vtext += valences[idval]['shorthand'] + " "
		}
		document.getElementById("vvalences").innerHTML = vtext
		document.getElementById("classLabel").innerHTML = ""
		assignButton.innerHTML = "Assign selected valences"
		assignButton.onclick = setVaccineValences
	} else {	
		editWindow.style.backgroundColor="lightblue"
		document.getElementById("rowInstanceOf").style.display = "table-row"
		document.getElementById("rowValences").style.display = "none"					
		vaccine.instanceOf = vclass
		document.getElementById("vvalences").innerHTML = ""
		document.getElementById("vclass").value = vclass
		document.getElementById("classLabel").innerHTML = vaccines[vclass].label
		instanceButton.style.display = 'none'
		if (selectedAbstract) {
			assignButton.innerHTML = "Assign to selected abstract"
			assignButton.onclick = setVaccineClass
		} else {
			assignButton.style.display = "none"
		}
	}
	showVaccines()
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
		vaccines[idvac].created = today()
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
	viewEditVaccine(idvac)
}

function setVaccineValences() {
    idvac = document.getElementById("vcode").value
	if (!(idvac in vaccines)) {
		showAlert("Save vaccine before assigning valences.")
		return
	}
	
	vlist = Array.from(selectedValences)
	vkey = vlist.sort(sortByValShortHand).join("-")
	if (vkey in abstractVaccines) {
		showAlert (`An abstract vaccine with these valences already exists : ${abstractVaccines[vkey]}`)
		return
	}
	
	vaccine = vaccines[idvac]
	vaccine.valences = vlist
	
	saveToSession("vaccines", vaccines)
	showVaccines()
	viewEditVaccine(idvac)	
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
	saveToSession("vaccines",vaccines)
	showVaccines()
	viewEditVaccine(idvac)		
}

function resetVaccine() {
    idvac = document.getElementById("vcode").value
	if (!(idvac in defaultData['vaccines'])) {
		if (vaccines[idvac].abstract) {
			for (instance of extvaccines[idvac].instances)
			{
				delete vaccines[instance]		
			}
			// delete abstractVaccines[idvac]
			if (selectedAbstract == idvac) {
				selectedAbstract = null
			}
		}
		delete vaccines[idvac]
		closeVaccineEdit()
		saveToSession('vaccines',vaccines)
	} else {
		vaccine = vaccines[idvac]
		Object.assign(vaccine, defaultData['vaccines'][idvac])
		viewEditVaccine(idvac)
	}
	refresh()	
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


function valFocus() {
	idval = document.getElementById('vcode').value
	if ((!idval) || (!reVal.exec(idval)) )return
	valUnfold(idval)
	target = document.getElementById(idval)
	topView = document.documentElement.scrollTop
	windowHeight = window.innerHeight
	editHeight = document.getElementById('edit').offsetHeight
	bottomView = topView+windowHeight-editHeight
	if ((target.offsetTop<= topView) || (target.offsetTop >= bottomView)) {
		target.scrollIntoView()					
	}
}


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
	valFocus()
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
		if (extvalences[child].changed) {
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
		if (extvalences[child].children.length == 0) {
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
function valUnfold(idval) {
	curval = valences[idval].parent
	while(curval != idRoot) {
		span = document.getElementById(curval)
		span.className = 'unfolded'
		ul = span.parentElement.querySelectorAll('ul')[0]
		 ul.style.display = 'block' 
		curval = valences[curval].parent
	}
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
- updateTicks set the valence checkboxes according the current selectedValences.
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

    for (doubled of selectedValences.entries()) {
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
- setParent assigns the first valence in selectedValences as the parent
- resetValence resumes to the default value, or totally deletes the valence if it was newly created.

setParent and resetValence require to rebuild the valence tree and vaccines implicit valences.

 */

const reVal = new RegExp("VAL\\d{3}")

function editValence() {
    viewEditValence(this.id)
}
function addValence() {
    viewEditValence("VALxxx")
}

function vtypeselect() {
	vtlist = document.getElementById('vtype')
	idval = document.getElementById('vcode').value
	if ((vtlist.value == "0") && (idval in valences)){
		document.getElementById('implicitVType').innerHTML = "=>"+VTypeOptions[extvalences[idval].minVType]
	}
	else {
		document.getElementById('implicitVType').innerHTML = ""
	}
}

function viewEditValence(idval) {
	codeField = document.getElementById("vcode")
    if ((idval in valences)) {		
		codeField.readOnly = true
		codeField.style.backgroundColor = "#D0D0D0"	
        valence = valences[idval]	
		extvalence = extvalences[idval]
	}
	else
	{
		codeField.readOnly = false
		codeField.style.backgroundColor = ""			
        valence = {
            'shorthand': 'to be completed',
            'label': 'to be completed',
			'vtype': '0',
            'parent': 'Valence'
        }
		extvalence = {'minVType': '0', 'maxVType': '0'}
    } 

	vtlist = document.getElementById('vtype')
	vtlist.innerHTML = ""
	
	for (option of Object.keys(VTypeOptions).sort()) {
		skip = false
		if (option != '0') {
		if ((extvalence.minVType != '0') && (!option.startsWith(extvalence.minVType))) skip = true
		if ((extvalence.maxVType != '0') && (!extvalence.maxVType.startsWith(option))) skip = true
		}
		if (!skip) {
			item = document.createElement('option')
			item.value = option
			item.innerHTML = VTypeOptions[option]
			vtlist.appendChild(item)
		}
	}
    document.getElementById("vcode").value = idval
	document.getElementById("vshorthand").value = valence.shorthand
	document.getElementById("vlabel").value = valence.label
	document.getElementById("vparent").innerHTML = valences[valence.parent].shorthand
	document.getElementById("edit").style = "display:block"
	vtlist.value = valence.vtype	
	vtypeselect()	
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
		valences[idval] = {"parent": [idRoot]}
		valences[idval].created = today()
	}
	valence = valences[idval]
	valence.shorthand = document.getElementById("vshorthand").value
	valence.label = document.getElementById("vlabel").value
	valence.vtype = document.getElementById("vtype").value
	rebuildAll()
	viewEditValence(idval)
	saveToSession("valences", valences)
	showValences()
}

function setParent() {
    idval = document.getElementById("vcode").value
	if (!(idval in valences)) {
		showAlert("Save valence before assigning parent.")
		return
	}
	valence = valences[idval]
	if (selectedValences.size == 0) {
		candidate = idRoot
	} else {
		candidate = Array.from(selectedValences)[0]
	}
	parentType = extvalences[candidate].minVType
	if (parentType != '0') {
		if (((valence.vtype != '0') && (!valence.vtype.startsWith(parentType))) ||
		   ((extvalences[idval].maxVType != '0') && (!extvalences[idval].maxVType.startsWith(parentType))))
		   {
			   showAlert("Incompatible valence types")
				return
			}
	}
	valence.parent = candidate
	rebuildAll()
	saveToSession("valences", valences)
	showValences()
	viewEditValence(idval)	
}
function resetValence() {
    idval = document.getElementById("vcode").value
	if (!(idval in defaultData.valences)) {
		delete valences[idval]
		closeValenceEdit()
		clearBoth()
	} else {
		Object.assign(valences[idval], defaultData.valences[idval])
		viewEditValence(idval)
	}
	saveToSession("valences", valences)
	showValences()
}

/* Rebuilding of temporary data*/
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

function rebuildAll() {
	var idval
	extvalences = {}
	for (idval in valences) {
		extvalences[idval] = {
			'changed': valenceChanged(idval),
			'lineage': [], 
			'children': [], 
			'minVType': valences[idval].vtype, 
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
    }
    for (idval in valences) {
        if (idval == 'Valence') continue
		valence = valences[idval]
		extvalences[valence.parent].children.push(idval)
    }
	
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
				for (parent of extvalences[idval].lineage) {
					extvaccines[idvac].implicit.push(parent)
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

 function initContext() {
	fetch ('https://nuva.ivci.org/data/nuvadata.json').then(response => response.json()).then (
	 function(data){
		defaultData = data
		vaccines = loadFromSession('vaccines', defaultData['vaccines'])
		valences = loadFromSession('valences', defaultData['valences'])
		refresh()
	})
	selectedValences = new Set(loadFromSession('selected', []))	
	filter = loadFromSession('filter', [])
	if (logTimer) {
		clearInterval(logTimer)
	}		
}