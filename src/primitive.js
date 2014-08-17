//
// primitives
//

function primitive(name, is) {

  function Primitive(value) {
    forbidNewOperator(this, Primitive);
    assert(Primitive.is(value), errs.ERR_BAD_TYPE_VALUE, name);
    // all primitives types are idempotent
    return value;
  }

  Primitive.meta = {
    kind: 'primitive',
    name: name
  };

  Primitive.is = is;

  return Primitive;
}

var Nil = primitive('Nil', function (x) {
  return x === null || x === undefined;
});

var Str = primitive('Str', function (x) {
  return typeof x === 'string';
});

var Num = primitive('Num', function (x) {
  return typeof x === 'number' && isFinite(x) && !isNaN(x);
});

var Bool = primitive('Bool', function (x) {
  return x === true || x === false;
});

var Arr = primitive('Arr', function (x) {
  return x instanceof Array;
});

var Obj = primitive('Obj', function (x) {
  return !Nil.is(x) && typeof x === 'object' && !Arr.is(x);
});

var Func = primitive('Func', function (x) {
  return typeof x === 'function';
});

var Err = primitive('Err', function (x) {
  return x instanceof Error;
});

var Re = primitive('Re', function (x) {
  return x instanceof RegExp;
});

var Dat = primitive('Dat', function (x) {
  return x instanceof Date;
});