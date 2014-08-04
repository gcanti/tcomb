# tcomb

JavaScript types and combinators

## Why?

tcomb is a library which allows you to check the types of JavaScript values at runtime with a simple syntax. It is great for checking external input, for testing and for adding safety to your internal code. Bonus points: 

- easy debugging
- encode/decode of your domain objects to/from JSON for free
- instances are immutables by default

## How

This library provides several type combinators and a built-in `assert` function you can use. When an assertion fails in the browser this function starts the debugger so you can inspect the stack and find what's wrong. Since after a type error many others are expected, the debugger starts only once.

## Quick example

Let's build a product

    var Product = struct({
        name: Str,                  // a REQUIRED string
        description: maybe(Str),    // an OPTIONAL string (can be `null`)
        homepage: Url,              // a SUBTYPE string representing a URL
        shippings: list(Shipping),  // a LIST of shipping methods
        category: Category,         // a string in [Audio, Video] (ENUM)
        price: union(Num, Price),   // price expressed in dollars OR in another currency (UNION)
        dim: tuple([Num, Num])      // width x height (TUPLE)
    });

    var Url = subtype(Str, function (s) {
        return s.indexOf('http://') === 0;
    });

    var Shipping = struct({
        description: Str,
        cost: Num
    });

    var Category = enums({
        Audio: 0,
        Video: 1
    });

    var Price = struct({
        currency: Str,
        amount: Num
    });

    var ipod = new Product({
        name: 'iPod',
        description: 'Engineered for maximum funness.',
        homepage: 'http://www.apple.com/ipod/',
        shippings: [{
            description: 'Shipped to your door, free.',
            cost: 0
        }],
        category: 'Audio',
        price: {currency: 'EUR', amount: 100},
        dim: [2.4, 4.1]
    });

## Setup

Node

    npm install tcomb

    var t = require('tcomb');

Browser

    <!DOCTYPE html>
    <html>
        <head>
            <meta charset="utf-8" />
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>tcomb setup</title>
            <!--[if lt IE 9]>
            <script src="shims/json2.js"></script>
            <script src="shims/es5-shim.min.js"></script>
            <script src="shims/es5-sham.min.js"></script>
            <script src="shims/html5shiv.min.js"></script>
            <![endif]-->
            <script type="text/javascript" src="tcomb.js"></script>
        </head>
        <body>
            <script type="text/javascript">
                console.log(t);
            </script>
        </body>
    </html>

## Requirements

Some ES5 methods

    Array#forEach()
    Array#map()
    Array#some()
    Array#every()
    Object#freeze()
    Object#keys()

## Tests

Run

    mocha

on the project root.

## What's a type?

A `type` is a function `T` such that

1. `T` has signature `T(values, [mut])` where the arg `values` is the set of values occurred to have an instance of `T` (depends on the nature of `T`) and the optional boolean arg `mut` makes the instance mutable (default `false`)
2. `T` is idempotent: `new T(new T(values)) "equals" new T(values)`
3. `T` owns a static function `T.is(x)` returning `true` if `x` is a instance of `T`

**Note**: 2. implies that `T` can be used as the default JSON decoder

## Api

### primitive(name, is)

Is used internally to define JavaScript native types:

- Nil: `null` and  `undefined`
- Str: strings
- Num: numbers
- Bool: booleans
- Arr: arrays
- Obj: plain objects
- Func: functions
- Err: errors

Example

    Str.is('a'); // => true
    Nil.is(0); // => false

### struct(props, [name])

Defines a struct like type.

- `props` hash field name -> type
- `name` optional string useful for debugging

Example

    // define a struct with two numerical props
    var Point = struct({
        x: Num,
        y: Num
    });

Methods are defined as usual

    Point.prototype.toString = function () {
        return '(' + this.x + ', ' + this.y + ')';
    };

Building an instance is simple as

    "use strict";
    var p = new Point({x: 1, y: 2});
    p.x = 2; // => TypeError, p is immutable
    
    p = new Point({x: 1, y: 2}, true); // now p is mutable
    p.x = 2; // ok

Some meta informations are stored in a `meta` hash

    Point.meta = {
        kind: 'struct',
        props: props,
        name: name
    };

is(x)

Returns `true` if `x` is an instance of `Point`.

    Point.is(p); // => true

update(instance, updates, [mut])

Returns an instance with changed props, without modify the original.

    Point.update(p, {x: 3}); // => new Point({x: 3, y: 2})

### union(types, [name])

Defines a types union.

- `types` array of types
- `name` optional string useful for debugging

Example

    var Circle = struct({
        center: Point,
        radius: Num
    });

    var Rectangle = struct({
        bl: Point, // bottom left vertex
        tr: Point  // top right vertex
    });

    var Shape = union([
        Circle, 
        Rectangle
    ]);

    // in order to use Shape as constructor `dispatch(values) -> Type` 
    // must be implemented
    Shape.dispatch = function (values) {
        assert(Obj.is(values));
        return values.hasOwnProperty('center') ?
            Circle :
            Rectangle;   
    };

    var shape = new Shape({center: {x: 1, y: 2}, radius: 10});

Some meta informations are stored in a `meta` hash

    Shape.meta = {
        kind: 'union',
        types: types,
        name: name
    };

