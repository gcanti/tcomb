/*! @preserve
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2014-2015 Giulio Canti
 *
 */

// core
var t = require('./lib/assert');

// types (the short alias are deprecated)
t.Any = require('./lib/Any');
t.Nil = require('./lib/Nil');
t.String = t.Str = require('./lib/String');
t.Number = t.Num = require('./lib/Number');
t.Boolean = t.Bool = require('./lib/Boolean');
t.Array = t.Arr = require('./lib/Array');
t.Object = t.Obj = require('./lib/Object');
t.Function = t.Func = require('./lib/Function');
t.Error = t.Err = require('./lib/Error');
t.RegExp = t.Re = require('./lib/RegExp');
t.Date = t.Dat = require('./lib/Date');

// combinators
t.dict = require('./lib/dict');
t.declare = require('./lib/declare');
t.enums = require('./lib/enums');
t.func = require('./lib/func');
t.intersection = require('./lib/intersection');
t.irreducible = require('./lib/irreducible');
t.list = require('./lib/list');
t.maybe = require('./lib/maybe');
t.refinement = require('./lib/refinement');
t.subtype = require('./lib/refinement');
t.struct = require('./lib/struct');
t.tuple = require('./lib/tuple');
t.union = require('./lib/union');

// functions
t.assert = t;
t.mixin = require('./lib/mixin');
t.update = require('./lib/update');
t.isType = require('./lib/isType');
t.is = require('./lib/is');
t.getTypeName = require('./lib/getTypeName');
t.match = require('./lib/match');

module.exports = t;
