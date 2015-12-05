var getTypeName = require('./getTypeName');

module.exports = function getDefaultFuncName(domain, codomain) {
  return '(' + domain.map(getTypeName).join(', ') + ') => ' + getTypeName(codomain);
};