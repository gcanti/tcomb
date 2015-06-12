'use strict';

function isInstanceOf(x, constructor) {
  return x instanceof constructor;
}

function isNil(x) {
  return x === null || x === void 0;
}

function isBoolean(x) {
  return x === true || x === false;
}

function isString(x) {
  return typeof x === 'string';
}

function isNumber(x) {
  return typeof x === 'number' && isFinite(x) && !isNaN(x);
}

function isFunction(x) {
  return typeof x === 'function';
}

function isArray(x) {
  return isInstanceOf(x, Array);
}

function isObject(x) {
  return !isNil(x) && typeof x === 'object' && !isArray(x);
}

function isType(x) {
  return isFunction(x) && isObject(x.meta);
}

function isStruct(x) {
  return isType(x) && (x.meta.kind === 'struct');
}

function isMaybe(x) {
  return isType(x) && (x.meta.kind === 'maybe');
}

function isTypeName(name) {
  return isNil(name) || isString(name);
}

// Returns true if x is of type `type`
function is(x, type) {
  return isType(type) ?
    type.is(x) :
    isInstanceOf(x, type); // type should be a class constructor
}

function create(type, value) {
  if (isType(type)) {
    return isStruct(type) ?
      // for structs the new operator is allowed
      new type(value) :
      type(value);
  }

  if (process.env.NODE_ENV !== 'production') {
    // type should be a class constructor and value some instance, just check membership and return the value
    assert(isInstanceOf(value, type), 'Invalid argument value supplied to constructor ' + getFunctionName(type));
  }

  return value;
}

function getFunctionName(f) {
  return f.displayName || f.name || '<function' + f.length + '>';
}

function getTypeName(constructor) {
  return isType(constructor) ?
    constructor.displayName :
    getFunctionName(constructor);
}

// configurable
exports.fail = function fail(message) {
  throw new TypeError(message);
};

function assert(guard, message) {
  if (guard !== true) {
    exports.fail(message || 'assert failed');
  }
}

var slice = Array.prototype.slice;

// safe mixin: cannot override props unless specified
function mixin(target, source, overwrite) {
  if (isNil(source)) { return target; }
  for (var k in source) {
    if (source.hasOwnProperty(k)) {
      if (overwrite !== true) {
        if (process.env.NODE_ENV !== 'production') {
          assert(!target.hasOwnProperty(k), 'Cannot overwrite property ' + k);
        }
      }
      target[k] = source[k];
    }
  }
  return target;
}

function forbidNewOperator(x, type) {
  assert(!isInstanceOf(x, type), 'Cannot use the new operator to instantiate a type ' + getTypeName(type));
}

function shallowCopy(x) {
  return isArray(x) ?
    x.concat() :
    isObject(x) ?
      mixin({}, x) :
      x;
}

// immutability helper
function update(instance, spec) {

  if (process.env.NODE_ENV !== 'production') {
    assert(isObject(spec), 'Invalid argument spec supplied to update()');
  }

  var value = shallowCopy(instance);
  for (var k in spec) {
    if (spec.hasOwnProperty(k)) {
      if (update.commands.hasOwnProperty(k)) {
        if (process.env.NODE_ENV !== 'production') {
          assert(Object.keys(spec).length === 1, 'Invalid argument spec supplied to `update()`');
        }
        return update.commands[k](spec[k], value);
      }
      else {
        value[k] = update(value[k], spec[k]);
      }
    }
  }
  return value;
}

