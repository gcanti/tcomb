var assert = require('./assert');
var isTypeName = require('./isTypeName');
var String = require('./String');
var Function = require('./Function');
var isObject = require('./isObject');
var create = require('./create');
var getTypeName = require('./getTypeName');
var dict = require('./dict');
var getDefaultInterfaceName = require('./getDefaultInterfaceName');
var isIdentity = require('./isIdentity');
var is = require('./is');

function inter(props, name) {

  if (process.env.NODE_ENV !== 'production') {
    assert(dict(String, Function).is(props), function () { return 'Invalid argument props ' + assert.stringify(props) + ' supplied to interface(props, [name]) combinator (expected a dictionary String -> Type)'; });
    assert(isTypeName(name), function () { return 'Invalid argument name ' + assert.stringify(name) + ' supplied to interface(props, [name]) combinator (expected a string)'; });
  }

  var displayName = name || getDefaultInterfaceName(props);
  var identity = Object.keys(props).map(function (prop) { return props[prop]; }).every(isIdentity);

  function Interface(value, path) {

    if (process.env.NODE_ENV === 'production') {
      if (identity) {
        return value; // just trust the input if elements must not be hydrated
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      path = path || [displayName];
      assert(isObject(value), function () { return 'Invalid value ' + assert.stringify(value) + ' supplied to ' + path.join('/') + ' (expected an object)'; });
    }

    var idempotent = true;
    var ret = {};
    for (var k in props) {
      var expected = props[k];
      var actual = value[k];
      var instance = create(expected, actual, ( process.env.NODE_ENV !== 'production' ? path.concat(k + ': ' + getTypeName(expected)) : null ));
      idempotent = idempotent && ( actual === instance );
      ret[k] = instance;
    }

    if (idempotent) { // implements idempotency
      ret = value;
    }

    if (process.env.NODE_ENV !== 'production') {
      Object.freeze(ret);
    }

    return ret;

  }

  Interface.meta = {
    kind: 'interface',
    props: props,
    name: name,
    identity: identity
  };

  Interface.displayName = displayName;

  Interface.is = function (x) {
    if (!isObject(x)) {
      return false;
    }
    for (var k in props) {
      if (!is(x[k], props[k])) {
        return false;
      }
    }
    return true;
  };

  Interface.update = function (instance, patch) {
    return new Interface(assert.update(instance, patch));
  };

  return Interface;
}

inter.getDefaultName = getDefaultInterfaceName;
module.exports = inter;
