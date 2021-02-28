const { spawn } = require('child_process')
const { BrowserWindow, ipcMain } = require('electron')
const { getReasonableIP } = require('../../reasonableIP.js')

// TODO: maybe pass this and ipcMain in?
let mainWindow

let child
let dataFolder
let webAddress
let proxyPort
let proxyReady
let hasConnected

exports.capabilities = {
  modifyPackets: false,
  jsonData: false,
  rawData: false,
  scriptingSupport: false,
  clientboundPackets: {},
  serverboundPackets: {},
  wikiVgPage: undefined,
  versionId: 'earth-mitm-not-normal-proxy'
}

function handleOutput (chunk) {
  const output = chunk.toString('utf8').trim()
  try {
    console.log('mitmproxy output:', output)
  } catch (err) {
    console.error(err)
  }

  if (proxyReady && !hasConnected) {
    // TODO: better check
    if (output.includes('connected')) {
      hasConnected = true
      mainWindow.send('hasConnected', '')
    }
  }

  // Proxy already ready, no need to check
  if (proxyReady) {
    return
  }

  for (const line of output.split('\n')) {
    if (line.startsWith('Web server listening at ')) {
      webAddress = line.substring(24)
    }
    if (line.startsWith('Proxy server listening at http://*:')) {
      proxyPort = Number(line.substring(35))
    }
  }

  if (webAddress && proxyPort) {
    proxyReady = true
    proxyReadyHandler()
  }
}

function proxyReadyHandler () {
  mainWindow.send('proxyStarted', JSON.stringify({
    webAddress,
    proxyPort,
    localIP: getReasonableIP()
  }))
}

function handleError (chunk) {
  try {
    console.log('mitmproxy error:', chunk.toString('utf8').trim())
  } catch (err) {
    console.error(err)
  }
}

// TODO: temp until x-frame fixed
ipcMain.on('injectCssSoon', (event, args) => {
  setTimeout(() => {
    mainWindow.webContents.insertCSS(`
    body, .modal-content {
        background: #242424!important;
        color: rgba(255, 255, 255, 0.8)!important;
    }
    
    .nav-tabs > a, .nav-tabs > div > a {
      background: #191919;
      padding: 6px 16px!important;
      border: none!important;
      border-radius: 10px 10px 0 0!important;
      color: rgba(255, 255, 255, 0.8)!important;
      height: 30px!important;
    }
    
    .dropdown-menu > li > a:focus, .dropdown-menu > li > a:hover {
        color: rgba(255, 255, 255, 0.8)!important;
        background-color: #303030!important;
    }
    
    html body div#mitmproxy div#container header nav.nav-tabs.nav-tabs-lg div.dropdown.pull-left.open ul.dropdown-menu {
        border-radius: 10px!important;
    }
    
    /* Hide "Install certificates" */
    html body div#mitmproxy div#container header nav.nav-tabs.nav-tabs-lg div.dropdown.pull-left.open ul.dropdown-menu li:nth-child(4) {
        display: none!important;
    }
    
    .nav-tabs > a.active {
      background: #242424!important;
    }
    
    .dropdown-menu > li > a {
        color: rgba(255, 255, 255, 0.8)!important;
    }
    
    .dropdown-menu .divider {
        background: #191919!important;
        border-top: #191919!important;
    }
    
    header {
        padding-top: 0!important;
        background: #242424!important;
    }
    
    header > .nav-tabs.nav-tabs-lg {
        background: #121212!important;
        padding-top: 8px!important;
        border-bottom: solid #242424 1px!important;
        height: 39px!important;
    }
    
    header > div {
        border-bottom: solid #191919 1px!important;
    }
    
    .menu-content > .btn {
        background: transparent!important;
        color: rgba(255, 255, 255, 0.8)!important;
    }
    
    div.popover-content {
        background: #191919!important;
    }
    
    div.popover.bottom {
        background: transparent!important;
    }
    
    .table > tbody > tr > td, .table > tbody > tr > th, .table > tfoot > tr > td, .table > tfoot > tr > th, .table > thead > tr > td, .table > thead > tr > th {
        border-top: solid #242424 1px!important;
    }
    
    .flow-table {
        /* Force refresh scroll bar  - is overridden later */
        overflow-y: auto!important;
    }
    
    .flow-table thead {
        background: #303030!important;
    }
    
    .flow-table th {
        box-shadow: 0 1px 0 #191919!important;
        padding-left: 8px!important;
    }
    
    .flow-table th.sort-asc, .flow-table th.sort-desc {
        background: #202020!important;
    }
    
    .flow-table th.sort-asc::after, .flow-table th.sort-desc::after {
        background: transparent!important;
    }
    
    footer {
        box-shadow: 0 -1px 1px #191919!important;
    }
    
    input, input.form-control, select, button, textarea {
        box-shadow: none!important;
    }
    
    .filter-input > input.form-control {
        border-radius: 0 10px 10px 0!important;
    }
    
    span.input-group-addon {
        background: #191919!important;
        border-color: #101010!important;
        border-radius: 10px 0 0 10px!important;
    }
    
    .has-error .input-group-addon {
        border-color: #20100F!important;
            border-right-color: rgb(32, 16, 15)!important;
        background-color: #201919!important;
    }
    
    .fa.fa-fw.fa-search {
        color: rgba(255, 255, 255, 0.8)!important;
    }
    
    .popover > .arrow, .popover > .arrow::after {
        border-bottom-color: #292929!important;
    }
    
    .menu-group + .menu-group::before {
        border-left: solid 1px #191919!important;
    }
    
    .close {
        color: white!important;
    }
    
    .modal-header {
        border-bottom: solid 1px #191919!important;
    }
    
    .modal-footer {
        border-top: solid 1px #191919!important;
    }
    
    .dropdown-menu {
        background: #202020!important;
        border-radius: 10px!important;
    }
    
    /* pakkit shared styles */
    
    input, input.form-control, select, button, textarea {
      background: #191919!important;
      color: rgba(255, 255, 255, 0.8)!important;
      border: 1px solid #101010!important;
      border-radius: 10px!important;
      padding: 10px!important;
      outline: none!important;
    }
    
    /* Scrollbar */
    
    *::-webkit-scrollbar {
        background: #242424!important;
        width: 17px!important;
    }
    
    *::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.3)!important;
        border-radius: 10px!important;
    }
    *::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.2)!important;
        border-radius: 10px!important;
    }
    
    *::-webkit-scrollbar-thumb:hover {
      background: rgba(0, 0, 0, 0.5)!important;
    }
    
    *::-webkit-scrollbar-corner {
        background: #242424!important;
    }
    `)
    mainWindow.webContents.executeJavaScript(`document.title = 'pakkit - mitmproxy'`)
  }, 1000)
  setTimeout(() => {
    mainWindow.webContents.insertCSS(`
    .flow-table.flow-table {
        /* Force refresh scroll bar */
        overflow-y: scroll!important;
    }`)
  }, 1200)
})

exports.startProxy = function (passedHost, passedPort, passedListenPort, version, authConsent, passedPacketCallback,
  passedMessageCallback, passedDataFolder, passedUpdateFilteringCallback) {
  dataFolder = passedDataFolder
  mainWindow = BrowserWindow.getAllWindows()[0]

  child = spawn('mitmweb', ['-s', dataFolder + '/earth-intercept.py', '--no-web-open-browser'])
  child.stdout.on('data', handleOutput)
  child.stderr.on('data', handleError)
}
