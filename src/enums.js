/**
    #### enums.of(keys, [name])

    Returns an enums of an array of keys, useful when you don't mind to define
    custom values for the enums.

    - `keys` array (or string) of keys
    - `name` optional string useful for debugging

    Example

    ```javascript
    // result is the same as the main example
    var Direction = enums.of(['North', 'East', 'South', 'West']);

    // or..
    Direction = enums.of('North East South West');
    ```
**/

function enums(map, name) {

  name = name || 'enums()';

  function Enums(x) {
    assert(Enums.is(x), 'bad %s', name);
    assert(!(this instanceof Enums), 'cannot use new with %s', name);
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

