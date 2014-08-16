/**
    ### subtype(type, predicate, [name])

    Defines a subtype of an existing type.

    - `type` the supertype
    - `predicate` a function with signature `(x) -> boolean`
    - `name` optional string useful for debugging

    Example

    ```javascript
    // points of the first quadrant
    var Q1Point = subtype(Point, function (p) {
        return p.x >= 0 && p.y >= 0;
    });

    // costructor usage, p is immutable
    var p = new Q1Point({x: 1, y: 2});

    p = new Q1Point({x: -1, y: -2}); // => fail!
    ```

    #### is(x)

    Returns `true` if `x` belongs to the subtype.

    ```javascript
    var Int = subtype(Num, function (n) {
        return n === parseInt(n, 10);
    });

    Int.is(2);      // => true
    Int.is(1.1);    // => false
    ```
**/

function subtype(Type, predicate, name) {

  name = name || format('subtype(%s)', getName(Type));

  function Subtype(values, mut) {
    if (this instanceof Subtype) {
      assert(Subtype.meta.ctor, 'cannot use new with %s', name);
    }
    var x = coerce(Type, values, mut);
    assert(predicate(x), 'bad %s', name);
    return x;
  }

  Subtype.meta = {
    kind: 'subtype',
    type: Type,
    predicate: predicate,
    name: name,
    ctor: Type.meta.ctor
  };

  Subtype.is = function (x) {
    return Type.is(x) && predicate(x);
  };

  return Subtype;
}

