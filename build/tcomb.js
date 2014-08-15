//     tcomb 0.0.9
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
    // options
    //
    
    var failed = false;
    
    function onFail(message) {
      // start debugger only once
      if (!failed) {
        /*jshint debug: true*/
        debugger; 
      }
      failed = true;
      throw new Error(message);
    }
    
    var options = {
      onFail: onFail,
      update: null
    };

    //
    // assert
    //
    
    function fail(message) {
      options.onFail(message);
    }
    
    function assert(guard) {
      if (guard !== true) {
        var args = slice.call(arguments, 1);
        var message = args[0] ? print.apply(null, args) : 'assert(): failed';
        fail(message); 
      }
    }

    //
    // utils
    //
    
    var slice = Array.prototype.slice;
    
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
            assert(!x.hasOwnProperty(k), 'cannot overwrite property %s', k);
          }
          x[k] = y[k];
        }
      }
      return x;
    }
    
    function getName(type) { 
      return type.meta && type.meta.name ? type.meta.name : type.name || '?';
    }
    
    function print() {
      var args = slice.call(arguments);
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
    
    function coerce(type, values, mut) {
      return type.meta.ctor ?
          /*jshint newcap: false*/
          new type(values, mut) :
          type(values, mut);
    }
    
    function update() {
      assert(Func.is(options.update), 'options.update is missing');
      /*jshint validthis:true*/
      var Type = this;
      var args = slice.call(arguments);
      var values = options.update.apply(Type, args);
      return coerce(Type, values);
    }

    //
    // Any - because sometimes you really gonna need it
    //
    
    function Any(values) {
      assert(!(this instanceof Any), 'cannot use new with Any');
      return values;
    }
    
    Any.meta = {
      kind: 'any',
      name: 'Any',
      ctor: false
    };
    
    Any.is = function () { return true; };

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
    
      Struct.update = update;
    
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

    //
    // maybe
    //
    
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
        ctor: false // cannot use new with null
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
    
      Tuple.update = update;
    
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
        assert(predicate(x), 'bad %s', name);
        return x;
      }
    
      Subtype.meta = {
        kind: 'subtype',
        type: Type,
        predicate: predicate,
        name: name,
        ctor: Type.meta.ctor
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
    
    
      List.update = update;
    
      return List;
    }

    //
    // func (experimental)
    //
    
    function func(Arguments, f, Return, name) {
        
      function g() {
        var args = slice.call(arguments);
        if (args.length < f.length) args.length = f.length; // handle optional arguments
    
        args = Arguments.is(args) ? args : coerce(Arguments, args);
    
        var r = f.apply(null, args);
    
        if (Return) {
          r = Return.is(r) ? r : coerce(Return, r);
        }
    
        return r;
      }
    
      g.is = function (x) { return x === g; };
    
      g.meta = {
        kind: 'func',
        Arguments: Arguments,
        f: f,
        Return: Return,
        name: name
      };
    
      return g;
    }

    return {

        options: options,

        assert: assert,
        freeze: freeze,
        mixin: mixin,
        print: print,
        getName: getName,
        
        Any: Any,
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