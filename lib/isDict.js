var isType = require('./isType');

module.exports = function isDict(x) {
  return isType(x) && ( x.meta.kind === 'dict' );
};
