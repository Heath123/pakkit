const errorDiv = document.getElementById('error')

// https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onerror
function handleError (stack) {
  // Reformat message
  const split = stack.split('at')
  split[0] = split[0].split('\n').join(' ').trim() + '\n'

  errorDiv.innerText = split.slice(0, 2).join('at')

  return false;
}

window.onerror = function (msg, url, lineNo, columnNo, err) {
  handleError(msg + '\n' + '   at ' + url + ':' + lineNo + ':' + columnNo)
}