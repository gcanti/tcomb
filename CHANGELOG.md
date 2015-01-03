# v0.4.0

**BREAKING**

- `t.irreducible` instead of `t.irriducible`, fix #77
- Prevent illegal type definitions and make easy type analysis, fix #78
- change default name for unnamed types, fix #79

# v0.3.6

- tuple, list and dicts don't freeze values if they are irriducibles, fix #76

# v0.3.5

- Add $merge command, fix #74

# v0.3.4

- Struct.extend(): prototypal inheritance added

# v0.3.3

- add `displayName` to combinators, fix #69

# v0.3.2

- removed `util.merge`
- $set and null value, fix #65

# v0.3.1

- Make `Struct.extend` accept array of extensions

# v0.3.0

- added `Struct.extend(props, [name])`, fix #55
- added built-in immutable updates, fix #31

**BREAKING**

- change `dict(B)` combinator to `dict(A, B)` where A is the set of keys, fix #54
- removed `util.isKind`
- removed `util.isType`, use `Type.is` instead
- refactoring of `func`. Now is a proper type combinator. fix #42
- removed `options.update`

# v0.2.1

- `func` doesn't preserve `this`, fix #38
- added and exported `Type` type
- better error messages and DEBUG HINTS
- optimized `mixin(x, y)` when y is Nil
- added `util.merge(objects...)`, fix #39

**DEPRECATED**

- `isKind` function is now deprecated

# v0.2.0

- add `isKind, getKind` functions, fix #29
- add to `struct` an assert on `props` argument, fix #30
- add sweet.js macros for all combinators, fix #32
- add a `defaultDispatch` function to `union` combinator, fix #33
- add overloading to `func`, fix #35

**BREAKING**

- now the kind of Any and all primitives is 'irriducible' fix #34
- uniform `Any` and primitives, export `irriducible` function, fix #34
- group all util functions in a `util` namespace, fix #36

# v0.1.0

- added `Dict(A)` combinator, for dictionaries, fix #21

# v0.0.12

- more verbose error messages, fix #25
- list#is() depends on `this`, fix #27
- tuple#is() depends on `this`, fix #28

**BREAKING**

- `enums.of()` should generate values equals to keys, fix #23

# v0.0.11

- forbid the use of `new` for all types but structs, fix #8
- make maybe combinator idempotent, fix #9
- make maybe(T) really idempotent
- make list(T) really idempotent, fix #11
- make struct(T) really idempotent, fix #12
- make tuple(Ts) really idempotent, fix #13
- make union(Ts) really idempotent, fix #14
- export fail(), fix #15
- more tests on Dat primitive type, fix #18
- create constants for string messages, fix #16
- more tests on Re primitive type, fix #17
- make func() idempotent, fix #19
- relaxed `Obj.is()` to accept more object types
- turn off jshint newcap
- remove `freeze()` function

**BREAKING**

- forbid the use of `new` for all types but structs, for which is optional, fix #7

# v0.0.10

- add `Dat` primitive type, fix #4
- add `Re` primitive type, fix #3
- reach 100% test coverage
- jshint says: No problems
- add `options` to configuring tcomb fix #5 :
- decouple onFail implementation from assert(), fix #6
- add `Any` type, fix #2
- fix #1

**BREAKING**

- removed `assert.onFail`, now override `options.onFail`
- removed all update methods, now define `options.update`
- rename `print` to `format`, implement like `util.format` in Node, fix #7

Releases
========

# v0.0.9

- grunt build system
- split source files
- 70% test coverage
