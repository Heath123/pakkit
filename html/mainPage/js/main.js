/* global Split, jsonTree, escapeHtml, alert, CodeMirror */

const Store = require('electron-store');

const axios = require('axios')

const Clusterize = require('clusterize.js')
const filteringLogic = require('./js/filteringLogic.js')

// const escapeHtml = require('escape-html'); Already defined in my customised version of jsonTree (I just added HTML escaping)

let currentPacket
let currentPacketType

const filterInput = document.getElementById('filter')

const hiddenPacketsCounter = document.getElementById('hiddenPackets')

// Should improve performance by excluding hidden packets
function wrappedClusterizeUpdate (htmlArray) {
  sharedVars.hiddenPacketsAmount = 0
  const newArray = []
  for (const item of htmlArray) {
    // If the packet is hidden
    if (item[0].match(/<li .* class=".*filter-hidden">/)) {
      sharedVars.hiddenPacketsAmount += 1
    } else {
      newArray.push(item)
    }
  }
  clusterize.update(newArray)
  hiddenPacketsCounter.innerHTML = sharedVars.hiddenPacketsAmount + ' hidden packets';
  if (sharedVars.hiddenPacketsAmount != 0) {
    hiddenPacketsCounter.innerHTML += ' (<a href="#" onclick="showAllPackets()">show all</a>)'
  }
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
  box.checked = !box.checked

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

  updateFiltering()
  updateFilteringStorage()
}

function updateFilterBox () {
  const newValue = filterInput.value
  if (sharedVars.lastFilter !== newValue) {
    sharedVars.lastFilter = newValue
    deselectPacket()
    updateFiltering()
  }
}

