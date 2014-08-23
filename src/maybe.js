/**
    ### maybe(type, [name])

    Same as `union([Nil, type])`.

    ```javascript
    // the value of a radio input where null = no selection
    var Radio = maybe(Str);

    Radio.is('a');     // => true
    Radio.is(null);    // => true
    Radio.is(1);       // => false
    ```    
**/

function maybe(type, name) {

  // check combinator args
  var combinator = 'maybe';
  name = ensureName(name, combinator, [type]);
  assert(isType(type), errs.ERR_BAD_COMBINATOR_ARGUMENT, 'type', type, combinator, 'a type');

  // makes the combinator idempotent
  if (type.meta.kind === 'maybe') {
    return type;
  }

  function Maybe(value, mut) {
    forbidNewOperator(this, Maybe);
    // a maybe type is idempotent iif type is idempotent
    return Nil.is(value) ? null : type(value, mut);
  }

  Maybe.meta = {
    kind: 'maybe',
    type: type,
    name: name
  };

  Maybe.is = function (x) {
    return Nil.is(x) || type.is(x);
  };

  return Maybe;
}

