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

// Logger of this program.
// expected call: logger = require('./logger.js').getLogger(__filename, true);
// or change the last argument to false to turn off the log.
var globalDebug = false;
exports.getLogger = function (filename, on) {
  if (on || globalDebug) {
    return function(msg) {
      console.log('[(' + process.pid + ') ' + filename + '] ' + msg);
    }
  } else {
    return function() { }
  }
}
