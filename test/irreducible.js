/* globals describe, it */
var t = require('../index');
var throwsWithMessage = require('./util').throwsWithMessage;

describe('irreducible(name, predicate)', function () {

  it('should throw if used with wrong arguments', function () {

    throwsWithMessage(function () {
      t.irreducible(null, function () { return true; });
    }, '[tcomb] Invalid argument name null supplied to irreducible(name, predicate) (expected a string)');

    throwsWithMessage(function () {
      t.irreducible('MyType');
    }, '[tcomb] Invalid argument predicate undefined supplied to irreducible(name, predicate) (expected a function)');

  });

});
