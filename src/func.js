//
// func (experimental)
//

function func(Arguments, f, Return, name) {
    
  function g() {
    var args = Array.prototype.slice.call(arguments);
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

