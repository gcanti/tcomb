/* globals describe, it */
var assert = require('assert');
var t = require('../index');
var throwsWithMessage = require('./util').throwsWithMessage;

describe('t.update(instance, spec)', function () {

  var update = t.update;
  var Tuple = t.tuple([t.String, t.Number]);
  var List = t.list(t.Number);
  var Dict = t.dict(t.String, t.Number);
  var Point = t.struct({
    x: t.Number,
    y: t.Number
  });

  it('should throw if spec is invalid', function () {
    throwsWithMessage(function () {
      t.update({});
    }, '[tcomb] Invalid argument spec undefined supplied to function update(instance, spec): expected an object containing commands');
  });

  it('should handle $set command', function () {
    var instance = 1;
    var actual = update(instance, {$set: 2});
    assert.deepEqual(actual, 2);
    instance = [1, 2, 3];
    actual = update(instance, {1: {'$set': 4}});
    assert.deepEqual(instance, [1, 2, 3]);
    assert.deepEqual(actual, [1, 4, 3]);
  });

  it('$set and null value, fix #65', function () {
    var NullStruct = t.struct({a: t.Number, b: t.maybe(t.Number)});
    var instance = new NullStruct({a: 1});
    var updated = update(instance, {b: {$set: 2}});
    assert.deepEqual(instance, {a: 1, b: null});
    assert.deepEqual(updated, {a: 1, b: 2});
  });

  it('should handle $apply command', function () {
    var $apply = function (n) { return n + 1; };
    var instance = 1;
    var actual = update(instance, {$apply: $apply});
    assert.deepEqual(actual, 2);
    instance = [1, 2, 3];
    actual = update(instance, {1: {'$apply': $apply}});
    assert.deepEqual(instance, [1, 2, 3]);
    assert.deepEqual(actual, [1, 3, 3]);
  });

  it('should $apply dates', function () {
    var instance = new Date(1973, 10, 30);
    var actual = update(instance, { $apply: function (date) { return date.getFullYear(); } });
    assert.equal(actual, 1973);
  });

  it('should $apply regexps', function () {
    var instance = /a/;
    var actual = update(instance, { $apply: function (regexp) { return regexp.source; } });
    assert.equal(actual, 'a');
  });

  it('should handle $unshift command', function () {
    var actual = update([1, 2, 3], {'$unshift': [4]});
    assert.deepEqual(actual, [4, 1, 2, 3]);
    actual = update([1, 2, 3], {'$unshift': [4, 5]});
    assert.deepEqual(actual, [4, 5, 1, 2, 3]);
    actual = update([1, 2, 3], {'$unshift': [[4, 5]]});
    assert.deepEqual(actual, [[4, 5], 1, 2, 3]);
  });

  it('should handle $push command', function () {
    var actual = update([1, 2, 3], {'$push': [4]});
    assert.deepEqual(actual, [1, 2, 3, 4]);
    actual = update([1, 2, 3], {'$push': [4, 5]});
    assert.deepEqual(actual, [1, 2, 3, 4, 5]);
    actual = update([1, 2, 3], {'$push': [[4, 5]]});
    assert.deepEqual(actual, [1, 2, 3, [4, 5]]);
  });

  it('should handle $splice command', function () {
    var instance = [1, 2, {a: [12, 17, 15]}];
    var actual = update(instance, {2: {a: {$splice: [[1, 1, 13, 14]]}}});
    assert.deepEqual(instance, [1, 2, {a: [12, 17, 15]}]);
    assert.deepEqual(actual, [1, 2, {a: [12, 13, 14, 15]}]);
  });

  it('should handle bad $splice command', function () {
    var instance = [1, 2, {a: [12, 17, 15]}];
    throwsWithMessage(function () {
      update(instance, {2: {a: {$splice: [1, 1, 13, 14]}}});
    }, '[tcomb] Invalid argument splices supplied to immutability helper { $splice: splices } (expected an array of arrays)');
  });

  it('should handle $remove command', function () {
    var instance = {a: 1, b: 2};
    var actual = update(instance, {'$remove': ['a']});
    assert.deepEqual(instance, {a: 1, b: 2});
    assert.deepEqual(actual, {b: 2});
  });

  it('should handle $swap command', function () {
    var instance = [1, 2, 3, 4];
    var actual = update(instance, {'$swap': {from: 1, to: 2}});
    assert.deepEqual(instance, [1, 2, 3, 4]);
    assert.deepEqual(actual, [1, 3, 2, 4]);
  });

  it('can $merge and $remove at once', function () {
    var instance = {a: [1, 2], b: true};
    var actual = update(instance, { $merge: {a: [1, 2, 3] }, $remove: ['b'] });
    assert.deepEqual(instance, {a: [1, 2], b: true});
    assert.deepEqual(actual, {a: [1, 2, 3]});
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

  describe('structs', function () {

    var instance = new Point({x: 0, y: 1});

    it('should handle $set command', function () {
      var updated = update(instance, {x: {$set: 1}});
      assert.deepEqual(instance, {x: 0, y: 1});
      assert.deepEqual(updated, {x: 1, y: 1});
    });

    it('should handle $apply command', function () {
      var updated = update(instance, {x: {$apply: function (x) {
        return x + 2;
      }}});
      assert.deepEqual(instance, {x: 0, y: 1});
      assert.deepEqual(updated, {x: 2, y: 1});
    });

    it('should handle $merge command', function () {
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
      var p1 = new Point({x: 0, y: 1});
      var p2 = Point.update(p1, {});
      assert.strictEqual(p1, p2);
      var p3 = Point.update(p1, {x: {$set: 0}});
      assert.strictEqual(p1, p3);
    });

  });

  describe('tuples', function () {

    var instance = Tuple(['a', 1]);

    it('should handle $set command', function () {
      var updated = update(instance, {0: {$set: 'b'}});
      assert.deepEqual(updated, ['b', 1]);
    });

  });

  describe('lists', function () {

    var instance = List([1, 2, 3, 4]);

    it('should handle $set command', function () {
      var updated = update(instance, {2: {$set: 5}});
      assert.deepEqual(updated, [1, 2, 5, 4]);
    });

    it('should handle $splice command', function () {
      var updated = update(instance, {$splice: [[1, 2, 5, 6]]});
      assert.deepEqual(updated, [1, 5, 6, 4]);
    });

    it('should handle $concat command', function () {
      var updated = update(instance, {$push: [5]});
      assert.deepEqual(updated, [1, 2, 3, 4, 5]);
      updated = update(instance, {$push: [5, 6]});
      assert.deepEqual(updated, [1, 2, 3, 4, 5, 6]);
    });

    it('should handle $prepend command', function () {
      var updated = update(instance, {$unshift: [5]});
      assert.deepEqual(updated, [5, 1, 2, 3, 4]);
      updated = update(instance, {$unshift: [5, 6]});
      assert.deepEqual(updated, [5, 6, 1, 2, 3, 4]);
    });

    it('should handle $swap command', function () {
      var updated = update(instance, {$swap: {from: 1, to: 2}});
      assert.deepEqual(updated, [1, 3, 2, 4]);
    });

  });

  describe('dicts', function () {

    var instance = Dict({a: 1, b: 2});

    it('should handle $set command', function () {
      var updated = update(instance, {a: {$set: 2}});
      assert.deepEqual(updated, {a: 2, b: 2});
      updated = update(instance, {c: {$set: 3}});
      assert.deepEqual(updated, {a: 1, b: 2, c: 3});
    });

    it('should handle $remove command', function () {
      var updated = update(instance, {$remove: ['a']});
      assert.deepEqual(updated, {b: 2});
    });

    it('can $merge and $remove at once', function () {
      var updated = update(instance, { $merge: {a: [1, 2, 3] }, $remove: ['b'] });
      assert.deepEqual(updated, {a: [1, 2, 3]});
    });

  });

  describe('memory saving', function () {

    it('should reuse members that are not updated', function () {
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

});
