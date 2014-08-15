"use strict";
var assert = require('assert');
var t = require('../build/tcomb');

var Nil = t.Nil;
var Bool = t.Bool;
var Num = t.Num;
var Str = t.Str;
var Arr = t.Arr;
var Obj = t.Obj;
var Func = t.Func;
var Err = t.Err;
var struct = t.struct;
var enums = t.enums;
var union = t.union;
var tuple = t.tuple;
var maybe = t.maybe;
var subtype = t.subtype;
var list = t.list;
var func = t.func;
var getName = t.getName;

//
// setup
//

var ok = function (x) { assert.strictEqual(true, x); };
var ko = function (x) { assert.strictEqual(false, x); };
var throws = assert.throws;
var doesNotThrow = assert.doesNotThrow;

// defined here because it's used in a bunch of tests
var Point = struct({
    x: Num,
    y: Num
});

//
// assert
//

describe('assert', function () {
    it('should nor throw when guard is true', function() {
        assert(true);
    });
    it('should throw a default message', function() {
        throws(function () {
            t.assert(1 === 2);
        }, function (err) {
            if ( (err instanceof Error) && err.message === 'assert(): failed' ) {
              return true;
            }
        });
    });
    it('should throw the specified message', function() {
        throws(function () {
            t.assert(1 === 2, 'my message');
        }, function (err) {
            if ( (err instanceof Error) && err.message === 'my message' ) {
              return true;
            }
        });
    });
    it('should format the specified message', function() {
        throws(function () {
            t.assert(1 === 2, '%s !== %s', 1, 2);
        }, function (err) {
            if ( (err instanceof Error) && err.message === '1 !== 2' ) {
              return true;
            }
        });
    });
    it('should handle custom onFail behaviour', function() {
        var onFail = t.options.onFail;
        t.options.onFail = function (message) {
            try {
                throw new Error(message);
            } catch (e) {
                ok(e.message === 'report error');
            }
        };
        doesNotThrow(function () {
            t.assert(1 === 2, 'report error');
        });
        t.options.onFail = onFail;
    });
});

//
// utils
//

describe('print', function () {
    it('should format the message', function() {
        ok(t.print('%s', 'a') === 'a');
        ok(t.print('%s', 2) === '2');
        ok(t.print('%o', {a: 1}) === '{"a":1}');
        ok(t.print('%s === %s', 1, 1) === '1 === 1');
    });
});

describe('getName', function () {

    var UnnamedStruct = struct({});
    var NamedStruct = struct({}, 'NamedStruct');
    var UnnamedUnion = union([Str, Num]);
    var NamedUnion = union([Str, Num], 'NamedUnion');
    var UnnamedMaybe = maybe(Str);
    var NamedMaybe = maybe(Str, 'NamedMaybe');
    var UnnamedEnums = enums({});
    var NamedEnums = enums({}, 'NamedEnums');
    var UnnamedTuple = tuple([Str, Num]);
    var NamedTuple = tuple([Str, Num], 'NamedTuple');
    var UnnamedSubtype = subtype(Str, function (x) { return x !== ''; });
    var NamedSubtype = subtype(Str, function (x) { return x !== ''; }, 'NamedSubtype');
    var UnnamedList = list(Str);
    var NamedList = list(Str, 'NamedList');

    it('should return the name of a named type', function() {
        ok(getName(NamedStruct) === 'NamedStruct');
        ok(getName(NamedUnion) === 'NamedUnion');
        ok(getName(NamedMaybe) === 'NamedMaybe');
        ok(getName(NamedEnums) === 'NamedEnums');
        ok(getName(NamedTuple) === 'NamedTuple');
        ok(getName(NamedSubtype) === 'NamedSubtype');
        ok(getName(NamedList) === 'NamedList');
    });
    it('should return a meaningful name of a unnamed type', function() {
        ok(getName(UnnamedStruct) === 'struct()');
        ok(getName(UnnamedUnion) === 'union(Str, Num)');
        ok(getName(UnnamedMaybe) === 'maybe(Str)');
        ok(getName(UnnamedEnums) === 'enums()');
        ok(getName(UnnamedTuple) === 'tuple(Str, Num)');
        ok(getName(UnnamedSubtype) === 'subtype(Str)');
        ok(getName(UnnamedList) === 'list(Str)');
    });
});

