var assert = require('./assert');
var decompose = require('./decompose');
var isType = require('./isType');

var Any = require('./Any');
var Array = require('./Array');
var Function = require('./Function');
var Nil = require('./Nil');
var tObject = require('./Object');

function isSubsetsOf(As, Bs) {
  return ( As.length === Bs.length ) && As.every(function (T, i) {
    return isSubsetOf(T, Bs[i]);
  });
}

function isSubPredicatesOf(ps1, ps2) {
  return ps2.length <= ps1.length && ps2.every(function (p) {
    return ps1.indexOf(p) !== -1;
  });
}

function isSubsetOf(A, B) {
  if (process.env.NODE_ENV !== 'production') {
    assert(isType(A), function () { return 'Invalid argument subset ' + assert.stringify(A) + ' supplied to isSubsetOf(subset, superset) (expected a type)'; });
    assert(isType(B), function () { return 'Invalid argument superset ' + assert.stringify(B) + ' supplied to isSubsetOf(subset, superset) (expected a type)'; });
  }

  // Fast results
  // (1) if B === t.Any then A <= B for all A
  // (2) if B === A then A <= B for all A
  if (A === B || B === Any) {
    return true;
  }

  var kindA = A.meta.kind;
  var kindB = B.meta.kind;

  // Reductions

  // (3) if B = maybe(C) and A is not a maybe then A <= B if and only if A === t.Nil or A <= C
  if (kindB === 'maybe' && kindA !== 'maybe') {
    return ( A === Nil ) || isSubsetOf(A, B.meta.type);
  }

  function isSubsetOfType(type) {
    return isSubsetOf(A, type);
  }

  // (4) if B is a union then A <= B if exists B' in B.meta.types such that A <= B'
  if (kindB === 'union') {
    if (B.meta.types.some(isSubsetOfType)) {
      return true;
    }
  }

  // (5) if B is an intersection then A <= B if A <= B' for all B' in B.meta.types
  if (kindB === 'intersection') {
    if (B.meta.types.every(isSubsetOfType)) {
      return true;
    }
  }

  // Let A be a struct then A <= B if B === t.Object
  if (kindA === 'struct') {
    return B === tObject;
  }

  // Let A be a maybe then A <= B if B is a maybe and A.meta.type <= B.meta.type
  else if (kindA === 'maybe') {
    return ( kindB === 'maybe' ) && isSubsetOf(A.meta.type, B.meta.type);
  }

  // Let A be an union then A <= B if A' <= B for all A' in A.meta.types
  else if (kindA === 'union') {
    return A.meta.types.every(function (T) {
      return isSubsetOf(T, B);
    });
  }

  // Let A be an intersection then A <= B if exists A' in A.meta.types such that A' <= B
  else if (kindA === 'intersection') {
    return A.meta.types.some(function (T) {
      return isSubsetOf(T, B);
    });
  }

  // Let A be irreducible then A <= B if B is irreducible and A.is === B.is
  else if (kindA === 'irreducible') {
    return ( kindB === 'irreducible' ) && ( A.meta.predicate === B.meta.predicate );
  }

  // Let A be an enum then A <= B if and only if B.is(a) === true for all a in keys(A.meta.map)
  else if (kindA === 'enums') {
    return Object.keys(A.meta.map).every(B.is);
  }

  // Let A be a refinement then A <= B if decompose(A) <= decompose(B)
  else if (kindA === 'subtype') {
    var dA = decompose(A);
    var dB = decompose(B);
    return isSubPredicatesOf(dA.predicates, dB.predicates) && isSubsetOf(dA.unrefinedType, dB.unrefinedType);
  }

  // Let A be a list then A <= B if one of the following holds:
  else if (kindA === 'list') {
    // B === t.Array
    if (B === Array) {
      return true;
    }
    // B is a list and A.meta.type <= B.meta.type
    return ( kindB === 'list' ) && isSubsetOf(A.meta.type, B.meta.type);
  }

  // Let A be a list then A <= B if one of the following holds:
  else if (kindA === 'dict') {
    // B === t.Object
    if (B === tObject) {
      return true;
    }
    // B is a dictionary and [A.meta.domain, A.meta.codomain] <= [B.meta.domain, B.meta.codomain]
    return ( kindB === 'dict' ) && isSubsetOf(A.meta.domain, B.meta.domain) && isSubsetOf(A.meta.codomain, B.meta.codomain);
  }

  // Let A be a tuple then A <= B if one of the following holds:
  else if (kindA === 'tuple') {
    // B === t.Array
    if (B === Array) {
      return true;
    }
    // B is a tuple and A.meta.types <= B.meta.types
    return ( kindB === 'tuple' ) && isSubsetsOf(A.meta.types, B.meta.types);
  }

  // Let A be a function then then A <= B if one of the following holds:
  else if (kindA === 'func') {
    // B === t.Function
    if (B === Function) {
      return true;
    }
    // B is a function and [A.meta.domain, A.meta.codomain] <= [B.meta.domain, B.meta.codomain]
    return ( kindB === 'func' ) && isSubsetOf(A.meta.codomain, B.meta.codomain) && isSubsetsOf(A.meta.domain, B.meta.domain);
  }

  // Let A be an interface then A <= B if one of the following holds;
  else if (kindA === 'interface') {
    // B === t.Object
    if (B === tObject) {
      return true;
    }
    if (kindB === 'interface') {
      // B is an interface, B.meta.strict === false, keys(B.meta.props) <= keys(A.meta.props) and A.meta.props[k] <= B.meta.props[k] for all k in keys(B.meta.props)
      var keysB = Object.keys(B.meta.props);
      var compatible = keysB.every(function (k) {
        return A.meta.props.hasOwnProperty(k) && isSubsetOf(A.meta.props[k], B.meta.props[k]);
      });
      // B is an interface, B.meta.strict === true, A.meta.strict === true, keys(B.meta.props) = keys(A.meta.props) and A.meta.props[k] <= B.meta.props[k] for all k in keys(B.meta.props)
      if (compatible && B.meta.strict === true) {
        return ( A.meta.strict === true ) && ( keysB.length === Object.keys(A.meta.props).length );
      }
      return compatible;
    }
  }

  return false;
}

module.exports = isSubsetOf;