/* global Split, jsonTree, escapeHtml, alert, CodeMirror */

/*
box.onclick = function() {
  if (!box.checked) {
    return
  }
  if (window.wasIn) {
    window.wasIn = false;
  } else {
    box.checked = false;
    box.indeterminate = true;
    window.wasIn = true;
  }
}
*/

const Clusterize = require('clusterize.js')
const filteringLogic = require('./js/filteringLogic.js')

// const escapeHtml = require('escape-html'); Already defined in my customised version of jsonTree (I just added HTML escaping)

let currentPacket
let currentPacketType

const filterInput = document.getElementById('filter')

// Should improve performance by excluding hidden packets
function wrappedClusterizeUpdate (htmlArray) {
  const newArray = []
  for (const item of htmlArray) {
    if (!item[0]
      .match(/<li .* class=".*filter-hidden">/)) {
      newArray.push(item)
    }
  }
  clusterize.update(newArray)
}

// Cleaned up from https://css-tricks.com/indeterminate-checkboxes/
function toggleCheckbox (box, packetName, direction) {
  // TODO: collapsing with indeterminate state
  /* if (box.readOnly) {
    box.checked = false
    box.readOnly = false
  } else if (!box.checked) {
    box.readOnly = true
    box.indeterminate = true
  } */

  // console.log('Toggled visibility of', packetName, 'to', box.checked)
  const index = sharedVars.hiddenPackets[direction].indexOf(packetName)
  const currentlyHidden = index !== -1
  if (box.checked && currentlyHidden) {
    // Remove it from the hidden packets
    sharedVars.hiddenPackets[direction].splice(index, 1)
  } else if (!box.checked && !currentlyHidden) {
    // Add it to the hidden packets
    sharedVars.hiddenPackets[direction].push(packetName)
  }
}

function updateFilter () {
  // TODO
  const newValue = filterInput.value
  if (sharedVars.lastFilter !== newValue) {
    sharedVars.lastFilter = newValue
    deselectPacket()
    sharedVars.allPacketsHTML.forEach(function(item, index, array) {
      if (!filteringLogic.packetFilteredByFilterBox(sharedVars.allPackets[index], newValue)) {
        // If it's hidden, show it
        array[index] = [item[0].replace('filter-hidden', 'filter-shown')]
      } else {
        // If it's shown, hide it
        array[index] = [item[0].replace('filter-shown', 'filter-hidden')]
      }
    })
    wrappedClusterizeUpdate(sharedVars.allPacketsHTML)
    clusterize.refresh()
  }
}

setInterval(updateFilter, 100)

/* let hiddenPackets = [
  // TODO: Do this properly
  // JE
  'update_time', 'position', 'position', 'keep_alive', 'keep_alive', 'rel_entity_move', 'position_look', 'look', 'position_look', 'map_chunk', 'update_light', 'entity_action', 'entity_update_attributes', 'unload_chunk', 'unload_chunk', 'update_view_position', 'entity_metadata',
  // BE
  'network_stack_latency', 'level_chunk', 'move_player', 'player_auth_input', 'network_chunk_publisher_update', 'client_cache_blob_status', 'client_cache_miss_response', 'move_entity_delta', 'set_entity_data', 'set_time', 'set_entity_data', 'set_entity_motion', /* "add_entity", *//* 'level_event', 'level_sound_event2', 'update_attributes', 'entity_event', 'remove_entity', 'mob_armor_equipment', 'mob_equipment', 'update_block', 'player_action', 'move_entity_absolute'
] */

// let dialogOpen = false Not currently used

const defaultHiddenPackets = {
  serverbound: ["position","position_look","look","keep_alive","entity_action"],
    clientbound: ["keep_alive","update_time","rel_entity_move","entity_teleport","map_chunk","update_light","update_view_position","entity_metadata","entity_update_attributes","unload_chunk","entity_velocity","entity_move_look","entity_head_rotation"]
},

sharedVars = {
  allPackets: [],
  allPacketsHTML: [],
  proxyCapabilities : {},
  ipcRenderer: require('electron').ipcRenderer,
  packetList: document.getElementById('packetlist'),
  hiddenPackets: Object.assign({}, defaultHiddenPackets),
  scripting: undefined,
  lastFilter: ''
}

