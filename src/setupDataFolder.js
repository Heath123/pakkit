const fs = require("fs");

exports.setup = function(osDataFolder, resourcesPath) {
  dataFolder = osDataFolder + "/pakkit";
  if (!fs.existsSync(dataFolder)) {
    fs.mkdirSync(dataFolder);
  }

  if (!fs.existsSync(dataFolder + "/proxypass")) {
    fs.mkdirSync(dataFolder + "/proxypass");
  }

  if (!fs.existsSync(dataFolder + "/proxypass/proxypass-pakkit.jar")) {
    fs.copyFileSync(resourcesPath + "data/proxypass-pakkit.jar", dataFolder + "/proxypass/proxypass-pakkit.jar")
  }

  return dataFolder;
}
