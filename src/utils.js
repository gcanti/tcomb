//
// utils
//

var slice = Array.prototype.slice;

var errs = {
  ERR_BAD_TYPE_VALUE: 'Bad type value `%s`',
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
