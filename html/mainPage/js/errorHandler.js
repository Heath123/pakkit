const errorDiv = document.getElementById('error')

// https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onerror
window.onerror = function (msg, url, lineNo, columnNo, error) {
  const string = msg.toLowerCase();
  const substring = "script error";
  if (string.indexOf(substring) > -1){
    errorDiv.innerText = 'Script error: Press F12 for details'
  }

  errorDiv.innerText = msg + '\n' + url + ':' + lineNo + ',' + columnNo

  return false;
}