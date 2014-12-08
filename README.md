> "Si vis pacem, para bellum" (Vegetius 5th century)

tcomb is a library for Node.js and the browser which allows you to **check the types** of
JavaScript values at runtime with a simple syntax. It's great for **Domain Driven Design**,
for testing and for adding safety to your internal code.

# The Idea

tcomb is based on set theory.
What's a type? In tcomb a type is a function `T` such that

1. `T` has signature `T(value, [mut])` where `value` depends on the nature of `T` and the optional boolean `mut` makes the instance mutable (default `false`)
2. `T` is idempotent: `T(T(value, mut), mut) === T(value, mut)`
3. `T` owns a static function `T.is(x)` returning `true` if `x` is an instance of `T`

**Note**: 2. implies that `T` can be used as a default JSON decoder

# Articles on tcomb

- [JavaScript, Types and Sets Part 1](http://gcanti.github.io/2014/09/29/javascript-types-and-sets.html)
- [JavaScript, Types and Sets Part 2](https://gcanti.github.io/2014/10/07/javascript-types-and-sets-part-II.html)
- [What if your domain model could validate the UI for free?](http://gcanti.github.io/2014/08/12/what-if-your-domain-model-could-validate-the-ui-for-free.html)
- [JSON Deserialization Into An Object Model](http://gcanti.github.io/2014/09/12/json-deserialization-into-an-object-model.html)
- [JSON API Validation In Node.js](http://gcanti.github.io/2014/09/15/json-api-validation-in-node.html)

# Contributors

- [Giulio Canti](https://github.com/gcanti)
- [Becky Conning](https://github.com/beckyconning) 'func' combinator ideas and documentation.

# Contents

- [Features](#features)
- [Quick Examples](#quick-examples)
- [Setup](#setup)
- [Requirements](#requirements)
- [Tests](#tests)
- [Api](#api)
  - [options](#options)
    - [options.onFail](#optionsonfail)
  - [assert](#assert)
  - [structs](#structs)
  - [unions](#unions)
  - [maybe](#maybe)
  - [enums](#enums)
  - [subtypes](#subtypes)
  - [lists](#lists)
  - [dicts](#dicts)
  - [built-in (immutable) updates](#updates)
  - [functions](#functions)
- [sweet.js macros (experimental)](#macros)

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

```js
var Product = struct({
    name: Str,                  // required string
    desc: maybe(Str),           // optional string, can be null
    home: Url,                  // a subtype of a string
    shippings: list(Str),       // a list of shipping methods
    category: Category,         // enum, one of [audio, video]
    price: Price,               // a price (dollars) OR in another currency
    size: tuple([Num, Num]),    // width x height
    warranty: dict(Str, Num)    // a dictionary country -> covered years
});

var Url = subtype(Str, function (s) {
    return s.indexOf('http://') === 0;
});
var Category = enums.of('audio video');
var ForeignPrice = struct({ currency: Str, amount: Num });
var Price = union([Num, ForeignPrice]);
Price.dispatch = function (x) {
  return Num.is(x) ? Num : ForeignPrice;
};

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

```js
// your code: plain old JavaScript class
function Point (x, y) {
    this.x = x;
    this.y = y;
}

var p = new Point(1, 'a'); // silent error
```

in order to "tcombify" your code you can simply add some asserts

```js
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

This library uses a few ES5 methods, you can use `es5-shim`, `es5-sham` and `json2` to support old browsers

# Tests

Run `mocha` or `npm test` in the project root.

# Api

## options

### options.onFail

In production envs you don't want to leak failures to the user

```js
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

## assert

```js
assert(guard, [message], [values...]);
```

If `guard !== true` the debugger kicks in.

- `guard` boolean condition
- `message` optional string useful for debugging, formatted with values like [util.format in Node](http://nodejs.org/api/util.html#util_util_format_format)

Example

```js
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

```js
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

```js
Point.is(p); // => true
```

### extend(props, [name])

Returns a new type with the additional specified `props`

```js
var Point = struct({
  x: Num,
  y: Num
}, 'Point');

var Point3D = Point.extend({z: Num}, 'Point3D'); // composition, not inheritance

var p = new Point3D({x: 1, y: 2, z: 3});

// `props` can be an array of new props
var Point4D = Point.extend([{z: Num}, {time: Num}], 'Point4D');
```

## unions

```js
union(types, [name])
```

Defines a union of types.

- `types` array of types
- `name` optional string useful for debugging

Example

```js
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

// you must implement the dispatch() function in order to use `Shape` as a contructor
Shape.dispatch = function (x) {
  return x.hasOwnProperty('center') ? Circle : Rectangle;
};

var circle = Shape({center: {x: 1, y: 0}, radius: 10});
var rectangle = Shape({bl: {x: 0, y: 0}, tr: {x: 1, y: 1}});
```

### is(x)

Returns `true` if `x` belongs to the union.

```js
Shape.is(new Circle({center: p, radius: 10})); // => true
```

## maybe

```js
maybe(type, [name])
```

Same as `union([Nil, type])`.

```js
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

```js
var Direction = enums({
    North: 'North',
    East: 'East',
    South: 'South',
    West: 'West'
});
```

### is(x)

Returns `true` if `x` belongs to the enum.

```js
Direction.is('North'); // => true
```
### enums.of(keys, [name])

Returns an enums of an array of keys, useful when you don't mind to define
custom values for the enums.

- `keys` array (or string) of keys
- `name` optional string useful for debugging

Example

```js
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

```js
var Area = tuple([Num, Num]);

// constructor usage, area is immutable
var area = Area([1, 2]);
```

0-tuples and 1-tuples are also supported

```js
var Nothing = tuple([]);
var JustNum = tuple([Num]);
```

### is(x)

Returns `true` if `x` belongs to the tuple.

```js
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

```js
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

```js
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

```js
var Path = list(Point);

// costructor usage, path is immutable
var path = Path([
    {x: 0, y: 0},
    {x: 1, y: 1}
]);
```

### is(x)

Returns `true` if `x` belongs to the list.

```js
var p1 = Point({x: 0, y: 0});
var p2 = Point({x: 1, y: 2});
Path.is([p1, p2]); // => true
```

## dicts

```js
dict(domain, codomain, [name])
```

Defines a dictionary domain -> codomain.

- `domain` the type of the keys
- `codomain` the type of the values
- `name` optional string useful for debugging

Example

```js
// defines a dictionary of numbers
var Tel = dict(Str, Num);
```

### is(x)

Returns `true` if `x` is an instance of the dict.

```js
Tel.is({'jack': 4098, 'sape': 4139}); // => true
```

## Updates

```js
Type.update(instance, spec)
```

The following commands are compatible with the [Facebook Immutability Helpers](http://facebook.github.io/react/docs/update.html).

- $push
- $unshift
- $splice
- $set
- $apply
- $merge

### Removing a value form a dict

`{$remove: keys}`

```js
var Type = dict(Str, Num);
var instance = Type({a: 1, b: 2});
var updated = Type.update(instance, {$remove: ['a']}); // => {b: 2}
```

### Swapping two list elements

`{$swap: {from: number, to: number}}`

```js
var Type = list(Num);
var instance = Type([1, 2, 3, 4]);
var updated = Type.update(instance, {'$swap': {from: 1, to: 2}}); // => [1, 3, 2, 4]
```

### Adding other commands

You can add your custom commands updating the `util.update.commands` hash.

## functions

Typed functions may be defined like this:

```js
// add takes two `Num`s and returns a `Num`
var add = func([Num, Num], Num)
    .of(function (x, y) { return x + y; });
```

And used like this:

```js
add("Hello", 2); // Raises error: Invalid `Hello` supplied to `Num`
add("Hello");    // Raises error: Invalid `Hello` supplied to `Num`

add(1, 2);       // Returns: 3
add(1)(2);       // Returns: 3
```

### func(A, B, [name])

```js
func(Domain, Codomain, name)
```

Returns a function type whose functions have their domain and codomain specified and constrained.

- `Domain`: the type of the function's argument (or `list` of types of the function's arguments)
- `Codomain`: the type of the function's return value
- `name`: optional string useful for debugging

`func` can be used to define function types using native types:

```js
// An `A` takes a `Str` and returns an `Num`
var A = func(Str, Num);
```

The domain and codomain can also be specified using types from any combinator including `func`:

```js
// A `B` takes a `Func` (which takes a `Str` and returns a `Num`) and returns a `Str`.
var B = func(func(Str, Num), Str);

// An `ExcitedStr` is a `Str` containing an exclamation mark
var ExcitedStr = subtype(Str, function (s) { return s.indexOf('!') !== -1; }, 'ExcitedStr');

// An `Exciter` takes a `Str` and returns an `ExcitedStr`
var Exciter = func(Str, ExcitedStr);
```

Additionally the domain can be expressed as a `list` of types:

```js
// A `C` takes an `A`, a `B` and a `Str` and returns a `Num`
var C = func([A, B, Str], Num);
```

### .of(f)

```js
func(A, B).of(f);
```

Returns a function where the domain and codomain are typechecked against the function type.

If the function is passed values which are outside of the domain or returns values which are outside of the codomain it will raise an error:

```js
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

```js
// We can reasonably suggest that add has the following type signature
// add : Num -> Num -> Num
var add = func([Num, Num], Num)
    .of(function (x, y) { return x + y });

var addHello = add("Hello"); // As this raises: "Error: Invalid `Hello` supplied to `Num`"

var add2 = add(2);
add2(1); // And this returns: 3
```

### .is(x)

```js
func(A, B).is(x);
```

Returns true if x belongs to the type.

```js
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

# License

The MIT License (MIT)
