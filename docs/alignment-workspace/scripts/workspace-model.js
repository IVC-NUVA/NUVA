/* Alignment Workspace data model
   Conceptual data model per NUVA-Alignment-Workspace-Requirements.md section 7,
   scoped to the Phase 1 subset described in the implementation plan:
   unreviewed / in_progress / aligned statuses, no provisional NUVA requests yet.

   NUVA vaccines/valences (globals from common.js) are read here, never written.
*/

var wsWorkspace = null

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
		notes: ''
	}
}

// Adds source rows produced by wsMapRows(). Existing codes are never overwritten.
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
		workspace.records[row.code] = {
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
			nuvaVersionUsed: null,
			created: today(),
			modified: today()
		}
		added++
	}
	workspace.modified = today()
	return { added: added, duplicates: duplicates, missing: missing }
}

function wsProgress(workspace) {
	totals = { total: 0 }
	for (code in workspace.records) {
		status = workspace.records[code].status
		totals[status] = (totals[status] || 0) + 1
		totals.total++
	}
	return totals
}
