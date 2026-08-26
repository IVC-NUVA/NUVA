/* Display utilities, common to Vaccines and Valences
*/
function showAlert(message) {
	document.getElementById("alertmsg").innerHTML = message
	document.getElementById("alertbox").style.display='block'	
}

function ackAlert() {
	document.getElementById("alertbox").style.display='none'
}

function lockVCode()
{
	console.log("Lock VCode");
	elem = document.getElementById("vcode")
	elem.readOnly = true
	elem.style.backgroundColor = "#D0D0D0"
}
function unlockVCode()
{
	console.log("Unlock VCode");

	elem = document.getElementById("vcode")
	elem.readOnly = false
	elem.style.backgroundColor = ""	
}

function refresh() {
	if (document.page == "Vaccines") {showVaccines()}
	if (document.page == "Valences") {showValences()}
}

/* Valence Tag 
 The valence tag appears in the list of vaccines and the selected valences.
 When clicked, it toggles its presence in the selected valences.
*/
function valenceTag(valcode)
{
    valtag = document.createElement("span")
    valtag.className = "valence"
    valtag.id = valcode
    valtag.onclick = function() {
      id = this.id
      if (selected_valences.has(id)) {
        selected_valences.delete(id)
      } else {
      selected_valences.add(id)
      }
      showSelected()
	  refresh()
    }
    valtag.title = valences[valcode]['label']
    valtag.innerHTML = valences[valcode]['shorthand']
    return valtag
}


/* Selected Valences zone */

function showSelected () {
  selplace = document.getElementById("selected")
  selplace.innerHTML = ""
  for (dvalcode of selected_valences.entries()) {
    valcode = dvalcode[0]
    item = document.createElement('li')
    item.appendChild(valenceTag(valcode))
    selplace.appendChild(item)
  }
  saveToSession('selected',Array.from(selected_valences))
}

function clearSelected() {
    selected_valences.clear()
    showSelected()
	refresh()
}

/* Filter zone */
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

function showFilter () {
  filplace = document.getElementById("filter")
  filplace.innerHTML = ""
  for (valcode of filter) {
    item = document.createElement('li')
    item.innerHTML = valences[valcode]['shorthand']
    filplace.appendChild(item)
  }
  saveToSession('filter',filter)
}

/* Vaccines page 
- Visualisation
- Edition
- Propagation
*/
const reVac = new RegExp("VAC\\d{4}")

/* Vaccines visualisation */

function showVaccines ()
{
  table = document.getElementById("lvac")
  table.innerHTML=""
  vloop:for (vcode in vaccines) {
    vaccine = vaccines[vcode]
    for (filterval of filter) {
      if (! (vaccine['implicit'].includes(filterval))) continue vloop
    }
    row = table.insertRow(-1)
	codeCell = row.insertCell(-1)
	codeCell.id = "C"+vcode
    codeCell.innerHTML = vcode
	codeCell.onclick = editVaccine
	
	labelCell = row.insertCell(-1)
    labelCell.id = 'L'+vcode
	labelCell.innerHTML = vaccine['label']
	if (vaccine['changed']) {
		labelCell.style.fontWeight="bold"
	}
	labelCell.onclick = editVaccine
    valcell = row.insertCell(-1)
    for (vcode of vaccine['valences']) {
        valcell.appendChild(valenceTag(vcode))
    }
   }
}

/* Vaccines edition 


*/

function editVaccine() {
	lockVCode()
	viewEditVaccine(this.id.substring(1))
}

function addVaccine() {
	unlockVCode()
	viewEditVaccine("VNEW")
}

function viewEditVaccine(vcode) {
	if (vcode in vaccines) {
		vaccine = vaccines[vcode]
	} else {
		vaccine = {
			"abstract": false, 
			"label":"To be completed", 
			"comment": "To be completed",
			"valences": [],
			"implicit": []}
		}	
	document.getElementById("vcode").value = vcode
	document.getElementById("vabstract").checked = vaccine['abstract']
	document.getElementById("vlabel").value = vaccine['label']
	document.getElementById("vcomment").value = vaccine['comment']	
	vtext=""
	for (idval of vaccine['valences']) {
		vtext += valences[idval]['shorthand']+" "
		}		
	document.getElementById("vvalences").innerHTML = vtext
	document.getElementById("edit").style = "display:block"		
}

function closeVaccineEdit() {
	document.getElementById("vcode").value = ""	
	document.getElementById("edit").style = "display:none"
}

