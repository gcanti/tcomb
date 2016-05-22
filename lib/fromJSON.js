var assert = require('./assert');
var getTypeName = require('./getTypeName');
var isArray = require('./isArray');
var isDict = require('./isDict');
var isFunction = require('./isFunction');
var isInterface = require('./isInterface');
var isList = require('./isList');
var isMaybe = require('./isMaybe');
var isNil = require('./isNil');
var isObject = require('./isObject');
var isRefinement = require('./isRefinement');
var isStruct = require('./isStruct');
var isTuple = require('./isTuple');
var isUnion = require('./isUnion');

function fromJSON(value, type) {
  if (process.env.NODE_ENV !== 'production') {
    assert(isFunction(type), function () {
      return 'Invalid argument type ' + assert.stringify(type) + ' supplied to fromJSON(value, type) (expected a type)';
    });
  }

  if (isFunction(type.fromJSON)) {
    return type.fromJSON(value);
  }

  var k;
  var ret;

  switch (true) {

    case isMaybe(type) :
      return isNil(value) ? null : fromJSON(value, type.meta.type);

    case isRefinement(type) :
      ret = fromJSON(value, type.meta.type);
      if (process.env.NODE_ENV !== 'production') {
        assert(type.meta.predicate(ret), function () {
          return 'Invalid argument value ' + assert.stringify(value) + ' supplied to fromJSON(value, type) (expected a valid ' + getTypeName(type) + ')';
        });
      }
      return ret;

    case isStruct(type) :
      if (process.env.NODE_ENV !== 'production') {
        assert(isObject(value), function () {
          return 'Invalid argument value ' + assert.stringify(value) + ' supplied to fromJSON(value, type) (expected an object for type ' + getTypeName(type) + ')';
        });
      }
      var props = type.meta.props;
      ret = {};
      for (k in props) {
        if (props.hasOwnProperty(k)) {
          ret[k] = fromJSON(value[k], props[k]);
        }
      }
      return new type(ret);

    case isInterface(type) :
      if (process.env.NODE_ENV !== 'production') {
        assert(isObject(value), function () {
          return 'Invalid argument value ' + assert.stringify(value) + ' supplied to fromJSON(value, type) (expected an object)';
        });
      }
      var interProps = type.meta.props;
      ret = {};
      for (k in interProps) {
        if (interProps.hasOwnProperty(k)) {
          ret[k] = fromJSON(value[k], interProps[k]);
        }
      }
      return ret;

    case isList(type) :
      if (process.env.NODE_ENV !== 'production') {
        assert(isArray(value), function () {
          return 'Invalid argument value ' + assert.stringify(value) + ' supplied to fromJSON(value, type) (expected an array for type ' + getTypeName(type) + ')';
        });
      }
      var elementType = type.meta.type;
      return value.map(function (element) {
        return fromJSON(element, elementType);
      });

    case isUnion(type) :
      var actualType = type.dispatch(value);
      if (process.env.NODE_ENV !== 'production') {
        assert(isFunction(actualType), function () {
          return 'Invalid argument value ' + assert.stringify(value) + ' supplied to fromJSON(value, type) (no constructor returned by dispatch of union ' + getTypeName(type) + ')';
        });
      }
      return fromJSON(value, actualType);

    case isTuple(type) :
      if (process.env.NODE_ENV !== 'production') {
        assert(isArray(value), function () {
          return 'Invalid argument value ' + assert.stringify(value) + ' supplied to fromJSON(value, type) (expected an array for type ' + getTypeName(type) + ')';
        });
      }
      var types = type.meta.types;
      if (process.env.NODE_ENV !== 'production') {
        assert(isArray(value) && value.length === types.length, function () {
          return 'Invalid value ' + assert.stringify(value) + ' supplied to fromJSON(value, type) (expected an array of length ' + types.length + ' for type ' + getTypeName(type) + ')';
        });
      }
      return value.map(function (element, i) {
        return fromJSON(element, types[i]);
      });

    case isDict(type) :
      if (process.env.NODE_ENV !== 'production') {
        assert(isObject(value), function () {
          return 'Invalid argument value ' + assert.stringify(value) + ' supplied to fromJSON(value, type) (expected an object for type ' + getTypeName(type) + ')';
        });
      }
      var domain = type.meta.domain;
      var codomain = type.meta.codomain;
      ret = {};
      for (k in value) {
        if (value.hasOwnProperty(k)) {
          ret[domain(k)] = fromJSON(value[k], codomain);
        }
      }
      return ret;

    default : // enums, irreducible, intersection
      return type(value);
  }
}

module.exports = fromJSON;
