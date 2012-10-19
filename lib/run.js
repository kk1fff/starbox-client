#!/usr/bin/env node

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

// This file is the executable front end, will parse the user input and load
// the library.

var starBox = require('./starbox.js');
var debug = require('./logger.js').getLogger(__filename, true);

// Use optimist as an argument parser.
var arg = require('optimist')
  .usage('Usage $0 [stop|debug]');
var argv = arg.argv;

debug('Argument ' + JSON.stringify(argv));

if (argv['_'].length === 0) {
  debug('Running in daemon mode');
} else if (argv['_'].length == 1) {
  switch (argv['_'][0]) {
  case 'stop':
    debug('Stop daemon');
    break;
  case 'debug':
    debug('Dump debug message');
    break;
  default:
    arg.showHelp();
    process.exit(1);
  }
} else {
  arg.showHelp();
  process.exit(1);
}
