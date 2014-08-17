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

function union(Ts, name) {

  assert(Arr.is(Ts) && Ts.every(isType), 'bad types');

  name = name || format('union(%s)', Ts.map(getName).join(', '));

  function Union(value, mut) {
    forbidNewOperator(this, Union);
    assert(Func.is(Union.dispatch), 'unimplemented %s.dispatch()', name);
    var T = Union.dispatch(value);
    // a union type is idempotent iif every T in Ts is idempotent
    return T(value, mut);
  }

  Union.meta = {
    kind: 'union',
    types: Ts,
    name: name
  };

  Union.is = function (x) {
    return Ts.some(function (T) {
      return T.is(x);
    });
  };

  return Union;
}
