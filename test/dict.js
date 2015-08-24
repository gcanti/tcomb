/* globals describe, it */
var assert = require('assert');
var t = require('../index');
var throwsWithMessage = require('./util').throwsWithMessage;

var Point = t.struct({
  x: t.Number,
  y: t.Number
});

describe('t.dict(domain, codomain, [name])', function () {

  describe('combinator', function () {

    it('should throw if used with wrong arguments', function () {

      throwsWithMessage(function () {
        t.dict();
      }, '[tcomb] Invalid argument domain undefined supplied to dict(domain, codomain, [name]) combinator (expected a type)');

      throwsWithMessage(function () {
        t.dict(t.String);
      }, '[tcomb] Invalid argument codomain undefined supplied to dict(domain, codomain, [name]) combinator (expected a type)');

      throwsWithMessage(function () {
        t.dict(t.String, Point, 1);
      }, '[tcomb] Invalid argument name 1 supplied to dict(domain, codomain, [name]) combinator (expected a string)');

    });

  });

  describe('constructor', function () {

    var S = t.struct({}, 'S');
    var Domain = t.subtype(t.String, function (x) {
      return x !== 'forbidden';
    }, 'Domain');
    var T = t.dict(Domain, S, 'T');

    it('should coerce values', function () {
      var t = T({a: {}});
      assert.ok(S.is(t.a));
    });

    it('should accept only valid values', function () {

      throwsWithMessage(function () {
        T(1);
      }, '[tcomb] Invalid value 1 supplied to T');

      throwsWithMessage(function () {
        T({a: 1});
      }, '[tcomb] Invalid value 1 supplied to T/a: S (expected an object)');

      throwsWithMessage(function () {
        T({forbidden: {}});
      }, '[tcomb] Invalid value "forbidden" supplied to T/Domain');

    });

    it('should be idempotent', function () {
      var T = t.dict(t.String, t.String);
      var p1 = T({a: 'a', b: 'b'});
      var p2 = T(p1);
      assert.deepEqual(Object.isFrozen(p1), true);
      assert.deepEqual(Object.isFrozen(p2), true);
      assert.deepEqual(p2 === p1, true);
    });

  });

  describe('#is(x)', function () {

    var T = t.dict(t.String, Point);
    var p1 = new Point({x: 0, y: 0});
    var p2 = new Point({x: 1, y: 1});

    it('should return true when x is a list', function () {
      assert.ok(T.is({a: p1, b: p2}));
    });

    it('should not depend on `this`', function () {
      assert.ok([{a: p1, b: p2}].every(T.is));
    });

  });

  describe('#update()', function () {

    var Type = t.dict(t.String, t.String);
    var instance = Type({p1: 'a', p2: 'b'});

    it('should return a new instance', function () {
      var newInstance = Type.update(instance, {p2: {$set: 'c'}});
      assert.ok(Type.is(newInstance));
      assert.deepEqual(instance.p2, 'b');
      assert.deepEqual(newInstance.p2, 'c');
    });

  });

});
