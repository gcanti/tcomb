/*! @preserve
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2014 Giulio Canti
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 */

'use strict';

// configurable
exports.stringify = function stringify(x) {
  try { // handle "Converting circular structure to JSON" error
    return JSON.stringify(x, null, 2);
  } catch (e) {
    return String(x);
  }
};

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

function isUnion(x) {
  return isType(x) && (x.meta.kind === 'union');
}

function isTypeName(name) {
  return isNil(name) || isString(name);
}

// Returns true if x is of type `type`
function is(x, type) {
  return isType(type) ? type.is(x) : isInstanceOf(x, type); // type should be a class constructor
}

function create(type, value, path) {
  if (isType(type)) {
    // for structs the new operator is allowed
    return isStruct(type) ? new type(value, path) : type(value, path);
  }

  if (process.env.NODE_ENV !== 'production') {
    // type should be a class constructor and value some instance, just check membership and return the value
    path = path || [getFunctionName(type)];
    assert(isInstanceOf(value, type), function () { return 'Invalid value ' + exports.stringify(value) + ' supplied to ' + path.join('/'); });
  }

  return value;
}

function getFunctionName(f) {
  return f.displayName || f.name || '<function' + f.length + '>';
}

function getTypeName(constructor) {
  if (isType(constructor)) { return constructor.displayName; }
  return getFunctionName(constructor);
}

// configurable
exports.fail = function fail(message) {
  throw new TypeError('[tcomb] ' + message);
};

function assert(guard, message) {
  if (guard !== true) {
    if (isFunction(message)) {
      message = message();
    }
    else if (isNil(message)) {
      message = 'Assert failed (turn on "Pause on exceptions" in your Source panel)';
    }
    exports.fail(message);
  }
}

// safe mixin: cannot override props unless specified
function mixin(target, source, overwrite) {
  if (isNil(source)) { return target; }
  for (var k in source) {
    if (source.hasOwnProperty(k)) {
      if (overwrite !== true) {
        if (process.env.NODE_ENV !== 'production') {
          assert(!target.hasOwnProperty(k), function () { return 'Invalid call to mixin(target, source, [overwrite]): cannot overwrite property "' + k + '" of target object'; });
        }
      }
      target[k] = source[k];
    }
  }
  return target;
}

function forbidNewOperator(x, type) {
  assert(!isInstanceOf(x, type), function () { return 'Cannot use the new operator to instantiate the type ' + getTypeName(type); });
}

function getShallowCopy(x) {
  if (isArray(x)) { return x.concat(); }
  if (isObject(x)) { return mixin({}, x); }
  return x;
}

// immutability helper
function update(instance, spec) {

  if (process.env.NODE_ENV !== 'production') {
    assert(isObject(spec), function () { return 'Invalid argument spec ' + exports.stringify(spec) + ' supplied to function update(instance, spec): expected an object containing commands'; });
  }

  var value = getShallowCopy(instance);
  for (var k in spec) {
    if (spec.hasOwnProperty(k)) {
      if (update.commands.hasOwnProperty(k)) {
        return update.commands[k](spec[k], value);
      }
      else {
        value[k] = update(value[k], spec[k]);
      }
    }
  }
  return value;
}

// built-in commands

function $apply(f, value) {
  if (process.env.NODE_ENV !== 'production') {
    assert(isFunction(f), 'Invalid argument f supplied to immutability helper { $apply: f } (expected a function)');
  }
  return f(value);
}

function $push(elements, arr) {
  if (process.env.NODE_ENV !== 'production') {
    assert(isArray(elements), 'Invalid argument elements supplied to immutability helper { $push: elements } (expected an array)');
    assert(isArray(arr), 'Invalid value supplied to immutability helper $push (expected an array)');
  }
  return arr.concat(elements);
}

function $remove(keys, obj) {
  if (process.env.NODE_ENV !== 'production') {
    assert(isArray(keys), 'Invalid argument keys supplied to immutability helper { $remove: keys } (expected an array)');
    assert(isObject(obj), 'Invalid value supplied to immutability helper $remove (expected an object)');
  }
  for (var i = 0, len = keys.length; i < len; i++ ) {
    delete obj[keys[i]];
  }
  return obj;
}

function $set(value) {
  return value;
}

