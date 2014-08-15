//
// utils
//

var slice = Array.prototype.slice;

function freeze(obj_or_arr, unless) {
  if (unless !== true && Object.freeze) {
    Object.freeze(obj_or_arr);
  }
  return obj_or_arr;
}

function mixin(x, y, overwrite) {
  for (var k in y) {
    if (y.hasOwnProperty(k)) {
      if (!overwrite) {
        assert(!x.hasOwnProperty(k), 'mixin(): cannot overwrite property %s', k);
      }
      x[k] = y[k];
    }
  }
  return x;
}

function getName(type) { 
  return type.meta && type.meta.name ? type.meta.name : type.name || 'Unknown';
}

function print() {
  var args = slice.call(arguments);
  var index = 0;
  return args[0].replace(/%([a-z%])/g, function(match, format) {
    if (match === '%%') return match;
    index++;
    var formatter = print.formatters[format];
    var arg = args[index];
    return formatter(arg);
  });
}

print.formatters = {
  s: function (x) { return String(x); },
  o: function (x) { return JSON.stringify(x); }
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
