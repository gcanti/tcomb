"use strict";
var assert = require('assert');
var t = require('../build/tcomb');

var errs = t.errs;
var Any = t.Any;
var Nil = t.Nil;
var Bool = t.Bool;
var Num = t.Num;
var Str = t.Str;
var Arr = t.Arr;
var Obj = t.Obj;
var Func = t.Func;
var Err = t.Err;
var Re = t.Re;
var Dat = t.Dat;
var struct = t.struct;
var enums = t.enums;
var union = t.union;
var tuple = t.tuple;
var maybe = t.maybe;
var subtype = t.subtype;
var list = t.list;
var func = t.func;
var getName = t.getName;
var mixin = t.mixin;
var format = t.format;

//
// setup
//

var ok = function (x) { assert.strictEqual(true, x); };
var ko = function (x) { assert.strictEqual(false, x); };
var throws = assert['throws'];
var eq = assert.strictEqual;
var throwsWithMessage = function (f, message) {
    assert['throws'](f, function (err) {
        ok(err instanceof Error);
        eq(err.message, message);
        return true;
    });
};
var doesNotThrow = assert.doesNotThrow;

// used all over the place
var noop = function () {};
var Point = struct({
    x: Num,
    y: Num
});

//
// assert
//

describe('assert', function () {

    var assert = t.assert;
    
    it('should nor throw when guard is true', function () {
        assert(true);
    });
    it('should throw a default message', function () {
        throwsWithMessage(function () {
            assert(1 === 2);
        }, 'assert(): failed');
    });
    it('should throw the specified message', function () {
        throwsWithMessage(function () {
            assert(1 === 2, 'my message');
        }, 'my message');
    });
    it('should format the specified message', function () {
        throwsWithMessage(function () {
            assert(1 === 2, '%s !== %s', 1, 2);
        }, '1 !== 2');
    });
    it('should handle custom onFail behaviour', function () {
        var onFail = t.options.onFail;
        t.options.onFail = function (message) {
            try {
                throw new Error(message);
            } catch (e) {
                eq(e.message, 'report error');
            }
        };
        doesNotThrow(function () {
            assert(1 === 2, 'report error');
        });
        t.options.onFail = onFail;
    });
});

//
// utils
//

describe('format', function () {
    it('should format strings', function () {
        eq(format('%s', 'a'), 'a');
        eq(format('%s', 2), '2');
        eq(format('%s === %s', 1, 1), '1 === 1');
    });
    it('should format JSON', function () {
        eq(format('%j', {a: 1}), '{"a":1}');
    });
    it('should handle undefined formatters', function () {
        eq(format('%o', 'a'), '%o a');
    });
    it('should handle escaping %', function () {
        eq(format('%%s'), '%s');
    });
    it('should not consume an argument with a single %', function () {
        eq(format('%s%', '100'), '100%');
    });
    it('should handle less arguments than placeholders', function () {
        eq(format('%s %s', 'a'), 'a %s');
    });
    it('should handle more arguments than placeholders', function () {
        eq(format('%s', 'a', 'b', 'c'), 'a b c');
    });
    it('should be extensible', function () {
        format.formatters['l'] = function (x) { return x.length; };
        eq(format('%l', ['a', 'b', 'c']), '3');
    });
});

