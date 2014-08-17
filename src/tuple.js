/**
    ### tuple(Ts, [name])

    Defines a tuple whose coordinates have the specified types.

    - `Ts` array of coordinates types
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

  assert(Arr.is(Ts) && Ts.every(isType), errs.ERR_BAD_COMBINATOR_ARGUMENT, 'Ts');

  name = name || format('tuple(%s)', Ts.map(getName).join(', '));

  var len = Ts.length;

  function Tuple(value, mut) {

    forbidNewOperator(this, Tuple);
    assert(Arr.is(value) && value.length === len, errs.ERR_BAD_TYPE_VALUE, name);

    // makes Tuple idempotent
    if (Tuple.isTuple(value)) {
      return value;
    }

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

  Tuple.isTuple = function (x) {
    return Ts.every(function (T, i) { 
      return T.is(x[i]); 
    });
  };

  Tuple.is = function (x) {
    return Arr.is(x) && x.length === len && this.isTuple(x);
  };

  Tuple.update = update;

  return Tuple;
}

