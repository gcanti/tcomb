[![build status](https://img.shields.io/travis/gcanti/tcomb/master.svg?style=flat-square)](https://travis-ci.org/gcanti/tcomb)
[![dependency status](https://img.shields.io/david/gcanti/tcomb.svg?style=flat-square)](https://david-dm.org/gcanti/tcomb)

tcomb is a library for Node.js and the browser which allows you to **check the types** of JavaScript values at runtime with a simple syntax. It's great for **Domain Driven Design** and for adding safety to your internal code.

# Features

- **immutability**: instances are immutables in development mode
- **speed**: asserts are active only in development mode and stripped in production code.
- **DDD**: write complex domain models in a breeze and with a small code footprint
- **debugging**: you can customize the behaviour when an assert fails leveraging the power of Chrome DevTools
- **runtime type introspection**: every model written with tcomb is inspectable at runtime
- **JSON**: encodes/decodes domain models to/from JSON for free

# Documentation

[GUIDE.md](GUIDE.md)

# Contributors

- [Giulio Canti](https://github.com/gcanti) mantainer
- [Becky Conning](https://github.com/beckyconning) `func` combinator ideas and documentation.

# License

The MIT License (MIT)
