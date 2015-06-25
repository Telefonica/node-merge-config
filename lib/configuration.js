/**
 * @license
 * Copyright 2015 Telefónica Investigación y Desarrollo, S.A.U
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var changeCase = require('change-case'),
    fs = require('fs'),
    hjson = require('hjson'),
    nconf = require('nconf'),
    path = require('path'),
    therror = require('therror');

var errors = therror.register({
  FILE_INVALID: {
    message: 'Invalid configuration file: "{1}". {2}'
  }
});

/**
 * Configuration class inheriting from nconf.
 * Configuration files must be JSON files and support comments (hjson).
 *
 * It overrides the following nconf functions:
 * a) env() method to rename the environment variables into camelCase format.
 * b) file() to support both file and directory. If it is a directory, then it merges all the JSON files
 *    in the directory. Note that the directory is not traversed recursively.
 *
 * NOTE: The nconf library only admits one single instance. Instantiating Configuration multiple times will
 * address the same nconf instance.
 *
 * @return {Object}
 *    Configuration instance (inheriting nconf methods).
 * @constructor
 */
function Configuration() {

  var configuration = Object.create(nconf);

  /**
   * Load the environment variables into the configuration.
   * The keys from environment variables are transformed into camelCase to keep coherence with JSON format.
   *
   * @param {String[]} whitelist
   *    Optional list of environment variables to avoid including all of them.
   */
  configuration.env = function(whitelist) {
    var configEnv = {};
    for (var key in process.env) {
      if (process.env.hasOwnProperty(key)) {
        var formattedKey = changeCase.camelCase(key);
        if (!whitelist || whitelist.indexOf(formattedKey) >= 0) {
          configEnv[formattedKey] = process.env[key];
        }
      }
    }
    nconf.add('configEnv', {type: 'literal', store: configEnv});
  };

  /**
   * Load the configuration from a JSON file, or the JSON files from a directory.
   *
   * @param {String} file
   *    Path to the JSON file or directory.
   */
  configuration.file = function(file) {

    var loadFile = function(configFile) {
      if (path.extname(configFile) === '.json') {
        nconf.file(configFile, {file: configFile, format: hjson});
      } else {
        throw errors.FILE_INVALID(configFile, 'Configuration file must have ".json" extension');
      }
    };

    var loadDir = function(configDir) {
      var files = fs.readdirSync(configDir);
      files = files.sort();
      for (var i = 0; i < files.length; i++) {
        var configFile = path.join(configDir, files[i]);
        if (fs.statSync(configFile).isFile() && path.extname(configFile) === '.json') {
          loadFile(configFile);
        }
      }
    };

    try {
      var stats = fs.statSync(file);

      if (stats.isDirectory()) {
        loadDir(file);
      } else {
        loadFile(file);
      }
    } catch (e) {
      throw errors.FILE_INVALID(file, e.message);
    }

  };

  return configuration;
}

/**
 * Export Configuration class.
 */
module.exports = Configuration;
