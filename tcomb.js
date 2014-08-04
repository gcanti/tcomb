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

    // --------------------------------------------------------------
    // Utils
    // --------------------------------------------------------------

    /* fa partire il debugger prima di lanciare un errore il debugger parte una 
    volta sola perchè tipicamente dopo un fallimento ce ne possono essere 
    molti altri e diventerebbe una noia */
    var failed = false;
    
    function fail(message) {
        if (!failed) { 
            debugger; 
        }
        failed = true;
        throw new Error(message);
    }

    /* se l'assert fallisce chiama fail(message) */
    function assert(guard, message) {
        if (guard !== true) { 
            fail(message || 'assert failed'); 
        }
    }

    /* rende immutabili le proprietà dirette di un oggetto o un array 
    a meno che unless sia = true */
    function freeze(obj_or_arr, unless) {
        if (unless !== true) {
            Object.freeze(obj_or_arr);
        }
        return obj_or_arr;
    }

    /* copia i campi di y in x. Se overwrite è falsy non è possibile 
    sovrascrivere dei campi già presenti in x in modo da evitare 
    fastidiosi bug */
    function mixin(x, y, overwrite) {
        for (var k in y) {
            if (y.hasOwnProperty(k)) {
                if (!overwrite) {
                    assert(!x.hasOwnProperty(k), 'mixin(): cannot overwrite property ' + k);
                }
                x[k] = y[k];
            }
        }
        return x;
    }

    // --------------------------------------------------------------
    // Manipolazione degli array
    // --------------------------------------------------------------

    function is_valid_index(index, from, to) {
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
        assert(is_valid_index(index, 0, arr.length - 1), 'update(): bad index');
        var ret = arr.slice();
        ret[index] = element;
        return ret;
    }

    function remove(arr, index) {
        assert(Arr.is(arr), 'remove(): bad array');
        assert(is_valid_index(index, 0, arr.length - 1), 'remove(): bad index');
        var ret = arr.slice();
        ret.splice(index, 1);
        return ret;
    }

    function move(arr, from, to) {
        assert(Arr.is(arr), 'move(): bad array');
        assert(is_valid_index(from, 0, arr.length - 1), 'move(): bad from');
        assert(is_valid_index(to, 0, arr.length - 1), 'move(): bad to');
        var ret = arr.slice();
        if (from === to) {
            return ret;
        }
        var element = ret.splice(from, 1)[0];
        ret.splice(to, 0, element);
        return ret;
    }

    // --------------------------------------------------------------
    // primitive
    // --------------------------------------------------------------

    function primitive(name, is) {

        /* ignora l'argomento mut perchè i tipi primitivi di JavaScript sono sempre immutabili */
        function Primitive(values) {
            assert(Primitive.is(values), 'bad ' + name);
            return values;
        }

        Primitive.meta = {
            kind: 'primitive',
            name: name
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

    // --------------------------------------------------------------
    // struct
    // --------------------------------------------------------------

    function struct(props, name) {

        function Struct(values, mut) {

            assert(Obj.is(values), 'bad ' + (name || 'struct'));
            assert(maybe(Bool).is(mut), 'bad mut');

            for (var prop in props) {
                if (props.hasOwnProperty(prop)) {
                    var Type = props[prop],
                        value = values[prop];
                    this[prop] = Type.is(value) ? value : new Type(value, mut);
                }
            }

            freeze(this, mut);
        }

        Struct.meta = {
            kind: 'struct',
            props: props,
            name: name
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
                    v[prop] = updates.hasOwnProperty(prop) ? updates[prop]
                            : instance[prop];
                }
            }
            return new Struct(v, mut);
        };

        return Struct;
    }

    // --------------------------------------------------------------
    // union
    // --------------------------------------------------------------

    function union(types, name) {

        function Union(values, mut) {
            var Type = Union.dispatch(values);
            return new Type(values, mut);
        }

        Union.meta = {
            kind: 'union',
            types: types,
            name: name
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

        function Maybe(values, mut) {
            return Nil.is(values) ? null : new Type(values, mut);
        }

        Maybe.meta = {
            kind: 'maybe',
            type: Type,
            name: name
        };

        Maybe.is = function (x) {
            return Nil.is(x) || Type.is(x);
        };

        return Maybe;
    }

    // --------------------------------------------------------------
    // enums
    // --------------------------------------------------------------


    function enums(map, name) {

        /* ignora l'argomento mut perchè gli enum sono stringhe JavaScript e quindi sempre immutabili */
        function Enums(x) {
            assert(Enums.is(x), 'bad ' + (name || 'enum'));
            return x;
        }

        Enums.meta = {
            kind: 'enums',
            map: map,
            name: name
        };

        Enums.is = function (x) {
            return Str.is(x) && map.hasOwnProperty(x);
        };

        return Enums;
    }

    // --------------------------------------------------------------
    // tuple
    // --------------------------------------------------------------

    function tuple(types, name) {

        var len = types.length;

        function Tuple(values, mut) {

            assert(Arr.is(values), 'bad ' + (name || 'tuple'));

            var arr = [];
            for (var i = 0 ; i < len ; i++) {
                var Type = types[i];
                var value = values[i];
                arr.push(Type.is(value) ? value : new Type(value, mut));
            }

            return freeze(arr, mut);
        }

        Tuple.meta = {
            kind: 'tuple',
            types: types,
            name: name
        };

        Tuple.is = function (x) {
            return Arr.is(x) && x.length === len && 
                types.every(function (type, i) { 
                    return type.is(x[i]); 
                });
        };

        Tuple.update = function (instance, index, element, mut) {
            var Type = types[index],
                value = Type.is(element) ? element : new Type(element, mut),
                arr = update(instance, index, value);
            return freeze(arr, mut);
        };

        return Tuple;
    }

    // --------------------------------------------------------------
    // subtype
    // --------------------------------------------------------------

    function subtype(Type, predicate, name) {

        function Subtype(values, mut) {
            var x = new Type(values, mut);
            assert(predicate(x), 'bad ' + (name || 'subtype'));
            return x;
        }

        Subtype.meta = {
            kind: 'subtype',
            type: Type,
            predicate: predicate,
            name: name
        };

        Subtype.is = function (x) {
            return Type.is(x) && predicate(x);
        };

        return Subtype;
    }

    // --------------------------------------------------------------
    // list
    // --------------------------------------------------------------

    function list(Type, name) {

        function List(values, mut) {

            assert(Arr.is(values), 'bad ' + (name || 'list'));

            var arr = [];
            for (var i = 0, len = values.length ; i < len ; i++ ) {
                var value = values[i];
                arr.push(Type.is(value) ? value : new Type(value, mut));
            }

            return freeze(arr, mut);
        }

        List.meta = {
            kind: 'list',
            type: Type,
            name: name
        };

        List.is = function (x) {
            return Arr.is(x) && x.every(Type.is);
        };

        List.append = function (instance, element, mut) {
            var value = Type.is(element) ? element : new Type(element, mut),
                arr = append(instance, value);
            return freeze(arr, mut);
        };

        List.prepend = function (instance, element, mut) {
            var value = Type.is(element) ? element : new Type(element, mut),
                arr = prepend(instance, value);
            return freeze(arr, mut);
        };

        List.update = function (instance, index, element, mut) {
            var value = Type.is(element) ? element : new Type(element, mut),
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

    return {
        fail: fail,
        assert: assert,
        freeze: freeze,
        mixin: mixin,
        append: append,
        prepend: prepend,
        update: update,
        remove: remove,
        move: move,
        
        Nil: Nil,
        Str: Str,
        Num: Num,
        Bool: Bool,
        Arr: Arr,
        Obj: Obj,
        Func: Func,
        Err: Err,

        primitive: primitive,        
        struct: struct,
        enums: enums,
        union: union,
        maybe: maybe,
        tuple: tuple,
        subtype: subtype,
        list: list
    };
}));
