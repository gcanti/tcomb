/* globals describe, it */
'use strict';
var assert = require('assert');
var t = require('../index');

//
// setup
//

var ok = function (x, message) { assert.strictEqual(x, true, message); };
var ko = function (x, message) { assert.strictEqual(x, false, message); };
var eq = assert.deepEqual;
var throwsWithMessage = function (f, message) {
  assert.throws(f, function (err) {
    ok(err instanceof Error);
    assert.strictEqual(err.message, message);
    return true;
  });
};
var doesNotThrow = assert.doesNotThrow;

var noop = function () {};
var Point = t.struct({
  x: t.Number,
  y: t.Number
});

describe('t.update(instance, spec)', function () {

  var update = t.update;
  var Tuple = t.tuple([t.String, t.Number]);
  var List = t.list(t.Number);
  var Dict = t.dict(t.String, t.Number);

  it('should throw if spec is invalid', function () {
    throwsWithMessage(function () {
      t.update({});
    }, '[tcomb] Invalid argument spec = undefined supplied to function update(instance, spec): expected an object containing commands');
  });

  it('should handle $set command', function () {
    var instance = 1;
    var actual = update(instance, {$set: 2});
    eq(actual, 2);
    instance = [1, 2, 3];
    actual = update(instance, {1: {'$set': 4}});
    eq(instance, [1, 2, 3]);
    eq(actual, [1, 4, 3]);
  });

  it('$set and null value, fix #65', function () {
    var NullStruct = t.struct({a: t.Number, b: t.maybe(t.Number)});
    var instance = new NullStruct({a: 1});
    var updated = update(instance, {b: {$set: 2}});
    eq(instance, {a: 1, b: null});
    eq(updated, {a: 1, b: 2});
  });

  it('should handle $apply command', function () {
    var $apply = function (n) { return n + 1; };
    var instance = 1;
    var actual = update(instance, {$apply: $apply});
    eq(actual, 2);
    instance = [1, 2, 3];
    actual = update(instance, {1: {'$apply': $apply}});
    eq(instance, [1, 2, 3]);
    eq(actual, [1, 3, 3]);
  });

  it('should handle $unshift command', function () {
    var actual = update([1, 2, 3], {'$unshift': [4]});
    eq(actual, [4, 1, 2, 3]);
    actual = update([1, 2, 3], {'$unshift': [4, 5]});
    eq(actual, [4, 5, 1, 2, 3]);
    actual = update([1, 2, 3], {'$unshift': [[4, 5]]});
    eq(actual, [[4, 5], 1, 2, 3]);
  });

  it('should handle $push command', function () {
    var actual = update([1, 2, 3], {'$push': [4]});
    eq(actual, [1, 2, 3, 4]);
    actual = update([1, 2, 3], {'$push': [4, 5]});
    eq(actual, [1, 2, 3, 4, 5]);
    actual = update([1, 2, 3], {'$push': [[4, 5]]});
    eq(actual, [1, 2, 3, [4, 5]]);
  });

  it('should handle $splice command', function () {
    var instance = [1, 2, {a: [12, 17, 15]}];
    var actual = update(instance, {2: {a: {$splice: [[1, 1, 13, 14]]}}});
    eq(instance, [1, 2, {a: [12, 17, 15]}]);
    eq(actual, [1, 2, {a: [12, 13, 14, 15]}]);
  });

  it('should handle $remove command', function () {
    var instance = {a: 1, b: 2};
    var actual = update(instance, {'$remove': ['a']});
    eq(instance, {a: 1, b: 2});
    eq(actual, {b: 2});
  });

  it('should handle $swap command', function () {
    var instance = [1, 2, 3, 4];
    var actual = update(instance, {'$swap': {from: 1, to: 2}});
    eq(instance, [1, 2, 3, 4]);
    eq(actual, [1, 3, 2, 4]);
  });

  describe('structs', function () {

    var instance = new Point({x: 0, y: 1});

    it('should handle $set command', function () {
      var updated = update(instance, {x: {$set: 1}});
      eq(instance, {x: 0, y: 1});
      eq(updated, {x: 1, y: 1});
    });

    it('should handle $apply command', function () {
      var updated = update(instance, {x: {$apply: function (x) {
        return x + 2;
      }}});
      eq(instance, {x: 0, y: 1});
      eq(updated, {x: 2, y: 1});
    });

    it('should handle $merge command', function () {
      var updated = update(instance, {'$merge': {x: 2, y: 2}});
      eq(instance, {x: 0, y: 1});
      eq(updated, {x: 2, y: 2});
      var Nested = t.struct({
        a: t.Number,
        b: t.struct({
          c: t.Number,
          d: t.Number,
          e: t.Number
        })
      });
      instance = new Nested({a: 1, b: {c: 2, d: 3, e: 4}});
      updated = update(instance, {b: {'$merge': {c: 5, e: 6}}});
      eq(instance, {a: 1, b: {c: 2, d: 3, e: 4}});
      eq(updated, {a: 1, b: {c: 5, d: 3, e: 6}});
    });

  });

  describe('tuples', function () {

    var instance = Tuple(['a', 1]);

    it('should handle $set command', function () {
      var updated = update(instance, {0: {$set: 'b'}});
      eq(updated, ['b', 1]);
    });

  });

  describe('lists', function () {

    var instance = List([1, 2, 3, 4]);

    it('should handle $set command', function () {
      var updated = update(instance, {2: {$set: 5}});
      eq(updated, [1, 2, 5, 4]);
    });

    it('should handle $splice command', function () {
      var updated = update(instance, {$splice: [[1, 2, 5, 6]]});
      eq(updated, [1, 5, 6, 4]);
    });

    it('should handle $concat command', function () {
      var updated = update(instance, {$push: [5]});
      eq(updated, [1, 2, 3, 4, 5]);
      updated = update(instance, {$push: [5, 6]});
      eq(updated, [1, 2, 3, 4, 5, 6]);
    });

    it('should handle $prepend command', function () {
      var updated = update(instance, {$unshift: [5]});
      eq(updated, [5, 1, 2, 3, 4]);
      updated = update(instance, {$unshift: [5, 6]});
      eq(updated, [5, 6, 1, 2, 3, 4]);
    });

    it('should handle $swap command', function () {
      var updated = update(instance, {$swap: {from: 1, to: 2}});
      eq(updated, [1, 3, 2, 4]);
    });

  });

  describe('dicts', function () {

    var instance = Dict({a: 1, b: 2});

    it('should handle $set command', function () {
      var updated = update(instance, {a: {$set: 2}});
      eq(updated, {a: 2, b: 2});
      updated = update(instance, {c: {$set: 3}});
      eq(updated, {a: 1, b: 2, c: 3});
    });

    it('should handle $remove command', function () {
      var updated = update(instance, {$remove: ['a']});
      eq(updated, {b: 2});
    });

  });

  describe('memory saving', function () {

    it('should reuse members that are not updated', function () {
      var Struct = t.struct({
        a: t.Number,
        b: t.String,
        c: t.tuple([t.Number, t.Number]),
      });
      var List = t.list(Struct);
      var instance = List([{
        a: 1,
        b: 'one',
        c: [1000, 1000000]
      }, {
        a: 2,
        b: 'two',
        c: [2000, 2000000]
      }]);

      var updated = update(instance, {
        1: {
          a: {$set: 119}
        }
      });

      assert.strictEqual(updated[0], instance[0]);
      assert.notStrictEqual(updated[1], instance[1]);
      assert.strictEqual(updated[1].c, instance[1].c);
    });
  });

  describe('all together now', function () {

    it('should handle mixed commands', function () {
      var Struct = t.struct({
        a: t.Number,
        b: Tuple,
        c: List,
        d: Dict
      });
      var instance = new Struct({
        a: 1,
        b: ['a', 1],
        c: [1, 2, 3, 4],
        d: {a: 1, b: 2}
      });
      var updated = update(instance, {
        a: {$set: 1},
        b: {0: {$set: 'b'}},
        c: {2: {$set: 5}},
        d: {$remove: ['a']}
      });
      eq(updated, {
        a: 1,
        b: ['b', 1],
        c: [1, 2, 5, 4],
        d: {b: 2}
      });
    });

    it('should handle nested structures', function () {
      var Struct = t.struct({
        a: t.struct({
          b: t.tuple([
            t.String,
            t.list(t.Number)
          ])
        })
      });
      var instance = new Struct({
        a: {
          b: ['a', [1, 2, 3]]
        }
      });
      var updated = update(instance, {
        a: {b: {1: {2: {$set: 4}}}}
      });
      eq(updated, {
        a: {
          b: ['a', [1, 2, 4]]
        }
      });
    });

  });

});

