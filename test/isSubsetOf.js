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
	});

	context('[enum]', function() {

	});

	context('[func]', function() {

	});

	context('[intersection]', function() {

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
	});

	context('[refinement]', function() {

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
	});

	context('[union]', function() {

	});
});
