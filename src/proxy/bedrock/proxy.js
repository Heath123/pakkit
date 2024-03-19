const { Relay } = require('bedrock-protocol')
const {readFileSync} = require("fs");
const minecraftFolder = require("minecraft-folder-path");

let scriptingEnabled = false

// http://prismarinejs.github.io/minecraft-data/?v=bedrock_1.19.62&d=protocol#packet_server_to_client_handshake
// http://prismarinejs.github.io/minecraft-data/?v=bedrock_[VERSION]&d=protocol#[PACKET]

exports.capabilities = {
  modifyPackets: true,
  jsonData: true,
  rawData: true,
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

let toClientMappings
let toServerMappings

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

  const packetRegex = /packet_(.*?):\n.*!id: (.*?)\n...(.*?\n)/g;
  const boundRegex = /!bound: (.*?)\n/g;
  let match;

  while (match = packetRegex.exec(packetsYamlProto)) {
    let packetID = match[2];
    let packetName = match[1];

    let boundToMatch = boundRegex.exec(match[0]);
    let boundTo;

    if(boundToMatch)
      boundTo = boundToMatch[1]
    else
      boundTo = "both" // sometimes packets have unknown direction

    if (boundTo === "both") {
      packets["server"][packetID] = packetName;
      packets["client"][packetID] = packetName;
    } else {
      packets[boundTo][packetID] = packetName;
    }
  }

  toClientMappings = packets["client"]
  toServerMappings = packets["server"]

  exports.capabilities.clientboundPackets = toClientMappings
  exports.capabilities.serverboundPackets = toServerMappings

  // TODO: minecraft-data docs should replace wikiVgPage
  //exports.capabilities.wikiVgPage = "http://prismarinejs.github.io/minecraft-data/?v=bedrock_{VERSION}&d=protocol".replace("{VERSION}", version)

  exports.capabilities.versionId = 'node-bedrock-protocol-' + version.split('.').join('-')

  function getId (name, mappings) {
    if(!name) return '0x00'
    let id = Object.keys(mappings).find(key => mappings[key] === name)
    if(!id) {
      console.log('Couldn\'t get ID:', name)
      return '0x00'
    }
    if(id.indexOf('x')===-1)// just number, requires conversion
      id = '0x' + Number(id.toString()).toString().padStart(2, '0')
    return id
  }

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
      const packetBuff = relay.serializer.createPacketBuffer({ name, params })
      const id = getId(name, toClientMappings)
      packetCallback('clientbound', { name: name }, params, id, [...packetBuff], scriptingEnabled, true)
    })
    // Client is sending a message to the server
    player.on('serverbound', ({ name, params }) => {
      const packetBuff = relay.serializer.createPacketBuffer({ name, params })
      const id = getId(name, toServerMappings)
      packetCallback('serverbound', { name: name }, params, id, [...packetBuff], scriptingEnabled, true)
    })
    // player on -> close, error, closeConnection (by server), disconnect (by me)
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

exports.setScriptingEnabled = function (isEnabled) {
  scriptingEnabled = isEnabled
}
