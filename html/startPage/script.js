const {ipcRenderer} = require('electron')
const Store = require('electron-store')
const mcData = require('minecraft-data');

const store = new Store()

/* const customTitlebar = require('custom-electron-titlebar');

new customTitlebar.Titlebar({
    backgroundColor: customTitlebar.Color.fromHex('#FFF')
}); */

// if (!store.get('authConsentGiven')) {
//   document.getElementById('consent-row').style.display = 'flex'
// }

let isLoading = false
let connectAddress
let connectPort
let listenPort
let platform
let version
let onlineMode

loadVersionsFromMcData();
loadSetting('lastPlatform', 'platform', 'platform', 'java')
let lastPlatform = platform
platformChange()
loadSettings(platform)

function loadVersionsFromMcData() {
  const bedrockVersions = mcData.supportedVersions.bedrock.reverse();
  const bedrockSelect = document.getElementById('version-bedrock');
  bedrockSelect.innerHTML = ''; // Clear existing options
  bedrockVersions.forEach((version) => {
    const option = document.createElement('option');
    option.value = version;
    option.textContent = version;
    bedrockSelect.appendChild(option);
  });

  const javaVersions = mcData.supportedVersions.pc.reverse();
  const javaSelect = document.getElementById('version');
  javaSelect.innerHTML = ''; // Clear existing options
  javaVersions.forEach((version) => {
    const option = document.createElement('option');
    option.value = version;
    option.textContent = version;
    javaSelect.appendChild(option);
  });
}
function loadSettings(newPlatform)
{
  loadSetting(newPlatform + 'LastVersion', 'version', 'version', '1.18.2')
  loadSetting(newPlatform + 'LastConnectAddress', 'connectAddress', 'connect-address', '127.0.0.1')
  loadSetting(newPlatform + 'LastConnectPort', 'connectPort', 'connect-port', platform === 'java' ? '25565' : '19132')
  loadSetting(newPlatform + 'LastListenPort', 'listenPort', 'listen-port', platform === 'java' ? '25566' : '19142')
  loadSetting(newPlatform + 'LastOnlineMode', 'onlineMode', 'auth-online', true)
}

function saveSettings(thePlatform)
{
  store.set('lastPlatform', platform)
  store.set(thePlatform + 'LastVersion', version)
  store.set(thePlatform + 'LastConnectAddress', connectAddress)
  store.set(thePlatform + 'LastConnectPort', connectPort)
  store.set(thePlatform + 'LastListenPort', listenPort)
  store.set(thePlatform + 'LastOnlineMode', onlineMode)
}

function loadSetting(name, varname, elementID, defaultValue)
{
  if (!store.has(name)) {
    store.set(name, defaultValue)
  }

  window[varname] = store.get(name)
  if (varname === 'onlineMode') {
    document.getElementById(elementID).checked = window[varname]
  } else {
    document.getElementById(elementID).value = window[varname]
  }
}

function updateVars(platform)
{
  connectAddress = document.getElementById('connect-address').value
  connectPort = document.getElementById('connect-port').value
  listenPort = document.getElementById('listen-port').value

  switch(platform){
    case 'bedrock':
      version = document.getElementById('version-bedrock').value;
      break;
    case 'java':
      version = document.getElementById('version').value;
      break;
  }

  onlineMode = document.getElementById('auth-online').checked
}

function platformChange()
{
  platform = document.getElementById('platform').value
  if (lastPlatform !== platform && lastPlatform) {
    updateVars(lastPlatform)
    saveSettings(lastPlatform)
  }
  switch(platform){
    case 'bedrock':
      document.getElementById('version').style.display = 'none'
      document.getElementById('version-bedrock').style.display = 'block'
      document.getElementById('auth-row').style.display = 'block'
      break;
    case 'java':
      document.getElementById('version').style.display = 'block'
      document.getElementById('version-bedrock').style.display = 'none'
      document.getElementById('auth-row').style.display = 'block'
      break;
  }
  loadSettings(platform)
  lastPlatform = platform
}

window.startProxy = function (event)
{
  if (isLoading) {
    return
  }
  isLoading = true
  event.preventDefault()
  updateVars(platform)
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
  // if (document.getElementById('consent').checked) {
  //   store.set('authConsentGiven', true)
  // }
  store.set('authConsentGiven', false)
  // TODO: Validate data (e.g. port range)
  ipcRenderer.send('startProxy', JSON.stringify({
    consent: store.get('authConsentGiven'),
    connectAddress: connectAddress,
    connectPort: connectPort,
    listenPort: listenPort,
    platform: platform,
    version: version,
    onlineMode: onlineMode,
  }))
}
