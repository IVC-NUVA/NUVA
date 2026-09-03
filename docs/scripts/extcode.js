extcodes = {}
codeLabels = {}

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
				prefix+extcode,                   // External code
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
	doLog("Extracting")
	reCSV = new RegExp('(".*?"|[^",\s]+)(?=\s*,|\s*$)','g')
	const rows = text.split("\r\n")
	for(i in rows) {
		reCSV.lastIndex = 0
		codeField =reCSV.exec(rows[i])
		nuvaField = reCSV.exec(rows[i])
		labelField = reCSV.exec(rows[i])
		extCode=(codeField?codeField[1]:null)
		nuvaCode=(nuvaField?nuvaField[1]:null)
		label=(labelField?labelField[1]:null)
		
		if (i == 0) {
			CSID = extCode
			prefix = CSID+"-"
			reCode = new RegExp("^"+prefix+"(.*)")			
		}
		else
		{	
			result = reCode.exec(extCode)
			if (result) {
				extCode = result[1]
				// There may be several external codes for a same NUVA code
				if (!(nuvaCode in extcodes)) {
					extcodes[nuvaCode] = [extCode]
				} else {
					extcodes[nuvaCode].push(extCode)
				}
				if (!(extCode in codeLabels))
				{
					if (!label) label = '"'+vaccines[nuvaCode].label+'"'
					codeLabels[extCode] = label
				}
			}
		}
	}
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
				prefix+extcode,                   // External code
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
	doLog(`The ${CSID} code systems contains ${Object.keys(codeLabels).length} codes`)
	doLog(`It may represent ${mapped} NUVA concepts out of ${Object.keys(vaccines).length}.`)
	
	reverseFileContent = '\ufeff'  // BOM marker for UTF-8
	reverseFileContent += `NUVA,NUVA label, IsAbstract,${CSID}, ${CSID} label, Best, Blur, Equiv\n`
	for (row of reverse) {
		reverseFileContent += row.join(",")+"\n"
	}
	download(`nuva2${CSID}.csv`, reverseFileContent)	
}
