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

function reverseRows(idvac, rev_key, bestBlur) {
	res = []
	idrev = families[rev_key].abstractVaccine
	blur = families[rev_key].descendants
	if (idrev in extcodes) {
		if (!bestBlur) {
			bestBlur = blur
		}
		for (extcode of extcodes[idrev]) {
			res.push([
				idvac,                      	  // NUVA code
				'"'+vaccines[idvac].label+'"',    // NUVA label
				vaccines[idvac].abstract,         // Abstract
				extcode,                          // External code
				codeLabels[extcode],              // External code label
				(blur == bestBlur),               // Best code
				blur,                             // Blur
				extcodes[idrev].length])          // Equivalents
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
	
	computeFamilies()
	
	reverse = []
	mapped = 0
	for (idvac in vaccines)
	{
		bestBlur = 0
		valences_key = getValencesKey(idvac)
		
		if (idvac in extcodes){
			for (extcode of extcodes[idvac]) {
				reverse.push([
				idvac,                            // NUVA code
				'"'+vaccines[idvac].label+'"',    // NUVA label
				vaccines[idvac].abstract,         // Abstract
				extcode,                   // External code
				codeLabels[extcode],    // External code NUVA label
				true,                             // Best code
				1,                                // Blur
				extcodes[idvac].length])          // Number of equivalents in code system				
			}
			bestBlur = 1
		} else {
			res = reverseRows(idvac,valences_key,0)
			reverse.push(...res)
			if (res.length != 0) bestBlur = res[0][6]
		}
		
		for (parent_key of families[valences_key].lineage)
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
