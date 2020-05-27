// Modified from https://github.com/PrismarineJS/node-minecraft-protocol/blob/master/examples/proxy/proxy.js

const mc = require('minecraft-protocol')

const states = mc.states

var realClient;
var realServer;
var toClientMappings;
var toServerMappings;
var storedCallback;

exports.capabilities = {
  modifyPackets: true
}

exports.startProxy = function(host, port, listenPort, version, callback, dataFolder) {
  storedCallback = callback;
  const mcdata = require('minecraft-data')(version) // Used to get packets, may remove if I find a better way
  toClientMappings = mcdata.protocol.play.toClient.types.packet[1][0].type[1].mappings;
  toServerMappings = mcdata.protocol.play.toServer.types.packet[1][0].type[1].mappings;

  if (host.indexOf(':') !== -1) {
    port = host.substring(host.indexOf(':') + 1)
    host = host.substring(0, host.indexOf(':'))
  }

  const srv = mc.createServer({
    'online-mode': false,
    port: listenPort,
    keepAlive: false,
    version: version
  })
  console.log("Proxy started (Java)!");
  srv.on('login', function (client) {
    realClient = client;
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
    const targetClient = mc.createClient({
      host: host,
      port: port,
      username: client.username,
      keepAlive: false,
      version: version
    })
    realServer = targetClient;
    client.on('packet', function (data, meta) {
      if (targetClient.state === states.PLAY && meta.state === states.PLAY) {
        id = Object.keys(toServerMappings).find(key => toServerMappings[key] === meta.name);
        callback("serverbound", meta, data, id);
        /* if (shouldDump(meta.name, 'o')) {
          console.log('client->server:',
            client.state + ' ' + meta.name + ' :',
            JSON.stringify(data))
        } */
        if (!endedTargetClient) { targetClient.write(meta.name, data) }
      }
    })
    targetClient.on('packet', function (data, meta) {
      if (meta.state === states.PLAY && client.state === states.PLAY) {
        /* if (shouldDump(meta.name, 'i')) {
          console.log('client<-server:',
            targetClient.state + '.' + meta.name + ' :' +
            JSON.stringify(data))
        } */
        id = Object.keys(toClientMappings).find(key => toClientMappings[key] === meta.name);
        callback("clientbound", meta, data, id);
        if (!endedClient) {
          client.write(meta.name, data)
          if (meta.name === 'set_compression') {
            client.compressionThreshold = data.threshold
          } // Set compression
        }
      }
    })
    const bufferEqual = require('buffer-equal')
    targetClient.on('raw', function (buffer, meta) {
      if (client.state !== states.PLAY || meta.state !== states.PLAY) { return }
      const packetData = targetClient.deserializer.parsePacketBuffer(buffer).data.params
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
      if (!endedClient) { client.end('End') }
    })
    targetClient.on('error', function (err) {
      endedTargetClient = true
      console.log('Connection error by server', '(' + addr + ') ', err)
      console.log(err.stack)
      if (!endedClient) { client.end('Error') }
    })
  })
}

exports.end = function() {}

exports.writeToClient = function(meta, data) {
  realClient.write(meta.name, data);
  id = Object.keys(toClientMappings).find(key => toClientMappings[key] === meta.name);
  storedCallback("clientbound", meta, data, id); // TODO: indicator for injected packets
}

exports.writeToServer = function(meta, data) {
  realServer.write(meta.name, data);
  id = Object.keys(toServerMappings).find(key => toServerMappings[key] === meta.name);
  storedCallback("serverbound", meta, data, id);
}
