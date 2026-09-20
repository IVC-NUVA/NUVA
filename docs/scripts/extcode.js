reCSV = new RegExp('(".*?"|[^",]+)(?=\s*,|\s*$)','g')
reNUVA = new RegExp("(^VAC\\d{4}|#NA|#MISS)")

const voidCSData = {'CSID': null, code2nuva:{}, nuva2code: {}, refcode2nuva: {}}

var extcodes
var codeLabels
var CSData

abstractDetails = {}

function structureAbstract() {
	rebuildAll()	
	for (vkey in abstractVaccines) {
		idvac = abstractVaccines[vkey]
		abstractDetails[vkey] = {descendants: 1+extvaccines[idvac].instances.length, ascendants:[] }
	}

	for (vkey1 in abstractVaccines) {
		idvac1= abstractVaccines[vkey1]
		valences1 = vaccines[idvac1].valences
		details1 = abstractDetails[vkey1]
		
		loopvac:for (vkey2 in abstractVaccines) {
			if (vkey2 == vkey1) continue		
			idvac2 = abstractVaccines[vkey2]
			valences2 = vaccines[idvac2].valences
			details2 = abstractDetails[vkey2]			
		
				
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
				if (!details2.ascendants.includes(vkey1)) {
					details2.ascendants.push(vkey1)
					details1.descendants += extvaccines[idvac2].instances.length+1
				}
			}			
		}	
	}
	// Sort the ascendants by increasing level of descendants
	for (vkey in abstractDetails) {
		abstractDetails[vkey].ascendants.sort(function(a,b) { return (abstractDetails[a].descendants > abstractDetails[b].descendants)})
	}
}

