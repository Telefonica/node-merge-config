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

var therror = require('therror');

var errors = therror.register({
  MERGE_INVALID: {
    message: 'Merge with invalid parameters'
  }
});

function merge(target) {
  if (target === null || typeof target !== 'object') {
    throw errors.MERGE_INVALID();
  }
  var sources = Array.prototype.slice.call(arguments, 1);
  for (var i = 0; i < sources.length; i++) {
    if (sources[i] === null || typeof sources[i] !== 'object') {
      throw errors.MERGE_INVALID();
    }
    mergeObjects(target, sources[i]);
  }
  return target;
}

function mergeObjects(target, source) {
  for (var name in source) {
    if (source.hasOwnProperty(name)) {
      if (target[name] && source[name] && typeof target[name] === 'object' && typeof source[name] === 'object') {
        mergeObjects(target[name], source[name]);
      } else {
        target[name] = source[name];
      }
    }
  }
  return target;
}

module.exports = merge;
