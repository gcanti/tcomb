var assert = require('./assert');
var isObject = require('./isObject');
var isArray = require('./isArray');
var mixin = require('./mixin');
var isStruct = require('./isStruct');
var isInterface = require('./isInterface');

function createExtend(ctor) {
  return function extend(mixins, name) {
    if (process.env.NODE_ENV !== 'production') {
      assert(isArray(mixins) && mixins.every(function (x) {
        return isObject(x) || isStruct(x) || isInterface(x);
      }), function () { return 'Invalid argument mixins supplied to extend(mixins, name), expected an array of objects or structs'; });
    }
    var props = {};
    var prototype = {};
    mixins.forEach(function (x) {
      if (isObject(x)) {
        mixin(props, x);
      }
      else {
        mixin(props, x.meta.props);
        mixin(prototype, x.prototype);
      }
    });
    var ret = ctor(props, name);
    mixin(ret.prototype, prototype);
    return ret;
  };
}

module.exports = createExtend;