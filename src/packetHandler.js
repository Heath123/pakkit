const _eval = require('node-eval')

BigInt.prototype.toJSON = function () {
  const int = Number.parseInt(this.toString());
  return int ?? this.toString();
};

let mainWindow
let ipcMain
let proxy
let scriptingEnabled = false
let currentScript
let currentScriptModule

const server = {
  sendPacket: function (meta, data) {
    proxy.writeToServer(meta, data, true)
  }
}

const client = {
  sendPacket: function (meta, data) {
    proxy.writeToClient(meta, data, true)
  }
}

exports.init = function (window, passedIpcMain, passedProxy) {
  mainWindow = window
  ipcMain = passedIpcMain
  proxy = passedProxy

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
    proxy.setScriptingEnabled(scriptingEnabled)
    currentScript = ipcMessage.script
    // prevent that the script gets executed when scripting is disabled
    if(scriptingEnabled) {
      currentScriptModule = _eval(currentScript, '/script.js')
    } else {
      currentScriptModule = _eval('', '/script.js')
    }
  })
}

exports.packetHandler = function (direction, meta, data, id, canUseScripting, packetValid) {
  try {
    // TODO: Maybe write raw data?
    if (proxy.capabilities.scriptingSupport && canUseScripting && scriptingEnabled) {
      if (direction === 'clientbound') {
        currentScriptModule.downstreamHandler(meta, data, server, client)
      } else {
        currentScriptModule.upstreamHandler(meta, data, server, client)
      }
    }
    let raw = proxy.getRaw(meta.name, data)
    mainWindow.send('packet', JSON.stringify({ meta: meta, data: data, direction: direction, hexIdString: id, raw: raw, time: Date.now(), packetValid: packetValid }))
  } catch (err) {
    console.error(err)
  }
}

exports.messageHandler = function (header, info, fatal) {
  mainWindow.send('message', JSON.stringify({ header: header, info: info, fatal: fatal }))
}
