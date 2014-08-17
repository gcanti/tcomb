//
// Any - Because sometimes you really gonna need it.
//

function Any(value) {
  forbidNewOperator(this, Any);
  return value;
}

Any.meta = {
  kind: 'any',
  name: 'Any'
};

Any.is = function () { return true; };
