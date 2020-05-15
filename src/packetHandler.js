var mainWindow;
var ipcMain;
var javaProxy;

exports.init = function(window, passedIpcMain, passedJavaProxy) {
  mainWindow = window;
  ipcMain = passedIpcMain;
  javaProxy = passedJavaProxy;

  console.log("init");

  ipcMain.on('injectPacket', (event, arg) => {
    ipcMessage = JSON.parse(arg);
    passedJavaProxy.writeToClient(ipcMessage.meta, ipcMessage.data);
  });
}

exports.packetHandler = function(direction, meta, data, id) {
  try {
    mainWindow.send('packet', JSON.stringify({meta: meta, data: data, direction: direction, hexIdString: id}));
  } catch (err) {
    console.error(err);
  }
}
