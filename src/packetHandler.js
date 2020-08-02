const _eval = require('node-eval')

let mainWindow
let ipcMain
let proxy
let scriptingEnabled = false
let currentScript
let currentScriptModule

const server = {
  sendPacket: function(meta, data) {
    proxy.writeToServer(meta, data, true)
  }
}

const client = {
  sendPacket: function(meta, data) {
    proxy.writeToClient(meta, data, true)
  }
}

exports.init = function (window, passedIpcMain, passedProxy) {
  mainWindow = window
  ipcMain = passedIpcMain
  proxy = passedProxy

  console.log('init')

  ipcMain.on('injectPacket', (event, arg) => {
    const ipcMessage = JSON.parse(arg)
    if (ipcMessage.direction === 'clientbound') {
      passedProxy.writeToClient(ipcMessage.meta, ipcMessage.data, false)
    } else {
      passedProxy.writeToServer(ipcMessage.meta, ipcMessage.data, false)
    }
  })

  ipcMain.on('scriptStateChange', (event, arg) => {
    const ipcMessage = JSON.parse(arg)
    scriptingEnabled = ipcMessage.scriptingEnabled
    currentScript = ipcMessage.script
    currentScriptModule = _eval(currentScript, '/script.js')
  })
}

exports.packetHandler = function (direction, meta, data, id) {
  try {
    mainWindow.send('packet', JSON.stringify({ meta: meta, data: data, direction: direction, hexIdString: id }))
    if (direction === 'clientbound') {
      if (scriptingEnabled) {
        currentScriptModule.downstreamHandler(meta, data, server, client)
      } else {
        proxy.writeToClient(meta, data, true)
      }
    } else {
      if (scriptingEnabled) {
        currentScriptModule.upstreamHandler(meta, data, server, client)
      } else {
        proxy.writeToServer(meta, data, true)
      }
    }
  } catch (err) {
    console.error(err)
  }
}
