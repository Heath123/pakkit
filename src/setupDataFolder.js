const fs = require('fs')
const md5File = require('md5-file')

function copyIfNotMatches (src, dest) {
  if (!fs.existsSync(dest)) {
    fs.copyFileSync(src, dest)
  } else {
    const packagedHash = md5File.sync(src)
    console.log('The MD5 hash of the packaged', src.split('/')[src.split('/').length - 1], 'is', packagedHash)
    const savedHash = md5File.sync(dest)
    console.log('The MD5 hash of the saved', src.split('/')[src.split('/').length - 1], 'is', savedHash)
    if (packagedHash === savedHash) {
      console.log('Match! Not copying.')
    } else {
      console.log('No match! Overwriting.')
      fs.copyFileSync(src, dest)
    }
  }
}

exports.setup = function (osDataFolder, resourcesPath) {
  const dataFolder = osDataFolder + '/pakkit'
  if (!fs.existsSync(dataFolder)) {
    fs.mkdirSync(dataFolder)
  }

  if (!fs.existsSync(dataFolder + '/proxypass')) {
    fs.mkdirSync(dataFolder + '/proxypass')
  }

  copyIfNotMatches(resourcesPath + 'data/proxypass-pakkit.jar', dataFolder + '/proxypass/proxypass-pakkit.jar')

  return dataFolder
}
