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
  wikiVgPage: 'https://wiki.vg/Bedrock_Protocol'
}

exports.startProxy = function (host, port, listenPort, version, authConsent, callback, dataFolder) {
  java.classpath.push(dataFolder + '/proxypass/proxypass-pakkit.jar')
  const proxyPass = java.import('com.nukkitx.proxypass.ProxyPass')
  storedCallback = callback
  /* fs.writeFileSync(dataFolder + '/proxypass/config.yml', `
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
`) */

  const olddir = process.cwd()
  process.chdir(dataFolder + '/proxypass/')

  // child = spawn('java', ['-jar', 'proxypass-pakkit.jar'])
  console.log(proxyPass)
  proxyPass.startFromArgs('0.0.0.0', Number(listenPort), host, Number(port), 1, true, function(err, test) {
    console.log(err, test)
  })
  console.log('test!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!1')

  process.chdir(olddir)

  /* child.stdout.setEncoding('utf8')
  child.stderr.setEncoding('utf8')
  child.stdout.on('data', (chunk) => {
    try {
      mayBeFrozen = false // New messages mean it isn't frozen
      if (chunk.search('Initializing proxy session') !== -1) { // ProxyPass gets stuck here sometimes
        timeFrozen = Math.floor(new Date())
        mayBeFrozen = true
      }

      chunk.split('\n').forEach((item) => {
        processPacket(item)
      })
    } catch (err) {
      console.error(err)
    }
  })
  child.stderr.on('data', (chunk) => {
    try {
      console.log('ProxyPass error:', chunk.trim())
    } catch (err) {
      console.error(err)
    }
  })
  // since these are streams, you can pipe them elsewhere
  // child.stderr.pipe(dest);
  child.on('close', (code) => {
    if (code) {
      console.log(`child process exited with code ${code} - restarting...`)
      exports.end()
      exports.startProxy(host, port, listenPort, version, callback, dataFolder)
    }
  }) */

  /* exec("java -jar proxypass-pakkit.jar", function (error, stdout, stderr){
    console.log(error, stderr, stdout);
  }); */

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

      storedCallback(item.direction, { name: name, className: item.className }, data, hexIdString)
    }

    proxyPass.packetQueue.clearSync()
  }, 100)

  console.log('Proxy started (Bedrock)!')
  /* setInterval(function () {
    // Check if ProxyPass has been stuck for more than 3 seconds
    if (mayBeFrozen && (Math.floor(new Date()) - timeFrozen) >= 3000) {
      console.log('ProxyPass may be frozen - restarting...')
      mayBeFrozen = false
      exports.end()
      exports.startProxy(host, port, listenPort, version, callback, dataFolder)
    }
  }, 500) */
}

exports.end = function () {
  // TODO
}

exports.writeToClient = function (meta, data) {
  const proxyPlayerSession = java.import('com.nukkitx.proxypass.network.bedrock.session.ProxyPlayerSession')
  proxyPlayerSession.injectPacketStaticSync(JSON.stringify(data), meta.className, 'client')
}

exports.writeToServer = function (meta, data) {
  const proxyPlayerSession = java.import('com.nukkitx.proxypass.network.bedrock.session.ProxyPlayerSession')
  proxyPlayerSession.injectPacketStaticSync(JSON.stringify(data), meta.className, 'server')
}
