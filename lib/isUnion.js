const isType = require('./isType');
const isUnion = (x) 
  isType(x) && ( x.meta.kind === 'union' );

module.exports = isUnion 