Roadmap
=======

# v.0.0.11

- forbid the use of `new` for all types but structs, fix #8
- make maybe combinator idempotent, fix #9
- make maybe(T) really idempotent
- TODO make list(T) really idempotent, fix #11
- TODO make struct(T) really idempotent, fix #12
- TODO make tuple(Ts) really idempotent, fix #13
- TODO make union(Ts) really idempotent, fix #14
- export fail(), fix #15
- TODO create constants for string messages, fix #16
- TODO more tests on Dat primitive type, fix #18
- TODO more tests on Re primitive type, fix #17
- TODO make func() idempotent, fix #19
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
