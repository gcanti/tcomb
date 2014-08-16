Roadmap
=======

# v0.0.10

- TODO add `Date` primitive type, fix #4
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
