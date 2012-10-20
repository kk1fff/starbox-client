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
var config = require('./config.js');
var fs = require('fs');

var cachedFilelist = null;

// Get file list of target directory. callback is expected to be
// function (filelist). filelist is an array that contains objects
// {
//   path:    // absolute path.
//   size:    // number, in byte
//   type:    // string, 'file', 'dir' or 'link'
//   update:  // string, update time
//   hash:    // string, File digest.
// }
exports.getFilelist = function(callback, rebuild) {
  if (rebuild || !cachedFilelist) {
    var waitingDirList = 0;
    var waitingForStat = 0;
    var filelist = [];
    function walk(dir) {
      waitingDirList++;
      fs.readdir(dir, function(err, files) {
        if (err) throw err;
        waitingDirList--;
        files.forEach(function(name) {
          waitingForStat++;
          var file = dir + config.getFileSepearator() + name;
          fs.lstat(file, function(err, stats) {
            if (err) throw err;
            
            // Here we got properties of a file.
            waitingForStat--;
            var type = '';
            if (stats.isDirectory()) {
              type = 'dir';
            } else if (stats.isSymbolicLink()) {
              type = 'link';
            } else {
              type = 'file';
            }
            // build file properties.
            filelist.push({
              path: file,
              size: stats.size,
              type: type,
              update: stats.mtime,
              hash: ''
            });
            // walk into dir.
            if (stats.isDirectory()) {
              walk(file);
            }
            if (waitingDirList == 0 &&
                waitingForStat == 0) {
              cachedFilelist = filelist;
              callback(filelist);
            }
          });
        });
        if (waitingDirList == 0 &&
            waitingForStat == 0) {
          cachedFilelist = filelist;
          callback(filelist);
        }
      });
    }
    walk(config.getTargetDir());
  } else {
    callback(cachedFilelist);
  }
}
