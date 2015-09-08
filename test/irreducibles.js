/* globals describe, it */
var assert = require('assert');
var t = require('../index');
var throwsWithMessage = require('./util').throwsWithMessage;
var noop = function () {};
var ko = function (x, message) { assert.strictEqual(x, false, message); };

describe('t.Any', function () {

  var T = t.Any;

  describe('constructor', function () {

    it('should behave like identity', function () {
      var value = {};
      assert.strictEqual(t.Any(value), value);
    });

    it('should throw if used with new', function () {
      throwsWithMessage(function () {
        var x = new T(); // eslint-disable-line
      }, '[tcomb] Cannot use the new operator to instantiate the type Any');
    });

  });

  describe('#is(x)', function () {

    it('should always return true', function () {
      assert.ok(T.is(null));
      assert.ok(T.is(undefined));
      assert.ok(T.is(0));
      assert.ok(T.is(true));
      assert.ok(T.is(''));
      assert.ok(T.is([]));
      assert.ok(T.is({}));
      assert.ok(T.is(noop));
      assert.ok(T.is(/a/));
      assert.ok(T.is(new RegExp('a')));
      assert.ok(T.is(new Error()));
    });

  });

});

//
// irreducible types
//

describe('irreducibles types', function () {

  [
    {T: t.Nil, x: null},
    {T: t.String, x: 'a'},
    {T: t.Number, x: 1},
    {T: t.Boolean, x: true},
    {T: t.Array, x: []},
    {T: t.Object, x: {}},
    {T: t.Function, x: noop},
    {T: t.Error, x: new Error()},
    {T: t.RegExp, x: /a/},
    {T: t.Date, x: new Date()}
  ].forEach(function (o) {

    var T = o.T;
    var x = o.x;

    it('should accept only valid values', function () {
      assert.deepEqual(T(x), x);
    });

    it('should throw if used with new', function () {
      throwsWithMessage(function () {
        var x = new T(); // eslint-disable-line
      }, '[tcomb] Cannot use the new operator to instantiate the type ' + t.getTypeName(T));
    });

  });

});

describe('t.Nil', function () {

  describe('#is(x)', function () {

    it('should return true when x is null or undefined', function () {
      assert.ok(t.Nil.is(null));
      assert.ok(t.Nil.is(undefined));
    });

    it('should return false when x is neither null nor undefined', function () {
      ko(t.Nil.is(0));
      ko(t.Nil.is(true));
      ko(t.Nil.is(''));
      ko(t.Nil.is([]));
      ko(t.Nil.is({}));
      ko(t.Nil.is(noop));
      ko(t.Nil.is(new Error()));
      ko(t.Nil.is(new Date()));
      ko(t.Nil.is(/a/));
      ko(t.Nil.is(new RegExp('a')));
    });

  });

});

describe('t.Boolean', function () {

  describe('#is(x)', function () {

    it('should return true when x is true or false', function () {
      assert.ok(t.Boolean.is(true));
      assert.ok(t.Boolean.is(false));
    });

    it('should return false when x is neither true nor false', function () {
      ko(t.Boolean.is(null));
      ko(t.Boolean.is(undefined));
      ko(t.Boolean.is(0));
      ko(t.Boolean.is(''));
      ko(t.Boolean.is([]));
      ko(t.Boolean.is({}));
      ko(t.Boolean.is(noop));
      ko(t.Boolean.is(/a/));
      ko(t.Boolean.is(new RegExp('a')));
      ko(t.Boolean.is(new Error()));
      ko(t.Boolean.is(new Date()));
    });

  });

});

describe('t.Number', function () {

  describe('#is(x)', function () {

    it('should return true when x is a number', function () {
      assert.ok(t.Number.is(0));
      assert.ok(t.Number.is(1));
      ko(t.Number.is(new Number(1))); // eslint-disable-line
    });

    it('should return false when x is not a number', function () {
      ko(t.Number.is(NaN));
      ko(t.Number.is(Infinity));
      ko(t.Number.is(-Infinity));
      ko(t.Number.is(null));
      ko(t.Number.is(undefined));
      ko(t.Number.is(true));
      ko(t.Number.is(''));
      ko(t.Number.is([]));
      ko(t.Number.is({}));
      ko(t.Number.is(noop));
      ko(t.Number.is(/a/));
      ko(t.Number.is(new RegExp('a')));
      ko(t.Number.is(new Error()));
      ko(t.Number.is(new Date()));
    });

  });

});

describe('t.String', function () {

  describe('#is(x)', function () {

    it('should return true when x is a string', function () {
      assert.ok(t.String.is(''));
      assert.ok(t.String.is('a'));
      /* jshint ignore:start */
      ko(t.String.is(new String('a'))); // eslint-disable-line
      /* jshint ignore:end */
    });

    it('should return false when x is not a string', function () {
      ko(t.String.is(NaN));
      ko(t.String.is(Infinity));
      ko(t.String.is(-Infinity));
      ko(t.String.is(null));
      ko(t.String.is(undefined));
      ko(t.String.is(true));
      ko(t.String.is(1));
      ko(t.String.is([]));
      ko(t.String.is({}));
      ko(t.String.is(noop));
      ko(t.String.is(/a/));
      ko(t.String.is(new RegExp('a')));
      ko(t.String.is(new Error()));
      ko(t.String.is(new Date()));
    });

  });

});