is(x)

Returns `true` if `x` belongs to the union.

    Shape.is(new Circle([p, 10])); // => true

### maybe(type, [name])

Same as `union([Nil, type])`.

    var MaybeStr = maybe(Str);

    MaybeStr.is('a');     // => true
    MaybeStr.is(null);    // => true
    MaybeStr.is(1);       // => false
    

Some meta informations are stored in a `meta` hash

    MaybeStr.meta = {
        kind: 'maybe',
        type: type,
        name: name
    };

### enums(map, [name])

Defines an enum of strings.

    var Direction = enums({
        North: 0, 
        East: 1,
        South: 2, 
        West: 3
    });

Some meta informations are stored in a `meta` hash

    Direction.meta = {
        kind: 'enums',
        map: map,
        name: name
    };

is(x)

Returns `true` if `x` belongs to the enum.

    Direction.is('North'); // => true

### tuple(types, [name])

Defines a tuple whose coordinates have the specified types.

    var Args = tuple([Num, Num]);

    var a = new Args([1, 2]);

Some meta informations are stored in a `meta` hash

    Args.meta = {
        kind: 'tuple',
        types: types,
        name: name
    };

is(x)

Returns `true` if `x` belongs to the tuple.

    Args.is([1, 2]);      // => true
    Args.is([1, 'a']);    // => false, il secondo elemento non è un Num
    Args.is([1, 2, 3]);   // => false, troppi elementi

update(instance, index, element, [mut])

Returns an instance without modifying the original.
    
    Args.update(a, 0, 2);    // => [2, 2]

### subtype(type, predicate, [name])

Defines a subtype of an existing type.

    var Int = subtype(Num, function (n) {
        return n === parseInt(n, 10);
    });

    var Q1Point = subtype(Point, function (p) {
        // punti nel primo quadrante
        return p.x >= 0 && p.y >= 0;
    });

    // uso del costruttore
    var p = new Q1Point({x: -1, y: -2}); // => fail!

Some meta informations are stored in a `meta` hash

    Int.meta = {
        kind: 'subtype',
        type: type,
        predicate: predicate,
        name: name
    };

is(x)

Returns `true` if `x` belongs to the subtype.

    Int.is(2);      // => true
    Int.is(1.1);    // => false

### list(type, [name])

Defines an array where all elements are of type `type`.

    var Path = list(Point);

    // uso del costruttore
    var path = new Path([
        {x: 0, y: 0}, 
        {x: 1, y: 1}
    ]);

Some meta informations are stored in a `meta` hash
    
    Path.meta = {
        kind: 'list',
        type: type,
        name: name
    };

is(x)

Returns `true` if `x` belongs to the list.

    Path.is([{x: 0, y: 0}, {x: 1, y: 1}]);      // => true

**Useful methods**

Return an instance without modifying the original.
    
    Path.append(path, element, [mut]);
    Path.prepend(path, element, [mut]);
    Path.update(path, index, element, [mut]);
    Path.remove(path, index, [mut]);
    Path.move(path, from, to, [mut]);

### Utils

    fail(message)

    assert(guard, [message])

    // make properties immutables unless `unless` is `true`
    freeze(obj_or_arr, [unless])

    // adds the properties of `y` to `x`. If `overwrite` is falsy
    // and a property already exists, throws an error
    mixin(x, y, [overwrite])

    // array manipulation
    append(arr, element);
    prepend(arr, element);
    update(arr, index, element);
    remove(arr, index);
    move(arr, from, to);

## More examples

### How to extend a struct

    var Point3D = struct(mixin(Point.meta.props, {
        z: Num
    }));

    var p = new Point3D({x: 1, y: 2, z: 3});


### Deep update of a struct

    var c = new Circle({center: {x: 1, y: 2}, radius: 10});

    // translate x by 1
    var c2 = Circle.update(c, {
        center: Point.update(c.center, {
            x: c.center.x + 1
        })
    });

### Write a general JSON Decoder

    // (json, T, mut) -> instance of T
    function decode(json, T, mut) {
        if (T.fromJSON) {
            return T.fromJSON(json, mut);
        }
        switch (T.meta.kind) {
            case 'struct' :
                var values = {};
                var props = T.meta.props;
                for (var prop in props) {
                    if (props.hasOwnProperty(prop)) {
                        values[prop] = decode(json[prop], props[prop], mut);    
                    }
                }
                return new T(values, mut);
            case 'union' :
                assert(Func.is(T.dispatch));
                return decode(json, T.dispatch(json), mut);
            case 'maybe' :
                return Nil.is(json) ? undefined : decode(json, T.meta.type, mut);
            case 'tuple' :
                return freeze(json.map(function (x, i) {
                    return decode(x, T.meta.types[i], mut);
                }, mut));
            case 'subtype' :
                var x = decode(json, T.meta.type, mut); 
                assert(T.meta.predicate(x));
                return x;
            case 'list' :
                return freeze(json.map(function (x) {
                    return decode(x, T.meta.type, mut);
                }), mut);
            default :
                return json;
        }
    };

## Copyright & License

Copyright (C) 2014 Giulio Canti - Released under the MIT License.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.