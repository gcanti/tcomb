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

function subtype(type, predicate, name) {

  // check combinator args
  var combinator = 'subtype';
  name = ensureName(name, combinator, [type]);
  assert(isType(type), errs.ERR_BAD_COMBINATOR_ARGUMENT, 'type', type, combinator, 'a type');
  assert(Func.is(predicate), errs.ERR_BAD_COMBINATOR_ARGUMENT, 'predicate', predicate, combinator, 'a `Func`');

  function Subtype(value, mut) {
    forbidNewOperator(this, Subtype);
    // a subtype type is idempotent iif T is idempotent
    var x = type(value, mut);
    assert(predicate(x), errs.ERR_BAD_TYPE_VALUE, name);
    return x;
  }

  Subtype.meta = {
    kind: 'subtype',
    type: type,
    predicate: predicate,
    name: name
  };

  Subtype.is = function (x) {
    return type.is(x) && predicate(x);
  };

  /* fix #22
  if (type.meta.kind === 'struct') {
    // keep a reference to prototype to easily define new methods and attach them to supertype
    Subtype.prototype = type.prototype;
  }
  */

  return Subtype;
}

