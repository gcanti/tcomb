/**
    ### func(Arguments, f, [Return], [name])

    **Experimental**. Defines a function where the `arguments` and the return value are checked.

    - `Arguments` the type of `arguments`
    - `f` the function to execute
    - `Return` optional, check the type of the return value
    - `name` optional string useful for debugging

    Example

    ```javascript
    var sum = func(tuple([Num, Num]), function (a, b) {
        return a + b;
    }, Num);

    sum(1, 2); // => 3
    sum(1, 'a'); // => fail!
    ```
**/

function func(Arguments, f, Return, name) {
    
  function g() {
    var args = slice.call(arguments);
    if (args.length < f.length) args.length = f.length; // handle optional arguments

    args = Arguments.is(args) ? args : coerce(Arguments, args);

    var r = f.apply(null, args);

    if (Return) {
      r = Return.is(r) ? r : coerce(Return, r);
    }

    return r;
  }

  g.is = function (x) { return x === g; };

  g.meta = {
    kind: 'func',
    Arguments: Arguments,
    f: f,
    Return: Return,
    name: name
  };

  return g;
}

