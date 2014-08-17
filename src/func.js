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

  Return = Return || null;

  assert(isType(Arguments), 'bad arguments');
  assert(Func.is(f), 'bad f');
  assert(Nil.is(Return) || isType(Return), 'bad return');

  // makes the combinator idempotent
  if (isType(f) && f.meta.Arguments === Arguments && f.meta.Return === Return) {
    return f;
  }

  function fn() {

    var args = slice.call(arguments);

    // handle optional arguments
    if (args.length < f.length) {
      args.length = f.length; 
    }

    args = Arguments.is(args) ? args : Arguments(args);

    var r = f.apply(null, args);

    if (Return) {
      r = Return.is(r) ? r : Return(r);
    }

    return r;
  }

  fn.is = function (x) { 
    return x === fn; 
  };

  fn.meta = {
    kind: 'func',
    Arguments: Arguments,
    f: f,
    Return: Return,
    name: name
  };

  return fn;
}

