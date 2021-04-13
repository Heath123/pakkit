exports.packetFilteredByFilterBox = function (packet, filter, hiddenPackets, inverseFiltering, regexFilter,
  sharedVars) {
  if (hiddenPackets[packet.direction].includes(packet.meta.name)) {
    return true
  }

  if (sharedVars.lastFilter === '') {
    return false
  }

  const comparisonString = packet.hexIdString + ' ' + packet.meta.name + ' ' + JSON.stringify(packet.data)

  if (regexFilter && typeof filter === 'string') {
    try {
      filter = new RegExp(sharedVars.lastFilter)
    } catch (err) {
      // TODO: handle
      console.error(err)
      filter = new RegExp("")
    }
  }

  let result
  if (regexFilter) {
    result = filter.test(comparisonString)
  } else {
    result = comparisonString.includes(filter)
  }

  if (inverseFiltering) {
    return result
  } else {
    return !result
  }
}

exports.packetCollapsed = function (packet, filter, hiddenPackets) {
  return packet.meta.name === 'position'
}
