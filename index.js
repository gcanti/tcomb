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
    onFail: onFail
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
        if (overwrite !== true) {
          assert(!target.hasOwnProperty(k), 'Cannot overwrite property %s', k);
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
    s: function formatString(x) { return String(x); },
    j: function formatJSON(x) {
      try {
        return JSON.stringify(x, replacer);
      } catch (e) {
        return String(x);
      }
    }
  };

  function getName(type) {
    assert(Type.is(type), 'Invalid argument `type` = `%s` supplied to `getName()`', type);
    return type.meta.name;
  }

  function getFunctionName(f) {
    assert(typeof f === 'function', 'Invalid argument `f` = `%s` supplied to `getFunctionName()`', f);
    return f.displayName || f.name || format('<function%s>', f.length);
  }

  function getKind(type) {
    assert(Type.is(type), 'Invalid argument `type` = `%s` supplied to `geKind()`', type);
    return type.meta.kind;
  }

  function blockNew(x, type) {
    assert(!(x instanceof type), 'Operator `new` is forbidden for type `%s`', getName(type));
  }

  function shallowCopy(x) {
    return Arr.is(x) ? x.concat() : Obj.is(x) ? mixin({}, x) : x;
  }

  function update(instance, spec) {
    assert(Obj.is(spec));
    var value = shallowCopy(instance);
    for (var k in spec) {
      if (spec.hasOwnProperty(k)) {
        if (update.commands.hasOwnProperty(k)) {
          assert(Object.keys(spec).length === 1);
          return update.commands[k](spec[k], value);
        } else {
          value[k] = update(value[k], spec[k]);
        }
      }
    }
    return value;
  }

  update.commands = {
    '$apply': function $apply(f, value) {
      assert(Func.is(f));
      return f(value);
    },
    '$push': function $push(elements, arr) {
      assert(Arr.is(elements));
      assert(Arr.is(arr));
      return arr.concat(elements);
    },
    '$remove': function $remove(keys, obj) {
      assert(Arr.is(keys));
      assert(Obj.is(obj));
      for (var i = 0, len = keys.length ; i < len ; i++ ) {
        delete obj[keys[i]];
      }
      return obj;
    },
    '$set': function $set(value) {
      return value;
    },
    '$splice': function $splice(splices, arr) {
      assert(list(Arr).is(splices));
      assert(Arr.is(arr));
      return splices.reduce(function reducer(acc, splice) {
        acc.splice.apply(acc, splice);
        return acc;
      }, arr);
    },
    '$swap': function $swap(config, arr) {
      assert(Obj.is(config));
      assert(Num.is(config.from));
      assert(Num.is(config.to));
      assert(Arr.is(arr));
      var element = arr[config.to];
      arr[config.to] = arr[config.from];
      arr[config.from] = element;
      return arr;
    },
    '$unshift': function $unshift(elements, arr) {
      assert(Arr.is(elements));
      assert(Arr.is(arr));
      return elements.concat(arr);
    },
    '$merge': function (obj, value) {
      return mixin(mixin({}, value), obj, true);
    }
  };

  //
  // irreducibles
  //

  function irreducible(name, is) {

    // DEBUG HINT: if the debugger stops here, the first argument is not a string
    assert(typeof name === 'string', 'Invalid argument `name` = `%s` supplied to `irreducible()`', name);

    // DEBUG HINT: if the debugger stops here, the second argument is not a function
    assert(typeof is === 'function', 'Invalid argument `is` = `%s` supplied to `irreducible()`', is);

    function Irreducible(value) {

      // DEBUG HINT: if the debugger stops here, you have used the `new` operator but it's forbidden
      blockNew(this, Irreducible);

      // DEBUG HINT: if the debugger stops here, the first argument is invalid
      // mouse over the `value` variable to see what's wrong. In `name` there is the name of the type
      assert(is(value), 'Invalid argument `value` = `%s` supplied to irreducible type `%s`', value, name);

      return value;
    }

    Irreducible.meta = {
      kind: 'irreducible',
      name: name
    };

    Irreducible.displayName = name;

    Irreducible.is = is;

    return Irreducible;
  }

  var Any = irreducible('Any', function isAny() {
    return true;
  });

  var Nil = irreducible('Nil', function isNil(x) {
    return x === null || x === void 0;
  });

  var Str = irreducible('Str', function isStr(x) {
    return typeof x === 'string';
  });

  var Num = irreducible('Num', function isNum(x) {
    return typeof x === 'number' && isFinite(x) && !isNaN(x);
  });

  var Bool = irreducible('Bool', function isBool(x) {
    return x === true || x === false;
  });

  var Arr = irreducible('Arr', function isArr(x) {
    return x instanceof Array;
  });

  var Obj = irreducible('Obj', function isObj(x) {
    return !Nil.is(x) && typeof x === 'object' && !Arr.is(x);
  });

  var Func = irreducible('Func', function isFunc(x) {
    return typeof x === 'function';
  });

  var Err = irreducible('Err', function isErr(x) {
    return x instanceof Error;
  });

  var Re = irreducible('Re', function isRe(x) {
    return x instanceof RegExp;
  });

  var Dat = irreducible('Dat', function isDat(x) {
    return x instanceof Date;
  });

  var Type = irreducible('Type', function isType(x) {
    return Func.is(x) && Obj.is(x.meta);
  });

  function struct(props, name) {

    // DEBUG HINT: if the debugger stops here, the first argument is not a dict of types
    // mouse over the `props` variable to see what's wrong
    assert(dict(Str, Type).is(props), 'Invalid argument `props` = `%s` supplied to `struct` combinator', props);

    // DEBUG HINT: if the debugger stops here, the second argument is not a string
    // mouse over the `name` variable to see what's wrong
    assert(maybe(Str).is(name), 'Invalid argument `name` = `%s` supplied to `struct` combinator', name);

    // DEBUG HINT: always give a name to a type, the debug will be easier
    name = name || format('{%s}', Object.keys(props).map(function (prop) {
      return format('%s: %s', prop, getName(props[prop]));
    }).join(', '));

    function Struct(value, mut) {

      // makes Struct idempotent
      if (Struct.is(value)) {
        return value;
      }

      // DEBUG HINT: if the debugger stops here, the first argument is invalid
      // mouse over the `value` variable to see what's wrong. In `name` there is the name of the type
      assert(Obj.is(value), 'Invalid argument `value` = `%s` supplied to struct type `%s`', value, name);

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

      if (mut !== true) {
        Object.freeze(this);
      }
    }

    Struct.meta = {
      kind: 'struct',
      props: props,
      name: name
    };

    Struct.displayName = name;

    Struct.is = function isStruct(x) {
      return x instanceof Struct;
    };

    Struct.update = function updateStruct(instance, spec, value) {
      return new Struct(update(instance, spec, value));
    };

    Struct.extend = function extendStruct(arr, name) {
      arr = [].concat(arr).map(function (x) {
        return Obj.is(x) ? x : x.meta.props;
      });
      arr.unshift(props);
      var ret = struct(arr.reduce(mixin, {}), name);
      mixin(ret.prototype, Struct.prototype); // prototypal inheritance
      return ret;
    };

    return Struct;
  }

  function union(types, name) {

    // DEBUG HINT: if the debugger stops here, the first argument is not a list of types
    assert(list(Type).is(types), 'Invalid argument `types` = `%s` supplied to `union` combinator', types);

    var len = types.length;
    var defaultName = types.map(getName).join(' | ');

    // DEBUG HINT: if the debugger stops here, there are too few types (they must be at least two)
    assert(len >= 2, 'Invalid argument `types` = `%s` supplied to `union` combinator, provide at least two types', defaultName);

    // DEBUG HINT: if the debugger stops here, the second argument is not a string
    // mouse over the `name` variable to see what's wrong
    assert(maybe(Str).is(name), 'Invalid argument `name` = `%s` supplied to `union` combinator', name);

    name = name || defaultName;

    function Union(value, mut) {

      // DEBUG HINT: if the debugger stops here, you have used the `new` operator but it's forbidden
      blockNew(this, Union);

      // DEBUG HINT: if the debugger stops here, you must implement the `dispatch` static method for this type
      assert(Func.is(Union.dispatch), 'Unimplemented `dispatch()` function for union type `%s`', name);

      var type = Union.dispatch(value);

      // DEBUG HINT: if the debugger stops here, the `dispatch` static method returns no type
      assert(Type.is(type), 'The `dispatch()` function of union type `%s` returns no type constructor', name);

      // DEBUG HINT: if the debugger stops here, `value` can't be converted to `type`
      // mouse over the `value` and `type` variables to see what's wrong
      return type(value, mut);
    }

    Union.meta = {
      kind: 'union',
      types: types,
      name: name
    };

    Union.displayName = name;

    Union.is = function isUnion(x) {
      return types.some(function isType(type) {
        return type.is(x);
      });
    };

    // default dispatch implementation
    Union.dispatch = function dispatch(x) {
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
    assert(Type.is(type), 'Invalid argument `type` = `%s` supplied to `maybe` combinator', type);

    // makes the combinator idempotent and handle Any, Nil
    if (getKind(type) === 'maybe' || type === Any || type === Nil) {
      return type;
    }

    // DEBUG HINT: if the debugger stops here, the second argument is not a string
    // mouse over the `name` variable to see what's wrong
    assert(Nil.is(name) || Str.is(name), 'Invalid argument `name` = `%s` supplied to `maybe` combinator', name);

    name = name || ('?' + getName(type));

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

    Maybe.displayName = name;

    Maybe.is = function isMaybe(x) {
      return Nil.is(x) || type.is(x);
    };

    return Maybe;
  }

  function enums(map, name) {

    // DEBUG HINT: if the debugger stops here, the first argument is not a hash
    // mouse over the `map` variable to see what's wrong
    assert(Obj.is(map), 'Invalid argument `map` = `%s` supplied to `enums` combinator', map);

    // DEBUG HINT: if the debugger stops here, the second argument is not a string
    // mouse over the `name` variable to see what's wrong
    assert(maybe(Str).is(name), 'Invalid argument `name` = `%s` supplied to `enums` combinator', name);

    // cache enums
    var keys = Object.keys(map);

    name = name || keys.map(function (k) { return JSON.stringify(k); }).join(' | ');

    function Enums(value) {

      // DEBUG HINT: if the debugger stops here, you have used the `new` operator but it's forbidden
      blockNew(this, Enums);

      // DEBUG HINT: if the debugger stops here, the value is not one of the defined enums
      // mouse over the `value`, `name` and `keys` variables to see what's wrong
      assert(Enums.is(value), 'Invalid argument `value` = `%s` supplied to enums type `%s`, expected one of %j', value, name, keys);

      return value;
    }

    Enums.meta = {
      kind: 'enums',
      map: map,
      name: name
    };

    Enums.displayName = name;

    Enums.is = function isEnums(x) {
      return Str.is(x) && map.hasOwnProperty(x);
    };

    return Enums;
  }

  enums.of = function enumsOf(keys, name) {
    keys = Str.is(keys) ? keys.split(' ') : keys;
    var value = {};
    keys.forEach(function setEnum(k) {
      value[k] = k;
    });
    return enums(value, name);
  };

  function tuple(types, name) {

    // DEBUG HINT: if the debugger stops here, the first argument is not a list of types
    assert(list(Type).is(types), 'Invalid argument `types` = `%s` supplied to `tuple` combinator', types);

    var len = types.length;

    // DEBUG HINT: if the debugger stops here, the second argument is not a string
    // mouse over the `name` variable to see what's wrong
    assert(maybe(Str).is(name), 'Invalid argument `name` = `%s` supplied to `tuple` combinator', name);

    name = name || format('[%s]', types.map(getName).join(', '));

    function Tuple(value, mut) {

      // DEBUG HINT: if the debugger stops here, the value is not one of the defined enums
      // mouse over the `value`, `name` and `len` variables to see what's wrong
      assert(Arr.is(value) && value.length === len, 'Invalid argument `value` = `%s` supplied to tuple type `%s`, expected an `Arr` of length `%s`', value, name, len);

      var frozen = (mut !== true);

      // makes Tuple idempotent
      if (Tuple.isTuple(value) && Object.isFrozen(value) === frozen) {
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

      if (frozen) {
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

    Tuple.displayName = name;

    Tuple.isTuple = function isTuple(x) {
      return types.every(function isType(type, i) {
        return type.is(x[i]);
      });
    };

    Tuple.is = function isTuple(x) {
      return Arr.is(x) && x.length === len && Tuple.isTuple(x);
    };

    Tuple.update = function updateTuple(instance, spec, value) {
      return Tuple(update(instance, spec, value));
    };

    return Tuple;
  }

  function subtype(type, predicate, name) {

    // DEBUG HINT: if the debugger stops here, the first argument is not a type
    assert(Type.is(type), 'Invalid argument `type` = `%s` supplied to `subtype` combinator', type);

    // DEBUG HINT: if the debugger stops here, the second argument is not a function
    assert(Func.is(predicate), 'Invalid argument `predicate` = `%s` supplied to `subtype` combinator', predicate);

    // DEBUG HINT: if the debugger stops here, the third argument is not a string
    // mouse over the `name` variable to see what's wrong
    assert(maybe(Str).is(name), 'Invalid argument `name` = `%s` supplied to `subtype` combinator', name);

    // DEBUG HINT: always give a name to a type, the debug will be easier
    name = name || format('{%s | %s}', getName(type), getFunctionName(predicate));

    function Subtype(value, mut) {

      // DEBUG HINT: if the debugger stops here, you have used the `new` operator but it's forbidden
      blockNew(this, Subtype);

      // DEBUG HINT: if the debugger stops here, the value cannot be converted to the base type
      var x = type(value, mut);

      // DEBUG HINT: if the debugger stops here, the value is converted to the base type
      // but the predicate returns `false`
      assert(predicate(x), 'Invalid argument `value` = `%s` supplied to subtype type `%s`', value, name);
      return x;
    }

    Subtype.meta = {
      kind: 'subtype',
      type: type,
      predicate: predicate,
      name: name
    };

    Subtype.displayName = name;

    Subtype.is = function isSubtype(x) {
      return type.is(x) && predicate(x);
    };

    Subtype.update = function updateSubtype(instance, spec, value) {
      return Subtype(update(instance, spec, value));
    };

    return Subtype;
  }

  function list(type, name) {

    // DEBUG HINT: if the debugger stops here, the first argument is not a type
    assert(Type.is(type), 'Invalid argument `type` = `%s` supplied to `list` combinator', type);

    // DEBUG HINT: if the debugger stops here, the third argument is not a string
    // mouse over the `name` variable to see what's wrong
    assert(maybe(Str).is(name), 'Invalid argument `name` = `%s` supplied to `list` combinator', name);

    // DEBUG HINT: always give a name to a type, the debug will be easier
    name = name || format('Array<%s>', getName(type));

    function List(value, mut) {

      // DEBUG HINT: if the debugger stops here, you have used the `new` operator but it's forbidden

      // DEBUG HINT: if the debugger stops here, the value is not one of the defined enums
      // mouse over the `value` and `name` variables to see what's wrong
      assert(Arr.is(value), 'Invalid argument `value` = `%s` supplied to list type `%s`', value, name);

      var frozen = (mut !== true);

      // makes List idempotent
      if (List.isList(value) && Object.isFrozen(value) === frozen) {
        return value;
      }

      var arr = [];
      for (var i = 0, len = value.length ; i < len ; i++ ) {
        var actual = value[i];
        // DEBUG HINT: if the debugger stops here, the `actual` value supplied to the `type` type is invalid
        // mouse over the `actual` and `type` variables to see what's wrong
        arr.push(type(actual, mut));
      }

      if (frozen) {
        Object.freeze(arr);
      }
      return arr;
    }

    List.meta = {
      kind: 'list',
      type: type,
      name: name
    };

    List.displayName = name;

    List.isList = function isList(x) {
      return x.every(type.is);
    };

    List.is = function isList(x) {
      return Arr.is(x) && List.isList(x);
    };

    List.update = function updateList(instance, spec, value) {
      return List(update(instance, spec, value));
    };

    return List;
  }

  function dict(domain, codomain, name) {

    // DEBUG HINT: if the debugger stops here, the first argument is not a type
    assert(Type.is(domain), 'Invalid argument `domain` = `%s` supplied to `dict` combinator', domain);

    // DEBUG HINT: if the debugger stops here, the second argument is not a type
    assert(Type.is(codomain), 'Invalid argument `codomain` = `%s` supplied to `dict` combinator', codomain);

    // DEBUG HINT: if the debugger stops here, the third argument is not a string
    // mouse over the `name` variable to see what's wrong
    assert(maybe(Str).is(name), 'Invalid argument `name` = `%s` supplied to `dict` combinator', name);

    // DEBUG HINT: always give a name to a type, the debug will be easier
    name = name || format('{[key:%s]: %s}', getName(domain), getName(codomain));

    function Dict(value, mut) {

      // DEBUG HINT: if the debugger stops here, the value is not an object
      // mouse over the `value` and `name` variables to see what's wrong
      assert(Obj.is(value), 'Invalid argument `value` = `%s` supplied to dict type `%s`', value, name);

      var frozen = (mut !== true);

      // makes Dict idempotent
      if (Dict.isDict(value) && Object.isFrozen(value) === frozen) {
        return value;
      }

      var obj = {};
      for (var k in value) {
        if (value.hasOwnProperty(k)) {
          // DEBUG HINT: if the debugger stops here, the `k` value supplied to the `domain` type is invalid
          // mouse over the `k` and `domain` variables to see what's wrong
          k = domain(k);
          var actual = value[k];
          // DEBUG HINT: if the debugger stops here, the `actual` value supplied to the `codomain` type is invalid
          // mouse over the `actual` and `codomain` variables to see what's wrong
          obj[k] = codomain(actual, mut);
        }
      }

      if (frozen) {
        Object.freeze(obj);
      }
      return obj;
    }

    Dict.meta = {
      kind: 'dict',
      domain: domain,
      codomain: codomain,
      name: name
    };

    Dict.displayName = name;

    Dict.isDict = function isDict(x) {
      for (var k in x) {
        if (x.hasOwnProperty(k)) {
          if (!domain.is(k) || !codomain.is(x[k])) { return false; }
        }
      }
      return true;
    };

    Dict.is = function isDict(x) {
      return Obj.is(x) && Dict.isDict(x);
    };


    Dict.update = function updateDict(instance, spec, value) {
      return Dict(update(instance, spec, value));
    };

    return Dict;
  }

  function func(domain, codomain, name) {

    // handle handy syntax for unary functions
    domain = Arr.is(domain) ? domain : [domain];

    // DEBUG HINT: if the debugger stops here, the first argument is not a list of types
    assert(list(Type).is(domain), 'Invalid argument `domain` = `%s` supplied to `func` combinator', domain);

    // DEBUG HINT: if the debugger stops here, the second argument is not a type
    assert(Type.is(codomain), 'Invalid argument `codomain` = `%s` supplied to `func` combinator', codomain);

    // DEBUG HINT: if the debugger stops here, the third argument is not a string
    // mouse over the `name` variable to see what's wrong
    assert(maybe(Str).is(name), 'Invalid argument `name` = `%s` supplied to `func` combinator', name);

    // DEBUG HINT: always give a name to a type, the debug will be easier
    name = name || format('(%s) -> %s', domain.map(getName).join(', '), getName(codomain));

    // cache the domain length
    var domainLen = domain.length;

    function Func(value) {

      // automatically instrument the function if is not already instrumented
      if (!func.is(value)) {
        value = Func.of(value);
      }

      // DEBUG HINT: if the debugger stops here, the first argument is invalid
      // mouse over the `value` and `name` variables to see what's wrong
      assert(Func.is(value), 'Invalid argument `value` = `%s` supplied to func type `%s`', value, name);

      return value;
    }

    Func.meta = {
      kind: 'func',
      domain: domain,
      codomain: codomain,
      name: name
    };

    Func.displayName = name;

    Func.is = function isFunc(x) {
      return func.is(x) &&
        x.func.domain.length === domain.length &&
        x.func.domain.every(function isEqual(type, i) {
          return type === domain[i];
        }) &&
        x.func.codomain === codomain;
    };

    Func.of = function funcOf(f) {

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
        args = tuple(domain.slice(0, len))(args);

        if (len === domainLen) {

          /* jshint validthis: true */
          var r = f.apply(this, args);

          // DEBUG HINT: if the debugger stops here, the return value of the function is invalid
          // mouse over the `r` variable to see what's wrong
          r = codomain(r);

          return r;

        } else {

          var curried = Function.prototype.bind.apply(f, [this].concat(args));
          var newdomain = func(domain.slice(len), codomain);
          return newdomain.of(curried);

        }

      }

      fn.func = {
        domain: domain,
        codomain: codomain,
        f: f
      };

      return fn;

    };

    return Func;

  }

  // returns true if x is an instrumented function
  func.is = function isFunc(f) {
    return Func.is(f) && Obj.is(f.func);
  };

  return {

    util: {
      format: format,
      getKind: getKind,
      getFunctionName: getFunctionName,
      getName: getName,
      mixin: mixin,
      slice: slice,
      shallowCopy: shallowCopy,
      update: update
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

    irreducible: irreducible,
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
