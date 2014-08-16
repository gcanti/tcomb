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

    // get an immutable instance
    var ipod = new Product(json);
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

    - `Array#forEach()`
    - `Array#map()`
    - `Array#some()`
    - `Array#every()`
    - `Object#keys()`
    - `JSON.stringify()`

    you can use `es5-shim` and `json2` to support old browsers

    ```html
    <!--[if lt IE 9]>
    <script src="json2.js"></script>
    <script src="es5-shim.min.js"></script>
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

    1. `T` has signature `T(values, [mut])` where `values` depends on the nature of `T` and the optional boolean `mut` makes the instance mutable (default `false`)
    2. `T` is idempotent: `new T(new T(values)) "equals" new T(values)`
    3. `T` owns a static function `T.is(x)` returning `true` if `x` is a instance of `T`

    **Note**: 2. implies that `T` can be used as a default JSON decoder

    ## Api
**/

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.t = factory();
  }
}(this, function () {

    "use strict";

    // rigger includes (https://github.com/buildjs/rigger)

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
    
        Add to structs, tuples and lists a static method `update` that returns a new instance
        without modifying the original.
    
        Example
    
        ```javascript
        // see http://facebook.github.io/react/docs/update.html
        options.update = React.addons.update;
        var p1  = new Point({x: 0, y: 0});
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
    
    function getName(type) {
      assert(Obj.is(type.meta), 'missing type meta hash');
      return type.meta.name;
    }
    
    function format() {
      var args = slice.call(arguments);
      var len = args.length;
      var i = 1;
      var message = args[0];
      var str = message.replace(/%([a-z%])/g, function(match, type) {
        if (match === '%%') { return '%'; }       // handle escaping %
        if (i >= len) { return match; }           // handle less arguments than placeholders
        var formatter = format.formatters[type];
        if (!formatter) { return match; }         // handle undefined formatters
        return formatter(args[i++]);
      });
      if (i < len) {
        str += ' ' + args.slice(i).join(' ');     // handle more arguments than placeholders
      }
      return str;
    }
    
    format.formatters = {
      s: function (x) { return String(x); },
      j: function (x) { return JSON.stringify(x); }
    };
    
    function coerce(type, values, mut) {
      return type.meta.ctor ?
          /*jshint newcap: false*/
          new type(values, mut) :
          type(values, mut);
    }
    
    function update() {
      assert(Func.is(options.update), 'options.update is missing');
      /*jshint validthis:true*/
      var Type = this;
      var args = slice.call(arguments);
      var values = options.update.apply(Type, args);
      return coerce(Type, values);
    }

    /**
        ### Any(values, [mut])
    
        Because sometimes you really gonna need it.
    
            Any.is(..whatever..); // => true
    **/
    
    function Any(values) {
      assert(!(this instanceof Any), 'cannot use new with Any');
      return values;
    }
    
    Any.meta = {
      kind: 'any',
      name: 'Any',
      ctor: false
    };
    
    Any.is = function () { return true; };

    //
    // primitives
    //
    
    function primitive(name, is) {
    
      function Primitive(values) {
        assert(!(this instanceof Primitive), 'cannot use new with %s', name);
        assert(Primitive.is(values), 'bad %s', name);
        return values;
      }
    
      Primitive.meta = {
        kind: 'primitive',
        name: name,
        ctor: false
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
      return !Nil.is(x) && x.constructor === Object && !Arr.is(x);
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
        var p = new Point({x: 1, y: 2});
    
        p.x = 2; // => TypeError
    
        p = new Point({x: 1, y: 2}, true); // now p is mutable
    
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
    
      function Struct(values, mut) {
    
        assert(Obj.is(values), 'bad %s', name);
    
        for (var prop in props) {
          if (props.hasOwnProperty(prop)) {
            var Type = props[prop],
              value = values[prop];
            this[prop] = Type.is(value) ? value : coerce(Type, value, mut);
          }
        }
    
        if (!mut) { Object.freeze(this); }
      }
    
      Struct.meta = {
        kind: 'struct',
        props: props,
        name: name,
        ctor: true
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
        Shape.is(new Circle({center: p, radius: 10})); // => true
        ```
    **/
    
    function union(types, name) {
    
      name = name || format('union(%s)', types.map(getName).join(', '));
    
      function Union(values, mut) {
        assert(Func.is(Union.dispatch), 'unimplemented %s.dispatch()', name);
        var Type = Union.dispatch(values);
        if (this instanceof Union) {
          assert(Type.meta.ctor, 'cannot use new with %s', name);
        }
        return coerce(Type, values, mut);
      }
    
      Union.meta = {
        kind: 'union',
        types: types,
        name: name,
        ctor: types.every(function (type) { return type.meta.ctor; })
      };
    
      Union.is = function (x) {
        return types.some(function (type) {
          return type.is(x);
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
    **/
    
    function maybe(Type, name) {
    
      name = name || format('maybe(%s)', getName(Type));
    
      function Maybe(values, mut) {
        assert(!(this instanceof Maybe), 'cannot use new with %s', name);
        return Nil.is(values) ? null : coerce(Type, values, mut);
      }
    
      Maybe.meta = {
        kind: 'maybe',
        type: Type,
        name: name,
        ctor: false // cannot use new with null
      };
    
      Maybe.is = function (x) {
        return Nil.is(x) || Type.is(x);
      };
    
      return Maybe;
    }

    /**
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
        assert(Enums.is(x), 'bad %s', name);
        assert(!(this instanceof Enums), 'cannot use new with %s', name);
        return x;
      }
    
      Enums.meta = {
        kind: 'enums',
        map: map,
        name: name,
        ctor: false
      };
    
      Enums.is = function (x) {
        return Str.is(x) && map.hasOwnProperty(x);
      };
    
      return Enums;
    }
    
    enums.of = function (keys, name) {
      keys = Str.is(keys) ? keys.split(' ') : keys;
      var values = {};
      keys.forEach(function (k, i) {
        values[k] = i;
      });
      return enums(values, name);
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
        var area = new Area([1, 2]);
        ```
    
        #### is(x)
    
        Returns `true` if `x` belongs to the tuple.
    
        ```javascript
        Area.is([1, 2]);      // => true
        Area.is([1, 'a']);    // => false, the second element is not a Num
        Area.is([1, 2, 3]);   // => false, too many elements
        ```
    **/
    
    function tuple(types, name) {
    
      name = name || format('tuple(%s)', types.map(getName).join(', '));
    
      var len = types.length;
    
      function Tuple(values, mut) {
    
        assert(Arr.is(values), 'bad %s', name);
    
        var arr = [];
        for (var i = 0 ; i < len ; i++) {
          var Type = types[i];
          var value = values[i];
          arr.push(Type.is(value) ? value : coerce(Type, value, mut));
        }
    
        if (!mut) { Object.freeze(arr); }
        return arr;
      }
    
      Tuple.meta = {
        kind: 'tuple',
        types: types,
        name: name,
        ctor: true
      };
    
      Tuple.is = function (x) {
        return Arr.is(x) && x.length === len && 
          types.every(function (type, i) { 
            return type.is(x[i]); 
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
    **/
    
    function subtype(Type, predicate, name) {
    
      name = name || format('subtype(%s)', getName(Type));
    
      function Subtype(values, mut) {
        if (this instanceof Subtype) {
          assert(Subtype.meta.ctor, 'cannot use new with %s', name);
        }
        var x = coerce(Type, values, mut);
        assert(predicate(x), 'bad %s', name);
        return x;
      }
    
      Subtype.meta = {
        kind: 'subtype',
        type: Type,
        predicate: predicate,
        name: name,
        ctor: Type.meta.ctor
      };
    
      Subtype.is = function (x) {
        return Type.is(x) && predicate(x);
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
    **/
    
    function list(Type, name) {
    
      name = name || format('list(%s)', getName(Type));
    
      function List(values, mut) {
    
        assert(Arr.is(values), 'bad %s', name);
    
        var arr = [];
        for (var i = 0, len = values.length ; i < len ; i++ ) {
          var value = values[i];
          arr.push(Type.is(value) ? value : coerce(Type, value, mut));
        }
    
        if (!mut) { Object.freeze(arr); }
        return arr;
      }
    
      List.meta = {
        kind: 'list',
        type: Type,
        name: name,
        ctor: true
      };
    
      List.is = function (x) {
        return Arr.is(x) && x.every(Type.is);
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
        if (args.length < f.length) args.length = f.length; // handle optional arguments
    
        args = Arguments.is(args) ? args : coerce(Arguments, args);
    
        var r = f.apply(null, args);
    
        if (Return) {
          r = Return.is(r) ? r : coerce(Return, r);
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

        options: options,

        assert: assert,
        mixin: mixin,
        format: format,
        coerce: coerce,
        getName: getName,
        
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