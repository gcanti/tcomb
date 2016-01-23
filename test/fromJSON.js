/* globals describe, it */
var assert = require('assert');
var t = require('../index');
var fromJSON = require('../lib/fromJSON');
var util = require('./util');

describe('fromJSON', function () {

  // don't pollute the MyDate type
  var MyDate = t.refinement(t.Date, function () { return true; }, 'MyDate');
  var date = new Date(1973, 10, 30);
  function jsonify(x) {
    return JSON.parse(JSON.stringify(x));
  }

  MyDate.fromJSON = function (s) {
    t.assert(t.String.is(s));
    return new Date(s);
  };

  it('should throw with a bad type argument', function () {
    util.throwsWithMessage(function () {
      fromJSON();
    }, '[tcomb] Invalid argument type undefined supplied to fromJSON(value, type) (expected a type)');
  });

  it('should handle a static fromJSON function attached to the type', function () {
    var MyType = t.refinement(t.String, function () { return true; });
    MyType.fromJSON = function (s) {
      return s.length;
    };
    assert.equal(fromJSON('aaa', MyType), 3);
  });

  it('should handle maybe', function () {
    var MyType = t.maybe(MyDate);
    assert.strictEqual(fromJSON(null, MyType), null);
    assert.deepEqual(fromJSON(jsonify(date), MyType), date);
  });

  it('should handle refinement', function () {
    var MyType = t.refinement(MyDate, function (d) {
      return d.getTime() >= date.getTime();
    }, 'MyType');
    assert.equal(fromJSON(jsonify(date), MyType).getTime(), date.getTime());
    util.throwsWithMessage(function () {
      fromJSON(jsonify(new Date(123375600000)), MyType);
    }, '[tcomb] Invalid argument value "1973-11-28T23:00:00.000Z" supplied to fromJSON(value, type) (expected a valid MyType)');
  });

  it('should handle struct', function () {
    var MyType = t.struct({
      name: t.String,
      birthDate: MyDate
    }, 'MyType');

    util.throwsWithMessage(function () {
      fromJSON(null, MyType);
    }, '[tcomb] Invalid argument value null supplied to fromJSON(value, type) (expected an object for type MyType)');

    var source = {
      name: 'Giulio',
      birthDate: date
    };
    var json = jsonify(source);
    var actual = fromJSON(json, MyType);
    assert.ok(actual instanceof MyType);
    assert.deepEqual(actual, source);
  });

  it('should handle list', function () {
    var MyType = t.list(MyDate, 'MyType');

    util.throwsWithMessage(function () {
      fromJSON(null, MyType);
    }, '[tcomb] Invalid argument value null supplied to fromJSON(value, type) (expected an array for type MyType)');

    var source = [new Date(2016, 10, 30), new Date(2073, 10, 30)];
    var json = jsonify(source);
    assert.deepEqual(fromJSON(json, MyType), source);
  });

  it('should handle union', function () {
    var MyType = t.union([t.Number, MyDate], 'MyType');

    MyType.dispatch = function (x) {
      if (t.Number.is(x)) { return t.Number; }
      if (MyDate.is(x) || t.String.is(x)) { return MyDate; }
    };

    util.throwsWithMessage(function () {
      fromJSON(null, MyType);
    }, '[tcomb] Invalid argument value null supplied to fromJSON(value, type) (no constructor returned by dispatch of union MyType)');

    var source = new Date(2016, 10, 30);
    var json = jsonify(source);
    assert.deepEqual(fromJSON(json, MyType), source);
    source = 1;
    json = jsonify(source);
    assert.deepEqual(fromJSON(json, MyType), source);
  });

  it('should handle tuple', function () {
    var MyType = t.tuple([t.String, MyDate], 'MyType');

    util.throwsWithMessage(function () {
      fromJSON(null, MyType);
    }, '[tcomb] Invalid argument value null supplied to fromJSON(value, type) (expected an array for type MyType)');

    var source = ['s', new Date(2016, 10, 30)];
    var json = jsonify(source);
    assert.deepEqual(fromJSON(json, MyType), source);
  });

  it('should handle dict', function () {
    var MyType = t.dict(t.String, MyDate, 'MyType');

    util.throwsWithMessage(function () {
      fromJSON(null, MyType);
    }, '[tcomb] Invalid argument value null supplied to fromJSON(value, type) (expected an object for type MyType)');

    var source = {a: new Date(2016, 10, 30)};
    var json = jsonify(source);
    assert.deepEqual(fromJSON(json, MyType), source);
  });

});
