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

var _ = require('lodash'),
    changeCase = require('change-case'),
    fs = require('fs'),
    yargs = require('yargs'),
    hjson = require('hjson'),
    yaml = require('js-yaml'),
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
   * Get the value identified by the array of keys in an object. For example, for an object:
   *     {key1: {key11: 'value'}}
   * with the keys: ['key1', 'key11']
   * it returns: 'value'.
   *
   * @param {Object} object
   * @param {String[]} keys
   * @return {Object}
   *    The value referenced by the keys.
   */
  function _getObject(object, keys) {
    var key = keys.shift();
    if (keys.length === 0) {
      return object[key];
    }
    if (typeof object[key] === 'object' && object[key] !== null) {
      return _getObject(object[key], keys);
    }
    return undefined;
  }

  /**
   * Build an object with a hierarchy of keys array and assigning the value to the leaf element.
   *
   * The invocation:
   *    _buildObject({}, 'value', ['key1', 'key11'])
   * returns the object:
   *    {key1: {key11: 'value'}}
   *
   * @param {Object} object
   * @param {String[]} keys
   * @return {Object}
   *    The object enriched with the value at keys reference.
   */
  function _buildObject(object, value, keys) {
    var key = keys.shift();
    if (keys.length === 0) {
      object[key] = value;
    } else {
      object[key] = {};
      _buildObject(object[key], value, keys);
    }
    return object;
  }

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
    return _getObject(config, composedKey.split(delimiter));
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
    var configSet = _buildObject({}, value, composedKey.split(delimiter));
    _.merge(config, configSet);
  }

  /**
   * Merge one or several configuration objects.
   */
  function merge() {
    var args = Array.prototype.slice.call(arguments, 0);
    args.unshift(config);
    _.merge.apply(this, args);
  }

  /**
   * Merge the command-line arguments into the configuration.
   *
   * @param {String[]} whitelist
   *    Optional list of environment variables to avoid including all of them.
   */
  function argv(whitelist) {
    Object.keys(yargs.argv).forEach(function onArg(key) {
      if (!whitelist || whitelist.indexOf(key) >= 0) {
        set(key, yargs.argv[key]);
      }
    });
  }

  /**
   * Merge the environment variables into the configuration.
   * The keys from environment variables are transformed into camelCase to keep coherence with JSON format.
   *
   * @param {String[]} whitelist
   *    Optional list of environment variables to avoid including all of them.
   */
  function env(whitelist) {
    Object.keys(process.env).forEach(function onEnv(composedKey) {
      var keys = composedKey.split(delimiter);
      var formattedComposedKey = keys.map(changeCase.camelCase).join(delimiter);
      if (!whitelist || whitelist.indexOf(formattedComposedKey) >= 0) {
        set(formattedComposedKey, process.env[composedKey]);
      }
    });
  }

  /**
   * Merge a configuration file: either a json (with .json extension) or yaml (with either .yml or .yaml extension).
   *
   * @param {String} configFile
   *    Path to the configuration file.
   * @param {boolean} ignoreErrors
   *    Optional argument to throw an error if the file does not have a valid file extension.
   */
  function _loadFile(configFile, ignoreErrors) {
    var fileExtension = path.extname(configFile);
    if (fileExtension === '.json') {
      var jsonConfig = hjson.parse(fs.readFileSync(configFile, 'utf8'));
      _.merge(config, jsonConfig);
    } else if (fileExtension === '.yml' || fileExtension === '.yaml') {
      var ymlConfig = yaml.safeLoad(fs.readFileSync(configFile, 'utf8'));
      _.merge(config, ymlConfig);
    } else if (ignoreErrors !== true) {
      throw errors.FILE_INVALID(configFile, 'Configuration file has an invalid extension');
    }
  }

  /**
   * Merge a configuration directory by merging all the configuration files in the directory.
   *
   * @param {String} configDir
   *    Path to the configuration directory.
   */
  function _loadDir(configDir) {
    var files = fs.readdirSync(configDir);
    files = files.sort();
    for (var i = 0; i < files.length; i++) {
      var configFile = path.join(configDir, files[i]);
      if (fs.statSync(configFile).isFile()) {
        _loadFile(configFile, true);
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
    try {
      var stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        _loadDir(filePath);
      } else {
        _loadFile(filePath);
      }
    } catch (e) {
      throw errors.FILE_INVALID(filePath, e.message);
    }
  }

  return {
    get: get,
    set: set,
    merge: merge,
    argv: argv,
    env: env,
    file: file
  };
}

/**
 * Export Configuration class.
 */
module.exports = Configuration;
