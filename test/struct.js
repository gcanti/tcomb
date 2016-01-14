/* globals describe, it */
var assert = require('assert');
var t = require('../index');
var throwsWithMessage = require('./util').throwsWithMessage;

var Point = t.struct({
  x: t.Number,
  y: t.Number
});

describe('t.struct(props, [name])', function () {

  describe('combinator', function () {

    it('should throw if used with wrong arguments', function () {

      throwsWithMessage(function () {
        t.struct();
      }, '[tcomb] Invalid argument props undefined supplied to struct(props, [name]) combinator (expected a dictionary String -> Type)');

      throwsWithMessage(function () {
        t.struct({a: null});
      }, '[tcomb] Invalid argument props {\n  "a": null\n} supplied to struct(props, [name]) combinator (expected a dictionary String -> Type)');

      throwsWithMessage(function () {
        t.struct({}, 1);
      }, '[tcomb] Invalid argument name 1 supplied to struct(props, [name]) combinator (expected a string)');

    });

  });

  describe('struct.extend', function () {
    it('should handle an array of mixins', function () {
      var Point = t.struct({
        x: t.Number,
        y: t.Number
      }, 'Point');
      var Point3D = t.struct.extend([Point, {z: t.Number}], 'Point3D');
      assert.deepEqual(Point3D.meta.name, 'Point3D', 'name');
      assert.deepEqual(Point3D.meta.props.x, t.Number, 'x');
      assert.deepEqual(Point3D.meta.props.y, t.Number, 'y');
      assert.deepEqual(Point3D.meta.props.z, t.Number, 'z');
    });
  });

  describe('constructor', function () {

    it('should be idempotent', function () {
      var T = Point;
      var p1 = T({x: 0, y: 0});
      var p2 = T(p1);
      assert.deepEqual(Object.isFrozen(p1), true);
      assert.deepEqual(Object.isFrozen(p2), true);
      assert.deepEqual(p2 === p1, true);
    });

    it('should accept only valid values', function () {
      throwsWithMessage(function () {
        Point(1);
      }, '[tcomb] Invalid value 1 supplied to {x: Number, y: Number} (expected an object)');
      throwsWithMessage(function () {
        Point({});
      }, '[tcomb] Invalid value undefined supplied to {x: Number, y: Number}/x: Number');
    });

  });

  describe('#is(x)', function () {

    it('should return true when x is an instance of the struct', function () {
      var p = new Point({ x: 1, y: 2 });
      assert.ok(Point.is(p));
    });

  });

  describe('#update()', function () {

    var Type = t.struct({name: t.String});
    var instance = new Type({name: 'Giulio'});

    it('should return a new instance', function () {
      var newInstance = Type.update(instance, {name: {$set: 'Canti'}});
      assert.ok(Type.is(newInstance));
      assert.deepEqual(instance.name, 'Giulio');
      assert.deepEqual(newInstance.name, 'Canti');
    });

  });

  describe('#extend(props, [name])', function () {

    it('should extend an existing struct', function () {
      var Point = t.struct({
        x: t.Number,
        y: t.Number
      }, 'Point');
      var Point3D = Point.extend({z: t.Number}, 'Point3D');
      assert.deepEqual(Point3D.meta.name, 'Point3D', 'name');
      assert.deepEqual(Point3D.meta.props.x, t.Number, 'x');
      assert.deepEqual(Point3D.meta.props.y, t.Number, 'y');
      assert.deepEqual(Point3D.meta.props.z, t.Number, 'z');
    });

    it('should handle an array as argument', function () {
      var Type = t.struct({a: t.String}, 'Type');
      var Mixin = [{b: t.Number, c: t.Boolean}];
      var NewType = Type.extend(Mixin, 'NewType');
      assert.deepEqual(t.getTypeName(NewType), 'NewType');
      assert.deepEqual(NewType.meta.props.a, t.String);
      assert.deepEqual(NewType.meta.props.b, t.Number);
      assert.deepEqual(NewType.meta.props.c, t.Boolean);
    });

    it('should handle a struct (or list of structs) as argument', function () {
      var A = t.struct({a: t.String}, 'A');
      var B = t.struct({b: t.String}, 'B');
      var C = t.struct({c: t.String}, 'C');
      var MixinD = {d: t.String};
      var E = A.extend([B, C, MixinD]);
      assert.deepEqual(E.meta.props, {
        a: t.String,
        b: t.String,
        c: t.String,
        d: t.String
      });
    });

    it('should support prototypal inheritance', function () {
      var Rectangle = t.struct({
        w: t.Number,
        h: t.Number
      }, 'Rectangle');
      Rectangle.prototype.area = function () {
        return this.w * this.h;
      };
      var Cube = Rectangle.extend({
        l: t.Number
      });
      Cube.prototype.volume = function () {
        return this.area() * this.l;
      };

      assert(typeof Rectangle.prototype.area === 'function');
      assert(typeof Cube.prototype.area === 'function');
      assert(undefined === Rectangle.prototype.volume);
      assert(typeof Cube.prototype.volume === 'function');
      assert(Cube.prototype.constructor === Cube);

      var c = new Cube({w: 2, h: 2, l: 2});
      assert.deepEqual(c.volume(), 8);
    });

    it('should support multiple prototypal inheritance', function () {
      var A = t.struct({ a: t.Str }, 'A');
      A.prototype.amethod = function () {};
      var B = t.struct({ b: t.Str }, 'B');
      B.prototype.bmethod = function () {};
      var C = t.struct({ c: t.Str }, 'C');
      C.prototype.cmethod = function () {};
      var Z = C.extend([A, B], 'Z');
      var z = new Z({ a: 'a', b: 'b', c: 'c' });
      assert.strictEqual(Z.meta.name, 'Z');
      assert.strictEqual(t.Function.is(z.cmethod), true);
      assert.strictEqual(t.Function.is(z.bmethod), true);
      assert.strictEqual(t.Function.is(z.amethod), true);
    });

  });

});
