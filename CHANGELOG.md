# Changelog

> **Tags:**
> - [New Feature]
> - [Bug Fix]
> - [Breaking Change]
> - [Documentation]
> - [Internal]
> - [Polish]
> - [Experimental]

**Note**: Gaps between patch versions are faulty/broken releases.
**Note**: A feature tagged as Experimental is in a high state of flux, you're at risk of it changing without notice.

## v2.2.0

- **New Feature**
  - added `intersection` combinator fix #111

    **Example**

    ```js
    const Min = t.subtype(t.String, function (s) { return s.length > 2; }, 'Min');
    const Max = t.subtype(t.String, function (s) { return s.length < 5; }, 'Max');
    const MinMax = t.intersection([Min, Max], 'MinMax');

    MinMax.is('abc'); // => true
    MinMax.is('a'); // => false
    MinMax.is('abcde'); // => false
    ```

- **Internal**
  - optimised the generation of default names for types

## v2.1.0

- **New Feature**
  - added aliases for pre-defined irreducible types fix #112
  - added overridable `stringify` function to handle error messages and improve performances in development (replaces the experimental `options.verbose`)

## v2.0.1

- **Experimental**
  - added `options.verbose` (default `true`) to handle messages (set `options.verbose = false` to improve performances in development)

## v2.0.0

- **New Feature**
  - add support to types defined as ES6 classes #99
  - optimized for production code: asserts and freeze only in development mode
  - add `is(x, type)` function
  - add `isType(x)` function
  - add `stringify(x)` function
- **Breaking change**
  - numeric types on enums #93  (thanks @m0x72)
  - remove asserts when process.env.NODE_ENV === 'production' #100
  - do not freeze if process.env.NODE_ENV === 'production' #103
  - func without currying #96 (thanks @tmcw)
  - remove useless exports #104
  - drop bower support #101
  - remove useless exports
    * Type
    * slice
    * shallowCopy
    * getFunctionName
