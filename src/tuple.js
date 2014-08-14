//
// tuple
//

function tuple(types, name) {

  name = name || print('tuple(%s)', types.map(getName).join(', '));

  var len = types.length;

  function Tuple(values, mut) {

    assert(Arr.is(values), 'bad %s', name);

    var arr = [];
    for (var i = 0 ; i < len ; i++) {
      var Type = types[i];
      var value = values[i];
      arr.push(Type.is(value) ? value : coerce(Type, value, mut));
    }

    return freeze(arr, mut);
  }

  Tuple.meta = {
    kind: 'tuple',
    types: types,
    name: name,
    ctor: true
  };

  Tuple.is = function (x) {
    return Arr.is(x) && x.length === len && 
      types.every(function (type, i) { 
        return type.is(x[i]); 
      });
  };

  Tuple.update = function (instance, index, element, mut) {
    var Type = types[index],
      value = Type.is(element) ? element : coerce(Type, element, mut),
      arr = update(instance, index, value);
    return freeze(arr, mut);
  };

  return Tuple;
}

