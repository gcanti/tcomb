/**
    ### tuple(types, [name])

    Defines a tuple whose coordinates have the specified types.

    - `types` array of coordinates types
    - `name` optional string useful for debugging

    Example

    ```javascript
    var Area = tuple([Num, Num]);

    // constructor usage, area is immutable
    var area = new Area([1, 2]);
    ```

    #### is(x)

    Returns `true` if `x` belongs to the tuple.

    ```javascript
    Area.is([1, 2]);      // => true
    Area.is([1, 'a']);    // => false, the second element is not a Num
    Area.is([1, 2, 3]);   // => false, too many elements
    ```
**/

function tuple(types, name) {

  name = name || format('tuple(%s)', types.map(getName).join(', '));

  var len = types.length;

  function Tuple(values, mut) {

    assert(Arr.is(values), 'bad %s', name);

    var arr = [];
    for (var i = 0 ; i < len ; i++) {
      var Type = types[i];
      var value = values[i];
      arr.push(Type.is(value) ? value : coerce(Type, value, mut));
    }

    if (!mut) { Object.freeze(arr); }
    return arr;
  }

  Tuple.meta = {
    kind: 'tuple',
    types: types,
    name: name,
    ctor: true
  };

  Tuple.is = function (x) {
    return Arr.is(x) && x.length === len && 
      types.every(function (type, i) { 
        return type.is(x[i]); 
      });
  };

  Tuple.update = update;

  return Tuple;
}

