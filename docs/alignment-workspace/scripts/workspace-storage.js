/* Alignment Workspace persistence
   IndexedDB is used instead of common.js's loadFromSession/saveToSession because
   a workspace holds structured, potentially large data (many source-code records)
   rather than the small keyed values the core editor persists (TR-6).
   NUVA vaccines/valences are never written here - only workspace data.
*/
const WS_DB_NAME = 'nuvaAlignmentWorkspace'
const WS_DB_VERSION = 1
const WS_STORE = 'workspace'
const WS_KEY = 'active'
const WS_SCHEMA_VERSION = 2
const WS_MIN_SCHEMA_VERSION = 1

// v1 -> v2 added provisional NUVA requests and per-record change tracking.
// Old bundles are upgraded in place with defaults rather than rejected (FR-39).
function wsMigrateBundle(data) {
	if (data.schemaVersion == WS_SCHEMA_VERSION) return data
	if (!data.valenceRequests) data.valenceRequests = {}
	if (!data.vaccineRequests) data.vaccineRequests = {}
	for (code in data.records) {
		record = data.records[code]
		if (record.questions === undefined) record.questions = ''
		if (record.changeFlags === undefined) record.changeFlags = []
		if (record.pendingSourceUpdate === undefined) record.pendingSourceUpdate = null
		if (record.requestedValenceIds === undefined) record.requestedValenceIds = []
		if (record.requestedVaccineId === undefined) record.requestedVaccineId = null
		if (record.decisionHistory === undefined) record.decisionHistory = []
	}
	data.schemaVersion = WS_SCHEMA_VERSION
	return data
}

function wsOpenDB() {
	return new Promise(function (resolve, reject) {
		request = indexedDB.open(WS_DB_NAME, WS_DB_VERSION)
		request.onupgradeneeded = function (event) {
			db = event.target.result
			if (!db.objectStoreNames.contains(WS_STORE)) {
				db.createObjectStore(WS_STORE)
			}
		}
		request.onsuccess = function (event) { resolve(event.target.result) }
		request.onerror = function (event) { reject(event.target.error) }
	})
}

function wsSaveWorkspace(workspace) {
	workspace.modified = today()
	saveToSession("wsExtCodes",workspace)
	return wsOpenDB().then(function (db) {
		return new Promise(function (resolve, reject) {
			tx = db.transaction(WS_STORE, 'readwrite')
			tx.objectStore(WS_STORE).put(workspace, WS_KEY)
			tx.oncomplete = function () { resolve(workspace) }
			tx.onerror = function () { reject(tx.error) }
		})
	})
}

function wsLoadWorkspace() {
	return wsOpenDB().then(function (db) {
		return new Promise(function (resolve, reject) {
			tx = db.transaction(WS_STORE, 'readonly')
			req = tx.objectStore(WS_STORE).get(WS_KEY)
			req.onsuccess = function () { resolve(req.result ? wsMigrateBundle(req.result) : null) }
			req.onerror = function () { reject(req.error) }
		})
	})
}

function wsClearWorkspace() {
	return wsOpenDB().then(function (db) {
		return new Promise(function (resolve, reject) {
			tx = db.transaction(WS_STORE, 'readwrite')
			tx.objectStore(WS_STORE).delete(WS_KEY)
			tx.oncomplete = function () { resolve() }
			tx.onerror = function () { reject(tx.error) }
		})
	})
}

// Portable work product (design principle 3.3) - reuses nuvafiles.js's download()
function wsExportWorkspace(workspace) {
	filename = `alignment-${workspace.codeSystem.id || 'workspace'}-${today()}.json`
	download(filename, JSON.stringify(workspace, null, 2))
}

function wsValidateBundle(data) {
	errors = []
	if (!data || typeof data != 'object') {
		errors.push('File is not a valid JSON object.')
		return errors
	}
	if (typeof data.schemaVersion != 'number' || data.schemaVersion < WS_MIN_SCHEMA_VERSION || data.schemaVersion > WS_SCHEMA_VERSION) {
		errors.push(`Unsupported schema version (got ${data.schemaVersion}, supported ${WS_MIN_SCHEMA_VERSION}-${WS_SCHEMA_VERSION}).`)
	}
	if (!data.codeSystem || !data.codeSystem.id) {
		errors.push('Missing code-system identifier.')
	}
	if (!data.records || typeof data.records != 'object') {
		errors.push('Missing records.')
	}
	return errors
}

function wsImportWorkspaceFile(file) {
	return new Promise(function (resolve, reject) {
		reader = new FileReader()
		reader.onload = function () {
			try {
				data = JSON.parse(reader.result)
			} catch (e) {
				reject(['File is not valid JSON.'])
				return
			}
			errors = wsValidateBundle(data)
			if (errors.length) {
				reject(errors)
			} else {
				resolve(wsMigrateBundle(data))
			}
		}
		reader.onerror = function () { reject(['Cannot read the file.']) }
		reader.readAsText(file)
	})
}
