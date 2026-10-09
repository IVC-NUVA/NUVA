const reCSV = new RegExp('(".*?"|[^",]+)(?=\s*,|\s*$)','g')
const reNUVA = new RegExp("(^VAC\\d{4}|#NA|#MISS)")

const voidCSData = {'CSID': null, code2nuva:{}, nuva2code: {}, refcode2nuva: {}}

var extcodes
var codeLabels
var CSData

abstractDetails = {}

function compareBlur(a,b) {
	if (vaccines[a].type != 'abstract') {
		if (vaccines[b].type != 'abstract') {
			// Both are real - Sort by label
			return (vaccines[a].label < vaccines[b].label ? -1:1)
		}
		else {
			// Priority to the abstract one
			return 1 
		}
	}
	// a is abstract
	if (vaccines[b].type != 'abstract') return -1
	
	// both are abstract
	aBlur = abstractDetails[a].descendants.length + abstractDetails[a].instances.length
	bBlur = abstractDetails[b].descendants.length + abstractDetails[b].instances.length
	
	if (aBlur == bBlur) {
		return (vaccines[a].label < vaccines[b].label?-1:1)
	}
	return (aBlur - bBlur)		
}

function structureAbstract() {
	rebuildAll()	
	for (vkey in abstractVaccines) {
		idvac = abstractVaccines[vkey]
		abstractDetails[idvac] = {instances: [...extvaccines[idvac].instances], descendants: [], ascendants:[] }
	}

	for (vkey1 in abstractVaccines) {
		idvac1= abstractVaccines[vkey1]
		valences1 = vaccines[idvac1].valences
		details1 = abstractDetails[idvac1]
		
		loopvac:for (vkey2 in abstractVaccines) {
			if (vkey2 == vkey1) continue		
			idvac2 = abstractVaccines[vkey2]
			valences2 = vaccines[idvac2].valences
			details2 = abstractDetails[idvac2]			
		
				
			// Vaccine 2 is a descendant of vaccine 1 if:
			// - all valences of vaccine1 have a descendant in vaccine 2
			// - no valence of vaccine2 has no ascendant in vaccine 1			
			fail = false
			loop1: for (idval1 of valences1) {
				found = false
				for (idval2 of valences2) {
					if ((idval2 == idval1)||(extvalences[idval2].lineage.includes(idval1))) {
						continue loop1
					}
				}
				fail = true
				
			if (fail) continue loopvac
			}
			loop2: for (idval2 of valences2) {
				found = false
				for (idval1 of valences1) {
					if ((idval1 == idval2) ||(extvalences[idval2].lineage.includes(idval1))) {
						continue loop2
					}
				}
				fail = true								
			}
			if (!fail) {				
				if (!details2.ascendants.includes(idvac1)) {
					details2.ascendants.push(idvac1)
					details1.descendants.push(idvac2)
					details1.descendants.push(...extvaccines[idvac2].instances)
				}
			}			
		}	
	}
	// Sort the ascendants by increasing level of descendants
	for (idvac in abstractDetails) {
		abstractDetails[idvac].ascendants.sort(compareBlur)
		abstractDetails[idvac].descendants.sort(compareBlur)
	}
}

function parseCSV(text) {
	code2nuva = {}
	nuva2code = {}
	refcode2nuva = {}

	const rows = text.split("\n")
	for(i in rows) {
		reCSV.lastIndex = 0
		text = rows[i].trim()
		codeField =reCSV.exec(text)
		nuvaField = reCSV.exec(text)
		labelField = reCSV.exec(text)
		extCode=(codeField?codeField[1]:null)
		nuvaCode=(nuvaField?nuvaField[1]:null)
		label=(labelField?labelField[1].replaceAll('"',''):"")
		
		if (!extCode)
			continue
		
		if (i == 0) {
			myCSID = extCode
			reCode = new RegExp(myCSID+"-.*")			
		}
		else
		{
			result = reCode.exec(extCode)
			if (result) {extCode = result[0] }else continue
			result = reNUVA.exec(nuvaCode)
			if (result) {nuvaCode = result[0]} 
			else {nuvaCode = '#MISS'}
			code2nuva[extCode] = {'nuvaCode': nuvaCode, 'label': label }
			refcode2nuva[extCode] = nuvaCode		
			// There may be several external codes for a same NUVA code
			if (!nuvaCode.startsWith('#')) {
				if (!(nuvaCode in nuva2code)) {
					nuva2code[nuvaCode] = [extCode]
				} else {
					nuva2code[nuvaCode].push(extCode)
				}
			}
		}
	}	
	return {"CSID": myCSID, "code2nuva": code2nuva, "nuva2code": nuva2code, "refcode2nuva": refcode2nuva}
}