//
// assert
//

describe('t.assert(guard, [message])', function () {

  var assert = t.assert;

  it('should nor throw when guard is true', function () {
    assert(true);
  });

  it('should throw a default message', function () {
    throwsWithMessage(function () {
      assert(1 === 2); // eslint-disable-line
    }, '[tcomb] Assert failed');
  });

  it('should throw the specified message', function () {
    throwsWithMessage(function () {
      assert(1 === 2, 'my message'); // eslint-disable-line
    }, '[tcomb] my message');
  });

  it('should handle custom fail behaviour', function () {
    var fail = t.fail;
    t.fail = function (message) {
      try {
        throw new Error(message);
      } catch (e) {
        eq(e.message, 'report error');
      }
    };
    doesNotThrow(function () {
      assert(1 === 2, 'report error'); // eslint-disable-line
    });
    t.fail = fail;
  });

});

//
// utils
//

describe('t.mixin(x, y, [overwrite])', function () {

  it('should mix two objects', function () {
    var o1 = {a: 1};
    var o2 = {b: 2};
    var o3 = t.mixin(o1, o2);
    ok(o3 === o1);
    eq(o3.a, 1);
    eq(o3.b, 2);
  });

  it('should throw if a property already exists', function () {
    throwsWithMessage(function () {
      var o1 = {a: 1};
      var o2 = {a: 2, b: 2};
      t.mixin(o1, o2);
    }, '[tcomb] Invalid call to mixin(): cannot overwrite property "a" of target object');
  });

  it('should not throw if a property already exists but overwrite = true', function () {
    var o1 = {a: 1};
    var o2 = {a: 2, b: 2};
    var o3 = t.mixin(o1, o2, true);
    eq(o3.a, 2);
    eq(o3.b, 2);
  });

  it('should not mix prototype properties', function () {
    function F() {}
    F.prototype.method = noop;
    var source = new F();
    var target = {};
    t.mixin(target, source);
    eq(target.method, undefined);
  });

});

