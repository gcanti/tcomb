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

  var failed = false;
  
  function onFail(message) {
    // start debugger only once
    if (!failed) {
      /*
        DEBUG HINT:
        if you are reading this, chances are that there is a bug in your system
        see the Call Stack to find out what's wrong..
      */
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

  function fail(message) {
    /*
      DEBUG HINT:
      if you are reading this, chances are that there is a bug in your system
      see the Call Stack to find out what's wrong..
    */
    options.onFail(message);
  }
  
  function assert(guard) {
    if (guard !== true) {
      var args = slice.call(arguments, 1);
      var message = args[0] ? format.apply(null, args) : 'assert failed';
      /*
        DEBUG HINT:
        if you are reading this, chances are that there is a bug in your system
        see the Call Stack to find out what's wrong..
      */
      fail(message); 
    }
  }

  //
  // utils
  //
  
  var slice = Array.prototype.slice;
  
  function mixin(target, source, overwrite) {
    if (Nil.is(source)) {
      return target;
    }
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

  function merge() {
    return Array.prototype.reduce.call(arguments, function (x, y) {
      return mixin(x, y, true);
    }, {});
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
  
  function getName(type) {
    assert(Type.is(type), 'Invalid argument `type` of value `%j` supplied to `getName()`, expected a type.', type);
    return type.meta.name;
  }

  function getKind(type) {
    assert(Type.is(type), 'Invalid argument `type` of value `%j` supplied to `geKind()`, expected a type.', type);
    return type.meta.kind;
  }

  function blockNew(x, type) {
    assert(!(x instanceof type), 'Operator `new` is forbidden for `%s`', getName(type));
  }
  
  function update() {
    assert(Func.is(options.update), 'Missing `options.update` implementation');
    /*jshint validthis:true*/
    var T = this;
    var value = options.update.apply(T, arguments);
    return T(value);
  }

  //
  // irriducibles
  //
  
  function irriducible(name, is) {
  
    // DEBUG HINT: if the debugger stops here, the first argument is not a string
    assert(typeof name === 'string', 'Invalid argument `name` supplied to `irriducible()`');

    // DEBUG HINT: if the debugger stops here, the second argument is not a function
    assert(typeof is === 'function', 'Invalid argument `is` supplied to `irriducible()`');

    function Irriducible(value) {

      // DEBUG HINT: if the debugger stops here, you have used the `new` operator but it's forbidden
      blockNew(this, Irriducible);

      // DEBUG HINT: if the debugger stops here, the first argument is invalid
      // mouse over the `value` variable to see what's wrong. In `name` there is the name of the type
      assert(is(value), 'Invalid `%s` supplied to `%s`', value, name);
      
      return value;
    }
  
    Irriducible.meta = {
      kind: 'irriducible',
      name: name
    };
  
    Irriducible.is = is;
  
    return Irriducible;
  }

  var Any = irriducible('Any', function () {
    return true;
  });
  
  var Nil = irriducible('Nil', function (x) {
    return x === null || x === void 0;
  });
  
  var Str = irriducible('Str', function (x) {
    return typeof x === 'string';
  });
  
  var Num = irriducible('Num', function (x) {
    return typeof x === 'number' && isFinite(x) && !isNaN(x);
  });
  
  var Bool = irriducible('Bool', function (x) {
    return x === true || x === false;
  });
  
  var Arr = irriducible('Arr', function (x) {
    return x instanceof Array;
  });
  
  var Obj = irriducible('Obj', function (x) {
    return !Nil.is(x) && typeof x === 'object' && !Arr.is(x);
  });
  
  var Func = irriducible('Func', function (x) {
    return typeof x === 'function';
  });
  
  var Err = irriducible('Err', function (x) {
    return x instanceof Error;
  });
  
  var Re = irriducible('Re', function (x) {
    return x instanceof RegExp;
  });
  
  var Dat = irriducible('Dat', function (x) {
    return x instanceof Date;
  });

  var Type = irriducible('Type', function (x) {
    return Func.is(x) && Obj.is(x.meta);
  });
  
  function struct(props, name) {
  
    // DEBUG HINT: if the debugger stops here, the first argument is not a dict of types
    // mouse over the `props` variable to see what's wrong
    assert(dict(Type).is(props), 'Invalid argument `props` supplied to `struct()`');

    // DEBUG HINT: if the debugger stops here, the second argument is not a string
    // mouse over the `name` variable to see what's wrong
    assert(maybe(Str).is(name), 'Invalid argument `name` supplied to `struct()`');

    // DEBUG HINT: always give a name to a type, the debug will be easier
    name = name || 'struct';
  
    function Struct(value, mut) {
  
      // makes Struct idempotent
      if (Struct.is(value)) {
        return value;
      }
  
      // DEBUG HINT: if the debugger stops here, the first argument is invalid
      // mouse over the `value` variable to see what's wrong. In `name` there is the name of the type
      assert(Obj.is(value), 'Invalid `%s` supplied to `%s`, expected an `Obj`', value, name);
  
      // makes `new` optional
      if (!(this instanceof Struct)) { 
        return new Struct(value, mut); 
      }
      
      for (var k in props) {
        if (props.hasOwnProperty(k)) {
          var expected = props[k];
          var actual = value[k];
          // DEBUG HINT: if the debugger stops here, the `actual` value supplied to the `expected` type is invalid
          // mouse over the `actual` and `expected` variables to see what's wrong
          this[k] = expected(actual, mut);
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

  function union(types, name) {
  
    // DEBUG HINT: if the debugger stops here, the first argument is not a list of types
    assert(list(Type).is(types), 'Invalid argument `types` supplied to `union()`');

    var len = types.length;

    // DEBUG HINT: if the debugger stops here, there are too few types (they must be at least two)
    assert(len >= 2, 'Invalid argument `types` supplied to `union()`');

    // DEBUG HINT: if the debugger stops here, the second argument is not a string
    // mouse over the `name` variable to see what's wrong
    assert(maybe(Str).is(name), 'Invalid argument `name` supplied to `union()`');

    name = name || format('union([%s])', types.map(getName).join(', '));

    function Union(value, mut) {

      // DEBUG HINT: if the debugger stops here, you have used the `new` operator but it's forbidden
      blockNew(this, Union);
      
      // DEBUG HINT: if the debugger stops here, you must implement the `dispatch` static method for this type
      assert(Func.is(Union.dispatch), 'unimplemented %s.dispatch()', name);

      var type = Union.dispatch(value);

      // DEBUG HINT: if the debugger stops here, the `dispatch` static method returns no type
      assert(Type.is(type), '%s.dispatch() returns no type', name);
      
      // DEBUG HINT: if the debugger stops here, `value` can't be converted to `type`
      // mouse over the `value` and `type` variables to see what's wrong
      return type(value, mut);
    }
  
    Union.meta = {
      kind: 'union',
      types: types,
      name: name
    };
  
    Union.is = function (x) {
      return types.some(function (type) {
        return type.is(x);
      });
    };
  
    // default dispatch implementation
    Union.dispatch = function (x) {
      for (var i = 0, len = types.length ; i < len ; i++ ) {
        if (types[i].is(x)) {
          return types[i];
        }
      }
    };

    return Union;
  }

  function maybe(type, name) {
  
    // DEBUG HINT: if the debugger stops here, the first argument is not a type
    assert(Type.is(type), 'Invalid argument `type` supplied to `maybe()`');
  
    // makes the combinator idempotent
    if (getKind(type) === 'maybe') {
      return type;
    }

    // DEBUG HINT: if the debugger stops here, the second argument is not a string
    // mouse over the `name` variable to see what's wrong
    assert(Nil.is(name) || Str.is(name), 'Invalid argument `name` supplied to `maybe()`');
  
    name = name || format('maybe(%s)', getName(type));

    function Maybe(value, mut) {

      // DEBUG HINT: if the debugger stops here, you have used the `new` operator but it's forbidden
      blockNew(this, Maybe);
      
      // DEBUG HINT: if the debugger stops here, `value` can't be converted to `type`
      // mouse over the `value` and `type` variables to see what's wrong
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

  function enums(map, name) {
  
    // DEBUG HINT: if the debugger stops here, the first argument is not a hash
    // mouse over the `map` variable to see what's wrong
    assert(Obj.is(map), 'Invalid argument `map` supplied to `enums()`');
  
    // DEBUG HINT: if the debugger stops here, the second argument is not a string
    // mouse over the `name` variable to see what's wrong
    assert(maybe(Str).is(name), 'Invalid argument `name` supplied to `enums()`');

    name = name || 'enums';

    // cache enums
    var keys = Object.keys(map);
  
    function Enums(value) {

      // DEBUG HINT: if the debugger stops here, you have used the `new` operator but it's forbidden
      blockNew(this, Enums);

      // DEBUG HINT: if the debugger stops here, the value is not one of the defined enums
      // mouse over the `value`, `name` and `keys` variables to see what's wrong
      assert(Enums.is(value), 'Invalid `%s` supplied to `%s`, expected one of %j', value, name, keys);
      
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

  function tuple(types, name) {

    // DEBUG HINT: if the debugger stops here, the first argument is not a list of types
    assert(list(Type).is(types), 'Invalid argument `types` supplied to `tuple()`');

    var len = types.length;

    // DEBUG HINT: if the debugger stops here, the second argument is not a string
    // mouse over the `name` variable to see what's wrong
    assert(maybe(Str).is(name), 'Invalid argument `name` supplied to `tuple()`');

    name = name || format('tuple([%s])', types.map(getName).join(', '));
  
    function Tuple(value, mut) {
  
      // DEBUG HINT: if the debugger stops here, the value is not one of the defined enums
      // mouse over the `value`, `name` and `len` variables to see what's wrong
      assert(Arr.is(value) && value.length === len, 'Invalid `%s` supplied to `%s`, expected an `Arr` of length `%s`', value, name, len);
  
      // makes Tuple idempotent
      if (Tuple.isTuple(value)) {
        return value;
      }
  
      var arr = [];
      for (var i = 0 ; i < len ; i++) {
        var expected = types[i];
        var actual = value[i];
        // DEBUG HINT: if the debugger stops here, the `actual` value supplied to the `expected` type is invalid
        // mouse over the `actual` and `expected` variables to see what's wrong
        arr.push(expected(actual, mut));
      }
  
      if (!mut) { 
        Object.freeze(arr); 
      }
      return arr;
    }
  
    Tuple.meta = {
      kind: 'tuple',
      types: types,
      length: len,
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

  function subtype(type, predicate, name) {
  
    // DEBUG HINT: if the debugger stops here, the first argument is not a type
    assert(Type.is(type), 'Invalid argument `type` supplied to `subtype()`');
    
    // DEBUG HINT: if the debugger stops here, the second argument is not a function
    assert(Func.is(predicate), 'Invalid argument `predicate` supplied to `subtype()`');
  
    // DEBUG HINT: if the debugger stops here, the third argument is not a string
    // mouse over the `name` variable to see what's wrong
    assert(maybe(Str).is(name), 'Invalid argument `name` supplied to `subtype()`');

    // DEBUG HINT: always give a name to a type, the debug will be easier
    name = name || format('subtype(%s)', getName(type));

    // cache expected value
    var expected = predicate.__doc__ || format('insert a valid value for %s', predicate.name || 'the subtype');
  
    function Subtype(value, mut) {

      // DEBUG HINT: if the debugger stops here, you have used the `new` operator but it's forbidden
      blockNew(this, Subtype);
      
      // DEBUG HINT: if the debugger stops here, the value cannot be converted to the base type
      var x = type(value, mut);
      
      // DEBUG HINT: if the debugger stops here, the value is converted to the base type
      // but the predicate returns `false`
      assert(predicate(x), 'Invalid `%s` supplied to `%s`, %s', value, name, expected);
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
  
    return Subtype;
  }

  function list(type, name) {
  
    // DEBUG HINT: if the debugger stops here, the first argument is not a type
    assert(Type.is(type), 'Invalid argument `type` supplied to `list()`');
  
    // DEBUG HINT: if the debugger stops here, the third argument is not a string
    // mouse over the `name` variable to see what's wrong
    assert(maybe(Str).is(name), 'Invalid argument `name` supplied to `list()`');

    // DEBUG HINT: always give a name to a type, the debug will be easier
    name = name || format('list(%s)', getName(type));

    function List(value, mut) {
  
      // DEBUG HINT: if the debugger stops here, you have used the `new` operator but it's forbidden

      // DEBUG HINT: if the debugger stops here, the value is not one of the defined enums
      // mouse over the `value` and `name` variables to see what's wrong
      assert(Arr.is(value), 'Invalid `%s` supplied to `%s`, expected an `Arr`', value, name);
  
      // makes List idempotent
      if (List.isList(value)) {
        return value;
      }
  
      var arr = [];
      for (var i = 0, len = value.length ; i < len ; i++ ) {
        var actual = value[i];
        // DEBUG HINT: if the debugger stops here, the `actual` value supplied to the `type` type is invalid
        // mouse over the `actual` and `type` variables to see what's wrong
        arr.push(type(actual, mut));
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

  function dict(type, name) {
  
    // DEBUG HINT: if the debugger stops here, the first argument is not a type
    assert(Type.is(type), 'Invalid argument `type` supplied to `dict()`');
  
    // DEBUG HINT: if the debugger stops here, the third argument is not a string
    // mouse over the `name` variable to see what's wrong
    assert(maybe(Str).is(name), 'Invalid argument `name` supplied to `dict()`');

    // DEBUG HINT: always give a name to a type, the debug will be easier
    name = name || format('dict(%s)', getName(type));

    function Dict(value, mut) {
  
      // DEBUG HINT: if the debugger stops here, the value is not one of the defined enums
      // mouse over the `value` and `name` variables to see what's wrong
      assert(Obj.is(value), 'Invalid `%s` supplied to `%s`, expected an `Obj`', value, name);
  
      // makes Dict idempotent
      if (Dict.isDict(value)) {
        return value;
      }
  
      var obj = {};
      for (var k in value) {
        if (value.hasOwnProperty(k)) {
          var actual = value[k];
          // DEBUG HINT: if the debugger stops here, the `actual` value supplied to the `type` type is invalid
          // mouse over the `actual` and `type` variables to see what's wrong
          obj[k] = type(actual, mut);
        }
      }
  
      if (!mut) { 
        Object.freeze(obj); 
      }
      return obj;
    }
  
    Dict.meta = {
      kind: 'dict',
      type: type,
      name: name
    };
  
    Dict.isDict = function (x) {
      for (var k in x) {
        if (x.hasOwnProperty(k) && !type.is(x[k])) {
          return false;
        }
      }
      return true;
    };
  
    Dict.is = function (x) {
      return Obj.is(x) && Dict.isDict(x);
    };
  
  
    Dict.update = update;
  
    return Dict;
  }

  function func(Domain, Codomain, name) {

    // handle handy syntax for unary functions
    Domain = Arr.is(Domain) ? Domain : [Domain];

    // DEBUG HINT: if the debugger stops here, the first argument is not a list of types
    assert(list(Type).is(Domain), 'Invalid argument `Domain` supplied to `func()`');

    // DEBUG HINT: if the debugger stops here, the second argument is not a type
    assert(Type.is(Codomain), 'Invalid argument `Codomain` supplied to `func()`');

    // DEBUG HINT: always give a name to a type, the debug will be easier
    name = name || format('func([%s], %s)', Domain.map(getName).join(', '), getName(Codomain));

    // cache the domain length
    var domainLen = Domain.length;

    function Func(value) {

      // automatically instrument the function if is not already instrumented
      if (!func.is(value)) {
        value = Func.of(value);
      }

      // DEBUG HINT: if the debugger stops here, the first argument is invalid
      // mouse over the `value` and `name` variables to see what's wrong
      assert(Func.is(value), 'Invalid `%s` supplied to `%s`', value, name);
      
      return value;
    }

    Func.meta = {
      kind: 'func',
      Domain: Domain,
      Codomain: Codomain,
      name: name
    };

    Func.is = function (x) {
      return func.is(x) && 
        x.func.Domain.length === Domain.length && 
        x.func.Domain.every(function (type, i) {
          return type === Domain[i];
        }) && 
        x.func.Codomain === Codomain; 
    };

    Func.of = function (f) {

      // DEBUG HINT: if the debugger stops here, f is not a function
      assert(typeof f === 'function');

      // makes Func.of idempotent
      if (Func.is(f)) {
        return f;
      }

      function fn() {
    
        var args = slice.call(arguments);
        var len = Math.min(args.length, domainLen);
        
        // DEBUG HINT: if the debugger stops here, you provided wrong arguments to the function
        // mouse over the `args` variable to see what's wrong
        args = tuple(Domain.slice(0, len))(args);

        if (len === domainLen) {

          /* jshint validthis: true */
          var r = f.apply(this, args);
      
          // DEBUG HINT: if the debugger stops here, the return value of the function is invalid
          // mouse over the `r` variable to see what's wrong
          r = Codomain(r);
      
          return r;

        } else {

          var curried = Function.prototype.bind.apply(f, [this].concat(args));
          var NewDomain = func(Domain.slice(len), Codomain);
          return NewDomain.of(curried);

        }
    
      }
    
      fn.func = {
        Domain: Domain,
        Codomain: Codomain,
        f: f
      };
    
      return fn;

    };

    return Func;

  }

  // returns true if x is an instrumented function
  func.is = function (f) {
    return Func.is(f) && Obj.is(f.func);
  };

  return {

    util: {
      mixin: mixin,
      merge: merge,
      format: format,
      getName: getName,
      getKind: getKind,
      slice: slice
    },

    options: options,
    assert: assert,
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
    Type: Type,

    irriducible: irriducible,
    struct: struct,
    enums: enums,
    union: union,
    maybe: maybe,
    tuple: tuple,
    subtype: subtype,
    list: list,
    dict: dict,
    func: func
  };
}));
