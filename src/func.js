//
// func (experimental)
//

var func = function (Arguments, f, Return, name) {
    
  function func() {
    var args = Array.prototype.slice.call(arguments);
    if (args.length < f.length) args.length = f.length; // handle optional arguments

    args = Arguments.is(args) ? args : coerce(Arguments, args);

    var r = f.apply(this, args);

    if (Return) {
      r = Return.is(r) ? r : coerce(Return, r);
    }

    return r;
  }

  func.is = function (x) { return x === func; };

  func.meta = {
    kind: 'func',
    Arguments: Arguments,
    f: f,
    Return: Return,
    name: name
  };

  return func;
};

