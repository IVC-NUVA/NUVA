/* Requests page (UC-6, UC-7): view and resolve provisional NUVA requests.
   Resolving always requires the user to confirm an official code - a
   suggestion from wsSuggest*RequestResolution() is never applied automatically.
*/
var wsActiveRequestType = null
var wsActiveRequestId = null

function wsRequestsInit() {
	fetch('../data/nuvadata.json').then(function (response) { return response.json() }).then(function (data) {
		defaultData = data
		vaccines = data.vaccines
		valences = data.valences
		rebuildAll()
		wsLoadWorkspace().then(function (ws) {
			wsWorkspace = ws
			wsRenderRequestsPage()
		})
	})
}

function wsRenderRequestsPage() {
	if (!wsWorkspace) {
		document.getElementById('wsRequestsBody').innerHTML = '<p>No active workspace. <a href="index.html">Create or open one</a>.</p>'
		return
	}
	wsRenderValenceRequests()
	wsRenderVaccineRequests()
	wsRenderRequestDetail()
}

function wsRenderValenceRequests() {
	tbody = document.getElementById('wsValReqBody')
	tbody.innerHTML = ''
	for (id in wsWorkspace.valenceRequests) {
		req = wsWorkspace.valenceRequests[id]
		suggestion = req.status != 'resolved' ? wsSuggestValenceRequestResolution(req) : null
		tr = document.createElement('tr')
		tr.innerHTML = `<td>${id}</td><td>${req.proposedLabel}</td><td>${req.status}</td>` +
			`<td>${req.affectedCodes.join(', ')}</td><td>${suggestion ? ('Possible match: ' + suggestion) : ''}</td>`
		tr.onclick = (function (i) { return function () { wsSelectRequest('valence', i) } })(id)
		if (wsActiveRequestType == 'valence' && wsActiveRequestId == id) tr.style.backgroundColor = '#E0E0E0'
		tbody.appendChild(tr)
	}
}

function wsRenderVaccineRequests() {
	tbody = document.getElementById('wsVacReqBody')
	tbody.innerHTML = ''
	for (id in wsWorkspace.vaccineRequests) {
		req = wsWorkspace.vaccineRequests[id]
		suggestion = req.status != 'resolved' ? wsSuggestVaccineRequestResolution(req) : null
		valLabel = req.valences.map(function (idval) { return (valences[idval] ? valences[idval].shorthand : idval) }).join('-')
		tr = document.createElement('tr')
		tr.innerHTML = `<td>${id}</td><td>[${valLabel}]</td><td>${req.proposedLabel || ''}</td><td>${req.status}</td>` +
			`<td>${req.affectedCodes.join(', ')}</td><td>${suggestion ? ('Possible match: ' + suggestion) : ''}</td>`
		tr.onclick = (function (i) { return function () { wsSelectRequest('vaccine', i) } })(id)
		if (wsActiveRequestType == 'vaccine' && wsActiveRequestId == id) tr.style.backgroundColor = '#E0E0E0'
		tbody.appendChild(tr)
	}
}

function wsSelectRequest(type, id) {
	wsActiveRequestType = type
	wsActiveRequestId = id
	wsRenderValenceRequests()
	wsRenderVaccineRequests()
	wsRenderRequestDetail()
}

function wsActiveRequestDict() {
	return (wsActiveRequestType == 'valence') ? wsWorkspace.valenceRequests : wsWorkspace.vaccineRequests
}

function wsRenderRequestDetail() {
	panel = document.getElementById('wsRequestDetail')
	if (!wsActiveRequestId) {
		panel.innerHTML = '<p>Select a request to view or resolve it.</p>'
		return
	}
	req = wsActiveRequestDict()[wsActiveRequestId]
	officialField = (wsActiveRequestType == 'valence') ? 'officialValenceId' : 'officialVaccineId'
	suggestion = (wsActiveRequestType == 'valence') ? wsSuggestValenceRequestResolution(req) : wsSuggestVaccineRequestResolution(req)

	html = `<h3>${req.id}</h3>`
	html += `<p><b>Proposed label:</b> ${req.proposedLabel || '(none)'}</p>`
	if (wsActiveRequestType == 'valence') {
		html += `<p><b>Proposed parent:</b> ${req.proposedParent || '(none)'}</p><p><b>Description:</b> ${req.description || ''}</p>`
	} else {
		valLabel = req.valences.map(function (idval) { return (valences[idval] ? valences[idval].shorthand : idval) }).join('-')
		html += `<p><b>Valence combination:</b> [${valLabel}]</p>`
	}
	html += `<p><b>Rationale:</b> ${req.rationale || ''}</p>`
	html += `<p><b>Affected codes:</b> ${req.affectedCodes.join(', ') || '(none)'}</p>`
	html += `<p><b>Status:</b> ${req.status}</p>`
	if (req[officialField]) {
		html += `<p><b>Official NUVA code:</b> ${req[officialField]}</p>`
	} else {
		html += `<p>${suggestion ? `Possible current match: <b>${suggestion}</b>` : 'No current NUVA match found yet.'}</p>`
		html += `<label>Official NUVA code once created: <input id="wsResolveCode" type="text" value="${suggestion || ''}"></label> `
		html += `<button onclick="wsDoResolveRequest()">Mark resolved</button>`
	}
	html += `<h4>Notes</h4><textarea id="wsRequestNotes" rows="3" style="width:95%" onchange="wsSetRequestNotes()">${req.notes || ''}</textarea>`
	panel.innerHTML = html
}

function wsDoResolveRequest() {
	code = document.getElementById('wsResolveCode').value.trim()
	if (!code) { showAlert('Enter the official NUVA code.'); return }
	if (wsActiveRequestType == 'valence') {
		wsResolveValenceRequest(wsWorkspace, wsActiveRequestId, code)
	} else {
		wsResolveVaccineRequest(wsWorkspace, wsActiveRequestId, code)
	}
	wsSaveWorkspace(wsWorkspace).then(function () { wsRenderRequestsPage() })
}

function wsSetRequestNotes() {
	wsActiveRequestDict()[wsActiveRequestId].notes = document.getElementById('wsRequestNotes').value
	wsWorkspace.modified = today()
	wsSaveWorkspace(wsWorkspace)
}
