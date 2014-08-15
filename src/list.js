//
// list
//

function list(Type, name) {

  name = name || print('list(%s)', getName(Type));

  function List(values, mut) {

    assert(Arr.is(values), 'bad %s', name);

    var arr = [];
    for (var i = 0, len = values.length ; i < len ; i++ ) {
      var value = values[i];
      arr.push(Type.is(value) ? value : coerce(Type, value, mut));
    }

    return freeze(arr, mut);
  }

  List.meta = {
    kind: 'list',
    type: Type,
    name: name,
    ctor: true
  };

  List.is = function (x) {
    return Arr.is(x) && x.every(Type.is);
  };

  /* TODO deprecated
  List.append = function (instance, element, mut) {
    var value = Type.is(element) ? element : coerce(Type, element, mut),
      arr = append(instance, value);
    return freeze(arr, mut);
  };

  List.prepend = function (instance, element, mut) {
    var value = Type.is(element) ? element : coerce(Type, element, mut),
      arr = prepend(instance, value);
    return freeze(arr, mut);
  };

  List.update = function (instance, index, element, mut) {
    var value = Type.is(element) ? element : coerce(Type, element, mut),
      arr = update(instance, index, value);
    return freeze(arr, mut);
  };

  List.remove = function (instance, index, mut) {
    var arr = remove(instance, index);
    return freeze(arr, mut);
  };

  List.move = function (instance, from, to, mut) {
    var arr = move(instance, from, to);
    return freeze(arr, mut);
  };
  */

  return List;
}

