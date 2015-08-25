/* globals describe, it */
var assert = require('assert');
var t = require('../index');
var throwsWithMessage = require('./util').throwsWithMessage;

describe('t.enums(map, [name])', function () {

  describe('combinator', function () {

    it('should throw if used with wrong arguments', function () {

      throwsWithMessage(function () {
        t.enums();
      }, '[tcomb] Invalid argument map undefined supplied to enums(map, [name]) combinator (expected a dictionary of String -> String | Number)');

      throwsWithMessage(function () {
        t.enums({}, 1);
      }, '[tcomb] Invalid argument name 1 supplied to enums(map, [name]) combinator (expected a string)');

    });

  });

  describe('constructor', function () {

    var T = t.enums({a: 0}, 'T');

    it('should throw if used with new', function () {
      throwsWithMessage(function () {
        var x = new T('a'); // eslint-disable-line
      }, '[tcomb] Cannot use the new operator to instantiate the type T');
    });

    it('should accept only valid values', function () {
      assert.deepEqual(T('a'), 'a');
      throwsWithMessage(function () {
        T('b');
      }, '[tcomb] Invalid value "b" supplied to T (expected one of [\n  "a"\n])');
    });

  });

  describe('#is(x)', function () {

    var Direction = t.enums({
      North: 0,
      East: 1,
      South: 2,
      West: 3,
      1: 'North-East',
      2.5: 'South-East'
    });

    it('should return true when x is an instance of the enum', function () {
      assert.ok(Direction.is('North'));
      assert.ok(Direction.is(1));
      assert.ok(Direction.is('1'));
      assert.ok(Direction.is(2.5));
    });

    it('should return false when x is not an instance of the enum', function () {
      assert.strictEqual(Direction.is('North-East'), false);
      assert.strictEqual(Direction.is(2), false);
    });

  });

  describe('#of(keys)', function () {

    it('should return an enum', function () {
      var Size = t.enums.of(['large', 'small', 1, 10.9]);
      assert.ok(Size.meta.map.large === 'large');
      assert.ok(Size.meta.map.small === 'small');
      assert.ok(Size.meta.map['1'] === 1);
      assert.ok(Size.meta.map[10.9] === 10.9);
    });

    it('should handle a string', function () {
      var Size = t.enums.of('large small 10');
      assert.ok(Size.meta.map.large === 'large');
      assert.ok(Size.meta.map.small === 'small');
      assert.ok(Size.meta.map['10'] === '10');
      assert.ok(Size.meta.map[10] === '10');
    });

  });

});
