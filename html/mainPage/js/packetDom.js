let tree
let treeElement
let sharedVars

const filteringLogic = require('./filteringLogic.js')

function trimData (data) { // Function to trim the size of stringified data for previews
  let newData
  if (sharedVars.proxyCapabilities.jsonData) {
    newData = Object.assign({}, data)
    Object.entries(newData).forEach(function (entry) {
      try {
        if (JSON.stringify(entry[1]).length > 15) {
          if (typeof entry[1] === 'number') {
            newData[entry[0]] = Math.round((entry[1] + Number.EPSILON) * 100) / 100
          } else {
            newData[entry[0]] = '...'
          }
        }
      } catch (err) {

      }
    })
    newData = JSON.stringify(newData)
  } else {
    newData = data.data
  }
  if (newData.length > 750) {
    newData = newData.slice(0, 750)
  }
  return newData
}

function addPacketToDOM (packet) {
  sharedVars.allPacketsHTML.push([
    `<li id="packet${packet.uid}" onclick="packetClick(${packet.uid})" class="packet ${packet.direction} ${
      filteringLogic.packetFilteredByFilterBox(packet, sharedVars.lastFilter, sharedVars.hiddenPackets) ? 'filter-hidden' : 'filter-shown'
    }">
        <span class="id">${escapeHtml(packet.hexIdString)}</span>
        <span class="name">${escapeHtml(packet.meta.name)}</span>
        <span class="data">${escapeHtml(trimData(packet.data))}</span>
      </li>`])
  /* if (!noUpdate) {
    clusterize.append(sharedVars.allPacketsHTML.slice(-1)[0]);
    if (wasScrolledToBottom) {
      sharedVars.packetList.parentElement.scrollTop = sharedVars.packetList.parentElement.scrollHeight;
    }
  } */
  sharedVars.packetsUpdated = true

  updateHidden()
}

function refreshPackets () {
  // TODO: Is this needed?
  /* const wasScrolledToBottom = (sharedVars.packetList.parentElement.scrollTop >= (sharedVars.packetList.parentElement.scrollHeight - sharedVars.packetList.parentElement.offsetHeight))

  sharedVars.allPacketsHTML = []
  sharedVars.allPackets.forEach(function (packet) {
    // noUpdate is true as we want to manually update at the end
    addPacketToDOM(packet, true)
  })
  clusterize.update(sharedVars.allPacketsHTML)
  /if (wasScrolledToBottom) {
    sharedVars.packetList.parentElement.scrollTop = sharedVars.packetList.parentElement.scrollHeight
  } */
}

function updateHidden() {
  // TODO: make it work
  /* hiddenPacketsAmount = (sharedVars.allPackets.length - sharedVars.allPacketsHTML.length);
  document.getElementById("hiddenPackets").innerHTML = hiddenPacketsAmount + ' hidden packets';
  if (hiddenPacketsAmount != 0) {
     document.getElementById("hiddenPackets").innerHTML += ' (<a href="#" onclick="showAllPackets()">show all</a>)'
  } */
}

exports.setup = function (passedSharedVars) {
  sharedVars = passedSharedVars

  treeElement = document.getElementById('tree')
  tree = jsonTree.create({}, treeElement)

  treeElement.firstElementChild.innerHTML = 'No packet selected!'
}

exports.addPacket = function (data) {
  sharedVars.allPackets.push(data)
  data.uid = sharedVars.allPackets.length - 1
  addPacketToDOM(data)
}

// TODO: use shared var

exports.getTreeElement = function () {
  return treeElement
}

exports.getTree = function () {
  return tree
}