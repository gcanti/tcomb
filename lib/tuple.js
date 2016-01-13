var assert = require('./assert');
var isTypeName = require('./isTypeName');
var isFunction = require('./isFunction');
var getTypeName = require('./getTypeName');
var isIdentity = require('./isIdentity');
var isArray = require('./isArray');
var create = require('./create');
var is = require('./is');
var TreeState = require('./TreeState');

function getDefaultName(types) {
  return '[' + types.map(getTypeName).join(', ') + ']';
}

function tuple(types, name) {

  if (process.env.NODE_ENV !== 'production') {
    assert(isArray(types) && types.every(isFunction), function () { return 'Invalid argument types ' + assert.stringify(types) + ' supplied to tuple(types, [name]) combinator (expected an array of types)'; });
    assert(isTypeName(name), function () { return 'Invalid argument name ' + assert.stringify(name) + ' supplied to tuple(types, [name]) combinator (expected a string)'; });
  }

  var displayName = name || getDefaultName(types);
  var identity = types.every(isIdentity);

  function Tuple(value, path, treeState) {

    if (process.env.NODE_ENV === 'production') {
      if (identity) {
        return value;
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      path = path || [displayName];
      assert(isArray(value) && value.length === types.length, function () { return 'Invalid value ' + assert.stringify(value) + ' supplied to ' + path.join('/') + ' (expected an array of length ' + types.length + ')'; });
    }

    treeState = treeState || new TreeState();

    var existingState = treeState.valueStates.get(value);
    var state = existingState || {
      idempotent: true,
      ret: [],
      resolved: false,
      i: 0,
      len: types.length
    };

    if (existingState && existingState.resolved) {
      return existingState.ret;
    }

    if (existingState) {
      state.i++;
      treeState.cycleEntries.add(value);
    } else {
      treeState.valueStates.set(value, state);
    }

    for (; state.i < state.len; state.i++) {
      var i = state.i;
      var expected = types[i];
      var actual = value[i];
      var _path = ( process.env.NODE_ENV !== 'production' ? path.concat(i + ': ' + getTypeName(expected)) : null );
      var instance = create(expected, actual, _path, treeState);
      state.idempotent = state.idempotent && treeState.isIdempotent(actual, instance);
      state.ret[i] = instance;
    }

    if (existingState) {
      return state.ret;
    } else {
      state.resolved = true;
      treeState.cycleEntries.delete(value);
    }

    if (state.idempotent && !treeState.cycleEntries.size) { // implements idempotency
      state.ret = value;
    }

    if (process.env.NODE_ENV !== 'production') {
      Object.freeze(state.ret);
    }

    return state.ret;
  }

  Tuple.meta = {
    kind: 'tuple',
    types: types,
    name: name,
    identity: identity
  };

  Tuple.displayName = displayName;

  Tuple.is = function (x, treeState) {
    if (isArray(x) && x.length === types.length) {
      treeState = treeState || new TreeState();

      var existingState = treeState.valueStates.get(x);
      var state = existingState || true;

      if (existingState) {
        return true;
      }

      treeState.valueStates.set(x, state);

      return types.every(function (type, i) {
        return is(x[i], type, treeState);
      });
    }
    return false;
  };

  Tuple.update = function (instance, spec) {
    return Tuple(assert.update(instance, spec));
  };

  return Tuple;
}

tuple.getDefaultName = getDefaultName;
module.exports = tuple;