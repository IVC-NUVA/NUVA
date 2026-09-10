reCSV = new RegExp('(".*?"|[^",]+)(?=\s*,|\s*$)','g')
reNUVA = new RegExp("^VAC\\d{4}")

extcodes = {}
codeLabels = {}

function parseCSV(text) {
	myExtcodes = myCodeLabels = {}

	const rows = text.split("\r\n")
	for(i in rows) {
		reCSV.lastIndex = 0
		codeField =reCSV.exec(rows[i])
		nuvaField = reCSV.exec(rows[i])
		labelField = reCSV.exec(rows[i])
		extCode=(codeField?codeField[1]:null)
		nuvaCode=(nuvaField?nuvaField[1]:null)
		label=(labelField?labelField[1]:null)
		
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
			if (result) {nuvaCode = result[0]} else continue
			
			// There may be several external codes for a same NUVA code
			if (!(nuvaCode in myExtcodes)) {
				myExtcodes[nuvaCode] = [extCode]
			} else {
				myExtcodes[nuvaCode].push(extCode)
			}
			if (!(extCode in myCodeLabels))
			{
				if (!label) label = '"'+vaccines[nuvaCode].label+'"'
				myCodeLabels[extCode] = label
			}

		}
	}	
	return {"CSID": myCSID, "extcodes": myExtcodes, "codeLabels": myCodeLabels}
}

abstractDetails = {}

function structureAbstract() {
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

function reverseRows(idvac, vkey, bestBlur) {
	res = []
	idabstract = abstractVaccines[vkey]
	blur = abstractDetails[vkey].descendants	
	if (idabstract in extcodes) {
		if (!bestBlur) {
			bestBlur = blur
		}
		for (extcode of extcodes[idabstract]) {
			res.push([
				idvac,                      	  // NUVA code
				'"'+vaccines[idvac].label+'"',    // NUVA label
				vaccines[idvac].abstract,         // Abstract
				extcode,                          // External code
				codeLabels[extcode],              // External code label
				(blur == bestBlur),               // Best code
				blur,                             // Blur
				extcodes[idabstract].length])     // Equivalents
		}
	}
	return res
}

function analyseCSV(text)
{
	parsed = parseCSV(text)
	CSID = parsed.CSID
	extcodes = parsed.extcodes
	codeLabels = parsed.codeLabels
		
	reverse = []
	mapped = 0
	for (idvac in vaccines)
	{
		bestBlur = 0
		idabstract = (vaccines[idvac].abstract?idvac:vaccines[idvac].instanceOf)
		if (!idabstract) continue             // Should not happen, missing an abstract vaccine
		vkey = valencesKey(vaccines[idabstract])		
		
		if (idvac in extcodes){
			for (extcode of extcodes[idvac]) {
				reverse.push([
				idvac,                            // NUVA code
				'"'+vaccines[idvac].label+'"',    // NUVA label
				vaccines[idvac].abstract,         // Abstract
				extcode,                 		  // External code
				codeLabels[extcode],    			// External code NUVA label
				true,                             // Best code
				1,                                // Blur
				extcodes[idvac].length])          // Number of equivalents in code system				
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
	doLog(`The ${CSID} code system contains ${Object.keys(codeLabels).length} codes`)
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
	parsed = parseCSV(text)
	CSID2 = parsed.CSID	
	ext2codes = parsed.extcodes
	code2Labels = parsed.codeLabels
	
	reverseFileContent = '\ufeff'  // BOM marker for UTF-8
	reverseFileContent += `${CSID2},${CSID2}label, ${CSID}, ${CSID} label, Best, Blur, Equiv\n`	
	for (row of reverse) {
		if (!(row[0] in ext2codes)) continue
		for (ext2code of ext2codes[row[0]]) {
			label2 = code2Labels[ext2code]
			reverseFileContent += 
			`${ext2code},${label2},${row[3]},${row[4]},${row[5]},${row[6]},${row[7]}\n`
		}
	}
	download(`${CSID2}2${CSID}.csv`, reverseFileContent)
}