function setVaccineValues() {
	vcodefield = document.getElementById("vcode")
	vcode = vcodefield.value
	if (vcodefield.readOnly == false) {		
		// Vaccine creation mode
		vcode = reVac.exec(vcode)
		if (!vcode) {
			showAlert("Invalid vaccine code")
			return		
		}
		if (vcode in vaccines) {
			showAlert("Vaccine code already used")
			return
		}
		vaccines[vcode]={"valences":[]}
		lockVCode()
	}
	vaccine = vaccines[vcode]
	vaccine['abstract'] = document.getElementById('vabstract').checked
	vaccine.label = document.getElementById('vlabel').value
	vaccine['comment'] = document.getElementById('vcomment').value
	vaccine["changed"]=true
	saveToSession("vaccines",vaccines)
	showVaccines()
}

function setVaccineValences () {
	vcode = document.getElementById("vcode").value
	if (!(vcode in vaccines)) {
		showAlert("Save vaccine before assigning valences.")
		return
	}
	vaccine = vaccines[vcode]
	vaccine['valences'] = Array.from(selected_valences)
	vaccine["changed"]=true	
	rebuildVaccine(vcode)
	viewEditVaccine(vcode)
	saveToSession("vaccines",vaccines)
	showVaccines()
}

function resetVaccine () {
	vcode = document.getElementById("vcode").value
	if (!(vcode in defaultVaccines)) {
		delete vaccines[vcode]
		closeVaccineEdit()
	}
	else {
		Object.assign(vaccines[vcode],defaultVaccines[vcode])
		vaccines[vcode].changed = false
		rebuildVaccine(vcode)
		viewEditVaccine(vcode)
	}
	saveToSession("vaccines",vaccines)
	showVaccines()
}	

/* Vaccines propagation */

