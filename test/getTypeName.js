/* globals describe, it */
var assert = require('assert');
var t = require('../index');

describe('t.getTypeName(type)', function () {

  var UnnamedStruct = t.struct({});
  var NamedStruct = t.struct({}, 'NamedStruct');
  var UnnamedUnion = t.union([t.String, t.Number]);
  var NamedUnion = t.union([t.String, t.Number], 'NamedUnion');
  var UnnamedMaybe = t.maybe(t.String);
  var NamedMaybe = t.maybe(t.String, 'NamedMaybe');
  var UnnamedEnums = t.enums({a: 'A', b: 'B'});
  var NamedEnums = t.enums({}, 'NamedEnums');
  var UnnamedTuple = t.tuple([t.String, t.Number]);
  var NamedTuple = t.tuple([t.String, t.Number], 'NamedTuple');
  var UnnamedSubtype = t.subtype(t.String, function notEmpty(x) { return x !== ''; });
  var NamedSubtype = t.subtype(t.String, function (x) { return x !== ''; }, 'NamedSubtype');
  var UnnamedList = t.list(t.String);
  var NamedList = t.list(t.String, 'NamedList');
  var UnnamedDict = t.dict(t.String, t.String);
  var NamedDict = t.dict(t.String, t.String, 'NamedDict');
  var UnnamedFunc = t.func(t.String, t.String);
  var NamedFunc = t.func(t.String, t.String, 'NamedFunc');
  var UnnamedIntersection = t.intersection([t.String, t.Number]);
  var NamedIntersection = t.intersection([t.String, t.Number], 'NamedIntersection');

  it('should return the name of a function', function () {
    assert.deepEqual(t.getTypeName(function myname(){}), 'myname');
  });

  it('should return the name of a named type', function () {
    assert.deepEqual(t.getTypeName(NamedStruct), 'NamedStruct');
    assert.deepEqual(t.getTypeName(NamedUnion), 'NamedUnion');
    assert.deepEqual(t.getTypeName(NamedMaybe), 'NamedMaybe');
    assert.deepEqual(t.getTypeName(NamedEnums), 'NamedEnums');
    assert.deepEqual(t.getTypeName(NamedTuple), 'NamedTuple');
    assert.deepEqual(t.getTypeName(NamedSubtype), 'NamedSubtype');
    assert.deepEqual(t.getTypeName(NamedList), 'NamedList');
    assert.deepEqual(t.getTypeName(NamedDict), 'NamedDict');
    assert.deepEqual(t.getTypeName(NamedFunc), 'NamedFunc');
    assert.deepEqual(t.getTypeName(NamedIntersection), 'NamedIntersection');
  });

  it('should return a meaningful name of a unnamed type', function () {
    assert.deepEqual(t.getTypeName(UnnamedStruct), '{}');
    assert.deepEqual(t.getTypeName(UnnamedUnion), 'String | Number');
    assert.deepEqual(t.getTypeName(UnnamedMaybe), '?String');
    assert.deepEqual(t.getTypeName(UnnamedEnums), '"a" | "b"');
    assert.deepEqual(t.getTypeName(UnnamedTuple), '[String, Number]');
    assert.deepEqual(t.getTypeName(UnnamedSubtype), '{String | notEmpty}');
    assert.deepEqual(t.getTypeName(UnnamedList), 'Array<String>');
    assert.deepEqual(t.getTypeName(UnnamedDict), '{[key: String]: String}');
    assert.deepEqual(t.getTypeName(UnnamedFunc), '(String) => String');
    assert.deepEqual(t.getTypeName(UnnamedIntersection), 'String & Number');
  });

});