//
// primitives types
//

describe('Nil', function () {
    describe('#is(x)', function () {
        it('should return true when x is null or undefined', function() {
            ok(Nil.is(null));
            ok(Nil.is(undefined));
        });
        it('should return false when x is neither null nor undefined', function() {
            ko(Nil.is(0));
            ko(Nil.is(true));
            ko(Nil.is(''));
            ko(Nil.is([]));
            ko(Nil.is({}));
            ko(Nil.is(function () {}));
            ko(Nil.is(/a/));
            ko(Nil.is(new RegExp('a')));
            ko(Nil.is(new Error()));
        });
    });
});

describe('Bool', function () {
    describe('#is(x)', function () {
        it('should return true when x is true or false', function() {
            ok(Bool.is(true));
            ok(Bool.is(false));
        });
        it('should return false when x is neither true nor false', function() {
            ko(Bool.is(null));
            ko(Bool.is(undefined));
            ko(Bool.is(0));
            ko(Bool.is(''));
            ko(Bool.is([]));
            ko(Bool.is({}));
            ko(Bool.is(function () {}));
            ko(Bool.is(/a/));
            ko(Bool.is(new RegExp('a')));
            ko(Bool.is(new Error()));
        });
    });
});

describe('Num', function () {
    describe('#is(x)', function () {
        it('should return true when x is a number', function() {
            ok(Num.is(0));
            ok(Num.is(1));
            ko(Num.is(new Number(1)));
        });
        it('should return false when x is not a number', function() {
            ko(Num.is(NaN));
            ko(Num.is(Infinity));
            ko(Num.is(-Infinity));
            ko(Num.is(null));
            ko(Num.is(undefined));
            ko(Num.is(true));
            ko(Num.is(''));
            ko(Num.is([]));
            ko(Num.is({}));
            ko(Num.is(function () {}));
            ko(Num.is(/a/));
            ko(Num.is(new RegExp('a')));
            ko(Num.is(new Error()));
        });
    });
});

describe('Str', function () {
    describe('#is(x)', function () {
        it('should return true when x is a string', function() {
            ok(Str.is(''));
            ok(Str.is('a'));
            ko(Str.is(new String('a')));
        });
        it('should return false when x is not a string', function() {
            ko(Str.is(NaN));
            ko(Str.is(Infinity));
            ko(Str.is(-Infinity));
            ko(Str.is(null));
            ko(Str.is(undefined));
            ko(Str.is(true));
            ko(Str.is(1));
            ko(Str.is([]));
            ko(Str.is({}));
            ko(Str.is(function () {}));
            ko(Str.is(/a/));
            ko(Str.is(new RegExp('a')));
            ko(Str.is(new Error()));
        });
    });
});

describe('Arr', function () {
    describe('#is(x)', function () {
        it('should return true when x is an array', function() {
            ok(Arr.is([]));
        });
        it('should return false when x is not an array', function() {
            ko(Arr.is(NaN));
            ko(Arr.is(Infinity));
            ko(Arr.is(-Infinity));
            ko(Arr.is(null));
            ko(Arr.is(undefined));
            ko(Arr.is(true));
            ko(Arr.is(1));
            ko(Arr.is('a'));
            ko(Arr.is({}));
            ko(Arr.is(function () {}));
            ko(Arr.is(/a/));
            ko(Arr.is(new RegExp('a')));
            ko(Arr.is(new Error()));
        });
    });
});

describe('Obj', function () {
    describe('#is(x)', function () {
        it('should return true when x is an object literal', function() {
            ok(Obj.is({}));
        });
        it('should return false when x is not an object literal', function() {
            ko(Obj.is(null));
            ko(Obj.is(undefined));
            ko(Obj.is(0));
            ko(Obj.is(''));
            ko(Obj.is([]));
            ko(Obj.is(function () {}));
            ko(Obj.is(new String('1')));
            ko(Obj.is(new Number(1)));
            ko(Obj.is(new Boolean()));
            ko(Obj.is(/a/));
            ko(Obj.is(new RegExp('a')));
            ko(Obj.is(new Error()));
        });
    });
});

