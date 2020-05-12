const { app, BrowserWindow, ipcMain } = require('electron')
const javaProxy = require('./proxy/java/proxy.js')

function createWindow () {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    },
    icon: 'icon.png' // TODO: Add this
  })
  win.setMenu(null);
  // and load the index.html of the app.
  win.loadFile('html/startPage/index.html')

  // Open the DevTools.
  win.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

function trimData(data) {
  newData = Object.assign({}, data);
  Object.entries(newData).forEach(function(entry) {
    try {
      if (JSON.stringify(entry[1]).length > 15) {
        if (typeof entry[1] == "number") {
          newData[entry[0]] = Math.round((entry[1] + Number.EPSILON) * 100) / 100
        } else {
          newData[entry[0]] = "...";
        }
      }
    } catch(err) {

    }
  });
  newData = JSON.stringify(newData);
  if (newData.length > 750) {
    newData = newData.slice(0, 750);
  }
  return newData;
}

function packetHandler(direction, meta, data) {
  console.log(direction);
  console.log(meta.name);
  BrowserWindow.getAllWindows()[0].webContents.send('asynchronous-message', JSON.stringify({name: "packet", packetName: meta.name, data: trimData(data), direction: direction}));
}

ipcMain.on('asynchronous-message', (event, arg) => {
   ipcMessage = JSON.parse(arg);
   switch(ipcMessage.name) {
      case "startProxy":
        javaProxy.startProxy(ipcMessage.connectAddress, ipcMessage.connectPort, ipcMessage.version, packetHandler);
        BrowserWindow.getAllWindows()[0].loadFile('html/mainPage/index.html')
        break;
      default:
        console.log("Unknown IPC message: " + ipcMessage.name)
    }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
