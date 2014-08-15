//
// maybe
//

function maybe(Type, name) {

  name = name || print('maybe(%s)', getName(Type));

  function Maybe(values, mut) {
    assert(!(this instanceof Maybe), 'cannot use new with %s', name);
    return Nil.is(values) ? null : coerce(Type, values, mut);
  }

  Maybe.meta = {
    kind: 'maybe',
    type: Type,
    name: name,
    ctor: false // cannot use new with null
  };

  Maybe.is = function (x) {
    return Nil.is(x) || Type.is(x);
  };

  return Maybe;
}

