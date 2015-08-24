/* globals describe, it */
var assert = require('assert');
var t = require('../index');
var throwsWithMessage = require('./util').throwsWithMessage;

describe('t.intersection(types, [name])', function () {

  var Min = t.subtype(t.String, function (s) { return s.length > 2; }, 'Min');
  var Max = t.subtype(t.String, function (s) { return s.length < 5; }, 'Max');
  var MinMax = t.intersection([Min, Max], 'MinMax');

  describe('combinator', function () {

    it('should throw if used with wrong arguments', function () {

      throwsWithMessage(function () {
        t.intersection();
      }, '[tcomb] Invalid argument types undefined supplied to intersection(types, [name]) combinator (expected an array of at least 2 types)');

      throwsWithMessage(function () {
        t.intersection([]);
      }, '[tcomb] Invalid argument types [] supplied to intersection(types, [name]) combinator (expected an array of at least 2 types)');

      throwsWithMessage(function () {
        t.intersection([1]);
      }, '[tcomb] Invalid argument types [\n  1\n] supplied to intersection(types, [name]) combinator (expected an array of at least 2 types)');

      throwsWithMessage(function () {
        t.intersection([Min, Max], 1);
      }, '[tcomb] Invalid argument name 1 supplied to intersection(types, [name]) combinator (expected a string)');

    });

  });

  describe('constructor', function () {

    it('should throw if used with wrong arguments', function () {
      throwsWithMessage(function () {
        MinMax('a')
      }, '[tcomb] Invalid value "a" supplied to MinMax');
    });

  });

  describe('#is(x)', function () {

    it('should return true when x is an instance of the intersection', function () {
      assert.ok(MinMax.is('123'), '3 chars');
      assert.strictEqual(MinMax.is('12'), false);
      assert.strictEqual(MinMax.is('12345'), false);
    });

  });

});
