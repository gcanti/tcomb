/* globals describe, it */
var assert = require('assert');
var t = require('../index');
var throwsWithMessage = require('./util').throwsWithMessage;

var Point = t.struct({
  x: t.Number,
  y: t.Number
});

var PointInterface = t.inter({
  x: t.Number,
  y: t.Number
});

var ToStringable = t.inter({
  toString: t.Function
});

var HydrateInterface = t.inter({point: Point});

describe('t.interface(props, [name])', function () {

  describe('combinator', function () {

    it('should throw if used with wrong arguments', function () {

      throwsWithMessage(function () {
        t.inter();
      }, '[tcomb] Invalid argument props undefined supplied to interface(props, [options]) combinator (expected a dictionary String -> Type)');

      throwsWithMessage(function () {
        t.inter({a: null});
      }, '[tcomb] Invalid argument props {\n  "a": null\n} supplied to interface(props, [options]) combinator (expected a dictionary String -> Type)');

      throwsWithMessage(function () {
        t.inter({}, 1);
      }, '[tcomb] Invalid argument name 1 supplied to interface(props, [options]) combinator (expected a string)');

      throwsWithMessage(function () {
        t.inter({}, {strict: 1});
      }, '[tcomb] Invalid argument strict 1 supplied to struct(props, [options]) combinator (expected a boolean)');

    });

  });

  describe('inter.getOptions', function () {

    it('should handle options', function () {
      assert.deepEqual(t.inter.getOptions(), { strict: false });
      assert.deepEqual(t.inter.getOptions({}), { strict: false });
      assert.deepEqual(t.inter.getOptions('Person'), { strict: false, name: 'Person' });
      assert.deepEqual(t.inter.getOptions({ strict: false }), { strict: false });
      assert.deepEqual(t.inter.getOptions({ strict: true }), { strict: true });
      t.inter.strict = true;
      assert.deepEqual(t.inter.getOptions(), { strict: true });
      assert.deepEqual(t.inter.getOptions({}), { strict: true });
      assert.deepEqual(t.inter.getOptions('Person'), { strict: true, name: 'Person' });
      assert.deepEqual(t.inter.getOptions({ strict: false }), { strict: false });
      assert.deepEqual(t.inter.getOptions({ strict: true }), { strict: true });
      t.inter.strict = false;
    });

  });

  describe('constructor', function () {

    it('should be idempotent', function () {
      var p1 = PointInterface({x: 0, y: 0});
      var p2 = PointInterface(p1);
      assert.deepEqual(Object.isFrozen(p1), true);
      assert.deepEqual(Object.isFrozen(p2), true);
      assert.deepEqual(p2 === p1, true);
    });

    it('should accept only valid values', function () {
      throwsWithMessage(function () {
        PointInterface(1);
      }, '[tcomb] Invalid value undefined supplied to {x: Number, y: Number}/x: Number');
      throwsWithMessage(function () {
        PointInterface({});
      }, '[tcomb] Invalid value undefined supplied to {x: Number, y: Number}/x: Number');
      throwsWithMessage(function () {
        PointInterface(null);
      }, '[tcomb] Invalid value null supplied to {x: Number, y: Number}');
      throwsWithMessage(function () {
        PointInterface(undefined);
      }, '[tcomb] Invalid value undefined supplied to {x: Number, y: Number}');
    });

    it('should have meta.identity = true if contains a type with identity = true', function () {
      assert.equal(PointInterface.meta.identity, true);
      assert.equal(HydrateInterface.meta.identity, false);
    });

    it('should hydrate fields', function () {
      var hi = HydrateInterface({ point: { x: 0, y: 1} });
      assert.equal(Point.is(hi.point), true);
    });

    it('should handle strict option', function () {
      var Person = t.inter({
        name: t.String,
        surname: t.maybe(t.String)
      }, { name: 'Person', strict: true });

      assert.strictEqual(Person.meta.name, 'Person');
      assert.strictEqual(Person.meta.strict, true);

      throwsWithMessage(function () {
        Person({ name: 'Giulio', age: 42 });
      }, '[tcomb] Invalid additional prop "age" supplied to Person');

      throwsWithMessage(function () {
        // simulating a typo on a maybe prop
        Person({ name: 'Giulio', sur: 'Canti' });
      }, '[tcomb] Invalid additional prop "sur" supplied to Person');

      function Input(name) {
        this.name = name;
      }
      Input.prototype.method = function () {};
      throwsWithMessage(function () {
        Person(new Input('Giulio'));
      }, '[tcomb] Invalid additional prop "method" supplied to Person');

      var InputInterface = t.inter({
        name: t.String,
        method: t.Function
      }, { name: 'InputInterface', strict: true });
      assert.doesNotThrow(function () {
        InputInterface(new Input('Giulio'));
      });
    });

    it('should handle global strict option', function () {
      t.inter.strict = true;
      var Person = t.inter({
        name: t.String,
        surname: t.maybe(t.String)
      }, 'Person');

      throwsWithMessage(function () {
        Person({ name: 'Giulio', age: 42 });
        t.inter.strict = false;
      }, '[tcomb] Invalid additional prop "age" supplied to Person');
      t.inter.strict = false;
    });

  });

  describe('#is(x)', function () {

    it('should return true when x is an instance of the interface', function () {
      assert.equal(PointInterface.is({ x: 1, y: 2 }), true);
      assert.equal(PointInterface.is(Point({ x: 1, y: 2 })), true);
    });

    it('should check types', function () {
      assert.equal(PointInterface.is({ x: 1, y: 'a' }), false);
      assert.equal(PointInterface.is(1), false);
      assert.equal(ToStringable.is(1), true);
      assert.equal(ToStringable.is({}), true);
    });

    it('should allow additional props', function () {
      assert.equal(PointInterface.is({ x: 1, y: 2, z: 3 }), true);
    });

    it('shouldn\'t allow missing props', function () {
      assert.equal(PointInterface.is({ x: 1 }), false);
    });

    it('should allow prototype methods', function () {
      var Serializable = t.inter({
        serialize: t.Function
      });
      Point.prototype.serialize = function () {};
      assert.equal(Serializable.is(Point({ x: 1, y: 2 })), true);
      delete Point.prototype.serialize;
    });

    it('should handle strict option', function () {
      var Person = t.inter({
        name: t.String,
        surname: t.maybe(t.String)
      }, { name: 'Person', strict: true });

      assert.equal(Person.is({ name: 'Giulio' }), true);
      assert.equal(Person.is({ name: 'Giulio', age: 42 }), false);
      assert.equal(Person.is({ name: 'Giulio', sur: 'Canti' }), false);

      function Input(name) {
        this.name = name;
      }
      Input.prototype.method = function () {};
      assert.equal(Person.is(new Input('Giulio')), false);

      var InputInterface = t.inter({
        name: t.String,
        method: t.Function
      }, { name: 'InputInterface', strict: true });
      assert.equal(InputInterface.is(new Input('Giulio')), true);
    });

  });

  describe('#update()', function () {

    var instance = PointInterface({x: 0, y: 0});

    it('should return a new instance', function () {
      var newInstance = PointInterface.update(instance, {x: {$set: 1}});
      assert.ok(PointInterface.is(newInstance));
      assert.deepEqual(instance.x, 0);
      assert.deepEqual(newInstance.x, 1);
      assert.deepEqual(newInstance.y, 0);
    });

  });

});
