var getTypeName = require('./getTypeName');
var getFunctionName = require('./getFunctionName');

module.exports = function getDefaultRefinementName(type, predicate) {
  return '{' + getTypeName(type) + ' | ' + getFunctionName(predicate) + '}';
};