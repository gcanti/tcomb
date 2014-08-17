/**
    ### Any(value, [mut])

    Because sometimes you really gonna need it.

        Any.is(..whatever..); // => true
**/

function Any(value) {
  assert(!(this instanceof Any), 'cannot use new with Any');
  return value;
}

Any.meta = {
  kind: 'any',
  name: 'Any'
};

Any.is = function () { return true; };
