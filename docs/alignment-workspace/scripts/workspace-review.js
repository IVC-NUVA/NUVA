/* Alignment Workspace review screen (UC-4, UC-5, UC-6, UC-7, UC-8, UC-10, UC-11)
   Loads NUVA data independently of common.js's initContext() (TR-8: NUVA core data
   is loaded separately from workspace data) but reuses common.js's rebuildAll(),
   abstractVaccines, valencesKey() and valenceTag() so exact-match detection and
   valence rendering behave identically to the rest of the editor.
*/
var wsActiveCode = null

function wsReviewInit() {
	fetch('../data/nuvadata.json').then(function (response) { return response.json() }).then(function (data) {
		defaultData = data
		vaccines = data.vaccines
		valences = data.valences
		rebuildAll()
		wsLoadWorkspace().then(function (ws) {
			wsWorkspace = ws
			if (!wsWorkspace) {
				wsRenderHeader()
				wsRenderQueue()
				wsRenderDetail()
				return
			}
			// UC-11: re-check every record against the NUVA data just loaded.
			reconciled = wsReconcileNuva(wsWorkspace)
			wsSaveWorkspace(wsWorkspace).then(function () {
				wsRenderHeader(reconciled)
				wsRenderQueue()
				wsRenderDetail()
			})
		})
	})
}

function wsRenderHeader(reconciled) {
	el = document.getElementById('wsHeader')
	if (!wsWorkspace) {
		el.innerHTML = '<p>No active workspace. <a href="index.html">Create or open one</a>.</p>'
		return
	}
	totals = wsProgress(wsWorkspace)
	html = `<h2>${wsWorkspace.codeSystem.name} (${wsWorkspace.codeSystem.id})</h2>`
	html += `<p>NUVA version last reconciled against: ${wsWorkspace.nuvaVersion || 'unknown'} &mdash; current NUVA version: ${defaultData.version}</p>`
	html += `<p>Progress: ${totals.total} total`
	for (status of wsStatuses) {
		if (totals[status]) html += `, ${status.replace(/_/g, ' ')}: ${totals[status]}`
	}
	html += `</p>`
	if (reconciled && reconciled.flaggedRecords.length > 0) {
		html += `<p><b>${reconciled.flaggedRecords.length} record(s) flagged for review</b> after checking against the current NUVA data.</p>`
	}
	html += `<p id="wsSaveState"></p>`
	el.innerHTML = html
}

function wsRenderQueue() {
	tbody = document.getElementById('wsQueueBody')
	tbody.innerHTML = ''
	if (!wsWorkspace) return
	filterText = (document.getElementById('wsFilter').value || '').toLowerCase()
	statusFilter = document.getElementById('wsStatusFilter').value
	for (code in wsWorkspace.records) {
		record = wsWorkspace.records[code]
		if (statusFilter && record.status != statusFilter) continue
		if (filterText && !(record.code.toLowerCase().includes(filterText) || record.label.toLowerCase().includes(filterText))) continue
		tr = document.createElement('tr')
		flagBadge = record.changeFlags.length > 0 ? ` <span class="ws-flag">${record.changeFlags.length}</span>` : ''
		tr.innerHTML = `<td>${record.code}</td><td>${record.label}${flagBadge}</td>` +
			`<td><span class="ws-status ws-status-${record.status}">${record.status.replace(/_/g, ' ')}</span></td>` +
			`<td>${record.nuvaVaccine || ''}</td>`
		tr.onclick = (function (c) { return function () { wsSelectRecord(c) } })(code)
		if (code == wsActiveCode) tr.style.backgroundColor = '#E0E0E0'
		tbody.appendChild(tr)
	}
}

function wsSelectRecord(code) {
	wsActiveCode = code
	wsRenderQueue()
	wsRenderDetail()
}

