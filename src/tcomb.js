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

    //= options.js

    //= assert.js

    //= utils.js

    //= any.js

    //= primitive.js

    //= struct.js

    //= union.js

    //= maybe.js

    //= enums.js

    //= tuple.js

    //= subtype.js

    //= list.js

    //= func.js

    return {

        options: options,

        assert: assert,
        freeze: freeze,
        mixin: mixin,
        format: format,
        coerce: coerce,
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
        Re: Re,
        Dat: Dat,

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
