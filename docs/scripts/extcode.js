extcodes = {}

function analyseCSV(text)
{
	doLog("Extracting")
	const rows = text.split("\r\n")
	for(i in rows) {
		values = rows[i].split(",")
		if (i == 0) {
			CSID = values[0]
			reCode = new RegExp("^"+CSID+"-"+"(.*)")			
		}
		else
		{		
			result = reCode.exec(values[0])
			if (result) {
				extcode = result[1]				
				extcodes[extcode] = values[1]
				doLog(extcode+":"+values[1])		
			}
		}
	}
	
	
}
