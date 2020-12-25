// Modified from https://github.com/PrismarineJS/node-minecraft-protocol/blob/master/examples/proxy/proxy.js

const mc = require('minecraft-protocol')
const minecraftFolder = require('minecraft-folder-path')

const states = mc.states

let realClient
let realServer
let toClientMappings
let toServerMappings
let storedCallback

// https://gist.github.com/timoxley/1689041
function isPortTaken (port, fn) {
  const net = require('net')
  const tester = net.createServer()
      .once('error', function (err) {
        if (err.code != 'EADDRINUSE') return fn(err)
        fn(null, true)
      })
      .once('listening', function() {
        tester.once('close', function() { fn(null, false) })
            .close()
      })
      .listen(port)
}

exports.capabilities = {
  modifyPackets: true,
  jsonData: true,
  rawData: true,
  scriptingSupport: true,
  clientboundPackets: [],
  serverboundPackets: [],
  // TODO: Only for latest, or fetch older pages
  wikiVgPage: 'https://wiki.vg/Protocol',
  versionId: undefined
}

exports.startProxy = function (host, port, listenPort, version, authConsent, callback, messageCallback, dataFolder) {
  storedCallback = callback

  // . cannot be in a JSON property name with electron-store
  exports.capabilities.versionId = 'java-node-minecraft-protocol-' + version.split('.').join('-')

  const mcdata = require('minecraft-data')(version) // Used to get packets, may remove if I find a better way
  toClientMappings = mcdata.protocol.play.toClient.types.packet[1][0].type[1].mappings
  toServerMappings = mcdata.protocol.play.toServer.types.packet[1][0].type[1].mappings

  exports.capabilities.clientboundPackets = mcdata.protocol.play.toClient.types.packet[1][0].type[1].mappings
  exports.capabilities.serverboundPackets = mcdata.protocol.play.toServer.types.packet[1][0].type[1].mappings

  if (host.indexOf(':') !== -1) {
    port = host.substring(host.indexOf(':') + 1)
    host = host.substring(0, host.indexOf(':'))
  }
  isPortTaken(listenPort, (err, taken) => {
    // TODO: Handle errors
    console.log(err, taken)
    if (taken) {
      console.log('call')
      // Wait for the renderer to be ready
      setTimeout(() => {
        messageCallback('Unable to start pakkit', 'The port ' + listenPort + ' is in use. ' +
          'Make sure to close any other instances of pakkit running on the same port or try a different port.', true)
      }, 1000)
    } else {
      let srv
      try {
        srv = mc.createServer({
          'online-mode': false,
          port: listenPort,
          keepAlive: false,
          version: version
        })
        console.log('Proxy started (Java)!')
      } catch (err) {
        let header = 'Unable to start pakkit'
        let message = err.message
        if (err.message.includes('EADDRINUSE')) {
          message = 'The port ' + listenPort + ' is in use. ' +
              'Make sure to close any other instances of pakkit running on the same port or try a different port.'
        }
        messageCallback(header, message)
        return
      }
      srv.on('login', function (client) {
        realClient = client
        const addr = client.socket.remoteAddress
        console.log('Incoming connection', '(' + addr + ')')
        let endedClient = false
        let endedTargetClient = false
        client.on('end', function () {
          endedClient = true
          console.log('Connection closed by client', '(' + addr + ')')
          if (!endedTargetClient) { targetClient.end('End') }
        })
        client.on('error', function (err) {
          endedClient = true
          console.log('Connection error by client', '(' + addr + ')')
          console.log(err.stack)
          if (!endedTargetClient) { targetClient.end('Error') }
        })
        if (authConsent) {
          console.log('Will attempt to use launcher_profiles.json for online mode login data')
        } else {
          console.warn('Consent not given to use launcher_profiles.json - online mode will not work')
        }
        const targetClient = mc.createClient({
          host: host,
          port: port,
          username: client.username,
          keepAlive: false,
          version: version,
          profilesFolder: authConsent ? minecraftFolder : undefined
        })
        realServer = targetClient
        function handleServerboundPacket (data, meta, raw) {
          // console.log('serverbound packet', meta, data)
          if (targetClient.state === states.PLAY && meta.state === states.PLAY) {
            const id = Object.keys(toServerMappings).find(key => toServerMappings[key] === meta.name)
            const direction = 'serverbound' // Stops standardjs complaining (no-callback-literal)
            // callback(direction, meta, data, id)
            if (!endedTargetClient) {
              // targetClient.write(meta.name, data)
              callback(direction, meta, data, id, raw)
            }
          }
        }
        function handleClientboundPacket (data, meta, raw) {
          if (meta.state === states.PLAY && client.state === states.PLAY) {
            const id = Object.keys(toClientMappings).find(key => toClientMappings[key] === meta.name)
            const direction = 'clientbound' // Stops standardjs complaining (no-callback-literal)
            // callback(direction, meta, data, id)
            if (!endedClient) {
              // client.write(meta.name, data)
              callback(direction, meta, data, id, raw)
              if (meta.name === 'set_compression') {
                client.compressionThreshold = data.threshold
              } // Set compression
            }
          }
        }
        const bufferEqual = require('buffer-equal')
        targetClient.on('raw', function (buffer, meta) {
          if (client.state !== states.PLAY || meta.state !== states.PLAY) { return }
          const packetData = targetClient.deserializer.parsePacketBuffer(buffer).data.params
          handleClientboundPacket(packetData, meta, [...buffer])
          const packetBuff = client.serializer.createPacketBuffer({ name: meta.name, params: packetData })
          if (!bufferEqual(buffer, packetBuff)) {
            console.log('client<-server: Error in packet ' + meta.state + '.' + meta.name)
            console.log('received buffer', buffer.toString('hex'))
            console.log('produced buffer', packetBuff.toString('hex'))
            console.log('received length', buffer.length)
            console.log('produced length', packetBuff.length)
          }
          /* if (client.state === states.PLAY && brokenPackets.indexOf(packetId.value) !=== -1)
           {
           console.log(`client<-server: raw packet);
           console.log(packetData);
           if (!endedClient)
           client.writeRaw(buffer);
           } */
        })
        client.on('raw', function (buffer, meta) {
          if (meta.state !== states.PLAY || targetClient.state !== states.PLAY) { return }
          const packetData = client.deserializer.parsePacketBuffer(buffer).data.params
          handleServerboundPacket(packetData, meta, [...buffer])
          const packetBuff = targetClient.serializer.createPacketBuffer({ name: meta.name, params: packetData })
          if (!bufferEqual(buffer, packetBuff)) {
            console.log('client->server: Error in packet ' + meta.state + '.' + meta.name)
            console.log('received buffer', buffer.toString('hex'))
            console.log('produced buffer', packetBuff.toString('hex'))
            console.log('received length', buffer.length)
            console.log('produced length', packetBuff.length)
          }
        })
        targetClient.on('end', function () {
          endedTargetClient = true
          console.log('Connection closed by server', '(' + addr + ')')
          if (!endedClient) { client.end('Connection closed by server ' + '(' + addr + ')') }
        })
        targetClient.on('error', function (err) {
          endedTargetClient = true
          console.log('Connection error by server', '(' + addr + ') ', err)
          console.log(err.stack)
          let header = 'Unable to connect to server'
          let message = err.message
          if (err.message.includes('ECONNREFUSED')) {
            message = 'Unable to connect to the Java server at ' +
                host + ':' + port +
                '. Make sure the server is online.'
          }
          messageCallback(header, message)
          if (!endedClient) { client.end('pakkit - ' + header + '\n' + message) }
        })
      })
    }
  })
}

exports.end = function () {}

exports.writeToClient = function (meta, data, noCallback) {
  if (typeof meta === 'string') {
    meta = { name: meta }
  }
  realClient.write(meta.name, data)
  const id = Object.keys(toClientMappings).find(key => toClientMappings[key] === meta.name)
  if (!noCallback) {
    storedCallback('clientbound', meta, data, id) // TODO: indicator for injected packets
  }
}

exports.writeToServer = function (meta, data, noCallback) {
  if (typeof meta === 'string') {
    meta = { name: meta }
  }
  realServer.write(meta.name, data)
  const id = Object.keys(toServerMappings).find(key => toServerMappings[key] === meta.name)
  if (!noCallback) {
    storedCallback('serverbound', meta, data, id)
  }
}
