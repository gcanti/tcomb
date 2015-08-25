/* globals describe, it */
var assert = require('assert');
var t = require('../index');
var throwsWithMessage = require('./util').throwsWithMessage;

describe('match', function () {

  it('should match on type constructors', function () {
    assert.deepEqual(t.match(1,
      t.String, function () { return 'a string'; },
      t.Number, function (n) { return 2 * n; }
    ), 2);
  });

  it('should handle an optional guard', function () {
    assert.deepEqual(t.match(1,
      t.String, function () { return 'a string'; },
      t.Number, function () { return false; }, function (n) { return 2 * n; },
      t.Number, function (n) { return 3 * n; }
    ), 3);
  });

  it('should throw if no match is found', function () {
    throwsWithMessage(function () {
      t.match(true,
        t.String, function () { return 'a string'; },
        t.Number, function (n) { return 2 * n; }
      );
    }, '[tcomb] Match error');
  });

  it('should throw if cases are misplaced', function () {
    throwsWithMessage(function () {
      t.match(true,
        t.String, function () { return 'a string'; },
        t.Number
      );
    }, '[tcomb] Invalid block in clause #2');
  });

  it('should handle unions of unions', function () {
    var A = t.subtype(t.String, function (s) { return s === 'A'; });
    var B = t.subtype(t.String, function (s) { return s === 'B'; });
    var C = t.subtype(t.String, function (s) { return s === 'C'; });
    var D = t.subtype(t.String, function (s) { return s === 'D'; });
    var E = t.subtype(t.String, function (s) { return s === 'E'; });
    var F = t.subtype(t.String, function (s) { return s === 'F'; });
    var G = t.subtype(t.String, function (s) { return s === 'G'; });
    var H = t.subtype(t.String, function (s) { return s === 'H'; });
    var U1 = t.union([A, B]);
    var U2 = t.union([C, D]);
    var U3 = t.union([E, F]);
    var U4 = t.union([G, H]);
    var UU1 = t.union([U1, U2]);
    var UU2 = t.union([U3, U4]);
    assert.deepEqual(t.match('F',
      UU1, function () { return '1'; },
      UU2, function () { return '2'; }
    ), '2');
  });

});
