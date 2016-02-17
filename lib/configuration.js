/**
 * @license
 * Copyright 2015,2016 Telefónica Investigación y Desarrollo, S.A.U
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
    yargs = require('yargs'),
    hjson = require('hjson'),
    yaml = require('js-yaml'),
    merge = require('./merge'),
    path = require('path'),
    therror = require('therror');

var errors = therror.register({
  FILE_INVALID: {
    message: 'Invalid configuration file: "{1}". {2}'
  }
});

/**
 * Configuration class to merge configuration from:
 *
 *  - file(path): configuration files (if path targets a configuration file) or configuration directories
 *    (if path targets a directory). With configuration directories, all the configuration files stored
 *    in the directory are merged in alphabetical order. Configuration files must be either JSON files
 *    (supporting comments with hjson) or YML files.
 *
 *  - env(whitelist): environment variables. An optional white list can be used to restrict which environment
 *    variables are to be merged.
 *
 *  - argv(whitelist): command-line arguments. An optional white list can be used to restrict which arguments
 *    are to be merged.
 *
 * NOTE: On contrast with nconf, this module supports multiple instances.
 *
 * @param {Object} opts
 *    Optional object with configuration options. Currently supported:
 *      - delimiter. Key delimiter (by default ':' to maintain compatibility with nconf).
 * @return {Object}
 *    Configuration instance.
 * @constructor
 */
function Configuration(opts) {

  var delimiter = opts && opts.delimiter || ':';

  var config = {};

  /**
   * Get the configuration object.
   *
   * @param {String} composedKey
   *    Optional path to the configuration object to be retrieved. By default, it retrieves an object
   *    with the whole configuration.
   * @return {Object}
   *    Configuration object resulting from merging files, directories and environment variables.
   */
  function get(composedKey) {
    if (!composedKey) {
      return config;
    }
    var getObject = function(object, keys) {
      var key = keys.shift();
      if (keys.length === 0) {
        return object[key];
      }
      if (typeof object[key] === 'object' && object[key] !== null) {
        return getObject(object[key], keys);
      }
      return undefined;
    };
    return getObject(config, composedKey.split(delimiter));
  }

  /**
   * Set a single element in the configuration.
   *
   * @param {String} composedKey
   *    Path to the configuration object to be set. The delimiter (by default ':') is used to set
   *    a value in any of the levels of the configuration object hierarchy.
   * @param {String|Number|Array|Object} value
   *    Value to be assigned in the configuration.
   */
  function set(composedKey, value) {
    var buildObject = function(object, keys) {
      var key = keys.shift();
      if (keys.length === 0) {
        object[key] = value;
      } else {
        object[key] = {};
        buildObject(object[key], keys);
      }
      return object;
    };
    var configSet = buildObject({}, composedKey.split(delimiter));
    merge(config, configSet);
  }

  /**
   * Merge one or several configuration objects.
   */
  function mergeConfig() {
    var args = Array.prototype.slice.call(arguments, 0);
    args.unshift(config);
    merge.apply(this, args);
  }

  /**
   * Merge the command-line arguments into the configuration.
   *
   * @param {String[]} whitelist
   *    Optional list of environment variables to avoid including all of them.
   */
  function argv(whitelist) {
    for (var key in yargs.argv) {
      if (yargs.argv.hasOwnProperty(key)) {
        if (!whitelist || whitelist.indexOf(key) >= 0) {
          set(key, yargs.argv[key]);
        }
      }
    }
  }

  /**
   * Merge the environment variables into the configuration.
   * The keys from environment variables are transformed into camelCase to keep coherence with JSON format.
   *
   * @param {String[]} whitelist
   *    Optional list of environment variables to avoid including all of them.
   */
  function env(whitelist) {
    for (var composedKey in process.env) {
      if (process.env.hasOwnProperty(composedKey)) {
        var keys = composedKey.split(delimiter);
        var formattedComposedKey = keys.map(changeCase.camelCase).join(delimiter);
        if (!whitelist || whitelist.indexOf(formattedComposedKey) >= 0) {
          set(formattedComposedKey, process.env[composedKey]);
        }
      }
    }
  }

  /**
   * Merge the configuration from a configuration file, or from the configuration files inside a directory.
   * It supports either JSON files (with extension .json) with comments (via hjson module), or YML files.
   *
   * @param {String} filePath
   *    Path to the configuration file or configuration directory.
   */
  function file(filePath) {

    var loadFile = function(configFile, ignoreErrors) {
      var fileExtension = path.extname(configFile);
      if (fileExtension === '.json') {
        var jsonConfig = hjson.parse(fs.readFileSync(configFile, 'utf8'));
        merge(config, jsonConfig);
      } else if (fileExtension === '.yml' || fileExtension === '.yaml') {
        var ymlConfig = yaml.safeLoad(fs.readFileSync(configFile, 'utf8'));
        merge(config, ymlConfig);
      } else if (ignoreErrors !== true) {
        throw errors.FILE_INVALID(configFile, 'Configuration file has an invalid extension');
      }
    };

    var loadDir = function(configDir) {
      var files = fs.readdirSync(configDir);
      files = files.sort();
      for (var i = 0; i < files.length; i++) {
        var configFile = path.join(configDir, files[i]);
        if (fs.statSync(configFile).isFile()) {
          loadFile(configFile, true);
        }
      }
    };

    try {
      var stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        loadDir(filePath);
      } else {
        loadFile(filePath);
      }
    } catch (e) {
      throw errors.FILE_INVALID(filePath, e.message);
    }

  }

  return {
    get: get,
    set: set,
    merge: mergeConfig,
    argv: argv,
    env: env,
    file: file
  };
}

/**
 * Export Configuration class.
 */
module.exports = Configuration;
