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

// Fork the daemon.
function startDaemon() {
  require('child_process').fork(__dirname + '/daemon.js');
  process.exit();
}

// Interface to handle the request from command line.
// @param act string: 'daemon', 'stop' or 'debug'.
// @param opt object: depend on act.
exports.run = function(act, opt) {
  switch (act) {
  case 'daemon':
    startDaemon();
    break;
  default:
    throw 'Unexpected command';
  }
}