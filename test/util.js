var assert = require('assert');

function throwsWithMessage(f, message) {
  assert.throws(f, function (err) {
    assert.strictEqual(err instanceof Error, true);
    assert.strictEqual(err.message, message);
    return true;
  });
}

module.exports = {
  throwsWithMessage: throwsWithMessage
};
