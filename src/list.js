/**
    ### list(type, [name])

    Defines an array where all the elements are of type `T`.

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

function list(type, name) {

  // check combinator args
  var combinator = 'list';
  name = ensureName(name, combinator, [type]);
  assert(isType(type), errs.ERR_BAD_COMBINATOR_ARGUMENT, 'type', type, combinator, 'a type');

  // cache expected value
  var expected = format('a list of `%s`', getName(type));

  function List(value, mut) {

    forbidNewOperator(this, List);
    assert(Arr.is(value), errs.ERR_BAD_TYPE_VALUE, value, name, expected);

    // makes List idempotent
    if (List.isList(value)) {
      return value;
    }

    var arr = [];
    for (var i = 0, len = value.length ; i < len ; i++ ) {
      var v = value[i];
      arr.push(type.is(v) ? v : type(v, mut));
    }

    if (!mut) { 
      Object.freeze(arr); 
    }
    return arr;
  }

  List.meta = {
    kind: 'list',
    type: type,
    name: name
  };

  List.isList = function (x) {
    return x.every(type.is);
  };

  List.is = function (x) {
    return Arr.is(x) && List.isList(x);
  };


  List.update = update;

  return List;
}

