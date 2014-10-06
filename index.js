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

  function isType(type) {
    return Func.is(type) && Obj.is(type.meta);
  }

  function getName(type) {
    assert(isType(type), 'Invalid argument `type` of value `%j` supplied to `getName()`, expected a type.', type);
    return type.meta.name;
  }

  function deprecated(message) {
    if (console && console.warn) {
      console.warn(message);
    }
  }

  function getKind(type) {
    assert(isType(type), 'Invalid argument `type` of value `%j` supplied to `geKind()`, expected a type.', type);
    return type.meta.kind;
  }

  function isKind(type, kind) {
    deprecated('`isKind(type, kind)` is deprecated, use `getKind(type) === kind` instead');
    return getKind(type) === kind;
  }

  function blockNew(x, type) {
    // DEBUG HINT: since in tcomb the only real constructors are those provided
    // by `struct`, the `new` operator is forbidden for all types
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
    return x === null || x === undefined;
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

  var Type = irriducible('Type', isType);

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
      assert(isType(type), '%s.dispatch() returns no type', name);

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
    assert(isType(type), 'Invalid argument `type` supplied to `maybe()`');

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

      // DEBUG HINT: if the debugger stops here, you have used the `new` operator but it's forbidden
      blockNew(this, Tuple);

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
    assert(isType(type), 'Invalid argument `type` supplied to `subtype()`');

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
    assert(isType(type), 'Invalid argument `type` supplied to `list()`');

    // DEBUG HINT: if the debugger stops here, the third argument is not a string
    // mouse over the `name` variable to see what's wrong
    assert(maybe(Str).is(name), 'Invalid argument `name` supplied to `list()`');

    // DEBUG HINT: always give a name to a type, the debug will be easier
    name = name || format('list(%s)', getName(type));

    function List(value, mut) {

      // DEBUG HINT: if the debugger stops here, you have used the `new` operator but it's forbidden
      blockNew(this, List);

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
    assert(isType(type), 'Invalid argument `type` supplied to `dict()`');

    // DEBUG HINT: if the debugger stops here, the third argument is not a string
    // mouse over the `name` variable to see what's wrong
    assert(maybe(Str).is(name), 'Invalid argument `name` supplied to `dict()`');

    // DEBUG HINT: always give a name to a type, the debug will be easier
    name = name || format('dict(%s)', getName(type));

    function Dict(value, mut) {

      // DEBUG HINT: if the debugger stops here, you have used the `new` operator but it's forbidden
      blockNew(this, Dict);

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

  var func = function func(Argument) {
    // DEBUG HINT: if the debugger stops here, the first argument is not a type
    assert(isType(Argument), 'Invalid argument `Argument` supplied to `func`');

    var funcWithArgument =  function funcWithArgument(Return) {
      // DEBUG HINT: if the debugger stops here, the third argument is not a type (or Nil)
      assert(isType(Return), 'Invalid argument `Return` supplied to `func`');

      var funcWithArgumentAndReturn = function funcWithArgumentAndReturn(f) {
        // DEBUG HINT: if the debugger stops here, the second argument is not a function
        assert(Func.is(f), 'Invalid argument `f` supplied to `func`');

        // DEBUG HINT: always give a name to a type, the debug will be easier
        var name = f.name || 'anonymousFunc';

        // makes the combinator idempotent
        Return = Return || null;
        if (isType(f) && f.meta.Argument === Argument && f.meta.Return === Return) {
          return f;
        }

        function fn(arg) {

          var args = slice.call(arguments);

          // DEBUG HINT: if the debugger stops here, the function was called with the
          // wrong number of arguments.
          assert((args.length === 1), '`' + name + '` called with more or less than one argument');

          // DEBUG HINT: if the debugger stops here, the arguments of the function are invalid
          // mouse over the `args` variable to see what's wrong
          var safeArg = Argument(arg);

          /*jshint validthis: true */
          var r = f.apply(this, [arg]);

          if (Return) {
            // DEBUG HINT: if the debugger stops here, the return value of the function is invalid
            // mouse over the `r` variable to see what's wrong
            r = Return(r);
          }

          return r;
        }

        fn.is = function (x) {
          return x === fn;
        };

        fn.meta = {
          kind: 'func',
          Argument: Argument,
          f: f,
          Return: Return,
          name: name
        };

        return fn;
      };

      funcWithArgumentAndReturn.is = function (x) {
        return funcWithArgumentAndReturn === fn;
      };

      funcWithArgumentAndReturn.meta = {
        kind: 'func',
        Argument: Argument,
        Return: Return,
      };

      return funcWithArgumentAndReturn;
    };


    funcWithArgument.is = function (x) {
      return funcWithArgument === fn;
    };

    funcWithArgument.meta = {
      kind: 'func',
      Argument: Argument,
    };

    return funcWithArgument;
  };

  function alias(type, name) {

    // DEBUG HINT: if the debugger stops here, the first argument is not a type
    assert(isType(type), 'Invalid argument `type` supplied to `alias()`');

    // DEBUG HINT: if the debugger stops here, the third argument is not a string
    // mouse over the `name` variable to see what's wrong
    assert(maybe(Str).is(name), 'Invalid argument `name` supplied to `alias()`');

    // DEBUG HINT: always give a name to a type, the debug will be easier
    name = name || 'alias(' + getName(type) + ')';

    function Alias(value, mut) {
      return type(value, mut);
    }

    Alias.is = function (x) {
      return type.is(x);
    };

    Alias.meta = type.meta;
    Alias.name = name;

    return Alias;

  }

  return {

    util: {
      mixin: mixin,
      merge: merge,
      format: format,
      isType: isType,
      getName: getName,
      getKind: getKind,
      isKind: isKind,
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
    func: func,
    alias: alias
  };
}));
