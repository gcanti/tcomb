/**
    ### Any(value, [mut])

    Because sometimes you really gonna need it.

        Any.is(..whatever..); // => true
**/

function Any(value) {
  forbidNewOperator(this, Any);
  return value;
}

Any.meta = {
  kind: 'any',
  name: 'Any'
};

Any.is = function () { return true; };
