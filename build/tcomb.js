//     tcomb 0.0.8
//     https://github.com/gcanti/tcomb
//     (c) 2014 Giulio Canti <giulio.canti@gmail.com>
//     tcomb may be freely distributed under the MIT license.

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.t = factory();
  }
}(this, function () {

    "use strict";

    // rigger includes (https://github.com/buildjs/rigger)

    //
    // assert
    //
    
    function assert(guard) {
      if (guard !== true) {
        var args = Array.prototype.slice.call(arguments, 1);
        var message = args[0] ? print.apply(null, args) : 'assert(): failed';
        assert.onFail(message); 
      }
    }
    
    assert.failed = false;
    
    assert.onFail = function (message) {
      // start debugger only once
      if (!assert.failed) { 
        debugger; 
      }
      assert.failed = true;
      throw new Error(message);
    };

    //
    // utils
    //
    
    function freeze(obj_or_arr, unless) {
      if (unless !== true && Object.freeze) {
        Object.freeze(obj_or_arr);
      }
      return obj_or_arr;
    }
    
    function mixin(x, y, overwrite) {
      for (var k in y) {
        if (y.hasOwnProperty(k)) {
          if (!overwrite) {
            assert(!x.hasOwnProperty(k), 'mixin(): cannot overwrite property %s', k);
          }
          x[k] = y[k];
        }
      }
      return x;
    }
    
    function getName(type) { 
      return type.meta && type.meta.name ? type.meta.name : type.name || 'Unknown';
    }
    
    function print() {
      var args = Array.prototype.slice.call(arguments);
      var index = 0;
      return args[0].replace(/%([a-z%])/g, function(match, format) {
        if (match === '%%') return match;
        index++;
        var formatter = print.formatters[format];
        var arg = args[index];
        return formatter(arg);
      });
    }
    
    print.formatters = {
      s: function (x) { return String(x); },
      o: function (x) { return JSON.stringify(x); }
    };
    
    // array manipulation
    
    function isValidIndex(index, from, to) {
      return Num.is(index) && index >= from && index <= to;
    }
    
    function append(arr, element) {
      assert(Arr.is(arr), 'append(): bad array');
      var ret = arr.slice();
      ret.push(element);
      return ret;
    }
    
    function prepend(arr, element) {
      assert(Arr.is(arr), 'prepend(): bad array');
      var ret = arr.slice();
      ret.unshift(element);
      return ret;
    }
    
    function update(arr, index, element) {
      assert(Arr.is(arr), 'update(): bad array');
      assert(isValidIndex(index, 0, arr.length - 1), 'update(): bad index');
      var ret = arr.slice();
      ret[index] = element;
      return ret;
    }
    
    function remove(arr, index) {
      assert(Arr.is(arr), 'remove(): bad array');
      assert(isValidIndex(index, 0, arr.length - 1), 'remove(): bad index');
      var ret = arr.slice();
      ret.splice(index, 1);
      return ret;
    }
    
    function move(arr, from, to) {
      assert(Arr.is(arr), 'move(): bad array');
      assert(isValidIndex(from, 0, arr.length - 1), 'move(): bad from');
      assert(isValidIndex(to, 0, arr.length - 1), 'move(): bad to');
      var ret = arr.slice();
      if (from === to) {
        return ret;
      }
      var element = ret.splice(from, 1)[0];
      ret.splice(to, 0, element);
      return ret;
    }
    
    function coerce(Type, values, mut) {
      return Type.meta.kind === 'struct' ?
          new Type(values, mut) :
          Type(values, mut);
    }

    //
    // primitives
    //
    
    function primitive(name, is) {
    
      function Primitive(values) {
        assert(!(this instanceof Primitive), 'cannot use new with %s', name);
        assert(Primitive.is(values), 'bad %s', name);
        return values;
      }
    
      Primitive.meta = {
        kind: 'primitive',
        name: name,
        ctor: false
      };
    
      Primitive.is = is;
    
      return Primitive;
    }
    
    var Nil = primitive('Nil', function (x) {
      return x === null || x === undefined;
    });
    
    var Str = primitive('Str', function (x) {
      return typeof x === 'string';
    });
    
    var Num = primitive('Num', function (x) {
      return typeof x === 'number' && isFinite(x) && !isNaN(x);
    });
    
    var Bool = primitive('Bool', function (x) {
      return x === true || x === false;
    });
    
    var Arr = primitive('Arr', function (x) {
      return x instanceof Array;
    });
    
    var Obj = primitive('Obj', function (x) {
      return !Nil.is(x) && x.constructor === Object && !Arr.is(x);
    });
    
    var Func = primitive('Func', function (x) {
      return typeof x === 'function';
    });
    
    var Err = primitive('Err', function (x) {
      return x instanceof Error;
    });

    //
    // struct
    //
    
    function struct(props, name) {
    
      name = name || 'struct()';
    
      function Struct(values, mut) {
    
        assert(Obj.is(values), 'bad %s', name);
        assert(maybe(Bool).is(mut), 'bad mut');
    
        for (var prop in props) {
          if (props.hasOwnProperty(prop)) {
            var Type = props[prop],
              value = values[prop];
            this[prop] = Type.is(value) ? value : coerce(Type, value, mut);
          }
        }
    
        freeze(this, mut);
      }
    
      Struct.meta = {
        kind: 'struct',
        props: props,
        name: name,
        ctor: true
      };
    
      Struct.is = function (x) { 
        return x instanceof Struct; 
      };
    
      Struct.update = function (instance, updates, mut) {
    
        assert(Struct.is(instance));
        assert(Obj.is(updates));
    
        var v = {};
        for (var prop in props) {
          if (props.hasOwnProperty(prop)) {
              v[prop] = updates.hasOwnProperty(prop) ? updates[prop] : instance[prop];
          }
        }
        return new Struct(v, mut);
      };
    
      return Struct;
    }

    //
    // union
    //
    
    function union(types, name) {
    
      name = name || print('union(%s)', types.map(getName).join(', '));
    
      function Union(values, mut) {
        assert(Func.is(Union.dispatch), 'unimplemented %s.dispatch()', name);
        var Type = Union.dispatch(values);
        if (this instanceof Union) {
          assert(Type.meta.ctor, 'cannot use new with %s', name);
        }
        return coerce(Type, values, mut);
      }
    
      Union.meta = {
        kind: 'union',
        types: types,
        name: name,
        ctor: types.every(function (type) { return type.meta.ctor; })
      };
    
      Union.is = function (x) {
        return types.some(function (type) {
          return type.is(x);
        });
      };
    
      return Union;
    }

    // --------------------------------------------------------------
    // maybe
    // --------------------------------------------------------------
    
    function maybe(Type, name) {
    
      name = name || print('maybe(%s)', getName(Type));
    
      function Maybe(values, mut) {
        assert(!(this instanceof Maybe), 'cannot use new with %s', name);
        return Nil.is(values) ? null : coerce(Type, values, mut);
      }
    
      Maybe.meta = {
        kind: 'maybe',
        type: Type,
        name: name,
        ctor: false
      };
    
      Maybe.is = function (x) {
        return Nil.is(x) || Type.is(x);
      };
    
      return Maybe;
    }

    //
    // enums
    //
    
    function enums(map, name) {
    
      name = name || 'enums()';
    
      function Enums(x) {
        assert(!(this instanceof Enums), 'cannot use new with %s', name);
        assert(Enums.is(x), 'bad %s', name);
        return x;
      }
    
      Enums.meta = {
        kind: 'enums',
        map: map,
        name: name,
        ctor: false
      };
    
      Enums.is = function (x) {
        return Str.is(x) && map.hasOwnProperty(x);
      };
    
      return Enums;
    }
    
    enums.of = function (keys, name) {
      keys = Str.is(keys) ? keys.split(' ') : keys;
      var values = {};
      keys.forEach(function (k, i) {
        values[k] = i;
      });
      return enums(values, name);
    };

    //
    // tuple
    //
    
    function tuple(types, name) {
    
      name = name || print('tuple(%s)', types.map(getName).join(', '));
    
      var len = types.length;
    
      function Tuple(values, mut) {
    
        assert(Arr.is(values), 'bad %s', name);
    
        var arr = [];
        for (var i = 0 ; i < len ; i++) {
          var Type = types[i];
          var value = values[i];
          arr.push(Type.is(value) ? value : coerce(Type, value, mut));
        }
    
        return freeze(arr, mut);
      }
    
      Tuple.meta = {
        kind: 'tuple',
        types: types,
        name: name,
        ctor: true
      };
    
      Tuple.is = function (x) {
        return Arr.is(x) && x.length === len && 
          types.every(function (type, i) { 
            return type.is(x[i]); 
          });
      };
    
      Tuple.update = function (instance, index, element, mut) {
        var Type = types[index],
          value = Type.is(element) ? element : coerce(Type, element, mut),
          arr = update(instance, index, value);
        return freeze(arr, mut);
      };
    
      return Tuple;
    }

    //
    // subtype
    //
    
    function subtype(Type, predicate, name) {
    
      name = name || print('subtype(%s)', getName(Type));
    
      function Subtype(values, mut) {
        if (this instanceof Subtype) {
          assert(Subtype.meta.ctor, 'cannot use new with %s', name);
        }
        var x = coerce(Type, values, mut);
        assert(predicate(x), 'bad ' + name);
        return x;
      }
    
      Subtype.meta = {
        kind: 'subtype',
        type: Type,
        predicate: predicate,
        name: name,
        ctor: Type.ctor
      };
    
      Subtype.is = function (x) {
        return Type.is(x) && predicate(x);
      };
    
      return Subtype;
    }

    //
    // list
    //
    
    function list(Type, name) {
    
      name = name || print('list(%s)', getName(Type));
    
      function List(values, mut) {
    
        assert(Arr.is(values), 'bad %s', name);
    
        var arr = [];
        for (var i = 0, len = values.length ; i < len ; i++ ) {
          var value = values[i];
          arr.push(Type.is(value) ? value : coerce(Type, value, mut));
        }
    
        return freeze(arr, mut);
      }
    
      List.meta = {
        kind: 'list',
        type: Type,
        name: name,
        ctor: true
      };
    
      List.is = function (x) {
        return Arr.is(x) && x.every(Type.is);
      };
    
      List.append = function (instance, element, mut) {
        var value = Type.is(element) ? element : coerce(Type, element, mut),
          arr = append(instance, value);
        return freeze(arr, mut);
      };
    
      List.prepend = function (instance, element, mut) {
        var value = Type.is(element) ? element : coerce(Type, element, mut),
          arr = prepend(instance, value);
        return freeze(arr, mut);
      };
    
      List.update = function (instance, index, element, mut) {
        var value = Type.is(element) ? element : coerce(Type, element, mut),
          arr = update(instance, index, value);
        return freeze(arr, mut);
      };
    
      List.remove = function (instance, index, mut) {
        var arr = remove(instance, index);
        return freeze(arr, mut);
      };
    
      List.move = function (instance, from, to, mut) {
        var arr = move(instance, from, to);
        return freeze(arr, mut);
      };
    
      return List;
    }

    //
    // func (experimental)
    //
    
    var func = function (Arguments, f, Return, name) {
        
      function func() {
        var args = Array.prototype.slice.call(arguments);
        if (args.length < f.length) args.length = f.length; // handle optional arguments
    
        args = Arguments.is(args) ? args : coerce(Arguments, args);
    
        var r = f.apply(this, args);
    
        if (Return) {
          r = Return.is(r) ? r : coerce(Return, r);
        }
    
        return r;
      }
    
      func.is = function (x) { return x === func; };
    
      func.meta = {
        kind: 'func',
        Arguments: Arguments,
        f: f,
        Return: Return,
        name: name
      };
    
      return func;
    };

    return {
        assert: assert,
        freeze: freeze,
        mixin: mixin,
        append: append,
        prepend: prepend,
        update: update,
        remove: remove,
        move: move,
        print: print,
        getName: getName,
        
        Nil: Nil,
        Str: Str,
        Num: Num,
        Bool: Bool,
        Arr: Arr,
        Obj: Obj,
        Func: Func,
        Err: Err,

        struct: struct,
        enums: enums,
        union: union,
        maybe: maybe,
        tuple: tuple,
        subtype: subtype,
        list: list,
        func: func
    };
}));