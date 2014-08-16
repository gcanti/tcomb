/**
    ### list(type, [name])

    Defines an array where all the elements are of type `type`.

    - `type` type of all the elements
    - `name` optional string useful for debugging

    Example

    ```javascript
    var Path = list(Point);

    // costructor usage, path is immutable
    var path = new Path([
        {x: 0, y: 0}, 
        {x: 1, y: 1}
    ]);
    ```

    #### is(x)

    Returns `true` if `x` belongs to the list.

    ```javascript
    var p1 = new Point({x: 0, y: 0});
    var p2 = new Point({x: 1, y: 2});
    Path.is([p1, p2]); // => true
    ```
**/

function list(Type, name) {

  name = name || format('list(%s)', getName(Type));

  function List(values, mut) {

    assert(Arr.is(values), 'bad %s', name);

    var arr = [];
    for (var i = 0, len = values.length ; i < len ; i++ ) {
      var value = values[i];
      arr.push(Type.is(value) ? value : coerce(Type, value, mut));
    }

    if (!mut) { Object.freeze(arr); }
    return arr;
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

