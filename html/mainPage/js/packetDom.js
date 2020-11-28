let tree

exports.setup = function (ipcRenderer, proxyCapabilities) {
  const treeElement = document.getElementById('tree')

  tree = jsonTree.create({}, treeElement)
  treeElement.firstElementChild.innerHTML = 'No packet selected!'

  function trimData (data) { // Function to trim the size of stringified data for previews
    let newData
    if (proxyCapabilities.jsonData) {
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

  /* ipcRenderer.on('packetDetails', (event, arg) => {
    ipcMessage = JSON.parse(arg);
    tree.loadData(ipcMessage.data);
    // sidebar.innerHTML = `<div style="padding: 10px;">${JSON.stringify(ipcMessage.data)}</div>`;
  }); All handled here in the renderer now */

  function refreshPackets () {
    const wasScrolledToBottom = (packetlist.parentElement.scrollTop >= (packetlist.parentElement.scrollHeight - packetlist.parentElement.offsetHeight))
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
    var allPacketsHTML = []
    allPackets.forEach(function (packet) {
      // noUpdate is true as we want to manually update at the end
      addPacketToDOM(packet, true)
    })
    clusterize.update(allPacketsHTML)
    if (wasScrolledToBottom) {
      packetlist.parentElement.scrollTop = packetlist.parentElement.scrollHeight
    }
  }

  function isHiddenByFilter (packet) {
    if (lastFilter === '') {
      return false
    }
    console.log('Filter applied')
    if (packet.meta.name.includes(lastFilter)) {
      console.log(packet.meta.name, 'includes', lastFilter)
      return false
    }
    /* if (JSON.stringify(packet.data).includes(lastFilter)) {
      return false
    } */
    return true
  }

  function addPacketToDOM (packet, noUpdate) {
    /* if (!noUpdate) {
      var wasScrolledToBottom = (packetlist.parentElement.scrollTop >= (packetlist.parentElement.scrollHeight - packetlist.parentElement.offsetHeight))
    } */
    const hiddenByFilter = isHiddenByFilter(packet)

    if (hiddenPackets.includes(packet.meta.name) || hiddenByFilter) {
      updateHidden()
      return
    }
    allPacketsHTML.push([
      `<li id="packet${packet.uid}" onclick="packetClick(${packet.uid})" class="packet ${packet.direction}">
        <span class="id">${escapeHtml(packet.hexIdString)}</span>
        <span class="name">${escapeHtml(packet.meta.name)}</span>
        <span class="data">${escapeHtml(trimData(packet.data))}</span>
      </li>`])
    /* if (!noUpdate) {
      clusterize.append(allPacketsHTML.slice(-1)[0]);
      if (wasScrolledToBottom) {
        packetlist.parentElement.scrollTop = packetlist.parentElement.scrollHeight;
      }
    } */
    packetsUpdated = true
    // packetlist.style.paddingTop =  offScreenCount * 30 + "px"; // TODO: Make it so you can view these packets
    /* if (offScreenCount % 2 == 0) {
      packetlist.className = "packetlist evenNumberHidden";
    } else {
      packetlist.className = "packetlist oddNumberHidden";
    } Maybe add back but differently */

    updateHidden()
  }

  ipcRenderer.on('packet', (event, arg) => {
    const ipcMessage = JSON.parse(arg)
    allPackets.push(ipcMessage)
    ipcMessage.uid = allPackets.length - 1
    addPacketToDOM(ipcMessage, true)
  })
}

exports.getTree = function () {
  return tree
}