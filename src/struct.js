//
// struct
//

function struct(props, name) {

  name = name || 'struct()';

  function Struct(values, mut) {
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

  Struct.update = update;

  return Struct;
}
