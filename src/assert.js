/**
    ### assert(guard, [message], [values...]);

    If `guard !== true` the debugger kicks in.

    - `guard` boolean condition
    - `message` optional string useful for debugging, formatted with values like [util.format in Node](http://nodejs.org/api/util.html#util_util_format_format)

    Example

    ```javascript
    assert(1 === 2); // throws 'assert(): failed'
    assert(1 === 2, 'error!'); // throws 'error!'
    assert(1 === 2, 'error: %s !== %s', 1, 2); // throws 'error: 1 !== 2'
    ```

    To customize failure behaviour, see `options.onFail`.
**/

function fail(message) {
  options.onFail(message);
}

function assert(guard) {
  if (guard !== true) {
    var args = slice.call(arguments, 1);
    var message = args[0] ? format.apply(null, args) : 'assert failed';
    fail(message); 
  }
}

