/* Keep context in session storage*/
function loadFromSession(key,value) {
  json = sessionStorage.getItem(key)
  if (json == null) {
    json = JSON.stringify(value)
    sessionStorage.setItem(key,json)
  }
  return JSON.parse(json)
}

function saveToSession(key,value) {
    json = JSON.stringify(value)
    sessionStorage.setItem(key,json)
}

function initContext() {
    vaccines = loadFromSession('vaccines',defaultVaccines)
    valences = loadFromSession('valences',defaultValences)
    selected_valences = new Set(loadFromSession('selected',[]))
    showSelected()
    filter = loadFromSession('filter',[])
    showFilter()
}

/* Valence Tag */
function valenceTag(valcode)
{
    valtag = document.createElement("span")
    valtag.className = "valence"
    valtag.id = valcode
    valtag.onclick = function() {
      id = this.id
      if (selected_valences.has(id)) {
        selected_valences.delete(id)
      } else {
      selected_valences.add(id)
      }
      showSelected()
      window.location.reload()
    }
    valtag.title = valences[valcode]['label']
    valtag.innerHTML = valences[valcode]['shorthand']
    return valtag
}

/* Manage selected valences */

function showSelected () {
  selplace = document.getElementById("selected")
  selplace.innerHTML = ""
  for (dvalcode of selected_valences.entries()) {
    valcode = dvalcode[0]
    item = document.createElement('li')
    item.appendChild(valenceTag(valcode))
    selplace.appendChild(item)
  }
  saveToSession('selected',Array.from(selected_valences))
}

function clearSelected() {
    selected_valences.clear()
    showSelected()
    window.location.reload()
}

function unselectParents(vid) {
  for (parent of valences[vid].lineage) {
    selected_valences.delete(parent)
  }
}
function unselectChildren(vid) {
  for (child of valences[vid]['children']) {
    selected_valences.delete(child)
    unselectChildren(child)
  }
}

function updateTicks()
{
  for (valcode in valences) {
    if (valcode == 'Valence') continue
    tickbox = document.getElementById('tick'+valcode)
    tickbox.checked = false
    tickbox.style ='accent-color:blue'
  }

  for (dvalcode of selected_valences.entries()) {
      valcode = dvalcode[0]
      tickbox = document.getElementById('tick'+valcode)
      tickbox.checked = true
      tickbox.style = 'accent-color:blue'
      for (valpar of valences[valcode]['lineage']) {
        tickbox = document.getElementById('tick'+valpar)
        tickbox.checked = true
        tickbox.style = 'accent-color:grey'
    }
  }
}

/* Manage filter */
function setFilter() {
  filter = Array.from(selected_valences)
  showFilter()
  window.location.reload()
}

function clearFilter() {
  filter = []
  showFilter()
  window.location.reload()
}

function showFilter () {
  filplace = document.getElementById("filter")
  filplace.innerHTML = ""
  for (valcode of filter) {
    item = document.createElement('li')
    item.innerHTML = valences[valcode]['shorthand']
    filplace.appendChild(item)
  }
  saveToSession('filter',filter)
}

/* Vaccines page */
function showVaccines (table)
{
  vloop:for (vcode in vaccines) {
    vaccine = vaccines[vcode]
    for (filterval of filter) {
      if (! (vaccine['implicit'].includes(filterval))) continue vloop
    }
    row = table.insertRow(-1)
    row.insertCell(-1).innerHTML = vcode
    row.insertCell(-1).innerHTML = vaccine['label']
    valcell = row.insertCell(-1)
    for (vcode of vaccine['valences']) {
        valcell.appendChild(valenceTag(vcode))
    }
   }
}

/* Valences page */
function showChildren(valence) {
  var list = document.createElement("ul")
  var children = valence['children']

  children.sort(function(a,b) {
      return valences[a].shorthand.localeCompare(valences[b].shorthand)
  })

  for (child of children) {
    var vchild =  valences[child]
    var hidden = false
    if (filter.length != 0) {
      hidden = true
      for (filterval of filter) {
        if ((filterval == child) ||
            (valences[filterval]['lineage'].includes(child)) ||
            (valences[child]['lineage'].includes(filterval))) {
          console.log(filterval+' matches '+vchild['shorthand'])
          hidden = false
        }
      }
    }
    var item = document.createElement("li")
    var s1 = document.createElement("span")
    s1.innerHTML = vchild['shorthand']+'('+child+')-'+vchild['label']
    item.appendChild(s1)
        var select = document.createElement('input')
    select.type = 'checkbox'
    select.id = "tick"+child
    select.onclick = function() {
      me = this.id.substring(4)
      if (selected_valences.has(me)) {
        selected_valences.delete(me)
        } else {
        selected_valences.add(me)
        unselectParents(me)
        unselectChildren(me)
        }
        updateTicks()
        showSelected()
    }
    var s2 = document.createElement("span")
    s2.appendChild(select)
    item.appendChild(s2)
     if (vchild['children'].length == 0) {
       s1.className = 'final'
     } else {
       s1.className = 'folded'
       item.appendChild(showChildren(vchild))
     }
    list.appendChild(item)
    if (hidden) {
        item.style.display = 'none'
    } else {
      item.style.display = 'block'
    }
    }

  return list
}

function showValences (table,filter)
{
    lpos = document.getElementById('lval')
    list = showChildren(valences["Valence"])
    lval.appendChild (list)
}
