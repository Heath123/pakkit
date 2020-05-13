const { app, BrowserWindow, ipcMain } = require('electron')
const javaProxy = require('./proxy/java/proxy.js')
const contextMenu = require('electron-context-menu');
const packetStorage = require('./packetStorage.js');

contextMenu({
	prepend: (defaultActions, params, browserWindow) => [
		{
			label: 'Rainbow',
			// Only show it when right-clicking images
			visible: params.mediaType === 'image'
		},
		{
			label: 'Search Google for “{selection}”',
			// Only show it when right-clicking text
			visible: params.selectionText.trim().length > 0,
			click: () => {
				shell.openExternal(`https://google.com/search?q=${encodeURIComponent(params.selectionText)}`);
			}
		}
	]
});

function createWindow () {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    // frame: false,
    webPreferences: {
      nodeIntegration: true
    },
    icon: 'icon.png' // TODO: Add this
  })
  win.setMenu(null);
  // and load the index.html of the app.
  win.loadFile('html/startPage/index.html')
  // Open the DevTools.
  // win.webContents.openDevTools()
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

ipcMain.on('startProxy', (event, arg) => {
  ipcMessage = JSON.parse(arg);
	packetStorage.init(BrowserWindow.getAllWindows()[0], ipcMain);
  javaProxy.startProxy(ipcMessage.connectAddress, ipcMessage.connectPort, ipcMessage.listenPort, ipcMessage.version, packetStorage.packetHandler);
  BrowserWindow.getAllWindows()[0].loadFile('html/mainPage/index.html');
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