function wsRenderDetail() {
	panel = document.getElementById('wsDetail')
	if (!wsWorkspace || !wsActiveCode || !wsWorkspace.records[wsActiveCode]) {
		panel.innerHTML = '<p>Select a code from the work queue.</p>'
		return
	}
	record = wsWorkspace.records[wsActiveCode]
	panel.innerHTML = `
	<h3>${record.code} &mdash; ${record.label}</h3>
	<p>${record.description || ''}</p>
	<p class="details">${record.sourceNotes || ''}</p>
	<div id="wsFlagsBox"></div>
	<h4>Selected NUVA valences</h4>
	<div id="wsSelectedValences" class="box"></div>
	<h4>Find a valence</h4>
	<input id="wsValenceSearch" type="text" placeholder="Search by label or shorthand" oninput="wsSearchValences()">
	<div id="wsValenceResults" class="scrollbox" style="height:150px"></div>
	<h4>NUVA match</h4>
	<div id="wsMatch" class="box"></div>
	<h4>Missing from NUVA?</h4>
	<div id="wsRequestArea" class="box">
	<button onclick="wsShowValenceRequestForm()">Request a missing valence</button>
	</div>
	<h4>Review</h4>
	<p>Confidence:
	<select id="wsConfidence" onchange="wsSetConfidence()">
	  <option value="">(none)</option>
	  <option value="high">High</option>
	  <option value="medium">Medium</option>
	  <option value="low">Low</option>
	</select></p>
	<textarea id="wsReviewNotes" rows="3" style="width:95%" onchange="wsSetNotes()" placeholder="Review notes"></textarea>
	<h4>Needs help or out of scope</h4>
	<textarea id="wsQuestions" rows="2" style="width:95%" onchange="wsSetQuestions()" placeholder="Open questions"></textarea>
	<p>
	<button onclick="wsMarkStatus('needs_information')">Mark needs information</button>
	<button onclick="wsMarkStatus('needs_review')">Mark needs review</button>
	<button onclick="wsMarkStatus('out_of_scope')">Mark out of scope</button>
	<button onclick="wsMarkStatus('in_progress')">Resume review</button>
	</p>
	`
	document.getElementById('wsConfidence').value = record.confidence || ''
	document.getElementById('wsReviewNotes').value = record.reviewNotes || ''
	document.getElementById('wsQuestions').value = record.questions || ''
	wsRenderFlags()
	wsRenderSelectedValences()
	wsRenderMatch()
}

function wsRenderFlags() {
	el = document.getElementById('wsFlagsBox')
	record = wsWorkspace.records[wsActiveCode]
	parts = []
	if (record.changeFlags.length > 0) {
		labels = record.changeFlags.map(function (f) { return wsChangeFlagLabels[f] || f })
		parts.push(`<div class="box ws-warning"><p><b>Flagged for review:</b> ${labels.join('; ')}</p>` +
			(record.pendingSourceUpdate ? `<p>New source data: label "${record.pendingSourceUpdate.label}"</p>
			<button onclick="wsApplyUpdate()">Apply source update</button>` : '') + `</div>`)
	}
	if (record.requestedValenceIds.length > 0 || record.requestedVaccineId) {
		links = record.requestedValenceIds.slice()
		if (record.requestedVaccineId) links.push(record.requestedVaccineId)
		parts.push(`<p><i>Linked NUVA requests: ${links.join(', ')} (see <a href="requests.html">Requests</a>)</i></p>`)
	}
	el.innerHTML = parts.join('')
}

function wsApplyUpdate() {
	wsApplySourceUpdate(wsWorkspace, wsActiveCode)
	wsPersist()
	wsRenderDetail()
	wsRenderQueue()
}

function wsRenderSelectedValences() {
	el = document.getElementById('wsSelectedValences')
	el.innerHTML = ''
	record = wsWorkspace.records[wsActiveCode]
	if (record.valences.length == 0) {
		el.innerHTML = '<i>None selected</i>'
		return
	}
	for (idval of record.valences) {
		if (!(idval in valences)) continue
		tag = valenceTag(idval, 'W')
		tag.title += ' (click to remove)'
		tag.onclick = (function (v) { return function () { wsToggleValence(v) } })(idval)
		el.appendChild(tag)
		el.appendChild(document.createTextNode(' '))
	}
}

function wsSearchValences() {
	query = document.getElementById('wsValenceSearch').value.toLowerCase()
	results = document.getElementById('wsValenceResults')
	results.innerHTML = ''
	if (query.length < 2) return
	record = wsWorkspace.records[wsActiveCode]
	count = 0
	for (idval in valences) {
		if (idval == idRoot) continue
		if (record.valences.includes(idval)) continue
		valence = valences[idval]
		if (valence.label.toLowerCase().includes(query) || valence.shorthand.toLowerCase().includes(query)) {
			tag = valenceTag(idval, 'F')
			tag.title += ' (click to add)'
			tag.onclick = (function (v) { return function () { wsToggleValence(v) } })(idval)
			results.appendChild(tag)
			results.appendChild(document.createTextNode(' '))
			count++
			if (count >= 50) break
		}
	}
}

function wsToggleValence(idval) {
	record = wsWorkspace.records[wsActiveCode]
	index = record.valences.indexOf(idval)
	if (index == -1) {
		record.valences.push(idval)
	} else {
		record.valences.splice(index, 1)
	}
	if (record.status == 'unreviewed' || record.status == 'imported') record.status = 'in_progress'
	wsPersist()
	wsRenderSelectedValences()
	wsSearchValences()
	wsRenderMatch()
	wsRenderQueue()
}