function $splice(splices, arr) {
  if (process.env.NODE_ENV !== 'production') {
    assert(list(Arr).is(splices), 'Invalid argument splices supplied to immutability helper { $splice: splices } (expected an array of arrays)');
    assert(isArray(arr), 'Invalid value supplied to immutability helper $splice (expected an array)');
  }
  return splices.reduce(function (acc, splice) {
    acc.splice.apply(acc, splice);
    return acc;
  }, arr);
}

function $swap(config, arr) {
  if (process.env.NODE_ENV !== 'production') {
    assert(isObject(config), 'Invalid argument config supplied to immutability helper { $swap: config } (expected an object)');
    assert(isNumber(config.from), 'Invalid argument config.from supplied to immutability helper { $swap: config } (expected a number)');
    assert(isNumber(config.to), 'Invalid argument config.to supplied to immutability helper { $swap: config } (expected a number)');
    assert(isArray(arr), 'Invalid value supplied to immutability helper $swap (expected an array)');
  }
  var element = arr[config.to];
  arr[config.to] = arr[config.from];
  arr[config.from] = element;
  return arr;
}

function $unshift(elements, arr) {
  if (process.env.NODE_ENV !== 'production') {
    assert(isArray(elements), 'Invalid argument elements supplied to immutability helper {$unshift: elements} (expected an array)');
    assert(isArray(arr), 'Invalid value supplied to immutability helper $unshift (expected an array)');
  }
  return elements.concat(arr);
}

function $merge(obj, value) {
  return mixin(mixin({}, value), obj, true);
}

update.commands = {
  $apply: $apply,
  $push: $push,
  $remove: $remove,
  $set: $set,
  $splice: $splice,
  $swap: $swap,
  $unshift: $unshift,
  $merge: $merge
};

