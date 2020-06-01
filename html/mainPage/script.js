const { ipcRenderer } = require('electron');
const Clusterize = require('clusterize.js');
// const escapeHtml = require('escape-html'); Already defined in my customised version of jsonTree (I just added HTML escaping)

const proxyCapabilities = JSON.parse(ipcRenderer.sendSync('proxyCapabilities', ''));

if (!proxyCapabilities.modifyPackets) {
  document.getElementById("editAndResend").style.display = "none";
}

var currentPacket = undefined;
var currentPacketType = undefined;
var hiddenPackets = [
  // TODO: Do this properly
  // JE
  "update_time", "position", "position", "keep_alive", "keep_alive", "rel_entity_move", "position_look", "look", "position_look", "map_chunk", "update_light", "entity_action", "entity_update_attributes", "unload_chunk", "unload_chunk", "update_view_position", "entity_metadata",
  // BE
  "network_stack_latency", "level_chunk", "move_player", "player_auth_input", "network_chunk_publisher_update", "client_cache_blob_status", "client_cache_miss_response", "move_entity_delta", "set_entity_data", "set_time", "set_entity_data", "set_entity_motion", /* "add_entity", */ "level_event", "level_sound_event2", "update_attributes", "entity_event", "remove_entity", "mob_armor_equipment", "mob_equipment", "update_block", "player_action", "move_entity_absolute"
];
var dialogOpen = false;

var allPackets = [];
var allPacketsHTML = [];
packetsUpdated = true;

Split(['#packets', '#sidebar'], {
    minSize: [50, 75],
});

packetlist = document.getElementById("packetlist");
sidebar = document.getElementById("sidebar-box");
treeElement = document.getElementById("tree");

var tree = jsonTree.create({}, treeElement);
treeElement.firstElementChild.innerHTML = "No packet selected!"

function trimData(data) { // Function to trim the size of stringified data for previews
  if (proxyCapabilities.jsonData) {
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
  } else {
    newData = data.data;
  }
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
  var wasScrolledToBottom = (packetlist.parentElement.scrollTop >= (packetlist.parentElement.scrollHeight - packetlist.parentElement.offsetHeight));
  /* packetlist.innerHTML = "";
  packetsToAdd = [];
  var i;
  var packetsAdded = 0;
  for (i = allPackets.length - 1; packetsAdded < 300 && !(i == -1); i--) {
    if (!hiddenPackets.includes(allPackets[i].meta.name)) {
      packetsToAdd.push(allPackets[i]);
      packetsAdded++;
    }
  } */
  var allPacketsHTML = [];
  allPackets.forEach(function(packet) {
    // noUpdate is true as we want to manually update at the end
    addPacketToDOM(packet, true);
  });
  clusterize.update(allPacketsHTML);
  if (wasScrolledToBottom) {
    packetlist.parentElement.scrollTop = packetlist.parentElement.scrollHeight;
  }
}

function addPacketToDOM(packet, noUpdate) {
  if (!noUpdate) {
    var wasScrolledToBottom = (packetlist.parentElement.scrollTop >= (packetlist.parentElement.scrollHeight - packetlist.parentElement.offsetHeight));
  }
  if (hiddenPackets.includes(packet.meta.name)) {
    updateHidden();
    return;
  }
  allPacketsHTML.push([
   `<li href="#test" src="test.png" id="packet${packet.uid}" onclick="packetClick(${packet.uid})" class="packet ${packet.direction}">
      <span class="id">${escapeHtml(packet.hexIdString)}</span>
      <span class="name">${escapeHtml(packet.meta.name)}</span>
      <span class="data">${escapeHtml(trimData(packet.data))}</span>
    </li>`]);
  /* if (!noUpdate) {
    clusterize.append(allPacketsHTML.slice(-1)[0]);
    if (wasScrolledToBottom) {
      packetlist.parentElement.scrollTop = packetlist.parentElement.scrollHeight;
    }
  } */
  packetsUpdated = true;
    // packetlist.style.paddingTop =  offScreenCount * 30 + "px"; // TODO: Make it so you can view these packets
  /* if (offScreenCount % 2 == 0) {
    packetlist.className = "packetlist evenNumberHidden";
  } else {
    packetlist.className = "packetlist oddNumberHidden";
  } Maybe add back but differently */

  updateHidden();
}

ipcRenderer.on('packet', (event, arg) => {
  ipcMessage = JSON.parse(arg);
  allPackets.push(ipcMessage);
  ipcMessage.uid = allPackets.length - 1;
  addPacketToDOM(ipcMessage, true);
});

