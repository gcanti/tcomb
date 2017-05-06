const isType = require('./isType');

const is = (x, type) =>
  (isType(type)) ?
    type.is(x) :
    x instanceof type; // type should be a class constructor
    
// returns true if x is an instance of type
module.exports = is
