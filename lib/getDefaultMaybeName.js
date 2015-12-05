var getTypeName = require('./getTypeName');

module.exports = function getDefaultMaybeName(type) {
  return '?' + getTypeName(type);
};