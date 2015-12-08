/* globals describe, it, xit */
var assert = require('assert');
var t = require('../index');
var throwsWithMessage = require('./util').throwsWithMessage;

var A = t.declare('A');

var B = t.struct({
  a: t.maybe(A)
});

A.define(t.struct({
  b: t.maybe(B)
}));

var aValue = A({
  b: B({
    a: A({
      b: null
    })
  })
});

describe('t.declare([name])', function () {

  describe('combinator', function () {

    it('should throw if used with wrong arguments', function () {

      assert.throws(function () {
        t.declare(t.Number);
      }, function(err) {
        assert.strictEqual(err instanceof Error, true);
        assert.ok(/\[tcomb\] Invalid argument name function (.|\n)* supplied to declare\(\[name\]\) \(expected a string\)/m.test(err.message));
        return true;
      });

      throwsWithMessage(function () {
        var D = t.declare('D');
        D.define('not a type');
      }, '[tcomb] Invalid argument type "not a type" supplied to define(type) (expected a type)');

    });

    it('should throw if define-d multiple times', function () {
      throwsWithMessage(function () {
        var D = t.declare('D');
        D.define(t.list(t.Any));
        D.define(t.list(t.Any));
      }, '[tcomb] Declare.define(type) can only be invoked once');
    });

    it('should have a fresh name for different declares when not explicitly provided', function() {
      var Thing1 = t.declare();
      Thing1.define(t.struct({
        thing: Thing1
      }));
      assert.throws(function() {
        Thing1({});
      }, function(err) {
        assert.strictEqual(err instanceof Error, true);
        assert.ok(/\[tcomb\] Invalid value .+ supplied to {thing: Declare\$[0-9]+}\/thing: {thing: Declare\$[0-9]+} \(expected an object\)/m.test(err.message));
        return true;
      });
      var Thing2 = t.declare();
      assert.ok(t.getTypeName(Thing1) != t.getTypeName(Thing2));
    });

    it('an instance of the declared type should satisfy instanceof, if the concrete type is a struct', function() {
      assert.ok(aValue instanceof A);
    });

    it('should have the expected names', function() {
      var ANum = t.declare('A');
      ANum.define(t.list(t.Any));

      assert.strictEqual('A', A.displayName);
      assert.strictEqual('A', A.meta.name);

      var Nameless = t.declare();
      assert.strictEqual('Declare$3', Nameless.displayName);
      Nameless.define(t.list(t.Any));
      assert.strictEqual('Array<Any>', Nameless.displayName);
      assert.strictEqual(undefined, Nameless.meta.name);
    });

    it('should support adding functions to the prototype, when allowd by the concrete type', function() {
      var ANum = t.declare('A');
      ANum.define(t.struct({
        a: t.Number
      }));
      function afun() { return 42; }
      ANum.prototype.afun = afun;
      assert.equal(42, ANum({a: 13}).afun());
    });

    it('should throw when defined with a non-fresh type', function() {
      throwsWithMessage(function () {
        var ANum = t.declare();
        ANum.define(t.Number);
      }, '[tcomb] Invalid argument type undefined supplied to define(type) (expected a fresh, unnamed type)');
    });

  });

  describe('ctor', function () {

    it('should be idempotent', function () {
      var p1 = A(aValue);
      var p2 = A(p1);
      assert.deepEqual(p2 === p1, true);
    });

    it('should accept only valid values', function () {
      throwsWithMessage(function () {
        A({b: 12});
      }, '[tcomb] Invalid value 12 supplied to {b: ?{a: ?A}}/b: ?{a: ?A} (expected an object)');
      throwsWithMessage(function () {
        A({b: B({ a: 13 }) });
      }, '[tcomb] Invalid value 13 supplied to {a: ?A}/a: ?A (expected an object)');
    });

    it('should throw if the type was not defined', function () {
      throwsWithMessage(function () {
        var D = t.declare('D');
        D({a: A({}) });
      }, '[tcomb] Type declared but not defined, don\'t forget to call .define on every declared type');
    });

  });

  describe('#is(x)', function () {

    it('should return true when x is an instance of the struct', function () {
      var a = new A(aValue);
      assert.ok(A.is(a));
    });

  });

  describe('cyclic references', function() {
    var TreeItem = t.declare('TreeItem');

    TreeItem.define(t.struct({
      id: t.Number,
      parent: t.maybe(TreeItem),
      children: t.list(TreeItem),
      favoriteChild: t.maybe(TreeItem)
    }));

    it('should allow cyclic references in struct', function() {
      var root = {id: 1, parent: null, children: []};
      var child = {id: 2, parent: root, children: []};

      root.children.push(child);
      root.favoriteChild = child;

      var treeItem = TreeItem(root);
      var treeItemFavoriteChild = treeItem.favoriteChild;

      assert(TreeItem.is(treeItem));
      assert(TreeItem.is(treeItemFavoriteChild));
      assert(treeItemFavoriteChild.parent === treeItem);
      assert(treeItem.children[0] === treeItemFavoriteChild);

      var treeItemIdempotent = TreeItem(treeItem);

      assert(treeItemIdempotent === treeItem);
    });

    xit('should allow cyclic references in tuples', function() {
      var Tuple = t.declare('Tuple');
      Tuple.define(t.tuple([t.Number, t.maybe(Tuple)]));

      var tuple = [1, null];
      tuple[1] = tuple;

      var result = Tuple(tuple);

      assert(Tuple.is(result)); // would fail: endless loop
      assert(result[1] === result);

      var resultIdempotent = Tuple(result);

      assert(resultIdempotent === result);
    });

    xit('should allow indirect cyclic references in tuples', function() {
      var TupleWithContainer = t.declare('TupleWithContainer');
      var Container = t.struct({tuple: TupleWithContainer});

      TupleWithContainer.define(t.tuple([t.Number, Container]));

      var tupleWithContainer = [1, null];
      tupleWithContainer[1] = {tuple: tupleWithContainer};

      var result = TupleWithContainer(tupleWithContainer);

      assert(TupleWithContainer.is(result));
      assert(result[1].tuple === result); // would fail: not the same

      var resultIdempotent = TupleWithContainer(result);

      assert(resultIdempotent === result);
    });

    xit('should return cyclic referenes with the appropriate type', function() {
      var A = t.declare('A');
      var B = t.declare('B');

      A.define(t.struct({
        value: t.Number,
        b: B
      }));

      B.define(t.struct({
        value: t.Number,
        b: A
      }));

      var monster = {value: 1};
      monster.b = monster;

      var result = A(monster);

      assert(A.is(result));
      assert(B.is(result.b)); // would fail: not B
    });

    it('should return same instances when the same instance is used multiple times in a struct', function() {
      var A = t.struct({
        value: t.Number
      });

      var B = t.struct({
        a1: A,
        a2: A
      });

      var a = { value: 3 };
      var b = B({
        a1: a,
        a2: a
      });

      assert(b.a1 === b.a2);
    });

    it('should return same instances when the same instance is used multiple times in a tuple', function() {
      var A = t.struct({
        value: t.Number
      });

      var B = t.tuple([A, A]);

      var a = { value: 3 };
      var b = B([a, a]);

      assert(b[0] === b[1]);
    });

  });

});
