/* globals describe, it */
var assert = require('assert');
var t = require('../index');
var throwsWithMessage = require('./util').throwsWithMessage;

var Point = t.struct({
  x: t.Number,
  y: t.Number
});

describe('t.refinement(type, predicate, [name])', function () {

  var True = function () { return true; };

  describe('combinator', function () {

    it('should throw if used with wrong arguments', function () {

      throwsWithMessage(function () {
        t.refinement();
      }, '[tcomb] Invalid argument type undefined supplied to refinement(type, predicate, [name]) combinator (expected a type)');

      throwsWithMessage(function () {
        t.refinement(Point, null);
      }, '[tcomb] Invalid argument predicate supplied to refinement(type, predicate, [name]) combinator (expected a function)');

      throwsWithMessage(function () {
        t.refinement(Point, True, 1);
      }, '[tcomb] Invalid argument name 1 supplied to refinement(type, predicate, [name]) combinator (expected a string)');

    });

  });

  describe('constructor', function () {

    it('should throw if used with new and a type that is not instantiable with new', function () {
      throwsWithMessage(function () {
        var T = t.refinement(t.String, function () { return true; }, 'T');
        var x = new T(); // eslint-disable-line
      }, '[tcomb] Cannot use the new operator to instantiate the type T');
    });

    it('should coerce values', function () {
      var T = t.refinement(Point, function () { return true; });
      var p = T({x: 0, y: 0});
      assert.ok(Point.is(p));
    });

    it('should accept only valid values', function () {
      var predicate = function (p) { return p.x > 0; };
      var T = t.refinement(Point, predicate, 'T');
      throwsWithMessage(function () {
        T({x: 0, y: 0});
      }, '[tcomb] Invalid value {\n  "x": 0,\n  "y": 0\n} supplied to T');
    });

  });

  describe('#is(x)', function () {

    var Positive = t.refinement(t.Number, function (n) {
      return n >= 0;
    });

    it('should return true when x is a refinement', function () {
      assert.ok(Positive.is(1));
    });

    it('should return false when x is not a refinement', function () {
      assert.strictEqual(Positive.is(-1), false);
    });

  });

  describe('#update()', function () {

    var Type = t.refinement(t.String, function (s) { return s.length > 2; });
    var instance = Type('abc');

    it('should return a new instance', function () {
      var newInstance = Type.update(instance, {'$set': 'bca'});
      assert(Type.is(newInstance));
      assert.deepEqual(newInstance, 'bca');
    });

  });

});
