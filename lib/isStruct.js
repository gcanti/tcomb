const isType = require('./isType');

const isStruct = (x) =>
  isType(x) && ( x.meta.kind === 'struct' );

module.exports = isStruct