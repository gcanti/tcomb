/**
    ### list(type, [name])

    Defines an array where all the elements are of type `type`.

    - `type` type of all the elements
    - `name` optional string useful for debugging

    Example

    ```javascript
    var Path = list(Point);

    // costructor usage, path is immutable
    var path = Path([
        {x: 0, y: 0}, 
        {x: 1, y: 1}
    ]);
    ```

    #### is(x)

    Returns `true` if `x` belongs to the list.

    ```javascript
    var p1 = Point({x: 0, y: 0});
    var p2 = Point({x: 1, y: 2});
    Path.is([p1, p2]); // => true
    ```
**/

function list(T, name) {

  name = name || format('list(%s)', getName(T));

  function List(value, mut) {

    forbidNewOperator(this, List);
    assert(Arr.is(value), 'bad %s', name);

    var arr = [];
    for (var i = 0, len = value.length ; i < len ; i++ ) {
      var v = value[i];
      arr.push(T.is(v) ? v : T(v, mut));
    }

    if (!mut) { 
      Object.freeze(arr); 
    }
    return arr;
  }

  List.meta = {
    kind: 'list',
    type: T,
    name: name
  };

  List.is = function (x) {
    return Arr.is(x) && x.every(T.is);
  };


  List.update = update;

  return List;
}

