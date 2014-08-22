/**
    # tcomb

    tcomb is a library for Node.js and the browser (2K gzipped) which allows you to **check the types** of 
    JavaScript values at runtime with a simple syntax. It is great for checking external input, 
    for testing and for **adding safety** to your internal code. 

    Some features include:

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
    - function type (experimental)

    ## Quick Examples

    Let's build a product model

    ```javascript
    var Product = struct({
        name: Str,                  // required string
        desc: maybe(Str),           // optional string, can be null
        home: Url,                  // a subtype of a string
        shippings: list(Str),       // a list of shipping methods
        category: Category,         // enum, one of [audio, video]
        price: union(Num, Price),   // a price (dollars) OR in another currency
        dim: tuple([Num, Num])      // dimensions (width, height)
    });

    var Url = subtype(Str, function (s) {
        return s.indexOf('http://') === 0;
    });

    var Category = enums({ audio: 0, video: 1 });

    var Price = struct({ currency: Str, amount: Num });

    // JSON of a product
    var json = {
        name: 'iPod',
        desc: 'Engineered for maximum funness.',
        home: 'http://www.apple.com/ipod/',
        shippings: ['Same Day', 'Next Businness Day'],
        category: 'audio',
        price: {currency: 'EUR', amount: 100},
        dim: [2.4, 4.1]
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

    ## Setup

    Node

        npm install tcomb

    Browser

        bower install tcomb

    or download the `build/tcomb.min.js` file.

    ### Requirements

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

    ## Tests

    Run `mocha` or `npm test` in the project root.

    ## The Idea

    What's a type? In tcomb a type is a function `T` such that

    1. `T` has signature `T(value, [mut])` where `value` depends on the nature of `T` and the optional boolean `mut` makes the instance mutable (default `false`)
    2. `T` is idempotent: `T(T(value, mut), mut) === T(value, mut)`
    3. `T` owns a static function `T.is(x)` returning `true` if `x` is an instance of `T`

    **Note**: 2. implies that `T` can be used as a default JSON decoder

    ## Api
**/

(function (root, factory) {
  'use strict';
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else if (root.angular) {
		root.angular.module('tcomb', [])
		.factory('tcomb', function() {
		  return factory();
		});
  } else {
    root.t = factory();
  }
}(this, function () {

  'use strict';

  // rigger includes (https://github.com/buildjs/rigger)
  // to view the full library code check out build/tcomb.js

  //= options.js

  //= assert.js

  //= utils.js

  //= any.js

  //= primitive.js

  //= struct.js

  //= union.js

  //= maybe.js

  //= enums.js

  //= tuple.js

  //= subtype.js

  //= list.js

  //= func.js

  return {
    errs: errs,
    options: options,
    assert: assert,
    mixin: mixin,
    format: format,
    isType: isType,
    getName: getName,
    fail: fail,
    
    Any: Any,
    Nil: Nil,
    Str: Str,
    Num: Num,
    Bool: Bool,
    Arr: Arr,
    Obj: Obj,
    Func: Func,
    Err: Err,
    Re: Re,
    Dat: Dat,

    struct: struct,
    enums: enums,
    union: union,
    maybe: maybe,
    tuple: tuple,
    subtype: subtype,
    list: list,
    func: func
  };
}));

/**
    ## IDEAS

    - explore generating UI based on domain models written with tcomb
    - explore auto validation of UI involving domain models written with tcomb
    - explore using tcomb with React.js

    ## Contribution

    If you do have a contribution for the package feel free to put up a Pull Request or open an Issue.

    ## License (MIT)

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
**/

