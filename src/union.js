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
    Shape.is(new Circle({center: p, radius: 10})); // => true
    ```
**/

function union(types, name) {

  name = name || format('union(%s)', types.map(getName).join(', '));

  function Union(values, mut) {
    assert(Func.is(Union.dispatch), 'unimplemented %s.dispatch()', name);
    var Type = Union.dispatch(values);
    if (this instanceof Union) {
      assert(Type.meta.ctor, 'cannot use new with %s', name);
    }
    return coerce(Type, values, mut);
  }

  Union.meta = {
    kind: 'union',
    types: types,
    name: name,
    ctor: types.every(function (type) { return type.meta.ctor; })
  };

  Union.is = function (x) {
    return types.some(function (type) {
      return type.is(x);
    });
  };

  return Union;
}
