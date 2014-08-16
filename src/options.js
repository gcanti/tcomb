/**
    ### options

    #### function `options.onFail`

    In production envs you don't want to leak failures to the user

    ```javascript
    // override onFail hook
    options.onFail = function (message) {
        try {
            // capture stack trace
            throw new Error(message);
        } catch (e) {
            // use you favourite JavaScript error logging service
            console.log(e.stack);
        }
    };
    ```

    #### function `options.update`

    TODO: better docs

    Add to structs, tuples and lists a static method `update` that returns a new instance
    without modifying the original.

    Example

    ```javascript
    // see http://facebook.github.io/react/docs/update.html
    options.update = React.addons.update;
    var p1  = new Point({x: 0, y: 0});
    var p2 = Point.update(p1, {x: {$set: 1}}); // => Point({x: 1, y: 0})
    ```
**/

var failed = false;

function onFail(message) {
  // start debugger only once
  if (!failed) {
    /*jshint debug: true*/
    debugger; 
  }
  failed = true;
  throw new Error(message);
}

var options = {
  onFail: onFail,
  update: null
};