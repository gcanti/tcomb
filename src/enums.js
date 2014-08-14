//
// enums
//

function enums(map, name) {

  name = name || 'enums()';

  function Enums(x) {
    assert(!(this instanceof Enums), 'cannot use new with %s', name);
    assert(Enums.is(x), 'bad %s', name);
    return x;
  }

  Enums.meta = {
    kind: 'enums',
    map: map,
    name: name,
    ctor: false
  };

  Enums.is = function (x) {
    return Str.is(x) && map.hasOwnProperty(x);
  };

  return Enums;
}

enums.of = function (keys, name) {
  keys = Str.is(keys) ? keys.split(' ') : keys;
  var values = {};
  keys.forEach(function (k, i) {
    values[k] = i;
  });
  return enums(values, name);
};

