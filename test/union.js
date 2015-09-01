/* globals describe, it */
var assert = require('assert');
var t = require('../index');
var throwsWithMessage = require('./util').throwsWithMessage;

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
  assert(t.Object.is(values));
  return values.hasOwnProperty('center') ?
    Circle :
    Rectangle;
};

describe('t.union(types, [name])', function () {

  describe('combinator', function () {

    it('should throw if used with wrong arguments', function () {

      throwsWithMessage(function () {
        t.union();
      }, '[tcomb] Invalid argument types undefined supplied to union(types, [name]) combinator (expected an array of at least 2 types)');

      throwsWithMessage(function () {
        t.union([]);
      }, '[tcomb] Invalid argument types [] supplied to union(types, [name]) combinator (expected an array of at least 2 types)');

      throwsWithMessage(function () {
        t.union([1]);
      }, '[tcomb] Invalid argument types [\n  1\n] supplied to union(types, [name]) combinator (expected an array of at least 2 types)');

      throwsWithMessage(function () {
        t.union([Circle, Point], 1);
      }, '[tcomb] Invalid argument name 1 supplied to union(types, [name]) combinator (expected a string)');

    });

  });

  describe('constructor', function () {

    it('should build instances when dispatch() is implemented', function () {
      var circle = Shape({center: {x: 0, y: 0}, radius: 10});
      assert.ok(Circle.is(circle));
    });

    it('should throw if used with new and union types are not instantiables with new', function () {
      throwsWithMessage(function () {
        var T = t.union([t.String, t.Number], 'T');
        T.dispatch = function () { return t.String; };
        var x = new T('a'); // eslint-disable-line
      }, '[tcomb] Cannot use the new operator to instantiate the type T');
    });

    it('should not throw if used with new and union types are instantiables with new', function () {
      assert.doesNotThrow(function () {
        Shape({center: {x: 0, y: 0}, radius: 10});
      });
    });

    it('should be idempotent', function () {
      var p1 = Shape({center: {x: 0, y: 0}, radius: 10});
      var p2 = Shape(p1);
      assert.deepEqual(Object.isFrozen(p1), true);
      assert.deepEqual(Object.isFrozen(p2), true);
      assert.deepEqual(p2 === p1, true);
    });

  });

  describe('#is(x)', function () {

    it('should return true when x is an instance of the union', function () {
      var p = new Circle({center: { x: 0, y: 0 }, radius: 10});
      assert.ok(Shape.is(p));
    });

  });

  describe('#dispatch(x)', function () {

    it('should have a default implementation', function () {
      var T = t.union([t.String, t.Number], 'T');
      assert.deepEqual(T(1), 1);
    });

    it('should handle union of unions', function () {
      var T1 = t.union([t.String, t.Number], 'T1');
      var T2 = t.union([t.Boolean, t.Object], 'T2');
      var T = t.union([T1, T2, t.Array], 'T');
      assert.strictEqual(T.dispatch(1), t.Number);
      assert.strictEqual(T.dispatch({foo: "bar"}), t.Object);
      assert.strictEqual(T.dispatch([]), t.Array);
    });

    it('should throw if does not return a type', function () {
      throwsWithMessage(function () {
        var T = t.union([t.String, t.Number], 'T');
        T(true);
      }, '[tcomb] Invalid value true supplied to T');
    });

  });

  describe('#update(instance, spec)', function () {

    it('should update the right instance', function () {
      var circle = Shape.update({ center: { x: 0, y: 0 }, radius: 10 }, { radius: { $set: 15 } });
      assert.strictEqual(Circle.is(circle), true);
    });

  });

});
