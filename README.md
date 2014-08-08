# tcomb

tcomb is a library which allows you to **check the types** of JavaScript values at runtime with a **simple syntax**. It is great for checking external input, for testing and for adding safety to your internal code. Bonus points: 

- write complex domain models in a breeze and with small code footprint
- easy debugging
- **instances are immutables** by default
- encode/decode of domain objects to/from JSON for free
- make your existing code safer gradually

The library provides several type combinators and a built-in `assert` function. When an assertion fails the library **starts the debugger** so you can inspect the stack and quickly find out what's wrong.

You can check:

- JavaScript native types
    - Nil: `null` and  `undefined`
    - Str: strings
    - Num: numbers
    - Bool: booleans
    - Arr: arrays
    - Obj: plain objects
    - Func: functions
    - Err: errors
- structs (i.e. classes)
- unions
- maybe
- enums
- tuples
- subtypes
- lists
- function types (experimental)

## Quick example

Let's build a product

    // a struct
    var Product = struct({
        name: Str,                  // required string
        description: maybe(Str),    // optional string, can be `null` or `undefined`
        homepage: Url,              // a subtype of a string
        shippings: list(Str),       // a list of shipping methods
        category: Category,         // an enumeration
        price: union(Num, Price),   // a price expressed in dollars OR in another currency
        dim: tuple([Num, Num])      // a tuple (width, height)
    });

    var Url = subtype(Str, function (s) {
        return s.indexOf('http://') === 0;
    });

    var Category = enums({
        audio: 0,
        video: 1
    });

    var Price = struct({
        currency: Str,
        amount: Num
    });

    // JSON representation of a product
    var json = {
        name: 'iPod',
        description: 'Engineered for maximum funness.',
        homepage: 'http://www.apple.com/ipod/',
        shippings: ['Same Day', 'Next Businness Day'],
        category: 'audio',
        price: {currency: 'EUR', amount: 100},
        dim: [2.4, 4.1]
    };

    // get an immutable instance
    var ipod = new Product(json);

## Setup

Node

    npm install tcomb

    var t = require('tcomb');

Browser

This library uses a few ES5 methods

- Array#forEach()
- Array#map()
- Array#some()
- Array#every()
- Object#keys()

you can use `es5-shim` to support old browsers

    <!--[if lt IE 9]>
    <script src="es5-shim.min.js"></script>
    <![endif]-->
    <script type="text/javascript" src="tcomb.js"></script>
    <script type="text/javascript">
        console.log(t);
    </script>

## Tests

Run

    mocha

in the project root.

## What's a type?

A `type` is a function `T` such that

1. `T` has signature `T(values, [mut])` where `values` depends on the nature of `T` and the optional boolean arg `mut` makes the instance mutable (default `false`)
2. `T` is idempotent: `new T(new T(values)) "equals" new T(values)`
3. `T` owns a static function `T.is(x)` returning `true` if `x` is a instance of `T`

**Note**: 2. implies that `T` can be used as a default JSON decoder

## Api

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

    // methods are defined as usual
    Point.prototype.toString = function () {
        return '(' + this.x + ', ' + this.y + ')';
    };

Building an instance is simple as

    "use strict";
    var p = new Point({x: 1, y: 2});
    p.x = 2; // => TypeError, p is immutable
    
    p = new Point({x: 1, y: 2}, true); // now p is mutable
    p.x = 2; // ok

is(x)

Returns `true` if `x` is an instance of `Point`.

    Point.is(p); // => true

update(instance, updates, [mut])

Returns an instance with changed props, without modifying the original.

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

is(x)

Returns `true` if `x` belongs to the union.

    Shape.is(new Circle({center: p, radius: 10})); // => true

### maybe(type, [name])

Same as `union([Nil, type])`.

    var MaybeStr = maybe(Str);

    MaybeStr.is('a');     // => true
    MaybeStr.is(null);    // => true
    MaybeStr.is(1);       // => false
    

### enums(map, [name])

Defines an enum of strings.

    var Direction = enums({
        North: 0, 
        East: 1,
        South: 2, 
        West: 3
    });

is(x)

Returns `true` if `x` belongs to the enum.

    Direction.is('North'); // => true

### tuple(types, [name])

Defines a tuple whose coordinates have the specified types.

    var Args = tuple([Num, Num]);

    var a = new Args([1, 2]);

is(x)

Returns `true` if `x` belongs to the tuple.

    Args.is([1, 2]);      // => true
    Args.is([1, 'a']);    // => false, second element is not a Num
    Args.is([1, 2, 3]);   // => false, too many elements

update(instance, index, element, [mut])

Returns an instance without modifying the original.
    
    Args.update(a, 0, 2);    // => [2, 2]

### subtype(type, predicate, [name])

Defines a subtype of an existing type.

    var Int = subtype(Num, function (n) {
        return n === parseInt(n, 10);
    });

    // points of the first quadrant
    var Q1Point = subtype(Point, function (p) {
        return p.x >= 0 && p.y >= 0;
    });

    // constructor usage
    var p = new Q1Point({x: -1, y: -2}); // => fail!

is(x)

Returns `true` if `x` belongs to the subtype.

    Int.is(2);      // => true
    Int.is(1.1);    // => false

### list(type, [name])

Defines an array where all elements are of type `type`.

    var Path = list(Point);

    // costructor usage
    var path = new Path([
        {x: 0, y: 0}, 
        {x: 1, y: 1}
    ]);

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

### func(Arguments, f, [Return], [name])

**Experimental**. Defines a function where the `arguments` and the return value are checked.

    var sum = func(tuple([Num, Num]), function (a, b) {
        return a + b;
    }, Num);

    sum(1, 2); // => 3
    sum(1, 'a'); // => fail!

## TODO

- more tests
- jsDoc comments

## Copyright & License

Copyright (C) 2014 Giulio Canti - Released under the MIT License.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.