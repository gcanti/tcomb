var assert = require('./assert');
var isType = require('./isType');
var t = require('../index');

var KINDS = {
	DICT: 'dict',
	ENUMS: 'enums',
	FUNC: 'func',
	INTERFACE: 'interface',
	INTERSECTION: 'intersection',
	LIST: 'list',
	MAYBE: 'maybe',
	REFINEMENT: 'subtype',  // the kind of a refinement is 'subtype' (for legacy reasons)
	STRUCT: 'struct',
	TUPLE: 'tuple',
	UNION: 'union'
};

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
		case KINDS.DICT:
			dispatch = dict;
			break;

		case KINDS.ENUMS:
			dispatch = enums;
			break;

		case KINDS.FUNC:
			dispatch = func;
			break;

		case KINDS.INTERSECTION:
			dispatch = intersection;
			break;

		case KINDS.LIST:
			dispatch = list;
			break;

		case KINDS.MAYBE:
			dispatch = maybe;
			break;

		case KINDS.REFINEMENT:
			dispatch = refinement;
			break;

		case KINDS.STRUCT:
			dispatch = struct;
			break;

		case KINDS.TUPLE:
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
	} else if (type.meta.kind === KINDS.DICT) {
		return isSubsetOf(dict.meta.domain, type.meta.domain) && isSubsetOf(dict.meta.codomain, type.meta.codomain);
	} else {
		return false;
	}
}

function enums(enums, type) {
	var enumsKeys = Object.keys(enums.meta.map);

	if (type.meta.kind === KINDS.ENUMS) {
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
	} else if (type.meta.kind === KINDS.FUNC) {
		// More rigorous checking
	} else {
		return false;
	}
}

function intersection(intersection, type) {
	if (type.meta.kind === KINDS.INTERSECTION) {
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
	} else if (type.meta.kind === KINDS.LIST) {
		return isSubsetOf(list.meta.type, type.meta.type);
	} else {
		return false;
	}
}

function maybe(maybe, type) {
	if (type === t.Nil) {
		return true;
	} else if (type.meta.kind === KINDS.MAYBE) {
		return isSubsetOf(maybe.meta.type, type.meta.type);
	} else {
		return isSubsetOf(maybe.meta.type, type);
	}
}

function refinement(refinement, type) {
	if (type.meta.kind === KINDS.REFINEMENT) {
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
	if (type === t.Object) {
		return true;
	} else if (type.meta.kind === KINDS.STRUCT) {
		// Check for compatibility
	} else {
		return false;
	}
}

function tuple(tuple, type) {
	if (type === t.Array) {
		return true;
	} else if (type.meta.kind === KINDS.TUPLE && tuple.meta.types.length === type.meta.types.length) {
		return tuple.meta.types.every(function (tuple, i) {
			return isSubsetOf(tuple, type.meta.types[i]);
		});
	} else {
		return false;
	}
}

module.exports = isSubsetOf;
