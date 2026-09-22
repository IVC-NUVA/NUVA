
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


function sortByVacLabel(a,b) {
	return (vaccines[a].label > vaccines[b].label)
}

function showVaccines() {
	rebuildAll()

	table = document.getElementById("tvac")
	table.innerHTML = ""
	br = document.createElement('br')
	
	filterText = document.getElementById('filterText').value.toUpperCase()
	
	classes = Object.values(abstractVaccines).sort(sortByVacLabel)
	
	loopvac:for (idvac of classes) {	
		hidden = false
		foundText = (filterText == '')
		
		if (idvac.includes(filterText)) foundText = true		
		
		if (context.filter.length != 0)
		{
			for (filval of context.filter) {
				if (!(extvaccines[idvac].implicit.includes(filval))) hidden = true
			}
		}
		vaccine = vaccines[idvac]		
		extvaccine = extvaccines[idvac]
		if (vaccine.label.toUpperCase().includes(filterText)) foundText = true
		row = table.insertRow(-1)
		classCell = row.insertCell(-1)
		classCell.appendChild(vaccineTag(idvac))
		classLabel = document.createElement('span')	
		classLabel.innerHTML = vaccine.label
		classCell.appendChild(classLabel)			
		classCell.id = "C" + idvac

		if (extvaccine.changed) classLabel.style.fontWeight = 'bold'
		if (idvac == context.currentVaccine) {row.style.backgroundColor='#95ADC5'}

		valCell = row.insertCell(-1)
		valCell.id = "V"+idvac
		for (idval of vaccine.valences.sort(sortByValShortHand)) {
			val = document.createElement('div')
			val.appendChild(valenceTag(idval))
			valCell.appendChild(val)
		}

		instancesCell = row.insertCell(-1)		
		
		if (filterText == '') foundText = true
		
		for (idchild of extvaccines[idvac].instances.sort(sortByVacLabel)) {
			vdesc = document.createElement('div')	
			vdesc.appendChild(vaccineTag(idchild))
			childLabel = document.createElement('span')
			childLabel.innerHTML = vaccines[idchild].label
			if (idchild.includes(filterText)) foundText = true
			if (vaccines[idchild].label.toUpperCase().includes(filterText)) foundText = true
			if (extvaccines[idchild].changed)
				childLabel.style.fontWeight = 'bold'
			vdesc.appendChild(childLabel)
			instancesCell.appendChild(vdesc)
			if (idchild == context.currentVaccine) {row.style.backgroundColor='#95ADC5'}			
		}
		
		if (!foundText) hidden = true
		row.style.display = (hidden?'none':'table-row')
	
	}
	if (context.currentVaccine) {
		focus(document.getElementById('T'+context.currentVaccine))
	}
}

function editVaccine() {
	setContext('currentVaccine',this.id.substring(1))
    viewEditVaccine(isAbstract=false)
}

function addAbstractVaccine() {
	setContext('currentVaccine',null)	
    viewEditVaccine(isAbstract=true)
}

function addRealVaccine() {
	abstract = context.currentVaccine
	setContext('currentVaccine',null)	
    viewEditVaccine(isAbstract=false, vclass=abstract)
}

function toggleVacDeprecated() {
	idvac = context.currentVaccine
	if (vaccines[idvac].status == 'deprecated') {
		vaccines[idvac].status = 'active'
	} else {
		vaccines[idvac].status = 'deprecated'
	}
	showVaccines()
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

function viewEditVaccine(isAbstract, vclass) {
	editWindow = document.getElementById("edit")
	assignButton = document.getElementById("assign")
	instanceButton = document.getElementById("addInstance")
	resetButton = document.getElementById("resetVac")
	deprecateButton = document.getElementById("deprecate")
	codeField = document.getElementById("vcode")
	
	idvac = context.currentVaccine
	
	if (idvac) {
		codeField.value = idvac
		codeField.readOnly = true
		codeField.style.backgroundColor = "#D0D0D0"		
        vaccine = vaccines[idvac]
		isAbstract = vaccine.abstract	
		if (isAbstract) {
			setContext('selectedAbstract',idvac)
			instanceButton.style.display = "inline"
		}
		else {
			vclass = (vaccine.instanceOf?vaccine.instanceOf:"VAC0000")	
		}	
		//showSidebar()
		assignButton.style.display = "inline"
		resetButton.style.display = (extvaccines[idvac].changed?'inline':'none')
		deprecateButton.style.display = "inline"
    } else {          // New vaccine
		codeField.readOnly = false
		codeField.value = 'VACxxxx'
		codeField.style.backgroundColor = ""		
		vaccine = (isAbstract? voidAbstract: voidReal)
		assignButton.style.display = 'none'
		instanceButton.style.display = 'none'
		resetButton.style.display = 'none'
	}
	
	deprecateButton.innerHTML = (vaccine.status == 'deprecated'?'Restore':'Deprecate')
   
    document.getElementById("vabstract").checked = isAbstract
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
		if (context.selectedAbstract) {
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
	setContext('currentVaccine',null)	
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
	setContext("currentVaccine",idvac)
	saveToSession("vaccines", vaccines)
	showVaccines()
	viewEditVaccine(isAbstract)
}

function setVaccineValences() {
    idvac = context.currentVaccine
	if (!idvac) {
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
	idvac = context.currentVaccine
	if (!idvac) {
		showAlert("Save vaccine before assigning valences.")
		return
	}
	if (!context.selectedAbstract) {
		showAlert("No abstract vaccine selected")
		return
	}	
	vaccine=vaccines[idvac]
	vaccine.instanceOf = context.selectedAbstract
	saveToSession("vaccines",vaccines)
	showVaccines()
	viewEditVaccine(idvac)		
}

function resetVaccine() {
    idvac = context.currentVaccine
	if (!(idvac in defaultData['vaccines'])) {
		if (vaccines[idvac].abstract) {
			for (instance of extvaccines[idvac].instances)
			{
				vaccines[instance].instanceOf = "VAC0000"	
			}
			// delete abstractVaccines[idvac]
			if (context.selectedAbstract == idvac) {
				setContext('selectedAbstract',null)
				showSidebar()
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
function showSidebar() {
	showSelected()
	showFilter()
	showSelectedAbstract()
	showCurrentVaccine()
	showCurrentCode()
}

// Global refresh
function refresh() {
	showSidebar()
	showVaccines()
	if (context.currentVaccine) viewEditVaccine(context.currentVaccine)

}