describe('t.Array', function () {

  describe('#is(x)', function () {

    it('should return true when x is an array', function () {
      assert.ok(t.Array.is([]));
    });

    it('should return false when x is not an array', function () {
      ko(t.Array.is(NaN));
      ko(t.Array.is(Infinity));
      ko(t.Array.is(-Infinity));
      ko(t.Array.is(null));
      ko(t.Array.is(undefined));
      ko(t.Array.is(true));
      ko(t.Array.is(1));
      ko(t.Array.is('a'));
      ko(t.Array.is({}));
      ko(t.Array.is(noop));
      ko(t.Array.is(/a/));
      ko(t.Array.is(new RegExp('a')));
      ko(t.Array.is(new Error()));
      ko(t.Array.is(new Date()));
    });

  });

});

describe('t.Object', function () {

  describe('#is(x)', function () {

    it('should return true when x is an object', function () {
      function A() {}
      assert.ok(t.Object.is({}));
      assert.ok(t.Object.is(new A()));
    });

    it('should return false when x is not an object', function () {
      ko(t.Object.is(null));
      ko(t.Object.is(undefined));
      ko(t.Object.is(0));
      ko(t.Object.is(''));
      ko(t.Object.is([]));
      ko(t.Object.is(noop));
    });

  });

});

describe('t.Function', function () {

  describe('#is(x)', function () {

    it('should return true when x is a function', function () {
      assert.ok(t.Function.is(noop));
      assert.ok(t.Function.is(new Function())); // eslint-disable-line
    });

    it('should return false when x is not a function', function () {
      ko(t.Function.is(null));
      ko(t.Function.is(undefined));
      ko(t.Function.is(0));
      ko(t.Function.is(''));
      ko(t.Function.is([]));
      ko(t.Function.is({}));
      ko(t.Function.is(new String('1'))); // eslint-disable-line
      ko(t.Function.is(new Number(1))); // eslint-disable-line
      ko(t.Function.is(new Boolean())); // eslint-disable-line
      ko(t.Function.is(/a/));
      ko(t.Function.is(new RegExp('a')));
      ko(t.Function.is(new Error()));
      ko(t.Function.is(new Date()));
    });

  });

});

describe('t.Error', function () {

  describe('#is(x)', function () {

    it('should return true when x is an error', function () {
      assert.ok(t.Error.is(new Error()));
    });

    it('should return false when x is not an error', function () {
      ko(t.Error.is(null));
      ko(t.Error.is(undefined));
      ko(t.Error.is(0));
      ko(t.Error.is(''));
      ko(t.Error.is([]));
      ko(t.Error.is(new String('1'))); // eslint-disable-line
      ko(t.Error.is(new Number(1))); // eslint-disable-line
      ko(t.Error.is(new Boolean())); // eslint-disable-line
      ko(t.Error.is(/a/));
      ko(t.Error.is(new RegExp('a')));
      ko(t.Error.is(new Date()));
    });

  });

});

describe('t.RegExp', function () {

  describe('#is(x)', function () {

    it('should return true when x is a regexp', function () {
      assert.ok(t.RegExp.is(/a/));
      assert.ok(t.RegExp.is(new RegExp('a')));
    });

    it('should return false when x is not a regexp', function () {
      ko(t.RegExp.is(null));
      ko(t.RegExp.is(undefined));
      ko(t.RegExp.is(0));
      ko(t.RegExp.is(''));
      ko(t.RegExp.is([]));
      ko(t.RegExp.is(new String('1'))); // eslint-disable-line
      ko(t.RegExp.is(new Number(1))); // eslint-disable-line
      ko(t.RegExp.is(new Boolean())); // eslint-disable-line
      ko(t.RegExp.is(new Error()));
      ko(t.RegExp.is(new Date()));
    });

  });

});

describe('t.Date', function () {

  describe('#is(x)', function () {

    it('should return true when x is a Dat', function () {
      assert.ok(t.Date.is(new Date()));
    });

    it('should return false when x is not a Dat', function () {
      ko(t.Date.is(null));
      ko(t.Date.is(undefined));
      ko(t.Date.is(0));
      ko(t.Date.is(''));
      ko(t.Date.is([]));
      ko(t.Date.is(new String('1'))); // eslint-disable-line
      ko(t.Date.is(new Number(1))); // eslint-disable-line
      ko(t.Date.is(new Boolean())); // eslint-disable-line
      ko(t.Date.is(new Error()));
      ko(t.Date.is(/a/));
      ko(t.Date.is(new RegExp('a')));
    });

  });

});
