const fs = require('fs')
const md5File = require('md5-file')

exports.setup = function (osDataFolder, resourcesPath) {
  const dataFolder = osDataFolder + '/pakkit'
  if (!fs.existsSync(dataFolder)) {
    fs.mkdirSync(dataFolder)
  }

  if (!fs.existsSync(dataFolder + '/proxypass')) {
    fs.mkdirSync(dataFolder + '/proxypass')
  }

  if (!fs.existsSync(dataFolder + '/proxypass/proxypass-pakkit.jar')) {
    fs.copyFileSync(resourcesPath + 'data/proxypass-pakkit.jar', dataFolder + '/proxypass/proxypass-pakkit.jar')
  } else {
    const packagedHash = md5File.sync(resourcesPath + 'data/proxypass-pakkit.jar')
    console.log('The MD5 hash of the packaged ProxyPass is', packagedHash)
    const savedHash = md5File.sync(dataFolder + '/proxypass/proxypass-pakkit.jar')
    console.log('The MD5 hash of the saved ProxyPass is', savedHash)
    if (packagedHash === savedHash) {
      console.log('Match! Not copying.')
    } else {
      console.log('No match! Overwriting.')
      fs.copyFileSync(resourcesPath + 'data/proxypass-pakkit.jar', dataFolder + '/proxypass/proxypass-pakkit.jar')
    }
  }

  return dataFolder
}
