/* globals describe, it */
var assert = require('assert');
var t = require('../index');
var util = require('./util');

var Point = t.struct({
  x: t.Number,
  y: t.Number
});

describe('t.maybe(type, [name])', function () {

  describe('combinator', function () {

    it('should throw if used with wrong arguments', function () {

      util.throwsWithMessage(function () {
        t.maybe();
      }, '[tcomb] Invalid argument type undefined supplied to maybe(type, [name]) combinator (expected a type)');

      util.throwsWithMessage(function () {
        t.maybe(Point, 1);
      }, '[tcomb] Invalid argument name 1 supplied to maybe(type, [name]) combinator (expected a string)');

    });

    it('should be idempotent', function () {
      var MaybeStr = t.maybe(t.String);
      assert.ok(t.maybe(MaybeStr) === MaybeStr);
    });

    it('should be idempotent in production', util.production(function () {
      var MaybeStr = t.maybe(t.String);
      assert.ok(t.maybe(MaybeStr) === MaybeStr);
    }));

    it('should be noop with Any', function () {
      assert.ok(t.maybe(t.Any) === t.Any);
    });

    it('should be noop with Nil', function () {
      assert.ok(t.maybe(t.Nil) === t.Nil);
    });

  });

  describe('constructor', function () {

    it('should throw if used with new', function () {
      util.throwsWithMessage(function () {
        var T = t.maybe(t.String, 'T');
        var x = new T(); // eslint-disable-line
      }, '[tcomb] Cannot use the new operator to instantiate the type T');
    });

    it('should hydrate the elements of the maybe', function () {
      var T = t.maybe(Point);
      assert.deepEqual(T(null), null);
      assert.deepEqual(T(undefined), null);
      assert.ok(Point.is(T({x: 0, y: 0})));
    });

    it('should hydrate the elements of the maybe in production', util.production(function () {
      var T = t.maybe(Point);
      assert.deepEqual(T(null), null);
      assert.deepEqual(T(undefined), null);
      assert.ok(Point.is(T({x: 0, y: 0})));
    }));

    it('should be idempotent', function () {
      var T = t.maybe(Point);
      var p0 = {x: 0, y: 0};
      var p1 = T();
      var p2 = T(p1);
      assert.equal(p0 === p1, false);
      assert.equal(p1 === p2, true);
    });

    it('should be idempotent in production', util.production(function () {
      var T = t.maybe(Point);
      var p0 = {x: 0, y: 0};
      var p1 = T();
      var p2 = T(p1);
      assert.equal(p0 === p1, false);
      assert.equal(p1 === p2, true);
    }));

  });

  describe('is(x)', function () {

    it('should return true when x is an instance of the maybe', function () {
      var Radio = t.maybe(t.String);
      assert.strictEqual(Radio.is('a'), true);
      assert.strictEqual(Radio.is(null), true);
      assert.strictEqual(Radio.is(undefined), true);
    });

  });

});
