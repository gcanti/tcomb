var IdentityMap = require('./IdentityMap');
var IdentitySet = require('./IdentitySet');

function TreeState() {
  if (!(this instanceof TreeState)) { // `new` is optional
    return new TreeState();
  }

  this.cycleEntries = new IdentitySet();
  this.valueStates = new IdentityMap();
}

TreeState.prototype.isIdempotent = function(actual, instance) {
  var valueState = this.valueStates.get(actual);
  if (valueState) {
    return valueState.idempotent;
  }
  return actual === instance;
};

module.exports = TreeState;
