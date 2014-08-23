/**
    ### union(types, [name])

    Defines a union of types.

    - `types` array of types
    - `name` optional string useful for debugging

    Example

    ```javascript
    var Circle = struct({
        center: Point,
        radius: Num
    });

    var Rectangle = struct({
        bl: Point, // bottom left vertex
        tr: Point  // top right vertex
    });

    var Shape = union([
        Circle, 
        Rectangle
    ]);
    ```

    #### is(x)

    Returns `true` if `x` belongs to the union.

    ```javascript
    Shape.is(Circle({center: p, radius: 10})); // => true
    ```
**/

function union(types, name) {

  // check combinator args
  var combinator = 'union';
  name = ensureName(name, combinator, types);
  assert(areTypes(types) && types.length >= 2, errs.ERR_BAD_COMBINATOR_ARGUMENT, 'types', types, combinator, 'a list(type) of length >= 2');

  function Union(value, mut) {
    forbidNewOperator(this, Union);
    assert(Func.is(Union.dispatch), 'unimplemented %s.dispatch()', name);
    var T = Union.dispatch(value);
    // a union type is idempotent iif every T in types is idempotent
    return T(value, mut);
  }

  Union.meta = {
    kind: 'union',
    types: types,
    name: name
  };

  Union.is = function (x) {
    return types.some(function (T) {
      return T.is(x);
    });
  };

  return Union;
}
