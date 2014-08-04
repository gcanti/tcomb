# JavaScript types and combinators

# Prerequisiti

    array.forEach()
    array.map()
    array.some()
    array.every()
    Object.freeze()
    Object.keys()

Setup di riferimento

    <!DOCTYPE html>
    <html>
        <head>
            <meta charset="utf-8" />
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>gpr</title>
            <!--[if lt IE 9]>
            <script src="shims/json2.js"></script>
            <script src="shims/es5-shim.min.js"></script>
            <script src="shims/es5-sham.min.js"></script>
            <script src="shims/html5shiv.min.js"></script>
            <![endif]-->
            <script type="text/javascript" src="jquery.js"></script>
            <script type="text/javascript" src="gpr.js"></script>
        </head>
        <body>
            <script type="text/javascript">
            </script>
        </body>
    </html>


# Come sono fatti i tipi?

Una funzione `T` è un tipo se

1. ha firma `T(values, [mut])` ove `values` è l'insieme di valori che occorrono per avere un'istanza di `T` (dipende da `T`) e `mut` indica se l'istanza è mutabile (default `false`)
2. è strutturalmente idempotente: `new T(new T(values)) equals new T(values)`
3. possiede una funzione statica `T.is(x)` che restituisce `true` se `x` è un'istanza di `T`

da 2. deriva che `T` può essere usato come deserializzatore JSON di default

# primitive(name, is)

- Nil
- Str
- Num
- Bool
- Arr
- Obj
- Func

# struct(props, [name])

L'opzione `name` è utile per facilitare il debug.

    var Point = struct({
        x: Num,
        y: Num
    });

    // i metodi vengono definiti normalmente
    Point.prototype.toString = function () {
        return '(' + this.x + ', ' + this.y + ')';
    };

Come istanziare una struct

    'use strict';

    var p = new Point({x: 1, y: 2});
    p.x = 2; // => TypeError, p è immutabile

    p = new Point({x: 1, y: 2}, true);
    p.x = 2; // ok, p ora è mutabile

Alcune meta informazioni

    Point.meta = {
        kind: 'struct',
        props: props,
        name: name
    };

### is(x)

Restituisce `true` se `x` è un'istanza della struct.

    Point.is(p); // => true

### update(instance, updates, [mut])

Restituisce un'istanza con le nuove proprietà senza modificare l'istanza originale.

    Point.update(p, {x: 3}); // => new Point({x: 3, y: 2})

# union(types, [name])

Definisce un'unione di tipi.

    var Circle = struct({
        center: Point,
        radius: Num
    });

    var Rectangle = struct({
        a: Point,
        b: Point
    });

    var Shape = union([
        Circle, 
        Rectangle
    ]);

    // per poter usare Shape come costruttore occorre implementare dispatch()
    Shape.dispatch = function (values) {
        assert(Obj.is(values));
        return values.hasOwnProperty('center') ?
            Circle :
            Rectangle;   
    };

    var shape = new Shape({center: {x: 1, y: 2}, radius: 10});

Alcune meta informazioni

    Shape.meta = {
        kind: 'union',
        types: types,
        name: name
    };

### is(x)

Restituisce `true` se `x` appartiene all'unione.

    Shape.is(new Circle([p, 10])); // => true

# maybe(type, [name])

Analogo ad una `union` con `Nil` e `type`.

    var MaybeStr = maybe(Str);

    MaybeStr.is('a');     // => true
    MaybeStr.is(null);    // => true
    MaybeStr.is(1);       // => false
    
Alcune meta informazioni

    MaybeStr.meta = {
        kind: 'maybe',
        type: type,
        name: name
    };

# enums(map, [name])

Definisce una enumerazione (di stringhe).

    var Direction = enums({
        North: 0, 
        East: 1,
        South: 2, 
        West: 3
    });

Alcune meta informazioni

    Direction.meta = {
        kind: 'enums',
        map: map,
        name: name
    };

### is(x)

Restituisce `true` se `x` appartiene dell'enum.

    Direction.is('North'); // => true

# tuple(types, [name])

Definisce un array di dimensione fissa le cui coordinate hanno i tipi specificati.

    var Args = tuple([Num, Num]);

    var a = new Args([1, 2]);

Alcune meta informazioni

    Args.meta = {
        kind: 'tuple',
        types: types,
        name: name
    };

