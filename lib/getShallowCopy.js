var isArray = require('./isArray');
var isObject = require('./isObject');
var mixin = require('./mixin');

module.exports = function getShallowCopy(x) {
  if (isArray(x)) {
    return x.concat();
  }
  if (isObject(x)) {
    return mixin({}, x);
  }
  return x;
};