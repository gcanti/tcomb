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
      }, '[tcomb] Invalid argument props undefined supplied to struct(props, [options]) combinator (expected a dictionary String -> Type)');

      throwsWithMessage(function () {
        t.struct({a: null});
      }, '[tcomb] Invalid argument props {\n  "a": null\n} supplied to struct(props, [options]) combinator (expected a dictionary String -> Type)');

      throwsWithMessage(function () {
        t.struct({}, 1);
      }, '[tcomb] Invalid argument name 1 supplied to struct(props, [options]) combinator (expected a string)');

      throwsWithMessage(function () {
        t.struct({}, {strict: 1});
      }, '[tcomb] Invalid argument strict 1 supplied to struct(props, [options]) combinator (expected a boolean)');

    });

  });

  describe('struct.getOptions', function () {

    it('should handle options', function () {
      assert.deepEqual(t.struct.getOptions(), { strict: false, defaultProps: {} });
      assert.deepEqual(t.struct.getOptions({}), { strict: false, defaultProps: {} });
      assert.deepEqual(t.struct.getOptions('Person'), { strict: false, name: 'Person', defaultProps: {} });
      assert.deepEqual(t.struct.getOptions({ strict: false }), { strict: false, defaultProps: {} });
      assert.deepEqual(t.struct.getOptions({ strict: true }), { strict: true, defaultProps: {} });
      t.struct.strict = true;
      assert.deepEqual(t.struct.getOptions(), { strict: true, defaultProps: {} });
      assert.deepEqual(t.struct.getOptions({}), { strict: true, defaultProps: {} });
      assert.deepEqual(t.struct.getOptions('Person'), { strict: true, name: 'Person', defaultProps: {} });
      assert.deepEqual(t.struct.getOptions({ strict: false }), { strict: false, defaultProps: {} });
      assert.deepEqual(t.struct.getOptions({ strict: true }), { strict: true, defaultProps: {} });
      t.struct.strict = false;
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
      }, '[tcomb] Invalid value 1 supplied to Struct{x: Number, y: Number} (expected an object)');
      throwsWithMessage(function () {
        Point({});
      }, '[tcomb] Invalid value undefined supplied to Struct{x: Number, y: Number}/x: Number');
    });

    it('should handle strict option', function () {
      var Person = t.struct({
        name: t.String,
        surname: t.maybe(t.String)
      }, { name: 'Person', strict: true });

      assert.strictEqual(Person.meta.name, 'Person');
      assert.strictEqual(Person.meta.strict, true);

      throwsWithMessage(function () {
        new Person({ name: 'Giulio', age: 42 });
      }, '[tcomb] Invalid additional prop "age" supplied to Person');

      throwsWithMessage(function () {
        // simulating a typo on a maybe prop
        new Person({ name: 'Giulio', sur: 'Canti' });
      }, '[tcomb] Invalid additional prop "sur" supplied to Person');

      function Input(name) {
        this.name = name;
      }
      Input.prototype.method = function () {};
      assert.doesNotThrow(function () {
        new Person(new Input('Giulio'));
      });
    });

    it('should handle global strict option', function () {
      t.struct.strict = true;
      var Person = t.struct({
        name: t.String,
        surname: t.maybe(t.String)
      }, 'Person');

      throwsWithMessage(function () {
        new Person({ name: 'Giulio', age: 42 });
        t.struct.strict = false;
      }, '[tcomb] Invalid additional prop "age" supplied to Person');
      t.struct.strict = false;
    });

    it('how to handle unions of structs when global strict is true', function () {
      var T1 = t.struct({}, { strict: false });
      var T2 = t.struct({}, { strict: false });
      var U = t.union([T1, T2]);
      U.dispatch = function (x) {
        switch (x.type) {
          case '1': return T1;
          case '2': return T2;
        }
      };
      var x = U({type: '2'});
      assert.strictEqual(x instanceof T2, true);
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

  describe('default props', function () {

    it('should throw if used with wrong arguments', function () {
      throwsWithMessage(function () {
        t.struct({}, { defaultProps: 1 });
      }, '[tcomb] Invalid argument defaultProps 1 supplied to struct(props, [options]) combinator (expected an object)');
    });

    it('should handle the defaultProps option', function () {
      var T = t.struct({
        name: t.String,
        surname: t.String
      }, { defaultProps: { surname: 'Canti' } });
      assert.doesNotThrow(function () {
        T({ name: 'Giulio' });
      });
    });

    it('should apply defaults if a props is undefined', function () {
      var T = t.struct({
        name: t.maybe(t.String)
      }, { defaultProps: { name: 'Giulio' } });
      assert.strictEqual(T({}).name, 'Giulio');
      assert.strictEqual(T({ name: undefined }).name, 'Giulio');
      assert.strictEqual(T({ name: null }).name, null);
    });

    it('should apply the default after an update', function () {
      var T = t.struct({
        name: t.String,
        surname: t.String
      }, { defaultProps: { surname: 'Canti' } });
      var p1 = T({ name: 'Giulio' });
      var p2 = T.update(p1, {
        surname: { $set: undefined }
      });
      assert.strictEqual(p2.name, 'Giulio');
    });

  });

});
