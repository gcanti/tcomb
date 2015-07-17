[![build status](https://img.shields.io/travis/gcanti/tcomb/master.svg?style=flat-square)](https://travis-ci.org/gcanti/tcomb)
[![dependency status](https://img.shields.io/david/gcanti/tcomb.svg?style=flat-square)](https://david-dm.org/gcanti/tcomb)
![npm downloads](https://img.shields.io/npm/dm/tcomb.svg)

tcomb is a library for Node.js and the browser which allows you to **check the types** of JavaScript values at runtime with a simple and concise syntax. It's great for **Domain Driven Design** and for adding safety to your internal code.

# Features

## Lightweight

3.35KB gzipped.

## Domain Driven Design

Write complex domain models in a breeze and with a small code footprint. tcomb supports:

* user defined types
* structs
* lists
* enums
* subtypes
* unions
* the option type
* tuples
* dictionaries
* functions

## Based on set theory

- [JavaScript, Types and Sets - Part I](https://gcanti.github.io/2014/09/29/javascript-types-and-sets.html)
- [JavaScript, Types and Sets - Part II](https://gcanti.github.io/2014/10/07/javascript-types-and-sets-part-II.html)

## Immutability

Instances are immutables by default using `Object.freeze`. This means you can use all the standard javascript objects and arrays. You don't have to change how you normally code.

## Speed

`Object.freeze` and the asserts are executed only during development and stripped out in production (`process.env.NODE_ENV = 'production'`).

## Debugging with Chrome DevTools

You can customize the behaviour when an assert fails leveraging the power of Chrome DevTools.

## Runtime type introspection

Every model written with tcomb is inspectable at runtime. You can reuse the informations stored in your types. See:

- [tcomb-validation](https://github.com/gcanti/tcomb-validation)
- [tcomb-form](https://github.com/gcanti/tcomb-form)
- [JSON API Validation In Node.js](https://gcanti.github.io/2014/09/15/json-api-validation-in-node.html)

## Easy JSON serialization / deseralization

Encodes / decodes your domain models to / from JSON for free. See:

- [JSON Deserialization Into An Object Model](https://gcanti.github.io/2014/09/12/json-deserialization-into-an-object-model.html)

# Quick example

```js
import t from 'tcomb';

// a user defined type
const Integer = t.subtype(t.Number, (n) => n % 1 === 0);

// a struct
const Person = t.struct({
  name: t.String,              // required string
  surname: t.maybe(t.String),  // optional string
  age: Integer,                // required integer
  tags: t.list(t.String)       // a list of strings
});

// methods are defined as usual
Person.prototype.getFullName = function () {
  return `${this.name} ${this.surname}`;
};

// an instance of Person (the keyword new is optional)
const person = new Person({
  name: 'Giulio',
  surname: 'Canti',
  age: 41,
  tags: ['js developer', 'rock climber']
});
```

# Docs

[GUIDE.md](GUIDE.md)

# Contributors

- [Giulio Canti](https://github.com/gcanti) mantainer
- [Becky Conning](https://github.com/beckyconning) `func` combinator ideas and documentation.

# License

The MIT License (MIT)
