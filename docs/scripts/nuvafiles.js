spacer = "  "
EOL = "\n"
loglines = []
var logTimer = null
/* Keep context in session storage*/
function loadFromSession(key,value) {
  json = sessionStorage.getItem(key)
  if (json == null) {
    json = JSON.stringify(value)
    sessionStorage.setItem(key,json)
  }
  return JSON.parse(json)
}

function saveToSession(key,value) {
    json = JSON.stringify(value)
    sessionStorage.setItem(key,json)
}

function restore(restVaccines, restValences) {
	vaccines = {}
	valences = {}
	Object.assign(vaccines,restVaccines)
	Object.assign(valences,restValences)	
	saveToSession('vaccines',vaccines)
	saveToSession('valences',valences)
	saveToSession('selected',[])
	saveToSession('filter',[])	
	rebuildValences()
}

function reset()
{
	restore(defaultVaccines, defaultValences)
	doLog("All vaccines and valences were reset to their default values.")	
}

function initContext() {
    vaccines = loadFromSession('vaccines',defaultVaccines)
    valences = loadFromSession('valences',defaultValences)
	rebuildValences()
    selected_valences = new Set(loadFromSession('selected',[]))
    filter = loadFromSession('filter',[])
	if (logTimer) {
		clearInterval(logTimer)
	}
}

// Create and activate a download link for a dynamic content
function download(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

// Log window
function refreshLog() {
	if (loglines.length == 0) return
	logView = document.getElementById("log")
	line = loglines.shift()
	logView.innerHTML += line+"<br/>"
	logView.scrollTop = logView.scrollHeight
}

function doLog(text) {
	loglines.push(text)	
}

function initLog() {
  logTimer = setInterval(refreshLog,10)
}

// Work files functions
function today() {
	return(new Date().toISOString().substring(0,10))
}

function saveBackup() {
	
	backup = {
		"vaccines": vaccines,
		"valences": valences
	}
	download("NUVA backup "+today()+".json",JSON.stringify(backup,null,2))

	doLog("Downloading backup file to default download folder.")
}

function selectFile() {
	doLog("Select backup file to restore")
	selector = document.getElementById("backup")
	selector.value =""
	selector.style.display = "inline"
}

function restoreBackup() {
	selector = document.getElementById("backup")
	selector.style.display = "none"
	
	file = document.getElementById("backup").files[0]
	if (!file) {
		showAlert("Please select a file")
	}
	
	reader = new FileReader()
	reader.onload = function () {
		backup = JSON.parse(reader.result)
		restore(backup.vaccines, backup.valences)
		doLog("Restored from backup")
	};
	reader.onerror = function () {
		showAlert("Cannot read the file")
	};
	reader.readAsText(file);	
}

// Units functions
function newList(key,depth) {
	return (spacer.repeat(depth)+key+":"+EOL)
}
function listItem(item, depth) {
	return (spacer.repeat(depth+1)+"-"+item+EOL)
}
function attribute (item, value,depth) {
	return (spacer.repeat(depth)+item+": "+value+EOL)
}

function Unitsdl() {
	CheckAll()
	modified = today()
	doLog("Checking for modified vaccines.")
	for (idvac in vaccines) {		
		if (vaccines[idvac]['changed']) {
			
			unit = attribute("abstract", false, 0)
			unit += attribute("label", vaccines[idvac].label,0)
			unit += attribute("created",vaccines[idvac].created,0)
			unit += attribute("comment",vaccines[idvac].comment,0)
			unit += attribute("modified", modified,0)
			unit += newList("valences",0)
			for (idval of vaccines[idvac]['valences']) {
				unit += listItem(idval,0)
			}
			doLog("Downloading unit file for "+vaccines[idvac].label)
			download(idvac+".yml",unit)		
		}
	}
	doLog("Checking for modified valences.")
	for (idval in valences) {
		if (valences[idval]['changed']) {			
			unit = attribute("label", valences[idval].label,0)
			unit += attribute("created", valences[idval].created,0)
			unit += attribute("modified", modified,0)
			unit += attribute("shorthand", valences[idval].shorthand,0)
			unit += attribute("parent", valences[idval].parent,0)
			unit += attribute("target", valences[idval].target,0)
			doLog("Downloading unit file for "+valences[idval].label)
			download(idval+".yml",unit)		
		}
	}
	doLog("Done.")
}

// Will be moved to a dedicated Checks file
function CheckAll() {
	doLog("Checks not implemented yet.")
}

