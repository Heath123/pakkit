const { ipcRenderer } = require('electron')
const Store = require('electron-store')

const store = new Store()

/* const customTitlebar = require('custom-electron-titlebar');

new customTitlebar.Titlebar({
    backgroundColor: customTitlebar.Color.fromHex('#FFF')
}); */

if (!store.get('authConsentGiven')) {
  document.getElementById('consent-box').style.display = 'contents'
}

let isLoading = false
let connectAddress
let connectPort


let listenPort
let platform
let version
let useCustomBuildplateServer

loadSetting('lastPlatform', 'platform', 'platform', 'java')
let lastPlatform = platform
platformChange()
loadSettings(platform)
updateEarth()

function loadSettings (newPlatform) {
  loadSetting(newPlatform + 'LastVersion', 'version', 'version', '1.16.4')
  loadSetting(newPlatform + 'LastConnectAddress', 'connectAddress', 'connect-address', '127.0.0.1')
  loadSetting(newPlatform + 'LastConnectPort', 'connectPort', 'connect-port', platform === 'java' ? '25565' : '19132')
  loadSetting(newPlatform + 'LastListenPort', 'listenPort', 'listen-port', platform === 'java' ? '25566' : '19142')
  loadSetting(newPlatform + 'LastUseCustomBuildplateServer', 'useCustomBuildplateServer', 'customIP', false, true)
}

function saveSettings (thePlatform) {
  store.set('lastPlatform', platform)
  store.set(thePlatform + 'LastVersion', version)
  store.set(thePlatform + 'LastConnectAddress', connectAddress)
  store.set(thePlatform + 'LastConnectPort', connectPort)
  store.set(thePlatform + 'LastListenPort', listenPort)
  store.set(thePlatform + 'LastUseCustomBuildplateServer', useCustomBuildplateServer)
}

function loadSetting (name, varname, elementID, defaultValue, isCheckbox) {
  if (!store.get(name)) {
    store.set(name, defaultValue)
  }

  window[varname] = store.get(name)
  if (isCheckbox) {
    document.getElementById(elementID).checked = window[varname]
  } else {
    document.getElementById(elementID).value = window[varname]
  }
}

function updateVars () {
  connectAddress = document.getElementById('connect-address').value
  connectPort = document.getElementById('connect-port').value
  listenPort = document.getElementById('listen-port').value
  platform = document.getElementById('platform').value
  version = document.getElementById('version').value
  useCustomBuildplateServer = document.getElementById('customIP').checked
}

function platformChange () {
  platform = document.getElementById('platform').value
  if (lastPlatform !== platform) {
    updateVars()
    saveSettings(lastPlatform)
  }
  if (platform === 'bedrock' || platform === 'earth-mitm') {
    document.getElementById('version-bedrock').style.display = 'block'
    document.getElementById('version').style.display = 'none'
  } else {
    document.getElementById('version').style.display = 'block'
    document.getElementById('version-bedrock').style.display = 'none'
  }
  updateEarth()
  loadSettings(platform)
  lastPlatform = platform
}

function updateEarth () {
  platform = document.getElementById('platform').value
  if (platform === 'earth-mitm') {
    if (document.getElementById('customIP').checked) {
      console.log('y')
      document.getElementById('address-options-main').style.display = 'contents'
    } else {
      console.log('n')
      document.getElementById('address-options-main').style.display = 'none'
    }
    document.getElementById('address-options-listen').style.display = 'none'
    document.getElementById('earth').style.display = 'contents'
  } else {
    document.getElementById('address-options-main').style.display = 'contents'
    document.getElementById('address-options-listen').style.display = 'contents'
    document.getElementById('earth').style.display = 'none'
  }
}

// setInterval(updateEarth, 1000)

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
    listenPort = (listenPort === '') ? '19142' : listenPort
  } else {
    connectPort = (connectPort === '') ? '25565' : connectPort
    listenPort = (listenPort === '') ? '25566' : listenPort
  }
  if (document.getElementById('consent').checked) {
    store.set('authConsentGiven', true)
  }
  // TODO: Validate data (e.g. port range)
  ipcRenderer.send('startProxy', JSON.stringify({
    consent: store.get('authConsentGiven'),
    connectAddress,
    connectPort,
    listenPort,
    platform,
    version,
    useCustomBuildplateServer
  }))
}
