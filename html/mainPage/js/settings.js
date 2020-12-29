const settingsJson = require('./settings.json')

const settingsElement = document.getElementById('Settings')

let sharedVars

const changeFunctions = {}

exports.bindToSettingChange = function (settingId, f) {
  changeFunctions[settingId] = f
}

function getSetting (id) {
  if (!sharedVars.store.get('settings.' + id)) {
    sharedVars.store.set('settings.' + id, settingsJson[id].default)
  }
  return sharedVars.store.get('settings.' + id)
}

function setSetting (settingId, value) {
  sharedVars.store.set('settings.' + settingId, value)
  if (changeFunctions[settingId]) {
    changeFunctions[settingId](value)
  }
}

window.setSetting = setSetting

function createToggle (settingId) {
  const toggleElement = document.createElement('label')
  toggleElement.className = 'switch'

  const input = document.createElement('input')
  input.id = settingId
  input.type = 'checkbox'
  input.checked = getSetting(settingId)
  input.addEventListener('change', () => {
    setSetting(settingId, input.checked)
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
      changeFunctions[settingId](getSetting(settingId))
    }
  }
}
