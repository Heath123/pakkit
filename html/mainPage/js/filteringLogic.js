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

exports.packetCollapsed = function (packet1, packet2, collapsedPackets) {
  return collapsedPackets[packet1.direction].includes(packet1.meta.name)
    && packet1.meta.name === packet2.meta.name
    && packet1.hexIdString === packet2.hexIdString
    && packet1.direction === packet2.direction
}

exports.buildOrIncrementHeader = function (packet, existingHtml, groupId, expandedGroups) {
  if (existingHtml.match(/<li .* class=".*header/)) {
    // Increment existing header
    const countRegex = /<span class="header-count">([0-9]*)<\/span>/
    const incrementedNum = +countRegex.exec(existingHtml)[1] + 1
    return {
      newHtml: existingHtml.replace(countRegex, `<span class="header-count">${incrementedNum}</span>`),
      shouldReplace: !expandedGroups.includes(groupId),
      newGroupId: groupId
    }
  } else {
    // Build new header
    return {
      newHtml: `<li id="group${groupId}" onclick="groupClick(${groupId})" class="packet serverbound ${expandedGroups.includes(groupId) ? 'header-expanded' : 'header'}">
                  ${expandedGroups.includes(groupId) ? '▾' : '▸'} <span class="header-count">2</span>
                  <span class="id">${packet.hexIdString}</span> <!-- TODO -->
                  <span class="name">${packet.meta.name}</span>
                </li>`,
      shouldReplace: !expandedGroups.includes(groupId),
      newGroupId: groupId + 1
    }
  }
}