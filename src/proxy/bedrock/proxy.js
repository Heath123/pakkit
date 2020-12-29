const fs = require('fs')
const { spawn } = require('child_process')
const WebSocket = require('ws')

// const java = require('java')

/* java.asyncOptions = {
  asyncSuffix: undefined,
  syncSuffix: "",
  promiseSuffix: "Promise",
  promisify: require('util').promisify
} */

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
  modifyPackets: false,
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

/* function launch() {
  proxyPass.startFromArgsPromise('0.0.0.0', Number(listenPort), host, Number(port), 1, true, true, "pakkit", "pakkit proxy powered by ProxyPass", packetCallback)
} */

function handlePacket (packetString) {
  let packet
  try {
    packet = JSON.parse(packetString)
  } catch (err) {
    console.error(err)
    return
  }
  if (packet.isEvent) {
    switch(packet.eventType) {
      case 'unableToConnect':
        messageCallback('Unable to connect to server', 'Unable to connect to the Bedrock server at ' +
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

exports.startProxy = function (passedHost, passedPort, passedListenPort, version, authConsent, callback, messageCallback, dataFolder) {
  host = passedHost
  port = passedPort
  listenPort = passedListenPort

  fs.writeFileSync(dataFolder + '/proxypass/config.yml', `
  proxy:
    host: 0.0.0.0
    port: ${listenPort}
  destination:
    host: ${host}
    port: ${port}
  packet-testing: false
  log-packets: true
  log-to: console
  ignored-packets: []
`)

  const olddir = process.cwd()
  process.chdir(dataFolder + '/proxypass/')

  child = spawn('java', ['-jar', 'proxypass-pakkit.jar'])

  process.chdir(olddir)

  /* java.classpath.push(dataFolder + '/proxypass/proxypass-pakkit.jar')

  proxyPass = java.import('com.nukkitx.proxypass.ProxyPass')
  proxyPlayerSession = java.import('com.nukkitx.proxypass.network.bedrock.session.ProxyPlayerSession')

  const packetTypes = JSON.parse(proxyPlayerSession.getIdBiMapStatic())
  for (const index in packetTypes) {
    const idString = '0x' + Number(index).toString(16).padStart(2, '0')
    const name = packetTypes[index].toLowerCase()
    // There isn't much of a distinction between serverbound and clientbound in Bedrock and many packets can be sent both ways
    exports.capabilities.clientboundPackets[idString] = name
    exports.capabilities.serverboundPackets[idString] = name
  } */

  storedCallback = callback

  // launch()

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

  child.stdout.on('data', (chunk) => {
    try {
      console.log('ProxyPass output:', chunk.toString('utf8').trim())
      /* mayBeFrozen = false // New messages mean it isn't froxen
      if (chunk.search('Initializing proxy session') !== -1) { // ProxyPass gets stuck here sometimes
        timeFrozen = Math.floor(new Date())
        mayBeFrozen = true
      } */

      /* chunk.split('\n').forEach((item) => {
        processPacket(item)
      }) */
    } catch (err) {
      console.error(err)
    }
  })
  child.stderr.on('data', (chunk) => {
    try {
      console.log('ProxyPass error:', chunk.toString('utf8').trim())
    } catch (err) {
      console.error(err)
    }
  })

  // TODO: base on output
  setTimeout(() => {
    const ws = new WebSocket('ws://localhost:1835')

    /* ws.on('open', function open() {
      ws.send('something');
    }); */

    ws.on('message', function incoming(data) {
      // console.log(data);
      handlePacket(data)
    })

    console.log('Proxy started (Bedrock)!')
  }, 3000)
}

exports.end = function () {
  proxyPass.shutdownStaticPromise()
}

// used to relaunch on disconnect
/* function relaunch () {
  proxyPass.shutdownStaticPromise()
} */

exports.writeToClient = function (meta, data) {
  // proxyPlayerSession.injectPacketStaticPromise(JSON.stringify(data), meta.className, 'client')
}

exports.writeToServer = function (meta, data) {
  // proxyPlayerSession.injectPacketStaticPromise(JSON.stringify(data), meta.className, 'server')
}

exports.setScriptingEnabled = function (isEnabled) {
  scriptingEnabled = isEnabled
  proxyPlayerSession.setDontSendPacketsPromise(scriptingEnabled)
}
