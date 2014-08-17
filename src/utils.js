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

function getName(T) {
  assert(Obj.is(T.meta), 'missing type meta hash');
  return T.meta.name;
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

format.formatters = {
  s: function (x) { return String(x); },
  j: function (x) { return JSON.stringify(x); }
};

function update() {
  assert(Func.is(options.update), 'options.update is missing');
  /*jshint validthis:true*/
  var T = this;
  var args = slice.call(arguments);
  var value = options.update.apply(T, args);
  return T(value);
}
