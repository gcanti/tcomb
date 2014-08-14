//
// struct
//

function struct(props, name) {

  name = name || 'struct()';

  function Struct(values, mut) {

    assert(Obj.is(values), 'bad %s', name);
    assert(maybe(Bool).is(mut), 'bad mut');

    for (var prop in props) {
      if (props.hasOwnProperty(prop)) {
        var Type = props[prop],
          value = values[prop];
        this[prop] = Type.is(value) ? value : coerce(Type, value, mut);
      }
    }

    freeze(this, mut);
  }

  Struct.meta = {
    kind: 'struct',
    props: props,
    name: name,
    ctor: true
  };

  Struct.is = function (x) { 
    return x instanceof Struct; 
  };

  Struct.update = function (instance, updates, mut) {

    assert(Struct.is(instance));
    assert(Obj.is(updates));

    var v = {};
    for (var prop in props) {
      if (props.hasOwnProperty(prop)) {
          v[prop] = updates.hasOwnProperty(prop) ? updates[prop] : instance[prop];
      }
    }
    return new Struct(v, mut);
  };

  return Struct;
}
