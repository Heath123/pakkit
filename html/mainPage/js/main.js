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

const { ipcRenderer } = require('electron')
const Clusterize = require('clusterize.js')

// const mcdata = require('minecraft-data')('1.16.1') // TODO: Multiple versons!!!!!!!!!!!!!!!!!!!!!!!
// const toClientPackets = mcdata.protocol.play.toClient.types.packet[1][0].type[1].mappings
// const toServerPackets = mcdata.protocol.play.toServer.types.packet[1][0].type[1].mappings
// const escapeHtml = require('escape-html'); Already defined in my customised version of jsonTree (I just added HTML escaping)

const proxyCapabilities = JSON.parse(ipcRenderer.sendSync('proxyCapabilities', ''))

if (!proxyCapabilities.modifyPackets) {
  document.getElementById('editAndResend').style.display = 'none'
}

// let currentPacket Not currently used
let currentPacketType

let lastFilter = ''
const filterInput = document.getElementById('filter')

function updateFilter () {
  const newValue = filterInput.value
  if (lastFilter !== newValue) {
    lastFilter = newValue
    deselectPacket()
    refreshPackets()
  }
}

setInterval(updateFilter, 100)

// TODO: Separate them like this
/* let hiddenPackets = {
  server: {}, client: {}
} */

let hiddenPackets = [
  // TODO: Do this properly
  // JE
  'update_time', 'position', 'position', 'keep_alive', 'keep_alive', 'rel_entity_move', 'position_look', 'look', 'position_look', 'map_chunk', 'update_light', 'entity_action', 'entity_update_attributes', 'unload_chunk', 'unload_chunk', 'update_view_position', 'entity_metadata',
  // BE
  'network_stack_latency', 'level_chunk', 'move_player', 'player_auth_input', 'network_chunk_publisher_update', 'client_cache_blob_status', 'client_cache_miss_response', 'move_entity_delta', 'set_entity_data', 'set_time', 'set_entity_data', 'set_entity_motion', /* "add_entity", */ 'level_event', 'level_sound_event2', 'update_attributes', 'entity_event', 'remove_entity', 'mob_armor_equipment', 'mob_equipment', 'update_block', 'player_action', 'move_entity_absolute'
]

// let dialogOpen = false Not currently used

let allPackets = []
let allPacketsHTML = []
let packetsUpdated = true

Split(['#packets', '#sidebar'], {
  minSize: [50, 75]
})

const scripting = require('./js/scripting.js')
scripting.setup()
const packetDom = require('./js/packetDom.js')
packetDom.setup(ipcRenderer, proxyCapabilities)
const ipcHandler = require('./js/ipcHandler.js')
ipcHandler.setup(ipcRenderer, allPackets, proxyCapabilities)

const packetList = document.getElementById('packetlist')
// const filteringPackets = document.getElementById('filtering-packets')
// const sidebar = document.getElementById('sidebar-box')

// Filtering - coming soon
/* function addPacketsToFiltering (packetsObject, direction) {
  for (var key in packetsObject) {
    if (packetsObject.hasOwnProperty(key)) {
      console.log(!hiddenPackets.includes(packetsObject[key]))
      filteringPackets.innerHTML +=
     `<li id="${escapeHtml(packetsObject[key])}" class="packet ${direction}">
        <input type="checkbox" ${!hiddenPackets.includes(packetsObject[key]) ? 'checked' : ''}></input>
        <span class="id">${escapeHtml(key)}</span>
        <span class="name">${escapeHtml(packetsObject[key])}</span>
      </li>`
      console.log(key + ' -> ' + packetsObject[key])
    }
  }
}

addPacketsToFiltering(toServerPackets, 'serverbound')
addPacketsToFiltering(toClientPackets, 'clientbound') */



