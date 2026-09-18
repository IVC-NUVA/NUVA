/* Alignment Workspace data model
   Conceptual data model per NUVA-Alignment-Workspace-Requirements.md section 7.

   NUVA vaccines/valences (globals from common.js) are read here, never written.
*/

var wsWorkspace = null

const wsStatuses = ['unreviewed', 'imported', 'in_progress', 'needs_information',
	'awaiting_new_valence', 'awaiting_new_vaccine', 'needs_review', 'aligned', 'out_of_scope']

function wsNewWorkspace(codeSystem) {
	date = today()
	return {
		schemaVersion: WS_SCHEMA_VERSION,
		workspaceId: 'ws-' + Date.now(),
		codeSystem: {
			id: codeSystem.id,
			name: codeSystem.name,
			version: codeSystem.version || '',
			owner: codeSystem.owner || '',
			jurisdiction: codeSystem.jurisdiction || '',
			sourceUrl: codeSystem.sourceUrl || '',
			notes: codeSystem.notes || ''
		},
		nuvaVersion: (typeof defaultData != 'undefined' && defaultData) ? defaultData.version : null,
		created: date,
		modified: date,
		records: {},
		valenceRequests: {},
		vaccineRequests: {},
		notes: ''
	}
}

function wsNewRecord(row) {
	return {
		code: row.code,
		label: row.label,
		description: row.description || '',
		sourceNotes: row.notes || '',
		extraFields: row.extra || {},
		status: 'unreviewed',
		valences: [],
		nuvaVaccine: null,
		confidence: null,
		reviewNotes: '',
		questions: '',
		nuvaVersionUsed: null,
		changeFlags: [],
		pendingSourceUpdate: null,
		requestedValenceIds: [],
		requestedVaccineId: null,
		decisionHistory: [],
		created: today(),
		modified: today()
	}
}

// Adds source rows produced by wsMapRows(). Existing codes are never overwritten
// here - re-importing an already-loaded code system goes through
// wsReconcileSourceRows() instead (UC-10), which flags rather than skips changes.
function wsAddRecords(workspace, rows) {
	added = 0
	duplicates = []
	missing = []
	for (row of rows) {
		if (!row.code || !row.label) {
			missing.push(row)
			continue
		}
		if (workspace.records[row.code]) {
			duplicates.push(row.code)
			continue
		}
		workspace.records[row.code] = wsNewRecord(row)
		added++
	}
	workspace.modified = today()
	return { added: added, duplicates: duplicates, missing: missing }
}

function wsProgress(workspace) {
	totals = { total: 0 }
	for (status of wsStatuses) totals[status] = 0
	for (code in workspace.records) {
		status = workspace.records[code].status
		totals[status] = (totals[status] || 0) + 1
		totals.total++
	}
	return totals
}

// Records a decision-history entry (section 7.6) before overwriting a prior
// completed decision, so revising a mapping never silently loses the earlier one.
function wsPushHistory(record, note) {
	record.decisionHistory.push({
		valences: record.valences.slice(),
		nuvaVaccine: record.nuvaVaccine,
		status: record.status,
		modified: record.modified,
		note: note || ''
	})
}

function wsSetRecordStatus(workspace, code, status, extra) {
	record = workspace.records[code]
	Object.assign(record, extra || {})
	record.status = status
	record.modified = today()
	workspace.modified = today()
	return record
}

// Explicitly applies a staged source-file change (UC-10) - never automatic (FR-31).
function wsApplySourceUpdate(workspace, code) {
	record = workspace.records[code]
	if (!record.pendingSourceUpdate) return record
	Object.assign(record, record.pendingSourceUpdate)
	record.pendingSourceUpdate = null
	index = record.changeFlags.indexOf('source_changed')
	if (index != -1) record.changeFlags.splice(index, 1)
	record.modified = today()
	workspace.modified = today()
	return record
}

/* Provisional NUVA requests (UC-6, UC-7, sections 7.4/7.5) */

function wsNextRequestId(workspace, prefix, dict) {
	n = 1
	while ((prefix + n) in dict) n++
	workspace.modified = today()
	return prefix + n
}

function wsCreateValenceRequest(workspace, data) {
	id = wsNextRequestId(workspace, 'VALREQ-', workspace.valenceRequests)
	request = {
		id: id,
		proposedLabel: data.proposedLabel || '',
		description: data.description || '',
		proposedParent: data.proposedParent || null,
		rationale: data.rationale || '',
		affectedCodes: data.affectedCodes ? data.affectedCodes.slice() : [],
		status: 'draft',
		officialValenceId: null,
		notes: data.notes || '',
		created: today(),
		modified: today()
	}
	workspace.valenceRequests[id] = request
	return request
}

function wsCreateVaccineRequest(workspace, data) {
	id = wsNextRequestId(workspace, 'VACREQ-', workspace.vaccineRequests)
	request = {
		id: id,
		valences: data.valences ? data.valences.slice() : [],
		proposedLabel: data.proposedLabel || '',
		rationale: data.rationale || '',
		affectedCodes: data.affectedCodes ? data.affectedCodes.slice() : [],
		status: 'draft',
		officialVaccineId: null,
		notes: data.notes || '',
		created: today(),
		modified: today()
	}
	workspace.vaccineRequests[id] = request
	return request
}

function wsAddAffectedCode(request, code) {
	if (!request.affectedCodes.includes(code)) request.affectedCodes.push(code)
}

function wsResolveValenceRequest(workspace, id, officialValenceId) {
	request = workspace.valenceRequests[id]
	request.officialValenceId = officialValenceId
	request.status = 'resolved'
	request.modified = today()
	workspace.modified = today()
	return request
}

function wsResolveVaccineRequest(workspace, id, officialVaccineId) {
	request = workspace.vaccineRequests[id]
	request.officialVaccineId = officialVaccineId
	request.status = 'resolved'
	request.modified = today()
	workspace.modified = today()
	return request
}