### is(x)

Restituisce `true` se `x` è una tupla corretta.

    Args.is([1, 2]);      // => true
    Args.is([1, 'a']);    // => false, il secondo elemento non è un Num
    Args.is([1, 2, 3]);   // => false, troppi elementi

### update(instance, index, element, [mut])

Restituisce un'istanza con le nuove proprietà senza modificare l'istanza originale.
    
    Args.update(a, 0, 2);    // => [2, 2]

# subtype(type, predicate, [name])

Definisce un sottotipo di un tipo già definito.

    var Int = subtype(Num, function (n) {
        return n === parseInt(n, 10);
    });

    var Q1Point = subtype(Point, function (p) {
        // punti nel primo quadrante
        return p.x >= 0 && p.y >= 0;
    });

    // uso del costruttore
    var p = new Q1Point({x: -1, y: -2}); // => fail!

Alcune meta informazioni

    Int.meta = {
        kind: 'subtype',
        type: type,
        predicate: predicate,
        name: name
    };

### is(x)

Restituisce `true` se `x` è un'istanza corretta.

    Int.is(2);      // => true
    Int.is(1.1);    // => false

# list(type, [name])

Definisce un array i cui elementi sono del tipo `type`.

    var Path = list(Point);

    // uso del costruttore
    var path = new Path([
        {x: 0, y: 0}, 
        {x: 1, y: 1}
    ]);

Alcune meta informazioni
    
    Path.meta = {
        kind: 'list',
        type: type,
        name: name
    };

### Metodi utili

Restituiscono un'istanza con le nuove proprietà senza modificare l'istanza originale.
    
    Path.append(path, element, [mut]);
    Path.prepend(path, element, [mut]);
    Path.update(path, index, element, [mut]);
    Path.remove(path, index, [mut]);
    Path.move(path, from, to, [mut]);

# Utils

    // fa partire il debugger prima di lanciare un errore
    // il debugger parte una volta sola perchè tipicamente dopo un fallimento 
    // ce ne possono essere molti altri e diventerebbe una noia
    fail(message)

    // se l'assert fallisce chiama fail(message)
    assert(guard, [message])

    // rende immutabili le proprietà dirette di un oggetto o un array 
    // a meno che unless sia = true
    freeze(obj_or_arr, [unless])

    // copia i campi di y in x. Se overwrite è falsy non è possibile
    // sovrascrivere dei campi già presenti in x in modo da evitare
    // fastidiosi bug
    mixin(x, y, [overwrite])

    // manipolazione degli array
    append(arr, element);
    prepend(arr, element);
    update(arr, index, element);
    remove(arr, index);
    move(arr, from, to);

# Esempi d'uso

### Come estendere una struct

    var Point3D = struct(mixin(Point.meta.props, {
        z: Num
    }));

    var p = new Point3D({x: 1, y: 2, z: 3});


### Modifica in profondità di una struct

    var c = new Circle({center: {x: 1, y: 2}, radius: 10});

    // translate x by 1
    var c2 = Circle.update(c, {
        center: Point.update(c.center, {
            x: c.center.x + 1
        })
    });

### JSON Decoder

    // (json, T, mut) -> instance of T
    function decode(json, T, mut) {
        if (T.fromJSON) {
            return T.fromJSON(json, mut);
        }
        switch (T.meta.kind) {
            case 'struct' :
                var values = {};
                var props = T.meta.props;
                for (var prop in props) {
                    if (props.hasOwnProperty(prop)) {
                        values[prop] = decode(json[prop], props[prop], mut);    
                    }
                }
                return new T(values, mut);
            case 'union' :
                assert(Func.is(T.dispatch));
                return decode(json, T.dispatch(json), mut);
            case 'maybe' :
                return Nil.is(json) ? undefined : decode(json, T.meta.type, mut);
            case 'tuple' :
                return freeze(json.map(function (x, i) {
                    return decode(x, T.meta.types[i], mut);
                }, mut));
            case 'subtype' :
                var x = decode(json, T.meta.type, mut); 
                assert(T.meta.predicate(x));
                return x;
            case 'list' :
                return freeze(json.map(function (x) {
                    return decode(x, T.meta.type, mut);
                }), mut);
            default :
                return json;
        }
    };

# Copyright & License

Copyright (C) 2014 Giulio Canti - Released under the MIT License.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.