sharedVars.proxyCapabilities = JSON.parse(sharedVars.ipcRenderer.sendSync('proxyCapabilities', ''))
console.log(sharedVars.proxyCapabilities)

if (!sharedVars.proxyCapabilities.modifyPackets) {
  document.getElementById('editAndResend').style.display = 'none'
}

Split(['#packets', '#sidebar'], {
  minSize: [50, 75]
})

sharedVars.scripting = require('./js/scripting.js')
sharedVars.scripting.setup(sharedVars)
sharedVars.packetDom = require('./js/packetDom.js')
sharedVars.packetDom.setup(sharedVars)
sharedVars.ipcHandler = require('./js/ipcHandler.js')
sharedVars.ipcHandler.setup(sharedVars)

// const sidebar = document.getElementById('sidebar-box')










// TODO: move to own file
const filteringPackets = document.getElementById('filtering-packets')

function updateFilteringTab () {
  for (const item of filteringPackets.children) {
    const name = item.children[2].textContent

    const checkbox = item.firstElementChild
    checkbox.readOnly = false
    checkbox.indeterminate = false
    let isShown = true
    if (item.className.includes('serverbound') &&
      sharedVars.hiddenPackets['serverbound'].includes(name)) {
      isShown = false
    } else if (item.className.includes('clientbound') &&
      sharedVars.hiddenPackets['clientbound'].includes(name)) {
      isShown = false
    }

    checkbox.checked = isShown
  }
}

const allServerboundPackets = []
const allClientboundPackets = []

// Filtering - coming soon
function addPacketsToFiltering (packetsObject, direction, appendTo) {
  console.log('packets', packetsObject)
  for (const key in packetsObject) {
    if (packetsObject.hasOwnProperty(key)) {
      console.log(!sharedVars.hiddenPackets[direction].includes(packetsObject[key]))
      filteringPackets.innerHTML +=
     `<li id="${packetsObject[key].replace(/"/g, "&#39;") + '-' + direction}" class="packet ${direction}">
        <input type="checkbox" ${!sharedVars.hiddenPackets[direction].includes(packetsObject[key]) ? 'checked' : ''}
            onclick="toggleCheckbox(this, ${JSON.stringify(packetsObject[key]).replace(/"/g, "&#39;")}, '${direction}')"/>
        <span class="id">${escapeHtml(key)}</span>
        <span class="name">${escapeHtml(packetsObject[key])}</span>
      </li>`
      console.log(key + ' -> ' + packetsObject[key])
      appendTo.push(packetsObject[key])
    }
  }
}







addPacketsToFiltering(sharedVars.proxyCapabilities.serverboundPackets, 'serverbound', allServerboundPackets)
addPacketsToFiltering(sharedVars.proxyCapabilities.clientboundPackets, 'clientbound', allClientboundPackets)



// Update every 0.05 seconds
// TODO: Find a better way without updating on every packet (which causes lag)
window.setInterval(function () {
  if (sharedVars.packetsUpdated) {
    const diff = (sharedVars.packetList.parentElement.scrollHeight - sharedVars.packetList.parentElement.offsetHeight) - sharedVars.packetList.parentElement.scrollTop;
    const wasScrolledToBottom = diff < 5 // If it was scrolled to the bottom or almost scrolled to the bottom
    wrappedClusterizeUpdate(sharedVars.allPacketsHTML)
    if (wasScrolledToBottom) {
      sharedVars.packetList.parentElement.scrollTop = sharedVars.packetList.parentElement.scrollHeight
      // Also update it later - hacky workaround for scroll bar being "left behind"
      setTimeout(() => {
        sharedVars.packetList.parentElement.scrollTop = sharedVars.packetList.parentElement.scrollHeight
      }, 10)
    }
    sharedVars.packetsUpdated = false
  }
}, 50)

window.closeDialog = function () { // window. stops standardjs from complaining
                                   // dialogOpen = false
  document.getElementById('dialog-overlay').className = 'dialog-overlay'
  document.getElementById('dialog').innerHTML = ''
}

window.resendEdited = function (id, newValue) {
  try {
    sharedVars.ipcRenderer.send('injectPacket', JSON.stringify({
      meta: sharedVars.allPackets[id].meta,
      data: JSON.parse(newValue),
      direction: sharedVars.allPackets[id].direction
    }))
  } catch (err) {
    alert('Invalid JSON')
  }
}

