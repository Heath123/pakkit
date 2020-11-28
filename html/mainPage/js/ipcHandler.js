exports.setup = function (ipcRenderer, allPackets, proxyCapabilities) {
  ipcRenderer.on('copyPacketData', (event, arg) => {
    console.log(allPackets)
    const ipcMessage = JSON.parse(arg)
    let data = allPackets[ipcMessage.id].data
    data = proxyCapabilities.jsonData ? JSON.stringify(data, null, 2) : data.data
    ipcRenderer.send('copyToClipboard', data)
  })

  ipcRenderer.on('copyTeleportCommand', (event, arg) => {
    console.log(allPackets)
    const ipcMessage = JSON.parse(arg)
    let data = allPackets[ipcMessage.id].data

    let clipData = 'test'
    debugger
    clipData = '/tp @p ' + ((data.flags & 0x01) ? '~' : '') + ((data.x === 0 && (data.flags & 0x01)) ? '' : data.x)
      + ((data.flags & 0x02) ? ' ~' : ' ') + ((data.y === 0 && (data.flags & 0x03)) ? '' : data.y)
      + ((data.flags & 0x04) ? ' ~' : ' ') + ((data.z === 0 && (data.flags & 0x04)) ? '' : data.z)
    debugger

    if (!(data.flags & 0x10) || !(data.flags & 0x08) || data.pitch != 0 || data.yaw !== 0) {
      clipData += ((data.flags & 0x10) ? ' ~' : ' ') + data.pitch
        + ((data.flags & 0x08) ? ' ~' : ' ') + data.yaw
    }
    debugger
    console.log('Sending', clipData)
    ipcRenderer.send('copyToClipboard', clipData)
  })
}