describe('t.getTypeName(type)', function () {

  var UnnamedStruct = t.struct({});
  var NamedStruct = t.struct({}, 'NamedStruct');
  var UnnamedUnion = t.union([t.String, t.Number]);
  var NamedUnion = t.union([t.String, t.Number], 'NamedUnion');
  var UnnamedMaybe = t.maybe(t.String);
  var NamedMaybe = t.maybe(t.String, 'NamedMaybe');
  var UnnamedEnums = t.enums({a: 'A', b: 'B'});
  var NamedEnums = t.enums({}, 'NamedEnums');
  var UnnamedTuple = t.tuple([t.String, t.Number]);
  var NamedTuple = t.tuple([t.String, t.Number], 'NamedTuple');
  var UnnamedSubtype = t.subtype(t.String, function notEmpty(x) { return x !== ''; });
  var NamedSubtype = t.subtype(t.String, function (x) { return x !== ''; }, 'NamedSubtype');
  var UnnamedList = t.list(t.String);
  var NamedList = t.list(t.String, 'NamedList');
  var UnnamedDict = t.dict(t.String, t.String);
  var NamedDict = t.dict(t.String, t.String, 'NamedDict');
  var UnnamedFunc = t.func(t.String, t.String);
  var NamedFunc = t.func(t.String, t.String, 'NamedFunc');
  var UnnamedIntersection = t.intersection([t.String, t.Number]);
  var NamedIntersection = t.intersection([t.String, t.Number], 'NamedIntersection');

  it('should return the name of a function', function () {
    eq(t.getTypeName(function myname(){}), 'myname');
  });

  it('should return the name of a named type', function () {
    eq(t.getTypeName(NamedStruct), 'NamedStruct');
    eq(t.getTypeName(NamedUnion), 'NamedUnion');
    eq(t.getTypeName(NamedMaybe), 'NamedMaybe');
    eq(t.getTypeName(NamedEnums), 'NamedEnums');
    eq(t.getTypeName(NamedTuple), 'NamedTuple');
    eq(t.getTypeName(NamedSubtype), 'NamedSubtype');
    eq(t.getTypeName(NamedList), 'NamedList');
    eq(t.getTypeName(NamedDict), 'NamedDict');
    eq(t.getTypeName(NamedFunc), 'NamedFunc');
    eq(t.getTypeName(NamedIntersection), 'NamedIntersection');
  });

  it('should return a meaningful name of a unnamed type', function () {
    eq(t.getTypeName(UnnamedStruct), '{}');
    eq(t.getTypeName(UnnamedUnion), 'String | Number');
    eq(t.getTypeName(UnnamedMaybe), '?String');
    eq(t.getTypeName(UnnamedEnums), '"a" | "b"');
    eq(t.getTypeName(UnnamedTuple), '[String, Number]');
    eq(t.getTypeName(UnnamedSubtype), '{String | notEmpty}');
    eq(t.getTypeName(UnnamedList), 'Array<String>');
    eq(t.getTypeName(UnnamedDict), '{[key: String]: String}');
    eq(t.getTypeName(UnnamedFunc), '(String) => String');
    eq(t.getTypeName(UnnamedIntersection), 'String & Number');
  });

});

//
// Any
//

describe('t.Any', function () {

  var T = t.Any;

  describe('constructor', function () {

    it('should behave like identity', function () {
      eq(t.Any('a'), 'a');
    });

    it('should throw if used with new', function () {
      throwsWithMessage(function () {
        var x = new T(); // eslint-disable-line
      }, '[tcomb] Cannot use the new operator to instantiate a type Any');
    });

  });

  describe('#is(x)', function () {

    it('should always return true', function () {
      ok(T.is(null));
      ok(T.is(undefined));
      ok(T.is(0));
      ok(T.is(true));
      ok(T.is(''));
      ok(T.is([]));
      ok(T.is({}));
      ok(T.is(noop));
      ok(T.is(/a/));
      ok(T.is(new RegExp('a')));
      ok(T.is(new Error()));
    });

  });

});

//
// irreducible types
//

describe('irreducibles types', function () {

  it('should throw if used with an invalid name argument', function () {
    throwsWithMessage(function () {
      t.irreducible(null, function () { return true; });
    }, '[tcomb] Invalid argument name = null supplied to irreducible(name, predicate)');
  });

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
      eq(T(x), x);
    });

    it('should throw if used with new', function () {
      throwsWithMessage(function () {
        var x = new T(); // eslint-disable-line
      }, '[tcomb] Cannot use the new operator to instantiate a type ' + t.getTypeName(T));
    });

  });

});

