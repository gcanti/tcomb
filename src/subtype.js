//
// subtype
//

function subtype(Type, predicate, name) {

  name = name || print('subtype(%s)', getName(Type));

  function Subtype(values, mut) {
    if (this instanceof Subtype) {
      assert(Subtype.meta.ctor, 'cannot use new with %s', name);
    }
    var x = coerce(Type, values, mut);
    assert(predicate(x), 'bad ' + name);
    return x;
  }

  Subtype.meta = {
    kind: 'subtype',
    type: Type,
    predicate: predicate,
    name: name,
    ctor: Type.ctor
  };

  Subtype.is = function (x) {
    return Type.is(x) && predicate(x);
  };

  return Subtype;
}

