var isType = require('./isType');

module.exports = function isTuple(x) {
  return isType(x) && ( x.meta.kind === 'tuple' );
};
