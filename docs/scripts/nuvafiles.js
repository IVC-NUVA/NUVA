const spacer = "  "
const EOL = "\n"
const idRoot = "Valence"
var loglines = []
var logTimer = null

/* Keep context in session storage*/
function loadFromSession(key, value) {
    json = sessionStorage.getItem(key)
	if (json == null) {
		json = JSON.stringify(value)
		sessionStorage.setItem(key, json)
	}
	return JSON.parse(json)
}

function saveToSession(key, value) {
    json = JSON.stringify(value)
	sessionStorage.setItem(key, json)
}

function restore(restVaccines, restValences) {
    vaccines = {}
    valences = {}
    Object.assign(vaccines, restVaccines)
    Object.assign(valences, restValences)
    saveToSession('vaccines', vaccines)
    saveToSession('valences', valences)
}

function reset() {
    restore(defaultData['vaccines'], defaultData['valences'])
    doLog("All vaccines and valences were reset to their default values.")
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
	logView.innerHTML += line + "<br/>"
	logView.scrollTop = logView.scrollHeight
}

function doLog(text) {
    loglines.push(text)
}

function initLog() {
    logTimer = setInterval(refreshLog, 10)
}

// Backup functions
function today() {
    return (new Date().toISOString().substring(0, 10))
}
function saveBackup() {
	date = today()
    backup = {
		"version": "Work "+date,
        "vaccines": vaccines,
        "valences": valences
    }
    download("nuvadata" + today() + ".json", JSON.stringify(backup, null, 2))

    doLog("Downloading backup file to default download folder.")
}

function selectFile() {
    doLog("Select backup file to restore")
    selector = document.getElementById("backup")
	selector.value = ""
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

// Alignment file functions
function selectCSV() {
	doLog("Select alignment file to analyze")
    selector = document.getElementById("alignment")
	selector.value = ""
	selector.style.display = "inline"
}
function uploadCSV() {
    selector = document.getElementById("alignment")
	selector.style.display = "none"

	file = document.getElementById("alignment").files[0]
	if (!file) {
		showAlert("Please select a file")
	}

	reader = new FileReader()
	reader.onload = function () {	
		doLog("Uploaded CSV file, now computing")
		analyseCSV(reader.result)
    };
    reader.onerror = function () {
		showAlert("Cannot read the file")
    };
    reader.readAsText(file);		
}

function selectCSV2() {
	doLog("Select alignment file to analyze")
    selector = document.getElementById("alignment2")
	selector.value = ""
	selector.style.display = "inline"
}
function uploadCSV2() {
    selector = document.getElementById("alignment2")
	selector.style.display = "none"

	file = document.getElementById("alignment2").files[0]
	if (!file) {
		showAlert("Please select a file")
	}

	reader = new FileReader()
	reader.onload = function () {	
		doLog("Uploaded CSV file, now computing")
		mapCSV2(reader.result)
    };
    reader.onerror = function () {
		showAlert("Cannot read the file")
    };
    reader.readAsText(file);		
}

// Units functions
function newList(key, depth) {
    return (spacer.repeat(depth) + key + ":" + EOL)
}
function listItem(item, depth) {
    return (spacer.repeat(1+depth) + "-" + item + EOL)
}
function attribute(item, value, depth) {
    return (spacer.repeat(depth) + item + " : \""+ value +"\"" + EOL)
}

function Unitsdl() {
    CheckAll()
	rebuildAll()
    modified = today()
	doLog("Checking for modified vaccines.")
	for (idvac in vaccines) {
		if (extvaccines[idvac]['changed']) {
			vaccine = vaccines[idvac]
			unit = attribute("abstract", vaccine.abstract, 0)
			unit += attribute("label", vaccine.label, 0)
			unit += attribute("status", vaccine.status, 0)			
			unit += attribute("created", vaccine.created, 0)
			unit += attribute("comment", vaccine.comment, 0)
			unit += attribute("modified", modified, 0)
			if (vaccine.abstract)
			{
				unit += newList("valences", 0)
				for (idval of vaccine['valences']) {
					unit += listItem(idval, 0)	
				}					
			}
			else
			{
				unit += attribute("instanceOf", vaccine.instanceOf, 0)			
			}
			doLog("Downloading unit file for " + vaccines[idvac].label)
			download(idvac + ".yml", unit)
		}
	}
	doLog("Checking for modified valences.")
	for (idval in valences) {
		if (extvalences[idval]['changed']) {
			unit = attribute("label", valences[idval].label, 0)
			unit += attribute("created", String(valences[idval].created), 0)
			unit += attribute("modified", String(modified), 0)
			unit += attribute("shorthand", valences[idval].shorthand, 0)
			unit += attribute("vtype", String(valences[idval].vtype), 0)
			unit += attribute("parent", valences[idval].parent, 0)
			doLog("Downloading unit file for " + valences[idval].label)
			download(idval + ".yml", unit)
		}
	}
	doLog("Done.")
}

// Will be moved to a dedicated Checks file
function CheckAll() {
    doLog("Checks not implemented yet.")
}
