/**
    ### subtype(T, predicate, [name])

    Defines a subtype of an existing type.

    - `T` the supertype
    - `predicate` a function with signature `(x) -> boolean`
    - `name` optional string useful for debugging

    Example

    ```javascript
    // points of the first quadrant
    var Q1Point = subtype(Point, function (p) {
        return p.x >= 0 && p.y >= 0;
    });

    // costructor usage, p is immutable
    var p = Q1Point({x: 1, y: 2});

    p = Q1Point({x: -1, y: -2}); // => fail!
    ```
    **Note**. You can't add methods to `Q1Point` `prototype`, add them to the supertype `prototype` if needed.

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

function subtype(T, predicate, name) {

  assert(isType(T), errs.ERR_BAD_COMBINATOR_ARGUMENT, 'T');
  assert(Func.is(predicate), errs.ERR_BAD_COMBINATOR_ARGUMENT, 'predicate');

  name = name || format('subtype(%s)', getName(T));

  function Subtype(value, mut) {
    forbidNewOperator(this, Subtype);
    // a subtype type is idempotent iif T is idempotent
    var x = T(value, mut);
    assert(predicate(x), errs.ERR_BAD_TYPE_VALUE, name);
    return x;
  }

  Subtype.meta = {
    kind: 'subtype',
    type: T,
    predicate: predicate,
    name: name
  };

  Subtype.is = function (x) {
    return T.is(x) && predicate(x);
  };

  return Subtype;
}

