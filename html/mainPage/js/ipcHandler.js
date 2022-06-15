let sharedVars

exports.setup = function (passedSharedVars) {
  sharedVars = passedSharedVars

  sharedVars.ipcRenderer.on('copyPacketData', (event, arg) => {
    const ipcMessage = JSON.parse(arg)
    let data = sharedVars.allPackets[ipcMessage.id].data
    data = sharedVars.proxyCapabilities.jsonData ? JSON.stringify(data, null, 2) : data.data
    sharedVars.ipcRenderer.send('copyToClipboard', data)
  })

  sharedVars.ipcRenderer.on('copyHexData', (event, arg) => {
    const ipcMessage = JSON.parse(arg)
    let data = ''
    for (const byte of sharedVars.allPackets[ipcMessage.id].raw) {
      data += byte.toString(16).padStart(2, '0')
      data += ' '
    }
    data = data.trim().toUpperCase()
    sharedVars.ipcRenderer.send('copyToClipboard', data)
  })

  sharedVars.ipcRenderer.on('copyTeleportCommand', (event, arg) => {
    console.log(sharedVars.allPackets)
    const ipcMessage = JSON.parse(arg)
    const data = sharedVars.allPackets[ipcMessage.id].data

    let clipData = '/tp @p ' + ((datasharedVars.packetsUpdated = false.flags & 0x01) ? '~' : '') + ((data.x === 0 && (data.flags & 0x01)) ? '' : data.x) +
      ((data.flags & 0x02) ? ' ~' : ' ') + ((data.y === 0 && (data.flags & 0x03)) ? '' : data.y) +
      ((data.flags & 0x04) ? ' ~' : ' ') + ((data.z === 0 && (data.flags & 0x04)) ? '' : data.z)

    if (!(data.flags & 0x10) || !(data.flags & 0x08) || data.pitch != 0 || data.yaw !== 0) {
      clipData += ((data.flags & 0x10) ? ' ~' : ' ') + data.pitch +
        ((data.flags & 0x08) ? ' ~' : ' ') + data.yaw
    }

    sharedVars.ipcRenderer.send('copyToClipboard', clipData)
  })

  sharedVars.ipcRenderer.on('packet', (event, arg) => {
    const ipcMessage = JSON.parse(arg)
    sharedVars.packetDom.addPacket(ipcMessage)
  })

  sharedVars.ipcRenderer.on('error', (event, arg) => {
    const ipcMessage = JSON.parse(arg)
    handleError(ipcMessage.msg, ipcMessage.stack)
  })

  sharedVars.ipcRenderer.on('message', (event, arg) => {
    const ipcMessage = JSON.parse(arg)
    errorDialog(ipcMessage.header, ipcMessage.info, ipcMessage.fatal)
  })

  sharedVars.ipcRenderer.on('updateFiltering', (event, arg) => {
    console.log('update!!!')
    sharedVars.proxyCapabilities = JSON.parse(sharedVars.ipcRenderer.sendSync('proxyCapabilities', ''))
    window.updateFilteringPackets()
  })

  sharedVars.ipcRenderer.on('loadLogData', (event, arg) => {
    sharedVars.allPackets = JSON.parse(arg)
    for (const packet of sharedVars.allPackets) {
      sharedVars.packetDom.addPacketToDOM(packet)
    }
  })

  sharedVars.ipcRenderer.on('loadScriptData', (event, arg) => {
    window.scriptEditor.getDoc().setValue(arg)
    sharedVars.ipcRenderer.send('scriptStateChange', JSON.stringify({ //
      scriptingEnabled: document.getElementById('enableScripting').checked,
      script: arg
    }))
  })

  sharedVars.ipcRenderer.on('enableBtnScriptSave', (event, arg) => {
    document.getElementById('btnScriptSave').disabled = false
    document.getElementById('btnScriptSave').title = arg
  })

sharedVars.ipcRenderer.on('disableBtnScriptSave', (event, arg) => {
  document.getElementById('btnScriptSave').disabled = true
  document.getElementById('btnScriptSave').title = ''
})

}
