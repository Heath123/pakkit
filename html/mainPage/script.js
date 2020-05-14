const { ipcRenderer } = require('electron');

currentPacket = undefined;
hiddenPackets = []; // TODO: Handle this in index.js and re-request
commonPackets = ["update_time", "position", "position", "keep_alive", "keep_alive", "rel_entity_move", "position_look", "look", "position_look", "map_chunk", "update_light", "entity_action", "entity_update_attributes", "unload_chunk", "unload_chunk", "update_view_position", "entity_metadata"];

Split(['#packets', '#sidebar'], {
    minSize: [50, 75],
})

packetlist = document.getElementById("packetlist");
sidebar = document.getElementById("sidebar-box");

ipcRenderer.on('packetDetails', (event, arg) => {
  ipcMessage = JSON.parse(arg);
  var tree = jsonTreeViewer.parse(JSON.stringify(ipcMessage.data), sidebar);
  // sidebar.innerHTML = `<div style="padding: 10px;">${JSON.stringify(ipcMessage.data)}</div>`;
});

ipcRenderer.on('packet', (event, arg) => {
  ipcMessage = JSON.parse(arg);
  if (commonPackets.includes(ipcMessage.packetName)) {
    return;
  }
  if (hiddenPackets.includes(ipcMessage.packetName)) {
    return;
  }
  if (packetlist.childElementCount > 100) {
   packetlist.removeChild(packetlist.childNodes[0]);
  }
  packetlist.innerHTML += `<li id="packet${ipcMessage.id}" onclick="packetClick(${ipcMessage.id})" class="packet ${ipcMessage.direction}">
               <span class="id">${ipcMessage.packetId}</span>
               <span class="name">${ipcMessage.packetName}</span>
               <span class="data">${ipcMessage.data}</span>
             </li>`; // TODO: Fix this mess
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

function packetClick(id) {
  currentPacket = id;
  document.body.className = "packetSelected";
  // sidebar.innerHTML = '<div style="padding: 10px;">Loading packet data...</div>';
  ipcRenderer.send('requestPacketDetails', JSON.stringify({
    id: id
  }))
}

function hideAll(id) {
  // TODO: Better solution
  packetToHide = document.getElementById("packet" + id).firstElementChild.innerText;
  hiddenPackets.push(packetToHide); // TODO: Delete all current hidden packets
}
