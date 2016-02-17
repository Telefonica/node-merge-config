'use strict';

var merge = require('../../lib/merge');

describe('Merge Tests', function() {

  it('should fail with invalid arguments', function() {
    var cases = [
      [null],
      [undefined],
      ['non-object'],
      [{a: 1}, null],
      [{a: 1}, undefined],
      [{a: 1}, 'non-object']
    ];
    for (var i = 0; i < cases.length; i++) {
      expect(function() {
        merge.apply(this, cases[i]);
      }).to.throw('MERGE_INVALID: Merge with invalid parameters');
    }
  });

  it('should merge with valid arguments', function() {
    var cases = [
      {
        args: [
          {},
          {a: 1}
        ],
        result: {a: 1}
      },
      {
        args: [
          {a: 1},
          {}
        ],
        result: {a: 1}
      },
      {
        args: [
          {a: 1, b: true},
          {a: 2, c: 'test'}
        ],
        result: {a: 2, b: true, c: 'test'}
      },
      {
        args: [
          {a: 1, b: {aa: 1, bb: true}},
          {a: 4, b: {aa: 5, cc: 'test'}}
        ],
        result: {a: 4, b: {aa: 5, bb: true, cc: 'test'}}
      }
    ];

    for (var i = 0; i < cases.length; i++) {
      var result = merge(cases[i].args[0], cases[i].args[1]);
      expect(result).to.be.deep.equal(cases[i].result);
      expect(cases[i].args[0]).to.be.deep.equal(cases[i].result);
    }
  });

  it('should merge with multiple arguments', function() {
    var cases = [
      {
        args: [
          {},
          {a: 1},
          {b: 2}
        ],
        result: {a: 1, b: 2}
      },
      {
        args: [
          {a: 1, b: {aa: 1, bb: 2, cc: 3}},
          {b: null, c: 'test'},
          {b: {dd: 'test'}}
        ],
        result: {a: 1, b: {dd: 'test'}, c: 'test'}
      }
    ];

    for (var i = 0; i < cases.length; i++) {
      var result = merge.apply(this, cases[i].args);
      expect(result).to.be.deep.equal(cases[i].result);
      expect(cases[i].args[0]).to.be.deep.equal(cases[i].result);
    }
  });

});
