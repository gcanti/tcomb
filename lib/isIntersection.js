var isType = require('./isType');

module.exports = function isIntersection(x) {
  return isType(x) && ( x.meta.kind === 'intersection' );
};
