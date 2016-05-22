var isType = require('./isType');

module.exports = function isList(x) {
  return isType(x) && ( x.meta.kind === 'list' );
};
