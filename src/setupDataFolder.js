const fs = require('fs')
const path = require('path')
const md5File = require('md5-file')
const { getReasonableIP } = require('./reasonableIP.js')

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
  copyIfNotMatches(resourcesPath + 'data/earth-intercept.py', dataFolder + '/earth-intercept.py')

  // Replace
  let pyScript = fs.readFileSync(dataFolder + '/earth-intercept.py', 'utf-8')
  pyScript = pyScript.replace('${PAKKIT_LOCATION}', JSON.stringify(process.argv[0] + ' ' + path.resolve(process.argv[1])))
  // TODO: find free port
  pyScript = pyScript.split('${PAKKIT_PORT}').join('19122')
  // TODO: get actual local IP
  pyScript = pyScript.replace('${LOCAL_IP}', JSON.stringify(getReasonableIP()))
  fs.writeFileSync(dataFolder + '/earth-intercept.py', pyScript)

  return dataFolder
}
