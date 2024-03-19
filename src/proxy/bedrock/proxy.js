const { Relay } = require('bedrock-protocol')
const {readFileSync} = require("fs");
const minecraftFolder = require("minecraft-folder-path");

let scriptingEnabled = false

// http://prismarinejs.github.io/minecraft-data/?v=bedrock_1.19.62&d=protocol#packet_server_to_client_handshake
// http://prismarinejs.github.io/minecraft-data/?v=bedrock_[VERSION]&d=protocol#[PACKET]

exports.capabilities = {
  modifyPackets: true,
  jsonData: true,
  rawData: false,
  scriptingSupport: false,
  clientboundPackets: {},
  serverboundPackets: {},
  wikiVgPage: 'https://wiki.vg/Bedrock_Protocol',
  versionId: undefined
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

exports.startProxy = function (passedHost, passedPort, passedListenPort, version, onlineMode, authConsent, passedPacketCallback,
                               passedMessageCallback, passedDataFolder, passedUpdateFilteringCallback, authCodeCallback) {
  host = passedHost
  port = passedPort
  listenPort = passedListenPort
  packetCallback = passedPacketCallback
  messageCallback = passedMessageCallback
  dataFolder = passedDataFolder
  updateFilteringCallback = passedUpdateFilteringCallback

  const mcdata = require('minecraft-data')('bedrock_' + version) // Used to get packets, may remove if I find a better way

  const packetsYamlProtoPath = mcdata.protocolYaml[0]
  const packetsYamlProto = readFileSync(packetsYamlProtoPath, 'utf8');
  const packets = {
    "server": [],
    "client": []
  };

  const packetRegex = /packet_(.*?):\n.*!id: .*\n.*!bound: (.*?)\n/g;
  let match;

  while (match = packetRegex.exec(packetsYamlProto)) {
    let boundTo = match[2];
    if (boundTo === "both") {
      packets["server"].push(match[1]);
      packets["client"].push(match[1]);
    } else {
      packets[boundTo].push(match[1]);
    }
  }

  exports.capabilities.clientboundPackets = packets["client"]
  exports.capabilities.serverboundPackets = packets["server"]

  // TODO: minecraft-data docs should replace wikiVgPage
  //exports.capabilities.wikiVgPage = "http://prismarinejs.github.io/minecraft-data/?v=bedrock_{VERSION}&d=protocol".replace("{VERSION}", version)

  exports.capabilities.versionId = 'node-bedrock-protocol-' + version.split('.').join('-')

  relay = new Relay({
    version: version,
    /* host and port to listen for clients on */
    host: '0.0.0.0',
    port: Number(listenPort),
    offline: !onlineMode,
    /* Where to send upstream packets to */
    destination: {
      host: host,
      port: Number(port)
    },
    profilesFolder: authConsent ? minecraftFolder : dataFolder,
    onMsaCode: function (data) {
      console.log('MSA code:', data.user_code)
      authCodeCallback(data)
    }
  })

  relay.conLog = console.debug
  relay.listen() // Tell the server to start listening.

  relay.on('connect', player => {
    relayPlayer = player
    console.log('New connection', player.connection.address)

    relay.once('join', () => {
      console.log('Login done')
      authCodeCallback('close')
    })
    // Server is sending a message to the client.
    player.on('clientbound', ({ name, params }) => {
      // TODO: check validity
      packetCallback('clientbound', { name: name }, params, '0x00', {}, scriptingEnabled, true)
    })
    // Client is sending a message to the server
    player.on('serverbound', ({ name, params }) => {
      packetCallback('serverbound', { name: name }, params, '0x00', {}, scriptingEnabled, true)
    })
  })
}

exports.end = function () {
  // TODO
  relay.close()
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
exports.setScriptingEnabled = function (isEnabled) {
  scriptingEnabled = isEnabled
}
