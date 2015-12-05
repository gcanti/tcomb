var getTypeName = require('./getTypeName');

module.exports = function getDefaultUnionName(types) {
  return types.map(getTypeName).join(' | ');
};