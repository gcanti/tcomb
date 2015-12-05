/*! @preserve
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2014-2015 Giulio Canti
 *
 */
var assert = require('./lib/assert');

assert.assert = assert;
assert.mixin = require('./lib/mixin');
assert.mixin(assert, require('./lib/types'));
assert.mixin(assert, require('./lib/combinators'));
assert.update = require('./lib/update');
assert.isType = require('./lib/isType');
assert.is = require('./lib/is');
assert.getTypeName = require('./lib/getTypeName');
assert.match = require('./lib/match');

module.exports = assert;
