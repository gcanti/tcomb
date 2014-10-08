> "Si vis pacem, para bellum" (Vegetius 5th century)

tcomb is a library for Node.js and the browser which allows you to **check the types** of 
JavaScript values at runtime with a simple syntax. It's great for **Domain Driven Design**, 
for testing and for adding safety to your internal code. 

# Contents

- [Features](#features)
- [Quick Examples](#quick-examples)
- [Setup](#setup)
- [Requirements](#requirements)
- [Tests](#tests)
- [The Idea](#the-idea)
- [Api](#api)
  - [options](#options)
    - [options.onFail](#optionsonfail)
    - [options.update](#optionsupdate)
  - [assert](#assert)
  - [structs](#structs)
  - [unions](#unions)
  - [maybe](#maybe)
  - [enums](#enums)
  - [subtypes](#subtypes)
  - [lists](#lists)
  - [dicts](#dicts)
  - [functions](#functions)
- [sweet.js macros (experimental)](#macros)
- [Articles on tcomb](#articles-on-tcomb)

# Features

- **write complex domain models** in a breeze and with small code footprint
- easy debugging
- instances are immutables by default
- encode/decode of domain models to/from JSON for free

The library provides a built-in `assert` function, if an assert fails the **debugger kicks in** 
so you can inspect the stack and quickly find out what's wrong.

You can handle:

**JavaScript native types**

- Nil: `null` and `undefined`
- Str: strings
- Num: numbers
- Bool: booleans
- Arr: arrays
- Obj: plain objects
- Func: functions
- Err: errors
- Re: regular expressions
- Dat: dates
- Any: *

**type combinators** (build new types from those already defined)

- struct (i.e. classes)
- union
- maybe
- enums
- tuple
- subtype
- list
- dict
- function type

# Quick Examples

Let's build a product model

```javascript
var Product = struct({
    name: Str,                  // required string
    desc: maybe(Str),           // optional string, can be null
    home: Url,                  // a subtype of a string
    shippings: list(Str),       // a list of shipping methods
    category: Category,         // enum, one of [audio, video]
    price: union([Num, Price]), // a price (dollars) OR in another currency
    size: tuple([Num, Num]),    // width x height
    warranty: dict(Num)         // a dictionary country -> covered years
});

var Url = subtype(Str, function (s) {
    return s.indexOf('http://') === 0;
});

var Category = enums.of('audio video');

var Price = struct({ currency: Str, amount: Num });

// JSON of a product
var json = {
    name: 'iPod',
    desc: 'Engineered for maximum funness.',
    home: 'http://www.apple.com/ipod/',
    shippings: ['Same Day', 'Next Businness Day'],
    category: 'audio',
    price: {currency: 'EUR', amount: 100},
    size: [2.4, 4.1],
    warranty: {
      US: 2,
      IT: 1
    }
};

// get an immutable instance, `new` is optional
var ipod = Product(json);
```

You have existing code and you want to add safety

```javascript
// your code: plain old JavaScript class
function Point (x, y) {
    this.x = x;
    this.y = y;
}

var p = new Point(1, 'a'); // silent error
```

in order to "tcombify" your code you can simply add some asserts

```javascript
function Point (x, y) {
    assert(Num.is(x));
    assert(Num.is(y));
    this.x = x;
    this.y = y;
}

var p = new Point(1, 'a'); // => fail! debugger kicks in
```

# Setup

Node

    npm install tcomb

Browser

    bower install tcomb

or download the `tcomb.min.js` file.

# Requirements

This library uses a few ES5 methods

- `Array.forEach()`
- `Array.map()`
- `Array.some()`
- `Array.every()`
- `Object.keys()`
- `Object.freeze()`
- `JSON.stringify()`

you can use `es5-shim`, `es5-sham` and `json2` to support old browsers

```html
<!--[if lt IE 9]>
<script src="json2.js"></script>
<script src="es5-shim.min.js"></script>
<script src="es5-sham.min.js"></script>
<![endif]-->
<script type="text/javascript" src="tcomb.js"></script>
<script type="text/javascript">
    console.log(t);
</script>
```

# Tests

Run `mocha` or `npm test` in the project root.

# The Idea

What's a type? In tcomb a type is a function `T` such that

1. `T` has signature `T(value, [mut])` where `value` depends on the nature of `T` and the optional boolean `mut` makes the instance mutable (default `false`)
2. `T` is idempotent: `T(T(value, mut), mut) === T(value, mut)`
3. `T` owns a static function `T.is(x)` returning `true` if `x` is an instance of `T`

**Note**: 2. implies that `T` can be used as a default JSON decoder

# Api

## options
  
### options.onFail
  
In production envs you don't want to leak failures to the user
  
```javascript
// override onFail hook
options.onFail = function (message) {
    try {
        // capture stack trace
        throw new Error(message);
    } catch (e) {
        // use you favourite JavaScript error logging service
        console.log(e.stack);
    }
};
```
  
### options.update
  
Adds to structs, tuples, lists and dicts a static method `update` that returns a new instance
without modifying the original.
  
Example
  
```javascript
// see http://facebook.github.io/react/docs/update.html
options.update = function (x, updates) {
  return React.addons.update(mixin({}, x), updates);
};
var p1  = Point({x: 0, y: 0});
var p2 = Point.update(p1, {x: {$set: 1}}); // => Point({x: 1, y: 0})
```

## assert

```js
assert(guard, [message], [values...]);
```
  
If `guard !== true` the debugger kicks in.
  
- `guard` boolean condition
- `message` optional string useful for debugging, formatted with values like [util.format in Node](http://nodejs.org/api/util.html#util_util_format_format)
  
Example
  
```javascript
assert(1 === 2); // throws 'assert(): failed'
assert(1 === 2, 'error!'); // throws 'error!'
assert(1 === 2, 'error: %s !== %s', 1, 2); // throws 'error: 1 !== 2'
```
  
To customize failure behaviour, see `options.onFail`.

## structs

```js
struct(props, [name])
```
  
Defines a struct like type.
  
- `props` hash name -> type
- `name` optional string useful for debugging
  
Example
  
```javascript
"use strict";
  
// defines a struct with two numerical props
var Point = struct({
    x: Num,
    y: Num
});
  
// methods are defined as usual
Point.prototype.toString = function () {
    return '(' + this.x + ', ' + this.y + ')';
};
  
// costructor usage, p is immutable
var p = Point({x: 1, y: 2});
  
p.x = 2; // => TypeError
  
p = Point({x: 1, y: 2}, true); // now p is mutable
  
p.x = 2; // ok
```
  
### is(x)
  
Returns `true` if `x` is an instance of the struct.
  
```javascript
Point.is(p); // => true
```

## unions

```js
union(types, [name])
```
  
Defines a union of types.
  
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
  
### is(x)
  
Returns `true` if `x` belongs to the union.
  
```javascript
Shape.is(Circle({center: p, radius: 10})); // => true
```

## maybe

```js
maybe(type, [name])
```
  
Same as `union([Nil, type])`.
  
```javascript
// the value of a radio input where null = no selection
var Radio = maybe(Str);
  
Radio.is('a');     // => true
Radio.is(null);    // => true
Radio.is(1);       // => false
```

## enums

```js
enums(map, [name])
```
  
Defines an enum of strings.
  
- `map` hash enum -> value
- `name` optional string useful for debugging
  
Example
  
```javascript
var Direction = enums({
    North: 'North', 
    East: 'East',
    South: 'South', 
    West: 'West'
});
```
  
### is(x)
  
Returns `true` if `x` belongs to the enum.
  
```javascript
Direction.is('North'); // => true
```
### enums.of(keys, [name])
  
Returns an enums of an array of keys, useful when you don't mind to define
custom values for the enums.
  
- `keys` array (or string) of keys
- `name` optional string useful for debugging
  
Example
  
```javascript
// result is the same as the main example
var Direction = enums.of(['North', 'East', 'South', 'West']);
  
// or..
Direction = enums.of('North East South West');
```

## tuples

```js
tuple(types, [name])
```
  
Defines a tuple whose coordinates have the specified types.
  
- `types` array of coordinates types
- `name` optional string useful for debugging
  
Example
  
```javascript
var Area = tuple([Num, Num]);
  
// constructor usage, area is immutable
var area = Area([1, 2]);
```
  
### is(x)
  
Returns `true` if `x` belongs to the tuple.
  
```javascript
Area.is([1, 2]);      // => true
Area.is([1, 'a']);    // => false, the second element is not a Num
Area.is([1, 2, 3]);   // => false, too many elements
```

## subtypes

```js
subtype(type, predicate, [name])
```
  
Defines a subtype of an existing type.
  
- `type` the supertype
- `predicate` a function with signature `(x) -> boolean`
- `name` optional string useful for debugging
  
Example
  
```javascript
// points of the first quadrant
var Q1Point = subtype(Point, function (p) {
    return p.x >= 0 && p.y >= 0;
});
  
// costructor usage, p is immutable
var p = Q1Point({x: 1, y: 2});
  
p = Q1Point({x: -1, y: -2}); // => fail!
```
**Note**. You can't add methods to `Q1Point` `prototype`, add them to the supertype `prototype` if needed.
  
### is(x)
  
Returns `true` if `x` belongs to the subtype.
  
```javascript
var Int = subtype(Num, function (n) {
    return n === parseInt(n, 10);
});
  
Int.is(2);      // => true
Int.is(1.1);    // => false
```

## lists

```js
list(type, [name])
```
  
Defines an array where all the elements are of type `T`.
  
- `type` type of all the elements
- `name` optional string useful for debugging
  
Example
  
```javascript
var Path = list(Point);
  
// costructor usage, path is immutable
var path = Path([
    {x: 0, y: 0}, 
    {x: 1, y: 1}
]);
```
  
### is(x)
  
Returns `true` if `x` belongs to the list.
  
```javascript
var p1 = Point({x: 0, y: 0});
var p2 = Point({x: 1, y: 2});
Path.is([p1, p2]); // => true
```

## dicts

```js
dict(type, [name])
```
  
Defines a dictionary Str -> type.
  
- `type` the type of the values
- `name` optional string useful for debugging
  
Example
  
```javascript
// defines a dictionary of numbers
var Tel = dict(Num);
```
  
### is(x)
  
Returns `true` if `x` is an instance of the dict.
  
```javascript
Tel.is({'jack': 4098, 'sape': 4139}); // => true
```

## functions (experimental)

Typed functions may be defined like this:

```javascript
// add takes two `Num`s and returns a `Num`
var add = func([Num, Num], Num)
    .of(function (x, y) { return x + y; });
```

And used like this:

```javascript
add("Hello", 2); // Raises error: Invalid `Hello` supplied to `Num`
add("Hello");    // Raises error: Invalid `Hello` supplied to `Num`

add(1, 2);       // Returns: 3
add(1)(2);       // Returns: 3
```

### func(A, B, name)

```js
func(Domain, Codomain, name)
```

Returns a function type whose functions have their domain and codomain specified and constrained.

- `Domain`: the type of the function's argument (or `list` of types of the function's arguments)
- `Codomain`: the type of the function's return value
- `name`: optional string useful for debugging

`func` can be used to define function types using native types:

```javascript
// An `A` takes a `Str` and returns an `Num`
var A = func(Str, Num);
```

The domain and codomain can also be specified using types from any combinator including `func`:

```javascript
// A `B` takes a `Func` (which takes a `Str` and returns a `Num`) and returns a `Str`.
var B = func(func(Str, Num), Str);

// An `ExcitedStr` is a `Str` containing an exclamation mark
var ExcitedStr = subtype(Str, function (s) { return s.indexOf('!') !== -1; }, 'ExcitedStr');

// An `Exciter` takes a `Str` and returns an `ExcitedStr`
var Exciter = func(Str, ExcitedStr);
```

Additionally the domain can be expressed as a `list` of types:

```javascript
// A `C` takes an `A`, a `B` and a `Str` and returns a `Num`
var C = func([A, B, Str], Num);
```

### .of(f)

```javascript
func(A, B).of(f);
```

Returns a function where the domain and codomain are typechecked against the function type.

If the function is passed values which are outside of the domain or returns values which are outside of the codomain it will raise an error:

```javascript
var simpleQuestionator = Exciter.of(function (s) { return s + '?'; });
var simpleExciter      = Exciter.of(function (s) { return s + '!'; });

// Raises error: 
// Invalid `Hello?` supplied to `ExcitedStr`, insert a valid value for the subtype
simpleQuestionator('Hello');

// Raises error: Invalid `1` supplied to `Str`
simpleExciter(1);

// Returns: 'Hello!'
simpleExciter('Hello');
```

The returned function may also be partially applied:

```javascript
// We can reasonably suggest that add has the following type signature
// add : Num -> Num -> Num
var add = func([Num, Num], Num)
    .of(function (x, y) { return x + y });

var addHello = add("Hello"); // As this raises: "Error: Invalid `Hello` supplied to `Num`"

var add2 = add(2);
add2(1); // And this returns: 3
```

### .is(x)

```javascript
func(A, B).is(x);
```

Returns true if x belongs to the type.

```javascript
Exciter.is(simpleExciter);      // Returns: true
Exciter.is(simpleQuestionator); // Returns: true

var id = function (x) { return x; };

func([Num, Num], Num).is(func([Num, Num], Num).of(id)); // Returns: true
func([Num, Num], Num).is(func(Num, Num).of(id));        // Returns: false 
```

### Rules

1. Typed functions' domains are checked when they are called
2. Typed functions' codomains are checked when they return
3. The domain and codomain of a typed function's type is checked when the typed function is passed to a function type (such as when used as an argument in another typed function).

# Macros (experimental)

I added a `tcomb.sjs` file containing some [sweet.js](http://sweetjs.org/) macros, here some examples:

```js
// structs
type Point struct {
  x: Num,
  y: Num
}

// unions
type Shape union {
  Circle,
  Rectangle
}

// tuples
type Coords tuple {
  Num,
  Num
}

// enums
type Direction enums {
  'North', 
  'East',
  'South', 
  'West'
}

// enums with specified values 
type Direction enums {
  'North': 0, 
  'East': 1,
  'South': 2, 
  'West': 3
}

// subtypes
type Positive subtype<Num> n {
  return n > 0;
}

// irriducibles types, like JavaScript primitives
type Irriducible irriducible x {
  return typeof x === 'function';
}

// maybe
type Maybe maybe<Str>

// lists
type List list<Str>

// dictionaries
type Dict dict<Str>

// functions
fn add (x: Num, y: Num) {
    return x + y;
}

// functions with checked return value
fn add (x: Num, y: Num) -> Num {
    return x + y;
}
```

# Articles on tcomb

- [JavaScript, Types and Sets](http://gcanti.github.io/2014/09/29/javascript-types-and-sets.html)
- [What if your domain model could validate the UI for free?](http://gcanti.github.io/2014/08/12/what-if-your-domain-model-could-validate-the-ui-for-free.html)
- [JSON Deserialization Into An Object Model](http://gcanti.github.io/2014/09/12/json-deserialization-into-an-object-model.html)
- [JSON API Validation In Node.js](http://gcanti.github.io/2014/09/15/json-api-validation-in-node.html)

# Contribution

If you do have a contribution for the package feel free to put up a Pull Request or open an Issue.

# License (MIT)

The MIT License (MIT)

Copyright (c) 2014 Giulio Canti

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
