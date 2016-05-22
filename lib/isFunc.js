var isType = require('./isType');

module.exports = function isFunc(x) {
  return isType(x) && ( x.meta.kind === 'func' );
};
