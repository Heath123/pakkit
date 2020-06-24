const fs = require("fs");
const { spawn, exec } = require('child_process');
const WebSocket = require('ws');

var child;
var storedCallback;
var wss;
var wsconnection;

// This whole thing is messy for now.

exports.capabilities = {
  modifyPackets: true,
  jsonData: true
}

exports.startProxy = function(host, port, listenPort, version, callback, dataFolder) {
  storedCallback = callback;

  wss = new WebSocket.Server({ port: 54324 });

  wss.on('connection', function connection(ws) {
    wsconnection = ws;
    ws.on('message', function incoming(message) {
      try {
        messageJson = JSON.parse(message);
        console.log('received: %s', messageJson);
        name = messageJson.Name.replace("*packet.", "");
        // https://stackoverflow.com/questions/5582228/insert-space-before-capital-letters
        name = name.replace(/([A-Z])/g, ' $1').trim().toLowerCase().split(" ").join("_").replace("_packet", "");
        storedCallback(messageJson.Bound, {name: name}, JSON.parse(messageJson.Data), "");
      } catch (err) {
        console.error(err);
      }
    });

    // ws.send('something');
  });

  olddir =  process.cwd();
  process.chdir("/home/heath/gophertunnel/");

  child = spawn('go', ['run', 'main.go', 'wsclient.go']);

  process.chdir(olddir);
  /*child = exec('java -jar proxypass-pakkit.jar', function (error, stdout, stderr) {
    if (error) {
      console.log(error.stack);
      console.log('Error code: '+error.code);
      console.log('Signal received: '+error.signal);
    }
    console.log('Child Process STDOUT: '+stdout);
    if (stdout != "") {
      stdout.split("\n").forEach((item) => {
        processPacket(text)
      });
    }
    console.log('Child Process STDERR: '+stderr);
  });*/
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', (chunk) => {
    try {
      console.log("gophertunnel output:", chunk.trim());
    } catch (err) {
      console.error(err);
    }
  });
  child.stderr.on('data', (chunk) => {
    try {
      console.log("gophertunnel error:", chunk.trim());
    } catch (err) {
      console.error(err);
    }
  });
  // since these are streams, you can pipe them elsewhere
  // child.stderr.pipe(dest);
  child.on('close', (code) => {
    if (code) {
      console.log(`child process exited with code ${code} - restarting...`);
      exports.end();
      exports.startProxy(host, port, listenPort, version, callback, dataFolder);
    }
  });

  /* exec("java -jar proxypass-pakkit.jar", function (error, stdout, stderr){
    console.log(error, stderr, stdout);
  }); */

  console.log("Proxy started (Bedrock-gophertunnel)!");
  /* setInterval(function() {
    // Check if ProxyPass has been stuck for more than 3 seconds
    if (mayBeFrozen && (Math.floor(new Date()) - timeFrozen) >= 3000) {
      console.log("ProxyPass may be frozen - restarting...");
      mayBeFrozen = false;
      exports.end();
      exports.startProxy(host, port, listenPort, version, callback, dataFolder);
    }
  }, 500); */
}

exports.end = function() {
  child.stdin.pause();
  child.kill();
  wss.close();
}

exports.writeToClient = function(meta, data) {
  wsconnection.send(JSON.stringify(data));
  /* realClient.write(meta.name, data);
  id = Object.keys(toClientMappings).find(key => toClientMappings[key] === meta.name);
  storedCallback("clientbound", meta, data, id); // TODO: indicator for injected packets */
}

exports.writeToServer = function(meta, data) {
  /* realServer.write(meta.name, data);
  id = Object.keys(toServerMappings).find(key => toServerMappings[key] === meta.name);
  storedCallback("serverbound", meta, data, id); */
}
