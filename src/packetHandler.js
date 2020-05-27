var mainWindow;
var ipcMain;
var proxy;

exports.init = function(window, passedIpcMain, passedProxy) {
  mainWindow = window;
  ipcMain = passedIpcMain;
  proxy = passedProxy;

  console.log("init");

  ipcMain.on('injectPacket', (event, arg) => {
    ipcMessage = JSON.parse(arg);
    if (ipcMessage.direction == "clientbound") {
      passedProxy.writeToClient(ipcMessage.meta, ipcMessage.data);
    } else {
      passedProxy.writeToServer(ipcMessage.meta, ipcMessage.data);
    }
  });
}

exports.packetHandler = function(direction, meta, data, id) {
  try {
    mainWindow.send('packet', JSON.stringify({meta: meta, data: data, direction: direction, hexIdString: id}));
  } catch (err) {
    console.error(err);
  }
}
