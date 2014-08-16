//
// primitives
//

function primitive(name, is) {

  function Primitive(values) {
    assert(!(this instanceof Primitive), 'cannot use new with %s', name);
    assert(Primitive.is(values), 'bad %s', name);
    return values;
  }

  Primitive.meta = {
    kind: 'primitive',
    name: name,
    ctor: false
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
  return !Nil.is(x) && x.constructor === Object && !Arr.is(x);
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

