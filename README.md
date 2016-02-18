# merge-config

Merge multiple configuration sources: configuration files (json and yaml), command-line arguments, and environment properties.

[![npm version](https://badge.fury.io/js/merge-config.svg)](http://badge.fury.io/js/merge-config)
[![Build Status](https://travis-ci.org/telefonica/node-merge-config.svg)](https://travis-ci.org/telefonica/node-merge-config)
[![Coverage Status](https://img.shields.io/coveralls/telefonica/node-merge-config.svg)](https://coveralls.io/r/telefonica/node-merge-config)

It is inspired on [nconf](https://github.com/indexzero/nconf) library, offering a compatible API. However, there are some important differences:

* The order of preference is reversed. For example, the default values have to be merged before the custom values so that custom values overwrite the default ones.
* Support for multiple instances. It is possible to handle several configurations (e.g. to handle the configuration of several plugins independently).
* Both **json** and **yaml** formats are supported when merging configuration files.
* It is possible to merge a directory of configuration files, merging each configuration file alphabetically.
* JSON files are parsed with [hjson](http://hjson.org/) to support comments.
* The environment variable names are converted into camelCase when merging them into the configuration. The goal is to have a common notation with keys in JSON documents.

This module works with a single configuration object. This configuration object is updated with each merge (with preference for the last merge over the first one). The recursive merge is implemented with [lodash](https://lodash.com/docs#merge). This approach is useful to merge a default configuration with a custom configuration where only the configuration properties to be modified are included.

For example, with the following default configuration:

```yml
serverPort: 4070
baseLocationUrl: https://telefonica.com
basePath: /sample
logFormat: json
database:
  uri: "mongodb://localhost:27017/sample"
  options:
    db:
      bufferMaxEntries: 0
  config:
    defaultLimit: 100
    maxLimit: 1000

```

To only change the database URI, just merge the following configuration file:

```yml
database:
  uri: "mongodb://mongodb-1:27017/sample"
```

## Installation

```bash
npm install merge-config
```

## Basic usage

```js
var Config = require('merge-config');

// Create a config instance
var config = new Config();

// Add a default configuration file (at __dirname/config/config.json)
config.file(path.join(__dirname, 'config', 'config.json'));
// Add all the JSON files in config directory (added in alphabetically order)
config.file(process.env.CONFIG_DIR);
// Add a command-line argument.
config.argv(['logFormat']);
// Add an environment variable (LOG_LEVEL).
config.env(['LOG_LEVEL']);

// Get the whole merged configuration
console.log("Merged configuration: %j", config.get());
// Get a single configuration property
console.log("Log level: %s", config.get('logLevel'));
```

## API

### new Config(options)

Constructor of a configuration instance.

```js
var config = new Configuration();
```

It is possible to specify the **delimiter** when using keys that refer to an element in the hierarchy of the configuration object. By default, the delimiter is `:` to keep compatibility with nconf. It is possible to change the delimiter:

```js
var config = new Configuration({delimiter: '.'});
```

### get(path)

Retrieve the configuration.

```js
// Get the whole merged configuration as an object
config.get();
```

It is possible to get a specific element in the configuration object:

```js
// Get the whole merged configuration as an object
config.get('database:uri');
```

### set(path, value)

Set a value (string, number, object, array).

```js
// Get the whole merged configuration as an object
config.set('database:uri', 'mongodb://mongodb-1:27017/sample');
```

### merge(...sources)

Merge a set of sources with the configuration object. These sources must be objects.

```js
// Get the whole merged configuration as an object
config.merge({
  database: {
    uri: 'mongodb://mongodb-1:27017/sample'
  }
});
```

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

### argv(whitelist)

Load the command-line arguments into the configuration.

```js
// Add all command-line arguments into merged configuration
config.argv();
```

It is possible to restrict which command-line arguments are to be added to the configuration with optional parameter `whitelist` (array of strings).

```js
// Add only environment variables: logLevel and port
config.argv(['logLevel', 'port']);
```

### file(path)

Loads a configuration file (if path targets a file), a set of configuration files located in a directory (if path targets a directory), or raises an error (if path is invalid).

**NOTE**: If path targets a directory, the library merges any configuration file located in the directory, in alphabetical order, and without subdirectory recursion.

It support json and yaml configuration files which are identified by the file extension. JSON configuration files are parsed with [hjson](https://github.com/laktak/hjson-js) format to support comments in the JSON document.

## License

Copyright 2015 [Telefónica Investigación y Desarrollo, S.A.U](http://www.tid.es)

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