describe('Func', function () {
    describe('#is(x)', function () {
        it('should return true when x is a function', function() {
            ok(Func.is(function () {}));
            ok(Func.is(new Function()));
        });
        it('should return false when x is not a function', function() {
            ko(Func.is(null));
            ko(Func.is(undefined));
            ko(Func.is(0));
            ko(Func.is(''));
            ko(Func.is([]));
            ko(Func.is(new String('1')));
            ko(Func.is(new Number(1)));
            ko(Func.is(new Boolean()));
            ko(Func.is(/a/));
            ko(Func.is(new RegExp('a')));
            ko(Func.is(new Error()));
        });
    });
});

describe('Err', function () {
    describe('#is(x)', function () {
        it('should return true when x is an error', function() {
            ok(Err.is(new Error()));
        });
        it('should return false when x is not an error', function() {
            ko(Err.is(null));
            ko(Err.is(undefined));
            ko(Err.is(0));
            ko(Err.is(''));
            ko(Err.is([]));
            ko(Err.is(new String('1')));
            ko(Err.is(new Number(1)));
            ko(Err.is(new Boolean()));
            ko(Err.is(/a/));
            ko(Err.is(new RegExp('a')));
        });
    });
});

//
// struct
//

describe('struct', function () {
    describe('#is(x)', function () {
        it('should return true when x is an instance of the struct', function() {
            var p = new Point({ x: 1, y: 2 });
            ok(Point.is(p));
        });
    });
    describe('#update()', function () {
        var Type = struct({name: Str});
        var instance = new Type({name: 'Giulio'});
        it('should throw if options.update is missing', function() {
            throws(function () {
                var newInstance = Type.update(instance, {name: 'Canti'});
            }, function (err) {
                if ( (err instanceof Error) && err.message === 'options.update is missing' ) {
                  return true;
                }
            });
        });
        it('should return a new instance if options.update is defined', function() {
            t.options.update = function (instance, updates) {
                return updates;
            };
            var newInstance = Type.update(instance, {name: 'Canti'});
            assert(Type.is(newInstance));
            assert(instance.name === 'Giulio');
            assert(newInstance.name === 'Canti');
            t.options.update = null;
        });
    });
});

//
// enums
//

describe('enums', function () {

    var Direction = enums({
        North: 0, 
        East: 1,
        South: 2, 
        West: 3
    });

    describe('#is(x)', function() {
        it('should return true when x is an instance of the enum', function() {
            ok(Direction.is('North'));
        });
        it("should return false when x is not an instance of the enum", function() {
            ko(Direction.is('North-East'));
        });
    });
    describe('#of(keys)', function() {
        it('should return an enum', function() {
            var Size = enums.of(['large', 'small']);
            ok(Size.meta.map.large === 0);
            ok(Size.meta.map.small === 1);
        });
        it('should handle a string', function() {
            var Size = enums.of('large small');
            ok(Size.meta.map.large === 0);
            ok(Size.meta.map.small === 1);
        });
    });
});

//
// union
//

describe('union', function () {

    var Circle = struct({
        center: Point,
        radius: Num
    });

    var Rectangle = struct({
        a: Point,
        b: Point
    });

    var Shape = union([Circle, Rectangle]);

    describe('#is(x)', function () {
        it('should return true when x is an instance of the union', function() {
            var p = new Circle({center: { x: 0, y: 0 }, radius: 10});
            ok(Shape.is(p));
        });
    });
    describe('Shape constructor', function () {
        it('should throw when dispatch() is not implemented', function() {
            throws(function () {
                new Shape({center: {x: 0, y: 0}, radius: 10});
            });
        });
        it('should build instances when dispatch() is implemented', function() {
            Shape.dispatch = function (values) {
                assert(Obj.is(values));
                return values.hasOwnProperty('center') ?
                    Circle :
                    Rectangle;   
            };
            ok(Circle.is(new Shape({center: {x: 0, y: 0}, radius: 10})));
        });
        it('should have meta.ctor = true if all types are new-ables', function() {
            ok(Shape.meta.ctor);
        });
        it('should have meta.ctor = true if at least one type is not new-able', function() {
            var U = union([Str, Point]);
            ko(U.meta.ctor);
        });
    });
});

