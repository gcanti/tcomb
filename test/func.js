/* globals describe, it */
var assert = require('assert');
var t = require('../index');
var util = require('./util');

describe('t.func(domain, codomain, [name])', function () {

  it('should handle an empty domain', function () {
    var T = t.func([], t.String);
    assert.deepEqual(T.meta.domain.length, 0);
    var getGreeting = T.of(function () { return 'Hi'; });
    assert.deepEqual(getGreeting(), 'Hi');
  });

  it('should handle a domain with single type', function () {
    var T = t.func(t.Number, t.Number);
    assert.deepEqual(T.meta.domain.length, 1);
    assert.ok(T.meta.domain[0] === t.Number);
  });

  it('should automatically instrument a function', function () {
    var T = t.func(t.Number, t.Number);
    var f = function () { return 'hi'; };
    assert.ok(T.is(T(f)));
  });

  describe('of', function () {

    it('should check the arguments', function () {

      var T = t.func([t.Number, t.Number], t.Number);
      var sum = T.of(function (a, b) {
        return a + b;
      });
      assert.deepEqual(sum(1, 2), 3);

      util.throwsWithMessage(function () {
        sum(1, 2, 3);
      }, '[tcomb] Invalid value [\n  1,\n  2,\n  3\n] supplied to arguments of function (Number, Number) => Number (expected an array of length 2)');

      util.throwsWithMessage(function () {
        sum('a', 2);
      }, '[tcomb] Invalid value "a" supplied to arguments of function (Number, Number) => Number/0: Number');

    });

    it('should handle optional arguments', function () {
      function Class(a) {
        this.a = a;
      }
      assert.equal(t.func.getOptionalArgumentsIndex([t.Number, t.Number]), 2);
      assert.equal(t.func.getOptionalArgumentsIndex([t.Number, t.maybe(t.Number)]), 1);
      assert.equal(t.func.getOptionalArgumentsIndex([t.maybe(t.Number)]), 0);
      assert.equal(t.func.getOptionalArgumentsIndex([t.Number, t.maybe(t.Number), t.Number]), 3);
      assert.equal(t.func.getOptionalArgumentsIndex([]), 0);
      assert.equal(t.func.getOptionalArgumentsIndex([Class]), 1);
      assert.equal(t.func.getOptionalArgumentsIndex([Class, t.maybe(t.Number)]), 1);

      var T = t.func([t.Number, t.maybe(t.Number)], t.Number);
      var sum = T.of(function (a, b) {
        if (t.Nil.is(b)) {
          b = 2;
        }
        return a + b;
      });
      assert.equal(sum(1), 3);
      assert.equal(sum(1, 2), 3);
      util.throwsWithMessage(function () {
        sum(1, 'a');
      }, '[tcomb] Invalid value "a" supplied to arguments of function (Number, ?Number) => Number/1: ?Number');
    });

    it('should check the return value', function () {

      var T = t.func([t.Number, t.Number], t.Number);
      var sum = T.of(function () {
        return 'a';
      });

      util.throwsWithMessage(function () {
        sum(1, 2);
      }, '[tcomb] Invalid value "a" supplied to Number');

    });

    it('should preserve `this`', function () {
      var o = {name: 'giulio'};
      o.getTypeName = t.func([], t.String).of(function () {
        return this.name;
      });
      assert.deepEqual(o.getTypeName(), 'giulio');
    });

    it('should handle function types', function () {
      var A = t.func([t.String], t.String);
      var B = t.func([t.String, A], t.String);

      var f = A.of(function (s) {
        return s + '!';
      });
      var g = B.of(function (str, strAction) {
        return strAction(str);
      });

      assert.deepEqual(g('hello', f), 'hello!');
    });

    it('should be idempotent', function () {
      var f = function (s) { return s; };
      var g = t.func([t.String], t.String).of(f);
      var h = t.func([t.String], t.String).of(g);
      assert.ok(h === g);
    });

  });

  describe('currying', function () {

    it('should throw if no arguments are passed in', function () {
      var Type = t.func([t.Number, t.Number, t.Number], t.Number);
      var sum = Type(function (a, b, c) {
        return a + b + c;
      }, true);
      util.throwsWithMessage(function () {
        sum();
      }, '[tcomb] Invalid arguments.length = 0 for curried function (Number, Number, Number) => Number');
    });

    it('should curry functions', function () {
      var Type = t.func([t.Number, t.Number, t.Number], t.Number);
      var sum = Type(function (a, b, c) {
        return a + b + c;
      }, true);
      assert.deepEqual(sum(1, 2, 3), 6);
      assert.deepEqual(sum(1, 2)(3), 6);
      assert.deepEqual(sum(1)(2, 3), 6);
      assert.deepEqual(sum(1)(2)(3), 6);

      // important: the curried function must be of the correct type
      var CurriedType = t.func([t.Number, t.Number], t.Number);
      var sum1 = sum(1);
      assert.deepEqual(sum1(2, 3), 6);
      assert.deepEqual(sum1(2)(3), 6);
      assert.ok(CurriedType.is(sum1));
    });

    it('should throw if partial arguments are wrong', function () {

      var T = t.func([t.Number, t.Number], t.Number);
      var sum = T.of(function (a, b) {
        return a + b;
      }, true);

      util.throwsWithMessage(function () {
        sum('a');
      }, '[tcomb] Invalid value "a" supplied to arguments of function (Number, Number) => Number/0: Number');

      util.throwsWithMessage(function () {
        var sum1 = sum(1);
        sum1('a');
      }, '[tcomb] Invalid value "a" supplied to arguments of function (Number) => Number/0: Number');

    });

  });

  describe('uncurried', function () {

    it('should not curry functions', function () {
      var Type = t.func([t.Number, t.Number, t.Number], t.Number);
      var sum = Type.of(function (a, b, c) {
        return a + b + c;
      });
      assert.deepEqual(sum(1, 2, 3), 6);
      util.throwsWithMessage(function () {
        sum(1, 2);
      }, '[tcomb] Invalid value [\n  1,\n  2\n] supplied to arguments of function (Number, Number, Number) => Number (expected an array of length 3)');
    });

  });

});
