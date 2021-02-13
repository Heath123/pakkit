const mc = require('minecraft-protocol')

const client = mc.createClient({
  host: 'localhost',
  port: 29132,
  username: 'circuit10',
  profilesFolder: '/home/heath/.minecraft/',
  auth: 'microsoft'
})
client.on('error', function (err) {
  console.error(err)
})

client.on('connect', function () {
  console.info('connected')
})
client.on('disconnect', function (packet) {
  console.log('disconnected: ' + packet.reason)
})
client.on('end', function () {
  console.log('Connection lost')
})
client.on('chat', function (packet) {
  const jsonMsg = JSON.parse(packet.message)
  if (jsonMsg.translate === 'chat.type.announcement' || jsonMsg.translate === 'chat.type.text') {
    const username = jsonMsg.with[0].text
    const msg = jsonMsg.with[1]
    if (username === client.username) return
    if (msg.text) client.write('chat', { message: msg.text })
    else client.write('chat', { message: msg })
  }
})

/*

Old access tokens:
eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI3YzA2ZmQ4Mjc1NjQ0YzA4ODU1MjA5N2ExMzAzMDY4MSIsInlnZ3QiOiI0NzIzMzFlOTY1YWU0OTFlOGJiZDQxZTYyNWIxMGZlOCIsInNwciI6IjdmYjI4ZDU3YWFmZDQyZDVhNzA1Y2VmMThhYjUzMTNmIiwiaXNzIjoiWWdnZHJhc2lsLUF1dGgiLCJleHAiOjE2MTE4NDU3NDIsImlhdCI6MTYxMTY3Mjk0Mn0.1FjVPGCmcBcIJOTmxcMD5D86WeI05dcAg8Rt3VxN3p0

New access tokens:
eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI3YzA2ZmQ4Mjc1NjQ0YzA4ODU1MjA5N2ExMzAzMDY4MSIsInlnZ3QiOiI2YjM0MzgzZDk5NjM0NmY3YWQ2YTUyMmNlYmVkZWQ4NiIsInNwciI6IjdmYjI4ZDU3YWFmZDQyZDVhNzA1Y2VmMThhYjUzMTNmIiwiaXNzIjoiWWdnZHJhc2lsLUF1dGgiLCJleHAiOjE2MTE3NzU1ODMsImlhdCI6MTYxMTYwMjc4M30.HF8-_Z4I8dZDJ65LEbZp73wquycYUvj9vFnsxD4Ww2Q

*/