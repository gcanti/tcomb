var assert = require('./assert');
var isDict = require('./isDict');
var isEnums = require('./isEnums');
var isFunc = require('./isFunc');
var isInterface = require('./isInterface');
var isIntersection = require('./isIntersection');
var isList = require('./isList');
var isMaybe = require('./isMaybe');
var isRefinement = require('./isRefinement');
var isStruct = require('./isStruct');
var isTuple = require('./isTuple');
var isType = require('./isType');
var tAny = require('./Any');
var tArray = require('./Array');
var tFunction = require('./Function');
var tNil = require('./Nil');
var tObject = require('./Object');

function isSubsetOf(subset, type) {
  if (process.env.NODE_ENV !== 'production') {
    assert(isType(subset), function () {
      return 'Invalid argument type ' + assert.stringify(subset) +
        ' supplied to isSubsetOf(subset, type) (expected a type)';
    });

    assert(isType(type), function () {
      return 'Invalid argument type ' + assert.stringify(type) +
        ' supplied to isSubsetOf(subset, type) (expected a type)';
    });
  }

  if (subset === type || type === tAny) {
    // structs
    return true;
  }

  var dispatch;

  if (isDict(subset)) {
    dispatch = dict;

  } else if (isEnums(subset)) {
    dispatch = enums;

  } else if (isFunc(subset)) {
    dispatch = func;

  } else if (isInterface(subset)) {
    dispatch = interfaces;

  } else if (isIntersection(subset)) {
    dispatch = intersection;

  } else if (isList(subset)) {
    dispatch = list;

  } else if (isMaybe(subset)) {
    dispatch = maybe;

  } else if (isRefinement(subset)) {
    dispatch = refinement;

  } else if (isStruct(subset)) {
    dispatch = struct;

  } else if (isTuple(subset)) {
    dispatch = tuple;

  } else {
    // unions
    return false;
  }

  return dispatch(subset, type);
}

function dict(dict, type) {
  if (type === tObject) {
    return true;
  } else if (isDict(type)) {
    return isSubsetOf(dict.meta.domain, type.meta.domain) && isSubsetOf(dict.meta.codomain, type.meta.codomain);
  } else {
    return false;
  }
}

function enums(enums, type) {
  var enumsKeys = Object.keys(enums.meta.map);

  if (isEnums(type)) {
    var typeKeys = Object.keys(type.meta.map);

    return enumsKeys.every(function (enums) {
      return typeKeys.indexOf(enums) !== -1;
    });
  } else {
    return enumsKeys.every(function (enums) {
      return type.is(enums);
    });
  }
}

function func(func, type) {
  if (type === tFunction) {
    return true;
  } else if (isFunc(type)) {
    // More rigorous checking
  } else {
    return false;
  }
}

// Named "interfaces" because "interface" is a future reserved word.
function interfaces(interfaces, type) {
  if (type === tObject) {
    return true;
  } else if (isInterface(type)) {
    var compatible = Object.keys(type.meta.props).every(function(k) {
      return interfaces.meta.props.hasOwnProperty(k) && isSubsetOf(interfaces.meta.props[k], type.meta.props[k]);
    });

    if (type.meta.strict) {
      return compatible && Object.keys(interfaces).every(function(k) {
        return type.meta.props.hasOwnProperty(k);
      });
    } else {
      return compatible;
    }
  } else {
    return false;
  }
}

function intersection(intersection, type) {
  if (isIntersection(type)) {
    return intersection.meta.types.map(function (intersection) {
      return type.meta.types.map(function (type) {
        return isSubsetOf(intersection, type);
      });
    }).reduce(function (prev, cur) {
      return prev.map(function (bool, i) {
        return bool || cur[i];
      });
    }).every(function (bool) {
      return bool;
    });
  } else {
    return intersection.meta.types.every(function (intersection) {
      return isSubsetOf(intersection, type);
    });
  }
}

function list(list, type) {
  if (type === tArray) {
    return true;
  } else if (isList(type)) {
    return isSubsetOf(list.meta.type, type.meta.type);
  } else {
    return false;
  }
}

function maybe(maybe, type) {
  if (type === tNil) {
    return true;
  } else if (isMaybe(type)) {
    return isSubsetOf(maybe.meta.type, type.meta.type);
  } else {
    return isSubsetOf(maybe.meta.type, type);
  }
}

function refinement(refinement, type) {
  if (isRefinement(type)) {
    /*
     * Unfortunately, there's no easy or reliable way to determine whether two JavaScript functions are functionally
     * identical, so this feature is punted in favor of doing literal comparison on the predicate.
     */
    return isSubsetOf(refinement.meta.type, type.meta.type) && refinement.meta.predicate === type.meta.predicate;
  } else {
    return isSubsetOf(refinement.meta.type, type);
  }
}

function struct(struct, type) {
  if (type === tObject) {
    return true;
  } else {
    return false;
  }
}

function tuple(tuple, type) {
  if (type === tArray) {
    return true;
  } else if (isTuple(type) && tuple.meta.types.length === type.meta.types.length) {
    return tuple.meta.types.every(function (tuple, i) {
      return isSubsetOf(tuple, type.meta.types[i]);
    });
  } else {
    return false;
  }
}

module.exports = isSubsetOf;
