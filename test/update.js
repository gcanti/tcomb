/* globals describe, it */
var assert = require('assert');
var t = require('../index');
var throwsWithMessage = require('./util').throwsWithMessage;

describe('t.update(instance, patch)', function () {

  var update = t.update;
  var Tuple = t.tuple([t.String, t.Number]);
  var List = t.list(t.Number);
  var Dict = t.dict(t.String, t.Number);
  var Point = t.struct({
    x: t.Number,
    y: t.Number
  });

  it('strict structs with additional methods should not throw on updating', function () {
    var Rectangle = t.struct({
      width: t.Number,
      height: t.Number
    }, {strict: true});

    Rectangle.prototype.getArea = function () {
      return this.width * this.height;
    };

    var r = Rectangle({width: 10, height: 10});
    assert.equal(Rectangle.update(r, {width: {$set: 20}}).width, 20);
  });

  it('should throw if patch is invalid', function () {
    throwsWithMessage(function () {
      t.update({});
    }, '[tcomb] Invalid argument patch undefined supplied to function update(instance, patch): expected an object containing commands');
  });

  describe('$set', function () {

    it('numbers', function () {
      assert.equal(update(1, {$set: 2}), 2);
    });

    it('arrays', function () {
      var arr1 = [1, 2, 3];
      var arr2 = update(arr1, { 1: { '$set': 4 } });
      assert.deepEqual(arr1, [1, 2, 3]);
      assert.deepEqual(arr2, [1, 4, 3]);
    });

    // issue #65
    it('$set and null value', function () {
      var T = t.struct({a: t.Number, b: t.maybe(t.Number)});
      var instance = new T({a: 1});
      var updated = update(instance, {b: {$set: 2}});
      assert.deepEqual(instance, {a: 1, b: undefined});
      assert.deepEqual(updated, {a: 1, b: 2});
    });

    it('tuples', function () {
      var instance = Tuple(['a', 1]);
      var updated = update(instance, {0: {$set: 'b'}});
      assert.deepEqual(updated, ['b', 1]);
    });

    it('structs', function () {
      var instance = new Point({x: 0, y: 1});
      var updated = update(instance, {x: {$set: 1}});
      assert.deepEqual(instance, {x: 0, y: 1});
      assert.deepEqual(updated, {x: 1, y: 1});
    });

    it('lists', function () {
      var instance = List([1, 2, 3, 4]);
      var updated = update(instance, {2: {$set: 5}});
      assert.deepEqual(updated, [1, 2, 5, 4]);
    });

    it('dicts', function () {
      var instance = Dict({a: 1, b: 2});
      var updated = update(instance, {a: {$set: 2}});
      assert.deepEqual(updated, {a: 2, b: 2});
      updated = update(instance, {c: {$set: 3}});
      assert.deepEqual(updated, {a: 1, b: 2, c: 3});
    });

    it('should not change the reference when no changes occurs', function () {
      var p1 = {x: 0, y: 1};
      var p2 = update(p1, {});
      assert.strictEqual(p1, p2);
      var p3 = update(p1, {x: {$set: 0}});
      assert.strictEqual(p1, p3);

      var n1 = {a: {b: {c: 1}}};
      var n2 = t.update(n1, {a: {b: {c: {$set: 1}}}});
      assert.strictEqual(n1, n2);

      var m1 = {a: 1, b: 2};
      var m2 = t.update(m1, {a: {$set: 2}, b: {$set: 2}});
      assert.equal(m1 === m2, false);
    });

  });

  describe('$apply', function () {

    it('numbers', function () {
      var $apply = function (n) { return n + 1; };
      var instance = 1;
      var actual = update(instance, {$apply: $apply});
      assert.deepEqual(actual, 2);
    });

    it('arrays', function () {
      var $apply = function (n) { return n + 1; };
      var instance = [1, 2, 3];
      var actual = update(instance, {1: {'$apply': $apply}});
      assert.deepEqual(instance, [1, 2, 3]);
      assert.deepEqual(actual, [1, 3, 3]);
    });

    it('dates', function () {
      var instance = new Date(1973, 10, 30);
      var actual = update(instance, { $apply: function (date) { return date.getFullYear(); } });
      assert.equal(actual, 1973);
    });

    it('regexps', function () {
      var instance = /a/;
      var actual = update(instance, { $apply: function (regexp) { return regexp.source; } });
      assert.equal(actual, 'a');
    });

    it('structs', function () {
      var instance = new Point({x: 0, y: 1});
      var updated = update(instance, {x: {$apply: function (x) {
        return x + 2;
      }}});
      assert.deepEqual(instance, {x: 0, y: 1});
      assert.deepEqual(updated, {x: 2, y: 1});
    });

    it('should not change the reference when no changes occurs', function () {
      var $apply = function (n) { return n; };
      var arr1 = [1, 2, 3];
      var arr2 = update(arr1, {1: {'$apply': $apply}});
      assert.strictEqual(arr1, arr2);
    });

  });

  describe('$unshift', function () {

    it('should handle $unshift command', function () {
      var actual = update([1, 2, 3], {'$unshift': [4]});
      assert.deepEqual(actual, [4, 1, 2, 3]);
      actual = update([1, 2, 3], {'$unshift': [4, 5]});
      assert.deepEqual(actual, [4, 5, 1, 2, 3]);
      actual = update([1, 2, 3], {'$unshift': [[4, 5]]});
      assert.deepEqual(actual, [[4, 5], 1, 2, 3]);
    });

    it('lists', function () {
      var instance = List([1, 2, 3, 4]);
      var updated = update(instance, {$unshift: [5]});
      assert.deepEqual(updated, [5, 1, 2, 3, 4]);
      updated = update(instance, {$unshift: [5, 6]});
      assert.deepEqual(updated, [5, 6, 1, 2, 3, 4]);
    });

    it('should not change the reference when no changes occurs', function () {
      var arr = [1, 2, 3];
      assert.strictEqual(update(arr, {'$unshift': []}), arr);
    });

  });

  describe('$push', function () {

    it('should handle $push command', function () {
      var actual = update([1, 2, 3], {'$push': [4]});
      assert.deepEqual(actual, [1, 2, 3, 4]);
      actual = update([1, 2, 3], {'$push': [4, 5]});
      assert.deepEqual(actual, [1, 2, 3, 4, 5]);
      actual = update([1, 2, 3], {'$push': [[4, 5]]});
      assert.deepEqual(actual, [1, 2, 3, [4, 5]]);
    });

    it('lists', function () {
      var instance = List([1, 2, 3, 4]);
      var updated = update(instance, {$push: [5]});
      assert.deepEqual(updated, [1, 2, 3, 4, 5]);
      updated = update(instance, {$push: [5, 6]});
      assert.deepEqual(updated, [1, 2, 3, 4, 5, 6]);
    });

    it('should not change the reference when no changes occurs', function () {
      var arr = [1, 2, 3];
      assert.strictEqual(update(arr, {'$push': []}), arr);
    });

  });

  describe('$splice', function () {

    it('arrays', function () {
      var instance = [1, 2, {a: [12, 17, 15]}];
      var actual = update(instance, {2: {a: {$splice: [[1, 1, 13, 14]]}}});
      assert.deepEqual(instance, [1, 2, {a: [12, 17, 15]}]);
      assert.deepEqual(actual, [1, 2, {a: [12, 13, 14, 15]}]);
    });

    it('should throw with bas arguments', function () {
      var instance = [1, 2, {a: [12, 17, 15]}];
      throwsWithMessage(function () {
        update(instance, {2: {a: {$splice: [1, 1, 13, 14]}}});
      }, '[tcomb] Invalid argument splices supplied to immutability helper { $splice: splices } (expected an array of arrays)');
    });

    it('lists', function () {
      var instance = List([1, 2, 3, 4]);
      var updated = update(instance, {$splice: [[1, 2, 5, 6]]});
      assert.deepEqual(updated, [1, 5, 6, 4]);
    });

    it('should not change the reference when no changes occurs', function () {
      var arr = [1, 2, 3];
      assert.strictEqual(update(arr, {'$splice': []}), arr);
    });

  });

  describe('$remove', function () {

    it('objects', function () {
      var instance = {a: 1, b: 2};
      var actual = update(instance, {'$remove': ['a']});
      assert.deepEqual(instance, {a: 1, b: 2});
      assert.deepEqual(actual, {b: 2});
    });

    it('can $merge and $remove objects at once', function () {
      var instance = {a: [1, 2], b: true};
      var actual = update(instance, { $merge: {a: [1, 2, 3] }, $remove: ['b'] });
      assert.deepEqual(instance, {a: [1, 2], b: true});
      assert.deepEqual(actual, {a: [1, 2, 3]});
    });

    it('dicts', function () {
      var instance = Dict({a: 1, b: 2});
      var updated = update(instance, {$remove: ['a']});
      assert.deepEqual(updated, {b: 2});
    });

    it('can $merge and $remove dicts at once', function () {
      var instance = Dict({a: 1, b: 2});
      var updated = update(instance, { $merge: {a: [1, 2, 3] }, $remove: ['b'] });
      assert.deepEqual(updated, {a: [1, 2, 3]});
    });

    it('should not change the reference when no changes occurs', function () {
      var o1 = {x: 0, y: 1};
      var o2 = update(o1, { $remove: [] });
      assert.strictEqual(o1, o2);
    });

  });

  describe('$swap', function () {

    it('arrays', function () {
      var instance = [1, 2, 3, 4];
      var actual = update(instance, {'$swap': {from: 1, to: 2}});
      assert.deepEqual(instance, [1, 2, 3, 4]);
      assert.deepEqual(actual, [1, 3, 2, 4]);
    });

    it('lists', function () {
      var instance = List([1, 2, 3, 4]);
      var updated = update(instance, {$swap: {from: 1, to: 2}});
      assert.deepEqual(updated, [1, 3, 2, 4]);
    });

    it('should not change the reference when no changes occurs', function () {
      var arr1 = [1, 2, 3, 4];
      var arr2 = update(arr1, {'$swap': {from: 1, to: 1}});
      assert.strictEqual(arr1, arr2);
    });

  });

  describe('$merge', function () {

    it('structs', function () {
      var instance = new Point({x: 0, y: 1});
      var updated = update(instance, {'$merge': {x: 2, y: 2}});
      assert.deepEqual(instance, {x: 0, y: 1});
      assert.deepEqual(updated, {x: 2, y: 2});
      var Nested = t.struct({
        a: t.Number,
        b: t.struct({
          c: t.Number,
          d: t.Number,
          e: t.Number
        })
      });
      instance = new Nested({a: 1, b: {c: 2, d: 3, e: 4}});
      updated = update(instance, {b: {'$merge': {c: 5, e: 6}}});
      assert.deepEqual(instance, {a: 1, b: {c: 2, d: 3, e: 4}});
      assert.deepEqual(updated, {a: 1, b: {c: 5, d: 3, e: 6}});
    });

    it('should not change the reference when no changes occurs', function () {
      // issue #199
      var bob = { name: 'Bob', surname: 'Builder' };
      var stillBob = t.update(bob, { $merge: { name: 'Bob', surname: 'Builder' } });
      assert.strictEqual(bob, stillBob);
    });

  });

  describe('all together now', function () {

    it('should handle mixed commands', function () {
      var Struct = t.struct({
        a: t.Number,
        b: Tuple,
        c: List,
        d: Dict
      });
      var instance = new Struct({
        a: 1,
        b: ['a', 1],
        c: [1, 2, 3, 4],
        d: {a: 1, b: 2}
      });
      var updated = update(instance, {
        a: {$set: 1},
        b: {0: {$set: 'b'}},
        c: {2: {$set: 5}},
        d: {$remove: ['a']}
      });
      assert.deepEqual(updated, {
        a: 1,
        b: ['b', 1],
        c: [1, 2, 5, 4],
        d: {b: 2}
      });
    });

    it('should handle nested structures', function () {
      var Struct = t.struct({
        a: t.struct({
          b: t.tuple([
            t.String,
            t.list(t.Number)
          ])
        })
      });
      var instance = new Struct({
        a: {
          b: ['a', [1, 2, 3]]
        }
      });
      var updated = update(instance, {
        a: {b: {1: {2: {$set: 4}}}}
      });
      assert.deepEqual(updated, {
        a: {
          b: ['a', [1, 2, 4]]
        }
      });
    });

  });

  describe('should not change the reference when no changes occurs', function () {

    it('structs', function () {
      var p1 = new Point({x: 0, y: 1});
      var p2 = Point.update(p1, {});
      assert.strictEqual(p1, p2);
      var p3 = Point.update(p1, {x: {$set: 0}});
      assert.strictEqual(p1, p3);
      var p5 = Point.update(p1, {$remove: []});
      assert.strictEqual(p1, p5);
      var p4 = Point.update(p1, {$merge: {}});
      assert.strictEqual(p1, p4);
    });

    it('lists', function () {
      var Struct = t.struct({
        a: t.Number,
        b: t.String,
        c: t.tuple([t.Number, t.Number])
      });
      var List = t.list(Struct);
      var instance = List([{
        a: 1,
        b: 'one',
        c: [1000, 1000000]
      }, {
        a: 2,
        b: 'two',
        c: [2000, 2000000]
      }]);

      var updated = update(instance, {
        1: {
          a: {$set: 119}
        }
      });

      assert.strictEqual(updated[0], instance[0]);
      assert.notStrictEqual(updated[1], instance[1]);
      assert.strictEqual(updated[1].c, instance[1].c);
    });

  });

});
