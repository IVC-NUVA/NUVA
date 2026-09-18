/* Reconciliation with an updated NUVA version (UC-11).
   Only flags records/requests for review - never silently changes a selected
   valence set or a confirmed NUVA mapping (design principle 3.4, UC-11).
   Reuses common.js's abstractVaccines/valencesKey, the same lookup the review
   screen's exact-match detection uses.
*/

function wsReconcileNuva(workspace) {
	flagged = []
	for (code in workspace.records) {
		record = workspace.records[code]
		before = record.changeFlags.slice().sort()
		nextFlags = record.changeFlags.filter(function (f) {
			return f == 'source_changed' || f == 'source_missing'
		})
		for (idval of record.valences) {
			if (!(idval in valences)) {
				if (!nextFlags.includes('nuva_valence_missing')) nextFlags.push('nuva_valence_missing')
			} else if (valences[idval].status == 'deprecated') {
				if (!nextFlags.includes('nuva_valence_deprecated')) nextFlags.push('nuva_valence_deprecated')
			}
		}
		if (record.nuvaVaccine) {
			if (!(record.nuvaVaccine in vaccines)) {
				nextFlags.push('nuva_vaccine_missing')
			} else {
				if (vaccines[record.nuvaVaccine].status == 'deprecated') nextFlags.push('nuva_vaccine_deprecated')
				allValencesValid = record.valences.length > 0 && record.valences.every(function (idval) { return idval in valences })
				if (allValencesValid) {
					key = valencesKey({ valences: record.valences.slice() })
					currentMatch = abstractVaccines[key]
					if (currentMatch && currentMatch != record.nuvaVaccine) {
						nextFlags.push('nuva_vaccine_changed')
					}
				}
			}
		}
		record.changeFlags = nextFlags
		if (JSON.stringify(before) != JSON.stringify(nextFlags.slice().sort())) {
			record.modified = today()
			flagged.push(code)
		}
	}
	workspace.nuvaVersion = defaultData.version
	workspace.modified = today()
	return { flaggedRecords: flagged }
}

function wsFindValenceByLabel(label) {
	lower = label.toLowerCase()
	for (idval in valences) {
		if (idval == idRoot) continue
		if (valences[idval].label.toLowerCase() == lower) return idval
	}
	return null
}

// Suggestions only - resolving a request still requires the user to confirm
// (wsResolveValenceRequest/wsResolveVaccineRequest), never done automatically.
function wsSuggestValenceRequestResolution(request) {
	if (!request.proposedLabel) return null
	return wsFindValenceByLabel(request.proposedLabel)
}

function wsSuggestVaccineRequestResolution(request) {
	if (!request.valences || request.valences.length == 0) return null
	if (!request.valences.every(function (idval) { return idval in valences })) return null
	key = valencesKey({ valences: request.valences.slice() })
	idvac = abstractVaccines[key]
	if (idvac && vaccines[idvac].status != 'deprecated') return idvac
	return null
}

const wsChangeFlagLabels = {
	source_changed: 'Source data changed',
	source_missing: 'Missing from latest source file',
	nuva_valence_missing: 'Selected valence no longer exists',
	nuva_valence_deprecated: 'Selected valence is deprecated',
	nuva_vaccine_missing: 'Mapped NUVA vaccine no longer exists',
	nuva_vaccine_deprecated: 'Mapped NUVA vaccine is deprecated',
	nuva_vaccine_changed: 'A different NUVA vaccine now matches this valence combination'
}