function showCodes() {
	table = document.getElementById("tcodes")
	table.innerHTML = ""
	
	codes = Object.keys(CSData.code2nuva).sort()
	filterText = document.getElementById('filterText').value.toUpperCase()	

		
	loopvac:for (code of codes) {
		row = table.insertRow(-1)
		row.id = code
		codeLabel = CSData.code2nuva[code].label
		if (code == context.currentCode) {row.style.backgroundColor='#95ADC5'}
		nuvaCode = CSData.code2nuva[code].nuvaCode
		if (nuvaCode != CSData.refcode2nuva[code]) {
			changed = true
			row.style.fontWeight = 'bold'
			} else changed = false
			
		if (nuvaCode in vaccines) {nuvaLabel = vaccines[nuvaCode].label} else {nuvaLabel = ""}
		codeCell = row.insertCell(-1)
		codeCell.innerHTML = code
		row.insertCell(-1).innerHTML = codeLabel
		row.insertCell(-1).innerHTML = nuvaCode
		row.insertCell(-1).innerHTML = nuvaLabel
		row.onclick = editCode
		foundText = (filterText == '')		
		if ((code.includes(filterText))|| (codeLabel.toUpperCase().includes(filterText)) ||
		   (nuvaCode.includes(filterText)) || (nuvaLabel.toUpperCase().includes(filterText))) foundText = true
	   if (context.changedOnly == false) changed = true	   
		row.style.display = (foundText && changed ?'table-row':'none')
	}
	document.getElementById('edit').style.display = (context.currentCode?'block':'none')
	document.getElementById('rev_button').disabled = !CSData.CSID
	
}

function viewEditCode(code)
{
	context.currentCode = code
	saveToSession("context",context)
	showSidebar()
	showCodes()
	row = document.getElementById(code)
	row.style.backgroundColor='#95ADC5'
	focus(row)
	
	document.getElementById('ecode').innerHTML = code
	document.getElementById('action').innerHTML = ''
	document.getElementById('actionSelect').value='pending'
}

function editCode ()
{
	viewEditCode(this.id)
}

function importCSV(input)
{
	CSData = parseCSV(input)
	saveToSession("CSData",CSData)
	setContext("currentCode",null)
	refresh()
	document.getElementById("transcription").disabled = true
}

function clearCodeSystem()
{
	CSData = voidCSData
	saveToSession("CSData",CSData)
	setContext('currentCode',null)
	document.getElementById('ecode').innerHTML=""
	document.getElementById('action').innerHTML=""
	refresh()
}

function editVaccine()
{
	// Void placeholder for vaccineTag
}

function setNuvaCode()
{
	var actionMessage = ""
	var action = document.getElementById('actionSelect').value
	var code = context.currentCode
	var prevNuva = CSData.code2nuva[code].nuvaCode
	var nuvaCode = prevNuva
	
	if (prevNuva in CSData.nuva2code) {
		CSData.nuva2code[prevNuva] = CSData.nuva2code[prevNuva].filter(item => item != code)
	}
		
	if ((action == 'set') && context.currentVaccine) {
		nuvaCode = context.currentVaccine
		nuvaLabel = vaccines[nuvaCode].label
		actionMessage = `assigned to NUVA ${nuvaCode}`
	}
	else if (action == 'NA') {
		nuvaCode = '#NA'
		nuvaLabel = ''
		actionMessage = "is not a NUVA concept"
	}
		
	else if (action == 'MISSING') {
		nuvaCode = '#MISS'
		nuvaLabel = ''
		actionMessage = "misses a NUVA concept"
	}
	else if (action == 'reset') {
		nuvaCode = CSData.refcode2nuva[code]
		actionMessage = `reset to NUVA ${nuvaCode}`
		
	}
	else if (action == 'close') {
		nuvaCode = prevNuva
		setContext('currentCode',null)
		actionMessage = ``
	}	
	
	CSData.code2nuva[code].nuvaCode = nuvaCode
	if (nuvaCode in CSData.nuva2code) {
		CSData.nuva2code[nuvaCode].push(code)
	} else {
		CSData.nuva2code[nuvaCode] = [code]
	}
	document.getElementById('action').innerHTML = actionMessage
	saveToSession("CSData",CSData)
	showCodes()
}


function saveCodeSystem() {
	CSFileContent = '\ufeff'  // BOM marker for UTF-8
	CSFileContent += `${CSData.CSID},NUVA,${CSData.CSID} label, NUVA label\n`
	for (code in CSData.code2nuva) {
		nuvaCode = CSData.code2nuva[code].nuvaCode
		codeLabel = '"'+CSData.code2nuva[code].label+'"'
		if (nuvaCode in vaccines) {
			nuvaLabel = '"'+vaccines[nuvaCode].label+'"'
		} else {
			nuvaLabel = ""
		}
		CSFileContent += `${code},${nuvaCode},${codeLabel},${nuvaLabel}\n`
	}
	download(`${CSData.CSID}2nuva-${today()}.csv`, CSFileContent)
}

