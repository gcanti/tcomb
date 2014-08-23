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

  // check combinator args
  name = ensureName(name, 'enums');
  assert(Obj.is(map), errs.ERR_BAD_COMBINATOR_ARGUMENT, 'map', map, name, 'an `Obj`');

  function Enums(value) {
    forbidNewOperator(this, Enums);
    assert(Enums.is(value), errs.ERR_BAD_TYPE_VALUE, name);
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

