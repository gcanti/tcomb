/* globals describe, it */
var assert = require('assert');
var t = require('../index');
var throwsWithMessage = require('./util').throwsWithMessage;

var Point = t.struct({
  x: t.Number,
  y: t.Number
});

describe('t.maybe(type, [name])', function () {

  describe('combinator', function () {

    it('should throw if used with wrong arguments', function () {

      throwsWithMessage(function () {
        t.maybe();
      }, '[tcomb] Invalid argument type undefined supplied to maybe(type, [name]) combinator (expected a type)');

      throwsWithMessage(function () {
        t.maybe(Point, 1);
      }, '[tcomb] Invalid argument name 1 supplied to maybe(type, [name]) combinator (expected a string)');

    });

    it('should be idempotent', function () {
      var MaybeStr = t.maybe(t.String);
      assert.ok(t.maybe(MaybeStr) === MaybeStr);
    });

    it('should be noop with Any', function () {
      assert.ok(t.maybe(t.Any) === t.Any);
    });

    it('should be noop with Nil', function () {
      assert.ok(t.maybe(t.Nil) === t.Nil);
    });

  });

  describe('constructor', function () {

    it('should throw if used with new', function () {
      throwsWithMessage(function () {
        var T = t.maybe(t.String, 'T');
        var x = new T(); // eslint-disable-line
      }, '[tcomb] Cannot use the new operator to instantiate the type T');
    });

    it('should coerce values', function () {
      var T = t.maybe(Point);
      assert.deepEqual(T(null), null);
      assert.deepEqual(T(undefined), null);
      assert.ok(Point.is(T({x: 0, y: 0})));
    });

    it('should be idempotent', function () {
      var T = t.maybe(Point);
      var p1 = T({x: 0, y: 0});
      var p2 = T(p1);
      assert.deepEqual(Object.isFrozen(p1), true);
      assert.deepEqual(Object.isFrozen(p2), true);
      assert.deepEqual(p2 === p1, true);
    });

  });

  describe('#is(x)', function () {

    it('should return true when x is an instance of the maybe', function () {
      var Radio = t.maybe(t.String);
      assert.ok(Radio.is('a'));
      assert.ok(Radio.is(null));
      assert.ok(Radio.is(undefined));
    });

  });

});
