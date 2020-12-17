const fs = require('fs')
const { spawn } = require('child_process')

let child
let storedCallback

let mayBeFrozen = false
let timeFrozen

// This whole thing is messy for now.

function processPacket (text) {
  try {
    if (!(text.startsWith('[CLIENT BOUND]') || text.startsWith('[SERVER BOUND]'))) {
      if (text.trim() !== '') {
        console.log('ProxyPass output:', text.trim())
      }
      return
    }
    let name = text.split('-')[1].split('(')[0].trim()
    const str = '(' + text.split('(').slice(1).join('(')

    let out = ''
    let indentlevel = 0
    for (let i = 0; i < str.length; i++) {
      if (str.charAt(i) === ')' || str.charAt(i) === '}' || str.charAt(i) === ']') {
        indentlevel -= 1
        if (indentlevel < 0) {
          indentlevel = 0
        }
        out += '\n' + ' '.repeat(indentlevel * 2)
      }
      out += str.charAt(i)
      if (str.charAt(i) === '(' || str.charAt(i) === '{' || str.charAt(i) === '[') {
        indentlevel += 1
        out += '\n' + ' '.repeat(indentlevel * 2)
      }
      if (str.charAt(i) === ',') {
        out += '\n' + ' '.repeat(indentlevel * 2 - 1)
      }
    }

    // https://stackoverflow.com/questions/5582228/insert-space-before-capital-letters
    name = name.replace(/([A-Z])/g, ' $1').trim().toLowerCase().split(' ').join('_').replace('_packet', '')

    if (text.startsWith('[CLIENT BOUND]')) {
      storedCallback('clientbound', { name: name }, { data: out }, '')
    } else if (text.startsWith('[SERVER BOUND]')) {
      storedCallback('serverbound', { name: name }, { data: out }, '')
    }
  } catch (err) {
    console.error(err)
  }
}

exports.capabilities = {
  modifyPackets: false,
  jsonData: false,
  rawData: false
}

exports.startProxy = function (host, port, listenPort, version, authConsent, callback, dataFolder) {
  storedCallback = callback
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

  child.stdout.setEncoding('utf8')
  child.stderr.setEncoding('utf8')
  child.stdout.on('data', (chunk) => {
    try {
      mayBeFrozen = false // New messages mean it isn't froxen
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
  })

  /* exec("java -jar proxypass-pakkit.jar", function (error, stdout, stderr){
    console.log(error, stderr, stdout);
  }); */

  console.log('Proxy started (Bedrock)!')
  setInterval(function () {
    // Check if ProxyPass has been stuck for more than 3 seconds
    if (mayBeFrozen && (Math.floor(new Date()) - timeFrozen) >= 3000) {
      console.log('ProxyPass may be frozen - restarting...')
      mayBeFrozen = false
      exports.end()
      exports.startProxy(host, port, listenPort, version, callback, dataFolder)
    }
  }, 500)
}

exports.end = function () {
  child.stdin.pause()
  child.kill()
}

exports.writeToClient = function (meta, data) {}

exports.writeToServer = function (meta, data) {}
