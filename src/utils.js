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

function getName(type) {
  assert(Obj.is(type.meta), 'missing type meta hash');
  return type.meta.name;
}

function format() {
  var args = slice.call(arguments);
  var len = args.length;
  var i = 1;
  var message = args[0];
  var str = message.replace(/%([a-z%])/g, function(match, type) {
    if (match === '%%') { return '%'; }       // handle escaping %
    if (i >= len) { return match; }           // handle less arguments than placeholders
    var formatter = format.formatters[type];
    if (!formatter) { return match; }         // handle undefined formatters
    return formatter(args[i++]);
  });
  if (i < len) {
    str += ' ' + args.slice(i).join(' ');     // handle more arguments than placeholders
  }
  return str;
}

format.formatters = {
  s: function (x) { return String(x); },
  j: function (x) { return JSON.stringify(x); }
};

function coerce(type, values, mut) {
  return type.meta.ctor ?
      /*jshint newcap: false*/
      new type(values, mut) :
      type(values, mut);
}

function update() {
  assert(Func.is(options.update), 'options.update is missing');
  /*jshint validthis:true*/
  var Type = this;
  var args = slice.call(arguments);
  var values = options.update.apply(Type, args);
  return coerce(Type, values);
}
