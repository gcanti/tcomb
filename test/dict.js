/* globals describe, it */
var assert = require('assert');
var t = require('../index');
var util = require('./util');

describe('t.dict(domain, codomain, [name])', function () {

  describe('combinator', function () {

    it('should throw if used with wrong arguments', function () {

      util.throwsWithMessage(function () {
        t.dict();
      }, '[tcomb] Invalid argument domain undefined supplied to dict(domain, codomain, [name]) combinator (expected a type)');

      util.throwsWithMessage(function () {
        t.dict(t.String);
      }, '[tcomb] Invalid argument codomain undefined supplied to dict(domain, codomain, [name]) combinator (expected a type)');

      util.throwsWithMessage(function () {
        t.dict(t.String, t.String, 1);
      }, '[tcomb] Invalid argument name 1 supplied to dict(domain, codomain, [name]) combinator (expected a string)');

    });

  });

  describe('constructor', function () {

    var Domain = t.subtype(t.String, function (x) {
      return x !== 'forbidden';
    }, 'Domain');
    var Codomain = t.struct({name: t.String}, 'Codomain');
    var Dictionary = t.dict(Domain, Codomain, 'Dictionary');

    it('should throw with a contextual error message if used with wrong arguments', function () {

      util.throwsWithMessage(function () {
        Dictionary(1);
      }, '[tcomb] Invalid value 1 supplied to Dictionary');

      util.throwsWithMessage(function () {
        Dictionary({a: 1});
      }, '[tcomb] Invalid value 1 supplied to Dictionary/a: Codomain (expected an object)');

      util.throwsWithMessage(function () {
        Dictionary({forbidden: {}});
      }, '[tcomb] Invalid value "forbidden" supplied to Dictionary/Domain');

    });

    it('should hydrate the values of the dictionary', function () {
      var instance = Dictionary({a: {name: 'Giulio'}});
      assert.ok(Codomain.is(instance.a));
    });

    it('should hydrate the values of the dictionary in production', util.production(function () {
      var instance = Dictionary({a: {name: 'Giulio'}});
      assert.ok(Codomain.is(instance.a));
    }));

    it('should be idempotent', function () {
      var d0 = {a: {name: 'Giulio'}, b: {name: 'Guido'}};
      var d1 = Dictionary(d0);
      var d2 = Dictionary(d1);
      assert.equal(d0 === d1, false);
      assert.equal(d1 === d2, true);
    });

    it('should be idempotent in production', util.production(function () {
      var d0 = {a: {name: 'Giulio'}, b: {name: 'Guido'}};
      var d1 = Dictionary(d0);
      var d2 = Dictionary(d1);
      assert.equal(d0 === d1, false);
      assert.equal(d1 === d2, true);
    }));

    it('should freeze the instance', function () {
      var instance = Dictionary({});
      assert.equal(Object.isFrozen(instance), true);
    });

    it('should not freeze the instance in production', util.production(function () {
      var instance = Dictionary({});
      assert.equal(Object.isFrozen(instance), false);
    }));

  });

  describe('is(x)', function () {

    var Point = t.struct({
      x: t.Number,
      y: t.Number
    });

    var T = t.dict(t.String, Point);
    var p1 = new Point({x: 0, y: 0});
    var p2 = new Point({x: 1, y: 1});

    it('should return true when x is a dictionary', function () {
      assert.equal(T.is({a: p1, b: p2}), true);
      assert.equal(T.is({a: {x: 0, y: 0}, b: {x: 1, y: 1}}), false);
    });

    it('should be used as a predicate', function () {
      assert.ok([{a: p1, b: p2}].every(T.is));
    });

  });

  describe('update(instance, patch)', function () {

    it('should return a new instance', function () {
      var Dictionary = t.dict(t.String, t.String);
      var instance = Dictionary({a: 'a', b: 'b'});
      var newInstance = Dictionary.update(instance, {b: {$set: 'c'}});
      assert.ok(Dictionary.is(newInstance));
      assert.equal(newInstance !== instance, true);
      assert.deepEqual(newInstance, {a: 'a', b: 'c'});
    });

  });

});
