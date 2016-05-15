/* globals context, describe, it */
var assert = require('assert');
var t = require('../index');
var isSubsetOf = require('../lib/isSubsetOf');
var util = require('./util');

describe.only('isSubsetOf(subset, type)', function () {
	it('should throw with a bad type argument', function () {
		util.throwsWithMessage(function () {
			isSubsetOf();
		}, '[tcomb] Invalid argument type undefined supplied to isSubsetOf(subset, type) (expected a type)');

		util.throwsWithMessage(function () {
			isSubsetOf(t.Nil);
		}, '[tcomb] Invalid argument type undefined supplied to isSubsetOf(subset, type) (expected a type)');
	});

	context('[dict]', function() {
		var dict1 = t.dict(t.String, t.Number);
		var dict2 = t.dict(t.String, t.Number);

		it('should return true when both arguments are the same', function () {
			assert.equal(isSubsetOf(dict1, dict1), true);
		});

		it('should return true when both arguments are functionally equivalent', function () {
			assert.equal(isSubsetOf(dict1, dict2), true);
		});

		it('should return true when the superset is t.Object', function () {
			assert.equal(isSubsetOf(dict1, t.Object), true);
		});

		it('should return false when the superset does not satisfy the subset', function () {
			assert.equal(isSubsetOf(dict1, t.Number), false);
		});
	});

	context('[enums]', function() {
		var enums1 = t.enums({
			US: 'United States',
			IT: 'Italy'
		});
		var enums2 = t.enums({
			US: 'United States of America',
			IT: 'Italy'
		});
		var enums3 = t.enums.of(['US', 'IT']);
		var enums4 = t.enums.of('US IT');
		var enums5 = t.enums.of([1, 7, 8]);

		it('should return true when both arguments are the same', function () {
			assert.equal(isSubsetOf(enums1, enums1), true);
			assert.equal(isSubsetOf(enums3, enums3), true);
			assert.equal(isSubsetOf(enums4, enums4), true);
		});

		it('should return true when both arguments are functionally equivalent', function () {
			// Note that values aren't checked.
			assert.equal(isSubsetOf(enums1, enums2), true);
			assert.equal(isSubsetOf(enums1, enums3), true);
			assert.equal(isSubsetOf(enums1, enums4), true);
		});

		it('should return true when the superset fits all the enum\'s types', function () {
			assert.equal(isSubsetOf(enums1, t.String), true);
			// Objects' keys in JavaScript are always strings, even when they don't seem like it.
			assert.equal(isSubsetOf(enums5, t.String), true);
		});

		it('should return false when the superset does not satisfy the subset', function () {
			assert.equal(isSubsetOf(enums1, t.Number), false);
		});
	});

	context('[func]', function() {

	});

	context('[intersection]', function() {
		// Min and max must be literally the same due to how refinements are judged as subsets.
		var min = t.refinement(t.String, function (s) { return s.length > 2; });
		var max = t.refinement(t.String, function (s) { return s.length < 5; });
		var intersection1 = t.intersection([min, max]);
		var intersection2 = t.intersection([min, max]);

		it('should return true when both arguments are the same', function () {
			assert.equal(isSubsetOf(intersection1, intersection1), true);
		});

		it('should return true when both arguments are functionally equivalent', function () {
			assert.equal(isSubsetOf(intersection1, intersection2), true);
		});

		it('should return true when the superset satisfies the subset', function () {
			assert.equal(isSubsetOf(intersection1, t.String), true);
		});

		it('should return false when the superset does not satisfy the subset', function () {
			assert.equal(isSubsetOf(intersection1, t.Number), false);
		});
	});

	context('[irreducible]', function () {
		it('should return true when both arguments are the same', function () {
			assert.equal(isSubsetOf(t.Number, t.Number), true);
		});

		it('should return true when the superset is t.Any', function () {
			assert.equal(isSubsetOf(t.Number, t.Any), true);
		});

		it('should return false when the arguments are unequal irreducibles', function () {
			assert.equal(isSubsetOf(t.Number, t.Nil), false);
		});
	});

	context('[list]', function() {
		var list1 = t.list(t.Number);
		var list2 = t.list(t.Number);

		it('should return true when both arguments are the same', function () {
			assert.equal(isSubsetOf(list1, list1), true);
		});

		it('should return true when both arguments are functionally equivalent', function () {
			assert.equal(isSubsetOf(list1, list2), true);
		});

		it('should return true when the superset is t.Array', function () {
			assert.equal(isSubsetOf(list1, t.Array), true);
		});

		it('should return false when the superset does not satisfy the subset', function () {
			assert.equal(isSubsetOf(list1, t.String), false);
		});
	});

	context('[maybe]', function() {
		var maybe1 = t.maybe(t.Number);
		var maybe2 = t.maybe(t.Number);

		it('should return true when both arguments are the same', function () {
			assert.equal(isSubsetOf(maybe1, maybe1), true);
		});

		it('should return true when both arguments are functionally equivalent', function () {
			assert.equal(isSubsetOf(maybe1, maybe2), true);
		});

		it('should return true when the superset is t.Nil', function () {
			assert.equal(isSubsetOf(maybe1, t.Nil), true);
		});

		it('should return false when the superset does not satisfy the subset', function () {
			assert.equal(isSubsetOf(maybe1, t.Object), false);
		});
	});

	context('[refinement]', function() {
		var func = function (s) {
			return s.length < 10;
		};
		var refinement1 = t.refinement(t.String, func);
		var refinement2 = t.refinement(t.String, func);
		var refinement3 = t.refinement(refinement1, function (s) { return s.length < 3; });
		var refinement4 = t.refinement(t.String, function (s) { return s.length < 10; });

		it('should return true when both arguments are the same', function () {
			assert.equal(isSubsetOf(refinement1, refinement1), true);
		});

		it('should return true when both arguments are functionally equivalent', function () {
			assert.equal(isSubsetOf(refinement1, refinement2), true);
		});

		it('should return true when the subset refines the superset  (shallow)', function () {
			assert.equal(isSubsetOf(refinement1, t.String), true);
		});

		it('should return true when the subset refines the superset (deep)', function () {
			assert.equal(isSubsetOf(refinement3, t.String), true);
		});

		it('should return false when both refinements have different predicates', function () {
			assert.equal(isSubsetOf(refinement1, refinement3), false);
			// Even functionally equivalent predicates can't be determined equal.
			assert.equal(isSubsetOf(refinement1, refinement4), false);
		});

		it('should return false when the superset does not satisfy the subset', function () {
			assert.equal(isSubsetOf(refinement1, t.Number), false);
		});
	});

	context('[struct]', function() {
		var struct1 = t.struct({
			x: t.Number,
			y: t.Number
		});
		var struct2 = t.struct({
			x: t.Number,
			y: t.Number
		});

		it('should return true when both arguments are the same', function () {
			assert.equal(isSubsetOf(struct1, struct1), true);
		});

		it('should return true when both arguments are functionally equivalent', function () {
			assert.equal(isSubsetOf(struct1, struct2), true);
		});

		it('should return true when the superset is t.Object', function () {
			assert.equal(isSubsetOf(struct1, t.Object), true);
		});

		it('should return false when the superset does not satisfy the subset', function () {
			assert.equal(isSubsetOf(struct1, t.String), false);
		});
	});

	context('[tuple]', function() {
		var tuple1 = t.tuple([t.Number, t.Number]);
		var tuple2 = t.tuple([t.Number, t.Number]);

		it('should return true when both arguments are the same', function () {
			assert.equal(isSubsetOf(tuple1, tuple1), true);
		});

		it('should return true when both arguments are functionally equivalent', function () {
			assert.equal(isSubsetOf(tuple1, tuple2), true);
		});

		it('should return true when the superset is t.Array', function () {
			assert.equal(isSubsetOf(tuple1, t.Array), true);
		});

		it('should return false when the superset does not satisfy the subset', function () {
			assert.equal(isSubsetOf(tuple1, t.String), false);
		});
	});

	context('[union]', function() {

	});
});