// Update every 0.05 seconds
// TODO: Find a better way without updating on every packet (which causes lag)
window.setInterval(function() {
  if (packetsUpdated) {
    var wasScrolledToBottom = (packetlist.parentElement.scrollTop >= (packetlist.parentElement.scrollHeight - packetlist.parentElement.offsetHeight));
    console.log(wasScrolledToBottom, (packetlist.parentElement.scrollHeight - packetlist.parentElement.offsetHeight) - packetlist.parentElement.scrollTop);
    clusterize.update(allPacketsHTML);
    if (wasScrolledToBottom) {
      packetlist.parentElement.scrollTop = packetlist.parentElement.scrollHeight;
      var wasScrolledToBottom = (packetlist.parentElement.scrollTop >= (packetlist.parentElement.scrollHeight - packetlist.parentElement.offsetHeight));
      if (!wasScrolledToBottom) {
        debugger;
      }
    }
    packetsUpdated = false;
  }
}, 50);

ipcRenderer.on('copyPacketData', (event, arg) => {
  ipcMessage = JSON.parse(arg);
  data = allPackets[ipcMessage.id].data;
  data = proxyCapabilities.jsonData ? JSON.stringify(data, null, 2) : data.data;
  ipcRenderer.send('copyToClipboard', data);
});

function closeDialog() {
  dialogOpen = false;
  document.getElementById("dialog-overlay").className = "dialog-overlay";
  document.getElementById("dialog").innerHTML = "";
}

function resendEdited(id, newValue) {
  try {
    ipcRenderer.send('injectPacket', JSON.stringify({
      meta: allPackets[id].meta,
      data: JSON.parse(newValue),
      direction:  allPackets[id].direction
    }))
  } catch (err) {
    alert("Invalid JSON");
  }
}

function editAndResend(id) {
  if (!proxyCapabilities.modifyPackets) {
    alert("Edit and Resend is unavailable");
    return;
  }

  dialogOpen = true;
  document.getElementById("dialog-overlay").className = "dialog-overlay active";
  document.getElementById("dialog").innerHTML =

 `<h2>Edit and resend packet</h2>
  <textarea id="packetEditor"></textarea>
  <button style="margin-top: 16px;" onclick="resendEdited(${id}, packetEditor.getValue())">Send</button>
  <button style="margin-top: 16px;" onclick="closeDialog()">Close</button>`;

  document.getElementById("packetEditor").value = JSON.stringify(allPackets[id].data, null, 2);

  packetEditor = CodeMirror.fromTextArea(document.getElementById("packetEditor"), {
    lineNumbers: false,
    autoCloseBrackets: true,
    theme: "darcula",
  });
}

ipcRenderer.on('editAndResend', (event, arg) => { // Context menu
  ipcMessage = JSON.parse(arg);
  editAndResend(ipcMessage.id);
});

function updateHidden() {
  hiddenPacketsAmount = (allPackets.length - allPacketsHTML.length);
  document.getElementById("hiddenPackets").innerHTML = hiddenPacketsAmount + ' hidden packets';
  if (hiddenPacketsAmount != 0) {
     document.getElementById("hiddenPackets").innerHTML += ' (<a href="#" onclick="showAllPackets()">show all</a>)'
  }
}

function deselectPacket() {
  currentPacket = undefined;
  currentPacketType = undefined;
  treeElement.firstElementChild.innerHTML = "No packet selected!";
  document.body.className = "noPacketSelected";
}

function clearPackets() {
  allPackets = [];
  allPacketsHTML = [];
  deselectPacket();
  clusterize.update([]);
}

function showAllPackets() {
  hiddenPackets = [];
  refreshPackets();
  updateHidden();
}

function packetClick(id) {
  currentPacket = id;
  currentPacketType = document.getElementById("packet" + id).children[1].innerText;
  document.body.className = "packetSelected";
  if (proxyCapabilities.jsonData) {
    // sidebar.innerHTML = '<div style="padding: 10px;">Loading packet data...</div>';
    tree.loadData(allPackets[id].data);
  } else {
    treeElement.innerText = allPackets[id].data.data;
    treeElement.style = `
    color: #0F0;
    white-space: pre;
    font-family: 'PT Mono', monospace;
    font-size: 14px;
    display: block;`
  }
}

function hideAll(id) {
  hiddenPackets.push(currentPacketType);
  deselectPacket();
  refreshPackets();
}

ipcRenderer.on('hideAllOfType', (event, arg) => { // Context menu
  ipcMessage = JSON.parse(arg);
  hideAll(ipcMessage.id);
});

// Modified from W3Schools
function openMenu(evt, MenuName, id) {
  var i, tabcontent, tablinks;
  tabcontent = document.getElementsByClassName("tabcontent" + id);
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }
  tablinks = document.getElementsByClassName("tablinks" + id);
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }
  document.getElementById(MenuName).style.display = "block";
  evt.currentTarget.className += " active";
}

document.body.addEventListener("contextmenu", (event) => {
  target = event.srcElement;
  if (target.tagName != "LI") {
    target = target.parentElement;
  }
  if (!target || target.tagName != "LI") {
    return;
  };
  ipcRenderer.send('contextMenu', JSON.stringify({
    direction: target.className.split(" ")[1],
    text: target.children[0].innerText + " " + target.children[1].innerText,
    id: target.id.replace("packet", "")
  }));
});

var clusterize = new Clusterize({
  rows: allPacketsHTML,
  scrollElem: packetlist.parentElement,
  contentElem: packetlist
});
