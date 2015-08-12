[![build status](https://img.shields.io/travis/gcanti/tcomb/master.svg?style=flat-square)](https://travis-ci.org/gcanti/tcomb)
[![dependency status](https://img.shields.io/david/gcanti/tcomb.svg?style=flat-square)](https://david-dm.org/gcanti/tcomb)
![npm downloads](https://img.shields.io/npm/dm/tcomb.svg)
[![Join the chat at https://gitter.im/gcanti/tcomb](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/gcanti/tcomb?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

tcomb is a library for Node.js and the browser which allows you to **check the types** of JavaScript values at runtime with a simple and concise syntax. It's great for **Domain Driven Design** and for adding safety to your internal code.

> "Si vis pacem, para bellum" - (Vegetius 5th century)

# Code example

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

# Features

## Lightweight

3KB gzipped.

## Domain Driven Design

Write complex domain models in a breeze and with a small code footprint. Supported types:

* user defined types
* structs
* lists
* enums
* subtypes
* unions
* intersections
* the option type
* tuples
* dictionaries
* functions

## Based on set theory

Blog posts:

- [JavaScript, Types and Sets - Part I](https://gcanti.github.io/2014/09/29/javascript-types-and-sets.html)
- [JavaScript, Types and Sets - Part II](https://gcanti.github.io/2014/10/07/javascript-types-and-sets-part-II.html)

## Type safety

All models are type checked:

```js
const person = new Person({
  name: 'Giulio',
  // missing required field "age"
  tags: ['js developer', 'rock climber']
});
```

Output to console:

```js
[tcomb] Invalid argument value = undefined supplied to irreducible type Number
```

See "Debugging with Chrome DevTools" section for details.

## Immutability and immutability helpers

Instances are immutables using `Object.freeze`. This means you can use standard JavaScript objects and arrays. You don't have to change how you normally code. You can update an immutable instance with the provided `update(instance, spec)` function:

```js
const person2 = Person.update(person, {
  name: {$set: 'Guido'}
});
```

where `spec` is an object contaning *commands*. The following commands are compatible with the [Facebook Immutability Helpers](http://facebook.github.io/react/docs/update.html):

* `$push`
* `$unshift`
* `$splice`
* `$set`
* `$apply`
* `$merge`

See [Updating immutable instances](GUIDE.md#updating-immutable-instances) in the docs for details.

## Speed

`Object.freeze` calls and asserts are executed only in development and stripped out in production (using `process.env.NODE_ENV = 'production'` tests).

## Debugging with Chrome DevTools

You can customize the behavior when an assert fails leveraging the power of Chrome DevTools.

```js
// use the default...
t.fail = function fail(message) {
  throw new TypeError('[tcomb] ' + message); // set "Pause on exceptions" on the "Sources" panel
};

// .. or define your own behavior
t.fail = function fail(message) {
  debugger; // starts the Chrome DevTools debugger
  throw new TypeError(message);
};
```

## Runtime type introspection

All models are inspectable at runtime. You can read and reuse the informations stored in your types (in a `meta` static property). See [The meta object](GUIDE.md#the-meta-object) in the docs for details.

Libraries exploiting tcomb's RTI:

- [tcomb-validation](https://github.com/gcanti/tcomb-validation)
- [tcomb-form](https://github.com/gcanti/tcomb-form)
- Blog post: [JSON API Validation In Node.js](https://gcanti.github.io/2014/09/15/json-api-validation-in-node.html)

## Easy JSON serialization / deseralization

Encodes / decodes your domain models to / from JSON for free.
- Blog post: [JSON Deserialization Into An Object Model](https://gcanti.github.io/2014/09/12/json-deserialization-into-an-object-model.html)

# Docs

[GUIDE.md](GUIDE.md)

# Contributors

- [Giulio Canti](https://github.com/gcanti) mantainer
- [Becky Conning](https://github.com/beckyconning) `func` combinator ideas and documentation.

# License

The MIT License (MIT)
