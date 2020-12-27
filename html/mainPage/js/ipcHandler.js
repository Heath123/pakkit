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

    let clipData = '/tp @p ' + ((data.flags & 0x01) ? '~' : '') + ((data.x === 0 && (data.flags & 0x01)) ? '' : data.x) +
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
}
