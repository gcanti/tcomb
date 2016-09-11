var isFunction = require('./isFunction');

module.exports = function isPromise(x) {
  return !!x && isFunction(x.then);
};
