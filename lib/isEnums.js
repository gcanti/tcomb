var isType = require('./isType');

module.exports = function isEnums(x) {
  return isType(x) && ( x.meta.kind === 'enums' );
};
