/* globals describe, it */
var assert = require('assert');
var t = require('../index');
var throwsWithMessage = require('./util').throwsWithMessage;

describe('t.mixin(x, y, [overwrite])', function () {

  it('should mix two objects', function () {
    var o1 = {a: 1};
    var o2 = {b: 2};
    var o3 = t.mixin(o1, o2);
    assert.strictEqual(o3, o1);
    assert.deepEqual(o3.a, 1);
    assert.deepEqual(o3.b, 2);
  });

  it('should throw if a property already exists', function () {
    throwsWithMessage(function () {
      var o1 = {a: 1};
      var o2 = {a: 2, b: 2};
      t.mixin(o1, o2);
    }, '[tcomb] Invalid call to mixin(target, source, [overwrite]): cannot overwrite property "a" of target object');
  });

  it('should not throw if a property already exists but overwrite = true', function () {
    var o1 = {a: 1};
    var o2 = {a: 2, b: 2};
    var o3 = t.mixin(o1, o2, true);
    assert.deepEqual(o3.a, 2);
    assert.deepEqual(o3.b, 2);
  });

  it('should not mix prototype properties', function () {
    function F() {}
    F.prototype.method = function () {};
    var source = new F();
    var target = {};
    t.mixin(target, source);
    assert.deepEqual(target.method, undefined);
  });

});
