/**
    ### maybe(type, [name])

    Same as `union([Nil, type])`.

    ```javascript
    // the value of a radio input where null = no selection
    var Radio = maybe(Str);

    Radio.is('a');     // => true
    Radio.is(null);    // => true
    Radio.is(1);       // => false
    ```    

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
**/

function maybe(Type, name) {

  name = name || format('maybe(%s)', getName(Type));

  function Maybe(values, mut) {
    assert(!(this instanceof Maybe), 'cannot use new with %s', name);
    return Nil.is(values) ? null : coerce(Type, values, mut);
  }

  Maybe.meta = {
    kind: 'maybe',
    type: Type,
    name: name,
    ctor: false // cannot use new with null
  };

  Maybe.is = function (x) {
    return Nil.is(x) || Type.is(x);
  };

  return Maybe;
}

