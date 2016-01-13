var assert = require('./assert');
var isTypeName = require('./isTypeName');
var isFunction = require('./isFunction');
var getTypeName = require('./getTypeName');
var isIdentity = require('./isIdentity');
var isObject = require('./isObject');
var create = require('./create');
var is = require('./is');
var TreeState = require('./TreeState');

function getDefaultName(domain, codomain) {
  return '{[key: ' + getTypeName(domain) + ']: ' + getTypeName(codomain) + '}';
}

function dict(domain, codomain, name) {

  if (process.env.NODE_ENV !== 'production') {
    assert(isFunction(domain), function () { return 'Invalid argument domain ' + assert.stringify(domain) + ' supplied to dict(domain, codomain, [name]) combinator (expected a type)'; });
    assert(isFunction(codomain), function () { return 'Invalid argument codomain ' + assert.stringify(codomain) + ' supplied to dict(domain, codomain, [name]) combinator (expected a type)'; });
    assert(isTypeName(name), function () { return 'Invalid argument name ' + assert.stringify(name) + ' supplied to dict(domain, codomain, [name]) combinator (expected a string)'; });
  }

  var displayName = name || getDefaultName(domain, codomain);
  var domainNameCache = getTypeName(domain);
  var codomainNameCache = getTypeName(codomain);
  var identity = isIdentity(domain) && isIdentity(codomain);

  function Dict(value, path, treeState) {

    if (process.env.NODE_ENV === 'production') {
      if (identity) {
        return value; // just trust the input if elements must not be hydrated
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      path = path || [displayName];
      assert(isObject(value), function () { return 'Invalid value ' + assert.stringify(value) + ' supplied to ' + path.join('/'); });
    }

    treeState = treeState || new TreeState();

    var idempotent = true; // will remain true if I can reutilise the input
    var ret = {}; // make a temporary copy, will be discarded if idempotent remains true
    for (var k in value) {
      if (value.hasOwnProperty(k)) {
        var kPath = ( process.env.NODE_ENV !== 'production' ? path.concat(domainNameCache) : null );
        k = create(domain, k, kPath, treeState);

        var actual = value[k];
        var _path = ( process.env.NODE_ENV !== 'production' ? path.concat(k + ': ' + codomainNameCache) : null );
        var instance = create(codomain, actual, _path, treeState);
        idempotent = idempotent && treeState.isIdempotent(actual, instance);
        ret[k] = instance;
      }
    }

    if (idempotent) { // implements idempotency
      ret = value;
    }

    if (process.env.NODE_ENV !== 'production') {
      Object.freeze(ret);
    }

    return ret;
  }

  Dict.meta = {
    kind: 'dict',
    domain: domain,
    codomain: codomain,
    name: name,
    identity: identity
  };

  Dict.displayName = displayName;

  Dict.is = function (x, treeState) {
    if (!isObject(x)) {
      return false;
    }
    for (var k in x) {
      if (x.hasOwnProperty(k)) {
        if (!is(k, domain, treeState) || !is(x[k], codomain, treeState)) {
          return false;
        }
      }
    }
    return true;
  };

  Dict.update = function (instance, spec) {
    return Dict(assert.update(instance, spec));
  };

  return Dict;
}

dict.getDefaultName = getDefaultName;
module.exports = dict;
