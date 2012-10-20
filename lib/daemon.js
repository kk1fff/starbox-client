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

var debug = require('./logger.js').getLogger(__filename);
var ipc = require('./ipc.js');
var config = require('./config.js');
var filelist = require('./filelist.js');

debug('Daemon is started');

//------------------------------------------------------------------------------
// Control daemon.

var ctrlChann;

// Stop daemon with a command writter to feedback to control client.
function stopDaemon(writer) {
  debug('Stopping daemon');
  if (writer) {
    writer.write('stop:done', {});
    writer.close();
  }
  ctrlChann.close();
  process.exit();
}

// Response ping
function responsePing(writer) {
  debug('To response ping');
  if (writer) {
    writer.write('pong', {});
  }
}

// Get system info and monitoring file info
function getInfo(writer, refresh) {
  debug('Getting info');
  filelist.getFilelist(function(list) {
    if (writer) {
      writer.write('info:ok', {
        filelist: list
      });
    }
  }, refresh);
}

// Setup a listener for control channel
ctrlChann = ipc.bindControlChannel(function(instream, outstream) {
  debug('A client is connected');
  var writer = ipc.commandWriter(outstream);
  ipc.commandReader(instream, function(cmd) {
    if (!cmd) {
      writer.close();
      writer = null;
      return;
    }

    switch (cmd.command) {
    case 'stop':
      stopDaemon(writer);
      break;
    case 'ping':
      responsePing(writer);
      break;
    case 'sync':
      sync(writer);
      break;
    case 'info':
      getInfo(writer, cmd.info.refresh);
      break;
    }
  });
}, function(err) {
  // Handle error
  debug('Error to bind control channel: ' + err);
  console.error('There\'s a ' + config.getProductName() + ' running');
});

//------------------------------------------------------------------------------
// Watch file change.
// TODO.
