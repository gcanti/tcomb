//
// union
//

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