update.commands = {
  '$apply': function (f, value) {

    if (process.env.NODE_ENV !== 'production') {
      assert(isFunction(f), 'Invalid argument f supplied to $apply command');
    }

    return f(value);
  },
  '$push': function (elements, arr) {

    if (process.env.NODE_ENV !== 'production') {
      assert(isArray(elements), 'Invalid argument elements supplied to $push command');
      assert(isArray(arr), 'Invalid argument arr supplied to $push command');
    }

    return arr.concat(elements);
  },
  '$remove': function (keys, obj) {

    if (process.env.NODE_ENV !== 'production') {
      assert(isArray(keys), 'Invalid argument keys supplied to $remove command');
      assert(isObject(obj), 'Invalid argument obj supplied to $remove command');
    }

    for (var i = 0, len = keys.length; i < len; i++ ) {
      delete obj[keys[i]];
    }
    return obj;
  },
  '$set': function (value) {
    return value;
  },
  '$splice': function (splices, arr) {

    if (process.env.NODE_ENV !== 'production') {
      assert(list(Arr).is(splices), 'Invalid argument splices supplied to $splice command');
      assert(isArray(arr), 'Invalid argument arr supplied to $splice command');
    }

    return splices.reduce(function (acc, splice) {
      acc.splice.apply(acc, splice);
      return acc;
    }, arr);
  },
  '$swap': function (config, arr) {

    if (process.env.NODE_ENV !== 'production') {
      assert(isObject(config), 'Invalid argument config supplied to $swap command');
      assert(isNumber(config.from), 'Invalid argument config.from supplied to $swap command');
      assert(isNumber(config.to), 'Invalid argument config.to supplied to $swap command');
      assert(isArray(arr), 'Invalid argument arr supplied to $swap command');
    }

    var element = arr[config.to];
    arr[config.to] = arr[config.from];
    arr[config.from] = element;
    return arr;
  },
  '$unshift': function (elements, arr) {

    if (process.env.NODE_ENV !== 'production') {
      assert(isArray(elements), 'Invalid argument elements supplied to $unshift command');
      assert(isArray(arr), 'Invalid argument arr supplied to $unshift command');
    }

    return elements.concat(arr);
  },
  '$merge': function (obj, value) {
    return mixin(mixin({}, value), obj, true);
  }
};

function irreducible(name, predicate) {

  if (process.env.NODE_ENV !== 'production') {
    assert(isString(name), 'Invalid argument name supplied to irreducible combinator');
    assert(isFunction(predicate), 'Invalid argument predicate supplied to irreducible combinator');
  }

  function Irreducible(value) {

    if (process.env.NODE_ENV !== 'production') {
      forbidNewOperator(this, Irreducible);
      assert(predicate(value), 'Invalid argument value supplied to irreducible ' + name);
    }

    return value;
  }

  Irreducible.meta = {
    kind: 'irreducible',
    name: name
  };

  Irreducible.displayName = name;

  Irreducible.is = predicate;

  return Irreducible;
}

var Any = irreducible('Any', function () {
  return true;
});

var Nil = irreducible('Nil', isNil);

var Str = irreducible('Str', isString);

var Num = irreducible('Num', isNumber);

var Bool = irreducible('Bool', isBoolean);

var Arr = irreducible('Arr', isArray);

var Obj = irreducible('Obj', isObject);

var Func = irreducible('Func', isFunction);

var Err = irreducible('Err', function (x) {
  return isInstanceOf(x, Error);
});

var Re = irreducible('Re', function (x) {
  return isInstanceOf(x, RegExp);
});

var Dat = irreducible('Dat', function (x) {
  return isInstanceOf(x, Date);
});

