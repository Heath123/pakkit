const { ipcRenderer } = require('electron')

Split(['#packets', '#two'], {
    minSize: [50, 50],
})

ipcRenderer.on('asynchronous-message', (event, arg) => {
  ipcMessage = JSON.parse(arg);
  switch(ipcMessage.name) {
     case "packet":
     packetlist = document.getElementById("packetlist");
       if (packetlist.childElementCount > 100) {
         packetlist.removeChild(packetlist.childNodes[0]);
       }
       packetlist.innerHTML += `<li class="packet ${ipcMessage.direction}">
                     <span class="name">${ipcMessage.packetName}</span>
                     <span class="data">${ipcMessage.data}</span>
                   </li>`;
       break;
     default:
       console.log("Unknown IPC message: " + ipcMessage.name)
   }
})
