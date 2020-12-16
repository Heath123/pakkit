/* global localStorage */

const { ipcRenderer } = require('electron')

/* const customTitlebar = require('custom-electron-titlebar');

new customTitlebar.Titlebar({
    backgroundColor: customTitlebar.Color.fromHex('#FFF')
}); */

if (localStorage.getItem('authConsentGiven') !== 'true') {
  document.getElementById('consent-box').style.display = 'contents'
}

let isLoading = false

let connectAddress
let connectPort
let listenPort
let platform
let version

loadSetting('lastPlatform', 'platform', 'platform', 'java')
let lastPlatform = platform
platformChange()
loadSettings(platform)

function loadSettings (newPlatform) {
  loadSetting(newPlatform + 'LastVersion', 'version', 'version', '1.15.2')
  loadSetting(newPlatform + 'LastConnectAddress', 'connectAddress', 'connect-address', '127.0.0.1')
  loadSetting(newPlatform + 'LastConnectPort', 'connectPort', 'connect-port', platform === 'java' ? '25565' : '19132')
  loadSetting(newPlatform + 'LastListenPort', 'listenPort', 'listen-port', platform === 'java' ? '25566' : '19133')
}

function saveSettings (thePlatform) {
  localStorage.setItem('lastPlatform', platform)
  localStorage.setItem(thePlatform + 'LastVersion', version)
  localStorage.setItem(thePlatform + 'LastConnectAddress', connectAddress)
  localStorage.setItem(thePlatform + 'LastConnectPort', connectPort)
  localStorage.setItem(thePlatform + 'LastListenPort', listenPort)
}

function loadSetting (name, varname, elementID, defaultValue) {
  if (!localStorage.getItem(name)) {
    localStorage.setItem(name, defaultValue)
  }

  window[varname] = localStorage.getItem(name)
  document.getElementById(elementID).value = window[varname]
}

function updateVars () {
  connectAddress = document.getElementById('connect-address').value
  connectPort = document.getElementById('connect-port').value
  listenPort = document.getElementById('listen-port').value
  platform = document.getElementById('platform').value
  version = document.getElementById('version').value
}

function platformChange () {
  platform = document.getElementById('platform').value
  if (lastPlatform !== platform) {
    updateVars()
    saveSettings(lastPlatform)
  }
  if (platform === 'bedrock') {
    document.getElementById('version-bedrock').style.display = 'block'
    document.getElementById('version').style.display = 'none'
  } else {
    document.getElementById('version').style.display = 'block'
    document.getElementById('version-bedrock').style.display = 'none'
  }
  loadSettings(platform)
  lastPlatform = platform
}

window.startProxy = function (event) {
  if (isLoading) {
    return
  }
  isLoading = true
  event.preventDefault()
  updateVars()
  saveSettings(platform)
  // If blank use default values
  connectAddress = (connectAddress === '') ? '127.0.0.1' : connectAddress
  if (platform === 'bedrock') {
    connectPort = (connectPort === '') ? '19132' : connectPort
    listenPort = (listenPort === '') ? '19133' : listenPort
  } else {
    connectPort = (connectPort === '') ? '25565' : connectPort
    listenPort = (listenPort === '') ? '25566' : listenPort
  }
  if (document.getElementById('consent').checked) {
    localStorage.setItem('authConsentGiven', 'true')
  }
  // TODO: Validate data (e.g. port range)
  ipcRenderer.send('startProxy', JSON.stringify({
    consent: localStorage.getItem('authConsentGiven') === 'true',
    connectAddress: connectAddress,
    connectPort: connectPort,
    listenPort: listenPort,
    platform: platform,
    version: version
  }))
}