function reverseRows(idvac, idabstract, bestBlur) {
	res = []
	blur = abstractDetails[idabstract].descendants.length+ 
			abstractDetails[idabstract].instances.length + 1
	if (idabstract in CSData.nuva2code) {
		if (!bestBlur) {
			bestBlur = blur
		}
		for (extcode of nuva2code[idabstract]) {
			res.push([
				idvac,                      	  // NUVA code
				'"'+vaccines[idvac].label+'"',    // NUVA label
				vaccines[idvac].type,             // Type
				extcode,                          // External code
				'"'+code2nuva[extcode].label+'"', // External code label
				(blur == bestBlur),               // Best code
				blur,                             // Blur
				nuva2code[idabstract].length])    // Equivalents
		}
	}
	return res
}

function reverseCodeSystem()
{
	CSID = CSData.CSID
	nuva2code = CSData.nuva2code
	code2nuva = CSData.code2nuva
		
	reverse = []
	mapped = 0
	for (idvac in vaccines)
	{
		bestBlur = 0
		idabstract = (vaccines[idvac].abstract?idvac:vaccines[idvac].instanceOf)
		if (!idabstract) continue             // Should not happen, missing an abstract vaccine
				
		if (idvac in nuva2code){
			for (extcode of nuva2code[idvac]) {
				reverse.push([
				idvac,                            // NUVA code
				'"'+vaccines[idvac].label+'"',    // NUVA label
				vaccines[idvac].type,             // Type
				extcode,                 		  // External code
				'"'+code2nuva[extcode].label+'"', // External code label
				true,                             // Best code
				1,                                // Blur
				nuva2code[idvac].length])          // Number of equivalents in code system				
			}
			bestBlur = 1
		} else {
			res = reverseRows(idvac,idabstract,0)
			reverse.push(...res)
			if (res.length != 0) bestBlur = res[0][6]
		}
		
		for (parent_vac of abstractDetails[idabstract].ascendants)
		{
			res = reverseRows(idvac,parent_vac,bestBlur)
			reverse.push(...res)
			if ((bestBlur==0) &&(res.length != 0)) bestBlur = res[0][6]							
		}
		
		if (bestBlur == 0) {
			// No ext code found in parents					
			reverse.push([
			idvac,'"'+vaccines[idvac].label+'"',vaccines[idvac].type,
			"","","","",""])
		}
		else {
			mapped++
		}	
	}
	doLog(`The ${CSID} code system contains ${Object.keys(code2nuva).length} codes`)
	doLog(`It may represent ${mapped} NUVA concepts out of ${Object.keys(vaccines).length}.`)
	
	reverseFileContent = '\ufeff'  // BOM marker for UTF-8
	reverseFileContent += `NUVA,NUVA label, Type,${CSID}, ${CSID} label, Best, Blur, Equiv\n`
	for (row of reverse) {
		reverseFileContent += row.join(",")+"\n"
	}
	download(`nuva2${CSID}_${today()}.csv`, reverseFileContent)
	document.getElementById("transcription").disabled = false
}
function abstractMap()
{
	sorted = Object.fromEntries(Object.entries(abstractDetails).sort(([a,],[b,]) => compareBlur(a,b)))
	download(`abstractMap_${today()}.json`, JSON.stringify(sorted,null,2))
}

function mapCSV2(text)
{
	CSID = CSData.CSID
	parsed = parseCSV(text)
	CSID2 = parsed.CSID
	//ext2codes = Object.keys(parsed.code2nuva)
	
	reverseFileContent = '\ufeff'  // BOM marker for UTF-8
	reverseFileContent += `${CSID2},${CSID2}label, NUVA, NUVA label, Type, ${CSID}, ${CSID} label, Best, Blur, Equiv\n`	
	for (row of reverse) {
		if (!(row[0] in parsed.nuva2code)) continue
		for (ext2code of nuva2code[row[0]]) {
			label2 = '"'+code2nuva[ext2code].label+'"'
			reverseFileContent += 
			`${ext2code},${label2},${row[0]},${row[1]},${row[2]},${row[3]},${row[4]},${row[5]},${row[6]},${row[7]}\n`
		}
	}
	download(`${CSID2}2${CSID}_${today()}.csv`, reverseFileContent)
}

function showSidebar() {
	showCurrentVaccine()
	showCurrentCode()
}

function refresh() {

	structureAbstract()
	showSidebar()
	showCodes()
	if (context.currentCode) {viewEditCode(context.currentCode)}	
}