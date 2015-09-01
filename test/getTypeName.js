/* globals describe, it */
var assert = require('assert');
var t = require('../index');

describe('t.getTypeName(type)', function () {

  var NamelessStruct = t.struct({});
  var NamedStruct = t.struct({}, 'NamedStruct');
  var NamelessUnion = t.union([t.String, t.Number]);
  var NamedUnion = t.union([t.String, t.Number], 'NamedUnion');
  var NamelessMaybe = t.maybe(t.String);
  var NamedMaybe = t.maybe(t.String, 'NamedMaybe');
  var NamelessEnums = t.enums({a: 'A', b: 'B'});
  var NamedEnums = t.enums({}, 'NamedEnums');
  var NamelessTuple = t.tuple([t.String, t.Number]);
  var NamedTuple = t.tuple([t.String, t.Number], 'NamedTuple');
  var NamelessSubtype = t.subtype(t.String, function notEmpty(x) { return x !== ''; });
  var NamedSubtype = t.subtype(t.String, function (x) { return x !== ''; }, 'NamedSubtype');
  var NamelessList = t.list(t.String);
  var NamedList = t.list(t.String, 'NamedList');
  var NamelessDict = t.dict(t.String, t.String);
  var NamedDict = t.dict(t.String, t.String, 'NamedDict');
  var NamelessFunc = t.func(t.String, t.String);
  var NamedFunc = t.func(t.String, t.String, 'NamedFunc');
  var NamelessIntersection = t.intersection([t.String, t.Number]);
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

  it('should return a meaningful name of a Nameless type', function () {
    assert.deepEqual(t.getTypeName(NamelessStruct), '{}');
    assert.deepEqual(t.getTypeName(NamelessUnion), 'String | Number');
    assert.deepEqual(t.getTypeName(NamelessMaybe), '?String');
    assert.deepEqual(t.getTypeName(NamelessEnums), '"a" | "b"');
    assert.deepEqual(t.getTypeName(NamelessTuple), '[String, Number]');
    assert.deepEqual(t.getTypeName(NamelessSubtype), '{String | notEmpty}');
    assert.deepEqual(t.getTypeName(NamelessList), 'Array<String>');
    assert.deepEqual(t.getTypeName(NamelessDict), '{[key: String]: String}');
    assert.deepEqual(t.getTypeName(NamelessFunc), '(String) => String');
    assert.deepEqual(t.getTypeName(NamelessIntersection), 'String & Number');
  });

});
