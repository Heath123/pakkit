exports.packetFilteredByFilterBox = function (packet, filter, hiddenPackets, inverseFiltering, regexFilter) {
  if (hiddenPackets[packet.direction].includes(packet.meta.name)) {
    return true
  }

  if (filter === '') {
    return false
  }

  const comparisonString = packet.hexIdString + ' ' + packet.meta.name + ' ' + JSON.stringify(packet.data)

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
