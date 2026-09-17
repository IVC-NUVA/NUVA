/* Alignment Workspace review screen (UC-4, UC-5)
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
			wsRenderHeader()
			wsRenderQueue()
			wsRenderDetail()
		})
	})
}

function wsRenderHeader() {
	el = document.getElementById('wsHeader')
	if (!wsWorkspace) {
		el.innerHTML = '<p>No active workspace. <a href="index.html">Create or open one</a>.</p>'
		return
	}
	totals = wsProgress(wsWorkspace)
	html = `<h2>${wsWorkspace.codeSystem.name} (${wsWorkspace.codeSystem.id})</h2>`
	html += `<p>NUVA version last reviewed against: ${wsWorkspace.nuvaVersion || 'unknown'} &mdash; current NUVA version: ${defaultData.version}</p>`
	html += `<p>Progress: ${totals.total} total`
	for (status in totals) {
		if (status == 'total') continue
		html += `, ${status.replace('_', ' ')}: ${totals[status]}`
	}
	html += `</p><p id="wsSaveState"></p>`
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
		tr.innerHTML = `<td>${record.code}</td><td>${record.label}</td>` +
			`<td><span class="ws-status ws-status-${record.status}">${record.status.replace('_', ' ')}</span></td>` +
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
	<h4>Selected NUVA valences</h4>
	<div id="wsSelectedValences" class="box"></div>
	<h4>Find a valence</h4>
	<input id="wsValenceSearch" type="text" placeholder="Search by label or shorthand" oninput="wsSearchValences()">
	<div id="wsValenceResults" class="scrollbox" style="height:180px"></div>
	<h4>NUVA match</h4>
	<div id="wsMatch" class="box"></div>
	<h4>Review</h4>
	<p>Confidence:
	<select id="wsConfidence" onchange="wsSetConfidence()">
	  <option value="">(none)</option>
	  <option value="high">High</option>
	  <option value="medium">Medium</option>
	  <option value="low">Low</option>
	</select></p>
	<textarea id="wsReviewNotes" rows="3" style="width:95%" onchange="wsSetNotes()" placeholder="Review notes"></textarea>
	`
	document.getElementById('wsConfidence').value = record.confidence || ''
	document.getElementById('wsReviewNotes').value = record.reviewNotes || ''
	wsRenderSelectedValences()
	wsRenderMatch()
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
	if (record.status == 'unreviewed') record.status = 'in_progress'
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
		return
	}
	key = valencesKey({ valences: record.valences })
	idvac = abstractVaccines[key]
	if (idvac && vaccines[idvac].status != 'deprecated') {
		el.innerHTML = `<p>Exact NUVA match: <b>${idvac}</b> &mdash; ${vaccines[idvac].label}</p>` +
			`<button onclick="wsConfirmMatch('${idvac}')">Confirm alignment</button>`
	} else {
		el.innerHTML = '<p>No active NUVA vaccine has exactly this valence combination yet.</p>'
	}
}

function wsConfirmMatch(idvac) {
	record = wsWorkspace.records[wsActiveCode]
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

function wsPersist() {
	wsWorkspace.records[wsActiveCode].modified = today()
	wsSaveWorkspace(wsWorkspace).then(function () {
		stateEl = document.getElementById('wsSaveState')
		if (stateEl) stateEl.innerHTML = 'Saved ' + new Date().toLocaleTimeString()
	})
}
