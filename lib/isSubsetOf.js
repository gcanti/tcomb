var assert = require('./assert');
var isType = require('./isType');
var t = require('../index');

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

	if (subset === type || type === t.Any) {
		return true;
	}

	var dispatch;

	switch (subset.meta.kind) {
		case 'dict':
			dispatch = dict;
			break;

		case 'func':
			dispatch = func;
			break;

		case 'intersection':
			dispatch = intersection;
			break;

    case 'list':
      dispatch = list;
      break;

    case 'maybe':
      dispatch = maybe;
      break;

    case 'struct':
      dispatch = struct;
      break;

    case 'subtype':  // the kind of a refinement is 'subtype' (for legacy reasons)
      dispatch = subtype;
      break;

    case 'tuple':
      dispatch = tuple;
      break;

		// unions, enums
		default:
			return false;
	}

	return dispatch(subset, type);
}

function dict(dict, type) {
	if (type === t.Object) {
		return true;
	// } else if (/* something */) {
		// More rigorous checking
	} else {
		return false;
	}
}

function func(func, type) {
	if (type === t.Function) {
		return true;
	// } else if (/* something */) {
		// More rigorous checking
	} else {
		return false;
	}
}

function intersection(intersection, type) {
	return intersection.meta.types.every(function(intersection) {
		return isSubsetOf(intersection, type);
	});
}

function list(list, type) {
  if (type === t.Array) {
    return true;
  // } else if (type.meta.kind === 'list') {
    // Check for compatibility
  } else {
    return false;
  }
}

function maybe(maybe, type) {
  if (type === t.Nil) {
    return true;
  }

  return isSubsetOf(maybe.meta.type, type);
}

function struct(struct, type) {
  if (type === t.Object) {
    return true;
  // } else if (type.meta.kind === 'struct') {
    // Check for compatibility
  } else {
    return false;
  }
}

function subtype(subtype, type) {
  return isSubsetOf(subtype.meta.type, type);
}

function tuple(tuple, type) {
  if (type === t.Array) {
    return true;
  // } else if (/* something */) {
    // More rigorous checking
  } else {
    return false;
  }
}

module.exports = isSubsetOf;
