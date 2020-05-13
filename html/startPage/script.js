const { ipcRenderer } = require('electron')
/* const customTitlebar = require('custom-electron-titlebar');

new customTitlebar.Titlebar({
    backgroundColor: customTitlebar.Color.fromHex('#FFF')
}); */

function startProxy(event) {
  event.preventDefault();
  ipcRenderer.send('startProxy', JSON.stringify({
    connectAddress: document.getElementById("connect-address").value,
    connectPort: document.getElementById("connect-port").value,
    listenPort: document.getElementById("listen-port").value,
    version: document.getElementById("version").value
  }))
}
