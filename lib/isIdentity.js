var isType = require('./isType');

// return true if the type constructor behaves like the identity function (exceptions are the structs)
module.exports = function isIdentity(type) {
  if (isType(type)) {
    return type.meta.identity;
  }
  return true; // ES6 classes are identity for tcomb
};