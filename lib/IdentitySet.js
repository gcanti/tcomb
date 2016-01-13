var assert = require('./assert');
var isArray = require('./isArray');
var isFunction = require('./isFunction');
var isObject = require('./isObject');

function IdentitySet() {
  // if (typeof WeakSet !== 'undefined') {
  //   return new WeakSet();
  // }
  if (!(this instanceof IdentitySet)) { // `new` is optional
    return new IdentitySet();
  }

  this.values = [];
  this.size = 0;
}

IdentitySet.prototype.add = function(value) {
  assert(isArray(value) || isObject(value) || isFunction(value), 'Invalid value used in set');

  if (this.values.indexOf(value) === -1) {
    this.values.push(value);
    this.size++;
  }
};

IdentitySet.prototype.delete = function(value) {
  var index = this.values.indexOf(value);

  if (index !== -1) {
    this.values.splice(index, 1);
    this.size--;
  }
};

module.exports = IdentitySet;
