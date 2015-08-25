/* globals describe, it */
var assert = require('assert');
var t = require('../index');
var throwsWithMessage = require('./util').throwsWithMessage;

describe('t.assert(guard, [message])', function () {

  it('should nor throw when guard is true', function () {
    t.assert(true);
  });

  it('should throw a default message', function () {
    throwsWithMessage(function () {
      t.assert(1 === 2); // eslint-disable-line
    }, '[tcomb] Assert failed (turn on "Pause on exceptions" in your Source panel)');
  });

  it('should throw the specified message', function () {
    throwsWithMessage(function () {
      t.assert(1 === 2, 'my message'); // eslint-disable-line
    }, '[tcomb] my message');
  });

  it('should handle lazy messages', function () {
    throwsWithMessage(function () {
      t.assert(1 === 2, function () { return 'lazy'; }); // eslint-disable-line
    }, '[tcomb] lazy');
  });

  it('should handle custom fail behaviour', function () {
    var fail = t.fail;
    t.fail = function (message) {
      try {
        throw new Error(message);
      } catch (e) {
        assert.strictEqual(e.message, 'report error');
      }
    };
    assert.doesNotThrow(function () {
      t.assert(1 === 2, 'report error'); // eslint-disable-line
    });
    t.fail = fail;
  });

});
