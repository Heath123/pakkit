var mainWindow;
var ipcMain;

exports.init = function(window, passedIpcMain) {
  mainWindow = window;
  ipcMain = passedIpcMain;
  console.log("init");
  /* ipcMain.on('requestPacketDetails', (event, arg) => {
    ipcMessage = JSON.parse(arg);
    mainWindow.send('packetDetails', JSON.stringify(allPackets[ipcMessage.id]));
  }); Moved to renderer process */
}

/* function trimData(data) { // Function to trim the size of stringified data for previews
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
} Moved to renderer process */

exports.packetHandler = function(direction, meta, data, id) {
  // console.log(direction);
  // console.log(meta);
  try {
    mainWindow.send('packet', JSON.stringify({meta: meta, data: data, direction: direction, hexIdString: id}));
  } catch (err) {
    console.error(err);
  }
}
