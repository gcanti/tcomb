/* globals describe, it */
var assert = require('assert');
var t = require('../index');
var util = require('./util');

var Point = t.struct({
  x: t.Number,
  y: t.Number
});

var Circle = t.struct({
  center: Point,
  radius: t.Number
}, 'Circle');

var Rectangle = t.struct({
  a: Point,
  b: Point
});

var Shape = t.union([Circle, Rectangle], 'Shape');

Shape.dispatch = function (values) {
  values = t.Object(values);
  return values.hasOwnProperty('center') ?
    Circle :
    Rectangle;
};

describe('t.union(types, [name])', function () {

  describe('combinator', function () {

    it('should throw if used with wrong arguments', function () {

      util.throwsWithMessage(function () {
        t.union();
      }, '[tcomb] Invalid argument types undefined supplied to union(types, [name]) combinator (expected an array of at least 2 types)');

      util.throwsWithMessage(function () {
        t.union([]);
      }, '[tcomb] Invalid argument types [] supplied to union(types, [name]) combinator (expected an array of at least 2 types)');

      util.throwsWithMessage(function () {
        t.union([1]);
      }, '[tcomb] Invalid argument types [\n  1\n] supplied to union(types, [name]) combinator (expected an array of at least 2 types)');

      util.throwsWithMessage(function () {
        t.union([Circle, Point], 1);
      }, '[tcomb] Invalid argument name 1 supplied to union(types, [name]) combinator (expected a string)');

    });

  });

  describe('constructor', function () {

    it('should hydrate the input', function () {
      var circle = Shape({center: {x: 0, y: 0}, radius: 10});
      assert.equal(Circle.is(circle), true);
    });

    it('should hydrate the input in production', util.production(function () {
      var circle = Shape({center: {x: 0, y: 0}, radius: 10});
      assert.equal(Circle.is(circle), true);
    }));

    it('should freeze the instance', function () {
      var circle = Shape({center: {x: 0, y: 0}, radius: 10});
      assert.equal(Object.isFrozen(circle), true);
    });

    it('should not freeze the instance in production', util.production(function () {
      var circle = Shape({center: {x: 0, y: 0}, radius: 10});
      assert.equal(Object.isFrozen(circle), false);
    }));

    it('should throw if used with new', function () {

      assert.doesNotThrow(function () {
        Shape({center: {x: 0, y: 0}, radius: 10});
      });

      util.throwsWithMessage(function () {
        var T = t.union([t.String, t.Number], 'T');
        var x = new T('a'); // eslint-disable-line
      }, '[tcomb] Cannot use the new operator to instantiate the type T');

    });

    it('should show the offended union type in error messages', function () {
      util.throwsWithMessage(function () {
        Shape({center: {x: 0, y: 0}});
      }, '[tcomb] Invalid value undefined supplied to Shape(Circle)/radius: Number');
    });

    it('should be idempotent', function () {
      var s0 = {center: {x: 0, y: 0}, radius: 10};
      var s1 = Shape(s0);
      var s2 = Shape(s1);
      assert.equal(s1 === s0, false);
      assert.equal(s2 === s1, true);
    });

    it('should be idempotent i production', util.production(function () {
      var s0 = {center: {x: 0, y: 0}, radius: 10};
      var s1 = Shape(s0);
      var s2 = Shape(s1);
      assert.equal(s1 === s0, false);
      assert.equal(s2 === s1, true);
    }));

  });

  describe('is(x)', function () {

    it('should return true when x is an instance of the union', function () {
      var p = new Circle({center: {x: 0, y: 0}, radius: 10});
      assert.equal(Shape.is(p), true);
      assert.equal(Shape.is(1), false);
    });

  });

  describe('dispatch(x)', function () {

    it('should have a default implementation', function () {
      var U = t.union([t.String, t.Number], 'T');
      assert.equal(U(1), 1);
    });

    it('should handle union of unions', function () {
      var U1 = t.union([t.String, t.Number], 'U1');
      var U2 = t.union([t.Boolean, t.Object], 'U2');
      var U = t.union([U1, U2, t.Array], 'U');
      assert.equal(U.dispatch(1), t.Number);
      assert.equal(U.dispatch({foo: "bar"}), t.Object);
      assert.equal(U.dispatch([]), t.Array);
    });

    it('should throw if does not return a valid type', function () {

      util.throwsWithMessage(function () {
        var U = t.union([t.String, t.Number], 'T');
        U(true);
      }, '[tcomb] Invalid value true supplied to T (no constructor found)');

      util.throwsWithMessage(function () {
        var U = t.union([t.String, t.Number], 'T');
        U.dispatch = function () {
          return t.Boolean;
        };
        U(true);
      }, '[tcomb] Invalid constructor Boolean returned by T.dispatch(x) function');

    });

  });

  describe('update(instance, spec)', function () {

    it('should update the right instance', function () {
      var circle = Shape.update({ center: { x: 0, y: 0 }, radius: 10 }, { radius: { $set: 15 } });
      assert.equal(Circle.is(circle), true);
    });

  });

});
