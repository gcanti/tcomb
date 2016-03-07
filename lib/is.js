var isType = require('./isType');

// returns true if x is an instance of type
module.exports = function is(x, type, treeState) {
  if (isType(type)) {
    return type.is(x, treeState);
  }
  return x instanceof type; // type should be a class constructor
};
