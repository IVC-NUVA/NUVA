/* Alignment Workspace CSV import
   General-purpose CSV parsing with column mapping (UC-2), separate from
   extcode.js's parseCSV which is specialized for the fixed direct-map format.
   Uses the same quote-aware field regex convention as extcode.js.
*/
const wsFieldRe = /(".*?"|[^",]+)(?=\s*,|\s*$)/g

function wsSplitCSVLine(line) {
	fields = []
	wsFieldRe.lastIndex = 0
	while ((match = wsFieldRe.exec(line)) !== null) {
		value = match[1]
		if (value.startsWith('"') && value.endsWith('"')) {
			value = value.substring(1, value.length - 1)
		}
		fields.push(value)
		if (wsFieldRe.lastIndex >= line.length) break
	}
	return fields
}

function wsParseCSV(text) {
	lines = text.split(/\r\n|\n/).filter(function (l) { return l.length > 0 })
	if (lines.length == 0) return { headers: [], rows: [] }
	headers = wsSplitCSVLine(lines[0])
	rows = []
	for (i = 1; i < lines.length; i++) {
		fields = wsSplitCSVLine(lines[i])
		row = {}
		for (j = 0; j < headers.length; j++) {
			row[headers[j]] = (fields[j] !== undefined ? fields[j] : '')
		}
		rows.push(row)
	}
	return { headers: headers, rows: rows }
}

// mapping: {code, label, description, notes} -> source column header names
function wsMapRows(parsed, mapping) {
	mappedHeaders = new Set(Object.values(mapping).filter(Boolean))
	result = []
	for (row of parsed.rows) {
		extra = {}
		for (h of parsed.headers) {
			if (!mappedHeaders.has(h)) extra[h] = row[h]
		}
		result.push({
			code: (mapping.code ? row[mapping.code] : '').trim(),
			label: (mapping.label ? row[mapping.label] : '').trim(),
			description: mapping.description ? row[mapping.description] : '',
			notes: mapping.notes ? row[mapping.notes] : '',
			extra: extra
		})
	}
	return result
}

/* Reconciliation with an updated source file (UC-10). Unlike wsAddRecords, an
   existing code is never skipped or overwritten - a changed row is staged on
   pendingSourceUpdate and flagged so the user applies it explicitly (FR-31),
   and a code missing from the new file is flagged rather than deleted. */
function wsReconcileSourceRows(workspace, rows) {
	added = []
	changed = []
	missingFromSource = []
	unchanged = []
	seen = new Set()
	for (row of rows) {
		if (!row.code || !row.label) continue
		seen.add(row.code)
		record = workspace.records[row.code]
		if (!record) {
			workspace.records[row.code] = wsNewRecord(row)
			added.push(row.code)
			continue
		}
		isChanged = (record.label != row.label) ||
			(record.description != (row.description || '')) ||
			(record.sourceNotes != (row.notes || '')) ||
			(JSON.stringify(record.extraFields) != JSON.stringify(row.extra || {}))
		if (isChanged) {
			record.pendingSourceUpdate = {
				label: row.label,
				description: row.description || '',
				sourceNotes: row.notes || '',
				extraFields: row.extra || {}
			}
			if (!record.changeFlags.includes('source_changed')) record.changeFlags.push('source_changed')
			record.modified = today()
			changed.push(row.code)
		} else {
			unchanged.push(row.code)
		}
	}
	for (code in workspace.records) {
		record = workspace.records[code]
		index = record.changeFlags.indexOf('source_missing')
		if (!seen.has(code)) {
			if (index == -1) {
				record.changeFlags.push('source_missing')
				record.modified = today()
			}
			missingFromSource.push(code)
		} else if (index != -1) {
			record.changeFlags.splice(index, 1)
			record.modified = today()
		}
	}
	workspace.modified = today()
	return { added: added, changed: changed, missingFromSource: missingFromSource, unchanged: unchanged }
}

/* Baseline import from an existing direct map, e.g. Alignments/CVX2nuva.csv (UC-3).
   Format per extcodes.html: header row is CSID,NUVA,label[,,]; each data row is
   EXTCODE,VACnnnn,"label"[,,]. Parsed positionally, matching extcode.js's own
   handling, since the exact header text of columns 2/3 is not standardized. */
function wsParseDirectMap(text) {
	parsed = wsParseCSV(text)
	if (parsed.headers.length < 2) return { csid: null, rows: [] }
	rows = []
	for (row of parsed.rows) {
		extCode = (row[parsed.headers[0]] || '').trim()
		nuvaCode = (row[parsed.headers[1]] || '').trim()
		label = parsed.headers[2] ? (row[parsed.headers[2]] || '').trim() : ''
		if (!extCode || !nuvaCode) continue
		rows.push({ extCode: extCode, nuvaCode: nuvaCode, label: label })
	}
	return { csid: parsed.headers[0], rows: rows }
}

// The valence combination of a NUVA vaccine: its own valences if abstract,
// or its abstract parent's valences if real - the same rule common.js/extcode.js use.
function wsDeriveValences(nuvaCode) {
	if (!(nuvaCode in vaccines)) return null
	vaccine = vaccines[nuvaCode]
	if (vaccine.abstract) return vaccine.valences.slice()
	instanceOf = vaccine.instanceOf || 'VAC0000'
	if (!(instanceOf in vaccines) || !vaccines[instanceOf].valences) return []
	return vaccines[instanceOf].valences.slice()
}

function wsImportBaseline(workspace, directMap) {
	added = []
	duplicates = []
	invalid = []
	for (row of directMap.rows) {
		if (workspace.records[row.extCode]) {
			duplicates.push(row.extCode)
			continue
		}
		valences = wsDeriveValences(row.nuvaCode)
		if (valences == null) {
			invalid.push(row.extCode)
			continue
		}
		record = wsNewRecord({
			code: row.extCode,
			label: row.label || vaccines[row.nuvaCode].label,
			description: '',
			notes: '',
			extra: {}
		})
		record.status = 'imported'
		record.nuvaVaccine = row.nuvaCode
		record.valences = valences
		record.nuvaVersionUsed = (typeof defaultData != 'undefined' && defaultData) ? defaultData.version : null
		workspace.records[row.extCode] = record
		added.push(row.extCode)
	}
	workspace.modified = today()
	return { added: added, duplicates: duplicates, invalid: invalid }
}
