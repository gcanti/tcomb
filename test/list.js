/* globals describe, it */
var assert = require('assert');
var t = require('../index');
var throwsWithMessage = require('./util').throwsWithMessage;

var Point = t.struct({
  x: t.Number,
  y: t.Number
});

describe('t.list(type, [name])', function () {

  describe('combinator', function () {

    it('should throw if used with wrong arguments', function () {

      throwsWithMessage(function () {
        t.list();
      }, '[tcomb] Invalid argument type undefined supplied to list(type, [name]) combinator (expected a type)');

      throwsWithMessage(function () {
        t.list(Point, 1);
      }, '[tcomb] Invalid argument name 1 supplied to list(type, [name]) combinator (expected a string)');

    });

  });

  describe('constructor', function () {

    var S = t.struct({}, 'S');
    var T = t.list(S, 'T');

    it('should coerce values', function () {
      var t = T([{}]);
      assert.ok(S.is(t[0]));
    });

    it('should accept only valid values', function () {

      throwsWithMessage(function () {
        T(1);
      }, '[tcomb] Invalid value 1 supplied to T (expected an array of S)');

      throwsWithMessage(function () {
        T([1]);
      }, '[tcomb] Invalid value 1 supplied to T/0: S (expected an object)');

    });

    it('should be idempotent', function () {
      var T = t.list(t.Number);
      var p1 = T([1, 2]);
      var p2 = T(p1);
      assert.deepEqual(Object.isFrozen(p1), true);
      assert.deepEqual(Object.isFrozen(p2), true);
      assert.deepEqual(p2 === p1, true);
    });

  });

  describe('#is(x)', function () {

    var Path = t.list(Point);
    var p1 = new Point({x: 0, y: 0});
    var p2 = new Point({x: 1, y: 1});

    it('should return true when x is a list', function () {
      assert.ok(Path.is([p1, p2]));
    });

    it('should not depend on `this`', function () {
      assert.ok([[p1, p2]].every(Path.is));
    });

  });

  describe('#update()', function () {

    var Type = t.list(t.String);
    var instance = Type(['a', 'b']);

    it('should return a new instance', function () {
      var newInstance = Type.update(instance, {'$push': ['c']});
      assert(Type.is(newInstance));
      assert(instance.length === 2);
      assert(newInstance.length === 3);
    });

  });

});
