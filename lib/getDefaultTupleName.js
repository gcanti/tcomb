var getTypeName = require('./getTypeName');

module.exports = function getDefaultTupleName(types) {
  return '[' + types.map(getTypeName).join(', ') + ']';
};