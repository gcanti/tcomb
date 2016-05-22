var isType = require('./isType');

module.exports = function isRefinement(x) {
  return isType(x) && ( x.meta.kind === 'subtype' );
};
