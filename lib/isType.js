const isFunction = require('./isFunction');
const isObject = require('./isObject');

const isType = (x) => 
  isFunction(x) && isObject(x.meta);

module.exports = isType