function struct(props, name) {

  if (process.env.NODE_ENV !== 'production') {
    assert(dict(Str, Func).is(props), 'Invalid argument props supplied to struct combinator');
    assert(isTypeName(name), 'Invalid argument name supplied to struct combinator');
  }

  var defaultName = '{' + Object.keys(props).map(function (prop) {
    return prop + ': ' + getTypeName(props[prop]);
  }).join(', ') + '}';

  var displayName = name || defaultName;

  function Struct(value) {

    if (Struct.is(value)) { // makes Struct idempotent
      return value;
    }

    if (process.env.NODE_ENV !== 'production') {
      assert(isObject(value), 'Invalid argument value supplied to struct ' + displayName);
    }

    if (!isInstanceOf(this, Struct)) { // makes `new` optional
      return new Struct(value);
    }

    for (var k in props) {
      if (props.hasOwnProperty(k)) {
        var expected = props[k];
        var actual = value[k];
        this[k] = create(expected, actual);
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      Object.freeze(this);
    }

  }

  Struct.meta = {
    kind: 'struct',
    props: props,
    name: name
  };

  Struct.displayName = displayName;

  Struct.is = function (x) {
    return isInstanceOf(x, Struct);
  };

  Struct.update = function (instance, spec) {
    return new Struct(exports.update(instance, spec));
  };

  Struct.extend = function (structs, name) {
    structs = [].concat(structs).map(function (x, i) {
      if (isObject(x)) {
        return x;
      }
      if (process.env.NODE_ENV !== 'production') {
        assert(isStruct(x), 'Invalid argument structs[' + i + '] supplied to ' + displayName + '.extend()');
      }
      return x.meta.props;
    });
    structs.unshift(props);
    var ret = struct(structs.reduce(mixin, {}), name);
    mixin(ret.prototype, Struct.prototype); // prototypal inheritance
    return ret;
  };

  return Struct;
}

function union(types, name) {

  if (process.env.NODE_ENV !== 'production') {
    assert(isArray(types), 'Invalid argument types supplied to union combinator: must be an array');
    assert(types.every(isFunction), 'Invalid argument types supplied to union combinator: at least one element is not a type not a constructor');
    assert(types.length >= 2, 'Invalid argument types supplied to union combinator: provide at least two types');
    assert(isTypeName(name), 'Invalid argument name supplied to union combinator');
  }

  var defaultName = types.map(getTypeName).join(' | ');

  var displayName = name || defaultName;

  function Union(value) {

    if (process.env.NODE_ENV !== 'production') {
      forbidNewOperator(this, Union);
      assert(isFunction(Union.dispatch), 'Unimplemented dispatch() function for union ' + displayName);
    }

    var type = Union.dispatch(value);

    if (process.env.NODE_ENV !== 'production') {
      assert(isType(type), 'The dispatch() function of union ' + displayName + ' returns no type');
    }

    return create(type, value);
  }

  Union.meta = {
    kind: 'union',
    types: types,
    name: name
  };

  Union.displayName = displayName;

  Union.is = function (x) {
    return types.some(function (type) {
      return is(x, type);
    });
  };

  Union.dispatch = function (x) { // default dispatch implementation
    for (var i = 0; i < types.length; i++ ) {
      if (is(x, types[i])) {
        return types[i];
      }
    }
  };

  return Union;
}

function maybe(type, name) {

  if (process.env.NODE_ENV !== 'production') {
    assert(isFunction(type), 'Invalid argument type supplied to maybe combinator');
  }

  if (isMaybe(type) || type === Any || type === Nil) { // makes the combinator idempotent and handle Any, Nil
    return type;
  }

  if (process.env.NODE_ENV !== 'production') {
    assert(isTypeName(name), 'Invalid argument name supplied to maybe combinator');
  }

  name = name || ('?' + getTypeName(type));

  function Maybe(value) {
    if (process.env.NODE_ENV !== 'production') {
      forbidNewOperator(this, Maybe);
    }
    return isNil(value) ? null : create(type, value);
  }

  Maybe.meta = {
    kind: 'maybe',
    type: type,
    name: name
  };

  Maybe.displayName = name;

  Maybe.is = function (x) {
    return isNil(x) || is(x, type);
  };

  return Maybe;
}

function enums(map, name) {

  if (process.env.NODE_ENV !== 'production') {
    assert(isObject(map), 'Invalid argument map supplied to enums combinator');
    assert(isTypeName(name), 'Invalid argument name supplied to enums combinator');
  }

  var defaultName = Object.keys(map).map(function (k) { return JSON.stringify(k); }).join(' | ');

  var displayName = name || defaultName;

  function Enums(value) {
    if (process.env.NODE_ENV !== 'production') {
      forbidNewOperator(this, Enums);
      assert(Enums.is(value), 'Invalid argument value supplied to enums ' + displayName + ', expected one of ' + JSON.stringify(Object.keys(map)));
    }
    return value;
  }

  Enums.meta = {
    kind: 'enums',
    map: map,
    name: name
  };

  Enums.displayName = displayName;

  Enums.is = function (x) {
    return map.hasOwnProperty(x);
  };

  return Enums;
}

enums.of = function (keys, name) {
  keys = isString(keys) ? keys.split(' ') : keys;
  var value = {};
  keys.forEach(function (k) {
    value[k] = k;
  });
  return enums(value, name);
};

function tuple(types, name) {

  if (process.env.NODE_ENV !== 'production') {
    assert(isArray(types), 'Invalid argument types supplied to tuple combinator: must be an array');
    assert(types.every(isFunction), 'Invalid argument types supplied to tuple combinator: at least one element is not a type not a constructor');
    assert(isTypeName(name), 'Invalid argument name supplied to tuple combinator');
  }

  var defaultName = '[' + types.map(getTypeName).join(', ') + ']';

  var displayName = name || defaultName;

  function isTuple(x) {
    return types.every(function (type, i) {
      return is(x[i], type);
    });
  }

  function Tuple(value) {

    if (process.env.NODE_ENV !== 'production') {
      assert(isArray(value) && value.length === types.length, 'Invalid argument value supplied to tuple ' + displayName + ', expected an array of length ' + types.length);
    }

    if (isTuple(value)) { // makes Tuple idempotent
      if (process.env.NODE_ENV !== 'production') {
        Object.freeze(value);
      }
      return value;
    }

    var arr = [], expected, actual;
    for (var i = 0; i < types.length; i++) {
      expected = types[i];
      actual = value[i];
      arr.push(create(expected, actual));
    }

    if (process.env.NODE_ENV !== 'production') {
      Object.freeze(arr);
    }

    return arr;
  }

  Tuple.meta = {
    kind: 'tuple',
    types: types,
    length: types.length,
    name: name
  };

  Tuple.displayName = displayName;

  Tuple.is = function (x) {
    return isArray(x) &&
      x.length === types.length &&
      isTuple(x);
  };

  Tuple.update = function (instance, spec) {
    return Tuple(exports.update(instance, spec));
  };

  return Tuple;
}

function subtype(type, predicate, name) {

  if (process.env.NODE_ENV !== 'production') {
    assert(isFunction(type), 'Invalid argument type subtype combinator');
    assert(isFunction(predicate), 'Invalid argument predicate supplied to subtype combinator');
    assert(isTypeName(name), 'Invalid argument name supplied to subtype combinator');
  }

  var defaultName = '{' + getTypeName(type) + ' | ' + getFunctionName(predicate) + '}';

  var displayName = name || defaultName;

  function Subtype(value) {

    if (process.env.NODE_ENV !== 'production') {
      forbidNewOperator(this, Subtype);
    }

    var x = create(type, value);

    if (process.env.NODE_ENV !== 'production') {
      assert(predicate(x), 'Invalid argument value supplied to subtype ' + displayName);
    }

    return x;
  }

  Subtype.meta = {
    kind: 'subtype',
    type: type,
    predicate: predicate,
    name: name
  };

  Subtype.displayName = displayName;

  Subtype.is = function (x) {
    return is(x, type) && predicate(x);
  };

  Subtype.update = function (instance, spec) {
    return Subtype(exports.update(instance, spec));
  };

  return Subtype;
}

function list(type, name) {

  if (process.env.NODE_ENV !== 'production') {
    assert(isFunction(type), 'Invalid argument type supplied to list combinator');
    assert(isTypeName(name), 'Invalid argument name supplied to list combinator');
  }

  var defaultName = 'Array<' + getTypeName(type) + '>';

  var displayName = name || defaultName;

  function isList(x) {
    return x.every(function (e) {
      return is(e, type);
    });
  }

  function List(value) {

    if (process.env.NODE_ENV !== 'production') {
      assert(isArray(value), 'Invalid argument value supplied to list ' + displayName);
    }

    if (isList(value)) { // makes List idempotent
      if (process.env.NODE_ENV !== 'production') {
        Object.freeze(value);
      }
      return value;
    }
    var arr = [];
    for (var i = 0, len = value.length; i < len; i++ ) {
      var actual = value[i];
      arr.push(create(type, actual));
    }

    if (process.env.NODE_ENV !== 'production') {
      Object.freeze(arr);
    }

    return arr;
  }

  List.meta = {
    kind: 'list',
    type: type,
    name: name
  };

  List.displayName = displayName;

  List.is = function (x) {
    return isArray(x) && isList(x);
  };

  List.update = function (instance, spec) {
    return List(exports.update(instance, spec));
  };

  return List;
}

function dict(domain, codomain, name) {

  if (process.env.NODE_ENV !== 'production') {
    assert(isFunction(domain), 'Invalid argument domain supplied to dict combinator');
    assert(isFunction(codomain), 'Invalid argument codomain supplied to dict combinator');
    assert(isTypeName(name), 'Invalid argument name supplied to dict combinator');
  }

  var defaultName = '{[key: ' + getTypeName(domain) + ']: ' + getTypeName(codomain) + '}';

  var displayName = name || defaultName;

  function isDict(x) {
    for (var k in x) {
      if (x.hasOwnProperty(k)) {
        if (!is(k, domain) || !is(x[k], codomain)) {
          return false;
        }
      }
    }
    return true;
  }

  function Dict(value) {

    if (process.env.NODE_ENV !== 'production') {
      assert(isObject(value), 'Invalid argument value supplied to dict ' + displayName);
    }

    if (isDict(value)) { // makes Dict idempotent
      if (process.env.NODE_ENV !== 'production') {
        Object.freeze(value);
      }
      return value;
    }

    var obj = {};
    for (var k in value) {
      if (value.hasOwnProperty(k)) {
        k = create(domain, k);
        var actual = value[k];
        obj[k] = create(codomain, actual);
      }
    }

    if (process.env.NODE_ENV !== 'production') {
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

  Dict.displayName = displayName;

  Dict.is = function (x) {
    return isObject(x) && isDict(x);
  };

  Dict.update = function (instance, spec) {
    return Dict(exports.update(instance, spec));
  };

  return Dict;
}

function isInstrumented(f) {
  return isFunction(f) && isObject(f.instrumentation);
}

function func(domain, codomain, name) {

  domain = isArray(domain) ? domain : [domain]; // handle handy syntax for unary functions

  if (process.env.NODE_ENV !== 'production') {
    assert(list(Func).is(domain), 'Invalid argument domain supplied to func combinator');
    assert(isFunction(codomain), 'Invalid argument codomain supplied to func combinator');
    assert(isTypeName(name), 'Invalid argument name supplied to func combinator');
  }

  var defaultName = '(' + domain.map(getTypeName).join(', ') + ') => ' + getTypeName(codomain);

  var displayName = name || defaultName;

  function FuncType(value, uncurried) {

    if (!isInstrumented(value)) { // automatically instrument the function
      return FuncType.of(value, uncurried);
    }

    if (process.env.NODE_ENV !== 'production') {
      assert(FuncType.is(value), 'Invalid argument value supplied to func ' + displayName);
    }

    return value;
  }

  FuncType.meta = {
    kind: 'func',
    domain: domain,
    codomain: codomain,
    name: name
  };

  FuncType.displayName = displayName;

  FuncType.is = function (x) {
    return isInstrumented(x) &&
      x.instrumentation.domain.length === domain.length &&
      x.instrumentation.domain.every(function (type, i) {
        return type === domain[i];
      }) &&
      x.instrumentation.codomain === codomain;
  };

  FuncType.of = function (f, curried) {

    if (process.env.NODE_ENV !== 'production') {
      assert(isFunction(f), 'Invalid argument f supplied to func.of ' + displayName);
      assert(isNil(curried) || isBoolean(curried), 'Invalid argument curried supplied to func.of ' + displayName);
    }

    if (FuncType.is(f)) { // makes FuncType.of idempotent
      return f;
    }

    function fn() {
      var args = slice.call(arguments);
      var len = curried ?
        args.length :
        domain.length;
      var argsType = tuple(domain.slice(0, len));

      args = argsType(args); // type check arguments

      if (len === domain.length) {
        /* jshint validthis: true */
        return create(codomain, f.apply(this, args));
      }
      else {
        var g = Function.prototype.bind.apply(f, [this].concat(args));
        var newdomain = func(domain.slice(len), codomain);
        return newdomain.of(g, curried);
      }
    }

    fn.instrumentation = {
      domain: domain,
      codomain: codomain,
      f: f
    };

    fn.displayName = getFunctionName(f);

    return fn;

  };

  return FuncType;

}

mixin(exports, {
  is: is,
  isType: isType,
  getTypeName: getTypeName,
  mixin: mixin,
  update: update,
  assert: assert,
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
});
