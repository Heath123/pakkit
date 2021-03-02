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

exports.setup = function (osDataFolder, resourcesPath, copyFiles) {
  const dataFolder = osDataFolder + '/pakkit'
  if (!fs.existsSync(dataFolder)) {
    fs.mkdirSync(dataFolder)
  }

  if (!fs.existsSync(dataFolder + '/proxypass')) {
    fs.mkdirSync(dataFolder + '/proxypass')
  }

  if (!fs.existsSync(dataFolder + '/mitmScript')) {
    fs.mkdirSync(dataFolder + '/mitmScript')
  }

  if (copyFiles) {
    copyIfNotMatches(resourcesPath + 'data/proxypass-pakkit.jar', dataFolder + '/proxypass/proxypass-pakkit.jar')
    copyIfNotMatches(resourcesPath + 'data/earth-intercept.py', dataFolder + '/mitmScript/earth-intercept.py')

    exports.setScriptOptions(resourcesPath, dataFolder, false)
  }

  return dataFolder
}

exports.setScriptOptions = function (resourcesPath, dataFolder, useCustomIP, customIP, customPort) {
  copyIfNotMatches(resourcesPath + 'data/earth-intercept.py', dataFolder + '/mitmScript/earth-intercept.py')

  // Replace
  let pyScript = fs.readFileSync(dataFolder + '/mitmScript/earth-intercept.py', 'utf-8')
  pyScript = pyScript.replace('${PAKKIT_LOCATION}', JSON.stringify(process.argv[0] +
    // If process.argv[1] is empty we're probably on electron-forge and we need --
    // TODO: make this not break if you pass arguments
    (process.argv[1] ? ' ' + path.resolve(process.argv[1]) : ' --')
  ))
  // TODO: get actual local IP
  pyScript = pyScript.replace('${LOCAL_IP}', JSON.stringify(getReasonableIP()))
  if (useCustomIP) {
    pyScript = pyScript.replace('${USE_CUSTOM_IP}', 'True')
    pyScript = pyScript.replace('${CUSTOM_IP}', JSON.stringify(customIP))
    pyScript = pyScript.replace('${CUSTOM_PORT}', customPort)
  } else {
    pyScript = pyScript.replace('${USE_CUSTOM_IP}', 'False')
    pyScript = pyScript.replace('${CUSTOM_IP}', 'None')
    pyScript = pyScript.replace('${CUSTOM_PORT}', 'None')
  }
  fs.writeFileSync(dataFolder + '/mitmScript/earth-intercept.py', pyScript)
}
