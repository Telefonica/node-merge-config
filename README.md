# merge-config

Merge multiple configuration sources: JSON files and environment properties.

[![npm version](https://badge.fury.io/js/merge-config.svg)](http://badge.fury.io/js/merge-config)
[![Build Status](https://travis-ci.org/telefonica/node-merge-config.svg)](https://travis-ci.org/telefonica/node-merge-config)
[![Coverage Status](https://img.shields.io/coveralls/telefonica/node-merge-config.svg)](https://coveralls.io/r/telefonica/node-merge-config)

It is based on [nconf](https://github.com/indexzero/nconf) library, using the same
hierarchical approach when using multiple sources. The main enhancements are:

* The environment variable names are converted into camelCase when merging them into the configuration. The goal is to have a common notation with keys in JSON documents.
* It is possible to merge a directory of JSON files.
* JSON files can include comments.

## Installation

```bash
npm install merge-config
```

## Basic usage

```js
var Config = require('merge-config');

// Create a config instance
var config = new Config();

// Add an environment variable (LOG_LEVEL)
config.env(['LOG_LEVEL']);
// Add all the JSON files in config directory (added in alphabetically order)
config.file(process.env.CONFIG_DIR);
// Add a default configuration file (at __dirname/config/config.json)
config.file(path.join(__dirname, 'config', 'config.json'));

// Get the whole merged configuration
console.log("Merged configuration: %j", config.get());
// Get a single configuration property
console.log("Log level: %s", config.get('logLevel'));
```

## API

The library extends [nconf](https://github.com/indexzero/nconf) library to customize methods: `env` and `file`.

Unlike [nconf](https://github.com/indexzero/nconf), it requires to create an instance. However, only one instance can be created due to [nconf](https://github.com/indexzero/nconf) limitations.

### env(whitelist)

Load the environment variables into the configuration.

```js
// Add all environment variables into merged configuration
config.env();
```

It is possible to restrict which environment variables are to be added to the configuration with optional parameter `whitelist` (array of strings).

```js
// Add only environment variables: LOG_LEVEL and PORT
config.env(['LOG_LEVEL', 'PORT']);
```

The keys from environment variables are transformed into camelCase to keep coherence with JSON format.

### file(path)

Loads a JSON configuration file (if path targets a file), a set of JSON configuration files located in a directory (if path targets a directory), or raises an error (if path is invalid).

**NOTE**: If path targets a directory, the library merges any JSON file located in the directory, in alphabetical order, and without subdirectory recursion.

JSON configuration files are parsed with [hjson](https://github.com/laktak/hjson-js) format to support comments in the JSON document.

## License

Copyright 2015 [Telefónica Investigación y Desarrollo, S.A.U](http://www.tid.es)

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