describe('mixin', function () {
    it('should mix two objects', function () {
        var o1 = {a: 1};
        var o2 = {b: 2}
        var o3 = mixin(o1, o2);
        eq(o3.a, 1);
        eq(o3.b, 2);
    });
    it('should throw if a property already exists', function () {
        throws(function () {
            var o1 = {a: 1};
            var o2 = {a: 2, b: 2}
            var o3 = mixin(o1, o2);
        }, function (err) {
            if (err instanceof Error && err.message === 'cannot overwrite property a') {
                return true;
            }
        });
    });
    it('should not throw if a property already exists but overwrite = true', function () {
        var o1 = {a: 1};
        var o2 = {a: 2, b: 2}
        var o3 = mixin(o1, o2, true);
        eq(o3.a, 2);
        eq(o3.b, 2);
    });
    it('should not mix prototype properties', function () {
        function F() {}
        F.prototype.method = noop;
        var source = new F();
        var target = {};
        mixin(target, source);
        eq(target.method, undefined);
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

    it('should return the name of a named type', function () {
        ok(getName(NamedStruct) === 'NamedStruct');
        ok(getName(NamedUnion) === 'NamedUnion');
        ok(getName(NamedMaybe) === 'NamedMaybe');
        ok(getName(NamedEnums) === 'NamedEnums');
        ok(getName(NamedTuple) === 'NamedTuple');
        ok(getName(NamedSubtype) === 'NamedSubtype');
        ok(getName(NamedList) === 'NamedList');
    });
    it('should return a meaningful name of a unnamed type', function () {
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
// Any
//

describe('Any', function () {
    var T = Any;
    describe('constructor', function () {
        it('should behave like identity', function () {
            eq(Any('a'), 'a');
        });
        it('should throw if used with new', function () {
            throwsWithMessage(function () {
                new T();
            }, format(errs.ERR_NEW_OPERATOR_FORBIDDEN, 'Any'));
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
// primitives types
//

describe('primitives types constructors', function () {
    [
        {T: Nil, x: null},
        {T: Str, x: 'a'},
        {T: Num, x: 1},
        {T: Bool, x: true},
        {T: Arr, x: []},
        {T: Obj, x: {}},
        {T: Func, x: noop},
        {T: Err, x: new Error()},
        {T: Re, x: /a/},
        {T: Dat, x: new Date()}
    ].forEach(function (o) {
        var T = o.T;
        var x = o.x;
        it('should accept only valid values', function () {
            eq(T(x), x);
        });
        it('should throw if used with new', function () {
            throwsWithMessage(function () {
                new T();
            }, format(errs.ERR_NEW_OPERATOR_FORBIDDEN, getName(T)));
        });
    });
});

describe('Nil', function () {
    describe('#is(x)', function () {
        it('should return true when x is null or undefined', function () {
            ok(Nil.is(null));
            ok(Nil.is(undefined));
        });
        it('should return false when x is neither null nor undefined', function () {
            ko(Nil.is(0));
            ko(Nil.is(true));
            ko(Nil.is(''));
            ko(Nil.is([]));
            ko(Nil.is({}));
            ko(Nil.is(noop));
            ko(Nil.is(new Error()));
            ko(Nil.is(new Date()));
            ko(Nil.is(/a/));
            ko(Nil.is(new RegExp('a')));
        });
    });
});

describe('Bool', function () {
    describe('#is(x)', function () {
        it('should return true when x is true or false', function () {
            ok(Bool.is(true));
            ok(Bool.is(false));
        });
        it('should return false when x is neither true nor false', function () {
            ko(Bool.is(null));
            ko(Bool.is(undefined));
            ko(Bool.is(0));
            ko(Bool.is(''));
            ko(Bool.is([]));
            ko(Bool.is({}));
            ko(Bool.is(noop));
            ko(Bool.is(/a/));
            ko(Bool.is(new RegExp('a')));
            ko(Bool.is(new Error()));
            ko(Bool.is(new Date()));
        });
    });
});

describe('Num', function () {
    describe('#is(x)', function () {
        it('should return true when x is a number', function () {
            ok(Num.is(0));
            ok(Num.is(1));
            ko(Num.is(new Number(1)));
        });
        it('should return false when x is not a number', function () {
            ko(Num.is(NaN));
            ko(Num.is(Infinity));
            ko(Num.is(-Infinity));
            ko(Num.is(null));
            ko(Num.is(undefined));
            ko(Num.is(true));
            ko(Num.is(''));
            ko(Num.is([]));
            ko(Num.is({}));
            ko(Num.is(noop));
            ko(Num.is(/a/));
            ko(Num.is(new RegExp('a')));
            ko(Num.is(new Error()));
            ko(Num.is(new Date()));
        });
    });
});

describe('Str', function () {
    describe('#is(x)', function () {
        it('should return true when x is a string', function () {
            ok(Str.is(''));
            ok(Str.is('a'));
            ko(Str.is(new String('a')));
        });
        it('should return false when x is not a string', function () {
            ko(Str.is(NaN));
            ko(Str.is(Infinity));
            ko(Str.is(-Infinity));
            ko(Str.is(null));
            ko(Str.is(undefined));
            ko(Str.is(true));
            ko(Str.is(1));
            ko(Str.is([]));
            ko(Str.is({}));
            ko(Str.is(noop));
            ko(Str.is(/a/));
            ko(Str.is(new RegExp('a')));
            ko(Str.is(new Error()));
            ko(Str.is(new Date()));
        });
    });
});

describe('Arr', function () {
    describe('#is(x)', function () {
        it('should return true when x is an array', function () {
            ok(Arr.is([]));
        });
        it('should return false when x is not an array', function () {
            ko(Arr.is(NaN));
            ko(Arr.is(Infinity));
            ko(Arr.is(-Infinity));
            ko(Arr.is(null));
            ko(Arr.is(undefined));
            ko(Arr.is(true));
            ko(Arr.is(1));
            ko(Arr.is('a'));
            ko(Arr.is({}));
            ko(Arr.is(noop));
            ko(Arr.is(/a/));
            ko(Arr.is(new RegExp('a')));
            ko(Arr.is(new Error()));
            ko(Arr.is(new Date()));
        });
    });
});

describe('Obj', function () {
    describe('#is(x)', function () {
        it('should return true when x is an object', function () {
            function A() {}
            ok(Obj.is({}));
            ok(Obj.is(new A()));
        });
        it('should return false when x is not an object', function () {
            ko(Obj.is(null));
            ko(Obj.is(undefined));
            ko(Obj.is(0));
            ko(Obj.is(''));
            ko(Obj.is([]));
            ko(Obj.is(noop));
            //ko(Obj.is(new String('1')));
            //ko(Obj.is(new Number(1)));
            //ko(Obj.is(new Boolean()));
            //ko(Obj.is(/a/));
            //ko(Obj.is(new RegExp('a')));
            //ko(Obj.is(new Error()));
            //ko(Obj.is(new Date()));
        });
    });
});

describe('Func', function () {
    describe('#is(x)', function () {
        it('should return true when x is a function', function () {
            ok(Func.is(noop));
            ok(Func.is(new Function()));
        });
        it('should return false when x is not a function', function () {
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
            ko(Func.is(new Date()));
        });
    });
});

describe('Err', function () {
    describe('#is(x)', function () {
        it('should return true when x is an error', function () {
            ok(Err.is(new Error()));
        });
        it('should return false when x is not an error', function () {
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
            ko(Err.is(new Date()));
        });
    });
});

describe('Re', function () {
    describe('#is(x)', function () {
        it('should return true when x is a regexp', function () {
            ok(Re.is(/a/));
            ok(Re.is(new RegExp('a')));
        });
        it('should return false when x is not a regexp', function () {
            ko(Re.is(null));
            ko(Re.is(undefined));
            ko(Re.is(0));
            ko(Re.is(''));
            ko(Re.is([]));
            ko(Re.is(new String('1')));
            ko(Re.is(new Number(1)));
            ko(Re.is(new Boolean()));
            ko(Re.is(new Error()));
            ko(Re.is(new Date()));
        });
    });
});

describe('Dat', function () {
    describe('#is(x)', function () {
        it('should return true when x is a Dat', function () {
            ok(Dat.is(new Date()));
        });
        it('should return false when x is not a Dat', function () {
            ko(Dat.is(null));
            ko(Dat.is(undefined));
            ko(Dat.is(0));
            ko(Dat.is(''));
            ko(Dat.is([]));
            ko(Dat.is(new String('1')));
            ko(Dat.is(new Number(1)));
            ko(Dat.is(new Boolean()));
            ko(Dat.is(new Error()));
            ko(Dat.is(/a/));
            ko(Dat.is(new RegExp('a')));
        });
    });
});

//
// struct
//

describe('struct', function () {
    describe('#is(x)', function () {
        it('should return true when x is an instance of the struct', function () {
            var p = new Point({ x: 1, y: 2 });
            ok(Point.is(p));
        });
    });
    describe('#update()', function () {
        var Type = struct({name: Str});
        var instance = new Type({name: 'Giulio'});
        it('should throw if options.update is missing', function () {
            throwsWithMessage(function () {
                var newInstance = Type.update(instance, {name: 'Canti'});
            }, errs.ERR_OPTIONS_UPDATE_MISSING);
        });
        it('should return a new instance if options.update is defined', function () {
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
    describe('constructor', function () {
        var T = enums({a: 0}, 'T');
        it('should throw if used with new', function () {
            throwsWithMessage(function () {
                new T('a');
            }, format(errs.ERR_NEW_OPERATOR_FORBIDDEN, 'T'));
        });
        it('should accept only valid values', function () {
            eq(T('a'), 'a');
            throwsWithMessage(function () {
                T('b')
            }, 'bad T');
        });
    });
    describe('#is(x)', function () {
        var Direction = enums({
            North: 0, 
            East: 1,
            South: 2, 
            West: 3
        });
        it('should return true when x is an instance of the enum', function () {
            ok(Direction.is('North'));
        });
        it("should return false when x is not an instance of the enum", function () {
            ko(Direction.is('North-East'));
        });
    });
    describe('#of(keys)', function () {
        it('should return an enum', function () {
            var Size = enums.of(['large', 'small']);
            ok(Size.meta.map.large === 0);
            ok(Size.meta.map.small === 1);
        });
        it('should handle a string', function () {
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

    var Shape = union([Circle, Rectangle], 'Shape');

    Shape.dispatch = function (values) {
        assert(Obj.is(values));
        return values.hasOwnProperty('center') ?
            Circle :
            Rectangle;   
    };

    describe('constructor', function () {
        it('should throw when dispatch() is not implemented', function () {
            throwsWithMessage(function () {
                var T = union([Str, Num], 'T');
                T(1);
            }, 'unimplemented T.dispatch()');
        });
        it('should build instances when dispatch() is implemented', function () {
            var circle = Shape({center: {x: 0, y: 0}, radius: 10});
            ok(Circle.is(circle));
        });
        it('should throw if used with new and union types are not instantiables with new', function () {
            throwsWithMessage(function () {
                var T = union([Str, Num], 'T');
                T.dispatch = function () { return Str; }
                new T('a');
            }, format(errs.ERR_NEW_OPERATOR_FORBIDDEN, 'T'));
        });
        it('should not throw if used with new and union types are instantiables with new', function () {
            doesNotThrow(function () {
                Shape({center: {x: 0, y: 0}, radius: 10});
            });
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
// maybe
//

describe('maybe', function () {
    it('should be idempotent', function () {
        var A = maybe(Point);
        var B = maybe(A);
        eq(A, B); 
    });
    describe('constructor', function () {
        it('should throw if used with new', function () {
            throwsWithMessage(function () {
                var T = maybe(Str, 'T');
                new T();
            }, format(errs.ERR_NEW_OPERATOR_FORBIDDEN, 'T'));
        });
        it('should accept only valid values', function () {
            throwsWithMessage(function () {
                var T = maybe(Str);
                T(1)
            }, 'bad Str');
        });
        it('should coerce values', function () {
            var T = maybe(Point);
            eq(T(null), null);
            eq(T(undefined), null);
            ok(Point.is(T({x: 0, y: 0})));
        });
        it.skip('should be idempotent', function () {
            var T = maybe(Point);
            var p1 = T({x: 0, y: 0});
            var p2 = T(p1);
            eq(p2, p1);
        });
    });
    describe('#is(x)', function () {
        it('should return true when x is an instance of the maybe', function () {
            var Radio = maybe(Str);
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
    describe('constructor', function () {
        var S = struct({}, 'S');
        var T = tuple([S, S], 'T');
        it('should coerce values', function () {
            var t = T([{}, {}]);
            ok(S.is(t[0]));
            ok(S.is(t[1]));
        });
        it('should accept only valid values', function () {
            throwsWithMessage(function () {
                T(1);
            }, 'bad T');
            throwsWithMessage(function () {
                T([1, 1]);
            }, 'bad S');
        });
        it('should be idempotent', function () {
            var T = tuple([Str, Num]);
            var p1 = T(['a', 1]);
            var p2 = T(p1);
            eq(p2, p1);
        });    
    });
    describe('#is(x)', function () {
        var Area = tuple([Num, Num]);
        it('should return true when x is an instance of the tuple', function () {
            ok(Area.is([1, 2]));
        });
        it("should return false when x is not an instance of the tuple", function () {
            ko(Area.is([1]));
            ko(Area.is([1, 2, 3]));
            ko(Area.is([1, 'a']));
        });
    });
    describe('#update()', function () {
        var Type = tuple([Str, Num]);
        var instance = Type(['a', 1]);
        it('should throw if options.update is missing', function () {
            throwsWithMessage(function () {
                var newInstance = Type.update(instance, ['b', 2]);
            }, errs.ERR_OPTIONS_UPDATE_MISSING);
        });
        it('should return a new instance if options.update is defined', function () {
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
    describe('constructor', function () {
        var S = struct({}, 'S');
        var T = list(S, 'T');
        it('should coerce values', function () {
            var t = T([{}]);
            ok(S.is(t[0]));
        });
        it('should accept only valid values', function () {
            throwsWithMessage(function () {
                T(1);
            }, 'bad T');
            throwsWithMessage(function () {
                T([1]);
            }, 'bad S');
        });
        it('should be idempotent', function () {
            var T = list(Point);
            var p1 = T([{x: 0, y: 0}]);
            var p2 = T(p1);
            eq(p2, p1);
        });    
    });
    describe('#is(x)', function () {
        var Path = list(Point);
        var p1 = new Point({x: 0, y: 0});
        var p2 = new Point({x: 1, y: 1});
        it('should return true when x is a list', function () {
            ok(Path.is([p1, p2]));
        });
    });
    describe('#update()', function () {
        var Type = list(Str);
        var instance = Type(['a', 'b']);
        it('should throw if options.update is missing', function () {
            throwsWithMessage(function () {
                var newInstance = Type.update(instance, ['b', 2]);
            }, errs.ERR_OPTIONS_UPDATE_MISSING);
        });
        it('should return a new instance if options.update is defined', function () {
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
    describe('constructor', function () {
        it('should throw if used with new and a type that is not instantiable with new', function () {
            throwsWithMessage(function () {
                var T = subtype(Str, function () { return true; }, 'T');
                new T();
            }, format(errs.ERR_NEW_OPERATOR_FORBIDDEN, 'T'));
        });
        it('should coerce values', function () {
            var T = subtype(Point, function () { return true; });
            var p = T({x: 0, y: 0});
            ok(Point.is(p));
        });
        it('should accept only valid values', function () {
            var T = subtype(Point, function (p) { return p.x > 0; }, 'T');
            throwsWithMessage(function () {
                var p = T({x: 0, y: 0});
            }, 'bad T');
        });
    });
    describe('#is(x)', function () {
        var Positive = subtype(Num, function (n) {
            return n >= 0;
        });
        it('should return true when x is a subtype', function () {
            ok(Positive.is(1));
        });
        it('should return false when x is not a subtype', function () {
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
        it('should return true when x is the func', function () {
            ok(sum.is(sum));
            ok(sum(1, 2) === 3);
        });
        it("should return false when x is not the func", function () {
            ko(sum.is(noop));
        });
        it("should throw with wrong arguments", function () {
            throws(function () {
                sum(1, 'a');
            });
        });
        it("should throw with wrong return", function () {
            var bad = func(tuple([Num, Num]), function (a, b) {
                return a + String(b);
            }, Num);
            throws(function () {
                bad(1, 2);
            });
        });
        it("Return should be optional", function () {
            var bad = func(tuple([Num, Num]), function (a, b) {
                return a + String(b);
            });
            ok(bad(1, 2) === '12');
        });
        it("should handle optional arguments", function () {
            var sum3 = func(tuple([Num, Num, maybe(Num)]), function (a, b, c) {
                return a + b + (c || 0);
            }, Num);
            ok(sum3(1, 2, 3) === 6);
            ok(sum3(1, 2) === 3);
        });
    });
});

