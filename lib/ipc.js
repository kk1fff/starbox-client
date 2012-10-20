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

// This is the module for control channel ipc.

var debug = require('./logger.js').getLogger(__filename);
var net = require('net');
var config = require('./config.js');

// POSIX implementation, this control channel is implemented by UNIX domain
// socket.

function getUnixDomainSocketName() {
  var prefix = config.getUnixDomainSocketNamePrefix();
  return '/var/tmp/' + prefix + process.getuid();
}

function bindControlChannelPosix(arrCb, errCb) {
  var channelStart = false;
  var server = net.createServer(function(c) {
    arrCb(c, c); // socket is a duplex channel, which is both an input stream
                 // as well as an output stream.
  });
  server.listen(getUnixDomainSocketName(), function() {
    channelStart = true;
  });
  server.on('error', function(e) {
    errCb(e.code);
  });
  server.on('close', function() {
    debug('Closed');
    channelStart = false;
  });
  return {
    close: function() {
      debug('Closing');
      if (channelStart) {
        server.close();
      }
    }
  }
}

function connectControlChannelPosix(arrCb, errCb) {
  var client = net.connect(getUnixDomainSocketName(), function() {
    arrCb(client, client);
  });
  client.on('error', function() {
    errCb();
  });
}


// Exposed API

// To bind the control channel and listen to connection.
// @param connectionArrivedCallback Expected function(instream, outstream).
//        is called when a control client is connected to this control,
//        channel.
// @param errorCallback Expected function(error, info). Called when control
//        channel error.
// @return A control channel handler for control channel itself. The function
//         available in the object is
//         {
//           close(); // Stop binding the control channel.
//         }
exports.bindControlChannel = function (connectionArrivedCallback,
                                       errorCallback) {
  return bindControlChannelPosix(connectionArrivedCallback, errorCallback);
}

exports.connectControlChannel = function(connectionArrivedCallback,
                                         errorCallback) {
  return connectControlChannelPosix(connectionArrivedCallback, errorCallback);
}

// Bind to an input stream, parse the input stream into json, then call the 
// cmdCallback.
// The data format that we used in IPC is
//
//     +-------------------------------+
//     | payload length = M (4byte LE) |
//     +-------------------------------+
//     |               .               |
//     |               .               |
//     |        payload (M byte)       |
//     |               .               |
//     |               .               |
//     +-------------------------------+
//
// @param instream The input stream that we are binding.
// @param cmdCallback The callback function is expected to be
//        function(cmd), the cmd object has a format:
//        {
//          command: '...', // Command in string.
//          info:         , // An object that is accompanied to command.
//        }
//        If the instream is no longer readable, a callback with cmd == null
//        will be issued.
exports.commandReader = function(instream, cmdCallback) {
  // Generate a parser that is reading expectedLength byte, and call the
  // callback when the byte reached.
  function generateSectionParser(expectedLength, doneCb) {
    var readingOffset = 0;
    var readingBuf = new Buffer(expectedLength);
    return function(buf, offset) {
//    debug('Expected length: ' + expectedLength);
//    debug('Buffer length: ' + buf.length);
//    debug('Buffer offset: ' + offset);
//    debug('Reading offset: ' + readingOffset);

      if (buf.length == offset) {
        return;
      }
      var left = expectedLength - readingOffset;
      if (left === 0) {
        doneCb(readingBuf, buf, offset);
      } else if (left > 0) {
        var toRead = Math.min(left, buf.length - offset);
        buf.copy(readingBuf, readingOffset, offset, offset + toRead);
        left -= toRead;
        offset += toRead;
        readingOffset += toRead;
      } else {  // left < 0
        throw 'Wrong parsing';
      }

      if (left === 0) {
        doneCb(readingBuf, buf, offset);
      }
    }
  }

  var parse, state0ToState1, state1ToState0;

  state0ToState1 = function(finishedBuf, buf, offset) {
    debug("finishedBuf" + finishedBuf);
    var payloadLen = finishedBuf.readUInt32LE(0);
    debug('Payload len: ' + payloadLen);
    parse = generateSectionParser(payloadLen, state1ToState0);
    parse(buf, offset);
  }

  state1ToState0 = function(finishedBuf, buf, offset) {
    var data = finishedBuf.toString();
    debug('Payload: ' + data);
    cmdCallback(JSON.parse(data));
    parse = generateSectionParser(4, state0ToState1);
    parse(buf, offset);
  }

  parse = generateSectionParser(4, state0ToState1);

  instream.on('data', function(d) {
    parse(d, 0);
  });

  instream.on('end', function(d) {
    cmdCallback(null);
  });
}

exports.commandWriter = function(outstream) {
  return {
    "write" : function(cmd, obj) {
      var payload = JSON.stringify({
        command: cmd,
        info: obj
      });
      var len = payload.length;
      
      debug('Sending to control channel: ' + payload);
      var buf = new Buffer(len + 4);
      buf.writeUInt32LE(len, 0);
      buf.write(payload, 4);
      outstream.write(buf);
    },
    "close" : function() {
      outstream.end();
    }
  };
};
