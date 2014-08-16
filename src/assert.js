//
// assert
//

function fail(message) {
  options.onFail(message);
}

function assert(guard) {
  if (guard !== true) {
    var args = slice.call(arguments, 1);
    var message = args[0] ? format.apply(null, args) : 'assert(): failed';
    fail(message); 
  }
}

