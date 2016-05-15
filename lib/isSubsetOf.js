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

		case 'enums':
			dispatch = enums;
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

		// unions, interfaces
		default:
			return false;
	}

	return dispatch(subset, type);
}

function dict(dict, type) {
	if (type === t.Object) {
		return true;
	} else if (type.meta.kind === 'dict') {
		return isSubsetOf(dict.meta.domain, type.meta.domain) && isSubsetOf(dict.meta.codomain, type.meta.codomain);
	} else {
		return false;
	}
}

function enums(enums, type) {
	var enumsKeys = Object.keys(enums.meta.map);

	if (type.meta.kind === 'enums') {
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
	if (type === t.Function) {
		return true;
	// } else if (/* something */) {
		// More rigorous checking
	} else {
		return false;
	}
}

function intersection(intersection, type) {
	if (type.meta.kind === 'intersection') {
		// tricky code goes here
	} else {
		return intersection.meta.types.every(function (intersection) {
			return isSubsetOf(intersection, type);
		});
	}
}

function list(list, type) {
	if (type === t.Array) {
		return true;
	} else if (type.meta.kind === 'list') {
		return isSubsetOf(list.meta.type, type.meta.type);
	} else {
		return false;
	}
}

function maybe(maybe, type) {
	if (type === t.Nil) {
		return true;
	} else if (type.meta.kind === 'maybe') {
		return isSubsetOf(maybe.meta.type, type.meta.type);
	} else {
		return isSubsetOf(maybe.meta.type, type);
	}
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
	if (type.meta.kind === 'subtype') {
		/*
		 * Unfortunately, there's no easy or reliable way to determine whether two JavaScript functions are functionally
		 * identical, so this feature is punted in favor of doing literal comparison on the predicate.
		 */
		return isSubsetOf(subtype.meta.type, type.meta.type) && subtype.meta.predicate === type.meta.predicate;
	} else {
		return isSubsetOf(subtype.meta.type, type);
	}
}

function tuple(tuple, type) {
	if (type === t.Array) {
		return true;
	} else if (type.meta.kind === 'tuple' && tuple.meta.types.length === type.meta.types.length) {
		return tuple.meta.types.every(function (tuple, i) {
			return isSubsetOf(tuple, type.meta.types[i]);
		});
	} else {
		return false;
	}
}

module.exports = isSubsetOf;