function parseCSV(text) {
	code2nuva = {}
	nuva2code = {}
	refcode2nuva = {}

	const rows = text.split("\r\n")
	for(i in rows) {
		reCSV.lastIndex = 0
		codeField =reCSV.exec(rows[i])
		nuvaField = reCSV.exec(rows[i])
		labelField = reCSV.exec(rows[i])
		extCode=(codeField?codeField[1]:null)
		nuvaCode=(nuvaField?nuvaField[1]:null)
		label=(labelField?labelField[1].replaceAll('"',''):null)
		
		if ((!extCode) || (!nuvaCode))
			continue
		
		if (i == 0) {
			myCSID = extCode
			reCode = new RegExp("^#?"+myCSID+"-.*")			
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

function codeChanged(idcode){
	return (CSData.code2nuva[idcode].nuvaCode != CSData.refcode2nuva[idcode])
}
function showCodes() {
	table = document.getElementById("tcodes")
	table.innerHTML = ""
	
	codes = Object.keys(CSData.code2nuva).sort()
	
	loopvac:for (code of codes) {	
		row = table.insertRow(-1)
		row.id = code
		if (code == context.currentCode) {row.style.backgroundColor='#95ADC5'}
		nuvaCode = CSData.code2nuva[code].nuvaCode
		if (nuvaCode != CSData.refcode2nuva[code]) {row.style.fontWeight = 'bold'}
		if (nuvaCode in vaccines) {label = vaccines[nuvaCode].label} else {label = ""}
		codeCell = row.insertCell(-1)
		codeCell.innerHTML = code
		row.insertCell(-1).innerHTML = CSData.code2nuva[code].label
		row.insertCell(-1).innerHTML = nuvaCode
		row.insertCell(-1).innerHTML = label
		row.onclick = editCode
	}
}

function viewEditCode(code)
{
	context.currentCode = code
	saveToSession("context",context)
	showSidebar()
	showCodes()
	row = document.getElementById(code)
	row.style.backgroundColor='#95ADC5'
	row.scrollIntoView({block:'center'})
	
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
	showCodes()
	document.getElementById("transcription").disabled = true	
}

function clearCodeSystem()
{
	CSData = voidCSData
	saveToSession("CSData",CSData)
	document.getElementById('ecode').innerHTML=""
	document.getElementById('action').innerHTML=""
	showCodes()
}

function editVaccine()
{
	// Void placeholder for vaccineTag
}

function setNuvaCode()
{
	actionMessage = ""
	action = document.getElementById('actionSelect').value
	code = document.getElementById('ecode').innerHTML
	if ((action == 'set') && context.currentVaccine) {
		nuvaCode = context.currentVaccine
		nuvaLabel = vaccines[nuvaCode].label
		actionMessage = `assigned to NUVA ${nuvaCode}`
	}
	else
	{
		prevCode = CSData.code2nuva[code].nuvaCode
		if (prevCode in CSData.nuva2code) {
			CSData.nuva2code[prevCode] = CSData.nuva2code[prevCode].filter(item => item != code)
		}
		if (action == 'NA') {
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
	}
	CSData.code2nuva[code].nuvaCode = nuvaCode
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
	download(`${CSData.CSID}2nuva.csv`, CSFileContent)
}

function reverseRows(idvac, vkey, bestBlur) {
	res = []
	idabstract = abstractVaccines[vkey]
	blur = abstractDetails[vkey].descendants	
	if (idabstract in CSData.nuva2code) {
		if (!bestBlur) {
			bestBlur = blur
		}
		for (extcode of nuva2code[idabstract]) {
			res.push([
				idvac,                      	  // NUVA code
				'"'+vaccines[idvac].label+'"',    // NUVA label
				vaccines[idvac].abstract,         // Abstract
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
	console.log("Start reverse")
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
		vkey = valencesKey(vaccines[idabstract])		
		
		if (idvac in nuva2code){
			for (extcode of nuva2code[idvac]) {
				reverse.push([
				idvac,                            // NUVA code
				'"'+vaccines[idvac].label+'"',    // NUVA label
				vaccines[idvac].abstract,         // Abstract
				extcode,                 		  // External code
				'"'+code2nuva[extcode].label+'"', // External code label
				true,                             // Best code
				1,                                // Blur
				nuva2code[idvac].length])          // Number of equivalents in code system				
			}
			bestBlur = 1
		} else {
			res = reverseRows(idvac,vkey,0)
			reverse.push(...res)
			if (res.length != 0) bestBlur = res[0][6]
		}
		
		for (parent_key of abstractDetails[vkey].ascendants)
		{
			res = reverseRows(idvac,parent_key,bestBlur)
			reverse.push(...res)
			if ((bestBlur==0) &&(res.length != 0)) bestBlur = res[0][6]							
		}
		
		if (bestBlur == 0) {
			// No ext code found in parents					
			reverse.push([
			idvac,'"'+vaccines[idvac].label+'"',vaccines[idvac].abstract,
			"","","","",""])
		}
		else {
			mapped++
		}	
	}
	doLog(`The ${CSID} code system contains ${Object.keys(code2nuva).length} codes`)
	doLog(`It may represent ${mapped} NUVA concepts out of ${Object.keys(vaccines).length}.`)
	
	reverseFileContent = '\ufeff'  // BOM marker for UTF-8
	reverseFileContent += `NUVA,NUVA label, IsAbstract,${CSID}, ${CSID} label, Best, Blur, Equiv\n`
	for (row of reverse) {
		reverseFileContent += row.join(",")+"\n"
	}
	download(`nuva2${CSID}.csv`, reverseFileContent)
	document.getElementById("transcription").disabled = false
}
function mapCSV2(text)
{
	CSID = CSData.CSID
	parsed = parseCSV(text)
	CSID2 = parsed.CSID
	//ext2codes = Object.keys(parsed.code2nuva)
	
	reverseFileContent = '\ufeff'  // BOM marker for UTF-8
	reverseFileContent += `${CSID2},${CSID2}label, ${CSID}, ${CSID} label, Best, Blur, Equiv\n`	
	for (row of reverse) {
		if (!(row[0] in parsed.nuva2code)) continue
		for (ext2code of nuva2code[row[0]]) {
			label2 = '"'+code2nuva[ext2code].label+'"'
			reverseFileContent += 
			`${ext2code},${label2},${row[3]},${row[4]},${row[5]},${row[6]},${row[7]}\n`
		}
	}
	download(`${CSID2}2${CSID}.csv`, reverseFileContent)
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