const fs = require('fs')
const java = require('java')

java.asyncOptions = {
  asyncSuffix: undefined,
  syncSuffix: "",
  promiseSuffix: "Promise",
  promisify: require('util').promisify
}

let child
let storedCallback

// TODO: Can it still be frozen?
let mayBeFrozen = false
let timeFrozen

let proxyPass
let proxyPlayerSession

let scriptingEnabled = false

// This whole thing is messy for now.

exports.capabilities = {
  modifyPackets: true,
  jsonData: true,
  rawData: true,
  scriptingSupport: false,
  clientboundPackets: {},
  serverboundPackets: {},
  wikiVgPage: 'https://wiki.vg/Bedrock_Protocol',
  versionId: 'bedrock-proxypass-json'
}

let host
let port
let listenPort
let packetCallback

function launch() {
  proxyPass.startFromArgsPromise('0.0.0.0', Number(listenPort), host, Number(port), 1, true, true, "pakkit", "pakkit proxy powered by ProxyPass", packetCallback)
}

exports.startProxy = function (passedHost, passedPort, passedListenPort, version, authConsent, callback, messageCallback, dataFolder) {
  host = passedHost
  port = passedPort
  listenPort = passedListenPort

  java.classpath.push(dataFolder + '/proxypass/proxypass-pakkit.jar')

  proxyPass = java.import('com.nukkitx.proxypass.ProxyPass')
  proxyPlayerSession = java.import('com.nukkitx.proxypass.network.bedrock.session.ProxyPlayerSession')

  const packetTypes = JSON.parse(proxyPlayerSession.getIdBiMapStatic())
  for (const index in packetTypes) {
    const idString = '0x' + Number(index).toString(16).padStart(2, '0')
    const name = packetTypes[index].toLowerCase()
    // There isn't much of a distinction between serverbound and clientbound in Bedrock and many packets can be sent both ways
    exports.capabilities.clientboundPackets[idString] = name
    exports.capabilities.serverboundPackets[idString] = name
  }

  storedCallback = callback

  packetCallback = java.newProxy('com.nukkitx.proxypass.PacketCallback', {
    handlePacket: function (packet) {
      if (packet.isEvent) {
        switch(packet.eventType) {
          case 'unableToConnect':
            messageCallback('Ubale to connect to server', 'Unable to connect to the Bedrock server at ' +
              packet.eventData.replace(/^\//, '') + // Remove slash at start
              '. Make sure the server is online.')
            relaunch()
            break;
          case 'disconnect':
            console.log('Disconnect - relaunching proxy')
            relaunch()
            break;
          default:
            console.log('Unknown event', packet.eventType)
        }
      } else {
        const name = packet.packetType.toString().toLowerCase();

        const data = JSON.parse(packet.jsonData);
        const hexIdString = '0x' + packet.packetId.toString(16).padStart(2, '0')

        // These values are unneeded or are exposed elsewhere in the GUI
        delete data.packetId
        delete data.packetType
        delete data.clientId
        delete data.senderId

        const raw = Object.values(packet.bytes)
        // Prepend packet ID for consistency with Java Edition
        raw.unshift(packet.packetId)

        // If the packet as already handled bya  custom handler then scripting cannot modify it
        // (well it can but that would be annoying to add)
        const canUseScripting = !data.isHandled

        storedCallback(packet.direction, { name: name, className: packet.className }, data, hexIdString, raw, canUseScripting)
      }
    }
  });


  launch()

  // Poll for packets as the java module doesn't seem to support callbacks
  /* setInterval(function () {
    const array = proxyPass.packetQueue.toArray()
    for (const item of array) {
      if (item.isEvent) {
        switch(item.eventType) {
          case 'unableToConnect':
            messageCallback('Unable to connect to server', 'Unable to connect to the Bedrock server at ' +
              item.eventData.replace(/^\//, '') + // Remove slash at start
              '. Make sure the server is online.')
            relaunch()
            break;
          case 'disconnect':
            console.log('Disconnect - relaunching proxy')
            relaunch()
            break;
          default:
            console.log('Unknown event', item.eventType)
        }
      } else {
        const name = item.packetType.toString().toLowerCase();

        const data = JSON.parse(item.jsonData);
        const hexIdString = '0x' + item.packetId.toString(16).padStart(2, '0')

        // These values are unneeded or are exposed elsewhere in the GUI
        delete data.packetId
        delete data.packetType
        delete data.clientId
        delete data.senderId

        const raw = Object.values(item.bytes)
        // Prepend packet ID for consistency with Java Edition
        raw.unshift(item.packetId)

        // If the packet as already handled bya  custom handler then scripting cannot modify it
        // (well it can but that would be annoying to add)
        const canUseScripting = !data.isHandled

        storedCallback(item.direction, { name: name, className: item.className }, data, hexIdString, raw, canUseScripting)
      }
    }

    proxyPass.packetQueue.clear()
  }, 50) */

  console.log('Proxy started (Bedrock)!')
}

exports.end = function () {
  proxyPass.shutdownStaticPromise()
}

// used to relaunch on disconnect
function relaunch () {
  proxyPass.shutdownStaticPromise()
}

exports.writeToClient = function (meta, data) {
  proxyPlayerSession.injectPacketStaticPromise(JSON.stringify(data), meta.className, 'client')
}

exports.writeToServer = function (meta, data) {
  proxyPlayerSession.injectPacketStaticPromise(JSON.stringify(data), meta.className, 'server')
}

exports.setScriptingEnabled = function (isEnabled) {
  scriptingEnabled = isEnabled
  proxyPlayerSession.setDontSendPacketsPromise(scriptingEnabled)
}
