const fs = require("fs");
const { spawn, exec } = require('child_process');

var child;
var storedCallback;

var mayBeFrozen = false;
var timeFrozen;

// This whole thing is messy for now.

function processPacket(text) {
  if (!(text.startsWith("[CLIENT BOUND]") || text.startsWith("[SERVER BOUND]"))) {
    if (text.trim() != "") {
      console.log("ProxyPass output:", text.trim());
    }
    return;
  }
  name = text.split("-")[1].split("(")[0].trim();
  data = "(" + text.split("(").slice(1).join("(");

  // https://stackoverflow.com/questions/5582228/insert-space-before-capital-letters
  name = name.replace(/([A-Z])/g, ' $1').trim().toLowerCase().split(" ").join("_");

  if (text.startsWith("[CLIENT BOUND]")) {
    storedCallback("clientbound", {name: name}, {data: data}, "");
  } else if (text.startsWith("[SERVER BOUND]")) {
    storedCallback("serverbound", {name: name}, {data: data}, "");
  }
}

exports.capabilities = {
  modifyPackets: false
}

exports.startProxy = function(host, port, listenPort, version, callback, dataFolder) {
  storedCallback = callback;
  fs.writeFileSync(dataFolder + "/proxypass/config.yml", `
  proxy:
    host: 0.0.0.0
    port: ${listenPort}
  destination:
    host: ${host}
    port: ${port}
  packet-testing: false
  log-packets: true
  log-to: console
  ignored-packets: []
`);

  olddir =  process.cwd();
  process.chdir(dataFolder + "/proxypass/");

  child = spawn('java', ['-jar', 'proxypass-pakkit.jar']);

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
  child.stdout.on('data', (chunk) => {
    try {
      mayBeFrozen = false; // New messages mean it isn't froxen
      if (chunk.search("Initializing proxy session") != -1) { // ProxyPass gets stuck here sometimes
        timeFrozen = Math.floor(new Date());
        mayBeFrozen = true;
      }

      chunk.split("\n").forEach((item) => {
        processPacket(item);
      });
    } catch (err) {
      console.error(err);
    }
  });
  child.stderr.on('data', (chunk) => {
    console.log("ProxyPass error:", chunk.trim());
  });
  // since these are streams, you can pipe them elsewhere
  // child.stderr.pipe(dest);
  child.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
  });

  /* exec("java -jar proxypass-pakkit.jar", function (error, stdout, stderr){
    console.log(error, stderr, stdout);
  }); */

  console.log("Proxy started (Bedrock)!");
  setInterval(function() {
    // Check if ProxyPass has been stuck for more than 3 seconds
    if (mayBeFrozen && (Math.floor(new Date()) - timeFrozen) >= 3000) {
      console.log("ProxyPass may be frozen - restarting...");
      mayBeFrozen = false;
      exports.end();
      exports.startProxy(host, port, listenPort, version, callback, dataFolder);
    }
  }, 500);
}

exports.end = function() {
  child.stdin.pause();
  child.kill();
}

exports.writeToClient = function(meta, data) {
  realClient.write(meta.name, data);
  id = Object.keys(toClientMappings).find(key => toClientMappings[key] === meta.name);
  storedCallback("clientbound", meta, data, id); // TODO: indicator for injected packets
}

exports.writeToServer = function(meta, data) {
  realServer.write(meta.name, data);
  id = Object.keys(toServerMappings).find(key => toServerMappings[key] === meta.name);
  storedCallback("serverbound", meta, data, id);
}
