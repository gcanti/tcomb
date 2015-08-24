/* globals describe, it */
var assert = require('assert');
var t = require('../index');
var throwsWithMessage = require('./util').throwsWithMessage;

var Point = t.struct({
  x: t.Number,
  y: t.Number
});

describe('t.tuple(types, [name])', function () {

  var Area = t.tuple([t.Number, t.Number], 'Area');

  describe('combinator', function () {

    it('should throw if used with wrong arguments', function () {

      throwsWithMessage(function () {
        t.tuple();
      }, '[tcomb] Invalid argument types undefined supplied to tuple(types, [name]) combinator (expected an array of types)');

      throwsWithMessage(function () {
        t.tuple([1]);
      }, '[tcomb] Invalid argument types [\n  1\n] supplied to tuple(types, [name]) combinator (expected an array of types)');

      throwsWithMessage(function () {
        t.tuple([Point, Point], 1);
      }, '[tcomb] Invalid argument name 1 supplied to tuple(types, [name]) combinator (expected a string)');

    });

  });

  describe('constructor', function () {

    var S = t.struct({}, 'S');
    var T = t.tuple([S, S], 'T');

    it('should coerce values', function () {
      var t = T([{}, {}]);
      assert.ok(S.is(t[0]));
      assert.ok(S.is(t[1]));
    });

    it('should accept only valid values', function () {

      throwsWithMessage(function () {
        T(1);
      }, '[tcomb] Invalid value 1 supplied to T (expected an array of length 2)');

      throwsWithMessage(function () {
        T([1, 1]);
      }, '[tcomb] Invalid value 1 supplied to T/0: S (expected an object)');

    });

    it('should be idempotent', function () {
      var T = t.tuple([t.String, t.Number]);
      var p1 = T(['a', 1]);
      var p2 = T(p1);
      assert.deepEqual(Object.isFrozen(p1), true);
      assert.deepEqual(Object.isFrozen(p2), true);
      assert.deepEqual(p2 === p1, true);
    });

  });

  describe('#is(x)', function () {

    it('should return true when x is an instance of the tuple', function () {
      assert.ok(Area.is([1, 2]));
    });

    it('should return false when x is not an instance of the tuple', function () {
      assert.strictEqual(Area.is([1]), false);
      assert.strictEqual(Area.is([1, 2, 3]), false);
      assert.strictEqual(Area.is([1, 'a']), false);
    });

    it('should not depend on `this`', function () {
      assert.ok([[1, 2]].every(Area.is));
    });

  });

  describe('#update()', function () {

    var Type = t.tuple([t.String, t.Number]);
    var instance = Type(['a', 1]);

    it('should return a new instance', function () {
      var newInstance = Type.update(instance, {0: {$set: 'b'}});
      assert(Type.is(newInstance));
      assert(instance[0] === 'a');
      assert(newInstance[0] === 'b');
    });

  });

});
