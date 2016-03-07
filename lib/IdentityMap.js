var assert = require('./assert');
var isArray = require('./isArray');
var isFunction = require('./isFunction');
var isObject = require('./isObject');

function IdentityMap() {
  // if (typeof WeakMap !== 'undefined') {
  //   return new WeakMap();
  // }
  if (!(this instanceof IdentityMap)) { // `new` is optional
    return new IdentityMap();
  }

  this.keys = [];
  this.values = [];
  this.size = 0;
}

IdentityMap.prototype.set = function(key, value) {
  assert(isArray(key) || isObject(key) || isFunction(key), 'Invalid value used as map key');

  var index = this.keys.indexOf(key);

  if (index === -1) {
    this.keys.push(key);
    this.values.push(value);
    this.size++;
  } else {
    this.values[index] = value;
  }

  return this;
};

IdentityMap.prototype.get = function(key) {
  var index = this.keys.indexOf(key);
  return index === -1 ? undefined : this.values[index];
};

module.exports = IdentityMap;