function irreducible(name, predicate) {

  if (process.env.NODE_ENV !== 'production') {
    assert(isString(name), function () { return 'Invalid argument name ' + exports.stringify(name) + ' supplied to irreducible(name, predicate) (expected a string)'; });
    assert(isFunction(predicate), 'Invalid argument predicate supplied to irreducible(name, predicate)');
  }

  function Irreducible(value, path) {

    if (process.env.NODE_ENV !== 'production') {
      forbidNewOperator(this, Irreducible);
      path = path || [name];
      assert(predicate(value), function () { return 'Invalid value ' + exports.stringify(value) + ' supplied to ' + path.join('/'); });
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

var Str = irreducible('String', isString);

var Num = irreducible('Number', isNumber);

var Bool = irreducible('Boolean', isBoolean);

var Arr = irreducible('Array', isArray);

var Obj = irreducible('Object', isObject);

var Func = irreducible('Function', isFunction);

var Err = irreducible('Error', function (x) {
  return isInstanceOf(x, Error);
});

var Re = irreducible('RegExp', function (x) {
  return isInstanceOf(x, RegExp);
});

var Dat = irreducible('Date', function (x) {
  return isInstanceOf(x, Date);
});

function getDefaultStructName(props) {
  return '{' + Object.keys(props).map(function (prop) {
    return prop + ': ' + getTypeName(props[prop]);
  }).join(', ') + '}';
}

function struct(props, name) {

  if (process.env.NODE_ENV !== 'production') {
    assert(dict(Str, Func).is(props), function () { return 'Invalid argument props ' + exports.stringify(props) + ' supplied to struct(props, [name]) combinator (expected a dictionary String -> Type)'; });
    assert(isTypeName(name), function () { return 'Invalid argument name ' + exports.stringify(name) + ' supplied to struct(props, [name]) combinator (expected a string)'; });
  }

  var displayName = name || getDefaultStructName(props);

  function Struct(value, path) {

    if (Struct.is(value)) { // makes Struct idempotent
      return value;
    }

    if (process.env.NODE_ENV !== 'production') {
      path = path || [displayName];
      assert(isObject(value), function () { return 'Invalid value ' + exports.stringify(value) + ' supplied to ' + path.join('/') + ' (expected an object)'; });
    }

    if (!isInstanceOf(this, Struct)) { // makes `new` optional
      return new Struct(value);
    }

    for (var k in props) {
      if (props.hasOwnProperty(k)) {
        var expected = props[k];
        var actual = value[k];
        this[k] = create(expected, actual, ( process.env.NODE_ENV !== 'production' ? path.concat(k + ': ' + getTypeName(expected)) : null ));
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
        assert(isStruct(x), function () { return 'Invalid argument structs[' + i + '] ' + exports.stringify(structs[i]) + ' supplied to ' + displayName + '.extend(structs, name)'; });
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

function getDefaultUnionName(types) {
  return types.map(getTypeName).join(' | ');
}

function union(types, name) {

  if (process.env.NODE_ENV !== 'production') {
    assert(isArray(types) && types.every(isFunction) && types.length >= 2, function () { return 'Invalid argument types ' + exports.stringify(types) + ' supplied to union(types, [name]) combinator (expected an array of at least 2 types)'; });
    assert(isTypeName(name), function () { return 'Invalid argument name ' + exports.stringify(name) + ' supplied to union(types, [name]) combinator (expected a string)'; });
  }

  var displayName = name || getDefaultUnionName(types);

  function Union(value, path) {

    if (process.env.NODE_ENV !== 'production') {
      forbidNewOperator(this, Union);
    }

    var type = Union.dispatch(value);

    if (process.env.NODE_ENV !== 'production') {
      path = path || [displayName];
      assert(isType(type), function () { return 'Invalid value ' + exports.stringify(value) + ' supplied to ' + path.join('/'); });
    }

    return create(type, value, path);
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
    for (var i = 0, len = types.length; i < len; i++ ) {
      var type = types[i];
      if (isUnion(type)) {
        var t = type.dispatch(x);
        if (!isNil(t)) {
          return t;
        }
      }
      else if (is(x, type)) {
        return type;
      }
    }
  };

  Union.update = function (instance, spec) {
    return Union(exports.update(instance, spec));
  };

  return Union;
}

function getDefaultIntersectionName(types) {
  return types.map(getTypeName).join(' & ');
}

function intersection(types, name) {

  if (process.env.NODE_ENV !== 'production') {
    assert(isArray(types) && types.every(isFunction) && types.length >= 2, function () { return 'Invalid argument types ' + exports.stringify(types) + ' supplied to intersection(types, [name]) combinator (expected an array of at least 2 types)'; });
    assert(isTypeName(name), function () { return 'Invalid argument name ' + exports.stringify(name) + ' supplied to intersection(types, [name]) combinator (expected a string)'; });
  }

  var displayName = name || getDefaultIntersectionName(types);

  function Intersection(value, path) {

    if (process.env.NODE_ENV !== 'production') {
      forbidNewOperator(this, Intersection);
      path = path || [displayName];
      assert(Intersection.is(value), function () { return 'Invalid value ' + exports.stringify(value) + ' supplied to ' + path.join('/'); });
    }

    return value;
  }

  Intersection.meta = {
    kind: 'intersection',
    types: types,
    name: name
  };

  Intersection.displayName = displayName;

  Intersection.is = function (x) {
    return types.every(function (type) {
      return is(x, type);
    });
  };

  Intersection.update = function (instance, spec) {
    return Intersection(exports.update(instance, spec));
  };

  return Intersection;
}

function getDefaultMaybeName(type) {
  return '?' + getTypeName(type);
}

function maybe(type, name) {

  if (process.env.NODE_ENV !== 'production') {
    assert(isFunction(type), function () { return 'Invalid argument type ' + exports.stringify(type) + ' supplied to maybe(type, [name]) combinator (expected a type)'; });
  }

  if (isMaybe(type) || type === Any || type === Nil) { // makes the combinator idempotent and handle Any, Nil
    return type;
  }

  if (process.env.NODE_ENV !== 'production') {
    assert(isTypeName(name), function () { return 'Invalid argument name ' + exports.stringify(name) + ' supplied to maybe(type, [name]) combinator (expected a string)'; });
  }

  name = name || getDefaultMaybeName(type);

  function Maybe(value, path) {
    if (process.env.NODE_ENV !== 'production') {
      forbidNewOperator(this, Maybe);
    }
    return isNil(value) ? null : create(type, value, path);
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

function getDefaultEnumsName(map) {
  return Object.keys(map).map(function (k) { return exports.stringify(k); }).join(' | ');
}

function enums(map, name) {

  if (process.env.NODE_ENV !== 'production') {
    assert(isObject(map), function () { return 'Invalid argument map ' + exports.stringify(map) + ' supplied to enums(map, [name]) combinator (expected a dictionary of String -> String | Number)'; });
    assert(isTypeName(name), function () { return 'Invalid argument name ' + exports.stringify(name) + ' supplied to enums(map, [name]) combinator (expected a string)'; });
  }

  var displayName = name || getDefaultEnumsName(map);

  function Enums(value, path) {

    if (process.env.NODE_ENV !== 'production') {
      forbidNewOperator(this, Enums);
      path = path || [displayName];
      assert(Enums.is(value), function () { return 'Invalid value ' + exports.stringify(value) + ' supplied to ' + path.join('/') + ' (expected one of ' + exports.stringify(Object.keys(map)) + ')'; });
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

function getDefaultTupleName(types) {
  return '[' + types.map(getTypeName).join(', ') + ']';
}

function tuple(types, name) {

  if (process.env.NODE_ENV !== 'production') {
    assert(isArray(types) && types.every(isFunction), function () { return 'Invalid argument types ' + exports.stringify(types) + ' supplied to tuple(types, [name]) combinator (expected an array of types)'; });
    assert(isTypeName(name), function () { return 'Invalid argument name ' + exports.stringify(name) + ' supplied to tuple(types, [name]) combinator (expected a string)'; });
  }

  var displayName = name || getDefaultTupleName(types);

  function isTuple(x) {
    return types.every(function (type, i) {
      return is(x[i], type);
    });
  }

  function Tuple(value, path) {

    if (process.env.NODE_ENV !== 'production') {
      path = path || [displayName];
      assert(isArray(value) && value.length === types.length, function () { return 'Invalid value ' + exports.stringify(value) + ' supplied to ' + path.join('/') + ' (expected an array of length ' + types.length + ')'; });
    }

    if (isTuple(value)) { // makes Tuple idempotent
      if (process.env.NODE_ENV !== 'production') {
        Object.freeze(value);
      }
      return value;
    }

    var arr = [], expected, actual;
    for (var i = 0, len = types.length; i < len; i++) {
      expected = types[i];
      actual = value[i];
      arr.push(create(expected, actual, ( process.env.NODE_ENV !== 'production' ? path.concat(i + ': ' + getTypeName(expected)) : null )));
    }

    if (process.env.NODE_ENV !== 'production') {
      Object.freeze(arr);
    }

    return arr;
  }

  Tuple.meta = {
    kind: 'tuple',
    types: types,
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

function getDefaultSubtypeName(type, predicate) {
  return '{' + getTypeName(type) + ' | ' + getFunctionName(predicate) + '}';
}

function subtype(type, predicate, name) {

  if (process.env.NODE_ENV !== 'production') {
    assert(isFunction(type), function () { return 'Invalid argument type ' + exports.stringify(type) + ' supplied to subtype(type, predicate, [name]) combinator (expected a type)'; });
    assert(isFunction(predicate), function () { return 'Invalid argument predicate supplied to subtype(type, predicate, [name]) combinator (expected a function)'; });
    assert(isTypeName(name), function () { return 'Invalid argument name ' + exports.stringify(name) + ' supplied to subtype(type, predicate, [name]) combinator (expected a string)'; });
  }

  var displayName = name || getDefaultSubtypeName(type, predicate);

  function Subtype(value, path) {

    if (process.env.NODE_ENV !== 'production') {
      forbidNewOperator(this, Subtype);
      path = path || [displayName];
    }

    var x = create(type, value, path);

    if (process.env.NODE_ENV !== 'production') {
      assert(predicate(x), function () { return 'Invalid value ' + exports.stringify(value) + ' supplied to ' + path.join('/'); });
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

function getDefaultListName(type) {
  return 'Array<' + getTypeName(type) + '>';
}

function list(type, name) {

  if (process.env.NODE_ENV !== 'production') {
    assert(isFunction(type), function () { return 'Invalid argument type ' + exports.stringify(type) + ' supplied to list(type, [name]) combinator (expected a type)'; });
    assert(isTypeName(name), function () { return 'Invalid argument name ' + exports.stringify(name) + ' supplied to list(type, [name]) combinator (expected a string)'; });
  }

  var displayName = name || getDefaultListName(type);
  var typeNameCache = getTypeName(type);

  function isList(x) {
    return x.every(function (e) {
      return is(e, type);
    });
  }

  function List(value, path) {

    if (process.env.NODE_ENV !== 'production') {
      assert(isArray(value), function () { return 'Invalid value ' + exports.stringify(value) + ' supplied to ' + displayName + ' (expected an array of ' + typeNameCache + ')'; });
      path = path || [displayName];
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
      arr.push(create(type, actual, ( process.env.NODE_ENV !== 'production' ? path.concat(i + ': ' + typeNameCache) : null )));
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

function getDefaultDictName(domain, codomain) {
  return '{[key: ' + getTypeName(domain) + ']: ' + getTypeName(codomain) + '}';
}

function dict(domain, codomain, name) {

  if (process.env.NODE_ENV !== 'production') {
    assert(isFunction(domain), function () { return 'Invalid argument domain ' + exports.stringify(domain) + ' supplied to dict(domain, codomain, [name]) combinator (expected a type)'; });
    assert(isFunction(codomain), function () { return 'Invalid argument codomain ' + exports.stringify(codomain) + ' supplied to dict(domain, codomain, [name]) combinator (expected a type)'; });
    assert(isTypeName(name), function () { return 'Invalid argument name ' + exports.stringify(name) + ' supplied to dict(domain, codomain, [name]) combinator (expected a string)'; });
  }

  var displayName = name || getDefaultDictName(domain, codomain);
  var domainNameCache = getTypeName(domain);
  var codomainNameCache = getTypeName(codomain);

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

  function Dict(value, path) {

    if (process.env.NODE_ENV !== 'production') {
      assert(isObject(value), function () { return 'Invalid value ' + exports.stringify(value) + ' supplied to ' + displayName; });
      path = path || [displayName];
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
        k = create(domain, k, ( process.env.NODE_ENV !== 'production' ? path.concat(domainNameCache) : null ));
        var actual = value[k];
        obj[k] = create(codomain, actual, ( process.env.NODE_ENV !== 'production' ? path.concat(k + ': ' + codomainNameCache) : null ));
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

function getDefaultFuncName(domain, codomain) {
  return '(' + domain.map(getTypeName).join(', ') + ') => ' + getTypeName(codomain);
}

function func(domain, codomain, name) {

  domain = isArray(domain) ? domain : [domain]; // handle handy syntax for unary functions

  if (process.env.NODE_ENV !== 'production') {
    assert(list(Func).is(domain), function () { return 'Invalid argument domain ' + exports.stringify(domain) + ' supplied to func(domain, codomain, [name]) combinator (expected an array of types)'; });
    assert(isFunction(codomain), function () { return 'Invalid argument codomain ' + exports.stringify(codomain) + ' supplied to func(domain, codomain, [name]) combinator (expected a type)'; });
    assert(isTypeName(name), function () { return 'Invalid argument name ' + exports.stringify(name) + ' supplied to func(domain, codomain, [name]) combinator (expected a string)'; });
  }

  var displayName = name || getDefaultFuncName(domain, codomain);

  function FuncType(value, uncurried) {

    if (!isInstrumented(value)) { // automatically instrument the function
      return FuncType.of(value, uncurried);
    }

    if (process.env.NODE_ENV !== 'production') {
      assert(FuncType.is(value), function () { return 'Invalid value ' + exports.stringify(value) + ' supplied to ' + displayName; });
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
      assert(isFunction(f), function () { return 'Invalid argument f supplied to func.of ' + displayName + ' (expected a function)'; });
      assert(isNil(curried) || isBoolean(curried), function () { return 'Invalid argument curried ' + exports.stringify(curried) + ' supplied to func.of ' + displayName + ' (expected a boolean)'; });
    }

    if (FuncType.is(f)) { // makes FuncType.of idempotent
      return f;
    }

    function fn() {
      var args = Array.prototype.slice.call(arguments);
      var len = curried ?
        args.length :
        domain.length;
      var argsType = tuple(domain.slice(0, len));

      args = argsType(args); // type check arguments

      if (len === domain.length) {
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

function match(x) {
  var type, guard, f, count;
  for (var i = 1, len = arguments.length; i < len; ) {
    type = arguments[i];
    guard = arguments[i + 1];
    f = arguments[i + 2];

    if (isFunction(f) && !isType(f)) {
      i = i + 3;
    }
    else {
      f = guard;
      guard = Any.is;
      i = i + 2;
    }

    if (process.env.NODE_ENV !== 'production') {
      count = (count || 0) + 1;
      assert(isType(type), function () { return 'Invalid type in clause #' + count; });
      assert(isFunction(guard), function () { return 'Invalid guard in clause #' + count; });
      assert(isFunction(f), function () { return 'Invalid block in clause #' + count; });
    }

    if (type.is(x) && guard(x)) {
      return f(x);
    }
  }
  exports.fail('Match error');
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
  irreducible: irreducible,
  struct: struct,
  enums: enums,
  union: union,
  maybe: maybe,
  tuple: tuple,
  subtype: subtype,
  list: list,
  dict: dict,
  func: func,
  intersection: intersection,
  match: match
});
