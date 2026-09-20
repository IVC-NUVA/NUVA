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

	
function showValences() {
	rebuildValences()
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
		if (context.filter.length != 0) {
			hidden = true
			for (filterval of context.filter) {
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

    for (idval of context.selectedValences) {
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
	rebuildValences()
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
	rebuildValences()
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

function showSidebar() {
	showFilter()
	showSelected()
	showCurrentCode()
}

function refresh() {  
	showSidebar()
	showValences() 	
}