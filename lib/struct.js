var assert = require('./assert');
var isTypeName = require('./isTypeName');
var String = require('./String');
var Function = require('./Function');
var isObject = require('./isObject');
var create = require('./create');
var mixin = require('./mixin');
var isStruct = require('./isStruct');
var getTypeName = require('./getTypeName');
var dict = require('./dict');
var IdentityMap = require('./IdentityMap');
var TreeState = require('./TreeState');

function getDefaultName(props) {
  return '{' + Object.keys(props).map(function (prop) {
    return prop + ': ' + getTypeName(props[prop]);
  }).join(', ') + '}';
}

function struct(props, name) {

  if (process.env.NODE_ENV !== 'production') {
    assert(dict(String, Function).is(props), function () { return 'Invalid argument props ' + assert.stringify(props) + ' supplied to struct(props, [name]) combinator (expected a dictionary String -> Type)'; });
    assert(isTypeName(name), function () { return 'Invalid argument name ' + assert.stringify(name) + ' supplied to struct(props, [name]) combinator (expected a string)'; });
  }

  var displayName = name || getDefaultName(props);

  function Struct(value, path, treeState) {

    if (Struct.is(value)) { // implements idempotency
      return value;
    }

    if (process.env.NODE_ENV !== 'production') {
      path = path || [displayName];
      assert(isObject(value), function () { return 'Invalid value ' + assert.stringify(value) + ' supplied to ' + path.join('/') + ' (expected an object)'; });
    }

    if (!(this instanceof Struct)) { // `new` is optional
      return new Struct(value, path, treeState);
    }

    treeState = treeState || new TreeState();

    var existingState = treeState.valueStates.get(value);
    var state = existingState || {
      idempotent: false,
      ret: new IdentityMap()
    };

    if (existingState) {
      var ret = existingState.ret.get(Struct);

      if (ret) {
        return ret;
      }
    } else {
      treeState.valueStates.set(value, state);
    }

    state.ret.set(Struct, this);

    for (var k in props) {
      if (props.hasOwnProperty(k)) {
        var expected = props[k];
        var actual = value[k];
        var _path = ( process.env.NODE_ENV !== 'production' ? path.concat(k + ': ' + getTypeName(expected)) : null );
        this[k] = create(expected, actual, _path, treeState);
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      Object.freeze(this);
    }

  }

  Struct.meta = {
    kind: 'struct',
    props: props,
    name: name,
    identity: false
  };

  Struct.displayName = displayName;

  Struct.is = function (x) {
    return x instanceof Struct;
  };

  Struct.update = function (instance, spec) {
    return new Struct(assert.update(instance, spec));
  };

  Struct.extend = function (structs, name) {
    var props = {};
    var prototype = {};
    [Struct].concat(structs).forEach(function (struct, i) {
      if (isObject(struct)) {
        mixin(props, struct);
      }
      else {
        if (process.env.NODE_ENV !== 'production') {
          assert(isStruct(struct), function () { return 'Invalid argument structs[' + i + '] ' + assert.stringify(struct) + ' supplied to ' + displayName + '.extend(structs, name)'; });
        }
        mixin(props, struct.meta.props);
        mixin(prototype, struct.prototype);
      }
    });
    var ret = struct(props, name);
    mixin(ret.prototype, prototype);
    return ret;
  };

  return Struct;
}

struct.getDefaultName = getDefaultName;
module.exports = struct;
