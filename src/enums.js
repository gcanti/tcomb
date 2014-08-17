/**
    ### enums(map, [name])

    Defines an enum of strings.

    - `map` hash enum -> value
    - `name` optional string useful for debugging

    Example

    ```javascript
    var Direction = enums({
        North: 0, 
        East: 1,
        South: 2, 
        West: 3
    });
    ```

    #### is(x)

    Returns `true` if `x` belongs to the enum.

    ```javascript
    Direction.is('North'); // => true
    ```
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
    assert(!(this instanceof Enums), 'cannot use new with %s', name);
    assert(Enums.is(x), 'bad %s', name);
    // all enums types are idempotent
    return x;
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
  keys.forEach(function (k, i) {
    value[k] = i;
  });
  return enums(value, name);
};

