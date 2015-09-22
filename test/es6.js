/* globals describe, it */
var assert = require('assert');
var t = require('../index');
var throwsWithMessage = require('./util').throwsWithMessage;

describe('ES6 classes', function () {

  function Class(a) {
    this.a = a;
  }

  var c = new Class('a');

  it('should be handled by subtype', function () {
    var T = t.subtype(Class, function isA(x) {
      return x.a === 'a';
    });
    assert.deepEqual(T.is(c), true);
    throwsWithMessage(function () {
      T(new Class('b'));
    }, '[tcomb] Invalid value {\n  "a": "b"\n} supplied to {Class | isA}');
  });

  it('should be handled by struct', function () {
    var T = t.struct({
      c: Class
    }, 'T');
    assert.deepEqual(T.is(new T({c: c})), true);
    throwsWithMessage(function () {
      T({c: 1});
    }, '[tcomb] Invalid value 1 supplied to T/c: Class');
  });

  it('should be handled by maybe', function () {
    var T = t.maybe(Class);
    assert.deepEqual(T.is(null), true);
    assert.deepEqual(T.is(c), true);
    throwsWithMessage(function () {
      T(1);
    }, '[tcomb] Invalid value 1 supplied to Class');
  });

  it('should be handled by tuple', function () {
    var T = t.tuple([Class]);
    assert.deepEqual(T.is([c]), true);
    throwsWithMessage(function () {
      T([1]);
    }, '[tcomb] Invalid value 1 supplied to [Class]/0: Class');
  });

  it('should be handled by list', function () {
    var T = t.list(Class);
    assert.deepEqual(T.is([c]), true);
    throwsWithMessage(function () {
      T([1]);
    }, '[tcomb] Invalid value 1 supplied to Array<Class>/0: Class');
  });

  it('should be handled by dict', function () {
    var T = t.dict(t.String, Class);
    assert.deepEqual(T.is({a: c}), true);
    throwsWithMessage(function () {
      T({a: 1});
    }, '[tcomb] Invalid value 1 supplied to {[key: String]: Class}/a: Class');
  });

  it('should be handled by union', function () {
    var T = t.union([t.String, Class]);
    assert.deepEqual(T.is(c), true);
    throwsWithMessage(function () {
      T(1);
    }, '[tcomb] Invalid value 1 supplied to String | Class (no constructor found)');
  });

  it('should be handled by func', function () {
    var T = t.func(Class, t.String);
    var f = T.of(function (c) {
      return c.constructor.name;
    });
    assert.deepEqual(f(c), 'Class');
    throwsWithMessage(function () {
      f(1);
    }, '[tcomb] Invalid value 1 supplied to [Class]/0: Class');
  });

});
