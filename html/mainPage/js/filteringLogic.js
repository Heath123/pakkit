exports.packetFilteredByFilterBox = function (packet, filter, hiddenPackets) {
  if (hiddenPackets[packet.direction].includes(packet.meta.name)) {
    return true
  }

  if (filter === '') {
    return false
  }

  const comparisonString = packet.hexIdString + ' ' + packet.meta.name + ' ' + JSON.stringify(packet.data)
  return !comparisonString.includes(filter)
}