function editAndResend (id) {
  if (!sharedVars.proxyCapabilities.modifyPackets) {
    alert('Edit and Resend is unavailable')
    return
  }

  // dialogOpen = true
  document.getElementById('dialog-overlay').className = 'dialog-overlay active'
  document.getElementById('dialog').innerHTML =

    `<h2>Edit and resend packet</h2>
  <textarea id="packetEditor"></textarea>
  <button style="margin-top: 16px;" onclick="resendEdited(${id}, packetEditor.getValue())">Send</button>
  <button style="margin-top: 16px;" onclick="closeDialog()">Close</button>`

  document.getElementById('packetEditor').value = JSON.stringify(sharedVars.allPackets[id].data, null, 2)

  window.packetEditor = CodeMirror.fromTextArea(document.getElementById('packetEditor'), { // window. stops standardjs from complaining
    lineNumbers: false,
    autoCloseBrackets: true,
    theme: 'darcula'
  })
}

sharedVars.ipcRenderer.on('editAndResend', (event, arg) => { // Context menu
  const ipcMessage = JSON.parse(arg)
  editAndResend(ipcMessage.id)
})

function deselectPacket () {
  currentPacket = undefined
  currentPacketType = undefined
  sharedVars.packetDom.getTreeElement().firstElementChild.innerHTML = 'No packet selected!'
  document.body.className = 'noPacketSelected'
}

window.clearPackets = function () { // window. stops standardjs from complaining
  sharedVars.allPackets = []
  sharedVars.allPacketsHTML = []
  deselectPacket()
  sharedVars.packetsUpdated = true
  // TODO: Doesn't seem to work? When removing line above it doesn't do anything until the next packet
  wrappedClusterizeUpdate([])
}

window.showAllPackets = function () { // window. stops standardjs from complaining
  sharedVars.hiddenPackets = []
}

window.packetClick = function (id) { // window. stops standardjs from complaining
  currentPacket = id
  currentPacketType = document.getElementById('packet' + id).children[1].innerText
  document.body.className = 'packetSelected'
  if (sharedVars.proxyCapabilities.jsonData) {
    // sidebar.innerHTML = '<div style="padding: 10px;">Loading packet data...</div>';
    sharedVars.packetDom.getTree().loadData(sharedVars.allPackets[id].data)
  } else {
    treeElement.innerText = sharedVars.allPackets[id].data.data
    treeElement.style = `
    color: #0F0;
    white-space: pre;
    font-family: 'PT Mono', monospace;
    font-size: 14px;
    display: block;`
  }
}

function hideAll (id) {
  const packet = sharedVars.allPackets[id]
  if (sharedVars.hiddenPackets[packet.direction].indexOf(packet.meta.name) === -1) {
    sharedVars.hiddenPackets[packet.direction].push(packet.meta.name)
  }
  const checkbox = document.getElementById(packet.meta.name + '-' + packet.direction).firstElementChild
  checkbox.checked = false
  checkbox.readOnly = false
  checkbox.indeterminate = false
}

sharedVars.ipcRenderer.on('hideAllOfType', (event, arg) => { // Context menu
  const ipcMessage = JSON.parse(arg)
  hideAll(ipcMessage.id)
})

// Modified from W3Schools
window.openMenu = function (evt, MenuName, id) { // window. stops standardjs from complaining
  var i, tabcontent, tablinks
  tabcontent = document.getElementsByClassName('tabcontent' + id)
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = 'none'
  }
  tablinks = document.getElementsByClassName('tablinks' + id)
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(' active', '')
  }
  document.getElementById(MenuName).style.display = 'block'
  evt.currentTarget.className += ' active'
}

document.body.addEventListener('contextmenu', (event) => {
  let target = event.srcElement
  if (target.tagName !== 'LI') {
    target = target.parentElement
  }
  if (!target || target.tagName !== 'LI') {
    return
  };
  sharedVars.ipcRenderer.send('contextMenu', JSON.stringify({
    direction: target.className.split(' ')[1],
    text: target.children[0].innerText + ' ' + target.children[1].innerText,
    id: target.id.replace('packet', '')
  }))
})

var clusterize = new Clusterize({
  rows: sharedVars.allPacketsHTML,
  scrollElem: sharedVars.packetList.parentElement,
  contentElem: sharedVars.packetList
})