// Update every 0.05 seconds
// TODO: Find a better way without updating on every packet (which causes lag)
window.setInterval(function () {
  if (packetsUpdated) {
    const wasScrolledToBottom = (packetList.parentElement.scrollTop >= (packetList.parentElement.scrollHeight - packetList.parentElement.offsetHeight))
    console.log(wasScrolledToBottom, (packetList.parentElement.scrollHeight - packetList.parentElement.offsetHeight) - packetList.parentElement.scrollTop)
    clusterize.update(allPacketsHTML)
    if (wasScrolledToBottom) {
      packetList.parentElement.scrollTop = packetList.parentElement.scrollHeight
      /* wasScrolledToBottom = (packetlist.parentElement.scrollTop >= (packetlist.parentElement.scrollHeight - packetlist.parentElement.offsetHeight))
      if (!wasScrolledToBottom) {
        debugger
      } */
    }
    packetsUpdated = false
  }
}, 50)

window.closeDialog = function () { // window. stops standardjs from complaining
                                   // dialogOpen = false
  document.getElementById('dialog-overlay').className = 'dialog-overlay'
  document.getElementById('dialog').innerHTML = ''
}

window.resendEdited = function (id, newValue) {
  try {
    ipcRenderer.send('injectPacket', JSON.stringify({
      meta: allPackets[id].meta,
      data: JSON.parse(newValue),
      direction: allPackets[id].direction
    }))
  } catch (err) {
    alert('Invalid JSON')
  }
}

function editAndResend (id) {
  if (!proxyCapabilities.modifyPackets) {
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

  document.getElementById('packetEditor').value = JSON.stringify(allPackets[id].data, null, 2)

  window.packetEditor = CodeMirror.fromTextArea(document.getElementById('packetEditor'), { // window. stops standardjs from complaining
    lineNumbers: false,
    autoCloseBrackets: true,
    theme: 'darcula'
  })
}

ipcRenderer.on('editAndResend', (event, arg) => { // Context menu
  const ipcMessage = JSON.parse(arg)
  editAndResend(ipcMessage.id)
})

function updateHidden () {
  const hiddenPacketsAmount = (allPackets.length - allPacketsHTML.length)
  document.getElementById('hiddenPackets').innerHTML = hiddenPacketsAmount + ' hidden packets'
  if (hiddenPacketsAmount !== 0) {
    document.getElementById('hiddenPackets').innerHTML += ' (<a href="#" onclick="showAllPackets()">show all</a>)'
  }
}

function deselectPacket () {
  // currentPacket = undefined
  currentPacketType = undefined
  treeElement.firstElementChild.innerHTML = 'No packet selected!'
  document.body.className = 'noPacketSelected'
}

window.clearPackets = function () { // window. stops standardjs from complaining
  allPackets = []
  allPacketsHTML = []
  deselectPacket()
  clusterize.update([])
}

window.showAllPackets = function () { // window. stops standardjs from complaining
  hiddenPackets = []
  refreshPackets()
  updateHidden()
}

window.packetClick = function (id) { // window. stops standardjs from complaining
                                     // currentPacket = id
  currentPacketType = document.getElementById('packet' + id).children[1].innerText
  document.body.className = 'packetSelected'
  if (proxyCapabilities.jsonData) {
    // sidebar.innerHTML = '<div style="padding: 10px;">Loading packet data...</div>';
    packetDom.getTree().loadData(allPackets[id].data)
  } else {
    treeElement.innerText = allPackets[id].data.data
    treeElement.style = `
    color: #0F0;
    white-space: pre;
    font-family: 'PT Mono', monospace;
    font-size: 14px;
    display: block;`
  }
}

function hideAll (id) {
  hiddenPackets.push(currentPacketType)
  deselectPacket()
  refreshPackets()
}

ipcRenderer.on('hideAllOfType', (event, arg) => { // Context menu
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
  ipcRenderer.send('contextMenu', JSON.stringify({
    direction: target.className.split(' ')[1],
    text: target.children[0].innerText + ' ' + target.children[1].innerText,
    id: target.id.replace('packet', '')
  }))
})

var clusterize = new Clusterize({
  rows: allPacketsHTML,
  scrollElem: packetList.parentElement,
  contentElem: packetList
})
