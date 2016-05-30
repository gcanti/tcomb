/* globals context, describe, it */
var assert = require('assert');
var t = require('../index');
var isSubsetOf = require('../lib/isSubsetOf');
var util = require('./util');

/*

- why typed functions? They are values not types

*/

function getTypeName(T) {
  if (T.meta.kind === 'interface') {
    return t.getTypeName(T) + ' (strict: ' + T.meta.strict + ')';
  }
  return t.getTypeName(T);
}

// A <= B
function leq(A, B) {
  assert.strictEqual(isSubsetOf(A, B), true, getTypeName(A) + ' should be <= ' + getTypeName(B));
}

// !(A <= B)
function ko(A, B) {
  assert.strictEqual(isSubsetOf(A, B), false, getTypeName(A) + ' should not be <= ' + getTypeName(B));
}

// A <= B and !(B <= A)
function lt(A, B) {
  assert.strictEqual(isSubsetOf(A, B), true, getTypeName(A) + ' should be <= ' + getTypeName(B));
  ko(B, A);
}

function gt2(s) { return s.length >= 2; }
function lt10(s) { return s.length <= 10; }

var R1 = t.refinement(t.String, gt2);
var R2 = t.refinement(t.String, lt10);

describe('isSubsetOf(subset, type)', function () {

  it('should throw with a bad type argument', function () {
    util.throwsWithMessage(function () {
      isSubsetOf();
    }, '[tcomb] Invalid argument subset undefined supplied to isSubsetOf(subset, superset) (expected a type)');

    util.throwsWithMessage(function () {
      isSubsetOf(t.Nil);
    }, '[tcomb] Invalid argument superset undefined supplied to isSubsetOf(subset, superset) (expected a type)');
  });

  describe('Fast results', function () {

    it('(1) if B === t.Any then A <= B for all A', function () {
      lt(t.Nil, t.Any);
      lt(R1, t.Any);
      lt(t.Object, t.Any);
    });

    it('(2) if B === A then A <= B for all A', function () {
      leq(t.Nil, t.Nil);
      leq(R1, R1);
      leq(t.Object, t.Object);
      leq(t.Any, t.Any);
    });

  });

  describe('Reductions', function () {

    it('(3) if B = maybe(C) and A is not a maybe then A <= B if and only if A === t.Nil or A <= C', function () {
      var B1 = t.maybe(t.String);
      lt(t.Nil, B1);
      lt(t.String, B1);
      lt(R1, B1);
    });

    it('(4) if B is a union then A <= B if exists B\' in B.meta.types such that A <= B\'', function () {
      var B1 = t.union([t.Nil, t.String]);
      lt(t.Nil, B1);
      lt(t.String, B1);
      lt(R1, B1);
      var B2 = t.union([t.Number, t.maybe(t.String)]);
      lt(t.Nil, B2); // because of t.maybe(t.String)
    });

    it('(5) if B is an intersection then A <= B if A <= B\' for all B\' in B.meta.types', function () {
      var B1 = t.intersection([t.String, t.String]);
      leq(t.String, B1);
      var B2 = t.intersection([R1, R2]);
      var A2 = t.refinement(t.refinement(t.String, lt10), gt2);
      lt(A2, B2);
    });

  });

  describe('Maybes', function () {

    it('Let A be a maybe then A <= B if B is a maybe and A.meta.type <= B.meta.type', function () {
      leq(t.maybe(t.String), t.maybe(t.String));
      lt(t.maybe(R1), t.maybe(t.String));
      ko(t.maybe(t.String), t.Nil);
    });

    it('ko', function () {
      ko(t.maybe(t.String), t.Number);
    });

  });

  describe('Unions', function () {

    it('Let A be an union then A <= B if A\' <= B for all A\' in A.meta.types', function () {
      var B = t.union([t.String, t.Number, t.Boolean]);
      lt(t.union([t.String, t.Number]), B);
      lt(t.union([R1, t.Number]), B);
      leq(t.union([t.String, t.Number, t.Boolean]), B);
      ko(t.union([t.String, t.Date]), B);
    });

    it('ko', function () {
      ko(t.union([t.String, t.Number]), t.Number);
    });

  });

  describe('Intersections', function () {

    it('Let A be an intersection then A <= B if exists A\' in A.meta.types such that A\' <= B', function () {
      leq(t.intersection([t.String, t.String]), t.String);
      lt(t.intersection([R1, R2]), R1);
      lt(t.intersection([t.String, t.Number]), t.String);
    });

    it('ko', function () {
      ko(t.intersection([t.String, t.String]), t.Number);
    });

  });

  describe('Irriducibles', function () {

    it('Let A be irreducible then A <= B if B is irreducible and A.is === B.is', function () {
      var A = t.irreducible('StringAlias', t.String.is);
      leq(A, t.String);
      leq(t.String, A);
    });

    it('ko', function () {
      ko(t.String, t.Number);
    });

  });

  describe('Enums', function () {

    it('Let A be an enum then A <= B if and only if B.is(a) === true for all a in keys(A.meta.map)', function () {
      leq(t.enums.of('US IT'), t.enums.of('US IT'));
      lt(t.enums.of('US IT'), t.enums.of('US IT FR'));
      lt(t.enums.of('US IT'), t.String);
    });

    it('ko', function () {
      ko(t.enums.of('US IT'), t.Number);
    });

  });

  describe('Refinements', function () {

    it('Let A be a refinement then A <= B if decompose(A) <= decompose(B)', function () {
      lt(R1, t.String);
      leq(R1, t.refinement(t.String, R1.meta.predicate));
      leq(t.refinement(t.refinement(t.String, lt10), gt2), t.refinement(t.String, lt10), gt2);
      leq(t.refinement(t.refinement(t.String, lt10), gt2), t.refinement(t.refinement(t.String, gt2), lt10));
    });

    it('ko', function () {
      ko(R1, t.Number);
    });

  });

  describe('Lists', function () {

    it('B === t.Array', function () {
      lt(t.list(t.String), t.Array);
    });

    it('B is a list and A.meta.type <= B.meta.type', function () {
      leq(t.list(t.String), t.list(t.String));
      lt(t.list(R1), t.list(t.String));
    });

    it('ko', function () {
      ko(t.list(t.String), t.Number);
    });

  });

  describe('Dictionaries', function () {

    it('B === t.Object', function () {
      lt(t.dict(t.String, t.String), t.Object);
    });

    it('B is a dictionary and [A.meta.domain, A.meta.codomain] <= [B.meta.domain, B.meta.codomain]', function () {
      leq(t.dict(t.String, t.String), t.dict(t.String, t.String));
      lt(t.dict(R1, t.String), t.dict(t.String, t.String));
      lt(t.dict(t.String, R1), t.dict(t.String, t.String));
      lt(t.dict(R1, R1), t.dict(t.String, t.String));
    });

    it('ko', function () {
      ko(t.dict(t.String, t.String), t.Number);
    });

  });

  describe('Tuples', function () {

    it('B === t.Array', function () {
      lt(t.tuple([t.String, t.Number]), t.Array);
    });

    it('B is a tuple and A.meta.types <= B.meta.types', function () {
      leq(t.tuple([t.String, t.Number]), t.tuple([t.String, t.Number]));
      lt(t.tuple([R1, t.Number]), t.tuple([t.String, t.Number]));
    });

    it('ko', function () {
      ko(t.tuple([t.String, t.Number]), t.Number);
      ko(t.tuple([t.String, t.Number]), t.tuple([t.String, t.Number, t.maybe(t.Boolean)]));
    });

  });

  describe('Structs', function () {

    it('B === t.Object', function () {
      lt(t.struct({ name: t.String }), t.Object);
    });

    it('ko', function () {
      ko(t.struct({ name: t.String }), t.Number);
    });

  });

  describe('Functions', function () {

    it('B === t.Function', function () {
      lt(t.func([t.String, t.Number], t.String), t.Function);
    });

    it('B is a function and [A.meta.domain, A.meta.codomain] <= [B.meta.domain, B.meta.codomain]', function () {
      leq(t.func([t.String, t.Number], t.String), t.func([t.String, t.Number], t.String));
      lt(t.func([R1, t.Number], t.String), t.func([t.String, t.Number], t.String));
      lt(t.func([t.String, t.Number], R1), t.func([t.String, t.Number], t.String));
    });

    it('ko', function () {
      ko(t.func([t.Number, t.Number], t.Number), t.Number);
    });

  });

  describe('Interfaces', function () {

    it('B === t.Object', function () {
      lt(t.interface({ name: t.String }), t.Object);
      lt(t.interface({ name: t.String }, { strict: true }), t.Object);
    });

    describe('B is an interface and B.meta.strict === false', function () {

      it('keys(B.meta.props) <= keys(A.meta.props) and A.meta.props[k] <= B.meta.props[k] for all k in keys(B.meta.props)', function () {
        leq(t.interface({ name: t.String }), t.interface({ name: t.String }));
        lt(t.interface({ name: t.String, age: t.Number }), t.interface({ name: t.String }));
        lt(t.interface({ name: R1 }), t.interface({ name: t.String }));
        lt(t.interface({ name: R1, age: t.Number }), t.interface({ name: t.String }));

        leq(t.interface({ name: t.String }, { strict: true }), t.interface({ name: t.String }));
        lt(t.interface({ name: t.String, age: t.Number }, { strict: true }), t.interface({ name: t.String }));
        lt(t.interface({ name: R1 }, { strict: true }), t.interface({ name: t.String }));
        lt(t.interface({ name: R1, age: t.Number }, { strict: true }), t.interface({ name: t.String }));
      });

      it('ko', function () {
        ko(t.interface({}), t.interface({ name: t.String }));
        ko(t.interface({ name: t.String }), t.interface({ name: R1 }));
      });

    });

    describe('B is an interface and B.meta.strict === true', function () {

      it('A.meta.strict === true, keys(B.meta.props) = keys(A.meta.props) and A.meta.props[k] <= B.meta.props[k] for all k in keys(B.meta.props)', function () {
        leq(t.interface({ name: t.String }, { strict: true }), t.interface({ name: t.String }, { strict: true }));
        leq(t.interface({ name: R1 }, { strict: true }), t.interface({ name: t.String }, { strict: true }));
      });

      it('ko', function () {
        ko(t.interface({ name: t.String }), t.interface({ name: t.String }, { strict: true }));
        ko(t.interface({ name: t.String }, { strict: true }), t.interface({ name: R1 }, { strict: true }));
      });

    });

  });

  it('Recursive types', function () {

    var Tree1 = t.declare('Tree1');

    Tree1.define(t.interface({
      value: t.Number,
      left: t.maybe(Tree1),
      right: t.maybe(Tree1)
    }));

    var Tree2 = t.declare('Tree2');

    Tree2.define(t.interface({
      value: t.Integer,
      left: t.maybe(Tree2),
      right: t.maybe(Tree2)
    }));

    var Tree3 = t.declare('Tree3');

    Tree3.define(t.interface({
      value: t.String,
      left: t.maybe(Tree3),
      right: t.maybe(Tree3)
    }));

    lt(Tree2, Tree1);
    ko(Tree2, Tree3);
  });

  describe('original tests', function () {

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
      var func1 = t.func([t.Number, t.Number], t.Number);
      var func2 = t.func([t.Number, t.Number], t.Number);
      // var func3 = t.func([t.Number, t.Number], t.Number).of(function (x, y) {
      //   return x + y;
      // });
      // var func4 = t.func([t.Number, t.Number], t.Number).of(function (x, y) {
      //   return x + y;
      // });
      // var func5 = t.func([t.String, t.String], t.String).of(function (x, y) {
      //   return x + y;
      // });
      var func6 = t.func([], t.String);
      var func7 = t.func([], t.String);

      it('should return true when both arguments are the same', function () {
        assert.equal(isSubsetOf(func1, func1), true);
        // assert.equal(isSubsetOf(func3, func3), true);
      });

      it('should return true when both arguments are functionally equivalent', function () {
        assert.equal(isSubsetOf(func1, func2), true);
        // assert.equal(isSubsetOf(func1, func3), true);
        // assert.equal(isSubsetOf(func3, func4), true);
        assert.equal(isSubsetOf(func6, func7), true);
      });

      it('should return true when the superset is t.Function', function () {
        assert.equal(isSubsetOf(func1, t.Function), true);
        // assert.equal(isSubsetOf(func3, t.Function), true);
      });

      it('should return false when the superset does not satisfy the subset', function () {
        assert.equal(isSubsetOf(func1, t.String), false);
        // assert.equal(isSubsetOf(func1, func5), false);
      });
    });

    context('[interface]', function() {
      var interface1 = t.interface({
        x: t.Number,
        y: t.Number
      });
      var interface2 = t.interface({
        x: t.Number,
        y: t.Number
      });
      var interface3 = interface1.extend({
        z: t.Number
      });
      var interface4 = t.interface({
        x: t.Number,
        y: t.Number
      }, {name: 'Interface4', strict: true});
      var interface5 = interface4.extend({
        z: t.Number
      });

      it('should return true when both arguments are the same', function () {
        assert.equal(isSubsetOf(interface1, interface1), true);
      });

      it('should return true when both arguments are functionally equivalent', function () {
        assert.equal(isSubsetOf(interface1, interface2), true);
      });

      it('should return true when the superset extends the subset', function () {
        assert.equal(isSubsetOf(interface3, interface1), true);
      });

      it('should return false when the subset extends a strict superset', function () {
        assert.equal(isSubsetOf(interface5, interface4), false);
      });

      it('should return true when the superset is t.Object', function () {
        assert.equal(isSubsetOf(interface1, t.Object), true);
      });

      it('should return false when the superset does not satisfy the subset', function () {
        assert.equal(isSubsetOf(interface1, t.String), false);
      });
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
        assert.equal(isSubsetOf(maybe1, t.Nil), false);
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
      var struct3 = struct1.extend({
        z: t.Number
      });

      it('should return true when both arguments are the same', function () {
        assert.equal(isSubsetOf(struct1, struct1), true);
      });

      it('should return false when both arguments are functionally equivalent', function () {
        // Structs are either literally the same or they're not equal.
        assert.equal(isSubsetOf(struct1, struct2), false);
      });

      it('should return false when the subset extends the superset', function () {
        assert.equal(isSubsetOf(struct3, struct1), false);
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

  });

});