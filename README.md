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

## Quick examples

### Let's build a new product model

```javascript
// a struct
var Product = struct({
    name: Str,                  // required string
    description: maybe(Str),    // optional string, can be null or undefined
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

// JSON of a product
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
```

### You have existing code and you want to add safety

```javascript
// your code: plain old JavaScript class
function Point (x, y) {
    this.x = x;
    this.y = y;
}

var p = new Point(1, 'a'); // silent error
```

in order to "tcombify" your code you can simply add some assertion

```javascript
function Point (x, y) {
    assert(Num.is(x));
    assert(Num.is(y));
    this.x = x;
    this.y = y;
}

var p = new Point(1, 'a'); // => fail! debugger kicks in
```

## Setup

Node

    npm install tcomb

    var t = require('tcomb');

Browser

This library uses a few ES5 methods

- `Array#forEach()`
- `Array#map()`
- `Array#some()`
- `Array#every()`
- `Object#keys()`

you can use `es5-shim` to support old browsers

```html
<!--[if lt IE 9]>
<script src="es5-shim.min.js"></script>
<![endif]-->
<script type="text/javascript" src="tcomb.js"></script>
<script type="text/javascript">
    console.log(t);
</script>
```

## Tests

Run

    mocha

in the project root.

## What's a type?

In tcomb a `type` is a function `T` such that

1. `T` has signature `T(values, [mut])` where `values` depends on the nature of `T` and the optional boolean arg `mut` makes the instance mutable (default `false`)
2. `T` is idempotent: `new T(new T(values)) "equals" new T(values)`
3. `T` owns a static function `T.is(x)` returning `true` if `x` is a instance of `T`

**Note**: 2. implies that `T` can be used as a default JSON decoder

## Api

### assert(guard, [message]);

If `guard !== true` the debugger kicks in.

- `guard` boolean condition
- `message` optional string useful for debugging

### struct(props, [name])

Defines a struct like type.

- `props` hash name -> type
- `name` optional string useful for debugging

Example

```javascript
"use strict";

// define a struct with two numerical props
var Point = struct({
    x: Num,
    y: Num
});

// methods are defined as usual
Point.prototype.toString = function () {
    return '(' + this.x + ', ' + this.y + ')';
};

// costructor usage, p is immutable
var p = new Point({x: 1, y: 2});

p.x = 2; // => TypeError, p is immutable

p = new Point({x: 1, y: 2}, true); // now p is mutable

p.x = 2; // ok
```

#### is(x)

Returns `true` if `x` is an instance of `Point`.

```javascript
Point.is(p); // => true
```

#### update(instance, updates, [mut])

Returns an instance with changed props, without modifying the original.

```javascript
Point.update(p, {x: 3}); // => new Point({x: 3, y: 2})
```

### union(types, [name])

Defines a types union.

- `types` array of types
- `name` optional string useful for debugging

Example

```javascript
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
```

#### is(x)

Returns `true` if `x` belongs to the union.

```javascript
Shape.is(new Circle({center: p, radius: 10})); // => true
```

### maybe(type, [name])

Same as `union([Nil, type])`.

```javascript
var MaybeStr = maybe(Str);

MaybeStr.is('a');     // => true
MaybeStr.is(null);    // => true
MaybeStr.is(1);       // => false
```    

### enums(map, [name])

Defines an enum of strings.

- `map` hash enum -> value
- `name` optional string useful for debugging

Example

```javascript
var Direction = enums({
    North: 0, 
    East: 1,
    South: 2, 
    West: 3
});
```

#### is(x)

Returns `true` if `x` belongs to the enum.

```javascript
Direction.is('North'); // => true
```

### tuple(types, [name])

Defines a tuple whose coordinates have the specified types.

- `types` array of coordinates types
- `name` optional string useful for debugging

Example

```javascript
var Area = tuple([Num, Num]);

// constructor usage, area is immutable
var area = new Area([1, 2]);
```

#### is(x)

Returns `true` if `x` belongs to the tuple.

```javascript
Area.is([1, 2]);      // => true
Area.is([1, 'a']);    // => false, second element is not a Num
Area.is([1, 2, 3]);   // => false, too many elements
```

#### update(instance, index, element, [mut])

Returns an instance without modifying the original.
    
```javascript
Area.update(area, 0, 2);    // => [2, 2]
```

### subtype(type, predicate, [name])

Defines a subtype of an existing type.

- `type` the supertype
- `predicate`: a function with signature `(x) -> boolean`
- `name` optional string useful for debugging

Example

```javascript
// points of the first quadrant
var Q1Point = subtype(Point, function (p) {
    return p.x >= 0 && p.y >= 0;
});

// costructor usage, p is immutable
var p = new Q1Point({x: 1, y: 2});

p = new Q1Point({x: -1, y: -2}); // => fail!
```

#### is(x)

Returns `true` if `x` belongs to the subtype.

```javascript
var Int = subtype(Num, function (n) {
    return n === parseInt(n, 10);
});

Int.is(2);      // => true
Int.is(1.1);    // => false
```

### list(type, [name])

Defines an array where all elements are of type `type`.

- `type` type of all the elements
- `name` optional string useful for debugging

Example

```javascript
var Path = list(Point);

// costructor usage, path is immutable
var path = new Path([
    {x: 0, y: 0}, 
    {x: 1, y: 1}
]);
```

#### is(x)

Returns `true` if `x` belongs to the list.

```javascript
var p1 = new Point({x: 0, y: 0});
var p2 = new Point({x: 1, y: 2});
Path.is([p1, p2]); // => true
```

#### Useful methods

All of these methods return an instance without modifying the original.

```javascript
Path.append(path, element, [mut]);
Path.prepend(path, element, [mut]);
Path.update(path, index, element, [mut]);
Path.remove(path, index, [mut]);
Path.move(path, from, to, [mut]);
```

### func(Arguments, f, [Return], [name])

**Experimental**. Defines a function where the `arguments` and the return value are checked.

- `Arguments` the type of `arguments`
- `f` the function to execute
- `Return` optional type of the return value
- `name` optional string useful for debugging

Example

```javascript
var sum = func(tuple([Num, Num]), function (a, b) {
    return a + b;
}, Num);

sum(1, 2); // => 3
sum(1, 'a'); // => fail!
```

## TODO

- more tests
- jsDoc comments

## Copyright & License

Copyright (C) 2014 Giulio Canti - Released under the MIT License.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.