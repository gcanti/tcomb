//
// list
//

function list(Type, name) {

  name = name || format('list(%s)', getName(Type));

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


  List.update = update;

  return List;
}

