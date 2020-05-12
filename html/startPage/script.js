const { ipcRenderer } = require('electron')

function startProxy(event) {
  event.preventDefault();
  ipcRenderer.send('asynchronous-message', JSON.stringify({
    name: "startProxy",
    connectAddress: document.getElementById("connect-address").value,
    connectPort: document.getElementById("connect-port").value,
    version: document.getElementById("version").value
  }))
}