// Exact-match detection reuses common.js's abstractVaccines map (built by
// rebuildAll()/rebuildVaccines()) - the same lookup extcode.js relies on.
function wsRenderMatch() {
	el = document.getElementById('wsMatch')
	record = wsWorkspace.records[wsActiveCode]
	if (record.valences.length == 0) {
		el.innerHTML = '<i>Select at least one valence.</i>'
		document.getElementById('wsRequestArea').innerHTML = '<button onclick="wsShowValenceRequestForm()">Request a missing valence</button>'
		return
	}
	key = valencesKey({ valences: record.valences })
	idvac = abstractVaccines[key]
	if (idvac && vaccines[idvac].status != 'deprecated') {
		el.innerHTML = `<p>Exact NUVA match: <b>${idvac}</b> &mdash; ${vaccines[idvac].label}</p>` +
			`<button onclick="wsConfirmMatch('${idvac}')">Confirm alignment</button>`
		document.getElementById('wsRequestArea').innerHTML = '<button onclick="wsShowValenceRequestForm()">Request a missing valence</button>'
	} else {
		el.innerHTML = '<p>No active NUVA vaccine has exactly this valence combination yet.</p>'
		document.getElementById('wsRequestArea').innerHTML =
			'<button onclick="wsShowValenceRequestForm()">Request a missing valence</button> ' +
			'<button onclick="wsShowVaccineRequestForm()">Request a missing NUVA vaccine combination</button>'
	}
}

function wsConfirmMatch(idvac) {
	record = wsWorkspace.records[wsActiveCode]
	if (record.status == 'aligned' && record.nuvaVaccine != idvac) {
		wsPushHistory(record, 'Replaced by a new alignment decision')
	}
	record.nuvaVaccine = idvac
	record.status = 'aligned'
	record.nuvaVersionUsed = defaultData.version
	wsPersist()
	wsRenderDetail()
	wsRenderQueue()
	wsRenderHeader()
}

function wsSetConfidence() {
	wsWorkspace.records[wsActiveCode].confidence = document.getElementById('wsConfidence').value || null
	wsPersist()
}

function wsSetNotes() {
	wsWorkspace.records[wsActiveCode].reviewNotes = document.getElementById('wsReviewNotes').value
	wsPersist()
}

function wsSetQuestions() {
	wsWorkspace.records[wsActiveCode].questions = document.getElementById('wsQuestions').value
	wsPersist()
}

function wsMarkStatus(status) {
	wsSetRecordStatus(wsWorkspace, wsActiveCode, status)
	wsPersist()
	wsRenderQueue()
	wsRenderHeader()
}

/* UC-6 / UC-7: provisional NUVA requests, created from the record being reviewed */

function wsShowValenceRequestForm() {
	area = document.getElementById('wsRequestArea')
	area.innerHTML = `
	<label>Proposed label <input id="wsReqValLabel" type="text"></label><br>
	<label>Description <input id="wsReqValDesc" type="text"></label><br>
	<label>Proposed parent valence id (optional) <input id="wsReqValParent" type="text" placeholder="e.g. VAL003"></label><br>
	<label>Rationale <input id="wsReqValRationale" type="text"></label><br>
	<button onclick="wsSubmitValenceRequest()">Submit request</button>
	<button onclick="wsRenderMatch()">Cancel</button>
	`
}

function wsSubmitValenceRequest() {
	label = document.getElementById('wsReqValLabel').value.trim()
	if (!label) { showAlert('A proposed label is required.'); return }
	request = wsCreateValenceRequest(wsWorkspace, {
		proposedLabel: label,
		description: document.getElementById('wsReqValDesc').value.trim(),
		proposedParent: document.getElementById('wsReqValParent').value.trim() || null,
		rationale: document.getElementById('wsReqValRationale').value.trim(),
		affectedCodes: [wsActiveCode]
	})
	record = wsWorkspace.records[wsActiveCode]
	record.requestedValenceIds.push(request.id)
	wsSetRecordStatus(wsWorkspace, wsActiveCode, 'awaiting_new_valence')
	wsPersist()
	wsRenderDetail()
	wsRenderQueue()
	wsRenderHeader()
}

function wsShowVaccineRequestForm() {
	area = document.getElementById('wsRequestArea')
	area.innerHTML = `
	<label>Proposed label (optional) <input id="wsReqVacLabel" type="text"></label><br>
	<label>Rationale <input id="wsReqVacRationale" type="text"></label><br>
	<button onclick="wsSubmitVaccineRequest()">Submit request</button>
	<button onclick="wsRenderMatch()">Cancel</button>
	`
}

function wsSubmitVaccineRequest() {
	record = wsWorkspace.records[wsActiveCode]
	request = wsCreateVaccineRequest(wsWorkspace, {
		valences: record.valences,
		proposedLabel: document.getElementById('wsReqVacLabel').value.trim(),
		rationale: document.getElementById('wsReqVacRationale').value.trim(),
		affectedCodes: [wsActiveCode]
	})
	record.requestedVaccineId = request.id
	wsSetRecordStatus(wsWorkspace, wsActiveCode, 'awaiting_new_vaccine')
	wsPersist()
	wsRenderDetail()
	wsRenderQueue()
	wsRenderHeader()
}

function wsPersist() {
	wsWorkspace.records[wsActiveCode].modified = today()
	wsSaveWorkspace(wsWorkspace).then(function () {
		stateEl = document.getElementById('wsSaveState')
		if (stateEl) stateEl.innerHTML = 'Saved ' + new Date().toLocaleTimeString()
	})
}
