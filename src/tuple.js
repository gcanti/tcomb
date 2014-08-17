/**
    ### tuple(types, [name])

    Defines a tuple whose coordinates have the specified types.

    - `types` array of coordinates types
    - `name` optional string useful for debugging

    Example

    ```javascript
    var Area = tuple([Num, Num]);

    // constructor usage, area is immutable
    var area = Area([1, 2]);
    ```

    #### is(x)

    Returns `true` if `x` belongs to the tuple.

    ```javascript
    Area.is([1, 2]);      // => true
    Area.is([1, 'a']);    // => false, the second element is not a Num
    Area.is([1, 2, 3]);   // => false, too many elements
    ```
**/

function tuple(Ts, name) {

  name = name || format('tuple(%s)', Ts.map(getName).join(', '));

  var len = Ts.length;

  function Tuple(value, mut) {

    forbidNewOperator(this, Tuple);
    assert(Arr.is(value), 'bad %s', name);

    var arr = [];
    for (var i = 0 ; i < len ; i++) {
      var T = Ts[i];
      var v = value[i];
      arr.push(T.is(v) ? v : T(v, mut));
    }

    if (!mut) { 
      Object.freeze(arr); 
    }
    return arr;
  }

  Tuple.meta = {
    kind: 'tuple',
    types: Ts,
    name: name
  };

  Tuple.is = function (x) {
    return Arr.is(x) && x.length === len && 
      Ts.every(function (T, i) { 
        return T.is(x[i]); 
      });
  };

  Tuple.update = update;

  return Tuple;
}

