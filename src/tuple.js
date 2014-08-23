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

function tuple(types, name) {

  // check combinator args
  var combinator = 'tuple';
  name = ensureName(name, combinator, types);
  assert(areTypes(types) && types.length >= 2, errs.ERR_BAD_COMBINATOR_ARGUMENT, 'types', types, combinator, 'a list(type) of length >= 2');

  var len = types.length;

  function Tuple(value, mut) {

    forbidNewOperator(this, Tuple);
    assert(Arr.is(value) && value.length === len, errs.ERR_BAD_TYPE_VALUE, name);

    // makes Tuple idempotent
    if (Tuple.isTuple(value)) {
      return value;
    }

    var arr = [];
    for (var i = 0 ; i < len ; i++) {
      var T = types[i];
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
    types: types,
    name: name
  };

  Tuple.isTuple = function (x) {
    return types.every(function (type, i) { 
      return type.is(x[i]); 
    });
  };

  Tuple.is = function (x) {
    return Arr.is(x) && x.length === len && Tuple.isTuple(x);
  };

  Tuple.update = update;

  return Tuple;
}

