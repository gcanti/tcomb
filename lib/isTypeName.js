const isNil = require('./isNil');
const isString = require('./isString');

const isTypeName = (name) => 
  isNil(name) || isString(name);
  
module.exports = isTypeName;