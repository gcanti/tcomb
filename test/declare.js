/* globals describe, it */
var assert = require('assert');
var t = require('../index');
var throwsWithMessage = require('./util').throwsWithMessage;

var A = t.declare("A");

var B = t.struct({
  a: t.maybe(A)
});

A.define(t.struct({
  b: t.maybe(B)
}));

var aValue = A({
  b: B({
    a: A({
      b: null
    })
  })
});

describe('t.declare([name])', function () {

  describe('combinator', function () {

    it('should throw if used with wrong arguments', function () {

      assert.throws(function () {
        t.declare(t.Num);
      }, function(err) {
        assert.strictEqual(err instanceof Error, true);
        assert.ok(/\[tcomb\] Invalid argument name function (.|\n)* supplied to declare\(\[name\]\) \(expected a string\)/m.test(err.message));
        return true;
      });

      throwsWithMessage(function () {
        var D = t.declare("D");
        D.define("not a type");
      }, '[tcomb] Invalid type "not a type" supplied to define(type) (expected a type)');

    });

    it('should throw if define-d multiple times', function () {
      throwsWithMessage(function () {
        var D = t.declare("D");
        D.define(t.Num);
        D.define(t.Num);
      }, '[tcomb] Declare.define(type) can only be invoked once');
    });

  });

  describe('constructor', function () {

    it('should be idempotent', function () {
      var p1 = A(aValue);
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
        var D = t.declare("D");
        D({a: A({}) });
      }, '[tcomb] Type declared but not defined, don\'t forget to call .define on every declared type');
    });

  });

  describe('#is(x)', function () {

    it('should return true when x is an instance of the struct', function () {
      var a = new A(aValue);
      assert.ok(A.is(a));
    });

  });

});
