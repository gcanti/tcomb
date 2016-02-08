/* globals describe, it */
var assert = require('assert');
var t = require('../index');
var util = require('./util');

var Point = t.struct({
  x: t.Number,
  y: t.Number
});

describe('t.tuple(types, [name])', function () {

  var Area = t.tuple([t.Number, t.Number], 'Area');

  describe('combinator', function () {

    it('should throw if used with wrong arguments', function () {

      util.throwsWithMessage(function () {
        t.tuple();
      }, '[tcomb] Invalid argument types undefined supplied to tuple(types, [name]) combinator (expected an array of types)');

      util.throwsWithMessage(function () {
        t.tuple([1]);
      }, '[tcomb] Invalid argument types [\n  1\n] supplied to tuple(types, [name]) combinator (expected an array of types)');

      util.throwsWithMessage(function () {
        t.tuple([Point, Point], 1);
      }, '[tcomb] Invalid argument name 1 supplied to tuple(types, [name]) combinator (expected a string)');

    });

  });

  describe('constructor', function () {

    var S = t.struct({}, 'S');
    var T = t.tuple([S, S], 'T');

    it('should throw with a contextual error message if used with wrong arguments', function () {

      var T = t.tuple([t.Number, t.Number], 'T');

      util.throwsWithMessage(function () {
        T();
      }, '[tcomb] Invalid value undefined supplied to T (expected an array of length 2)');

      util.throwsWithMessage(function () {
        T(['a']);
      }, '[tcomb] Invalid value [\n  "a"\n] supplied to T (expected an array of length 2)');

    });

    it('should hydrate the elements of the list', function () {
      var instance = T([{}, {}]);
      assert.equal(S.is(instance[0]), true);
    });

    it('should hydrate the elements of the list in production', util.production(function () {
      var instance = T([{}, {}]);
      assert.equal(S.is(instance[0]), true);
    }));

    it('should be idempotent', function () {
      var t0 = [{}, {}];
      var t1 = T(t0);
      var t2 = T(t1);
      assert.equal(t0 === t1, false);
      assert.equal(t1 === t2, true);
    });

    it('should be idempotent in production', util.production(function () {
      var t0 = [{}, {}];
      var t1 = T(t0);
      var t2 = T(t1);
      assert.equal(t0 === t1, false);
      assert.equal(t1 === t2, true);
    }));

  });

  describe('is(x)', function () {

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

  describe('update(instance, patch)', function () {

    it('should return a new instance', function () {
      var Tuple = t.tuple([t.String, t.Number]);
      var instance = Tuple(['a', 1]);
      var newInstance = Tuple.update(instance, {0: { $set: 'b' }});
      assert.equal(Tuple.is(newInstance), true);
      assert.equal(newInstance !== instance, true);
      assert.equal(newInstance[0], 'b');
    });

  });

});
