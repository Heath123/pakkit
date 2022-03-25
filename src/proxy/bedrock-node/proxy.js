const { Relay } = require('bedrock-protocol')

let scriptingEnabled = false

exports.capabilities = {
  modifyPackets: true,
  jsonData: true,
  rawData: false,
  scriptingSupport: false,
  clientboundPackets: {},
  serverboundPackets: {},
  wikiVgPage: 'https://wiki.vg/Bedrock_Protocol',
  versionId: 'bedrock-node-1.17.10'
}

let host
let port
let listenPort
let packetCallback
let messageCallback
let dataFolder
let updateFilteringCallback

let relay
let relayPlayer

exports.startProxy = function (passedHost, passedPort, passedListenPort, version, authConsent, passedPacketCallback,
  passedMessageCallback, passedDataFolder, passedUpdateFilteringCallback, authCodeCallback) {
  host = passedHost
  port = passedPort
  listenPort = passedListenPort
  packetCallback = passedPacketCallback
  messageCallback = passedMessageCallback
  dataFolder = passedDataFolder
  updateFilteringCallback = passedUpdateFilteringCallback

  relay = new Relay({
    version: '1.17.10', // The version
    /* host and port to listen for clients on */
    host: '0.0.0.0',
    port: Number(listenPort),
    /* Where to send upstream packets to */
    destination: {
      host: host,
      port: Number(port)
    }
  })

  relay.conLog = console.debug
  relay.listen() // Tell the server to start listening.

  relay.on('connect', player => {
    relayPlayer = player
    console.log('New connection', player.connection.address)
  
    // Server is sending a message to the client.
    player.on('clientbound', ({ name, params }) => {
      // TODO: check validity
      packetCallback('clientbound', { name: name }, params, '0x00', undefined, false, true)
    })
    // Client is sending a message to the server
    player.on('serverbound', ({ name, params }) => {
      packetCallback('serverbound', { name: name }, params, '0x00', undefined, false, true)
    })
  })
}

exports.end = function () {
  // TODO
}

exports.writeToClient = function (meta, data) {
  if (relayPlayer) {
    relayPlayer.queue(meta.name, data)
  }
}

exports.writeToServer = function (meta, data) {
  if (relayPlayer) {
    relayPlayer.upstream.queue(meta.name, data)
  }
}

// TODO
/* imports.setScriptingEnabled = function (isEnabled) {
  scriptingEnabled = isEnabled
  proxyPlayerSession.setDontSendPacketsPromise(scriptingEnabled)
} */
