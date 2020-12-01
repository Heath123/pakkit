exports.packetFilteredByFilterBox = function (packet, filter) {
  if (filter === '') {
    return false
  }
  const comparisonString = packet.hexIdString + ' ' + packet.meta.name + ' ' + JSON.stringify(packet.data)
  return !comparisonString.includes(filter)
}