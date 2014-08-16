/**
    ### Any(values, [mut])

    Because sometimes you really gonna need it.

        Any.is(..whatever..); // => true
**/

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
