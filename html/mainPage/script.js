const { ipcRenderer } = require('electron');
// const escapeHtml = require('escape-html'); Already defined in my custonmised version of jsonTree (I just added HTML escaping)

var currentPacket = undefined;
var hiddenPackets = ["update_time", "position", "position", "keep_alive", "keep_alive", "rel_entity_move", "position_look", "look", "position_look", "map_chunk", "update_light", "entity_action", "entity_update_attributes", "unload_chunk", "unload_chunk", "update_view_position", "entity_metadata"];

var allPackets = [];

Split(['#packets', '#sidebar'], {
    minSize: [50, 75],
})

packetlist = document.getElementById("packetlist");
sidebar = document.getElementById("sidebar-box");
treeElement = document.getElementById("tree");

var tree = jsonTree.create({}, treeElement);
treeElement.firstElementChild.innerHTML = "No packet selected!"

function trimData(data) { // Function to trim the size of stringified data for previews
  newData = Object.assign({}, data);
  Object.entries(newData).forEach(function(entry) {
    try {
      if (JSON.stringify(entry[1]).length > 15) {
        if (typeof entry[1] == "number") {
          newData[entry[0]] = Math.round((entry[1] + Number.EPSILON) * 100) / 100
        } else {
          newData[entry[0]] = "...";
        }
      }
    } catch(err) {

    }
  });
  newData = JSON.stringify(newData);
  if (newData.length > 750) {
    newData = newData.slice(0, 750);
  }
  return newData;
}

/* ipcRenderer.on('packetDetails', (event, arg) => {
  ipcMessage = JSON.parse(arg);
  tree.loadData(ipcMessage.data);
  // sidebar.innerHTML = `<div style="padding: 10px;">${JSON.stringify(ipcMessage.data)}</div>`;
}); All handled here in the renderer now */

function refreshPackets() {
  packetlist.innerHTML = "";
  allPackets.forEach(function(packet) {
    addPacketToDOM(packet);
  });
}

function addPacketToDOM(packet) {
  if (hiddenPackets.includes(packet.meta.name)) {
    updateHidden();
    return;
  }
  if (packetlist.childElementCount > 100) {
   packetlist.removeChild(packetlist.childNodes[0]);
  }
  packetlist.innerHTML += `<li id="packet${allPackets.length - 1}" onclick="packetClick(${allPackets.length - 1})" class="packet ${packet.direction}">
               <span class="id">${escapeHtml(packet.hexIdString)}</span>
               <span class="name">${escapeHtml(packet.meta.name)}</span>
               <span class="data">${escapeHtml(trimData(packet.data))}</span>
             </li>`; // TODO: Fix this mess
  updateHidden();
}

ipcRenderer.on('packet', (event, arg) => {
  ipcMessage = JSON.parse(arg);
  allPackets.push(ipcMessage);
  addPacketToDOM(ipcMessage);
});

/* ipcRenderer.on('asynchronous-message', (event, arg) => {
  ipcMessage = JSON.parse(arg);
  switch(ipcMessage.name) {
     case "packet":
        if (commonPackets.includes(ipcMessage.packetName)) {
          break;
        }
        if (hiddenPackets.includes(ipcMessage.packetName)) {
          break;
        }
       if (packetlist.childElementCount > 100) {
         packetlist.removeChild(packetlist.childNodes[0]);
       }
       packetlist.innerHTML += `<li id="packet${ipcMessage.id}" onclick="packetClick(${ipcMessage.id})" class="packet ${ipcMessage.direction}">
                     <span class="name">${ipcMessage.packetName}</span>
                     <span class="data">${ipcMessage.data}</span>
                   </li>`; // TODO: Fix this mess
       break;
     default:
       console.log("Unknown IPC message: " + ipcMessage.name)
   }
}) */
function updateHidden() {
  hiddenPacketsAmount = allPackets.length - packetlist.childElementCount;
  document.getElementById("hiddenPackets").innerHTML = hiddenPacketsAmount + ' hidden packets';
  if (hiddenPacketsAmount != 0) {
     document.getElementById("hiddenPackets").innerHTML += ' (<a href="#" onclick="showAllPackets()">show all</a>)'
  }
}

function deselectPacket() {
  currentPacket = undefined;
  treeElement.firstElementChild.innerHTML = "No packet selected!";
  document.body.className = "noPacketSelected";
}

function clearPackets() {
  allPackets = [];
  packetlist.innerHTML = "";
  deselectPacket();
}

function showAllPackets() {
  hiddenPackets = [];
  refreshPackets();
}

function packetClick(id) {
  currentPacket = id;
  document.body.className = "packetSelected";
  // sidebar.innerHTML = '<div style="padding: 10px;">Loading packet data...</div>';
  tree.loadData(allPackets[id].data);
}

function hideAll(id) {
  // TODO: Better solution
  packetToHide = document.getElementById("packet" + id).children[1].innerText;
  hiddenPackets.push(packetToHide);
  deselectPacket();
  refreshPackets();
}