describe('t.Nil', function () {

  describe('#is(x)', function () {

    it('should return true when x is null or undefined', function () {
      ok(t.Nil.is(null));
      ok(t.Nil.is(undefined));
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
      ok(t.Boolean.is(true));
      ok(t.Boolean.is(false));
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
      ok(t.Number.is(0));
      ok(t.Number.is(1));
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
      ok(t.String.is(''));
      ok(t.String.is('a'));
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
      ok(t.Array.is([]));
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
      ok(t.Object.is({}));
      ok(t.Object.is(new A()));
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
      ok(t.Function.is(noop));
      ok(t.Function.is(new Function())); // eslint-disable-line
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
      ok(t.Error.is(new Error()));
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
      ok(t.RegExp.is(/a/));
      ok(t.RegExp.is(new RegExp('a')));
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
      ok(t.Date.is(new Date()));
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

//
// struct
//

describe('t.struct(props, [name])', function () {

  describe('combinator', function () {

    it('should throw if used with wrong arguments', function () {

      throwsWithMessage(function () {
        t.struct();
      }, '[tcomb] Invalid argument props = undefined supplied to struct(props, name): expected a dictionary of tcomb types');

      throwsWithMessage(function () {
        t.struct({a: null});
      }, '[tcomb] Invalid argument props = {\n  "a": null\n} supplied to struct(props, name): expected a dictionary of tcomb types');

      throwsWithMessage(function () {
        t.struct({}, 1);
      }, '[tcomb] Invalid argument name = 1 supplied to struct(props, name): expected a string');

    });

  });

  describe('constructor', function () {

    it('should be idempotent', function () {
      var T = Point;
      var p1 = T({x: 0, y: 0});
      var p2 = T(p1);
      eq(Object.isFrozen(p1), true);
      eq(Object.isFrozen(p2), true);
      eq(p2 === p1, true);
    });

    it('should accept only valid values', function () {
      throwsWithMessage(function () {
        Point(1);
      }, '[tcomb] Invalid argument value = 1 supplied to struct {x: Number, y: Number}: expected an object');
    });

  });

  describe('#is(x)', function () {

    it('should return true when x is an instance of the struct', function () {
      var p = new Point({ x: 1, y: 2 });
      ok(Point.is(p));
    });

  });

  describe('#update()', function () {

    var Type = t.struct({name: t.String});
    var instance = new Type({name: 'Giulio'});

    it('should return a new instance', function () {
      var newInstance = Type.update(instance, {name: {$set: 'Canti'}});
      ok(Type.is(newInstance));
      eq(instance.name, 'Giulio');
      eq(newInstance.name, 'Canti');
    });

  });

  describe('#extend(props, [name])', function () {

    it('should extend an existing struct', function () {
      var Point = t.struct({
        x: t.Number,
        y: t.Number
      }, 'Point');
      var Point3D = Point.extend({z: t.Number}, 'Point3D');
      eq(t.getTypeName(Point3D), 'Point3D');
      eq(Point3D.meta.props.x, t.Number);
      eq(Point3D.meta.props.y, t.Number);
      eq(Point3D.meta.props.z, t.Number);
    });

    it('should handle an array as argument', function () {
      var Type = t.struct({a: t.String}, 'Type');
      var Mixin = [{b: t.Number, c: t.Boolean}];
      var NewType = Type.extend(Mixin, 'NewType');
      eq(t.getTypeName(NewType), 'NewType');
      eq(NewType.meta.props.a, t.String);
      eq(NewType.meta.props.b, t.Number);
      eq(NewType.meta.props.c, t.Boolean);
    });

    it('should handle a struct (or list of structs) as argument', function () {
      var A = t.struct({a: t.String}, 'A');
      var B = t.struct({b: t.String}, 'B');
      var C = t.struct({c: t.String}, 'C');
      var MixinD = {d: t.String};
      var E = A.extend([B, C, MixinD]);
      eq(E.meta.props, {
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
      eq(c.volume(), 8);
    });

  });

});

//
// enums
//

describe('t.enums(map, [name])', function () {

  describe('combinator', function () {

    it('should throw if used with wrong arguments', function () {

      throwsWithMessage(function () {
        t.enums();
      }, '[tcomb] Invalid argument map = undefined supplied to enums(map, name): expected a hash of strings / numbers');

      throwsWithMessage(function () {
        t.enums({}, 1);
      }, '[tcomb] Invalid argument name = 1 supplied to enums(map, name): expected a string');

    });

  });

  describe('constructor', function () {

    var T = t.enums({a: 0}, 'T');

    it('should throw if used with new', function () {
      throwsWithMessage(function () {
        var x = new T('a'); // eslint-disable-line
      }, '[tcomb] Cannot use the new operator to instantiate a type T');
    });

    it('should accept only valid values', function () {
      eq(T('a'), 'a');
      throwsWithMessage(function () {
        T('b');
      }, '[tcomb] Invalid argument value = "b" supplied to enums T: expected one of [\n  "a"\n]');
    });

  });

  describe('#is(x)', function () {

    var Direction = t.enums({
      North: 0,
      East: 1,
      South: 2,
      West: 3,
      1: 'North-East',
      2.5: 'South-East'
    });

    it('should return true when x is an instance of the enum', function () {
      ok(Direction.is('North'));
      ok(Direction.is(1));
      ok(Direction.is('1'));
      ok(Direction.is(2.5));
    });

    it('should return false when x is not an instance of the enum', function () {
      ko(Direction.is('North-East'));
      ko(Direction.is(2));
    });

  });

  describe('#of(keys)', function () {

    it('should return an enum', function () {
      var Size = t.enums.of(['large', 'small', 1, 10.9]);
      ok(Size.meta.map.large === 'large');
      ok(Size.meta.map.small === 'small');
      ok(Size.meta.map['1'] === 1);
      ok(Size.meta.map[10.9] === 10.9);
    });

    it('should handle a string', function () {
      var Size = t.enums.of('large small 10');
      ok(Size.meta.map.large === 'large');
      ok(Size.meta.map.small === 'small');
      ok(Size.meta.map['10'] === '10');
      ok(Size.meta.map[10] === '10');
    });

  });

});

//
// union
//

describe('t.union(types, [name])', function () {

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

  describe('combinator', function () {

    it('should throw if used with wrong arguments', function () {

      throwsWithMessage(function () {
        t.union();
      }, '[tcomb] Invalid argument types = undefined supplied to union(types, name): expected an array of at least 2 types');

      throwsWithMessage(function () {
        t.union([]);
      }, '[tcomb] Invalid argument types = [] supplied to union(types, name): expected an array of at least 2 types');

      throwsWithMessage(function () {
        t.union([1]);
      }, '[tcomb] Invalid argument types = [\n  1\n] supplied to union(types, name): expected an array of at least 2 types');

      throwsWithMessage(function () {
        t.union([Circle, Point], 1);
      }, '[tcomb] Invalid argument name = 1 supplied to union(types, name): expected a string');

    });

  });

  describe('constructor', function () {

    it('should throw when dispatch() is not implemented', function () {
      throwsWithMessage(function () {
        var T = t.union([t.String, t.Number], 'T');
        T.dispatch = null;
        T(1);
      }, '[tcomb] Unimplemented dispatch() function for union T');
    });

    it('should have a default dispatch() implementation', function () {
      var T = t.union([t.String, t.Number], 'T');
      eq(T(1), 1);
    });

    it('should throw when dispatch() does not return a type', function () {
      throwsWithMessage(function () {
        var T = t.union([t.String, t.Number], 'T');
        T(true);
      }, '[tcomb] The dispatch() function of union T returns no type');
    });

    it('should build instances when dispatch() is implemented', function () {
      var circle = Shape({center: {x: 0, y: 0}, radius: 10});
      ok(Circle.is(circle));
    });

    it('should throw if used with new and union types are not instantiables with new', function () {
      throwsWithMessage(function () {
        var T = t.union([t.String, t.Number], 'T');
        T.dispatch = function () { return t.String; };
        var x = new T('a'); // eslint-disable-line
      }, '[tcomb] Cannot use the new operator to instantiate a type T');
    });

    it('should not throw if used with new and union types are instantiables with new', function () {
      doesNotThrow(function () {
        Shape({center: {x: 0, y: 0}, radius: 10});
      });
    });

    it('should be idempotent', function () {
      var p1 = Shape({center: {x: 0, y: 0}, radius: 10});
      var p2 = Shape(p1);
      eq(Object.isFrozen(p1), true);
      eq(Object.isFrozen(p2), true);
      eq(p2 === p1, true);
    });

  });

  describe('#is(x)', function () {

    it('should return true when x is an instance of the union', function () {
      var p = new Circle({center: { x: 0, y: 0 }, radius: 10});
      ok(Shape.is(p));
    });

  });

});

//
// intersection
//

describe('t.intersection(types, [name])', function () {

  var Min = t.subtype(t.String, function (s) { return s.length > 2; }, 'Min');
  var Max = t.subtype(t.String, function (s) { return s.length < 5; }, 'Max');
  var MinMax = t.intersection([Min, Max], 'MinMax');

  describe('combinator', function () {

    it('should throw if used with wrong arguments', function () {

      throwsWithMessage(function () {
        t.intersection();
      }, '[tcomb] Invalid argument types = undefined supplied to intersection(types, name): expected an array of at least 2 types');

      throwsWithMessage(function () {
        t.intersection([]);
      }, '[tcomb] Invalid argument types = [] supplied to intersection(types, name): expected an array of at least 2 types');

      throwsWithMessage(function () {
        t.intersection([1]);
      }, '[tcomb] Invalid argument types = [\n  1\n] supplied to intersection(types, name): expected an array of at least 2 types');

      throwsWithMessage(function () {
        t.intersection([Min, Max], 1);
      }, '[tcomb] Invalid argument name = 1 supplied to intersection(types, name): expected a string');

    });

  });

  describe('#is(x)', function () {

    it('should return true when x is an instance of the intersection', function () {
      ok(MinMax.is('123'), '3 chars');
      ko(MinMax.is('12'), '2 chars');
      ko(MinMax.is('12345'), '5 chars');
    });

  });

});

//
// maybe
//

describe('t.maybe(type, [name])', function () {

  describe('combinator', function () {

    it('should throw if used with wrong arguments', function () {

      throwsWithMessage(function () {
        t.maybe();
      }, '[tcomb] Invalid argument type = undefined supplied to maybe(type, name): expected a type');

      throwsWithMessage(function () {
        t.maybe(Point, 1);
      }, '[tcomb] Invalid argument name = 1 supplied to maybe(type, name): expected a string');

    });

    it('should be idempotent', function () {
      var MaybeStr = t.maybe(t.String);
      ok(t.maybe(MaybeStr) === MaybeStr);
    });

    it('should be noop with Any', function () {
      ok(t.maybe(t.Any) === t.Any);
    });

    it('should be noop with Nil', function () {
      ok(t.maybe(t.Nil) === t.Nil);
    });

  });

  describe('constructor', function () {

    it('should throw if used with new', function () {
      throwsWithMessage(function () {
        var T = t.maybe(t.String, 'T');
        var x = new T(); // eslint-disable-line
      }, '[tcomb] Cannot use the new operator to instantiate a type T');
    });

    it('should coerce values', function () {
      var T = t.maybe(Point);
      eq(T(null), null);
      eq(T(undefined), null);
      ok(Point.is(T({x: 0, y: 0})));
    });

    it('should be idempotent', function () {
      var T = t.maybe(Point);
      var p1 = T({x: 0, y: 0});
      var p2 = T(p1);
      eq(Object.isFrozen(p1), true);
      eq(Object.isFrozen(p2), true);
      eq(p2 === p1, true);
    });

  });

  describe('#is(x)', function () {

    it('should return true when x is an instance of the maybe', function () {
      var Radio = t.maybe(t.String);
      ok(Radio.is('a'));
      ok(Radio.is(null));
      ok(Radio.is(undefined));
    });

  });

});

//
// tuple
//

describe('t.tuple(types, [name])', function () {

  var Area = t.tuple([t.Number, t.Number], 'Area');

  describe('combinator', function () {

    it('should throw if used with wrong arguments', function () {

      throwsWithMessage(function () {
        t.tuple();
      }, '[tcomb] Invalid argument types = undefined supplied to tuple(types, name): expected an array of types');

      throwsWithMessage(function () {
        t.tuple([1]);
      }, '[tcomb] Invalid argument types = [\n  1\n] supplied to tuple(types, name): expected an array of types');

      throwsWithMessage(function () {
        t.tuple([Point, Point], 1);
      }, '[tcomb] Invalid argument name = 1 supplied to tuple(types, name): expected a string');

    });

  });

  describe('constructor', function () {

    var S = t.struct({}, 'S');
    var T = t.tuple([S, S], 'T');

    it('should coerce values', function () {
      var t = T([{}, {}]);
      ok(S.is(t[0]));
      ok(S.is(t[1]));
    });

    it('should accept only valid values', function () {

      throwsWithMessage(function () {
        T(1);
      }, '[tcomb] Invalid argument value = 1 supplied to tuple T: expected an array of length 2');

      throwsWithMessage(function () {
        T([1, 1]);
      }, '[tcomb] Invalid argument value = 1 supplied to struct S: expected an object');

    });

    it('should be idempotent', function () {
      var T = t.tuple([t.String, t.Number]);
      var p1 = T(['a', 1]);
      var p2 = T(p1);
      eq(Object.isFrozen(p1), true);
      eq(Object.isFrozen(p2), true);
      eq(p2 === p1, true);
    });

  });

  describe('#is(x)', function () {

    it('should return true when x is an instance of the tuple', function () {
      ok(Area.is([1, 2]));
    });

    it('should return false when x is not an instance of the tuple', function () {
      ko(Area.is([1]));
      ko(Area.is([1, 2, 3]));
      ko(Area.is([1, 'a']));
    });

    it('should not depend on `this`', function () {
      ok([[1, 2]].every(Area.is));
    });

  });

  describe('#update()', function () {

    var Type = t.tuple([t.String, t.Number]);
    var instance = Type(['a', 1]);

    it('should return a new instance', function () {
      var newInstance = Type.update(instance, {0: {$set: 'b'}});
      assert(Type.is(newInstance));
      assert(instance[0] === 'a');
      assert(newInstance[0] === 'b');
    });

  });

});

//
// list
//

describe('t.list(type, [name])', function () {

  describe('combinator', function () {

    it('should throw if used with wrong arguments', function () {

      throwsWithMessage(function () {
        t.list();
      }, '[tcomb] Invalid argument type = undefined supplied to list(type, name): expected a type');

      throwsWithMessage(function () {
        t.list(Point, 1);
      }, '[tcomb] Invalid argument name = 1 supplied to list(type, name): expected a string');

    });

  });

  describe('constructor', function () {

    var S = t.struct({}, 'S');
    var T = t.list(S, 'T');

    it('should coerce values', function () {
      var t = T([{}]);
      ok(S.is(t[0]));
    });

    it('should accept only valid values', function () {

      throwsWithMessage(function () {
        T(1);
      }, '[tcomb] Invalid argument value = 1 supplied to list T');

      throwsWithMessage(function () {
        T([1]);
      }, '[tcomb] Invalid argument value = 1 supplied to struct S: expected an object');

    });

    it('should be idempotent', function () {
      var T = t.list(t.Number);
      var p1 = T([1, 2]);
      var p2 = T(p1);
      eq(Object.isFrozen(p1), true);
      eq(Object.isFrozen(p2), true);
      eq(p2 === p1, true);
    });

  });

  describe('#is(x)', function () {

    var Path = t.list(Point);
    var p1 = new Point({x: 0, y: 0});
    var p2 = new Point({x: 1, y: 1});

    it('should return true when x is a list', function () {
      ok(Path.is([p1, p2]));
    });

    it('should not depend on `this`', function () {
      ok([[p1, p2]].every(Path.is));
    });

  });

  describe('#update()', function () {

    var Type = t.list(t.String);
    var instance = Type(['a', 'b']);

    it('should return a new instance', function () {
      var newInstance = Type.update(instance, {'$push': ['c']});
      assert(Type.is(newInstance));
      assert(instance.length === 2);
      assert(newInstance.length === 3);
    });

  });

});

//
// subtype
//

describe('t.subtype(type, predicate, [name])', function () {

  var True = function () { return true; };

  describe('combinator', function () {

    it('should throw if used with wrong arguments', function () {

      throwsWithMessage(function () {
        t.subtype();
      }, '[tcomb] Invalid argument type = undefined supplied to subtype(type, predicate, name): expected a type');

      throwsWithMessage(function () {
        t.subtype(Point, null);
      }, '[tcomb] Invalid argument predicate supplied to subtype(type, predicate, name): expected a function');

      throwsWithMessage(function () {
        t.subtype(Point, True, 1);
      }, '[tcomb] Invalid argument name = 1 supplied to subtype(type, predicate, name): expected a string');

    });

  });

  describe('constructor', function () {

    it('should throw if used with new and a type that is not instantiable with new', function () {
      throwsWithMessage(function () {
        var T = t.subtype(t.String, function () { return true; }, 'T');
        var x = new T(); // eslint-disable-line
      }, '[tcomb] Cannot use the new operator to instantiate a type T');
    });

    it('should coerce values', function () {
      var T = t.subtype(Point, function () { return true; });
      var p = T({x: 0, y: 0});
      ok(Point.is(p));
    });

    it('should accept only valid values', function () {
      var predicate = function (p) { return p.x > 0; };
      var T = t.subtype(Point, predicate, 'T');
      throwsWithMessage(function () {
        T({x: 0, y: 0});
      }, '[tcomb] Invalid argument value = {\n  "x": 0,\n  "y": 0\n} supplied to subtype T');
    });

  });

  describe('#is(x)', function () {

    var Positive = t.subtype(t.Number, function (n) {
      return n >= 0;
    });

    it('should return true when x is a subtype', function () {
      ok(Positive.is(1));
    });

    it('should return false when x is not a subtype', function () {
      ko(Positive.is(-1));
    });

  });

  describe('#update()', function () {

    var Type = t.subtype(t.String, function (s) { return s.length > 2; });
    var instance = Type('abc');

    it('should return a new instance', function () {
      var newInstance = Type.update(instance, {'$set': 'bca'});
      assert(Type.is(newInstance));
      eq(newInstance, 'bca');
    });

  });

});

//
// dict
//

describe('t.dict(domain, codomain, [name])', function () {

  describe('combinator', function () {

    it('should throw if used with wrong arguments', function () {

      throwsWithMessage(function () {
        t.dict();
      }, '[tcomb] Invalid argument domain = undefined supplied to dict(domain, codomain, name): expected a type');

      throwsWithMessage(function () {
        t.dict(t.String);
      }, '[tcomb] Invalid argument codomain = undefined supplied to dict(domain, codomain, name): expected a type');

      throwsWithMessage(function () {
        t.dict(t.String, Point, 1);
      }, '[tcomb] Invalid argument name = 1 supplied to dict(domain, codomain, name): expected a string');

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
      ok(S.is(t.a));
    });

    it('should accept only valid values', function () {

      throwsWithMessage(function () {
        T(1);
      }, '[tcomb] Invalid argument value = 1 supplied to dict T');

      throwsWithMessage(function () {
        T({a: 1});
      }, '[tcomb] Invalid argument value = 1 supplied to struct S: expected an object');

      throwsWithMessage(function () {
        T({forbidden: {}});
      }, '[tcomb] Invalid argument value = "forbidden" supplied to subtype Domain');

    });

    it('should be idempotent', function () {
      var T = t.dict(t.String, t.String);
      var p1 = T({a: 'a', b: 'b'});
      var p2 = T(p1);
      eq(Object.isFrozen(p1), true);
      eq(Object.isFrozen(p2), true);
      eq(p2 === p1, true);
    });

  });

  describe('#is(x)', function () {

    var T = t.dict(t.String, Point);
    var p1 = new Point({x: 0, y: 0});
    var p2 = new Point({x: 1, y: 1});

    it('should return true when x is a list', function () {
      ok(T.is({a: p1, b: p2}));
    });

    it('should not depend on `this`', function () {
      ok([{a: p1, b: p2}].every(T.is));
    });

  });

  describe('#update()', function () {

    var Type = t.dict(t.String, t.String);
    var instance = Type({p1: 'a', p2: 'b'});

    it('should return a new instance', function () {
      var newInstance = Type.update(instance, {p2: {$set: 'c'}});
      ok(Type.is(newInstance));
      eq(instance.p2, 'b');
      eq(newInstance.p2, 'c');
    });

  });

});

//
// func
//

describe('t.func(domain, codomain, [name])', function () {

  it('should handle a no types', function () {
    var T = t.func([], t.String);
    eq(T.meta.domain.length, 0);
    var getGreeting = T.of(function () { return 'Hi'; });
    eq(getGreeting(), 'Hi');
  });

  it('should handle a single type', function () {
    var T = t.func(t.Number, t.Number);
    eq(T.meta.domain.length, 1);
    ok(T.meta.domain[0] === t.Number);
  });

  it('should automatically instrument a function', function () {
    var T = t.func(t.Number, t.Number);
    var f = function () { return 'hi'; };
    ok(T.is(T(f)));
  });

  describe('of', function () {

    it('should check the arguments', function () {

      var T = t.func([t.Number, t.Number], t.Number);
      var sum = T.of(function (a, b) {
        return a + b;
      });
      eq(sum(1, 2), 3);

      throwsWithMessage(function () {
        sum(1, 2, 3);
      }, '[tcomb] Invalid argument value = [\n  1,\n  2,\n  3\n] supplied to tuple [Number, Number]: expected an array of length 2');

      throwsWithMessage(function () {
        sum('a', 2);
      }, '[tcomb] Invalid argument value = "a" supplied to irreducible type Number');

    });

    it('should check the return value', function () {

      var T = t.func([t.Number, t.Number], t.Number);
      var sum = T.of(function () {
        return 'a';
      });

      throwsWithMessage(function () {
        sum(1, 2);
      }, '[tcomb] Invalid argument value = "a" supplied to irreducible type Number');

    });

    it('should preserve `this`', function () {
      var o = {name: 'giulio'};
      o.getTypeName = t.func([], t.String).of(function () {
        return this.name;
      });
      eq(o.getTypeName(), 'giulio');
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

      eq(g('hello', f), 'hello!');
    });

    it('should be idempotent', function () {
      var f = function (s) { return s; };
      var g = t.func([t.String], t.String).of(f);
      var h = t.func([t.String], t.String).of(g);
      ok(h === g);
    });

  });

  describe('currying', function () {

    it('should curry functions', function () {
      var Type = t.func([t.Number, t.Number, t.Number], t.Number);
      var sum = Type.of(function (a, b, c) {
        return a + b + c;
      }, true);
      eq(sum(1, 2, 3), 6);
      eq(sum(1, 2)(3), 6);
      eq(sum(1)(2, 3), 6);
      eq(sum(1)(2)(3), 6);

      // important: the curried function must be of the correct type
      var CurriedType = t.func([t.Number, t.Number], t.Number);
      var sum1 = sum(1);
      eq(sum1(2, 3), 6);
      eq(sum1(2)(3), 6);
      ok(CurriedType.is(sum1));
    });

    it('should throw if partial arguments are wrong', function () {

      var T = t.func([t.Number, t.Number], t.Number);
      var sum = T.of(function (a, b) {
        return a + b;
      }, true);

      throwsWithMessage(function () {
        sum('a');
      }, '[tcomb] Invalid argument value = "a" supplied to irreducible type Number');

      throwsWithMessage(function () {
        var sum1 = sum(1);
        sum1('a');
      }, '[tcomb] Invalid argument value = "a" supplied to irreducible type Number');

    });

  });

  describe('uncurried', function () {

    it('should not curry functions', function () {
      var Type = t.func([t.Number, t.Number, t.Number], t.Number);
      var sum = Type.of(function (a, b, c) {
        return a + b + c;
      });
      eq(sum(1, 2, 3), 6);
      throwsWithMessage(function () {
        sum(1, 2);
      }, '[tcomb] Invalid argument value = [\n  1,\n  2\n] supplied to tuple [Number, Number, Number]: expected an array of length 3');
    });

  });

});

describe('ES6 classes', function () {

  function Class(a) {
    this.a = a;
  }

  var c = new Class('a');

  it('should be handled by subtype', function () {
    var T = t.subtype(Class, function isA(x) {
      return x.a === 'a';
    });
    eq(T.is(c), true);
    throwsWithMessage(function () {
      T(new Class('b'));
    }, '[tcomb] Invalid argument value = {\n  "a": "b"\n} supplied to subtype {Class | isA}');
  });

  it('should be handled by struct', function () {
    var T = t.struct({
      c: Class
    });
    eq(T.is(new T({c: c})), true);
    throwsWithMessage(function () {
      T({c: 1});
    }, '[tcomb] The value 1 is not an instance of Class');
  });

  it('should be handled by maybe', function () {
    var T = t.maybe(Class);
    eq(T.is(null), true);
    eq(T.is(c), true);
    throwsWithMessage(function () {
      T(1);
    }, '[tcomb] The value 1 is not an instance of Class');
  });

  it('should be handled by tuple', function () {
    var T = t.tuple([Class]);
    eq(T.is([c]), true);
    throwsWithMessage(function () {
      T([1]);
    }, '[tcomb] The value 1 is not an instance of Class');
  });

  it('should be handled by list', function () {
    var T = t.list(Class);
    eq(T.is([c]), true);
    throwsWithMessage(function () {
      T([1]);
    }, '[tcomb] The value 1 is not an instance of Class');
  });

  it('should be handled by dict', function () {
    var T = t.dict(t.String, Class);
    eq(T.is({a: c}), true);
    throwsWithMessage(function () {
      T({a: 1});
    }, '[tcomb] The value 1 is not an instance of Class');
  });

  it('should be handled by union', function () {
    var T = t.union([t.String, Class]);
    eq(T.is(c), true);
    throwsWithMessage(function () {
      T(1);
    }, '[tcomb] The dispatch() function of union String | Class returns no type');
  });

  it('should be handled by func', function () {
    var T = t.func(Class, t.String);
    var f = T.of(function (c) {
      return c.constructor.name;
    });
    eq(f(c), 'Class');
    throwsWithMessage(function () {
      f(1);
    }, '[tcomb] The value 1 is not an instance of Class');
  });

});

describe('match', function () {

  it('should match on type constructors', function () {
    eq(t.match(1,
      t.String, function () { return 'a string'; },
      t.Number, function (n) { return 2 * n; }
    ), 2);
  });

  it('should handle an optional guard', function () {
    eq(t.match(1,
      t.String, function () { return 'a string'; },
      t.Number, function () { return false; }, function (n) { return 2 * n; },
      t.Number, function (n) { return 3 * n; }
    ), 3);
  });

  it('should throw if no match is found', function () {
    throwsWithMessage(function () {
      t.match(true,
        t.String, function () { return 'a string'; },
        t.Number, function (n) { return 2 * n; }
      );
    }, '[tcomb] Match error');
  });

  it('should throw if cases are misplaced', function () {
    throwsWithMessage(function () {
      t.match(true,
        t.String, function () { return 'a string'; },
        t.Number
      );
    }, '[tcomb] Invalid block in clause #2');
  });

});
