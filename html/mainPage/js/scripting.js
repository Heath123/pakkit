let sharedVars

exports.updateScript = function (fromCheckbox) {
  if (!((fromCheckbox === true) || document.getElementById('enableScripting').checked)) return
  sharedVars.ipcRenderer.send('scriptStateChange', JSON.stringify({ //
    scriptingEnabled: document.getElementById('enableScripting').checked,
    script: window.scriptEditor.getDoc().getValue()
  }))
}

exports.setup = function (passedSharedVars) {
  sharedVars = passedSharedVars

  const defaultScript = `// See the node-minecraft-protocol docs
// When editing your scripts, disable scripting or disconnect so
// you don't get lots of errors.

// Handles packets going from the client to the server
exports.upstreamHandler = function (meta, data, server, client) {
  server.sendPacket(meta, data)
}

// Handles packets going from the server to the client
exports.downstreamHandler = function (meta, data, server, client) {
  client.sendPacket(meta, data)
}`
  function resetScriptEditor () {
    // document.getElementById('scriptEditor').value = defaultScript
    window.scriptEditor.getDoc().setValue(defaultScript)
  }
  window.scriptEditor = CodeMirror.fromTextArea(document.getElementById('scriptEditor'), { // window. stops standardjs from complaining
    lineNumbers: true,
    autoCloseBrackets: true,
    theme: 'darcula',
    autoRefresh: true
  })
  resetScriptEditor()

  window.scriptEditor.on('change', exports.updateScript)
}