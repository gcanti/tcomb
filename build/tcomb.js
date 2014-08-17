//     tcomb 0.0.10
//     https://github.com/gcanti/tcomb
//     (c) 2014 Giulio Canti <giulio.canti@gmail.com>
//     tcomb may be freely distributed under the MIT license.

/**
    # tcomb

    tcomb is a library for Node.js and the browser which allows you to **check the types** of JavaScript values at runtime with a simple syntax. It is great for checking external input, for testing and for **adding safety** to your internal code. 

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
    3. `T` owns a static function `T.is(x)` returning `true` if `x` is a instance of `T`

    **Note**: 2. implies that `T` can be used as a default JSON decoder

    ## Api
**/

(function (root, factory) {
  'use strict';
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.t = factory();
  }
}(this, function () {

    'use strict';

    // rigger includes (https://github.com/buildjs/rigger)
    // to view the full library code check out build/tcomb.js

    /**
        ### options
    
        #### function `options.onFail`
    
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
    
        #### function `options.update`
    
        TODO: better docs
    
        Adds to structs, tuples and lists a static method `update` that returns a new instance
        without modifying the original.
    
        Example
    
        ```javascript
        // see http://facebook.github.io/react/docs/update.html
        options.update = React.addons.update;
        var p1  = Point({x: 0, y: 0});
        var p2 = Point.update(p1, {x: {$set: 1}}); // => Point({x: 1, y: 0})
        ```
    **/
    
    var failed = false;
    
    function onFail(message) {
      // start debugger only once
      if (!failed) {
        /*jshint debug: true*/
        debugger; 
      }
      failed = true;
      throw new Error(message);
    }
    
    var options = {
      onFail: onFail,
      update: null
    };

    /**
        ### assert(guard, [message], [values...]);
    
        If `guard !== true` the debugger kicks in.
    
        - `guard` boolean condition
        - `message` optional string useful for debugging, formatted with values like [util.format in Node][http://nodejs.org/api/util.html#util_util_format_format]
    
        Example
    
        ```javascript
        assert(1 === 2); // throws 'assert(): failed'
        assert(1 === 2, 'error!'); // throws 'error!'
        assert(1 === 2, 'error: %s !== %s', 1, 2); // throws 'error: 1 !== 2'
        ```
    
        To customize failure behaviuor, see `options.onFail`.
    **/
    
    function fail(message) {
      options.onFail(message);
    }
    
    function assert(guard) {
      if (guard !== true) {
        var args = slice.call(arguments, 1);
        var message = args[0] ? format.apply(null, args) : 'assert(): failed';
        fail(message); 
      }
    }

    //
    // utils
    //
    
    var slice = Array.prototype.slice;
    
    var errs = {
      ERR_OPTIONS_UPDATE_MISSING: '`options.update` is missing',
      ERR_NEW_OPERATOR_FORBIDDEN: '`new` operator is forbidden for `%s`'
    };
    
    function mixin(target, source, overwrite) {
      for (var k in source) {
        if (source.hasOwnProperty(k)) {
          if (!overwrite) {
            assert(!target.hasOwnProperty(k), 'cannot overwrite property %s', k);
          }
          target[k] = source[k];
        }
      }
      return target;
    }
    
    function format() {
      var args = slice.call(arguments);
      var len = args.length;
      var i = 1;
      var message = args[0];
    
      function formatArgument(match, type) {
        if (match === '%%') { return '%'; }       // handle escaping %
        if (i >= len) { return match; }           // handle less arguments than placeholders
        var formatter = format.formatters[type];
        if (!formatter) { return match; }         // handle undefined formatters
        return formatter(args[i++]);
      }
    
      var str = message.replace(/%([a-z%])/g, formatArgument);
      if (i < len) {
        str += ' ' + args.slice(i).join(' ');     // handle more arguments than placeholders
      }
      return str;
    }
    
    format.formatters = {
      s: function (x) { return String(x); },
      j: function (x) { return JSON.stringify(x); }
    };
    
    function isType(T) {
      return Func.is(T) && Obj.is(T.meta);
    }
    
    function getName(T) {
      assert(isType(T), 'bad type');
      return T.meta.name;
    }
    
    // since in tcomb the only real constructors are those provided
    // by `struct()`, the `new` operator is forbidden for all types
    function forbidNewOperator(x, T) {
      assert(!(x instanceof T), errs.ERR_NEW_OPERATOR_FORBIDDEN, getName(T));
    }
    
    function update() {
      assert(Func.is(options.update), errs.ERR_OPTIONS_UPDATE_MISSING);
      /*jshint validthis:true*/
      var T = this;
      var args = slice.call(arguments);
      var value = options.update.apply(T, args);
      return T(value);
    }

    /**
        ### Any(value, [mut])
    
        Because sometimes you really gonna need it.
    
            Any.is(..whatever..); // => true
    **/
    
    function Any(value) {
      forbidNewOperator(this, Any);
      return value;
    }
    
    Any.meta = {
      kind: 'any',
      name: 'Any'
    };
    
    Any.is = function () { return true; };

    //
    // primitives
    //
    
    function primitive(name, is) {
    
      function Primitive(value) {
        forbidNewOperator(this, Primitive);
        assert(Primitive.is(value), 'bad %s', name);
        // all primitives types are idempotent
        return value;
      }
    
      Primitive.meta = {
        kind: 'primitive',
        name: name
      };
    
      Primitive.is = is;
    
      return Primitive;
    }
    
    var Nil = primitive('Nil', function (x) {
      return x === null || x === undefined;
    });
    
    var Str = primitive('Str', function (x) {
      return typeof x === 'string';
    });
    
    var Num = primitive('Num', function (x) {
      return typeof x === 'number' && isFinite(x) && !isNaN(x);
    });
    
    var Bool = primitive('Bool', function (x) {
      return x === true || x === false;
    });
    
    var Arr = primitive('Arr', function (x) {
      return x instanceof Array;
    });
    
    var Obj = primitive('Obj', function (x) {
      return !Nil.is(x) && typeof x === 'object' && !Arr.is(x);
    });
    
    var Func = primitive('Func', function (x) {
      return typeof x === 'function';
    });
    
    var Err = primitive('Err', function (x) {
      return x instanceof Error;
    });
    
    var Re = primitive('Re', function (x) {
      return x instanceof RegExp;
    });
    
    var Dat = primitive('Dat', function (x) {
      return x instanceof Date;
    });

    /**
        ### struct(props, [name])
    
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
    
        #### is(x)
    
        Returns `true` if `x` is an instance of the struct.
    
        ```javascript
        Point.is(p); // => true
        ```
    **/
    
    function struct(props, name) {
    
      name = name || 'struct()';
    
      function Struct(value, mut) {
    
        // make `new` optional
        if (!(this instanceof Struct)) { 
          return new Struct(value, mut); 
        }
        assert(Obj.is(value), 'bad %s', name);
    
        for (var k in props) {
          if (props.hasOwnProperty(k)) {
            var T = props[k];
            var v = value[k];
            this[k] = T.is(v) ? v : T(v, mut);
          }
        }
    
        if (!mut) { 
          Object.freeze(this); 
        }
      }
    
      Struct.meta = {
        kind: 'struct',
        props: props,
        name: name
      };
    
      Struct.is = function (x) { 
        return x instanceof Struct; 
      };
    
      Struct.update = update;
    
      return Struct;
    }

    /**
        ### union(types, [name])
    
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
    
        #### is(x)
    
        Returns `true` if `x` belongs to the union.
    
        ```javascript
        Shape.is(Circle({center: p, radius: 10})); // => true
        ```
    **/
    
    function union(Ts, name) {
    
      name = name || format('union(%s)', Ts.map(getName).join(', '));
    
      function Union(value, mut) {
        forbidNewOperator(this, Union);
        assert(Func.is(Union.dispatch), 'unimplemented %s.dispatch()', name);
        var T = Union.dispatch(value);
        return T(value, mut);
      }
    
      Union.meta = {
        kind: 'union',
        types: Ts,
        name: name
      };
    
      Union.is = function (x) {
        return Ts.some(function (T) {
          return T.is(x);
        });
      };
    
      return Union;
    }

    /**
        ### maybe(type, [name])
    
        Same as `union([Nil, type])`.
    
        ```javascript
        // the value of a radio input where null = no selection
        var Radio = maybe(Str);
    
        Radio.is('a');     // => true
        Radio.is(null);    // => true
        Radio.is(1);       // => false
        ```    
    **/
    
    function maybe(T, name) {
    
      assert(isType(T), 'bad type');
    
      // makes the combinator idempotent
      if (T.meta.kind === 'maybe') {
        return T;
      }
    
      name = name || format('maybe(%s)', getName(T));
    
      function Maybe(value, mut) {
        forbidNewOperator(this, Maybe);
        // a maybe type is idempotent iif T is idempotent
        return Nil.is(value) ? null : T(value, mut);
      }
    
      Maybe.meta = {
        kind: 'maybe',
        type: T,
        name: name
      };
    
      Maybe.is = function (x) {
        return Nil.is(x) || T.is(x);
      };
    
      return Maybe;
    }

    /**
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
        #### enums.of(keys, [name])
    
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
    **/
    
    function enums(map, name) {
    
      name = name || 'enums()';
    
      function Enums(x) {
        forbidNewOperator(this, Enums);
        assert(Enums.is(x), 'bad %s', name);
        // all enums types are idempotent
        return x;
      }
    
      Enums.meta = {
        kind: 'enums',
        map: map,
        name: name
      };
    
      Enums.is = function (x) {
        return Str.is(x) && map.hasOwnProperty(x);
      };
    
      return Enums;
    }
    
    enums.of = function (keys, name) {
      keys = Str.is(keys) ? keys.split(' ') : keys;
      var value = {};
      keys.forEach(function (k, i) {
        value[k] = i;
      });
      return enums(value, name);
    };

    /**
        ### tuple(types, [name])
    
        Defines a tuple whose coordinates have the specified types.
    
        - `types` array of coordinates types
        - `name` optional string useful for debugging
    
        Example
    
        ```javascript
        var Area = tuple([Num, Num]);
    
        // constructor usage, area is immutable
        var area = Area([1, 2]);
        ```
    
        #### is(x)
    
        Returns `true` if `x` belongs to the tuple.
    
        ```javascript
        Area.is([1, 2]);      // => true
        Area.is([1, 'a']);    // => false, the second element is not a Num
        Area.is([1, 2, 3]);   // => false, too many elements
        ```
    **/
    
    function tuple(Ts, name) {
    
      name = name || format('tuple(%s)', Ts.map(getName).join(', '));
    
      var len = Ts.length;
    
      function Tuple(value, mut) {
    
        forbidNewOperator(this, Tuple);
        assert(Arr.is(value), 'bad %s', name);
    
        var arr = [];
        for (var i = 0 ; i < len ; i++) {
          var T = Ts[i];
          var v = value[i];
          arr.push(T.is(v) ? v : T(v, mut));
        }
    
        if (!mut) { 
          Object.freeze(arr); 
        }
        return arr;
      }
    
      Tuple.meta = {
        kind: 'tuple',
        types: Ts,
        name: name
      };
    
      Tuple.is = function (x) {
        return Arr.is(x) && x.length === len && 
          Ts.every(function (T, i) { 
            return T.is(x[i]); 
          });
      };
    
      Tuple.update = update;
    
      return Tuple;
    }

    /**
        ### subtype(type, predicate, [name])
    
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
    
        #### is(x)
    
        Returns `true` if `x` belongs to the subtype.
    
        ```javascript
        var Int = subtype(Num, function (n) {
            return n === parseInt(n, 10);
        });
    
        Int.is(2);      // => true
        Int.is(1.1);    // => false
        ```
    **/
    
    function subtype(T, predicate, name) {
    
      name = name || format('subtype(%s)', getName(T));
    
      function Subtype(value, mut) {
        forbidNewOperator(this, Subtype);
        // a subtype type is idempotent iif T is idempotent
        var x = T(value, mut);
        assert(predicate(x), 'bad %s', name);
        return x;
      }
    
      Subtype.meta = {
        kind: 'subtype',
        type: T,
        predicate: predicate,
        name: name
      };
    
      Subtype.is = function (x) {
        return T.is(x) && predicate(x);
      };
    
      return Subtype;
    }

    /**
        ### list(type, [name])
    
        Defines an array where all the elements are of type `type`.
    
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
    
        #### is(x)
    
        Returns `true` if `x` belongs to the list.
    
        ```javascript
        var p1 = Point({x: 0, y: 0});
        var p2 = Point({x: 1, y: 2});
        Path.is([p1, p2]); // => true
        ```
    **/
    
    function list(T, name) {
    
      name = name || format('list(%s)', getName(T));
    
      function List(value, mut) {
    
        forbidNewOperator(this, List);
    
        assert(Arr.is(value), 'bad %s', name);
    
        // make lists idempotents
        if (value.every(T.is)) {
          return value;
        }
    
        var arr = [];
        for (var i = 0, len = value.length ; i < len ; i++ ) {
          var v = value[i];
          arr.push(T.is(v) ? v : T(v, mut));
        }
    
        if (!mut) { 
          Object.freeze(arr); 
        }
        return arr;
      }
    
      List.meta = {
        kind: 'list',
        type: T,
        name: name
      };
    
      List.is = function (x) {
        return Arr.is(x) && x.every(T.is);
      };
    
    
      List.update = update;
    
      return List;
    }

    /**
        ### func(Arguments, f, [Return], [name])
    
        **Experimental**. Defines a function where the `arguments` and the return value are checked.
    
        - `Arguments` the type of `arguments`
        - `f` the function to execute
        - `Return` optional, check the type of the return value
        - `name` optional string useful for debugging
    
        Example
    
        ```javascript
        var sum = func(tuple([Num, Num]), function (a, b) {
            return a + b;
        }, Num);
    
        sum(1, 2); // => 3
        sum(1, 'a'); // => fail!
        ```
    **/
    
    function func(Arguments, f, Return, name) {
        
      function g() {
        var args = slice.call(arguments);
    
        // handle optional arguments
        if (args.length < f.length) {
          args.length = f.length; 
        }
    
        args = Arguments.is(args) ? args : Arguments(args);
    
        var r = f.apply(null, args);
    
        if (Return) {
          r = Return.is(r) ? r : Return(r);
        }
    
        return r;
      }
    
      g.is = function (x) { return x === g; };
    
      g.meta = {
        kind: 'func',
        Arguments: Arguments,
        f: f,
        Return: Return,
        name: name
      };
    
      return g;
    }

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