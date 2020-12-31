const { spawn } = require('child_process')
const WebSocket = require('ws')
const net = require('net')

// const java = require('java')

/* java.asyncOptions = {
  asyncSuffix: undefined,
  syncSuffix: "",
  promiseSuffix: "Promise",
  promisify: require('util').promisify
} */

let child

// TODO: Can it still be frozen?
// let mayBeFrozen = false
// let timeFrozen

let proxyPass
let proxyPlayerSession

let wsPort
let ws

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
let messageCallback
let dataFolder

// https://stackoverflow.com/questions/28050171/nodejs-random-free-tcp-ports
function freePort () {
  return new Promise((resolve, reject) => {
    const srv = net.createServer(function(sock) {
      sock.end()
    })
    srv.listen(0, function() {
      const port = srv.address().port
      srv.close()
      resolve(port)
    })
    srv.on('error', (err) => {
      reject(err)
    })
  })
}

async function launch() {
  wsPort = Number(await freePort())

  child = spawn('java', ['-jar', dataFolder + '/proxypass/' + 'proxypass-pakkit.jar', '--start-from-args', '0.0.0.0',
    listenPort.toString(), host, port.toString(), '1', 'true', 'true', 'pakkit', 'pakkitProxyPoweredByProxyPass',
    'true', wsPort.toString()])

  child.stdout.on('data', handleOutput)
  child.stderr.on('data', handleError)
  child.on('close', (code, signal) => {
    setTimeout(() => {
      launch()
    }, 50)
  })


  // setTimeout(startWebsocket, 3000)
}

function startWebsocket () {
  ws = new WebSocket('ws://localhost:' + wsPort)

  /* ws.on('open', function open() {
    ws.send('something')
  }); */

  ws.on('message', function incoming(data) {
    // console.log(data);
    try {
      data = JSON.parse(data)
    } catch (err) {
      console.error(err)
      return
    }
    switch (data.type) {
      case 'packet':
        handlePacket(data.data)
        break
      case 'event':
        handleEvent(data)
        break
      default:
        console.log('Unknown message type', data.type)
    }
  })

  console.log('Proxy started (Bedrock)!')
}

function handlePacket (packet) {
  const name = packet.packetType.toLowerCase()

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

  packetCallback(packet.direction, { name: name, className: packet.className }, data, hexIdString, raw, canUseScripting)
}

function handleEvent (event) {
  switch(event.eventType) {
    case 'unableToConnect':
      messageCallback('Unable to connect to server', 'Unable to connect to the Bedrock server at ' +
        event.eventData.replace(/^\//, '') + // Remove slash at start
        '. Make sure the server is online.')
      relaunch()
      break;
    case 'disconnect':
      console.log('Disconnect - relaunching proxy')
      relaunch()
      break;
    default:
      console.log('Unknown event', event.eventType)
  }
}

function handleOutput (chunk) {
  try {
    const text = chunk.toString('utf8').trim()
    console.log('ProxyPass output:', text)
    if (text.startsWith('ProxyPass - Websocket started on port: ') && !(ws && ws.readyState === WebSocket.OPEN)) {
      setTimeout(startWebsocket, 100)
    }
  } catch (err) {
    console.error(err)
  }
}

function handleError (chunk) {
  try {
    console.log('ProxyPass error:', chunk.toString('utf8').trim())
  } catch (err) {
    console.error(err)
  }
}

exports.startProxy = function (passedHost, passedPort, passedListenPort, version, authConsent, passedPacketCallback, passedMessageCallback, passedDataFolder) {
  host = passedHost
  port = passedPort
  listenPort = passedListenPort
  packetCallback = passedPacketCallback
  messageCallback = passedMessageCallback
  dataFolder = passedDataFolder

  launch()
}

exports.end = function () {
  proxyPass.shutdownStaticPromise()
}

// used to relaunch on disconnect
function relaunch () {
  ws.close()
  // Will auto-restart
  child.kill()
}

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
