// Copyright 2012 Patrick Wang (kk1fff)
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// This is the main library.

var ipc = require('./ipc.js');

// Fork the daemon.
function startDaemon(inproc) {
  if (!inproc) {
    require('child_process').fork(__dirname + '/daemon.js');
    process.exit();
  } else {
    require('./daemon.js');
  }
}

// Build a scope for client side operation.
function client(act, opt) {
  function remoteNotExist() {
    console.error('Unable to reach daemon');
    process.exit(1);
  }

  var writer, reader, handleCommand;
  var pongTimer = null;

  function ping() {
    writer.write('ping', {});
    pongTimer = setTimeout(function() {
      console.error('Ping timed out');
      process.exit(1);
    }, 1000);
  }

  // Send stop daemon message to daemon.
  function stopDaemon() {
    writer.write('stop', {});
    process.exit(0);
  }

  function handleCommand(cmd) {
    switch (cmd.command) {
    case 'pong':
      if (pongTimer) {
        clearTimeout(pongTimer);
      }
      console.log('Received pong!');
      process.exit();
    }
  }

  ipc.connectControlChannel(function(istream, ostream) {
    writer = ipc.commandWriter(ostream);
    ipc.commandReader(istream, function(cmd) {
      handleCommand(cmd);
    });

    // Handle client side action after connection has been established.
    switch (act) {
    case 'stop':
      stopDaemon();
      break;
    case 'ping':
      ping();
      break;
    }
  }, remoteNotExist);
};

// Interface to handle the request from command line.
// @param act string: 'daemon', 'stop' or 'debug'.
// @param opt object: depend on act.
exports.run = function(act, opt) {
  switch (act) {
  case 'daemon':
    startDaemon();
    break;
  case 'daemon-debug':
    startDaemon(true);
    break;
  default:
    client(act, opt);
  }
}
