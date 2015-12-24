/* globals describe, it */
var assert = require('assert');
var t = require('../index');
var throwsWithMessage = require('./util').throwsWithMessage;

var A = t.declare('A');

var B = t.struct({
  a: t.maybe(A)
});

A.define(t.struct({
  b: t.maybe(B)
}));

describe('t.declare([name])', function () {

  describe('combinator', function () {

    it('should throw if used with wrong arguments', function () {

      assert.throws(function () {
        t.declare(t.Number);
      }, function(err) {
        assert.strictEqual(err instanceof Error, true);
        assert.ok(/\[tcomb\] Invalid argument name function (.|\n)* supplied to declare\(\[name\]\) \(expected a string\)/m.test(err.message));
        return true;
      });

      throwsWithMessage(function () {
        t.declare('D')
          .define('not a type');
      }, '[tcomb] Invalid argument type "not a type" supplied to define(type) (expected a type)');

    });

    it('should throw if define-d multiple times', function () {
      throwsWithMessage(function () {
        t.declare('D')
          .define(t.list(t.Any))
          .define(t.list(t.Any));
      }, '[tcomb] Declare.define(type) can only be invoked once');
    });

    it('should have a fresh name for different declares when not explicitly provided', function() {
      var Nameless1 = t.declare();
      Nameless1.define(t.struct({
        thing: Nameless1
      }));
      assert.throws(function() {
        Nameless1({});
      }, function(err) {
        assert.strictEqual(err instanceof Error, true);
        assert.ok(/\[tcomb\] Invalid value .+ supplied to {thing: Declare\$[0-9]+}\/thing: {thing: Declare\$[0-9]+} \(expected an object\)/m.test(err.message));
        return true;
      });
      var Nameless2 = t.declare();
      assert.ok(t.getTypeName(Nameless1) !== t.getTypeName(Nameless2));
    });

    it('an instance of the declared type should satisfy instanceof, if the concrete type is a struct', function() {
      var Struct = t.declare('Struct')
        .define(t.struct({}));
      var actual = new Struct({});
      assert.ok(actual instanceof Struct);
    });

    it('should have the expected names', function() {
      var Named = t.declare('Named');
      Named.define(t.list(t.Any));
      assert.strictEqual(Named.displayName, 'Named');
      assert.strictEqual(Named.meta.name, 'Named');

      var Nameless = t.declare();
      assert.strictEqual(Nameless.displayName, 'Declare$3');
      Nameless.define(t.list(t.Any));
      assert.strictEqual(Nameless.displayName, 'Array<Any>');
      assert.strictEqual(Nameless.meta.name, undefined);
    });

    it('should support adding functions to the prototype, when allowed by the concrete type', function() {
      function getValue() { return this.value; }
      var Struct = t.declare('Struct')
        .define(t.struct({
          value: t.Number
        }));
      Struct.prototype.getValue = getValue;
      assert.equal(42, Struct({value: 42}).getValue());
    });

    it('should throw when defined with a non-fresh type', function() {
      throwsWithMessage(function () {
        var ANum = t.declare();
        ANum.define(t.Number);
      }, '[tcomb] Invalid argument type undefined supplied to define(type) (expected a fresh, unnamed type)');
    });

    it('should play well with identity', function () {
      var Tuple = t.declare('Tuple');
      var Result = t.list(Tuple);
      assert.equal(Tuple.meta && Tuple.meta.identity, false);
      assert.equal(Result.meta && Result.meta.identity, false);
      Tuple.define(t.tuple([t.String]));
      assert.equal(Tuple.meta && Tuple.meta.identity, false);
      assert.equal(Result.meta && Result.meta.identity, false);

      Tuple = t.declare('Tuple');
      assert.equal(Tuple.meta && Tuple.meta.identity, false);
      assert.equal(Result.meta && Result.meta.identity, false);
      Result = t.list(Tuple);
      Tuple.define(t.struct({}));
      assert.equal(Tuple.meta && Tuple.meta.identity, false);
      assert.equal(Result.meta && Result.meta.identity, false);
    });

  });

  describe('constructor', function () {

    it('should be idempotent', function () {
      var p1 = A({
        b: {
          a: {
            b: null
          }
        }
      });
      var p2 = A(p1);
      assert.deepEqual(p2 === p1, true);
    });

    it('should accept only valid values', function () {
      throwsWithMessage(function () {
        A({b: 12});
      }, '[tcomb] Invalid value 12 supplied to {b: ?{a: ?A}}/b: ?{a: ?A} (expected an object)');
      throwsWithMessage(function () {
        A({b: B({ a: 13 }) });
      }, '[tcomb] Invalid value 13 supplied to {a: ?A}/a: ?A (expected an object)');
    });

    it('should throw if the type was not defined', function () {
      throwsWithMessage(function () {
        var D = t.declare('D');
        D({a: A({}) });
      }, '[tcomb] Type declared but not defined, don\'t forget to call .define on every declared type');
    });

  });

  describe('#is(x)', function () {

    it('should return true when x is an instance of the type', function () {
      var a = new A({
        b: {
          a: {
            b: null
          }
        }
      });
      assert.ok(A.is(a));
    });

  });

});