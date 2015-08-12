(function (root, factory) {
  'use strict';
  if (typeof define === 'function' && define.amd && typeof __fbBatchedBridgeConfig === 'undefined') {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.t = factory();
  }
}(this, function () {

  'use strict';

  function fail(message) {
    throw new TypeError(message);
  }

  function assert(guard, message) {
    if (guard !== true) {
      message = message ? format.apply(null, slice.call(arguments, 1)) : 'assert failed';
      exports.fail(message);
    }
  }

  //
  // utils
  //

  var slice = Array.prototype.slice;

  function mixin(target, source, overwrite) {
    if (Nil.is(source)) { return target; }
    for (var k in source) {
      if (source.hasOwnProperty(k)) {
        if (overwrite !== true) {
          assert(!target.hasOwnProperty(k), 'Invalid call to mixin(target, source, [overwrite]): cannot overwrite property %s of target object', k);
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

  function getFunctionName(f) {
    assert(typeof f === 'function', 'Invalid argument f %s supplied to getFunctionName(f)', f);
    return f.displayName || f.name || format('<function%s>', f.length);
  }

  function replacer(key, value) {
    return Func.is(value) ? getFunctionName(value) : value;
  }

  format.formatters = {
    s: function (x) { return String(x); },
    j: function (x) {
      try { // handle circular references
        return JSON.stringify(x, replacer);
      } catch (e) {
        return String(x);
      }
    }
  };

  function getTypeName(type) {
    assert(Type.is(type), 'Invalid argument type %s supplied to getTypeName(type)', type);
    return type.meta.name;
  }

  function blockNew(x, type) {
    assert(!(x instanceof type), 'Operator new is forbidden for type %s', getTypeName(type));
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

    $apply: function (f, value) {
      assert(Func.is(f));
      return f(value);
    },

    $push: function (elements, arr) {
      assert(Arr.is(elements));
      assert(Arr.is(arr));
      return arr.concat(elements);
    },

    $remove: function (keys, obj) {
      assert(Arr.is(keys));
      assert(Obj.is(obj));
      for (var i = 0, len = keys.length ; i < len ; i++ ) {
        delete obj[keys[i]];
      }
      return obj;
    },

    $set: function (value) {
      return value;
    },

    $splice: function (splices, arr) {
      assert(list(Arr).is(splices));
      assert(Arr.is(arr));
      return splices.reduce(function (acc, splice) {
        acc.splice.apply(acc, splice);
        return acc;
      }, arr);
    },

    $swap: function (config, arr) {
      assert(Obj.is(config));
      assert(Num.is(config.from));
      assert(Num.is(config.to));
      assert(Arr.is(arr));
      var element = arr[config.to];
      arr[config.to] = arr[config.from];
      arr[config.from] = element;
      return arr;
    },

    $unshift: function (elements, arr) {
      assert(Arr.is(elements));
      assert(Arr.is(arr));
      return elements.concat(arr);
    },

    $merge: function (obj, value) {
      return mixin(mixin({}, value), obj, true);
    }

  };

  function create(type, value, mut, path) {
    return type.meta.kind === 'struct' ? new type(value, mut, path) : type(value, mut, path);
  }

  //
  // irreducibles
  //

  function irreducible(name, is) {

    assert(typeof name === 'string', 'Invalid argument name %s supplied to irreducible(name, is) (expected a string)', name);
    assert(typeof is === 'function', 'Invalid argument is %s supplied to irreducible(name, is)', is);

    function Irreducible(value, mut, path) {
      blockNew(this, Irreducible);
      assert(is(value), 'Invalid value %j supplied to %s', value, path ? path.join('/') : name);
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

  var Any = irreducible('Any', function () {
    return true;
  });

  var Nil = irreducible('Nil', function (x) {
    return x === null || x === void 0;
  });

  var Str = irreducible('String', function (x) {
    return typeof x === 'string';
  });

  var Num = irreducible('Number', function (x) {
    return typeof x === 'number' && isFinite(x) && !isNaN(x);
  });

  var Bool = irreducible('Boolean', function (x) {
    return x === true || x === false;
  });

  var Arr = irreducible('Array', function (x) {
    return x instanceof Array;
  });

  var Obj = irreducible('Object', function (x) {
    return !Nil.is(x) && typeof x === 'object' && !Arr.is(x);
  });

  var Func = irreducible('Function', function (x) {
    return typeof x === 'function';
  });

  var Err = irreducible('Error', function (x) {
    return x instanceof Error;
  });

  var Re = irreducible('RegExp', function (x) {
    return x instanceof RegExp;
  });

  var Dat = irreducible('Date', function (x) {
    return x instanceof Date;
  });

  var Type = irreducible('Type', function (x) {
    return Func.is(x) && Obj.is(x.meta);
  });

  function getDefaultStructName(props) {
    return format('{%s}', Object.keys(props).map(function (prop) {
      return format('%s: %s', prop, getTypeName(props[prop]));
    }).join(', '));
  }

  function struct(props, name) {

    assert(dict(Str, Type).is(props), 'Invalid argument props %j supplied to struct(props, [name]) combinator', props);
    assert(maybe(Str).is(name), 'Invalid argument name %s supplied to struct(props, [name]) combinator (expected a string)', name);

    name = name || getDefaultStructName(props);

    function Struct(value, mut, path) {

      // makes Struct idempotent
      if (Struct.is(value)) {
        return value;
      }

      path = path || [name];
      assert(Obj.is(value), 'Invalid value %j supplied to %s (expected an object)', value, path.join('/'));

      // makes `new` optional
      if (!(this instanceof Struct)) {
        return new Struct(value, mut);
      }

      for (var k in props) {
        if (props.hasOwnProperty(k)) {
          var expected = props[k];
          var actual = value[k];
          this[k] = create(expected, actual, mut, path.concat(k + ': ' + getTypeName(expected)));
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

    Struct.is = function (x) {
      return x instanceof Struct;
    };

    Struct.update = function (instance, spec) {
      return new Struct(exports.update(instance, spec));
    };

    Struct.extend = function (arr, name) {
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

  function getDefaultUnionName(types) {
    return types.map(getTypeName).join(' | ');
  }

  function union(types, name) {

    assert(list(Type).is(types), 'Invalid argument types %j supplied to union(types, [name]) combinator (expected a list of types)', types);
    var lenCache = types.length;
    assert(lenCache >= 2, 'Invalid argument types %j supplied to union(types, [name]) combinator (expected a list of at least two types)', types);
    assert(maybe(Str).is(name), 'Invalid argument name %s supplied to union(types, [name]) combinator (expected a string)', name);
    name = name || getDefaultUnionName(types);

    function Union(value, mut, path) {
      blockNew(this, Union);
      assert(Func.is(Union.dispatch), 'Unimplemented dispatch() function for the union type %s', name);
      var type = Union.dispatch(value);
      assert(Type.is(type), 'The dispatch() function of the union type %s returns no type constructor', name);
      return create(type, value, mut, path);
    }

    Union.meta = {
      kind: 'union',
      types: types,
      name: name
    };

    Union.displayName = name;

    Union.is = function (x) {
      return types.some(function (type) {
        return type.is(x);
      });
    };

    // default dispatch implementation
    Union.dispatch = function (x) {
      for (var i = 0 ; i < lenCache ; i++ ) {
        if (types[i].is(x)) {
          return types[i];
        }
      }
    };

    return Union;
  }

  function getMaybeDefaultName(type) {
    return '?' + getTypeName(type);
  }

  function maybe(type, name) {

    assert(Type.is(type), 'Invalid argument type %s supplied to maybe(type, [name]) combinator', type);

    // makes the combinator idempotent and handle Any, Nil
    if (type.meta.kind === 'maybe' || type === Any || type === Nil) {
      return type;
    }

    assert(Nil.is(name) || Str.is(name), 'Invalid argument name %s supplied to maybe(type, [name]) combinator (expected a string)', name);

    name = name || getMaybeDefaultName(type);

    function Maybe(value, mut, path) {
      blockNew(this, Maybe);
      return Nil.is(value) ? null : create(type, value, mut, path);
    }

    Maybe.meta = {
      kind: 'maybe',
      type: type,
      name: name
    };

    Maybe.displayName = name;

    Maybe.is = function (x) {
      return Nil.is(x) || type.is(x);
    };

    return Maybe;
  }

  function getDefaultEnumsName(map) {
    return Object.keys(map).map(function (k) { return JSON.stringify(k); }).join(' | ');
  }

  function enums(map, name) {

    assert(Obj.is(map), 'Invalid argument map %j supplied to enums(map, [name]) combinator (expected an object)', map);
    assert(maybe(Str).is(name), 'Invalid argument name %s supplied to enums(map, [name]) combinator (expected a string)', name);

    var keysCache = Object.keys(map); // cache enums

    name = name || getDefaultEnumsName(map);

    function Enums(value, mut, path) {
      blockNew(this, Enums);
      assert(Enums.is(value), 'Invalid value %j supplied to %s (expected one of %j)', value, path ? path.join('/') : name, keysCache);
      return value;
    }

    Enums.meta = {
      kind: 'enums',
      map: map,
      name: name
    };

    Enums.displayName = name;

    Enums.is = function (x) {
      return map.hasOwnProperty(x);
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

  function getDefaultTupleName(types) {
    return format('[%s]', types.map(getTypeName).join(', '));
  }

  function tuple(types, name) {

    assert(list(Type).is(types), 'Invalid argument types %j supplied to tuple(types, [name]) combinator (expected a list of types)', types);

    var lenCache = types.length; // cache types length

    assert(maybe(Str).is(name), 'Invalid argument name %s supplied to tuple(types, [name]) combinator (expected a string)', name);

    name = name || getDefaultTupleName(types);

    function isTuple(x) {
      for (var i = 0 ; i < lenCache ; i++) {
        if (!types[i].is(x[i])) {
          return false;
        }
      }
      return true;
    }

    function Tuple(value, mut, path) {

      path = path || [name];
      assert(Arr.is(value) && value.length === lenCache, 'Invalid value %j supplied to %s (expected an array of length %s)', value, path.join('/'), lenCache);

      var frozen = (mut !== true);

      // makes Tuple idempotent
      if (isTuple(value) && Object.isFrozen(value) === frozen) {
        return value;
      }

      var arr = [];
      for (var i = 0 ; i < lenCache ; i++) {
        var expected = types[i];
        var actual = value[i];
        arr.push(create(expected, actual, mut, path.concat(i + ': ' + getTypeName(expected))));
      }

      if (frozen) {
        Object.freeze(arr);
      }

      return arr;
    }

    Tuple.meta = {
      kind: 'tuple',
      types: types,
      name: name
    };

    Tuple.displayName = name;

    Tuple.is = function (x) {
      return Arr.is(x) && x.length === lenCache && isTuple(x);
    };

    Tuple.update = function (instance, spec) {
      return Tuple(exports.update(instance, spec));
    };

    return Tuple;
  }

  function getDefaultSubtypeName(type, predicate) {
    return format('{%s | %s}', getTypeName(type), getFunctionName(predicate));
  }

  function subtype(type, predicate, name) {

    assert(Type.is(type), 'Invalid argument type %s supplied to subtype(type, predicate, [name]) combinator', type);
    assert(Func.is(predicate), 'Invalid argument predicate %s supplied to subtype(type, predicate, [name]) combinator', predicate);
    assert(maybe(Str).is(name), 'Invalid argument name %s supplied to subtype(type, predicate, [name]) combinator (expected a string)', name);

    name = name || getDefaultSubtypeName(type, predicate);

    function Subtype(value, mut, path) {
      blockNew(this, Subtype);
      path = path || [name];
      var x = create(type, value, mut, path);
      assert(predicate(x), 'Invalid value %j supplied to %s', value, path.join('/'));
      return x;
    }

    Subtype.meta = {
      kind: 'subtype',
      type: type,
      predicate: predicate,
      name: name
    };

    Subtype.displayName = name;

    Subtype.is = function (x) {
      return type.is(x) && predicate(x);
    };

    Subtype.update = function (instance, spec) {
      return Subtype(exports.update(instance, spec));
    };

    return Subtype;
  }

  function getDefaultListName(type) {
    return format('Array<%s>', getTypeName(type));
  }

  function list(type, name) {

    assert(Type.is(type), 'Invalid argument type %s supplied to list(type, [name]) combinator', type);
    assert(maybe(Str).is(name), 'Invalid argument name %s supplied to list(type, [name]) combinator (expected a string)', name);

    name = name || getDefaultListName(type);

    var typeNameCache = getTypeName(type);

    function isList(x) {
      return x.every(type.is);
    }

    function List(value, mut, path) {

      path = path || [name];
      assert(Arr.is(value), 'Invalid value %j supplied to %s (expected an array of %s)', value, path.join('/'), typeNameCache);

      var frozen = (mut !== true);

      // makes List idempotent
      if (isList(value) && Object.isFrozen(value) === frozen) {
        return value;
      }

      var arr = [];
      for (var i = 0, len = value.length ; i < len ; i++ ) {
        var actual = value[i];
        arr.push(create(type, actual, mut, path.concat(i + ': ' + typeNameCache)));
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

    List.is = function (x) {
      return Arr.is(x) && isList(x);
    };

    List.update = function (instance, spec) {
      return List(exports.update(instance, spec));
    };

    return List;
  }

  function getDefaultDictName(domain, codomain) {
    return format('{[key:%s]: %s}', getTypeName(domain), getTypeName(codomain));
  }

  function dict(domain, codomain, name) {

    assert(Type.is(domain), 'Invalid argument domain %s supplied to dict(domain, codomain, [name]) combinator', domain);
    assert(Type.is(codomain), 'Invalid argument codomain %s supplied to dict(domain, codomain, [name]) combinator', codomain);
    assert(maybe(Str).is(name), 'Invalid argument name %s supplied to dict(domain, codomain, [name]) combinator (expected a string)', name);

    var codomainNameCache = getTypeName(codomain);

    name = name || getDefaultDictName(domain, codomain);

    function isDict(x) {
      for (var k in x) {
        if (x.hasOwnProperty(k)) {
          if (!domain.is(k) || !codomain.is(x[k])) {
            return false;
          }
        }
      }
      return true;
    }

    function Dict(value, mut, path) {

      path = path || [name];
      assert(Obj.is(value), 'Invalid value %j supplied to %s', value, path.join('/'));

      var frozen = (mut !== true);

      // makes Dict idempotent
      if (isDict(value) && Object.isFrozen(value) === frozen) {
        return value;
      }

      var obj = {};
      for (var k in value) {
        if (value.hasOwnProperty(k)) {
          k = create(domain, k, mut, path);
          var actual = value[k];
          obj[k] = create(codomain, actual, mut, path.concat(k + ': ' + codomainNameCache));
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

    Dict.is = function (x) {
      return Obj.is(x) && isDict(x);
    };

    Dict.update = function (instance, spec) {
      return Dict(exports.update(instance, spec));
    };

    return Dict;
  }

  function isInstrumented(f) {
    return Func.is(f) && Obj.is(f.type);
  }

  function getDefaultFuncName(domain, codomain) {
    return format('(%s) => %s', domain.map(getTypeName).join(', '), getTypeName(codomain));
  }

  function func(domain, codomain, name) {

    // handle handy syntax for unary functions
    domain = Arr.is(domain) ? domain : [domain];

    assert(list(Type).is(domain), 'Invalid argument domain %s supplied to func(domain, codomain, [name]) combinator', domain);
    assert(Type.is(codomain), 'Invalid argument codomain %s supplied to func(domain, codomain, [name]) combinator', codomain);
    assert(maybe(Str).is(name), 'Invalid argument name %s supplied to func(domain, codomain, [name]) combinator (expected a string)', name);

    name = name || getDefaultFuncName(domain, codomain);

    var domainLenCache = domain.length; // cache the domain length

    function Func(value) {
      // automatically instrument the function
      if (!isInstrumented(value)) {
        return Func.of(value);
      }
      assert(Func.is(value), 'Invalid value %j supplied to %s', value, name);
      return value;
    }

    Func.meta = {
      kind: 'func',
      domain: domain,
      codomain: codomain,
      name: name
    };

    Func.displayName = name;

    Func.is = function (x) {
      return isInstrumented(x) &&
        x.type.domain.length === domainLenCache &&
        x.type.domain.every(function (type, i) {
          return type === domain[i];
        }) &&
        x.type.codomain === codomain;
    };

    Func.of = function (f) {

      assert(typeof f === 'function');

      // makes Func.of idempotent
      if (Func.is(f)) {
        return f;
      }

      function fn() {
        var args = slice.call(arguments);
        var len = args.length;
        var argsType = tuple(domain.slice(0, len), name + ' domain');
        args = argsType(args);
        if (len === domainLenCache) {
          /* jshint validthis: true */
          return create(codomain, f.apply(this, args));
        } else {
          var curried = Function.prototype.bind.apply(f, [this].concat(args));
          var newdomain = func(domain.slice(len), codomain);
          return newdomain.of(curried);
        }
      }

      fn.type = {
        domain: domain,
        codomain: codomain,
        f: f
      };

      fn.displayName = getFunctionName(f);

      return fn;

    };

    return Func;

  }

  var exports = {
    format: format,
    getFunctionName: getFunctionName,
    getTypeName: getTypeName,
    mixin: mixin,
    slice: slice,
    shallowCopy: shallowCopy,
    update: update,
    assert: assert,
    fail: fail,
    Any: Any,
    Nil: Nil,
    Str: Str,
    String: Str,
    Num: Num,
    Number: Num,
    Bool: Bool,
    Boolean: Bool,
    Arr: Arr,
    Array: Arr,
    Obj: Obj,
    Object: Obj,
    Func: Func,
    Function: Func,
    Err: Err,
    Error: Err,
    Re: Re,
    RegExp: Re,
    Dat: Dat,
    Date: Dat,
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

  return exports;

}));
