var tFunction = require('./Function');
var tInterface = require('./interface');
var tList = require('./list');
var tType = require('./Type');

var Instrumentation = tInterface({
  codomain: tType,
  domain: tList(tType),
  f: tFunction
});

module.exports = function isTypedFunction(x) {
  return tFunction.is(x) && Instrumentation.is(x.instrumentation);
};
