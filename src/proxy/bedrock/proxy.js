const fs = require('fs')
const java = require('java')

let child
let storedCallback

// TODO: Can it still be frozen?
let mayBeFrozen = false
let timeFrozen

// This whole thing is messy for now.

exports.capabilities = {
  modifyPackets: true,
  jsonData: true,
  rawData: true,
  wikiVgPage: 'https://wiki.vg/Bedrock_Protocol'
}

exports.startProxy = function (host, port, listenPort, version, authConsent, callback, dataFolder) {
  java.classpath.push(dataFolder + '/proxypass/proxypass-pakkit.jar')
  const proxyPass = java.import('com.nukkitx.proxypass.ProxyPass')
  storedCallback = callback

  console.log(proxyPass)
  proxyPass.startFromArgs('0.0.0.0', Number(listenPort), host, Number(port), 1, true, function(err, test) {
    console.log(err, test)
  })

  setInterval(function () {
    // console.log('Polled!')

    for (const item of proxyPass.packetQueue.toArraySync()) {
      const name = item.packetType.toStringSync().toLowerCase();

      const data = JSON.parse(item.jsonData);
      const hexIdString = '0x' + item.packetId.toString(16).padStart(2, '0')

      // These values are unneeded or are exposed elsewhere in the GUI
      delete data.packetId
      delete data.packetType
      delete data.clientId
      delete data.senderId

      storedCallback(item.direction, { name: name, className: item.className }, data, hexIdString, Object.values(item.bytes))
    }

    proxyPass.packetQueue.clearSync()
  }, 100)

  console.log('Proxy started (Bedrock)!')
}

exports.end = function () {
  proxyPass.shutdownStaticSync();
}

exports.writeToClient = function (meta, data) {
  const proxyPlayerSession = java.import('com.nukkitx.proxypass.network.bedrock.session.ProxyPlayerSession')
  proxyPlayerSession.injectPacketStaticSync(JSON.stringify(data), meta.className, 'client')
}

exports.writeToServer = function (meta, data) {
  const proxyPlayerSession = java.import('com.nukkitx.proxypass.network.bedrock.session.ProxyPlayerSession')
  proxyPlayerSession.injectPacketStaticSync(JSON.stringify(data), meta.className, 'server')
}
