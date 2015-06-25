'use strict';

var path = require('path'),
    proxyquire = require('proxyquire'),
    sinon = require('sinon'),
    hjson = require('hjson');

describe('Configuration Tests', function() {

  var nconfMock = {
    add: sinon.spy(),
    file: sinon.spy()
  };
  var Configuration = proxyquire('../../lib/configuration', {
    'nconf': nconfMock
  });

  var config = new Configuration();

  beforeEach(function() {
    nconfMock.add.reset();
    nconfMock.file.reset();
    process.env = {};
  });

  it('should merge the configuration from a set of environment variables', function() {
    process.env.CONFIG_FILE = '/etc/project/config.json';
    process.env.CONFIG_DIR = '/etc/project';
    process.env.NOT_REQUIRED = 'not required value';
    config.env(['configFile', 'configDir']);
    expect(nconfMock.add.calledOnce).to.be.true;
    expect(nconfMock.add.getCall(0).args).to.be.deep.equal([
      'configEnv',
      {
        type: 'literal',
        store: {
          configFile: '/etc/project/config.json',
          configDir: '/etc/project'
        }
      }
    ]);
  });

  it('should merge the configuration from a file', function() {
    var filePath = path.join(__dirname, 'config/default.json');
    config.file(filePath);
    expect(nconfMock.file.calledOnce).to.be.true;
    expect(nconfMock.file.getCall(0).args).to.be.deep.equal([
      filePath,
      {
        file: filePath,
        format: hjson
      }
    ]);
  });

  it('should merge the configuration from a directory', function() {
    var dirPath = path.join(__dirname, 'config/dir');
    config.file(dirPath);
    expect(nconfMock.file.calledTwice).to.be.true;
    var file1Path = path.join(dirPath, 'test_1.json');
    var file2Path = path.join(dirPath, 'test_2.json');
    expect(nconfMock.file.getCall(0).args).to.be.deep.equal([
      file1Path,
      {
        file: file1Path,
        format: hjson
      }
    ]);
    expect(nconfMock.file.getCall(1).args).to.be.deep.equal([
      file2Path,
      {
        file: file2Path,
        format: hjson
      }
    ]);
  });

  it('should fail with an invalid file path', function() {
    var ex;
    try {
      config.file(path.join(__dirname, 'not/existent'));
    } catch (e) {
      ex = e;
    }
    expect(ex.name).to.equal('FILE_INVALID');
  });

  it('should fail with a file without ".json" extension', function() {
    var ex;
    try {
      config.file(path.join(__dirname, 'config/dir/readme'));
    } catch (e) {
      ex = e;
    }
    expect(ex.name).to.equal('FILE_INVALID');
  });

});