function updateFiltering () {
  const inverseFiltering = sharedVars.settings.getSetting('inverseFiltering')
  const regexFilter = sharedVars.settings.getSetting('regexFilter')
  let regex
  if (regexFilter) {
    try {
      regex = new RegExp(sharedVars.lastFilter)
    } catch (err) {
      // TODO: handle
      console.error(err)
      regex = new RegExp("")
    }
  }
  sharedVars.allPacketsHTML.forEach(function (item, index, array) {
    if (!filteringLogic.packetFilteredByFilterBox(sharedVars.allPackets[index],
          regexFilter ? regex : sharedVars.lastFilter,
          sharedVars.hiddenPackets,
          inverseFiltering,
          regexFilter,
          sharedVars)) {
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

setInterval(updateFilterBox, 100)

/* let hiddenPackets = [
  // TODO: Do this properly
  // JE
  'update_time', 'position', 'position', 'keep_alive', 'keep_alive', 'rel_entity_move', 'position_look', 'look', 'position_look', 'map_chunk', 'update_light', 'entity_action', 'entity_update_attributes', 'unload_chunk', 'unload_chunk', 'update_view_position', 'entity_metadata',
  // BE
  'network_stack_latency', 'level_chunk', 'move_player', 'player_auth_input', 'network_chunk_publisher_update', 'client_cache_blob_status', 'client_cache_miss_response', 'move_entity_delta', 'set_entity_data', 'set_time', 'set_entity_data', 'set_entity_motion', /* "add_entity", *//* 'level_event', 'level_sound_event2', 'update_attributes', 'entity_event', 'remove_entity', 'mob_armor_equipment', 'mob_equipment', 'update_block', 'player_action', 'move_entity_absolute'
] */

// let dialogOpen = false Not currently used

const defaultHiddenPackets = {
  serverbound: ['position', 'position_look', 'look', 'keep_alive', 'entity_action'],
  clientbound: ['keep_alive', 'update_time', 'rel_entity_move', 'entity_teleport', 'map_chunk', 'update_light', 'update_view_position', 'entity_metadata', 'entity_update_attributes', 'unload_chunk', 'entity_velocity', 'entity_move_look', 'entity_head_rotation']
}

const sharedVars = {
  allPackets: [],
  allPacketsHTML: [],
  proxyCapabilities: {},
  ipcRenderer: require('electron').ipcRenderer,
  packetList: document.getElementById('packetlist'),
  hiddenPackets: undefined,
  scripting: undefined,
  lastFilter: '',
  hiddenPacketsAmount: 0,
  store: new Store()
}

sharedVars.proxyCapabilities = JSON.parse(sharedVars.ipcRenderer.sendSync('proxyCapabilities', ''))

function getVersionSpecificVar(name, defaultValue) {
  const versionId = 'version-' + sharedVars.proxyCapabilities.versionId
  const settingsObject = sharedVars.store.get(versionId)
  if (settingsObject) {
    if (!settingsObject[name]) {
      settingsObject[name] = JSON.stringify(defaultValue)
      sharedVars.store.set(versionId, settingsObject)
    }
  } else {
    sharedVars.store.set(versionId, {
      [name]: JSON.stringify(defaultValue)
    })
  }
  return JSON.parse(sharedVars.store.get(versionId)[name])
}

function setVersionSpecificVar(name, value) {
  const versionId = 'version-' + sharedVars.proxyCapabilities.versionId
  const settingsObject = sharedVars.store.get(versionId)
  settingsObject[name] = JSON.stringify(value)
  sharedVars.store.set(versionId, settingsObject)
}

const defaultsJson = require('./js/defaults.json')

function findDefault(setting) {
  const versionId = sharedVars.proxyCapabilities.versionId
  for (const key in defaultsJson) {
    const regex = new RegExp(key)
    if (versionId.match(regex)) {
      return defaultsJson[key][setting]
    }
  }
}

if (!findDefault('useExtendedPresets')) {
  document.getElementById('extendedPresets').style.display = 'none'
}

sharedVars.hiddenPackets = getVersionSpecificVar('hiddenPackets', findDefault('hiddenPackets'))

if (!sharedVars.proxyCapabilities.scriptingSupport) {
  document.getElementById('scriptingTab').style.display = 'none'
}

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
sharedVars.settings = require('./js/settings.js')
sharedVars.settings.bindToSettingChange('showTimes', (newValue) => {
  if (newValue) {
    document.body.classList.remove('timeNotShown')
    document.body.classList.add('timeShown')
  } else {
    document.body.classList.remove('timeShown')
    document.body.classList.add('timeNotShown')
  }
})
sharedVars.settings.bindToSettingChange('inverseFiltering', (newValue) => {
  try {
    deselectPacket()
    updateFiltering()
  } catch (e) {}
})
sharedVars.settings.bindToSettingChange('regexFilter', (newValue) => {
  try {
    deselectPacket()
    updateFiltering()
  } catch (e) {}
})
sharedVars.settings.setup(sharedVars)



// const sidebar = document.getElementById('sidebar-box')

// TODO: move to own file
const filteringPackets = document.getElementById('filtering-packets')

function updateFilteringStorage () {
  setVersionSpecificVar('hiddenPackets', sharedVars.hiddenPackets)
}

function updateFilteringTab () {
  for (const item of filteringPackets.children) {
    const name = item.children[2].textContent

    const checkbox = item.firstElementChild
    checkbox.readOnly = false
    checkbox.indeterminate = false
    let isShown = true
    if (item.className.includes('serverbound') &&
      sharedVars.hiddenPackets.serverbound.includes(name)) {
      isShown = false
    } else if (item.className.includes('clientbound') &&
      sharedVars.hiddenPackets.clientbound.includes(name)) {
      isShown = false
    }

    checkbox.checked = isShown
  }

  updateFiltering()
  updateFilteringStorage()
}

const allServerboundPackets = []
const allClientboundPackets = []

window.updateFilteringPackets = () => {
  function addPacketsToFiltering (packetsObject, direction, appendTo) {
    console.log('packets', packetsObject)
    for (const key in packetsObject) {
      if (packetsObject.hasOwnProperty(key)) {
        console.log(!sharedVars.hiddenPackets[direction].includes(packetsObject[key]))
        filteringPackets.innerHTML +=
          `<li id="${packetsObject[key].replace(/"/g, '&#39;') + '-' + direction}" class="packet ${direction}" onclick="toggleCheckbox(this.firstElementChild, 'teleport_confirm', 'serverbound')">
        <input type="checkbox" ${!sharedVars.hiddenPackets[direction].includes(packetsObject[key]) ? 'checked' : ''}
            onclick="toggleCheckbox(this, ${JSON.stringify(packetsObject[key]).replace(/"/g, '&#39;')}, '${direction}')"/>
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
}

window.updateFilteringPackets()

// Update every 0.05 seconds
// TODO: Find a better way without updating on every packet (which causes lag)
window.setInterval(function () {
  if (sharedVars.packetsUpdated) {
    const diff = (sharedVars.packetList.parentElement.scrollHeight - sharedVars.packetList.parentElement.offsetHeight) - sharedVars.packetList.parentElement.scrollTop
    const wasScrolledToBottom = diff < 3 // If it was scrolled to the bottom or almost scrolled to the bottom
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
  document.getElementById('dialog').className='dialog'
  document.getElementById('dialog').innerHTML =

   `<h2>Edit and resend packet</h2>
    <textarea id="packetEditor"></textarea>
    <button style="margin-top: 16px;" onclick="resendEdited(${id}, packetEditor.getValue())">Send</button>
    <button style="margin-top: 16px;" class="bottom-button" onclick="closeDialog()">Close</button>`

  document.getElementById('packetEditor').value = JSON.stringify(sharedVars.allPackets[id].data, null, 2)

  window.packetEditor = CodeMirror.fromTextArea(document.getElementById('packetEditor'), { // window. stops standardjs from complaining
    lineNumbers: false,
    autoCloseBrackets: true,
    theme: 'darcula'
  })
}

function errorDialog(header, info, fatal) {
  // dialogOpen = true
  document.getElementById('dialog-overlay').className = 'dialog-overlay active'
  document.getElementById('dialog').className='dialog dialog-small error-dialog'
  document.getElementById('dialog').innerHTML =

 `<h2>${header}</h2>
  ${info}
  <br>
  <button style="margin-top: 16px;" class="bottom-button" onclick="${fatal ? 'sharedVars.ipcRenderer.send(\'relaunchApp\', \'\')' : 'closeDialog()' }">Close</button>`
}

function loginDialog(callback) {
  // dialogOpen = true
  window.loginFormHandler = function (event) {
    if (event === 'cancel') {
      callback({cancelled: true})
      closeDialog()
      return
    }
    event.preventDefault()
    callback({
      cancelled: false,
      email: document.getElementById('login-email').value,
      password: document.getElementById('login-password').value
    })
    closeDialog()
  }

  document.getElementById('dialog-overlay').className = 'dialog-overlay active'
  document.getElementById('dialog').className='dialog dialog-medium'
  document.getElementById('dialog').innerHTML =
 `<form onsubmit="loginFormHandler(event); return false;"> <!-- TODO: prevent page reload? and handle login -->
    <h2>This server is in online mode</h2>
    Please log in to your Minecraft account then reconnect.
    <br><br>
    pakkit does not store passwords, though it may store authentication tokens.
    <br><br>
    <input placeholder="Email" type="text" style="width: calc(100% - 24px);" id="login-email">
    <br><br>
    <input placeholder="Password" type="password" style="width: calc(100% - 24px);" id="login-password">
    <br>
    <input style="margin-top: 16px; margin-right: 8px;" type="submit" value="Log in">
    
    <!-- Need to specify that this is a button so it doesn't submit the form: https://stackoverflow.com/questions/932653/how-to-prevent-buttons-from-submitting-forms -->
    <button style="margin-top: 16px;" onclick="loginFormHandler('cancel')" type="button">Cancel</button>
  </form>`
}

sharedVars.ipcRenderer.on('requestManualAuth', (event, arg) => {
  loginDialog((data) => {
    if (!data.cancelled) {
      sharedVars.ipcRenderer.send('setManualAuth', JSON.stringify(data))
    }
  })
})

sharedVars.ipcRenderer.on('editAndResend', (event, arg) => {
  const ipcMessage = JSON.parse(arg)
  editAndResend(ipcMessage.id)
})

function deselectPacket () {
  if (currentPacket) {
    removeOrAddSelection(currentPacket, false)
  }
  currentPacket = undefined
  currentPacketType = undefined
  sharedVars.packetDom.getTreeElement().firstElementChild.innerHTML = 'No packet selected!'
  document.body.classList.remove('packetSelected')
  document.body.classList.add('noPacketSelected')
  hexViewer.style.display = 'none'
}

window.clearPackets = function () { // window. stops standardjs from complaining
  deselectPacket()
  sharedVars.allPackets = []
  sharedVars.allPacketsHTML = []
  sharedVars.packetsUpdated = true
  // TODO: Doesn't seem to work? When removing line above it doesn't do anything until the next packet
  wrappedClusterizeUpdate([])
}

window.showAllPackets = function () { // window. stops standardjs from complaining
  sharedVars.hiddenPackets = {
    serverbound: [], clientbound: []
  }
  updateFilteringTab()
}

const hexViewer = document.getElementById('hex-viewer')

function removeOrAddSelection (id, add) {
  const fakeElement = document.createElement('div')
  fakeElement.innerHTML = sharedVars.allPacketsHTML[id][0]
  if (add) {
    fakeElement.firstChild.classList.add('selected')
  } else {
    fakeElement.firstChild.classList.remove('selected')
  }
  sharedVars.allPacketsHTML[id] = [fakeElement.innerHTML]

  wrappedClusterizeUpdate(sharedVars.allPacketsHTML)
  clusterize.refresh()
}

window.packetClick = function (id) { // window. stops standardjs from complaining
  // Remove selection background from old selected packet
  if (currentPacket) {
    removeOrAddSelection(currentPacket, false)
  }

  currentPacket = id
  // const element = document.getElementById('packet' + id)
  currentPacketType = sharedVars.allPackets[id].name
  removeOrAddSelection(currentPacket, true)
  document.body.classList.remove('noPacketSelected')
  document.body.classList.add('packetSelected')
  if (sharedVars.proxyCapabilities.jsonData) {
    // sidebar.innerHTML = '<div style="padding: 10px;">Loading packet data...</div>';
    sharedVars.packetDom.getTree().loadData(sharedVars.allPackets[id].data)
  } else {
    sharedVars.packetDom.getTreeElement().innerText = sharedVars.allPackets[id].data.data
    sharedVars.packetDom.getTreeElement().style = `
    color: #0F0;
    white-space: pre;
    font-family: 'PT Mono', monospace;
    font-size: 14px;
    display: block;`
  }

  if (sharedVars.proxyCapabilities.rawData) {
    hexViewer.style.display = 'block'
    hexViewer.contentWindow.postMessage(Buffer.from(sharedVars.allPackets[id].raw))
  }

  scrollWikiToCurrentPacket()
}

function hideAll (id) {
  const packet = sharedVars.allPackets[id]
  if (sharedVars.hiddenPackets[packet.direction].indexOf(packet.meta.name) === -1) {
    sharedVars.hiddenPackets[packet.direction].push(packet.meta.name)
  }
  const packetElement = document.getElementById(packet.meta.name + '-' + packet.direction)
  if (packetElement) {
    const checkbox = packetElement.firstElementChild
    checkbox.checked = false
    checkbox.readOnly = false
    checkbox.indeterminate = false
  }
  deselectPacket()
  updateFiltering()
  updateFilteringStorage()
}

sharedVars.ipcRenderer.on('hideAllOfType', (event, arg) => { // Context menu
  const ipcMessage = JSON.parse(arg)
  hideAll(ipcMessage.id)
})

// Modified from W3Schools
window.openMenu = function (evt, MenuName, id) { // window. stops standardjs from complaining
  let i, tabcontent, tablinks
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

  let attempts = 0
  while (target.tagName !== 'LI' && attempts < 5) {
    target = target.parentElement
    attempts++
  }

  if (!target || target.tagName !== 'LI') {
    return
  }

  // Don't allow right clicking in the filtering tab or on other places
  if (target.parentElement.parentElement.id !== 'packetcontainer') {
    return
  }

  sharedVars.ipcRenderer.send('contextMenu', JSON.stringify({
    direction: target.className.split(' ')[1],
    text: target.children[0].children[0].innerText + ' ' + target.children[0].children[1].innerText,
    id: target.id.replace('packet', '')
  }))
})

var clusterize = new Clusterize({
  rows: sharedVars.allPacketsHTML,
  scrollElem: sharedVars.packetList.parentElement,
  contentElem: sharedVars.packetList,
  no_data_text: ''
})

// TODO: move to own file?
async function fillWiki () {
  let data = (await axios.get(sharedVars.proxyCapabilities.wikiVgPage)).data
// Allow it to load properly
  data = data
    .split('/images/')
    .join('https://wiki.vg/images/')
    .split('/resources/assets/')
    .join('https://wiki.vg/resources/assets/')
    .split('/load.php?')
    .join('https://wiki.vg/load.php?')

  // TODO: Break or modify links?
  document.getElementById('iframe').contentWindow.document.write(data)

  const style = document.createElement('style');

  style.innerHTML =
     `::-webkit-scrollbar {
          width: 17px;
      }
      
      ::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 10px;
      }
      ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 10px;
      }
      
      ::-webkit-scrollbar-thumb:hover {
        background: rgba(0, 0, 0, 0.5);
      }
      
      ::-webkit-scrollbar-corner {
        background: #242424;
      }
      
      /* Cut off the left panel */
      #content, #left-navigation {
        margin-left: 0;
      }
      
      #mw-panel {
        display: none;
      }
      `

  document.getElementById('iframe').contentDocument.head.appendChild(style)
}

if (sharedVars.proxyCapabilities.wikiVgPage) {
  fillWiki()
} else {
  document.getElementById('wiki-button').style.display = 'none'
}

// https://gomakethings.com/finding-the-next-and-previous-sibling-elements-that-match-a-selector-with-vanilla-js/
function getPreviousSibling (elem, selector) {

  // Get the next sibling element
  var sibling = elem.previousElementSibling;

  // If there's no selector, return the first sibling
  if (!selector) return sibling;

  // If the sibling matches our selector, use it
  // If not, jump to the next sibling and continue the loop
  while (sibling) {
    if (sibling.matches(selector)) return sibling;
    sibling = sibling.previousElementSibling;
  }

};

function scrollIdIntoView (id, bound) {
  // https://stackoverflow.com/questions/3813294/how-to-get-element-by-innertext
  const tdTags = document.getElementById('iframe').contentDocument.getElementsByTagName("td");
  const searchRegex = new RegExp(`^<tr>\n<td( rowspan="[0-9]*")?>${id.toUpperCase().split('0X').join('0x')}\n<\/td>\n(<td( rowspan="[0-9]*")?>Play\n<\/td>\n)?<td( rowspan="[0-9]*")?>(${bound === 'serverbound' ? 'Server' : 'Client'}|Server &amp; Client)\n<\/td>`, 'm')
  let found;

  for (var i = 0; i < tdTags.length; i++) {
    // console.log(tdTags[i].parentElement.outerHTML)
    if (tdTags[i].parentElement.outerHTML.match(searchRegex)) {
      found = tdTags[i];
      break;
    }
  }
  getPreviousSibling(found.closest('table'), 'h4').scrollIntoView()
}

function scrollWikiToCurrentPacket () {
  if (currentPacket) {
    const packet = sharedVars.allPackets[currentPacket]
    try {
      scrollIdIntoView(packet.hexIdString, packet.direction)
    } catch (err) {
      console.error(err);
    }
  }
}

function saveLog() {
  sharedVars.ipcRenderer.send('saveLog', JSON.stringify(sharedVars.allPackets))
}

function loadLog() {
  sharedVars.ipcRenderer.send('loadLog', '')
}