//
// maybe
//

describe('maybe', function () {

    var Radio = maybe(Str);

    describe('#is(x)', function () {
        it('should return true when x is an instance of the maybe', function() {
            ok(Radio.is('a'));
            ok(Radio.is(null));
            ok(Radio.is(undefined));
        });
    });
});

//
// tuple
//

describe('tuple', function () {

    var Area = tuple([Num, Num]);

    describe('#is(x)', function () {
        it('should return true when x is an instance of the tuple', function() {
            ok(Area.is([1, 2]));
        });
        it("should return false when x is not an instance of the tuple", function() {
            ko(Area.is([1]));
            ko(Area.is([1, 2, 3]));
            ko(Area.is([1, 'a']));
        });
    });
    describe('#update()', function () {
        var Type = tuple([Str, Num]);
        var instance = new Type(['a', 1]);
        it('should throw if options.update is missing', function() {
            throws(function () {
                var newInstance = Type.update(instance, ['b', 2]);
            }, function (err) {
                if ( (err instanceof Error) && err.message === 'options.update is missing' ) {
                  return true;
                }
            });
        });
        it('should return a new instance if options.update is defined', function() {
            t.options.update = function (instance, updates) {
                return updates;
            };
            var newInstance = Type.update(instance, ['b', 2]);
            assert(Type.is(newInstance));
            assert(instance[0] === 'a');
            assert(newInstance[0] === 'b');
            t.options.update = null;
        });
    });
});

//
// list
//

describe('list', function () {

    var Path = list(Point);
    var p1 = new Point({x: 0, y: 0});
    var p2 = new Point({x: 1, y: 1});

    describe('#is(x)', function () {
        it('should return true when x is a list', function() {
            ok(Path.is([p1, p2]));
        });
    });
    describe('#update()', function () {
        var Type = list(Str);
        var instance = new Type(['a', 'b']);
        it('should throw if options.update is missing', function() {
            throws(function () {
                var newInstance = Type.update(instance, ['b', 2]);
            }, function (err) {
                if ( (err instanceof Error) && err.message === 'options.update is missing' ) {
                  return true;
                }
            });
        });
        it('should return a new instance if options.update is defined', function() {
            t.options.update = function (instance, updates) {
                return updates;
            };
            var newInstance = Type.update(instance, ['a', 'b', 'c']);
            assert(Type.is(newInstance));
            assert(instance.length === 2);
            assert(newInstance.length === 3);
            t.options.update = null;
        });
    });
});

//
// subtype
//

describe('subtype', function () {

    // subtype
    var Positive = subtype(Num, function (n) {
        return n >= 0;
    });

    describe('#is(x)', function () {
        it('should return true when x is a subtype', function() {
            ok(Positive.is(1));
        });
        it('should return false when x is not a subtype', function() {
            ko(Positive.is(-1));
        });
    });
});

//
// func (experimental)
//

describe('func', function () {

    var sum = func(tuple([Num, Num]), function (a, b) {
        return a + b;
    }, Num);

    describe('#is(x)', function () {
        it('should return true when x is the func', function() {
            ok(sum.is(sum));
            ok(sum(1, 2) === 3);
        });
        it("should return false when x is not the func", function() {
            ko(sum.is(function () {}));
        });
        it("should throw with wrong arguments", function() {
            throws(function () {
                sum(1, 'a');
            });
        });
        it("should throw with wrong return", function() {
            var bad = func(tuple([Num, Num]), function (a, b) {
                return a + String(b);
            }, Num);
            throws(function () {
                bad(1, 2);
            });
        });
        it("Return should be optional", function() {
            var bad = func(tuple([Num, Num]), function (a, b) {
                return a + String(b);
            });
            ok(bad(1, 2) === '12');
        });
        it("should handle optional arguments", function() {
            var sum3 = func(tuple([Num, Num, maybe(Num)]), function (a, b, c) {
                return a + b + (c || 0);
            }, Num);
            ok(sum3(1, 2, 3) === 6);
            ok(sum3(1, 2) === 3);
        });
    });
});
