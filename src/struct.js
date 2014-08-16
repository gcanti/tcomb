/**
    ### struct(props, [name])

    Defines a struct like type.

    - `props` hash name -> type
    - `name` optional string useful for debugging

    Example

    ```javascript
    "use strict";

    // defines a struct with two numerical props
    var Point = struct({
        x: Num,
        y: Num
    });

    // methods are defined as usual
    Point.prototype.toString = function () {
        return '(' + this.x + ', ' + this.y + ')';
    };

    // costructor usage, p is immutable
    var p = new Point({x: 1, y: 2});

    p.x = 2; // => TypeError

    p = new Point({x: 1, y: 2}, true); // now p is mutable

    p.x = 2; // ok
    ```

    #### is(x)

    Returns `true` if `x` is an instance of the struct.

    ```javascript
    Point.is(p); // => true
    ```
**/

function struct(props, name) {

  name = name || 'struct()';

  function Struct(values, mut) {

    assert(Obj.is(values), 'bad %s', name);

    for (var prop in props) {
      if (props.hasOwnProperty(prop)) {
        var Type = props[prop],
          value = values[prop];
        this[prop] = Type.is(value) ? value : coerce(Type, value, mut);
      }
    }

    if (!mut) { Object.freeze(this); }
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