function rebuildVaccine(vcode) {
	vaccine = vaccines[vcode]
	vaccine.implicit = []
	for (index in vaccine.valences) {
		idval = vaccine.valences[index]
		if (!(idval in valences)) {
			// Valence was deleted			
			vaccine.valences.splice(index,1)
			continue
		}
		vaccine.implicit.push(idval)
		for (parent of valences[idval].lineage) {
			vaccine.implicit.push(parent)
		}
	}
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
   
 - unfold toggles the folded/unfolded lists when a valence line is clicked
 */
function showValences ()
{
    lpos = document.getElementById('lval')
	lpos.innerHTML=""
    list = showChildren(valences["Valence"])
    lval.appendChild (list)
	updateTicks()
}
 
function showChildren(valence) {
  var list = document.createElement("ul")
  var children = valence['children']

  children.sort(function(a,b) {
      return valences[a].shorthand.localeCompare(valences[b].shorthand)
  })

  for (child of children) {
    var vchild =  valences[child]
    var hidden = false
    if (filter.length != 0) {
      hidden = true
      for (filterval of filter) {
        if ((filterval == child) ||
            (valences[filterval]['lineage'].includes(child)) ||
            (valences[child]['lineage'].includes(filterval))) {
          hidden = false
        }
      }
    }
    var item = document.createElement("li")
    var s1 = document.createElement("span")
	s1.id = child
    s1.innerHTML = vchild['shorthand']+'('+child+')-'+vchild['label']
	if (vchild['changed']) {
		s1.style.fontWeight = 'bold'
	}
    item.appendChild(s1)
        var select = document.createElement('input')
    select.type = 'checkbox'
    select.id = "tick"+child
    select.onclick = tickValence
    var s2 = document.createElement("span")
    s2.appendChild(select)
    item.appendChild(s2)
     if (vchild['children'].length == 0) {
       s1.className = 'final'
	   s1.onclick = editValence
     } else {
       s1.className = 'folded'
	   s1.onclick = unfold
       item.appendChild(showChildren(vchild))
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

 function unfold() {
var ul=this.parentElement.querySelectorAll('ul')[0];	
if (ul.style.display == 'block')   // Line was expanded => hide it.
  { ul.style.display='none' ;
    this.className = 'folded';
   }
else {
	ul.style.display='block' ;
	this.className = 'unfolded'
	var children=ul.querySelectorAll('li');
	for (var j=0; j<children.length;j++)
	{
	  child = children[j];
	  item = child.querySelectorAll('span')[0]
	  if (item.className == 'unfolded')
	  {
		item.className = 'folded';
		ul2 = child.querySelectorAll('ul')[0]
		ul2.style.display = 'none'
	  }
	}
}
var ul=this.parentElement.querySelectorAll('ul')[0];
lockVCode()	
viewEditValence(this.id)
}

 /* Valences selection 
 - tickValence is the function called when a valence checkbox is clicked.
   When a valence is added to the selection, its parents and children are removed.
 - unselectChildren is a recursive function used by tickValence
 - updateTicks set the valence checkboxes according the current selected_valences.
   It is used on a new tick and each time the valences page is refreshed.
   The parents for a selected valence are also ticked, but greyed out.
 */

 function tickValence() {
  me = this.id.substring(4)
  if (this.checked) {
	selected_valences.add(me)
	parent = valences[me].parent
	while (parent != "Valence") {
		selected_valences.delete(parent)
		parent = valences[parent].parent
		}
	unselectChildren(me)

	} else {
	selected_valences.delete(me)
	}
	updateTicks()
	showSelected()
    }

function unselectChildren(vid) {
  for (child of valences[vid]['children']) {
    selected_valences.delete(child)
    unselectChildren(child)
  }
}

function updateTicks()
{
  for (valcode in valences) {
    if (valcode == 'Valence') continue
    tickbox = document.getElementById('tick'+valcode)
    tickbox.checked = false
    tickbox.style ='accent-color:blue'
  }

  for (dvalcode of selected_valences.entries()) {
      valcode = dvalcode[0]
      tickbox = document.getElementById('tick'+valcode)
      tickbox.checked = true
      tickbox.style = 'accent-color:blue'
      for (valpar of valences[valcode]['lineage']) {
        tickbox = document.getElementById('tick'+valpar)
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
	viewEditValence("VNEW")
}

function viewEditValence(vcode) {
	if (vcode == 'VNEW') {
		valence = {
			'shorthand':'to be completed',
			'label':'to be completed',
			'parent':'Valence'}
	} else {
		valence = valences[vcode]
	}
	document.getElementById("vcode").value = vcode	
	document.getElementById("vshorthand").value = valence['shorthand']
	document.getElementById("vlabel").value = valence['label']
	document.getElementById("vparent").innerHTML = valences[valence['parent']]['shorthand']
	document.getElementById("edit").style = "display:block"		
}
function closeValenceEdit () {
	document.getElementById("vcode").value = ""		
	document.getElementById("edit").style = "display:none"	
}
function setValenceValues(){
	vcodefield = document.getElementById("vcode")
	vcode = vcodefield.value
	if (vcodefield.readOnly == false) {		
		// Valence creation mode
		vcode = reVal.exec(vcode)
		if (!vcode) {
			showAlert("Invalid valence code")
			return		
		}
		if (vcode in valences) {
			showAlert("Valence code already used")
			return
		}
		lockVCode()
		valences[vcode]={"parent":["Valence"]}
		rebuildValences()
	}
	valence = valences[vcode]
	valence.shorthand = document.getElementById("vshorthand").value
	valence.label = document.getElementById("vlabel").value
	valence.changed = true
	viewEditValence(vcode)
	saveToSession("valences",valences)
	showValences()	
}
function setParent(){
	vcode = document.getElementById("vcode").value
	if (!(vcode in valences)) {
		alert ("Save valence before assigning parent.")
		return
	}
	valence = valences[vcode]
	if (selected_valences.size == 0) {
		valence.parent = "Valence"
	} else
	{
		valence.parent = Array.from(selected_valences)[0]
	}
	viewEditValence(vcode)
	rebuildValences()
	saveToSession("valences",valences)
	showValences()		
}
function resetValence() {
	vcode = document.getElementById("vcode").value
	if (!(vcode in defaultValences)) {
		delete valences[vcode]
		rebuildValences()
		clearSelected()
		clearFilter()
		closeValenceEdit()
	}
	else {	
		Object.assign(valences[vcode],defaultValences[vcode])
		valences[vcode].changed = false
		viewEditValence(vcode)
	}
	rebuildValences()	
	saveToSession("valences",valences)
	showValences()	
}


 /* Valences rebuilding */
 
function rebuildValences() {
	for (idval in valences) {
		valence = valences[idval]
		valence.lineage = []
		curval = valence.parent		
		while (curval != 'Valence') {
			valence.lineage.push(curval)
			curval = valences[curval].parent
		}		
		valence.children = []
	}
	for (idval in valences) {
		if (idval == 'Valence') continue
		valence = valences[idval]
		valences[valence.parent].children.push(idval)
	}
	
	saveToSession("valences",valences)
	
	for (idvac in vaccines) {
		rebuildVaccine(idvac)
	}
	saveToSession("vaccines",vaccines)		
}
