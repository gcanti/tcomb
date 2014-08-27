//     tcomb 0.0.12
//     https://github.com/gcanti/tcomb
//     (c) 2014 Giulio Canti <giulio.canti@gmail.com>
//     tcomb may be freely distributed under the MIT license.

/**
    % tcomb-validation

    ![tcomb logo](http://gcanti.github.io/resources/tcomb/logo.png)

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
        size: tuple([Num, Num])     // width x height
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
        size: [2.4, 4.1]
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
      - `message` optional string useful for debugging, formatted with values like [util.format in Node](http://nodejs.org/api/util.html#util_util_format_format)
  
      Example
  
      ```javascript
      assert(1 === 2); // throws 'assert(): failed'
      assert(1 === 2, 'error!'); // throws 'error!'
      assert(1 === 2, 'error: %s !== %s', 1, 2); // throws 'error: 1 !== 2'
      ```
  
      To customize failure behaviour, see `options.onFail`.
  **/
  
  function fail(message) {
    options.onFail(message);
  }
  
  function assert(guard) {
    if (guard !== true) {
      var args = slice.call(arguments, 1);
      var message = args[0] ? format.apply(null, args) : 'assert failed';
      fail(message); 
    }
  }

  //
  // utils
  //
  
  var slice = Array.prototype.slice;
  
  var errs = {
    ERR_BAD_TYPE_VALUE: 'Invalid type argument `value` of value `%j` supplied to `%s`, expected %s.',
    ERR_BAD_COMBINATOR_ARGUMENT: 'Invalid combinator argument `%s` of value `%j` supplied to `%s`, expected %s.',
    ERR_OPTIONS_UPDATE_MISSING: 'Missing `options.update` implementation',
    ERR_NEW_OPERATOR_FORBIDDEN: 'Operator `new` is forbidden for `%s`'
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
  
  function replacer(key, value) {
    if (typeof value === 'function') {
      return format('Func', value.name);
    }
    return value;
  }
  
  format.formatters = {
    s: function (x) { return String(x); },
    j: function (x) { return JSON.stringify(x, replacer); }
  };
  
  function isType(type) {
    return Func.is(type) && Obj.is(type.meta);
  }
  
  function areTypes(types) {
    return Arr.is(types) && types.every(isType);
  }
  
  function getName(type) {
    assert(isType(type), 'Invalid argument `type` of value `%j` supplied to `getName()`, expected a type.', type);
    return type.meta.name;
  }
  
  function ensureName(name, defaultName, types) {
    if (Nil.is(name)) {
      if (areTypes(types)) {
        return format(types.length > 1 ? '%s([%s])' : '%s(%s)', defaultName, types.map(getName).join(', '));
      }
      return defaultName;
    }
    assert(Str.is(name), errs.ERR_BAD_COMBINATOR_ARGUMENT, 'name', name, defaultName, 'a `maybe(Str)`');
    return name;
  }
  
  // since in tcomb the only real constructors are those provided
  // by `struct`, the `new` operator is forbidden for all types
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

  //
  // Any - Because sometimes you really gonna need it.
  //
  
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
      assert(Primitive.is(value), errs.ERR_BAD_TYPE_VALUE, value, name, format('a `%s`', name));
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
  
    // check combinator args
    name = ensureName(name, 'struct');
    assert(Obj.is(props), errs.ERR_BAD_COMBINATOR_ARGUMENT, 'props', props, name, 'an `Obj`');
  
    function Struct(value, mut) {
  
      assert(Obj.is(value), errs.ERR_BAD_TYPE_VALUE, value, name, 'an `Obj`');
  
      // makes Struct idempotent
      if (Struct.is(value)) {
        return value;
      }
  
      // makes `new` optional
      if (!(this instanceof Struct)) { 
        return new Struct(value, mut); 
      }
      
      for (var k in props) {
        if (props.hasOwnProperty(k)) {
          var type = props[k];
          var v = value[k];
          this[k] = type.is(v) ? v : type(v, mut);
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
  
  function union(types, name) {
  
    // check combinator args
    var combinator = 'union';
    name = ensureName(name, combinator, types);
    assert(areTypes(types) && types.length >= 2, errs.ERR_BAD_COMBINATOR_ARGUMENT, 'types', types, combinator, 'a list(type) of length >= 2');
  
    function Union(value, mut) {
      forbidNewOperator(this, Union);
      assert(Func.is(Union.dispatch), 'unimplemented %s.dispatch()', name);
      var T = Union.dispatch(value);
      // a union type is idempotent iif every T in types is idempotent
      return T(value, mut);
    }
  
    Union.meta = {
      kind: 'union',
      types: types,
      name: name
    };
  
    Union.is = function (x) {
      return types.some(function (T) {
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
  
  function maybe(type, name) {
  
    // check combinator args
    var combinator = 'maybe';
    name = ensureName(name, combinator, [type]);
    assert(isType(type), errs.ERR_BAD_COMBINATOR_ARGUMENT, 'type', type, combinator, 'a type');
  
    // makes the combinator idempotent
    if (type.meta.kind === 'maybe') {
      return type;
    }
  
    function Maybe(value, mut) {
      forbidNewOperator(this, Maybe);
      // a maybe type is idempotent iif type is idempotent
      return Nil.is(value) ? null : type(value, mut);
    }
  
    Maybe.meta = {
      kind: 'maybe',
      type: type,
      name: name
    };
  
    Maybe.is = function (x) {
      return Nil.is(x) || type.is(x);
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
  
    // check combinator args
    name = ensureName(name, 'enums');
    assert(Obj.is(map), errs.ERR_BAD_COMBINATOR_ARGUMENT, 'map', map, name, 'an `Obj`');
  
    // cache expected value
    var expected = 'a valid enum';
  
    function Enums(value) {
      forbidNewOperator(this, Enums);
      assert(Enums.is(value), errs.ERR_BAD_TYPE_VALUE, value, name, expected);
      // all enums types are idempotent
      return value;
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
    keys.forEach(function (k) {
      value[k] = k;
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
  
  function tuple(types, name) {
  
    // check combinator args
    var combinator = 'tuple';
    name = ensureName(name, combinator, types);
    assert(areTypes(types) && types.length >= 2, errs.ERR_BAD_COMBINATOR_ARGUMENT, 'types', types, combinator, 'a list(type) of length >= 2');
  
    // cache types length
    var len = types.length;
    // cache expected value
    var expected = format('a tuple `(%s)`', types.map(getName).join(', '));
  
    function Tuple(value, mut) {
  
      forbidNewOperator(this, Tuple);
      assert(Arr.is(value) && value.length === len, errs.ERR_BAD_TYPE_VALUE, value, name, expected);
  
      // makes Tuple idempotent
      if (Tuple.isTuple(value)) {
        return value;
      }
  
      var arr = [];
      for (var i = 0 ; i < len ; i++) {
        var T = types[i];
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
      types: types,
      name: name
    };
  
    Tuple.isTuple = function (x) {
      return types.every(function (type, i) { 
        return type.is(x[i]); 
      });
    };
  
    Tuple.is = function (x) {
      return Arr.is(x) && x.length === len && Tuple.isTuple(x);
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
      **Note**. You can't add methods to `Q1Point` `prototype`, add them to the supertype `prototype` if needed.
  
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
  
  function subtype(type, predicate, name) {
  
    // check combinator args
    var combinator = 'subtype';
    name = ensureName(name, combinator, [type]);
    assert(isType(type), errs.ERR_BAD_COMBINATOR_ARGUMENT, 'type', type, combinator, 'a type');
    assert(Func.is(predicate), errs.ERR_BAD_COMBINATOR_ARGUMENT, 'predicate', predicate, combinator, 'a `Func`');
  
    // cache expected value
    var expected = predicate.__doc__ || 'a valid value for the predicate';
  
    function Subtype(value, mut) {
      forbidNewOperator(this, Subtype);
      // a subtype type is idempotent iif T is idempotent
      var x = type(value, mut);
      assert(predicate(x), errs.ERR_BAD_TYPE_VALUE, value, name, expected);
      return x;
    }
  
    Subtype.meta = {
      kind: 'subtype',
      type: type,
      predicate: predicate,
      name: name
    };
  
    Subtype.is = function (x) {
      return type.is(x) && predicate(x);
    };
  
    /* fix #22
    if (type.meta.kind === 'struct') {
      // keep a reference to prototype to easily define new methods and attach them to supertype
      Subtype.prototype = type.prototype;
    }
    */
  
    return Subtype;
  }

  /**
      ### list(type, [name])
  
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
  
      #### is(x)
  
      Returns `true` if `x` belongs to the list.
  
      ```javascript
      var p1 = Point({x: 0, y: 0});
      var p2 = Point({x: 1, y: 2});
      Path.is([p1, p2]); // => true
      ```
  **/
  
  function list(type, name) {
  
    // check combinator args
    var combinator = 'list';
    name = ensureName(name, combinator, [type]);
    assert(isType(type), errs.ERR_BAD_COMBINATOR_ARGUMENT, 'type', type, combinator, 'a type');
  
    // cache expected value
    var expected = format('a list of `%s`', getName(type));
  
    function List(value, mut) {
  
      forbidNewOperator(this, List);
      assert(Arr.is(value), errs.ERR_BAD_TYPE_VALUE, value, name, expected);
  
      // makes List idempotent
      if (List.isList(value)) {
        return value;
      }
  
      var arr = [];
      for (var i = 0, len = value.length ; i < len ; i++ ) {
        var v = value[i];
        arr.push(type.is(v) ? v : type(v, mut));
      }
  
      if (!mut) { 
        Object.freeze(arr); 
      }
      return arr;
    }
  
    List.meta = {
      kind: 'list',
      type: type,
      name: name
    };
  
    List.isList = function (x) {
      return x.every(type.is);
    };
  
    List.is = function (x) {
      return Arr.is(x) && List.isList(x);
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
  
    name = name || 'func()';
    assert(isType(Arguments), errs.ERR_BAD_COMBINATOR_ARGUMENT, 'Arguments', Arguments, name, 'a type');
    assert(Func.is(f), errs.ERR_BAD_COMBINATOR_ARGUMENT, 'f', f, name, 'a `Func`');
    assert(Nil.is(Return) || isType(Return), errs.ERR_BAD_COMBINATOR_ARGUMENT, 'Return', Return, name, 'a type');
  
    // makes the combinator idempotent
    Return = Return || null;
    if (isType(f) && f.meta.Arguments === Arguments && f.meta.Return === Return) {
      return f;
    }
  
    function fn() {
  
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
  
    fn.is = function (x) { 
      return x === fn; 
    };
  
    fn.meta = {
      kind: 'func',
      Arguments: Arguments,
      f: f,
      Return: Return,
      name: name
    };
  
    return fn;
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
    slice: slice,
    
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