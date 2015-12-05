var getTypeName = require('./getTypeName');

module.exports = function getDefaultIntersectionName(types) {
  return types.map(getTypeName).join(' & ');
};