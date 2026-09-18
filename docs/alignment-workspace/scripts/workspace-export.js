/* Alignment Workspace outputs (UC-12, UC-13). Reuses nuvafiles.js's download(). */

// Direct-map CSV compatible with the existing Code Systems tool (extcode.js),
// per the format documented on extcodes.html: "CSID,NUVA,label".
function wsExportDirectMap(workspace, includeStatuses) {
	includeStatuses = includeStatuses || ['aligned']
	rows = []
	for (code in workspace.records) {
		record = workspace.records[code]
		if (!includeStatuses.includes(record.status) || !record.nuvaVaccine) continue
		rows.push(`${record.code},${record.nuvaVaccine},"${record.label.replace(/"/g, '""')}"`)
	}
	csid = workspace.codeSystem.id || 'CODES'
	content = '﻿' + `${csid},NUVA,label\n` + rows.join('\n') + (rows.length ? '\n' : '')
	download(`${csid}2nuva.csv`, content)
	return rows.length
}

function wsBuildReport(workspace) {
	lines = []
	lines.push(`Alignment Workspace Report - ${workspace.codeSystem.name} (${workspace.codeSystem.id})`)
	lines.push(`Generated ${today()} - NUVA version reviewed against: ${workspace.nuvaVersion}`)
	lines.push('')

	totals = wsProgress(workspace)
	lines.push('Progress totals:')
	for (status of wsStatuses) lines.push(`  ${status}: ${totals[status]}`)
	lines.push(`  total: ${totals.total}`)
	lines.push('')

	lines.push('Unresolved or needs-attention records:')
	for (code in workspace.records) {
		record = workspace.records[code]
		if (record.status == 'aligned' || record.status == 'out_of_scope') continue
		lines.push(`  ${record.code} (${record.status}) - ${record.label}`)
		if (record.questions) lines.push(`    Questions: ${record.questions}`)
	}
	lines.push('')

	lines.push('Low-confidence mappings:')
	for (code in workspace.records) {
		record = workspace.records[code]
		if (record.status == 'aligned' && record.confidence == 'low') {
			lines.push(`  ${record.code} -> ${record.nuvaVaccine} - ${record.label}`)
			if (record.reviewNotes) lines.push(`    Notes: ${record.reviewNotes}`)
		}
	}
	lines.push('')

	lines.push('Records affected by source or NUVA changes:')
	for (code in workspace.records) {
		record = workspace.records[code]
		if (record.changeFlags.length == 0) continue
		flagText = record.changeFlags.map(function (f) { return wsChangeFlagLabels[f] || f }).join('; ')
		lines.push(`  ${record.code} - ${record.label}: ${flagText}`)
	}
	lines.push('')

	lines.push('Requested new valences:')
	for (id in workspace.valenceRequests) {
		req = workspace.valenceRequests[id]
		lines.push(`  ${id} (${req.status}) - "${req.proposedLabel}" - affects: ${req.affectedCodes.join(', ')}`)
		if (req.rationale) lines.push(`    Rationale: ${req.rationale}`)
	}
	lines.push('')

	lines.push('Requested new NUVA vaccine combinations:')
	for (id in workspace.vaccineRequests) {
		req = workspace.vaccineRequests[id]
		valLabel = req.valences.map(function (idval) { return (valences[idval] ? valences[idval].shorthand : idval) }).join('-')
		lines.push(`  ${id} (${req.status}) - [${valLabel}] "${req.proposedLabel}" - affects: ${req.affectedCodes.join(', ')}`)
		if (req.rationale) lines.push(`    Rationale: ${req.rationale}`)
	}

	return lines.join('\n')
}

function wsExportReport(workspace) {
	filename = `alignment-${workspace.codeSystem.id || 'workspace'}-report-${today()}.txt`
	download(filename, wsBuildReport(workspace))
}
