//
// Any - because sometimes you really gonna need it
//

function Any(values) {
  assert(!(this instanceof Any), 'cannot use new with Any');
  return values;
}

Any.meta = {
  kind: 'any',
  name: 'Any',
  ctor: false
};

Any.is = function () { return true; };
