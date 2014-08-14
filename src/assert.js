//
// assert
//

function assert(guard) {
  if (guard !== true) {
    var args = Array.prototype.slice.call(arguments, 1);
    var message = args[0] ? print.apply(null, args) : 'assert(): failed';
    assert.onFail(message); 
  }
}

assert.failed = false;

assert.onFail = function (message) {
  // start debugger only once
  if (!assert.failed) {
    /*jshint debug: true*/
    debugger; 
  }
  assert.failed = true;
  throw new Error(message);
};
