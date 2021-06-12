const settingsJson = require('./settings.json')

const settingsElement = document.getElementById('Settings')

let sharedVars

const changeFunctions = {}
// Prevents constant file reads/writes
const cache = {}

exports.bindToSettingChange = function (settingId, f) {
  changeFunctions[settingId] = f
}

exports.getSetting = function (id) {
  if (cache[id] === undefined) {
    if (sharedVars.store.get('settings.' + id) === undefined) {
      sharedVars.store.set('settings.' + id, settingsJson[id].default)
    }
    cache[id] = sharedVars.store.get('settings.' + id)
  }
  return cache[id]
}

exports.setSetting = function (settingId, value) {
  cache[settingId] = value
  sharedVars.store.set('settings.' + settingId, value)
  if (changeFunctions[settingId]) {
    changeFunctions[settingId](value)
  }
}

window.setSetting = exports.setSetting

function createToggle (settingId) {
  const toggleElement = document.createElement('label')
  toggleElement.className = 'switch'

  const input = document.createElement('input')
  input.id = settingId
  input.type = 'checkbox'
  input.checked = exports.getSetting(settingId)
  input.addEventListener('change', () => {
    exports.setSetting(settingId, input.checked)
  });
  toggleElement.appendChild(input)

  const slider = document.createElement('span')
  slider.className = 'slider round'
  toggleElement.appendChild(slider)

  return toggleElement
}

exports.setup = function (passedSharedVars) {
  sharedVars = passedSharedVars

  // Add line break
  settingsElement.appendChild(document.createElement('br'))

  for (const settingId in settingsJson) {
    if (!settingsJson.hasOwnProperty(settingId)) continue

    const setting = settingsJson[settingId]

    const element = document.createElement('div')
    element.id = settingId

    const nameElement = document.createElement('span')
    nameElement.textContent = setting.name
    nameElement.className = 'settingName'
    element.appendChild(nameElement)

    // Add line break
    element.appendChild(document.createElement('br'))

    const descriptionElement = document.createElement('span')
    descriptionElement.textContent = setting.description
    descriptionElement.className = 'settingDescription'
    element.appendChild(descriptionElement)

    // Add line breaks
    element.appendChild(document.createElement('br'))
    element.appendChild(document.createElement('br'))

    switch (setting.type) {
      case 'boolean':
        element.appendChild(createToggle(settingId))
        break
      default:
        console.error('Unknown setting type', setting.type)
    }

    settingsElement.appendChild(element)

    // Add line breaks
    settingsElement.appendChild(document.createElement('br'))
    settingsElement.appendChild(document.createElement('br'))

    // Call change function
    if (changeFunctions[settingId]) {
      changeFunctions[settingId](exports.getSetting(settingId))
    }
  }
}
