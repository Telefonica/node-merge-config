'use strict';

var path = require('path'),
    hjson = require('hjson'),
    proxyquire = require('proxyquire'),
    Configuration = require('../../lib/configuration');

describe('Configuration Tests', function() {

  it('should merge the configuration from a single value', function() {
    var config = new Configuration();
    config.set('key1', 'test');
    expect(config.get()).to.be.deep.equal({
      key1: 'test'
    });
    config.set('key2:key21', {key211: 'value'});
    expect(config.get()).to.be.deep.equal({
      key1: 'test',
      key2: {
        key21: {
          key211: 'value'
        }
      }
    });
  });

  it('should merge the configuration from multiple objects', function() {
    var config = new Configuration();
    config.merge({key1: 'test', key2: 'forgetit'}, {key2: {key21: {key211: 'value'}}});
    expect(config.get()).to.be.deep.equal({
      key1: 'test',
      key2: {
        key21: {
          key211: 'value'
        }
      }
    });
  });

  it('should get the configuration using a composedKey', function() {
    var config = new Configuration();
    config.set('key1', 'test');
    expect(config.get('key1')).to.be.equal('test');
    expect(config.get('key1:key11')).to.be.undefined;
    expect(config.get('key2')).to.be.undefined;
    config.set('key2:key21', {key211: 'value'});
    expect(config.get('key2')).to.be.deep.equal({
      key21: {
        key211: 'value'
      }
    });
    expect(config.get('key2:key21:key211')).to.be.equal('value');
    expect(config.get('key2:key21:key211:invalid')).to.be.undefined;
  });

  it('should should support configurable delimiter in composedKey', function() {
    var config = new Configuration({delimiter: '.'});
    config.set('key1.key11', 'test');
    expect(config.get('key1.key11')).to.be.equal('test');
    expect(config.get()).to.be.deep.equal({
      key1: {
        key11: 'test'
      }
    });
  });

  it('should merge the configuration from a set of environment variables', function() {
    process.env.CONFIG_FILE = '/etc/project/config.json';
    process.env.CONFIG_DIR = '/etc/project';
    process.env['MONGO:URL_CONNECTION'] = 'mongodb://localhost:27017';
    process.env.NOT_REQUIRED = 'not required value';
    var config = new Configuration();
    config.env(['CONFIG_FILE', 'CONFIG_DIR', 'MONGO:URL_CONNECTION']);
    expect(config.get()).to.be.deep.equal({
      configFile: '/etc/project/config.json',
      configDir: '/etc/project',
      mongo: {
        urlConnection: 'mongodb://localhost:27017'
      }
    });
  });

  it('should merge the configuration from a set of command-line arguments', function() {
    var ConfigurationProxy = proxyquire('../../lib/configuration', {
      'yargs': {
        argv: {
          configFile: '/etc/project/config.json',
          configDir: '/etc/project',
          'mongo:urlConnection': 'mongodb://localhost:27017',
          notRequired: 'not required value'
        }
      }
    });
    var config = new ConfigurationProxy();
    config.argv(['configFile', 'configDir', 'mongo:urlConnection']);
    expect(config.get()).to.be.deep.equal({
      configFile: '/etc/project/config.json',
      configDir: '/etc/project',
      mongo: {
        urlConnection: 'mongodb://localhost:27017'
      }
    });
  });

  it('should merge the configuration from a json file', function() {
    var filePath = path.join(__dirname, 'config/default.json');
    var config = new Configuration();
    config.file(filePath);
    expect(config.get()).to.be.deep.equal({
      key1: {
        key1_1: 'value1_1',
        key1_2: true
      },
      key2: 'value2',
      key10: 'value10'
    });
  });

  it('should merge the configuration from a yml file', function() {
    var filePath = path.join(__dirname, 'config/default.yml');
    var config = new Configuration();
    config.file(filePath);
    expect(config.get()).to.be.deep.equal({
      key1: 'test string',
      key2: true,
      key3: {
        key11: 'test value'
      }
    });
  });

  it('should merge the configuration from a directory', function() {
    var dirPath = path.join(__dirname, 'config/dir');
    var config = new Configuration();
    config.file(dirPath);
    expect(config.get()).to.be.deep.equal({
      key1: {
        key1_1: 'value modified by yaml',
        key1_2: false
      },
      key2: 'value2 modified',
      key3: 43,
      yaml: true
    });
  });

  it('should merge the configuration from multiple sources', function() {
    var dirPath = path.join(__dirname, 'config/dir');
    var config = new Configuration();
    config.file(dirPath);
    expect(config.get()).to.be.deep.equal({
      key1: {
        key1_1: 'value modified by yaml',
        key1_2: false
      },
      key2: 'value2 modified',
      key3: 43,
      yaml: true
    });
    process.env.KEY3 = 'value updated from env var';
    process.env.NEW_VAR = 'New env var';
    config.env(['KEY3', 'NEW_VAR']);
    expect(config.get()).to.be.deep.equal({
      key1: {
        key1_1: 'value modified by yaml',
        key1_2: false
      },
      key2: 'value2 modified',
      key3: 'value updated from env var',
      yaml: true,
      newVar: 'New env var'
    });
  });

  it('should fail with an invalid file path', function() {
    var ex;
    try {
      var config = new Configuration();
      config.file(path.join(__dirname, 'not/existent'));
    } catch (e) {
      ex = e;
    }
    expect(ex.name).to.equal('FILE_INVALID');
  });

  it('should fail with a file without ".json" extension', function() {
    var ex;
    try {
      var config = new Configuration();
      config.file(path.join(__dirname, 'config/dir/readme'));
    } catch (e) {
      ex = e;
    }
    expect(ex.name).to.equal('FILE_INVALID');
  });

});
