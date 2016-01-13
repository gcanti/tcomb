/*! @preserve
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2014-2015 Giulio Canti
 *
 */

// core
var t = require('./lib/core');

// the short alias are deprecated
t.Arr = t.Array;
t.Bool = t.Boolean;
t.Dat = t.Date;
t.Err = t.Error;
t.Func = t.Function;
t.Num = t.Number;
t.Obj = t.Object;
t.Re = t.RegExp;
t.Str = t.String;

// combinators
t.func = require('./lib/func');
t.intersection = require('./lib/intersection');
t.subtype = t.refinement;

// functions
t.mixin = require('./lib/mixin');
t.isType = require('./lib/isType');
t.is = require('./lib/is');
t.getTypeName = require('./lib/getTypeName');
t.match = require('./lib/match');

module.exports = t;
