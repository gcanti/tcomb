# A little guide to runtime type checking and runtime type introspection (WIP)

Comments and suggestions are welcome, please open an issue [here](https://github.com/gcanti/tcomb) or send a Pull Request.

The examples of this guide use [tcomb](https://github.com/gcanti/tcomb), a library for Node.js and the browser which allows you to check the types of JavaScript values at runtime with a simple and concise syntax. It's great for Domain Driven Design and for adding safety to your internal code.

# Get started: basic type checking

Let's start with a simple task, adding runtime type checking to the following function:

```js
// a, b should be numbers
function sum(a, b) {
  return a + b;
}
```

An easy way to achieve this goal is to add *asserts* (also called *invariants*) to the function.

## The `assert` function

**Signature**

```js
(guard: boolean, message?: string | () => string) => void
```

The `assert` function is the main building block of `tcomb`.

**Example**

```js
import t from 'tcomb';

function sum(a, b) {
  t.assert(typeof a === 'number', 'argument a is not a number');
  t.assert(typeof b === 'number', 'argument b is not a number');
  return a + b;
}
```

**Note**. The assert fails if `guard !== true`.

When an assert fails, the default behavior is throwing a `TypeError`.

```js
sum(1, 's'); // => throws TypeError
```

![](images/type-error.png)

**Tip**. If you are using the Chrome DevTools, set "Pause on exceptions" on the "Sources" panel in order to leverage the power of the debugger (Watch, Call Stack, Scope, Breakpoints, etc...)

![](images/chrome-dev-tools-fail.png)

Clicking the "sum" item in the Call Stack shows the offending line of code:

![](images/chrome-dev-tools-sum.png)

Note that `message` can also be a function so you can define *lazy error messages* (i.e. the function contained in `message` is called only when the assert fails). As a benefit you can get detailed messages without too much overhead (`JSON.stringify` is expensive):

```js
import t from 'tcomb';

function sum(a, b) {
  t.assert(typeof a === 'number', () => `invalid value ${JSON.stringify(a)} supplied to argument a, expected a number`);
  t.assert(typeof b === 'number', () => `invalid value ${JSON.stringify(b)} supplied to argument b, expected a number`);
  return a + b;
}

sum(1, {x: 1}); // throws '[tcomb] invalid value {"x":1} supplied to argument b, expected a number'
```

You can customise the failure behavior overriding the exported `fail` function:

**Signature**

```js
(message: string) => void
```

**Example**

```js
t.fail = function (message) {
  console.error(message);
};

sum(1, 's'); // => outputs to console 'invalid value "s" supplied to argument b, expected a number'
```

## Optimise production builds

> If a tree falls in a forest and no one is around to hear it, does it make a sound?

Asserts are very useful in development but you may want to strip them out in production. Just wrap the asserts in conditional blocks checking the `process.env.NODE_ENV` global variable:

```js
function sum(a, b) {
  if (process.env.NODE_ENV !== 'production') {
    // this code exists and then executes only in development
    t.assert(typeof a === 'number', 'argument a is not a number');
    t.assert(typeof b === 'number', 'argument b is not a number');
  }
  return a + b;
}
```

then use modules like `envify` (for `browserify`) or `webpack.DefinePlugin` (for `webpack`) in your production build.

**TODO**. Example configuration for browserify and webpack.

## Reducing the boilerplate

Writing asserts can be cumbersome, let's see if we can write less. Every type defined with `tcomb`, included the built-in type `t.Number` (the type of all numbers), owns a static predicate `is(x: any) => boolean` useful for type checking:

```js
import t from 'tcomb';

function sum(a, b) {
  t.assert(t.Number.is(a), 'argument a is not a number');
  t.assert(t.Number.is(b), 'argument b is not a number');
  return a + b;
}
```

Still too verbose. Luckily every `tcomb`'s type is a *glorified identity function*, that is it returns the value passed in if is good and throws (but only in development!) otherwise:

```js
function sum(a, b) {
  t.Number(a); // throws if a is not a number
  t.Number(b); // throws if b is not a number
  return a + b;
}

sum(1, 's'); // => throws '[tcomb] Invalid value "s" supplied to Number'
```

The following built-in types are exported by `tcomb`:

- `t.String`: strings
- `t.Number`: numbers
- `t.Boolean`: booleans
- `t.Array`: arrays
- `t.Object`: plain objects
- `t.Function`: functions
- `t.Error`: errors
- `t.RegExp`: regular expressions
- `t.Date`: dates

There are 2 additional built-in types:

- `t.Nil`: `null` or `undefined`
- `t.Any`: any value (useful when you need a temporary placeholder or an escape hatch...)

## The `func` combinator

Another way to type-check the `sum` function is to use the `func` combinator:

**Signature**

```js
(domain: Array<TcombType>, codomain: TcombType, name?: string) => TcombType
```

**Example**

```js
const SumType = t.func([t.Number, t.Number], t.Number);

// of() returns a type-checked version of its argument
const sum = SumType.of((a, b) => a + b);

sum(1, 's'); // => throws '[tcomb] Invalid value "s" supplied to [Number, Number]/1: Number'
```

## Error message format

The string `'Invalid value "s" supplied to [Number, Number]/1: Number'` is an example of the concise format used by `tcomb` in order to point to the offended type. You can read it like this:

> The value of the second element of the tuple [Number, Number] is "s" but a Number was expected

The general format of an error message is:

```js
'Invalid value <value> supplied to <context>'
```

where `<context>` is a slash-separated string with the following properties:

- the first element is the name of the *root* type
- the following elements have the format: `<field name>: <field type>` (arrays are 0-based)

## The babel plugin

If you are using babel, there is another option (the one I personally use the most): adding type annotations and use the [babel-plugin-tcomb](https://github.com/gcanti/babel-plugin-tcomb) plugin.

**Example**

```js
function sum(a: t.Number, b: t.Number) {
  return a + b;
}

sum(1, 's'); // => throws '[tcomb] Invalid value "s" supplied to Number'
```

# User defined types, the `irreducible` combinator

`tcomb` exports the most common types but you can define your own. Say you want to add support for `Map`s, you can use the `irreducible` combinator:

**Signature**

```js
(name: string, predicate: (x: any) => boolean) => TcombType
```

**Example**

```js
const MapType = t.irreducible('MapType', (x) => x instanceof Map);

function size(map) {
  MapType(map);
  return map.size;
}

console.log(size(new Map())); // => 0
console.log(size({})); // throws '[tcomb] Invalid value {} supplied to MapType'
```

**Note**. The built-in types (`t.String`, `t.Number`, etc...) are defined with the `irreducible` combinator.

