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

  function getKind(type) {
    assert(isType(type), 'Invalid argument `type` of value `%j` supplied to `geKind()`, expected a type.', type);
    return type.meta.kind;
  }

  function isKind(type, kind) {
    return getKind(type) === kind;
  }
  
  function values(obj) {
    var ret = [];
    for (var k in obj) {
      if (obj.hasOwnProperty(k)) {
        ret.push(obj[k]);
      }
    }
    return ret;
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
    var value = options.update.apply(T, arguments);
    return T(value);
  }

  //
  // irriducibles
  //
  
  function irriducible(name, is) {
  
    function Irriducible(value) {
      forbidNewOperator(this, Irriducible);
      assert(is(value), errs.ERR_BAD_TYPE_VALUE, value, name, format('a `%s`', name));
      // all primitives types are idempotent
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
  
  function struct(props, name) {
  
    // check combinator args
    name = ensureName(name, 'struct');
    assert(Obj.is(props), errs.ERR_BAD_COMBINATOR_ARGUMENT, 'props', props, name, 'an `Obj`');
    assert(values(props).every(isType), errs.ERR_BAD_COMBINATOR_ARGUMENT, 'props', props, name, 'a dict of types');
  
    function Struct(value, mut) {
  
      // makes Struct idempotent
      if (Struct.is(value)) {
        return value;
      }
  
      assert(Obj.is(value), errs.ERR_BAD_TYPE_VALUE, value, name, 'an `Obj`');
  
      // makes `new` optional
      if (!(this instanceof Struct)) { 
        return new Struct(value, mut); 
      }
      
      for (var k in props) {
        if (props.hasOwnProperty(k)) {
          this[k] = props[k](value[k], mut);
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
  
    // check combinator args
    var combinator = 'union';
    name = ensureName(name, combinator, types);
    assert(areTypes(types) && types.length >= 2, errs.ERR_BAD_COMBINATOR_ARGUMENT, 'types', types, combinator, 'a list(type) of length >= 2');
  
    function Union(value, mut) {
      forbidNewOperator(this, Union);
      assert(Func.is(Union.dispatch), 'unimplemented %s.dispatch()', name);
      var T = Union.dispatch(value);
      assert(isType(T), '%s.dispatch() returns no type', name);
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
        arr.push(type(v, mut));
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
  
    // check combinator args
    var combinator = 'dict';
    name = ensureName(name, combinator, [type]);
    assert(isType(type), errs.ERR_BAD_COMBINATOR_ARGUMENT, 'type', type, combinator, 'a type');

    // cache expected value
    var expected = format('a dict of `%s`', getName(type));
  
    function Dict(value, mut) {
  
      forbidNewOperator(this, Dict);
      assert(Obj.is(value), errs.ERR_BAD_TYPE_VALUE, value, name, expected);
  
      // makes Dict idempotent
      if (Dict.isDict(value)) {
        return value;
      }
  
      var obj = {};
      for (var k in value) {
        if (value.hasOwnProperty(k)) {
          obj[k] = type(value[k], mut);
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

  function func(Arguments, f, Return, name) {
  
    name = name || 'func()';
    Arguments = Arr.is(Arguments) ? tuple(Arguments, 'Arguments') : Arguments;
    assert(isType(Arguments), errs.ERR_BAD_COMBINATOR_ARGUMENT, 'Arguments', Arguments, name, 'a type or a list of types');
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

    util: {
      mixin: mixin,
      format: format,
      isType: isType,
      getName: getName,
      getKind: getKind,
      isKind: isKind,
      values: values,
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
