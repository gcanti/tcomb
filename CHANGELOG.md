# Changelog

> **Tags:**
> - [New Feature]
> - [Bug Fix]
> - [Breaking Change]
> - [Documentation]
> - [Internal]
> - [Polish]

**Note**: Gaps between patch versions are faulty/broken releases.

## v1.1.0

- **New Feature**
  + (backport from v2.1) added alias for basic types and changed built-in irreducible names accordingly:

    - `String` for `Str`
    - `Number` for `Num`
    - `Boolean` for `Bool`
    - `Array` for `Arr`
    - `Object` for `Obj`
    - `Function` for `Func`
    - `Error` for `Err`
    - `RegExp` for `Re`
    - `Date` for `Dat`

    This means you can define, for example, a struct with:

    ```js
    var t = require('tcomb');

    var Point = t.struct({
      x: t.Number, // <- new aliases
      y: t.Number
    }, 'Point');
    ```

  + better error messages for assert failures in nested structures.

    The messages have the following general form:

    ```
    Invalid value <value> supplied to <context>
    ```

    where context is a slash-separated array with the following properties:

    - the first element is the name of the "root"
    - the following elements have the form: `<field name>: <field type>`

    **Example**

    ```js
    var Person = t.struct({
      name: t.String
    }, 'Person');

    var User = t.struct({
      email: t.String,
      profile: Person
    }, 'User');

    var mynumber = t.Number('a');
    // => invalid value "a" supplied to Num

    var myuser = User({ email: 1 });
    // => Invalid value 1 supplied to User/email: Str

    myuser = User({ email: 'email', profile: { name: 2 } });
    // => Invalid value 2 supplied to User/profile: Person/name: Str
    ```

## v1.0.3

- **Internal**
  + fix tcomb lists don't currently play nice with es6 classes due to inability to invoke classes without new #92

## v1.0.2

- **Internal**
  + Remove `debugger` statement #90

## v1.0.1

- **Internal**
  + Add react-native compatibility #89

## v1.0.0

First release
