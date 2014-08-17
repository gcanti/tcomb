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
    var p = Point({x: 1, y: 2});

    p.x = 2; // => TypeError

    p = Point({x: 1, y: 2}, true); // now p is mutable

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

  function Struct(value, mut) {

    // makes `new` optional
    if (!(this instanceof Struct)) { 
      return new Struct(value, mut); 
    }
    
    // makes Struct idempotent
    if (Struct.is(value)) {
      return value;
    }

    assert(Obj.is(value), 'bad %s', name);

    for (var k in props) {
      if (props.hasOwnProperty(k)) {
        var T = props[k];
        var v = value[k];
        this[k] = T.is(v) ? v : T(v, mut);
      }
    }

    if (!mut) { 
      Object.freeze(this); 
    }
  }

  Struct.meta = {
    kind: 'struct',
    props: props,
    name: name
  };

  Struct.is = function (x) { 
    return x instanceof Struct; 
  };

  Struct.update = update;

  return Struct;
}
