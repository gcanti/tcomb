var getTypeName = require('./getTypeName');

module.exports = function getDefaultDictName(domain, codomain) {
  return '{[key: ' + getTypeName(domain) + ']: ' + getTypeName(codomain) + '}';
};