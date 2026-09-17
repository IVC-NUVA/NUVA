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
