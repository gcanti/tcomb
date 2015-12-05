var getTypeName = require('./getTypeName');

module.exports = function getDefaultListName(type) {
  return 'Array<' + getTypeName(type) + '>';
};