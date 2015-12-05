var assert = require('./assert');

module.exports = function getDefaultEnumsName(map) {
  return Object.keys(map).map(function (k) { return assert.stringify(k); }).join(' | ');
};