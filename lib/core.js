var t = require('./assert');

// types
t.Any = require('./Any');
t.Array = require('./Array');
t.Boolean = require('./Boolean');
t.Date = require('./Date');
t.Error = require('./Error');
t.Function = require('./Function');
t.Nil = require('./Nil');
t.Number = require('./Number');
t.Object = require('./Object');
t.RegExp = require('./RegExp');
t.String = require('./String');

// combinators
t.dict = require('./dict');
t.declare = require('./declare');
t.enums = require('./enums');
t.irreducible = require('./irreducible');
t.list = require('./list');
t.maybe = require('./maybe');
t.refinement = require('./refinement');
t.struct = require('./struct');
t.tuple = require('./tuple');
t.union = require('./union');

// functions
t.assert = t;
t.update = require('./update');

module.exports = t;
