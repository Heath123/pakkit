// Get a reasonable local IP address, preferring wired connections over wireless ones
// Based on https://stackoverflow.com/a/8440736/4012708, but only returns one address
const { networkInterfaces } = require('os')

exports.getReasonableIP = function() {
  const nets = networkInterfaces()
  const results = Object.create(null) // Or just '{}', an empty object

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (net.family === 'IPv4' && !net.internal) {
        if (!results[name]) {
          results[name] = []
        }
        results[name].push(net.address)
      }
    }
  }

  console.log(results)

  // Old naming scheme for Ethernet (and also Windows where it's just Ethernet)
  for (const interfaceName in results) {
    if (interfaceName.toLowerCase().startsWith('eth')) return results[interfaceName]
  }

  for (const interfaceName in results) {
    if (interfaceName.toLowerCase().startsWith('wifi') ||
        interfaceName.toLowerCase().startsWith('wireless')) return results[interfaceName]
  }

  // New naming scheme for Ethernet
  for (const interfaceName in results) {
    if (interfaceName.startsWith('en')) return results[interfaceName]
  }

  // Old naming scheme for WiFi
  for (const interfaceName in results) {
    if (interfaceName.startsWith('wlan')) return results[interfaceName]
  }

  // New naming scheme for WiFi (starts with w, not sure what comes after)
  for (const interfaceName in results) {
    if (interfaceName.toLowerCase().startsWith('w')) return results[interfaceName]
  }

  // Give up and return first IP
  return Object.values(results)[0]
}
