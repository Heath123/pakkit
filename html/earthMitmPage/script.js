const { ipcRenderer } = require('electron')

const stepElement = document.getElementById('step')

let webAddress
let proxyPort
let localIP

ipcRenderer.on('proxyStarted', (event, arg) => {
  const ipcMessage = JSON.parse(arg)
  console.log(ipcMessage)
  webAddress = ipcMessage.webAddress
  proxyPort = ipcMessage.proxyPort
  localIP = ipcMessage.localIP
  stepElement.innerText = `Proxy started! Please download TunProxy on an Android phone and connect to ${localIP}:${proxyPort}`
})

ipcRenderer.on('hasConnected', debugConnect)

function debugConnect () {
  // TODO: check this is the right address
  stepElement.innerHTML = `Connected!<br>
    If you haven't already, go to mitm.it on your phone and follow the steps to install your SSL certificate.<br>
    Click <a href="javascript:certInstalled()">here</a> to continue.`
}

function certInstalled () {
  stepElement.innerHTML = ''

  // TODO: temporary until I figure out the x-frame thing
  ipcRenderer.send('injectCssSoon', '')
  window.location.href = webAddress

  /* const frame = document.createElement('iframe')
  frame.src = webAddress
  frame.id = 'mitmFrame'
  document.body.appendChild(frame) */
}
